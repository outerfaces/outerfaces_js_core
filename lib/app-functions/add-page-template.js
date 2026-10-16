import { addLinkClickListener } from './add-link-click-listener.js';
import { patchPersistedElement } from './patch-persisted-element.js';
import { observeNewPersistentElements } from './observe-new-persistent-elements.js';
import { applyNavigationScroll } from './navigation-scroll.js';

/**
 * Mounts the page for a matched route in #outerfaces-app-content, replacing
 * the page there.
 *
 * Same-page navigation: when the page on show is already the custom element
 * this route renders (another route may render it too, e.g. /items and
 * /items/:id) and that element defines `routeParamsChanged(params)`, it stays
 * mounted and is handed the new route params instead. Pages use this to change
 * the address as their state changes (history.pushState) and to follow
 * back/forward without being torn down and fetched again. Without the method,
 * every navigation mounts a fresh page.
 *
 * Scroll (navigation-scroll.js): a fresh page reached by pushState opens at the
 * top, back/forward restores where it was left, and same-page navigations
 * don't scroll.
 *
 *   class ItemsPage extends HTMLElement {
 *     acceptRouteParams = true;
 *     routeParamsChanged(params) { this.select(params.id); }
 *   }
 *
 * @param {Object} config - a hydrated route: { route, page, routeParams }
 */
export function addPageTemplate(config) {
  const app_page_container_id = 'outerfaces-inserted-page';
  const app_content_id_selector = '#outerfaces-app-content';
  const persistent_element_attribute_selector = '[data-outerfaces-persistent]';

  const baseTitle = window._outerfaces_config ? window._outerfaces_config.baseTitle || '' : '';
  document.title = config.route.title || baseTitle;

  const mounted = mountedPageFor(config, app_page_container_id);
  if (mounted) {
    mounted.routeParamsChanged(config.routeParams || {});
    applyNavigationScroll(true);
    return;
  }

  const container = document.createElement('div');
  container.id = app_page_container_id;

  if (config.route.slug) {
    container.classList.add(`${app_page_container_id}_${config.route.slug}`);
  }

  const content = document.querySelector(app_content_id_selector);

  const persistentElements = content.querySelectorAll(persistent_element_attribute_selector);
  const persistentContainers = Array.from(persistentElements).map((el) => el.parentNode.removeChild(el));

  if (config.page.template) {
    const template = document.createElement('template');
    template.innerHTML = config.page.template.trim();

    const clonedContent = template.content.cloneNode(true);

    const templatePersistentElements = clonedContent.querySelectorAll(persistent_element_attribute_selector);
    templatePersistentElements.forEach((el) => {
      patchPersistedElement(el, persistentContainers);
    });

    container.appendChild(clonedContent);
  }
  else if (config.page.customElementName) {
    customElements.whenDefined(config.page.customElementName).then(() => {
      const customElement = document.createElement(config.page.customElementName);
      if (customElement.acceptRouteParams) {
        customElement.routeParams = config.routeParams;
      }
      container.appendChild(customElement);
    
      Promise.resolve().then(() => {
        const els = customElement.shadowRoot
          ? customElement.shadowRoot.querySelectorAll(persistent_element_attribute_selector)
          : customElement.querySelectorAll(persistent_element_attribute_selector);
    
        els.forEach(el => patchPersistedElement(el, persistentContainers));
      });
    
      observeNewPersistentElements(container, persistentContainers);
    });
  }

  addLinkClickListener(container);

  while (content.firstChild) {
    content.removeChild(content.firstChild);
  }

  content.appendChild(container);

  observeNewPersistentElements(container, persistentContainers);

  applyNavigationScroll(false);
}

// The page element on show, when it renders this route's page and takes
// route param changes in place.
function mountedPageFor(config, containerId) {
  const name = config.page && config.page.customElementName;
  const container = name ? document.getElementById(containerId) : null;
  const element = container ? container.firstElementChild : null;

  if (element && element.localName === name.toLowerCase() && typeof element.routeParamsChanged === 'function') {
    return element;
  }
  return null;
}
