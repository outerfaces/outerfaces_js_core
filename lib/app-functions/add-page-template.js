import { addLinkClickListener } from './add-link-click-listener.js';

export function addPageTemplate(config){
  const baseTitle = window._outerfaces_config ? window._outerfaces_config.baseTitle || '' : '';
  document.title = !!config.route.title ? `${config.route.title}` : baseTitle;

  const container = document.createElement('div');
  container.id = 'outerfaces-inserted-page';

  if (!!config.route.slug){
    container.classList.add(`outerfaces-inserted-page_${config.route.slug}`);
  }

  if (!!config.page.template){
    container.innerHTML = config.page.template.trim()
  } else if (!!config.page.customElementName) {
    const customElement = document.createElement(config.page.customElementName);
    if (customElement.acceptRouteParams) {
      customElement.routeParams = config.routeParams;
    }
    container.appendChild(customElement);
  }
  addLinkClickListener(container);
  
  const content = document.querySelector('#outerfaces-app-content')
  content.innerHTML = '';
  content.appendChild(container);
}
