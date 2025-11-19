import { navigateToPath } from './navigate-to-path.js';
import { findMatchingRoute } from './find-matching-route.js';
import { normalizeRouteDefinition } from './normalize-route-definition.js';
import { zipRouteParams } from './zip-route-params.js';

/**
 * Extracts query parameters from the current URL.
 * @returns {Object} Object containing query parameters as key-value pairs
 * @private
 */
function extractQueryParams() {
  const params = {};
  const searchParams = new URLSearchParams(window.location.search);
  for (const [key, value] of searchParams) {
    params[key] = value;
  }
  return params;
}

/**
 * Navigates to a path with authentication and authorization guards.
 *
 * This function implements a two-level security model:
 * 1. **Authentication**: Verifies the user is logged in (global check)
 * 2. **Authorization**: Verifies the user has permission for this specific route (per-route check)
 *
 * @param {string} pathname - The path to navigate to (e.g., '/users/123/edit')
 * @param {Object} options - Configuration options for authentication and authorization
 * @param {Function} [options.authChecker] - Function that returns true if user is authenticated.
 *   If not provided, authentication checks are skipped.
 *   Example: () => AuthService.isLoggedIn()
 * @param {Function} [options.getCurrentUser] - Function that returns the current user object or null.
 *   Required if routes use authorizationCheck that needs user data.
 *   Example: () => AuthService.getCurrentUser()
 * @param {string} [options.authStrategySlug] - Environment auth strategy (e.g., 'open_access_unrestricted', 'credentials_access').
 *   If set to 'open_access_unrestricted', authentication checks are skipped but authorization checks still run.
 * @param {boolean} [options.requireAuthByDefault=false] - If true, routes without skipAuth flag require authentication
 * @param {string} [options.unauthenticatedRedirect='/login'] - Path to redirect to when authentication fails.
 *   The original path is preserved as a query parameter: ?return=/original/path
 * @param {string} [options.unauthorizedRedirect='/unauthorized'] - Default path to redirect to when authorization fails.
 *   Can be overridden per-route with route.unauthorizedRedirect
 *
 * @example
 * // Basic usage with authentication only
 * navigateToAuthenticatedPath('/dashboard', {
 *   authChecker: () => AuthService.isLoggedIn(),
 *   getCurrentUser: () => AuthService.getCurrentUser(),
 *   requireAuthByDefault: true,
 *   unauthenticatedRedirect: '/welcome'
 * });
 *
 * @example
 * // With auth strategy support
 * navigateToAuthenticatedPath('/users', {
 *   authChecker: () => AuthService.isLoggedIn(),
 *   getCurrentUser: () => AuthService.getCurrentUser(),
 *   authStrategySlug: env.auth_strategy_slug,  // Skip auth if 'open_access_unrestricted'
 *   requireAuthByDefault: true
 * });
 *
 * @example
 * // Route with authorization check (in route definition)
 * {
 *   path: '/users/:id/edit',
 *   page: () => import('./pages/users/edit.js'),
 *   authorizationCheck: async ({ routeParams, currentUser }) => {
 *     // Only allow users to edit their own profile, or admins
 *     return currentUser?.id === parseInt(routeParams.id) || currentUser?.isAdmin;
 *   },
 *   unauthorizedRedirect: '/forbidden'  // Optional custom redirect
 * }
 *
 * @example
 * // Public route (no auth required)
 * {
 *   path: '/login',
 *   skipAuth: true,
 *   page: () => import('./pages/auth/login.js')
 * }
 *
 * @example
 * // Public route with custom validation (magic link)
 * {
 *   path: '/magic-link/:token',
 *   skipAuth: true,  // Don't require login
 *   authorizationCheck: async ({ routeParams }) => {
 *     // Validate the magic link token
 *     return await validateMagicLinkToken(routeParams.token);
 *   }
 * }
 */
export function navigateToAuthenticatedPath(pathname, options = {}) {
  const {
    authChecker,
    getCurrentUser,
    authStrategySlug,
    requireAuthByDefault = false,
    unauthenticatedRedirect = '/login',
    unauthorizedRedirect = '/unauthorized'
  } = options;

  const routeParamConfig = {
    paramSignifier: ':',
    normalizedParamPrefix: ':param'
  };

  // Find the matching route
  const maybeRouteConfig = findMatchingRoute(
    pathname,
    window._outerfaces_hydrated_routes,
    routeParamConfig.paramSignifier,
    routeParamConfig.normalizedParamPrefix
  );

  // If no route found, let navigateToPath handle it (will show 404)
  if (!maybeRouteConfig) {
    navigateToPath(pathname);
    return;
  }

  const { hydratedRoute, normalizedRoute } = maybeRouteConfig;
  const route = hydratedRoute.route;

  // Extract route parameters
  let routeParams = {};
  const normalizedCurrentPath = normalizeRouteDefinition(
    pathname,
    routeParamConfig.normalizedParamPrefix
  );

  if (normalizedCurrentPath !== normalizedRoute) {
    routeParams = zipRouteParams(
      route.app_path,
      pathname,
      routeParamConfig.paramSignifier
    );
  }

  // Extract query parameters
  const queryParams = extractQueryParams();

  // Check if this route explicitly skips all auth checks
  const shouldSkipAuth = route.skipAuth === true;

  // Determine if we need to check authentication
  const shouldCheckAuth = !shouldSkipAuth &&
                          (requireAuthByDefault || route.requiresAuth === true) &&
                          authStrategySlug !== 'open_access_unrestricted';

  // AUTHENTICATION CHECK (Level 1: Are you logged in?)
  if (shouldCheckAuth && authChecker) {
    const isAuthenticated = authChecker();

    if (!isAuthenticated) {
      // Preserve the intended destination for post-login redirect
      const returnPath = pathname + (window.location.search || '');
      const redirectUrl = `${unauthenticatedRedirect}?return=${encodeURIComponent(returnPath)}`;

      // Update browser URL with query params, then navigate to the path
      window.history.pushState({}, '', redirectUrl);
      navigateToPath(unauthenticatedRedirect);
      return;
    }
  }

  // AUTHORIZATION CHECK (Level 2: Do you have permission for this specific route?)
  if (route.authorizationCheck && typeof route.authorizationCheck === 'function') {
    // Prepare authorization context
    const authContext = {
      routeParams,
      currentUser: getCurrentUser ? getCurrentUser() : null,
      pathname,
      queryParams,
      route
    };

    // Run authorization check (may be async)
    const authCheckResult = route.authorizationCheck(authContext);

    // Handle both sync and async authorization checks
    if (authCheckResult instanceof Promise) {
      authCheckResult.then(isAuthorized => {
        if (isAuthorized) {
          navigateToPath(pathname);
        } else {
          // Use route-specific redirect or default
          const redirectPath = route.unauthorizedRedirect || unauthorizedRedirect;
          navigateToPath(redirectPath);
        }
      }).catch(error => {
        console.error('Authorization check failed with error:', error);
        const redirectPath = route.unauthorizedRedirect || unauthorizedRedirect;
        navigateToPath(redirectPath);
      });
      return;
    } else {
      // Sync authorization check
      if (!authCheckResult) {
        const redirectPath = route.unauthorizedRedirect || unauthorizedRedirect;
        navigateToPath(redirectPath);
        return;
      }
    }
  }

  // All checks passed (or no checks configured), proceed with navigation
  // NOTE: Page lazy loading happens inside navigateToPath()
  // The page will only be loaded AFTER authentication/authorization passes
  // This ensures protected pages never load for unauthorized users
  navigateToPath(pathname);
}

/**
 * @typedef {Object} AuthorizationContext
 * @property {Object} routeParams - Parameters extracted from the URL path (e.g., { id: '123' } from /users/:id)
 * @property {Object|null} currentUser - The current authenticated user object, or null if not authenticated
 * @property {string} pathname - The full pathname being navigated to
 * @property {Object} queryParams - Query parameters from the URL as an object
 * @property {Object} route - The full route definition object
 */

/**
 * @typedef {Object} RouteDefinition
 * @property {string} path - The route path pattern (e.g., '/users/:id')
 * @property {Function} page - Function that imports the page component
 * @property {boolean} [skipAuth] - If true, skip both authentication and authorization checks (public route)
 * @property {boolean} [requiresAuth] - If true, require authentication (overrides requireAuthByDefault)
 * @property {Function} [authorizationCheck] - Custom authorization function: (context: AuthorizationContext) => boolean | Promise<boolean>
 * @property {string} [unauthorizedRedirect] - Custom path to redirect to when authorization fails for this route
 */
