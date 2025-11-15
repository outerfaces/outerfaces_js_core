import { navigateToPath } from './navigate-to-path.js';

export function initializeLocationStateEventOverrides(){
  // Prevent multiple initializations
  if (window._outerfaces_initialized) {
    return;
  }
  window._outerfaces_initialized = true;

  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    window.dispatchEvent(new Event('locationchange'));
  };

  history.replaceState = function(...args) {
    originalReplaceState.apply(this, args);
    window.dispatchEvent(new Event('locationchange'));
  };

  // Use consistent variable name: _outerfaces_temp_path
  window.addEventListener('locationchange', () => {
    if (window._outerfaces_temp_path){
      originalPushState.apply(history, [{}, '', window._outerfaces_temp_path]);
      navigateToPath(window._outerfaces_temp_path);
      window._outerfaces_temp_path = undefined;
    } else {
      navigateToPath(window.location.pathname);
    }
  });

  window.addEventListener('popstate', () => {
    navigateToPath(window.location.pathname);
  });
}
