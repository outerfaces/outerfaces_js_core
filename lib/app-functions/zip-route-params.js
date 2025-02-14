export function zipRouteParams(routePath, currentPath, paramSignifier = ':') {
  const routeSegments = routePath.split('/').filter(Boolean);
  const pathSegments = currentPath.split('/').filter(Boolean);

  return routeSegments.reduce((params, segment, index) => {
    if (segment.startsWith(paramSignifier)) {
      const paramName = segment.slice(1);
      params[paramName] = pathSegments[index];
    }
    return params;
  }, {});
}
