import { addPageTemplate } from './add-page-template.js';
import { fetchPageForRouteDefinition } from './fetch-page-for-route-definition.js';

export function navigateToNotFound(){
  const notFoundPage = window._outerfaces_hydrated_routes.find(function(r){
    return r.route.slug === "not_found";
  });

  if (notFoundPage) {
    // LAZY LOADING: Check if not-found page is loaded
    if (!notFoundPage.page) {
      return fetchPageForRouteDefinition(notFoundPage.route).then(page_definition => {
        // Cache the page definition
        notFoundPage.page = page_definition;

        // Render the not-found page
        addPageTemplate(notFoundPage);
      }).catch(error => {
        console.error('Failed to load not-found page:', error);
        // Fallback: show a basic error message in the DOM
        const content = document.querySelector('#outerfaces-app-content');
        if (content) {
          content.innerHTML = '<div style="padding: 2rem;"><h1>404 - Page Not Found</h1><p>The page you are looking for does not exist.</p></div>';
        }
      });
    }

    // Page already loaded, render immediately
    addPageTemplate(notFoundPage);
  } else {
    // No not-found route configured, show basic error
    console.error('No not-found route configured');
    const content = document.querySelector('#outerfaces-app-content');
    if (content) {
      content.innerHTML = '<div style="padding: 2rem;"><h1>404 - Page Not Found</h1><p>The page you are looking for does not exist.</p></div>';
    }
  }
}