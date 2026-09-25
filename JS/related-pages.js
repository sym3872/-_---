const root = document.documentElement;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reducedMotion) {
  root.classList.add('motion-enabled');
  requestAnimationFrame(() => root.classList.add('page-ready'));
}

document.querySelectorAll('.related-footer-status, .float-note, .start-tag, .quote-stat span').forEach((element) => element.remove());
document.querySelectorAll('.related-footer').forEach((footer) => footer.setAttribute('data-reveal', ''));
const revealTargets = document.querySelectorAll('[data-reveal]');
if (!reducedMotion && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => entry.target.classList.toggle('is-visible', entry.isIntersecting));
  }, { rootMargin: '0px 0px -10% 0px', threshold: .12 });
  revealTargets.forEach((target) => observer.observe(target));
} else {
  revealTargets.forEach((target) => target.classList.add('is-visible'));
}

const playground = document.querySelector('.moment-playground');
const playButton = document.querySelector('.moment-play');

playButton?.addEventListener('click', () => {
  playground?.classList.toggle('is-awake');
  playButton.setAttribute('aria-pressed', String(playground?.classList.contains('is-awake')));
});
