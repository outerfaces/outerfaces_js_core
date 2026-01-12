export function useServiceWorker(pathToFile) {
  const serviceWorkerPath = pathToFile || '/service-worker.js';
  if ('serviceWorker' in navigator) {
    // Listen for messages from service worker (e.g., force reload on rev mismatch)
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'FORCE_RELOAD') {
        console.log('[SW] Received force reload message:', event.data.reason);
        // Let the app decide how to handle a reload request
        window.dispatchEvent(new CustomEvent('outerfaces:force_reload', { detail: event.data }));
      }
    });

    window.addEventListener('load', () => {
        navigator.serviceWorker.register(serviceWorkerPath)
            .then(registration => {
                console.info('Service Worker registered with scope:', registration.scope);
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    });
  }
}
