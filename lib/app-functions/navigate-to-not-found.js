import { addPageTemplate } from './add-page-template.js';

export function navigateToNotFound(){
  const notFoundPage = window._outerfaces_hydrated_routes.find(function(r){
    return r.route.slug === "not_found";
  });
  if (notFoundPage) {
    addPageTemplate(notFoundPage);
  }
}