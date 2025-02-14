export function fetchPageForRouteDefinition(route_definition){
  const pagePath = route_definition.page_path.startsWith('/')
    ? window.location.origin + route_definition.page_path
    : route_definition.page_path;

  return import(pagePath).then(module => {
    return module.page_definition;
  }).catch(error => {
    console.error('Error loading module:', error);
  });
}