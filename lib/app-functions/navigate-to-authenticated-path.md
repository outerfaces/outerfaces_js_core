# navigateToAuthenticatedPath

A route navigation function with built-in authentication and authorization guards for Outerfaces applications.

## Overview

`navigateToAuthenticatedPath` implements a **two-level security model** for client-side routing:

1. **Authentication** (Level 1): "Who are you?" - Verifies the user is logged in
2. **Authorization** (Level 2): "What can you do?" - Verifies the user has permission for a specific route

This allows you to:
- Protect routes that require login
- Add custom permission checks per route
- Support public routes that don't require authentication
- Respect environment-level auth strategies
- Gracefully handle apps that don't use authentication at all

## Authentication vs Authorization

### Authentication
- **Global check** applied to all routes (unless explicitly skipped)
- Answers: "Is this user logged in?"
- Configured once when setting up the navigation guard
- Redirects to login/welcome page if check fails

### Authorization
- **Per-route check** with custom logic
- Answers: "Does this user have permission for this specific resource/action?"
- Defined in individual route definitions
- Examples: role checks, resource ownership, token validation
- Redirects to unauthorized/forbidden page if check fails

## API Reference

### Function Signature

```javascript
navigateToAuthenticatedPath(pathname, options)
```

### Parameters

#### `pathname` (string, required)
The path to navigate to (e.g., `/users/123/edit`).

#### `options` (object, optional)
Configuration for authentication and authorization.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `authChecker` | `() => boolean` | `undefined` | Function that returns `true` if user is authenticated. If not provided, authentication checks are skipped. |
| `getCurrentUser` | `() => Object\|null` | `undefined` | Function that returns the current user object or `null`. Required if routes use `authorizationCheck` that needs user data. |
| `authStrategySlug` | `string` | `undefined` | Environment auth strategy (e.g., `'open_access_unrestricted'`, `'credentials_access'`). If set to `'open_access_unrestricted'`, authentication checks are skipped. |
| `requireAuthByDefault` | `boolean` | `false` | If `true`, routes without `skipAuth` flag require authentication. |
| `unauthenticatedRedirect` | `string` | `'/login'` | Path to redirect to when authentication fails. Original path preserved as query param. |
| `unauthorizedRedirect` | `string` | `'/unauthorized'` | Default path to redirect to when authorization fails. Can be overridden per-route. |

### Route Definition Properties

Routes can include these optional properties to control authentication and authorization:

| Property | Type | Description |
|----------|------|-------------|
| `skipAuth` | `boolean` | If `true`, skip both authentication and authorization checks (public route). |
| `requiresAuth` | `boolean` | If `true`, require authentication (overrides `requireAuthByDefault`). |
| `authorizationCheck` | `(context) => boolean\|Promise<boolean>` | Custom authorization function. Receives context with route params, user, etc. |
| `unauthorizedRedirect` | `string` | Custom path to redirect to when authorization fails for this route. |

### Authorization Context

The `authorizationCheck` function receives a context object with:

```javascript
{
  routeParams: {
    // URL path parameters (e.g., { id: '123' } from /users/:id)
    id: '123',
    token: 'abc-def'
  },

  currentUser: {
    // Current authenticated user object (or null if not authenticated)
    id: 1,
    username: 'alice',
    roles: ['admin'],
    // ... whatever your getCurrentUser() returns
  },

  pathname: '/users/123/edit',  // Full pathname being navigated to

  queryParams: {
    // URL query parameters as object
    return: '/dashboard',
    tab: 'settings'
  },

  route: {
    // The full route definition object
    path: '/users/:id/edit',
    page: Function,
    authorizationCheck: Function,
    // ... other route properties
  }
}
```

## Usage Examples

### Basic Setup (Authentication Only)

```javascript
// In your app's index.rofl.js or router setup
import { navigateToAuthenticatedPath } from '@outerfaces/js-core/lib/app-functions/navigate-to-authenticated-path.js';
import { AuthService } from './services/auth-service.js';

// Setup navigation with authentication
function setupRouter(env) {
  // Configure navigation to use auth guard
  window.navigateToAuthenticatedPath = (pathname) => {
    navigateToAuthenticatedPath(pathname, {
      authChecker: () => AuthService.isLoggedIn(),
      getCurrentUser: () => AuthService.getCurrentUser(),
      authStrategySlug: env.auth_strategy_slug,
      requireAuthByDefault: true,
      unauthenticatedRedirect: '/welcome',
      unauthorizedRedirect: '/unauthorized'
    });
  };
}
```

### Route Definitions

#### Public Routes

```javascript
// Public route - no authentication required
{
  path: '/login',
  skipAuth: true,
  page: () => import('./pages/auth/login.js')
}

{
  path: '/about',
  skipAuth: true,
  page: () => import('./pages/about.js')
}
```

#### Protected Routes (Authentication Required)

```javascript
// Protected route - requires login only
{
  path: '/dashboard',
  page: () => import('./pages/dashboard.js')
  // No skipAuth, so requireAuthByDefault applies
}

// Explicitly require auth (even if requireAuthByDefault is false)
{
  path: '/profile',
  requiresAuth: true,
  page: () => import('./pages/profile.js')
}
```

#### Authorization Examples

**Resource Ownership Check:**
```javascript
{
  path: '/users/:id/edit',
  page: () => import('./pages/users/edit.js'),
  authorizationCheck: ({ routeParams, currentUser }) => {
    // Only allow users to edit their own profile, or admins
    return currentUser?.id === parseInt(routeParams.id) ||
           currentUser?.roles?.includes('admin');
  },
  unauthorizedRedirect: '/forbidden'
}
```

**Role-Based Access:**
```javascript
{
  path: '/admin',
  page: () => import('./pages/admin.js'),
  authorizationCheck: ({ currentUser }) => {
    return currentUser?.roles?.includes('admin');
  }
}
```

**Permission-Based Access:**
```javascript
{
  path: '/users/manage',
  page: () => import('./pages/users/manage.js'),
  authorizationCheck: ({ currentUser }) => {
    return currentUser?.permissions?.includes('manage_users');
  }
}
```

**Magic Link Validation:**
```javascript
{
  path: '/magic-link/:token',
  skipAuth: true,  // Don't require login
  page: () => import('./pages/magic-link.js'),
  authorizationCheck: async ({ routeParams }) => {
    // Validate the magic link token
    const response = await fetch(`/api/validate-token/${routeParams.token}`);
    return response.ok;
  }
}
```

**Query Parameter Validation:**
```javascript
{
  path: '/preview',
  skipAuth: true,
  page: () => import('./pages/preview.js'),
  authorizationCheck: ({ queryParams }) => {
    // Require a valid preview token in query params
    return queryParams.token && validatePreviewToken(queryParams.token);
  }
}
```

**Complex Multi-Condition Check:**
```javascript
{
  path: '/beta-feature',
  page: () => import('./pages/beta-feature.js'),
  authorizationCheck: async ({ currentUser, queryParams }) => {
    // User must be either:
    // 1. In beta_users role, OR
    // 2. Have a valid beta invite token
    const hasRole = currentUser?.roles?.includes('beta_users');
    const hasInvite = queryParams.invite &&
                      await validateBetaInvite(queryParams.invite);
    return hasRole || hasInvite;
  }
}
```

## Integration Guide

### For New Outerfaces Apps

1. **Create an Auth Service** (if using authentication):
   ```javascript
   // services/auth-service.js
   export const AuthService = {
     isLoggedIn() {
       return !!localStorage.getItem('access_token');
     },

     getCurrentUser() {
       const userJson = localStorage.getItem('current_user');
       return userJson ? JSON.parse(userJson) : null;
     }
   };
   ```

2. **Configure Navigation** in your app initialization:
   ```javascript
   // index.rofl.js
   import { navigateToAuthenticatedPath } from '@outerfaces/js-core';
   import { AuthService } from './services/auth-service.js';

   navigateToAuthenticatedPath(pathname, {
     authChecker: () => AuthService.isLoggedIn(),
     getCurrentUser: () => AuthService.getCurrentUser(),
     requireAuthByDefault: true,
     unauthenticatedRedirect: '/login'
   });
   ```

3. **Mark Public Routes** with `skipAuth: true`:
   ```javascript
   const routes = [
     { path: '/', skipAuth: true, page: () => import('./pages/home.js') },
     { path: '/login', skipAuth: true, page: () => import('./pages/auth/login.js') },
     { path: '/dashboard', page: () => import('./pages/dashboard.js') }
   ];
   ```

4. **Handle Return Paths** in your login page:
   ```javascript
   async function handleLogin(username, password) {
     const result = await AuthService.login(username, password);

     if (result.success) {
       // Redirect to return path or default
       const params = new URLSearchParams(window.location.search);
       const returnPath = params.get('return') || '/';
       navigateToAuthenticatedPath(returnPath);
     }
   }
   ```

### For Apps Without Authentication

If your app doesn't use authentication, you can:

1. **Option 1**: Use `navigateToPath` directly (existing behavior)

2. **Option 2**: Use `navigateToAuthenticatedPath` without auth options:
   ```javascript
   // All routes will be public, but you can still use authorizationCheck
   navigateToAuthenticatedPath(pathname, {
     // No authChecker provided = no authentication required
     // But routes can still have authorizationCheck for custom logic
   });
   ```

## Migration Guide

### Migrating from `navigateToPath`

If you're currently using `navigateToPath`, migration is straightforward:

**Before:**
```javascript
import { navigateToPath } from '@outerfaces/js-core';

// Navigate directly
navigateToPath('/dashboard');
```

**After (with authentication):**
```javascript
import { navigateToAuthenticatedPath } from '@outerfaces/js-core';

// Configure once during app initialization
const navigate = (pathname) => {
  navigateToAuthenticatedPath(pathname, {
    authChecker: () => AuthService.isLoggedIn(),
    getCurrentUser: () => AuthService.getCurrentUser(),
    requireAuthByDefault: true,
    unauthenticatedRedirect: '/welcome'
  });
};

// Use throughout your app
navigate('/dashboard');
```

**Or create a wrapper:**
```javascript
// utils/navigate.js
import { navigateToAuthenticatedPath } from '@outerfaces/js-core';
import { AuthService } from '../services/auth-service.js';

export function navigate(pathname) {
  navigateToAuthenticatedPath(pathname, {
    authChecker: () => AuthService.isLoggedIn(),
    getCurrentUser: () => AuthService.getCurrentUser(),
    requireAuthByDefault: true,
    unauthenticatedRedirect: '/welcome'
  });
}

// Then import and use this navigate function throughout your app
```

## Environment Auth Strategy Support

The `authStrategySlug` option allows you to respect environment-level authentication strategies:

```javascript
navigateToAuthenticatedPath(pathname, {
  authChecker: () => AuthService.isLoggedIn(),
  authStrategySlug: env.auth_strategy_slug,
  requireAuthByDefault: true
});
```

**Behavior:**
- If `auth_strategy_slug === 'open_access_unrestricted'`: Skip all authentication checks (authorization checks still run)
- If `auth_strategy_slug === 'credentials_access'`: Enforce authentication checks
- This allows the same codebase to work in different environments (open dev, secured production, etc.)

## Security Considerations

### Client-Side Guards Are Not Security

**Important:** Client-side route guards are for **user experience**, not security. They:
- ✅ Prevent users from accessing routes they don't have permission for
- ✅ Provide clear feedback about authentication requirements
- ✅ Preserve intended destinations for post-login redirects

But they **do not** provide real security because:
- ❌ Users can bypass client-side code in the browser
- ❌ Direct API calls can still be made without navigating routes

**Always implement server-side authentication and authorization** to actually secure your application:
- Protect all API endpoints with authentication middleware
- Validate permissions on the server before returning sensitive data
- Never trust client-side validation alone

Client-side route guards complement server-side security by providing a better user experience.

## Troubleshooting

### Navigation Doesn't Check Authentication

**Problem:** Routes navigate freely without checking login status.

**Solutions:**
1. Ensure `authChecker` is provided in options
2. Set `requireAuthByDefault: true` or add `requiresAuth: true` to specific routes
3. Check that your `authChecker` function is returning the correct boolean value
4. Verify `authStrategySlug` is not set to `'open_access_unrestricted'`

### Infinite Redirect Loop

**Problem:** Navigation keeps redirecting to login page repeatedly.

**Possible Causes:**
1. Login page doesn't have `skipAuth: true`
2. `authChecker` returns false even after successful login (check token storage)
3. `unauthenticatedRedirect` path points to a protected route

### Authorization Check Not Running

**Problem:** `authorizationCheck` function doesn't execute.

**Solutions:**
1. Ensure `getCurrentUser` is provided if your check uses `currentUser`
2. Check that the function is defined on the route: `authorizationCheck: async (context) => { ... }`
3. Verify the route matches correctly (use browser console to debug)

### Return Path Not Working

**Problem:** After login, user isn't redirected to intended destination.

**Solution:**
Ensure your login page extracts and uses the return path:
```javascript
const params = new URLSearchParams(window.location.search);
const returnPath = params.get('return') || '/';
navigate(returnPath);
```

## Complete Example

See the TAO Audio Orchestrator implementation for a complete working example:
- Route definitions: `orchestrator_ui/routes/routes.js`
- Navigation setup: `orchestrator_ui/index.rofl.js`
- Auth service: `tao_audio_js_core/lib/services/auth/auth-service.js`
- Login page with return path: `orchestrator_ui/elements/auth/login-page.rofl.js`
