import { navigateToPath } from './navigate-to-path.js';
import { initializeNavigationScroll, notePopState, stateForPush, stateForReplace } from './navigation-scroll.js';

export function initializeLocationStateEventOverrides(){
  // Prevent multiple initializations
  if (window._outerfaces_initialized) {
    return;
  }
  window._outerfaces_initialized = true;

  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  initializeNavigationScroll(originalReplaceState);

  history.pushState = function(state, ...rest) {
    originalPushState.apply(this, [stateForPush(state), ...rest]);
    window.dispatchEvent(new Event('locationchange'));
  };

  history.replaceState = function(state, ...rest) {
    originalReplaceState.apply(this, [stateForReplace(state), ...rest]);
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
      originalPushState.apply(history, [stateForPush({}), '', window._outerfaces_temp_path]);
      navigate(window._outerfaces_temp_path);
      window._outerfaces_temp_path = undefined;
    } else {
      navigate(window.location.pathname);
    }
  });

  window.addEventListener('popstate', (event) => {
    notePopState(event.state);
    navigate(window.location.pathname);
  });
}
