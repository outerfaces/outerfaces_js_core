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

  // Helper function to navigate using NavigationService if available, otherwise use navigateToPath
  function navigate(pathname) {
    if (window.navigationService) {
      window.navigationService.navigate(pathname);
    } else {
      navigateToPath(pathname);
    }
  }

  // Use consistent variable name: _outerfaces_temp_path
  window.addEventListener('locationchange', () => {
    if (window._outerfaces_temp_path){
      originalPushState.apply(history, [{}, '', window._outerfaces_temp_path]);
      navigate(window._outerfaces_temp_path);
      window._outerfaces_temp_path = undefined;
    } else {
      navigate(window.location.pathname);
    }
  });

  window.addEventListener('popstate', () => {
    navigate(window.location.pathname);
  });
}
