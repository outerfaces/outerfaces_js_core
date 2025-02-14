export default async function loadAndApplyCSS(cssStyleSheet, url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load CSS: ${response.statusText}`);
    const cssText = await response.text();
    return cssStyleSheet.replaceSync(cssText);
  } catch (error) {
    console.error('Error loading CSS:', error);
  }
}
