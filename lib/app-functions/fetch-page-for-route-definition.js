export function fetchPageForRouteDefinition(route_definition, basePath = '/'){
  const pagePath = route_definition.page_path.startsWith('/')
    ? window.location.origin + basePath + route_definition.page_path.substring(1)
    : route_definition.page_path;

  return import(pagePath).then(module => {
    return module.page_definition;
  }).catch(error => {
    console.error('Error loading module:', error);
  });
}