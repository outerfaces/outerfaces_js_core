/**
 * Window scroll across navigations, as a multi-page site would have it: a page
 * reached by pushState (a link, a redirect) opens at the top; back/forward
 * returns to where that page was left; replaceState (filters, a search kept in
 * the address) leaves the scroll alone. Same-page navigations, where the page
 * takes `routeParamsChanged`, never scroll: the page owns its own scroll.
 *
 * The browser can't restore an SPA's scroll itself (the page is rendered after
 * the history entry changes, often after a fetch), so restoration is manual:
 * each history entry carries a key, the last scroll position seen for each key
 * is kept in memory, and back/forward scrolls there once the page is tall
 * enough to reach it.
 *
 * Off with `window._outerfaces_config.scrollOnNavigation = false`.
 */

const KEY = '_outerfaces_entry';
const RESTORE_TIMEOUT_MS = 2000;

const positions = new Map();
let pending = null;
let lastKey = 0;
let restoring = null;

export function navigationScrollEnabled() {
  const config = window._outerfaces_config;
  return !(config && config.scrollOnNavigation === false);
}

/** Takes over scroll restoration and keys the entry on show. */
export function initializeNavigationScroll(originalReplaceState) {
  if (!navigationScrollEnabled()) {
    return;
  }

  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  originalReplaceState.apply(history, [keyedState(history.state, newEntryKey()), '', window.location.href]);

  window.addEventListener('scroll', () => {
    const key = entryKey(history.state);
    if (key) {
      positions.set(key, window.scrollY);
    }
  }, { passive: true });
}

/** The state for a pushState: the caller's, with a fresh entry key. */
export function stateForPush(state) {
  if (!navigationScrollEnabled()) {
    return state;
  }
  pending = { kind: 'push' };
  return keyedState(state, newEntryKey());
}

/** The state for a replaceState: the caller's, keeping the entry's key. */
export function stateForReplace(state) {
  if (!navigationScrollEnabled()) {
    return state;
  }
  // A redirect replacing the entry a push or back/forward just opened keeps
  // that navigation's scroll.
  pending = pending || { kind: 'replace' };
  return keyedState(state, entryKey(history.state) || newEntryKey());
}

/** Back/forward: remembers where the entry now on show was left. */
export function notePopState(state) {
  if (!navigationScrollEnabled()) {
    return;
  }
  const key = entryKey(state);
  pending = { kind: 'pop', y: key ? positions.get(key) : undefined };
}

/**
 * Called by addPageTemplate once it has mounted a page. `samePage` is true when
 * the mounted page took the change through routeParamsChanged.
 */
export function applyNavigationScroll(samePage) {
  const navigation = pending;
  pending = null;
  if (!navigation || samePage) {
    return;
  }

  cancelRestore();
  if (navigation.kind === 'push') {
    window.scrollTo(0, 0);
  } else if (navigation.kind === 'pop') {
    restoreScroll(navigation.y || 0);
  }
}

// The page renders after it mounts (often after a fetch), so this waits, frame
// by frame, until the document is tall enough, and gives up once the reader
// scrolls themselves or after a while.
function restoreScroll(y) {
  const started = performance.now();
  const stop = () => cancelRestore();
  const events = ['wheel', 'touchstart', 'keydown', 'mousedown'];
  events.forEach((name) => window.addEventListener(name, stop, { passive: true, once: true }));

  const attempt = () => {
    const reachable = document.documentElement.scrollHeight - window.innerHeight;
    if (reachable >= y || performance.now() - started > RESTORE_TIMEOUT_MS) {
      window.scrollTo(0, y);
      cancelRestore();
      return;
    }
    restoring.frame = requestAnimationFrame(attempt);
  };

  restoring = {
    frame: requestAnimationFrame(attempt),
    release: () => events.forEach((name) => window.removeEventListener(name, stop))
  };
}

function cancelRestore() {
  if (restoring) {
    cancelAnimationFrame(restoring.frame);
    restoring.release();
    restoring = null;
  }
}

function newEntryKey() {
  lastKey += 1;
  return `${Date.now().toString(36)}-${lastKey}`;
}

function entryKey(state) {
  return state && typeof state === 'object' ? state[KEY] : undefined;
}

// Only plain-object (or empty) states are keyed; anything else a caller
// pushes passes through untouched and its entry restores to the top.
function keyedState(state, key) {
  if (state === null || state === undefined) {
    return { [KEY]: key };
  }
  if (Object.getPrototypeOf(state) === Object.prototype) {
    return { ...state, [KEY]: key };
  }
  return state;
}
