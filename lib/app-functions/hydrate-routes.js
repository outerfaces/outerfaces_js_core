import { fetchPageForRouteDefinition } from './fetch-page-for-route-definition.js';

export function hydrateRoutes(route_definitions){
  const pagePromises = route_definitions.map(async function(route_definition) {
    const page_definition = await fetchPageForRouteDefinition(route_definition);
    return {
      route: route_definition,
      page: page_definition
    };
  });

  return Promise.all(pagePromises);
}
