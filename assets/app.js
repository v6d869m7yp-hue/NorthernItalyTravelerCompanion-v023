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


  // v030.0: resilient images, current-page navigation and back-to-top control.
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


  // v038.0: editorial reveal and active chapter navigation.
  document.documentElement.classList.add('js');
  const revealTargets = document.querySelectorAll([
    '.dashboard-card','.guide-card','.quick-card','.route-card','.reference-card',
    '.signature-section','.feature-split','.villa-signature-grid article',
    '.gallery-grid figure','.destination-tile','.explorer-tile','.milan-section'
  ].join(','));
  revealTargets.forEach(el => el.classList.add('reveal-on-scroll'));
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealTargets.forEach(el => revealObserver.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('is-visible'));
  }

  const jumpLinks = [...document.querySelectorAll('.chapter-jumps a[href^="#"]')];
  const jumpSections = jumpLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if (jumpLinks.length && jumpSections.length && 'IntersectionObserver' in window) {
    const chapterObserver = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting)
        .sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      jumpLinks.forEach(link => link.classList.toggle('is-active', link.getAttribute('href') === '#' + visible.target.id));
    }, { rootMargin: '-22% 0px -58% 0px', threshold: [0.05,0.2,0.45] });
    jumpSections.forEach(section => chapterObserver.observe(section));
  }


  // v038.0: persistent trip toolbar.
  if (!document.querySelector('.companion-toolbar')) {
    const toolbar = document.createElement('nav');
    toolbar.className = 'companion-toolbar'; toolbar.setAttribute('aria-label', 'Trip companion shortcuts');
    const hasMap = document.getElementById('interactive-map');
    toolbar.innerHTML = `<a class="tool-today" href="today.html">Today</a><a class="tool-map" href="${hasMap ? '#interactive-map' : 'map.html'}">Map</a><a class="tool-reservations" href="reservations.html">Bookings</a><a class="tool-practical" href="practical.html">Practical</a><a class="tool-check" href="my-trip.html">My Trip</a>`;
    document.body.appendChild(toolbar);
  }

  // v038.0: Venice route selector with live map highlighting.
  document.querySelectorAll('[data-route-planner]').forEach(planner => {
    const buttons = [...planner.querySelectorAll('[data-route]')];
    const routeLines = [...planner.querySelectorAll('[data-route-line]')];
    const stops = [...planner.querySelectorAll('[data-route-stop]')];
    const title = planner.querySelector('[data-route-title]');
    const description = planner.querySelector('[data-route-description]');
    const routeLink = planner.querySelector('[data-route-link]');
    const routeDetails = {
      icons: { title: 'Icons morning', description: 'Begin at Piazza San Marco before the crowds, then walk toward Rialto for the Grand Canal and market lanes.', href: '#perfect-day' },
      dorsoduro: { title: 'Art afternoon', description: 'Cross the Accademia Bridge, continue through Dorsoduro and finish along the Zattere when the light softens.', href: '#dorsoduro' },
      cannaregio: { title: 'Quiet evening', description: 'Start near the Jewish Ghetto, follow the northern canals and finish among the bacari on Fondamenta della Misericordia.', href: '#cannaregio' }
    };
    const selectRoute = route => {
      const details = routeDetails[route];
      if (!details) return;
      buttons.forEach(button => {
        const active = button.dataset.route === route;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      routeLines.forEach(line => line.classList.toggle('is-active', line.dataset.routeLine === route));
      stops.forEach(stop => {
        const active = (stop.dataset.routeStop || '').split(/\s+/).includes(route);
        stop.classList.toggle('is-route-stop', active);
      });
      title.textContent = details.title;
      description.textContent = details.description;
      routeLink.href = details.href;
      routeLink.setAttribute('aria-label', `Open ${details.title} route`);
    };
    buttons.forEach(button => button.addEventListener('click', () => selectRoute(button.dataset.route)));
    selectRoute(buttons.find(button => button.classList.contains('is-active'))?.dataset.route || 'icons');
  });

  // v038.0: synchronized map markers and accessible full-screen gallery.
  const mapPins = [...document.querySelectorAll('.route-map .map-pin[href^="#"]')];
  if (mapPins.length) {
    const pinSections = mapPins
      .map(pin => ({ pin, section: document.querySelector(pin.getAttribute('href')) }))
      .filter(item => item.section);
    const activatePin = (activePin) => {
      mapPins.forEach(pin => {
        const active = pin === activePin;
        pin.classList.toggle('is-active', active);
        if (active) pin.setAttribute('aria-current', 'location');
        else pin.removeAttribute('aria-current');
      });
    };
    mapPins.forEach(pin => pin.addEventListener('click', () => activatePin(pin)));
    if ('IntersectionObserver' in window) {
      const mapObserver = new IntersectionObserver(entries => {
        const visible = entries.filter(entry => entry.isIntersecting)
          .sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const match = pinSections.find(item => item.section === visible.target);
        if (match) activatePin(match.pin);
      }, { rootMargin: '-28% 0px -55% 0px', threshold: [0.05, 0.2, 0.45] });
      pinSections.forEach(item => mapObserver.observe(item.section));
    }
  }

  const zoomImages = [...document.querySelectorAll('.gallery-grid img, .villa-signature-grid img, .feature-split > img')];
  if (zoomImages.length) {
    const viewer = document.createElement('div');
    viewer.className = 'companion-lightbox';
    viewer.setAttribute('aria-hidden','true');
    viewer.setAttribute('role','dialog');
    viewer.setAttribute('aria-modal','true');
    viewer.setAttribute('aria-label','Image gallery');
    viewer.innerHTML = `
      <button class="lightbox-close" type="button" aria-label="Close image">×</button>
      <button class="lightbox-nav lightbox-prev" type="button" aria-label="Previous image">‹</button>
      <figure><img alt=""><figcaption><span class="lightbox-caption"></span><span class="lightbox-count"></span></figcaption></figure>
      <button class="lightbox-nav lightbox-next" type="button" aria-label="Next image">›</button>`;
    document.body.appendChild(viewer);
    const viewerImage = viewer.querySelector('img');
    const viewerClose = viewer.querySelector('.lightbox-close');
    const previousButton = viewer.querySelector('.lightbox-prev');
    const nextButton = viewer.querySelector('.lightbox-next');
    const caption = viewer.querySelector('.lightbox-caption');
    const count = viewer.querySelector('.lightbox-count');
    let currentIndex = 0;
    let previousFocus = null;

    const imageCaption = image => image.closest('figure')?.querySelector('figcaption')?.textContent?.trim() || image.alt || 'Travel photograph';
    const showImage = index => {
      currentIndex = (index + zoomImages.length) % zoomImages.length;
      const image = zoomImages[currentIndex];
      viewerImage.src = image.currentSrc || image.src;
      viewerImage.alt = image.alt || 'Travel photograph';
      caption.textContent = imageCaption(image);
      count.textContent = `${currentIndex + 1} of ${zoomImages.length}`;
    };
    const openViewer = (image, index) => {
      previousFocus = image;
      showImage(index);
      viewer.classList.add('open');
      viewer.setAttribute('aria-hidden','false');
      document.body.classList.add('lightbox-open');
      viewerClose.focus({preventScroll:true});
    };
    const closeViewer = () => {
      viewer.classList.remove('open');
      viewer.setAttribute('aria-hidden','true');
      document.body.classList.remove('lightbox-open');
      viewerImage.src = '';
      previousFocus?.focus?.({preventScroll:true});
    };
    zoomImages.forEach((image,index) => {
      image.tabIndex = 0;
      image.setAttribute('role','button');
      image.setAttribute('aria-label',`View larger: ${imageCaption(image)}`);
      image.addEventListener('click',() => openViewer(image,index));
      image.addEventListener('keydown',event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openViewer(image,index);
        }
      });
    });
    viewerClose.addEventListener('click',closeViewer);
    previousButton.addEventListener('click',() => showImage(currentIndex - 1));
    nextButton.addEventListener('click',() => showImage(currentIndex + 1));
    viewer.addEventListener('click',event => { if (event.target === viewer) closeViewer(); });
    let touchStartX = 0;
    viewer.addEventListener('touchstart',event => { touchStartX = event.changedTouches[0].clientX; }, {passive:true});
    viewer.addEventListener('touchend',event => {
      const delta = event.changedTouches[0].clientX - touchStartX;
      if (Math.abs(delta) > 55) showImage(currentIndex + (delta < 0 ? 1 : -1));
    }, {passive:true});
    document.addEventListener('keydown',event => {
      if (!viewer.classList.contains('open')) return;
      if (event.key === 'Escape') closeViewer();
      if (event.key === 'ArrowLeft') showImage(currentIndex - 1);
      if (event.key === 'ArrowRight') showImage(currentIndex + 1);
      if (event.key === 'Tab') {
        const controls = [viewerClose, previousButton, nextButton];
        const position = controls.indexOf(document.activeElement);
        if (event.shiftKey && position <= 0) { event.preventDefault(); nextButton.focus(); }
        else if (!event.shiftKey && position === controls.length - 1) { event.preventDefault(); viewerClose.focus(); }
      }
    });
  }


  // v038.0: locally saved favorites and trip progress.
  const FAVORITES_KEY = 'nitc-favorites-v1';
  const readFavorites = () => {
    try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'); }
    catch (error) { return []; }
  };
  const writeFavorites = items => {
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(items)); }
    catch (error) {}
    window.dispatchEvent(new CustomEvent('nitc:favorites-changed'));
  };
  const favoriteId = (page, anchor, title) => `${page}#${anchor || title.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`;
  const pageTitle = document.querySelector('h1')?.textContent?.trim() || document.title.split('|')[0].trim();
  const favoriteTargets = [...document.querySelectorAll('.signature-section[id], .milan-section[id], .villa-card[id], .island-card[id], .guide-card[id]')]
    .filter(section => section.querySelector('h2,h3'));
  favoriteTargets.forEach(section => {
    if (section.querySelector('.favorite-toggle')) return;
    const heading = section.querySelector('h2,h3');
    const title = heading.textContent.trim();
    const page = location.pathname.split('/').pop() || 'index.html';
    const anchor = section.id;
    const id = favoriteId(page, anchor, title);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'favorite-toggle';
    button.dataset.favoriteId = id;
    const sync = () => {
      const active = readFavorites().some(item => item.id === id);
      button.classList.toggle('is-saved', active);
      button.setAttribute('aria-pressed', String(active));
      button.setAttribute('aria-label', active ? `Remove ${title} from favorites` : `Save ${title} to favorites`);
      button.innerHTML = `<span aria-hidden="true">${active ? '★' : '☆'}</span>${active ? 'Saved' : 'Save'}`;
    };
    button.addEventListener('click', () => {
      const items = readFavorites();
      const index = items.findIndex(item => item.id === id);
      if (index >= 0) items.splice(index, 1);
      else items.push({ id, title, pageTitle, href: `${page}#${anchor}`, savedAt: Date.now() });
      writeFavorites(items);
      sync();
    });
    heading.insertAdjacentElement('afterend', button);
    sync();
    window.addEventListener('nitc:favorites-changed', sync);
  });

  const favoriteList = document.querySelector('[data-favorites-list]');
  if (favoriteList) {
    const renderFavorites = () => {
      const items = readFavorites();
      favoriteList.innerHTML = '';
      const count = document.querySelector('[data-favorites-count]');
      if (count) count.textContent = String(items.length);
      if (!items.length) {
        favoriteList.innerHTML = '<div class="empty-state"><h3>No saved places yet</h3><p>Open a destination guide and tap <strong>Save</strong> beside any featured section.</p><a class="cta" href="index.html#destinations">Browse destinations</a></div>';
        return;
      }
      items.sort((a,b) => b.savedAt - a.savedAt).forEach(item => {
        const card = document.createElement('article');
        card.className = 'saved-place-card';
        card.innerHTML = `<div><span>${item.pageTitle}</span><h3><a href="${item.href}">${item.title}</a></h3></div><button type="button" aria-label="Remove ${item.title}">Remove</button>`;
        card.querySelector('button').addEventListener('click', () => writeFavorites(readFavorites().filter(saved => saved.id !== item.id)));
        favoriteList.appendChild(card);
      });
    };
    renderFavorites();
    window.addEventListener('nitc:favorites-changed', renderFavorites);
  }

  document.querySelectorAll('[data-progress-item]').forEach(item => {
    const key = `nitc-progress-${item.dataset.progressItem}`;
    try { item.checked = localStorage.getItem(key) === '1'; } catch(error) {}
    item.addEventListener('change', () => {
      try { localStorage.setItem(key, item.checked ? '1' : '0'); } catch(error) {}
      updateProgress();
    });
  });
  function updateProgress() {
    const boxes = [...document.querySelectorAll('[data-progress-item]')];
    if (!boxes.length) return;
    const complete = boxes.filter(box => box.checked).length;
    const percent = Math.round((complete / boxes.length) * 100);
    document.querySelectorAll('[data-progress-value]').forEach(el => el.textContent = `${complete} of ${boxes.length}`);
    document.querySelectorAll('[data-progress-percent]').forEach(el => el.textContent = `${percent}%`);
    document.querySelectorAll('[data-progress-bar]').forEach(el => el.style.width = `${percent}%`);
  }
  updateProgress();


  // v042.0 — home journey command center.
  const homeProgress = document.querySelector('[data-home-progress]');
  if (homeProgress) {
    const progressKeys = ['venice','dolomites','cinque-terre','lake-como','lake-maggiore','malpensa'];
    let completed = 0;
    try {
      completed = progressKeys.filter(key => localStorage.getItem('nitc-progress-' + key) === '1').length;
      // Support the JSON progress store used by earlier My Trip builds.
      const stored = JSON.parse(localStorage.getItem('nitc-trip-progress-v1') || '{}');
      if (stored && typeof stored === 'object') completed = Math.max(completed, progressKeys.filter(key => stored[key]).length);
    } catch (error) {}
    const percent = Math.round((completed / progressKeys.length) * 100);
    homeProgress.textContent = percent + '%';
    const count = document.querySelector('[data-home-progress-count]');
    if (count) count.textContent = completed + ' of ' + progressKeys.length;

    let favorites = [];
    try { favorites = JSON.parse(localStorage.getItem('nitc-favorites-v1') || '[]'); } catch (error) {}
    const favoriteValue = document.querySelector('[data-home-favorites]');
    if (favoriteValue) favoriteValue.textContent = Array.isArray(favorites) ? favorites.length : 0;

    const days = [
      {date:'Aug 31',title:'Venice arrival',summary:'Arrive, settle in and take the first Grand Canal walk.',href:'today.html?day=0'},
      {date:'Sep 1',title:'Venice icons',summary:'San Marco, Rialto and a quieter evening neighborhood.',href:'today.html?day=1'},
      {date:'Sep 2',title:'Drive to Ortisei',summary:'Leave the lagoon and enter the Dolomites.',href:'today.html?day=2'},
      {date:'Sep 3',title:'Seceda or Alpe di Siusi',summary:'Choose the mountain day according to weather.',href:'today.html?day=3'},
      {date:'Sep 4',title:'Drive to Cinque Terre',summary:'A transfer day ending with a coastal evening.',href:'today.html?day=4'},
      {date:'Sep 5',title:'Cinque Terre villages',summary:'Train, ferry and a moderate stretch of trail.',href:'today.html?day=5'},
      {date:'Sep 6',title:'Drive to Varenna',summary:'Cross northern Italy for a Lake Como evening.',href:'today.html?day=6'},
      {date:'Sep 7',title:'Como ferries and villas',summary:'Varenna, Bellagio and one carefully chosen villa.',href:'today.html?day=7'},
      {date:'Sep 8',title:'Drive to Stresa',summary:'A relaxed transfer to Lake Maggiore.',href:'today.html?day=8'},
      {date:'Sep 9',title:'Borromean Islands',summary:'Palaces, gardens and the final celebratory dinner.',href:'today.html?day=9'},
      {date:'Sep 10',title:'Malpensa departure',summary:'Conservative timing for fuel, car return and check-in.',href:'today.html?day=10'}
    ];
    let selected = 0;
    try { selected = Math.max(0, Math.min(10, Number(localStorage.getItem('nitc-today-day-v1') || 0))); } catch (error) {}
    const title = document.querySelector('[data-home-day-title]');
    const summary = document.querySelector('[data-home-day-summary]');
    if (title) title.textContent = 'Day ' + (selected + 1) + ' · ' + days[selected].title;
    if (summary) summary.textContent = days[selected].summary;
    const upcoming = document.querySelector('[data-home-upcoming]');
    if (upcoming) {
      upcoming.innerHTML = days.slice(selected, Math.min(days.length, selected + 4)).map((day, offset) =>
        `<a href="${day.href}" data-home-day="${selected + offset}"><span>${day.date}</span><strong>${day.title}</strong><small>${day.summary}</small></a>`
      ).join('');
      upcoming.querySelectorAll('[data-home-day]').forEach(link => link.addEventListener('click', () => {
        try { localStorage.setItem('nitc-today-day-v1', link.dataset.homeDay); } catch (error) {}
      }));
    }
  }

})();

  // v042.0: focused travel-day mode with persistent checklist and notes.
  const todaySelect = document.querySelector('[data-today-select]');
  if (todaySelect) {
    const tripDays = [
      {date:'Aug 31',title:'Arrive in Venice',summary:'Keep arrival day intentionally light: settle in, orient yourself by water and save energy for tomorrow.',overnight:'Venice',travel:'Airport or station transfer',priority:'Grand Canal orientation',guide:'venice.html',steps:[['Arrival','Reach Venice','Use the arrival guidance that matches your airport or rail station.','venice.html#arrival'],['Late afternoon','Check in and reset','Leave generous time for luggage, a shower and a first unhurried walk.','hotels.html'],['Early evening','Ride the Grand Canal','Use vaporetto Line 1 as a moving introduction to the city.','venice.html#vaporetto'],['Dinner','Stay close to the hotel','Choose a simple first meal and avoid over-scheduling.','venice.html#food']],checks:['Confirm transfer plan','Keep hotel address available offline','Validate vaporetto ticket','Set tomorrow’s meeting time']},
      {date:'Sept 1',title:'The essential Venice day',summary:'See the icons early, then trade the crowds for Dorsoduro or Cannaregio before blue hour.',overnight:'Venice',travel:'Walking + vaporetto',priority:'Timed-entry sights',guide:'venice.html#perfect-day',steps:[['8:00','St. Mark’s Square','Arrive before the heaviest crowds and begin with the basilica area.','venice.html#san-marco'],['10:00','Doge’s Palace','Use the reserved entry and allow time for the Bridge of Sighs route.','venice.html#doges-palace'],['12:30','Cicchetti lunch','Keep lunch flexible and sample several small stops.','venice.html#food'],['14:30','Choose a quieter district','Dorsoduro for art and water views; Cannaregio for atmosphere.','venice.html#dorsoduro'],['Sunset','Grand Canal blue hour','Finish near a vaporetto stop so the return is effortless.','venice.html#vaporetto']],checks:['Timed-entry confirmations','Comfortable walking shoes','Water bottle','Camera battery charged']},
      {date:'Sept 2',title:'Venice to Ortisei',summary:'A transfer day with a dramatic change of scenery. Collect the car only when leaving Venice.',overnight:'Ortisei',travel:'About 3–4 hours driving',priority:'Smooth car pickup',guide:'dolomites.html',steps:[['Morning','Leave Venice','Allow time for the vaporetto or water taxi connection to the rental location.','venice.html#arrival'],['Late morning','Collect rental car','Photograph the car and confirm toll-road and fuel procedures.','practical.html'],['Midday','Drive north','Pause for lunch before the mountain roads become more demanding.','map.html'],['Afternoon','Arrive in Ortisei','Check in, review lift status and take a short village walk.','dolomites.html#ortisei']],checks:['Rental confirmation','Driver licenses and IDP','Offline route downloaded','Check lift and weather status']},
      {date:'Sept 3',title:'A weather-first Dolomites day',summary:'Use the clearest part of the day for the high plateau or ridgeline, then keep the afternoon flexible.',overnight:'Ortisei',travel:'Lifts + moderate walking',priority:'Morning visibility',guide:'dolomites.html',steps:[['7:30','Check mountain webcams','Choose Seceda or Alpe di Siusi according to visibility and wind.','dolomites.html#weather'],['8:30','First lift up','Earlier access means clearer light and quieter trails.','dolomites.html#perfect-day'],['10:00','Moderate scenic walk','Stay within the group’s comfort level and preserve time for lunch.','dolomites.html#hiking'],['12:30','Rifugio lunch','Order a regional mountain dish and reassess conditions.','dolomites.html#food'],['Afternoon','Flexible second act','Use a valley walk, scenic drive or village time if clouds build.','dolomites.html#drives']],checks:['Lift schedule checked','Rain layer packed','Sun protection','Water and light snack']},
      {date:'Sept 4',title:'Ortisei to Cinque Terre',summary:'This is the longest transfer. Start early, build in a real break and avoid driving into the villages.',overnight:'Cinque Terre area',travel:'Roughly 5–6 hours driving',priority:'Parking strategy',guide:'cinque-terre.html',steps:[['7:30','Depart Ortisei','Leave enough margin for traffic and mountain-road delays.','map.html'],['Late morning','Motorway break','Take a proper coffee and lunch stop rather than pushing through.','practical.html'],['Mid-afternoon','Reach parking or rail gateway','Use the planned garage or hotel parking; continue by train.','cinque-terre.html#transport'],['Evening','First village walk','Keep the evening simple and enjoy the waterfront after day-trippers leave.','cinque-terre.html']],checks:['Parking instructions saved','Fuel before departure','Tolls/payment ready','Hotel arrival time confirmed']},
      {date:'Sept 5',title:'Cinque Terre by train, ferry and trail',summary:'Link the villages efficiently, but leave room to linger rather than treating all five as a checklist.',overnight:'Cinque Terre area',travel:'Train + ferry + walking',priority:'Ferry and trail status',guide:'cinque-terre.html',steps:[['8:00','Start in the quieter village','Use the early hour for photographs and uncrowded lanes.','cinque-terre.html'],['10:00','Village hop by train','Make one or two short stops rather than racing through all five.','cinque-terre.html#transport'],['Midday','Seafood lunch','Choose a harbor or terrace and allow time to enjoy it.','cinque-terre.html#food'],['Afternoon','Ferry or moderate trail','Pick according to sea conditions, heat and energy.','cinque-terre.html#hiking'],['Sunset','Finish at a viewpoint','Position yourself before golden hour, then dine nearby.','cinque-terre.html#photography']],checks:['Trail closures checked','Ferry service checked','Train pass or tickets','Swim gear or hiking layer']},
      {date:'Sept 6',title:'Cinque Terre to Varenna',summary:'Cross northern Italy and arrive in time for a gentle first evening on Lake Como.',overnight:'Varenna',travel:'About 4–5 hours driving',priority:'Lake arrival logistics',guide:'lake-como.html',steps:[['Morning','Leave the coast','Retrieve the car and avoid the worst departure congestion.','cinque-terre.html#transport'],['Midday','Break the drive','Plan one comfortable stop away from motorway service-area crowds.','practical.html'],['Afternoon','Arrive near Varenna','Follow hotel parking instructions carefully; streets can be tight.','lake-como.html#varenna'],['Evening','Waterfront passeggiata','Walk the lakeside path and keep dinner local.','lake-como.html#dining']],checks:['Varenna parking plan','Hotel arrival message','Ferry timetable saved','Camera ready for evening light']},
      {date:'Sept 7',title:'Varenna, Bellagio and the villas',summary:'Anchor the day in Varenna, use ferries rather than the car and avoid trying to visit every villa.',overnight:'Varenna',travel:'Ferries + walking',priority:'First ferry timing',guide:'lake-como.html#perfect-day',steps:[['8:30','Villa Monastero','Walk the gardens before the busiest part of the day.','lake-como.html#villa-monastero'],['11:00','Ferry to Bellagio','Enjoy the crossing and explore beyond the immediate harbor.','lake-como.html#bellagio'],['12:30','Lunch in Bellagio','Reserve or arrive early for a relaxed lakeside meal.','lake-como.html#dining'],['15:00','Choose one second experience','Return to Varenna or add one villa—not both at a rush.','lake-como.html#villas'],['Evening','Varenna at blue hour','The waterfront is especially rewarding after the day crowds depart.','lake-como.html#photography']],checks:['Ferry timetable checked','Villa hours confirmed','Lunch plan','Light layer for boat crossings']},
      {date:'Sept 8',title:'Varenna to Stresa',summary:'A manageable transfer across Lombardy, followed by a relaxed introduction to Lake Maggiore.',overnight:'Stresa',travel:'About 2–3 hours driving',priority:'Avoiding rush-hour routes',guide:'lake-maggiore.html',steps:[['Morning','Depart Varenna','Leave after breakfast but before roads become busy.','map.html'],['Midday','Cross toward Lake Maggiore','Use a scenic or practical lunch stop depending on traffic.','practical.html'],['Afternoon','Check in at Stresa','Park once and explore the lakefront on foot.','lake-maggiore.html'],['Evening','Stresa promenade','Review tomorrow’s island boats and enjoy an early dinner.','lake-maggiore.html#dining']],checks:['Route checked for traffic','Hotel parking details','Island timetable saved','Tomorrow’s weather checked']},
      {date:'Sept 9',title:'The Borromean Islands',summary:'Give the islands enough time for palaces, gardens and boat connections, then celebrate the final night.',overnight:'Stresa',travel:'Boat + walking',priority:'Boat sequence',guide:'lake-maggiore.html',steps:[['9:00','Boat from Stresa','Confirm whether your ticket is hop-on/hop-off and note final returns.','lake-maggiore.html#boats'],['Morning','Isola Bella','Tour the palace and terraced gardens before peak crowds.','lake-maggiore.html#isola-bella'],['Lunch','Isola dei Pescatori','Pause for a lake-fish lunch rather than rushing onward.','lake-maggiore.html#dining'],['Afternoon','Optional second garden stop','Choose according to energy and boat timing.','lake-maggiore.html#islands'],['Evening','Final dinner','Return to Stresa with time to pack calmly for departure.','lake-maggiore.html#dining']],checks:['Boat ticket plan','Island opening hours','Final dinner reservation','Pack most luggage tonight']},
      {date:'Sept 10',title:'Stresa to Malpensa',summary:'Keep the final morning conservative. Airport margin matters more than squeezing in one last stop.',overnight:'Flight home',travel:'About 50–75 minutes driving',priority:'Airport margin',guide:'practical.html#departure',steps:[['Early morning','Check out','Settle the hotel bill and verify nothing remains in the room or safe.','hotels.html'],['Departure','Drive to Malpensa','Allow buffer for traffic, fuel and rental-car return.','practical.html#departure'],['At airport','Return the car','Photograph fuel level and condition before handing over keys.','practical.html#driving'],['Terminal','Check in and relax','Complete VAT or baggage formalities before security if needed.','practical.html#departure']],checks:['Passports and phones','Fuel receipt','Rental return location','Flight terminal confirmed']}
    ];
    const TODAY_DAY_KEY = 'nitc-today-day-v1';
    const stateKey = index => `nitc-today-state-v1-${index}`;
    const dateLabel = document.querySelector('[data-today-date]');
    const title = document.querySelector('[data-today-title]');
    const summary = document.querySelector('[data-today-summary]');
    const guide = document.querySelector('[data-today-guide]');
    const overnight = document.querySelector('[data-today-overnight]');
    const travel = document.querySelector('[data-today-travel]');
    const priority = document.querySelector('[data-today-priority]');
    const timeline = document.querySelector('[data-today-timeline]');
    const checklist = document.querySelector('[data-today-checklist]');
    const notes = document.querySelector('[data-today-notes]');
    const status = document.querySelector('[data-today-save-status]');
    tripDays.forEach((day,index) => {
      const option = document.createElement('option');
      option.value = String(index); option.textContent = `Day ${index + 1} · ${day.date} · ${day.title}`;
      todaySelect.appendChild(option);
    });
    const inferTripDay = () => {
      const now = new Date();
      const start = new Date(now.getFullYear(),7,31);
      const end = new Date(now.getFullYear(),8,10,23,59);
      if (now >= start && now <= end) return Math.min(10,Math.max(0,Math.floor((now-start)/86400000)));
      return Number(localStorage.getItem(TODAY_DAY_KEY) || 0);
    };
    const readState = index => { try{return JSON.parse(localStorage.getItem(stateKey(index))||'{}')}catch(e){return{}} };
    const saveState = (index,state) => { try{localStorage.setItem(stateKey(index),JSON.stringify(state))}catch(e){}; if(status){status.textContent='Saved just now.';clearTimeout(status._timer);status._timer=setTimeout(()=>status.textContent='Saved automatically on this device.',1300)} };
    const renderDay = index => {
      index = Math.max(0,Math.min(tripDays.length-1,index));
      const day = tripDays[index]; const state = readState(index); todaySelect.value=String(index); localStorage.setItem(TODAY_DAY_KEY,String(index));
      dateLabel.textContent=`Day ${index+1} · ${day.date}`; title.textContent=day.title; summary.textContent=day.summary; guide.href=day.guide; overnight.textContent=day.overnight; travel.textContent=day.travel; priority.textContent=day.priority;
      timeline.innerHTML=''; day.steps.forEach((step,stepIndex)=>{const item=document.createElement('article');item.className='today-step'+(state.steps?.[stepIndex]?' is-done':'');item.innerHTML=`<div class="today-time">${step[0]}</div><input class="today-step-check" type="checkbox" aria-label="Mark ${step[1]} complete" ${state.steps?.[stepIndex]?'checked':''}><div><h3>${step[1]}</h3><p>${step[2]}</p><a href="${step[3]}">Open guidance →</a></div>`;item.querySelector('input').addEventListener('change',event=>{const current=readState(index);current.steps=current.steps||{};current.steps[stepIndex]=event.target.checked;saveState(index,current);item.classList.toggle('is-done',event.target.checked)});timeline.appendChild(item)});
      checklist.innerHTML=''; day.checks.forEach((text,checkIndex)=>{const label=document.createElement('label');label.innerHTML=`<input type="checkbox" ${state.checks?.[checkIndex]?'checked':''}><span>${text}</span>`;label.querySelector('input').addEventListener('change',event=>{const current=readState(index);current.checks=current.checks||{};current.checks[checkIndex]=event.target.checked;saveState(index,current)});checklist.appendChild(label)});
      notes.value=state.notes||''; notes.oninput=()=>{const current=readState(index);current.notes=notes.value;saveState(index,current)};
    };
    todaySelect.addEventListener('change',()=>renderDay(Number(todaySelect.value)));
    document.querySelectorAll('[data-day-shift]').forEach(button=>button.addEventListener('click',()=>renderDay(Number(todaySelect.value)+Number(button.dataset.dayShift))));
    renderDay(inferTripDay());
  }

// v042.0 — Private reservation wallet stored locally in the browser.
(() => {
  const form = document.querySelector('[data-reservation-form]');
  if (!form) return;
  const list = document.querySelector('[data-reservation-list]');
  const filter = document.querySelector('[data-reservation-filter]');
  const reset = document.querySelector('[data-reservation-reset]');
  const status = document.querySelector('[data-reservation-status]');
  const count = document.querySelector('[data-reservation-count]');
  const upcomingCount = document.querySelector('[data-reservation-upcoming]');
  const confirmedCount = document.querySelector('[data-reservation-confirmed]');
  const key = 'nitc-reservations-v1';
  const load = () => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch (_) { return []; } };
  const save = items => { try { localStorage.setItem(key, JSON.stringify(items)); } catch (_) {} };
  const escapeHTML = value => String(value || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const validURL = value => { try { const u = new URL(value); return /^https?:$/.test(u.protocol) ? u.href : ''; } catch (_) { return ''; } };
  const dateKey = item => item.date || '9999-12-31';
  const isUpcoming = item => !item.date || new Date(item.date + 'T23:59:59') >= new Date();
  const resetForm = () => { form.reset(); form.elements.id.value = ''; status.textContent = 'Ready for a new reservation.'; };
  const render = () => {
    const items = load().sort((a,b) => dateKey(a).localeCompare(dateKey(b)) || (a.time || '').localeCompare(b.time || ''));
    count.textContent = items.length;
    upcomingCount.textContent = items.filter(isUpcoming).length;
    confirmedCount.textContent = items.filter(item => item.status === 'Confirmed').length;
    const mode = filter.value;
    const shown = items.filter(item => mode === 'all' || (mode === 'upcoming' && isUpcoming(item)) || item.status.toLowerCase() === mode);
    if (!shown.length) {
      list.innerHTML = '<div class="reservation-empty"><h3>No reservations here yet</h3><p>Add a hotel, ticket, restaurant or transportation booking using the form.</p></div>';
      return;
    }
    list.innerHTML = shown.map(item => {
      const d = item.date ? new Date(item.date + 'T12:00:00') : null;
      const day = d ? d.getDate() : '—';
      const month = d ? d.toLocaleDateString(undefined,{month:'short'}) : 'Any';
      const statusClass = item.status.toLowerCase().replace(/\s+/g,'-');
      const url = validURL(item.url);
      return `<article class="reservation-entry" data-reservation-id="${escapeHTML(item.id)}"><div class="reservation-date"><strong>${day}</strong><span>${escapeHTML(month)}</span></div><div><span class="reservation-badge ${statusClass}">${escapeHTML(item.status)}</span><h3>${escapeHTML(item.name)}</h3><div class="reservation-meta"><span>${escapeHTML(item.type)}</span>${item.time?`<span>${escapeHTML(item.time)}</span>`:''}${item.location?`<span>${escapeHTML(item.location)}</span>`:''}${item.contact?`<span>${escapeHTML(item.contact)}</span>`:''}</div>${item.confirmation?`<span class="reservation-code">${escapeHTML(item.confirmation)}</span>`:''}${item.notes?`<p class="reservation-note">${escapeHTML(item.notes)}</p>`:''}</div><div class="reservation-actions">${url?`<a href="${escapeHTML(url)}" target="_blank" rel="noopener">Open link</a>`:''}<button type="button" data-edit>Edit</button><button type="button" class="delete" data-delete>Delete</button></div></article>`;
    }).join('');
  };
  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const items = load();
    const item = { id: data.id || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())), type:data.type, status:data.status, name:data.name.trim(), date:data.date, time:data.time, location:data.location.trim(), confirmation:data.confirmation.trim(), contact:data.contact.trim(), url:data.url.trim(), notes:data.notes.trim() };
    const index = items.findIndex(existing => existing.id === item.id);
    if (index >= 0) items[index] = item; else items.push(item);
    save(items); resetForm(); status.textContent = 'Reservation saved on this device.'; render();
  });
  reset.addEventListener('click', resetForm);
  filter.addEventListener('change', render);
  list.addEventListener('click', event => {
    const card = event.target.closest('[data-reservation-id]'); if (!card) return;
    const items = load(); const item = items.find(entry => entry.id === card.dataset.reservationId); if (!item) return;
    if (event.target.closest('[data-delete]')) { if (confirm(`Delete ${item.name}?`)) { save(items.filter(entry => entry.id !== item.id)); render(); } return; }
    if (event.target.closest('[data-edit]')) {
      Object.entries(item).forEach(([name,value]) => { if (form.elements[name]) form.elements[name].value = value || ''; });
      status.textContent = `Editing ${item.name}.`;
      form.scrollIntoView({behavior:'smooth',block:'start'});
      form.elements.name.focus({preventScroll:true});
    }
  });
  render();
})();

// v042.0: synchronize the adaptive app toolbar with the open page.
(() => {
  const current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const markCurrent = () => {
    document.querySelectorAll('.companion-toolbar a').forEach(link => {
      const target = (link.getAttribute('href') || '').split('#')[0].split('/').pop().toLowerCase();
      if (target && target === current) link.setAttribute('aria-current','page');
      else link.removeAttribute('aria-current');
    });
  };
  markCurrent();
  requestAnimationFrame(markCurrent);
})();
