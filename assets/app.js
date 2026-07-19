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



  // v028.5a trip dashboard and locally saved reservation checklist.
  const countdown = document.querySelector('[data-trip-countdown]');
  const dashboard = document.querySelector('[data-trip-dashboard]');
  const tripDays = [
    {start:'2026-08-31',end:'2026-09-01',title:'Venice',summary:'Arrive, settle in and explore the Grand Canal, San Marco and quieter evening streets.',link:'venice.html'},
    {start:'2026-09-02',end:'2026-09-03',title:'Ortisei · Dolomites',summary:'Mountain lifts, moderate walks and broad views across Val Gardena.',link:'dolomites.html'},
    {start:'2026-09-04',end:'2026-09-05',title:'Cinque Terre',summary:'Move among the five villages by train, ferry and coastal paths.',link:'cinque-terre.html'},
    {start:'2026-09-06',end:'2026-09-07',title:'Varenna · Lake Como',summary:'Villa Monastero, Bellagio ferries and relaxed lakefront evenings.',link:'lake-como.html'},
    {start:'2026-09-08',end:'2026-09-09',title:'Stresa · Lake Maggiore',summary:'Borromean Islands, gardens and an easy final lakeside chapter.',link:'lake-maggiore.html'},
    {start:'2026-09-10',end:'2026-09-10',title:'Malpensa departure',summary:'Early departure for Milan Malpensa Airport.',link:'practical.html'}
  ];
  const localDate = (value) => new Date(value + 'T12:00:00');
  const today = new Date(); today.setHours(12,0,0,0);
  if (countdown) {
    const start = localDate(countdown.dataset.start);
    const days = Math.ceil((start - today) / 86400000);
    const strong = countdown.querySelector('strong'); const label = countdown.querySelector('span');
    if (days > 0) { strong.textContent = days; label.textContent = days === 1 ? 'day until Venice' : 'days until Venice'; }
    else if (days >= -10) { strong.textContent = 'Now'; label.textContent = 'your journey is underway'; }
    else { strong.textContent = '2026'; label.textContent = 'journey archive'; }
  }
  if (dashboard) {
    const current = tripDays.find(d => today >= localDate(d.start) && today <= localDate(d.end));
    const upcoming = tripDays.find(d => today < localDate(d.start));
    const selected = current || upcoming || tripDays[tripDays.length-1];
    const dateEl = dashboard.querySelector('[data-today-date]');
    const titleEl = dashboard.querySelector('[data-today-title]');
    const summaryEl = dashboard.querySelector('[data-today-summary]');
    const linkEl = dashboard.querySelector('[data-today-link]');
    const overnightEl = dashboard.querySelector('[data-next-overnight]');
    if (dateEl) dateEl.textContent = current ? 'Today on your journey' : (upcoming ? 'Next destination' : 'Journey complete');
    if (titleEl) titleEl.textContent = selected.title;
    if (summaryEl) summaryEl.textContent = selected.summary;
    if (linkEl) linkEl.href = selected.link;
    if (overnightEl) overnightEl.textContent = selected.title.replace(' · Dolomites','').replace(' · Lake Como','').replace(' · Lake Maggiore','');
    document.querySelectorAll('[data-route-day]').forEach(el => {
      const day = tripDays.find(d => d.start === el.dataset.routeDay);
      if (day && today >= localDate(day.start) && today <= localDate(day.end)) el.classList.add('is-current');
    });
  }
  document.querySelectorAll('[data-save-check]').forEach(box => {
    const key = 'nitc-check-' + box.dataset.saveCheck;
    try { box.checked = localStorage.getItem(key) === '1'; box.addEventListener('change',()=>localStorage.setItem(key,box.checked?'1':'0')); } catch(e) {}
  });


  // v028.5c: resilient images, current-page navigation and back-to-top control.
  const fallbackImage = 'assets/images/milan-hero.svg';
  document.querySelectorAll('img').forEach((image) => {
    image.addEventListener('error', () => {
      if (image.dataset.fallbackApplied === '1') return;
      image.dataset.fallbackApplied = '1';
      image.classList.add('remote-image-fallback');
      image.src = fallbackImage;
      image.alt = image.alt ? `${image.alt} — photograph unavailable offline` : 'Photograph unavailable offline';
      const parent = image.closest('figure, .feature-media, .guide-image, .villa-card, .island-card');
      if (parent && !parent.querySelector('.image-fallback-note')) {
        const note = document.createElement('span');
        note.className = 'image-fallback-note';
        note.textContent = 'Photo unavailable; the guide content remains available.';
        parent.appendChild(note);
      }
    }, { once: true });
  });

  const currentFile = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav a, .bottomnav a').forEach((link) => {
    const target = (link.getAttribute('href') || '').split('#')[0].split('/').pop().toLowerCase();
    if (target && target === currentFile) link.setAttribute('aria-current', 'page');
  });

  const backToTop = document.createElement('button');
  backToTop.type = 'button';
  backToTop.className = 'back-to-top';
  backToTop.setAttribute('aria-label', 'Back to top');
  backToTop.textContent = '↑';
  document.body.appendChild(backToTop);
  const syncBackToTop = () => backToTop.classList.toggle('visible', window.scrollY > 700);
  window.addEventListener('scroll', syncBackToTop, { passive: true });
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  syncBackToTop();

})();
