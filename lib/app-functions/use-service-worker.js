export function useServiceWorker(pathToFile) {
  let serviceWorkerPath = pathToFile || '/service-worker.js';
  if ('serviceWorker' in navigator) {
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
