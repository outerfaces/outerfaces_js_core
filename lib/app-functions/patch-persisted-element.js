export function patchPersistedElement(
  newPersistentElementInstance,
  persistentContainers
) {
  const existingElementIndex = persistentContainers.findIndex(
    persistentEl =>
      persistentEl.getAttribute('data-outerfaces-persistent') ===
        newPersistentElementInstance.getAttribute('data-outerfaces-persistent')
  );

  if (existingElementIndex !== -1) {
    const existingElement = persistentContainers[existingElementIndex];

    Array.from(newPersistentElementInstance.attributes).forEach(attr => {
      const existingAttrValue = existingElement.getAttribute(attr.name);
      if (existingAttrValue !== attr.value) {
        existingElement.setAttribute(attr.name, attr.value);
      }
    });

    Array.from(existingElement.attributes).forEach(attr => {
      if (!newPersistentElementInstance.hasAttribute(attr.name) && attr.name !== 'data-outerfaces-persistent') {
        existingElement.removeAttribute(attr.name);
      }
    });

    newPersistentElementInstance.parentNode.replaceChild(existingElement, newPersistentElementInstance);

    if (typeof existingElement.refresh === 'function') {
      existingElement.refresh();
    }

    persistentContainers.splice(existingElementIndex, 1);
  }
}