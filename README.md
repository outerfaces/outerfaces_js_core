# Outerfaces Javascript Core

A collection of JavaScript helpers for Outerfaces, designed to create portable and functional web applications using modern web standards, Elixir, and Phoenix.
## Same-page navigation

With `initializeLocationStateEventOverrides()`, every `history.pushState`,
`history.replaceState` and back/forward navigates: the matching route's page is
mounted afresh in `#outerfaces-app-content`.

A page that keeps its own state in the address (a selected item, a tab) can opt
out of being re-mounted by defining `routeParamsChanged(params)`. When the page
on show is the custom element the new route renders (the same route, or another
route with the same page, such as `/items` and `/items/:id`), the router keeps it
mounted and calls that method with the new route params (`{}` for a route
without params). Auth and authorization checks run first, as for any
navigation, and the document title follows the route.

```js
class ItemsPage extends HTMLElement {
  acceptRouteParams = true;

  select(id) {
    history.pushState(null, '', `/items/${encodeURIComponent(id)}`);
  }

  // Called for pushState above, outerfaces-link clicks and back/forward.
  routeParamsChanged(params) {
    this.show(params.id);
  }
}
```

Pages without the method are mounted afresh on every navigation, as before.
