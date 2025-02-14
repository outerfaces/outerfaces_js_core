export function normalizeRouteDefinition(routePath, paramPrefix = ':param') {
  return routePath
    .split('/')
    .map(function(segment, index) {
      return (segment.startsWith(':') ? `${paramPrefix}${index}` : segment);
    })
    .join('/');
}
