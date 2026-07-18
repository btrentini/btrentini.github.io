document.addEventListener('DOMContentLoaded', () => {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  const toggle = document.querySelector('.nav-toggle');
  const navigation = document.getElementById('primary-navigation');

  if (toggle && navigation) {
    const closeNavigation = () => {
      navigation.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    };

    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      navigation.classList.toggle('is-open', !isOpen);
      toggle.setAttribute('aria-expanded', String(!isOpen));
    });

    navigation.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeNavigation);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeNavigation();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 820) closeNavigation();
    }, { passive: true });
  }

  document.querySelectorAll('[data-print-page]').forEach((button) => {
    button.addEventListener('click', () => window.print());
  });

  document.querySelectorAll('[data-carousel]').forEach((carousel) => {
    const slides = Array.from(carousel.querySelectorAll('[data-carousel-slide]'));
    const dots = Array.from(carousel.querySelectorAll('[data-carousel-dot]'));
    const previous = carousel.querySelector('[data-carousel-prev]');
    const next = carousel.querySelector('[data-carousel-next]');
    const counter = carousel.querySelector('[data-carousel-index]');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (slides.length < 2 || !previous || !next) return;

    let index = Math.max(0, slides.findIndex((slide) => slide.classList.contains('is-active')));
    let timer = null;
    let pointerInside = false;
    let focusInside = false;
    let touchStartX = null;

    const render = (nextIndex) => {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        const isActive = slideIndex === index;
        slide.classList.toggle('is-active', isActive);
        slide.setAttribute('aria-hidden', String(!isActive));
      });
      dots.forEach((dot, dotIndex) => {
        const isActive = dotIndex === index;
        dot.classList.toggle('is-active', isActive);
        if (isActive) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
      if (counter) counter.textContent = String(index + 1);
    };

    const stop = () => {
      if (timer) window.clearInterval(timer);
      timer = null;
    };

    const start = () => {
      stop();
      if (reduceMotion.matches || pointerInside || focusInside || document.hidden) return;
      timer = window.setInterval(() => render(index + 1), 6500);
    };

    const move = (offset) => {
      render(index + offset);
      start();
    };

    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        render(Number(dot.dataset.carouselDot));
        start();
      });
    });

    carousel.addEventListener('mouseenter', () => {
      pointerInside = true;
      stop();
    });
    carousel.addEventListener('mouseleave', () => {
      pointerInside = false;
      start();
    });
    carousel.addEventListener('focusin', () => {
      focusInside = true;
      stop();
    });
    carousel.addEventListener('focusout', (event) => {
      if (event.relatedTarget && carousel.contains(event.relatedTarget)) return;
      focusInside = false;
      start();
    });
    carousel.addEventListener('touchstart', (event) => {
      touchStartX = event.changedTouches[0]?.clientX ?? null;
      stop();
    }, { passive: true });
    carousel.addEventListener('touchend', (event) => {
      if (touchStartX === null) return;
      const distance = (event.changedTouches[0]?.clientX ?? touchStartX) - touchStartX;
      touchStartX = null;
      if (Math.abs(distance) > 45) render(index + (distance < 0 ? 1 : -1));
      start();
    }, { passive: true });
    document.addEventListener('visibilitychange', start);
    reduceMotion.addEventListener?.('change', start);

    render(index);
    start();
  });
});
