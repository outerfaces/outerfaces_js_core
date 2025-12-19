import { navigateToPath } from '../app-functions/navigate-to-path.js';
import { navigateToAuthenticatedPath } from '../app-functions/navigate-to-authenticated-path.js';

/**
 * Navigation service that manages authenticated and unauthenticated navigation.
 *
 * This service provides a centralized way to handle navigation with authentication
 * and authorization guards. It can be reconfigured at runtime to handle changes
 * in authentication strategy or requirements.
 *
 * @example
 * // Create navigation service
 * const navigationService = new NavigationService(authService, {
 *   authStrategySlug: 'credentials_access',
 *   requireAuthByDefault: true,
 *   unauthenticatedRedirect: '/welcome',
 *   unauthorizedRedirect: '/unauthorized'
 * });
 *
 * // Navigate with auth guards
 * navigationService.navigate('/dashboard');
 *
 * // Navigate without auth guards (bypass)
 * navigationService.navigateUnsafe('/login');
 *
 * // Update configuration (e.g., when auth strategy changes)
 * navigationService.updateConfig({
 *   authStrategySlug: 'open_access_unrestricted'
 * });
 */
export class NavigationService {
  /**
   * @param {Object} authService - Auth service instance with isLoggedIn() and getCurrentUser() methods
   * @param {Object} config - Navigation configuration
   * @param {string} [config.authStrategySlug] - Environment auth strategy (e.g., 'open_access_unrestricted', 'credentials_access')
   * @param {boolean} [config.requireAuthByDefault=false] - If true, routes without skipAuth flag require authentication
   * @param {string} [config.unauthenticatedRedirect='/login'] - Path to redirect to when authentication fails
   * @param {string} [config.unauthorizedRedirect='/unauthorized'] - Default path to redirect to when authorization fails
   * @param {string} [config.basePath='/'] - Base path for page resource loading (e.g., '/a/1/web/' for proxied requests)
   */
  constructor(authService, config = {}) {
    this.authService = authService;
    this.config = {
      authStrategySlug: config.authStrategySlug,
      requireAuthByDefault: config.requireAuthByDefault ?? false,
      unauthenticatedRedirect: config.unauthenticatedRedirect ?? '/login',
      unauthorizedRedirect: config.unauthorizedRedirect ?? '/unauthorized',
      basePath: config.basePath ?? '/'
    };
  }

  /**
   * Navigate to a path with authentication and authorization guards.
   *
   * This method applies the configured auth checks before navigation.
   * Routes with skipAuth: true will bypass authentication.
   * Routes with authorizationCheck will run custom permission logic.
   *
   * @param {string} pathname - The path to navigate to (e.g., '/users/123/edit')
   *
   * @example
   * navigationService.navigate('/dashboard');
   * navigationService.navigate('/users/123/edit');
   */
  navigate(pathname) {
    navigateToAuthenticatedPath(pathname, {
      authChecker: this.authService ? () => this.authService.isLoggedIn() : undefined,
      getCurrentUser: this.authService ? () => this.authService.getCurrentUser() : undefined,
      authStrategySlug: this.config.authStrategySlug,
      requireAuthByDefault: this.config.requireAuthByDefault,
      unauthenticatedRedirect: this.config.unauthenticatedRedirect,
      unauthorizedRedirect: this.config.unauthorizedRedirect,
      basePath: this.config.basePath
    });
  }

  /**
   * Navigate to a path WITHOUT authentication guards (unsafe).
   *
   * This method bypasses all authentication and authorization checks.
   * Use this for navigation that should always work regardless of auth state
   * (e.g., navigating to login page, or in admin/debugging scenarios).
   *
   * @param {string} pathname - The path to navigate to
   *
   * @example
   * // Navigate to login without triggering auth redirects
   * navigationService.navigateUnsafe('/login');
   *
   * // Direct navigation in admin context
   * navigationService.navigateUnsafe('/debug/routes');
   */
  navigateUnsafe(pathname) {
    navigateToPath(pathname, this.config.basePath);
  }

  /**
   * Update the navigation service configuration.
   *
   * This allows for dynamic reconfiguration of the navigation behavior,
   * such as when the auth strategy changes or app requirements are updated.
   *
   * @param {Object} newConfig - Partial config object to merge with existing config
   * @param {string} [newConfig.authStrategySlug] - New auth strategy
   * @param {boolean} [newConfig.requireAuthByDefault] - New default auth requirement
   * @param {string} [newConfig.unauthenticatedRedirect] - New unauthenticated redirect path
   * @param {string} [newConfig.unauthorizedRedirect] - New unauthorized redirect path
   *
   * @example
   * // Switch to open access mode
   * navigationService.updateConfig({
   *   authStrategySlug: 'open_access_unrestricted'
   * });
   *
   * // Change redirect paths
   * navigationService.updateConfig({
   *   unauthenticatedRedirect: '/new-login',
   *   unauthorizedRedirect: '/access-denied'
   * });
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get the current navigation configuration.
   *
   * @returns {Object} Current configuration object
   *
   * @example
   * const config = navigationService.getConfig();
   * console.log('Auth strategy:', config.authStrategySlug);
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Check if user is currently authenticated.
   *
   * @returns {boolean} True if user is authenticated
   *
   * @example
   * if (navigationService.isAuthenticated()) {
   *   console.log('User is logged in');
   * }
   */
  isAuthenticated() {
    return this.authService ? this.authService.isLoggedIn() : false;
  }

  /**
   * Get the current authenticated user.
   *
   * @returns {Object|null} Current user object or null if not authenticated
   *
   * @example
   * const user = navigationService.getCurrentUser();
   * if (user) {
   *   console.log('Logged in as:', user.username);
   * }
   */
  getCurrentUser() {
    return this.authService ? this.authService.getCurrentUser() : null;
  }
}
