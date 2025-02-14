import { navigateToPath } from './navigate-to-path.js';

export function initializeLocationStateEventOverrides(){
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
  
  window.addEventListener('locationchange', () => {
    if (window._temp_outerfaces_path){
      originalPushState.apply(history, [{}, '', window._temp_outerfaces_path]);
      navigateToPath(window._temp_outerfaces_path);
      window._temp_outerfaces_path = undefined;
    } else {
      navigateToPath(window.location.pathname);
    }
  });
  
  window.addEventListener('popstate', () => {
    navigateToPath(window.location.pathname);
  });  
}
