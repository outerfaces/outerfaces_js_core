import { addPageTemplate } from './add-page-template.js';
import { findMatchingRoute } from './find-matching-route.js';
import { navigateToNotFound } from './navigate-to-not-found.js';
import { normalizeRouteDefinition } from './normalize-route-definition.js';
import { zipRouteParams } from './zip-route-params.js';

export function navigateToPath(pathname){
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

    if (normalizedCurrentPath !== normalizedRoute){
      const params = zipRouteParams(
        hydratedRoute.route.app_path,
        pathname,
        routeParamConfig.paramSignifier
      );
      hydratedRoute.routeParams = params;
    }
    addPageTemplate(hydratedRoute);
  } else {
    navigateToNotFound();
  }
}