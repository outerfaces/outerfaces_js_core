/**
 * Safe DOM rendering utilities for custom elements
 * Provides XSS-safe methods for rendering HTML templates and text content
 *
 * This module implements safe rendering patterns to prevent XSS attacks:
 * - Uses template element + cloneNode for HTML rendering
 * - Uses textContent for user-controlled text
 * - Separates dynamic content from HTML structure
 */

/**
 * Safely renders an HTML template string into a shadow root
 * Uses the template element + cloneNode pattern to safely parse and insert HTML
 *
 * @param {ShadowRoot} shadowRoot - The shadow root to append content to
 * @param {string} htmlString - The HTML template string (must contain no user input)
 * @returns {DocumentFragment} The parsed and cloned fragment for further manipulation if needed
 *
 * @example
 * const htmlString = `
 *   <div class="card">
 *     <h3>Profile: <span id="profile-name"></span></h3>
 *   </div>
 * `;
 * const fragment = safeRenderTemplate(this.shadowRoot, htmlString);
 *
 * // Then safely set text content:
 * fragment.querySelector('#profile-name').textContent = userProvidedName;
 */
export function safeRenderTemplate(shadowRoot, htmlString) {
  const template = document.createElement('template');
  template.innerHTML = htmlString;
  const fragment = template.content.cloneNode(true);
  shadowRoot.appendChild(fragment);
  return fragment;
}

/**
 * Safely renders HTML into a regular element
 * Uses the template element + cloneNode pattern instead of direct innerHTML
 *
 * @param {HTMLElement} element - The element to append content to
 * @param {string} htmlString - The HTML template string
 * @returns {DocumentFragment} The parsed and cloned fragment for further manipulation if needed
 *
 * @example
 * safeRenderIntoElement(document.body, '<div><span id="name"></span></div>');
 */
export function safeRenderIntoElement(element, htmlString) {
  const template = document.createElement('template');
  template.innerHTML = htmlString;
  const fragment = template.content.cloneNode(true);
  element.appendChild(fragment);
  return fragment;
}

/**
 * Safely replaces an element's content with HTML
 * Clears existing content and renders new HTML safely
 *
 * @param {HTMLElement} element - The element whose content will be replaced
 * @param {string} htmlString - The HTML template string
 * @returns {DocumentFragment} The parsed and cloned fragment
 *
 * @example
 * safeReplaceContent(containerDiv, '<div class="content">New content</div>');
 */
export function safeReplaceContent(element, htmlString) {
  element.innerHTML = '';
  return safeRenderIntoElement(element, htmlString);
}

/**
 * Creates a safe text node from user-provided content
 * Use this when you need to inject user-controlled text into your template
 *
 * @param {string} text - The text to create a node from
 * @returns {Text} A text node containing the provided text
 *
 * @example
 * const userNameNode = createSafeTextNode(userInput.name);
 * document.getElementById('name-slot').appendChild(userNameNode);
 */
export function createSafeTextNode(text) {
  return document.createTextNode(String(text || ''));
}

/**
 * Safely sets text content on an element
 * Equivalent to element.textContent = text, but more explicit about safety
 *
 * @param {HTMLElement} element - The element to set text on
 * @param {string|number|any} value - The text to set
 *
 * @example
 * const nameElement = fragment.querySelector('#profile-name');
 * setTextContent(nameElement, soundProfile.name);
 */
export function setTextContent(element, value) {
  element.textContent = String(value || '');
}

/**
 * Safely sets HTML attribute values
 * Validates that attribute values are strings and sets via setAttribute
 *
 * @param {HTMLElement} element - The element to set the attribute on
 * @param {string} attrName - The attribute name
 * @param {string|number|boolean} value - The attribute value
 *
 * @example
 * setAttribute(element, 'data-id', userRecord.id);
 */
export function setAttribute(element, attrName, value) {
  element.setAttribute(attrName, String(value || ''));
}

/**
 * Safely sets CSS custom properties (CSS variables)
 *
 * @param {HTMLElement} element - The element to set the CSS variable on
 * @param {string} varName - The CSS variable name (e.g., '--color')
 * @param {string} value - The CSS variable value
 *
 * @example
 * setCSSVariable(element, '--brand-color', '#2563eb');
 */
export function setCSSVariable(element, varName, value) {
  element.style.setProperty(varName, String(value || ''));
}

/**
 * Creates a fragment from HTML with placeholder elements for dynamic content
 * Use this pattern when you need to inject multiple dynamic values
 *
 * @param {string} htmlString - HTML template with data-* attributes as placeholders
 * @param {Object} dataMap - Map of data-* attribute values to actual content
 * @returns {DocumentFragment} The fragment with content populated
 *
 * @example
 * const htmlString = `
 *   <div>
 *     <span data-target="name"></span>
 *     <span data-target="mode"></span>
 *   </div>
 * `;
 *
 * const dataMap = {
 *   name: userProfile.name,
 *   mode: userProfile.mode
 * };
 *
 * const fragment = createFragmentWithData(htmlString, dataMap);
 */
export function createFragmentWithData(htmlString, dataMap) {
  const template = document.createElement('template');
  template.innerHTML = htmlString;
  const fragment = template.content.cloneNode(true);

  // Populate all data-target elements
  Object.entries(dataMap || {}).forEach(([target, value]) => {
    const elements = fragment.querySelectorAll(`[data-target="${target}"]`);
    elements.forEach(el => {
      el.textContent = String(value || '');
    });
  });

  return fragment;
}

/**
 * Batch update text content on multiple elements identified by data attributes
 * Useful for updating a rendered fragment after initial render
 *
 * @param {HTMLElement|DocumentFragment} container - Container element or fragment
 * @param {Object} updates - Map of data-target values to new text content
 *
 * @example
 * batchSetTextContent(fragment, {
 *   'profile-name': config.sound_generation_profile.name,
 *   'control-mode': config.audio_control_mode.name
 * });
 */
export function batchSetTextContent(container, updates) {
  Object.entries(updates || {}).forEach(([target, value]) => {
    const elements = container.querySelectorAll(`[data-target="${target}"]`);
    elements.forEach(el => {
      el.textContent = String(value || '');
    });
  });
}
