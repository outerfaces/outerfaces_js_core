import { normalizeRouteDefinition } from './normalize-route-definition.js';

export function findMatchingRoute(
    currentPath,
    hydratedRoutes,
    paramSignifier = ':',
    normalizedParamPrefix = ':param') {
  const currentSegments = currentPath.split('/').filter(Boolean);

  for (const hydratedRoute of hydratedRoutes) {
    const normalizedRoute = normalizeRouteDefinition(
      hydratedRoute.route.app_path,
      normalizedParamPrefix
    );

    const routeSegments = normalizedRoute.split('/').filter(Boolean);

    if (currentSegments.length !== routeSegments.length) continue;

    const isMatch = routeSegments.every((seg, index) => {
      return seg.startsWith(paramSignifier) || seg === currentSegments[index];
    });

    if (isMatch) {
      return { hydratedRoute, normalizedRoute };
    }
  }

  return null;
}
