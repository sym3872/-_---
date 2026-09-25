const root = document.documentElement;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reducedMotion) {
  root.classList.add('motion-enabled');
  requestAnimationFrame(() => root.classList.add('page-ready'));
}

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
const playMessage = document.querySelector('[data-play-message]');
const messages = ['오늘의 작은 빛을 깨워볼까요?', '마음이 닿는 곳에 부드러운 빛이 번져요.', '잠깐의 움직임도 오늘을 바꿔요.'];
let messageIndex = 0;

playButton?.addEventListener('click', () => {
  playground?.classList.toggle('is-awake');
  messageIndex = (messageIndex + 1) % messages.length;
  if (playMessage) playMessage.textContent = messages[messageIndex];
  playButton.setAttribute('aria-pressed', String(playground?.classList.contains('is-awake')));
});
