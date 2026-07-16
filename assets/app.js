(() => {
  const toggles = document.querySelectorAll('.menu-toggle');

  function closeMenu(button, nav) {
    nav.classList.remove('open');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Open navigation');
    button.textContent = 'Menu';
    document.body.classList.remove('nav-open');
  }

  toggles.forEach((button) => {
    const nav = button.parentElement.querySelector('.nav');
    if (!nav) return;

    button.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      button.textContent = open ? 'Close' : 'Menu';
      document.body.classList.toggle('nav-open', open);
      if (open) nav.querySelector('a')?.focus({ preventScroll: true });
    });

    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeMenu(button, nav);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.classList.contains('open')) {
        closeMenu(button, nav);
        button.focus();
      }
    });

    document.addEventListener('click', (event) => {
      if (nav.classList.contains('open') && !button.parentElement.contains(event.target)) {
        closeMenu(button, nav);
      }
    });
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1400) {
      toggles.forEach((button) => {
        const nav = button.parentElement.querySelector('.nav');
        if (nav) closeMenu(button, nav);
      });
    }
  }, { passive: true });

  // Make existing chapter-spread lightboxes keyboard and screen-reader friendly.
  const zoomableImages = document.querySelectorAll('.spread img, .page-spread img');
  zoomableImages.forEach((image) => {
    image.setAttribute('role', 'button');
    image.setAttribute('tabindex', '0');
    image.setAttribute('aria-label', `View larger: ${image.alt || 'chapter image'}`);
    image.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        image.click();
      }
    });
  });

  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    const closeButton = lightbox.querySelector('button');
    let returnFocus = null;

    const syncLightboxState = () => {
      const open = lightbox.classList.contains('open');
      lightbox.setAttribute('aria-hidden', String(!open));
      document.body.classList.toggle('lightbox-open', open);
      if (open) {
        returnFocus = document.activeElement;
        closeButton?.focus({ preventScroll: true });
      } else if (returnFocus instanceof HTMLElement) {
        returnFocus.focus({ preventScroll: true });
        returnFocus = null;
      }
    };

    new MutationObserver(syncLightboxState).observe(lightbox, {
      attributes: true,
      attributeFilter: ['class']
    });
    syncLightboxState();
  }

})();
