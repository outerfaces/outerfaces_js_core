import { addLinkClickListener } from './add-link-click-listener.js';
import { patchPersistedElement } from './patch-persisted-element.js';

export function addPageTemplate(config) {
  const app_page_container_id = 'outerfaces-inserted-page';
  const app_content_id_selector = '#outerfaces-app-content';
  const persistent_element_attribute_selector = '[data-outerfaces-persistent]';

  const baseTitle = window._outerfaces_config ? window._outerfaces_config.baseTitle || '' : '';
  document.title = !!config.route.title ? `${config.route.title}` : baseTitle;

  const container = document.createElement('div');
  container.id = app_page_container_id

  if (!!config.route.slug) {
    container.classList.add(`${app_page_container_id}_${config.route.slug}`);
  }

  const content = document.querySelector(app_content_id_selector);

  const persistentElements = content.querySelectorAll(persistent_element_attribute_selector);
  const persistentContainers = Array.from(persistentElements).map(el => el.parentNode.removeChild(el));

  if (!!config.page.template) {
    const template = document.createElement('template');
    template.innerHTML = config.page.template.trim();

    const clonedContent = template.content.cloneNode(true);

    const templatePersistentElements = clonedContent.querySelectorAll(persistent_element_attribute_selector);

    templatePersistentElements.forEach(el => {
      patchPersistedElement(el, persistentContainers);
    });

    container.appendChild(clonedContent);

  } else if (!!config.page.customElementName) {
    const customElement = document.createElement(config.page.customElementName);
    if (customElement.acceptRouteParams) {
      customElement.routeParams = config.routeParams;
    }
    container.appendChild(customElement);

    const customElementPersistentElements = customElement.shadowRoot 
      ? customElement.shadowRoot.querySelectorAll(persistent_element_attribute_selector)
      : customElement.querySelectorAll(persistent_element_attribute_selector);
    
    customElementPersistentElements.forEach(el => {
      patchPersistedElement(el, persistentContainers);
    });
  }

  addLinkClickListener(container);

  while (content.firstChild) {
    content.removeChild(content.firstChild);
  }

  content.appendChild(container);
}
