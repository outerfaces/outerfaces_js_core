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

## Scroll on navigation

`initializeLocationStateEventOverrides()` also takes over scroll restoration
(`history.scrollRestoration = 'manual'`), as a multi-page site would behave:

- a page mounted by `pushState` (an `outerfaces-link` click, a redirect) opens
  at the top;
- back/forward returns to where that page was left, once it has rendered tall
  enough (it gives up after two seconds, or as soon as the reader scrolls);
- `replaceState` leaves the scroll where it is;
- same-page navigations (`routeParamsChanged`) never scroll; the page decides.

Each history entry's state gets an `_outerfaces_entry` key (plain-object or
empty states only) for this; positions are kept in memory, so a full reload
starts at the top. Turn it off with
`window._outerfaces_config.scrollOnNavigation = false`.
