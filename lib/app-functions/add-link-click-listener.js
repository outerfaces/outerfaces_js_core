export function addLinkClickListener(element, targetAttribute = 'outerfaces-link'){
  element.addEventListener('click', function (event) {
    const link = event.target.closest(`a[href][${targetAttribute}]`);

    if (link) {
      event.preventDefault();
      const href = link.getAttribute('href');

      window.history.pushState({}, '', href);
    }
  });
}
