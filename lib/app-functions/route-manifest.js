import { hydrateRoutes } from './hydrate-routes.js';
import { findMatchingRoute } from './find-matching-route.js';
import { navigateToNotFound } from './navigate-to-not-found.js';

/**
 * Server-sent routes.
 *
 * Instead of shipping every route in a routes module, the server can write the
 * routes a visitor may reach into the shell, as JSON in
 * `<script type="application/json" id="outerfaces-routes">`:
 *
 *   {
 *     "routes": [{ "app_path": "/", "page_path": "/pages/home-page.js", "slug": "home", "title": "Home" }],
 *     "entries": ["/elements/index.js"],
 *     "sign_in": { "path": "/sign-in", "return_param": "next" }
 *   }
 *
 * - `routes`: route definitions, as a routes module would export them.
 * - `entries`: modules the shell imports at start (code only some visitors get).
 * - `sign_in`: present while the visitor isn't signed in. Any path outside their
 *   routes then goes to `path`, with where they were going in `return_param`,
 *   instead of the not-found page.
 *
 * @example
 * const manifest = readRouteManifest();
 * window._outerfaces_hydrated_routes = await useRouteManifest(manifest);
 * navigationService.navigate(window.location.pathname);
 */

/**
 * The route manifest written into the page, or null when there is none (or it
 * can't be read).
 *
 * @param {Document} [doc=document]
 * @param {string} [id='outerfaces-routes']
 * @returns {{routes: Object[], entries: string[], sign_in: {path: string, return_param?: string} | null} | null}
 */
export function readRouteManifest(doc = document, id = 'outerfaces-routes') {
  const element = doc.getElementById(id);
  if (!element) {
    return null;
  }
  try {
    const manifest = JSON.parse(element.textContent || '');
    return {
      routes: Array.isArray(manifest.routes) ? manifest.routes : [],
      entries: Array.isArray(manifest.entries) ? manifest.entries : [],
      sign_in: manifest.sign_in && typeof manifest.sign_in.path === 'string' ? manifest.sign_in : null
    };
  } catch (error) {
    console.error('Unreadable route manifest:', error);
    return null;
  }
}

/**
 * Starts the router from a manifest: hydrates its routes (as
 * `window._outerfaces_hydrated_routes`), remembers its sign-in route, and
 * imports its entries in order. An entry that fails to load is logged and
 * skipped.
 *
 * @param {{routes: Object[], entries?: string[], sign_in?: Object | null}} manifest
 * @param {{basePath?: string}} [options]
 * @returns {Promise<Object[]>} The hydrated routes.
 */
export async function useRouteManifest(manifest, { basePath = '/' } = {}) {
  const hydratedRoutes = await hydrateRoutes(manifest.routes || []);
  window._outerfaces_hydrated_routes = hydratedRoutes;
  window._outerfaces_sign_in = manifest.sign_in || null;

  for (const entry of manifest.entries || []) {
    try {
      await import(modulePath(entry, basePath));
    } catch (error) {
      console.error(`Failed to load ${entry}:`, error);
    }
  }
  return hydratedRoutes;
}

/**
 * Sends a visitor who isn't signed in to the manifest's sign-in route, keeping
 * where they were going. Without a sign-in route (or when the path is the
 * sign-in route itself), shows not found.
 *
 * @param {string} pathname
 */
export function navigateToSignIn(pathname) {
  const signIn = window._outerfaces_sign_in;
  const target = signIn && signIn.path;
  if (!target || pathname === target || !findMatchingRoute(target, window._outerfaces_hydrated_routes || [])) {
    navigateToNotFound();
    return;
  }

  const back = pathname + (window.location.search || '');
  const param = signIn.return_param || 'return';
  const url = back === '/' ? target : `${target}?${param}=${encodeURIComponent(back)}`;
  // With the location overrides installed, replaceState navigates by itself.
  window.history.replaceState(window.history.state, '', url);
  if (!window._outerfaces_initialized) {
    import('./navigate-to-path.js').then(({ navigateToPath }) => navigateToPath(target));
  }
}

function modulePath(path, basePath) {
  return path.startsWith('/') ? window.location.origin + basePath + path.substring(1) : path;
}
