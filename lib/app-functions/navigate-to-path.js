import { addPageTemplate } from './add-page-template.js';
import { fetchPageForRouteDefinition } from './fetch-page-for-route-definition.js';
import { findMatchingRoute } from './find-matching-route.js';
import { navigateToNotFound } from './navigate-to-not-found.js';
import { normalizeRouteDefinition } from './normalize-route-definition.js';
import { zipRouteParams } from './zip-route-params.js';

export function navigateToPath(pathname, basePath = '/'){
  const staticAssetPattern = /\.(js|css)$/;

  if (staticAssetPattern.test(pathname)) {
    navigateToNotFound();
    return;
  }

  const routeParamConfig = {
    paramSignifier: ':',
    normalizedParamPrefix: ':param'
  }

  const maybeRouteConfig = findMatchingRoute(
    pathname,
    window._outerfaces_hydrated_routes,
    routeParamConfig.paramSignifier,
    routeParamConfig.normalizedParamPrefix
  );

  if (maybeRouteConfig){
    const {hydratedRoute, normalizedRoute} = maybeRouteConfig;
    const normalizedCurrentPath = normalizeRouteDefinition(
      pathname, routeParamConfig.normalizedParamPrefix
    );

    // Extract route params if this is a parameterized route
    if (normalizedCurrentPath !== normalizedRoute){
      const params = zipRouteParams(
        hydratedRoute.route.app_path,
        pathname,
        routeParamConfig.paramSignifier
      );
      hydratedRoute.routeParams = params;
    }

    // LAZY LOADING: Check if page definition is loaded
    // If not loaded yet (page === null), fetch it on-demand
    if (!hydratedRoute.page) {
      return fetchPageForRouteDefinition(hydratedRoute.route, basePath).then(page_definition => {
        // Cache the page definition in the hydrated route
        hydratedRoute.page = page_definition;

        // Now render the page
        addPageTemplate(hydratedRoute);
      }).catch(error => {
        console.error('Failed to load page:', error);
        navigateToNotFound();
      });
    }

    // Page already loaded, render immediately
    addPageTemplate(hydratedRoute);
  } else {
    navigateToNotFound();
  }
}