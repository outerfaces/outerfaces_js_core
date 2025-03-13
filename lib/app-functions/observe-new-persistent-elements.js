import { patchPersistedElement } from './patch-persisted-element.js';

const PERSIST_ATTR_SELECTOR = '[data-outerfaces-persistent]';

/**
 * Recursively finds any new elements that match `PERSIST_ATTR_SELECTOR`
 * in both Light DOM and Shadow DOM, then patches them.
 */
function patchIfPersistent(node, persistentContainers) {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node;
    if (el.hasAttribute && el.hasAttribute('data-outerfaces-persistent')) {
      patchPersistedElement(el, persistentContainers);
    }

    el.querySelectorAll?.(PERSIST_ATTR_SELECTOR).forEach((child) => {
      patchPersistedElement(child, persistentContainers);
    });

    if (el.shadowRoot) {
      el.shadowRoot.querySelectorAll(PERSIST_ATTR_SELECTOR).forEach((shadowEl) => {
        patchPersistedElement(shadowEl, persistentContainers);
      });
    }
  }
}

/**
 * Observes `container` for newly added nodes. If they match the persistent attribute,
 * we patch them. Stops observing if `persistentContainers` is empty (nothing left to patch).
 */
export function observeNewPersistentElements(container, persistentContainers) {
  if (!persistentContainers.length) return;

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        patchIfPersistent(node, persistentContainers);
      });
    }

    if (persistentContainers.length === 0) {
      observer.disconnect();
    }
  });

  observer.observe(container, {
    childList: true,
    subtree: true,
  });
}
