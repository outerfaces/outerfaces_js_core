export function useServiceWorker(pathToFile) {
  let serviceWorkerPath = pathToFile || '/service-worker.js';
  if ('serviceWorker' in navigator) {
    // Listen for messages from service worker (e.g., force reload on rev mismatch)
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'FORCE_RELOAD') {
        console.log('[SW] Received force reload message:', event.data.reason);
        // Reload the page (preserves current URL, including any navigation in progress)
        window.location.reload();
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
