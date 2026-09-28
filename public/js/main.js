const youtubeHero = document.querySelector('.hero-youtube');
const sequenceHero = document.querySelector('.hero-sequence');
const sequenceFiles = ['/assets/work-video/video-2.mp4', '/assets/work-video/video-3.mp4', '/assets/work-video/video-4.mp4'];
let sequenceIndex = 0;
let sequenceTimer;
function playNextHeroVideo() {
  if (!sequenceHero) return;
  sequenceHero.src = sequenceFiles[sequenceIndex];
  sequenceHero.load();
  sequenceHero.style.display = 'block';
  if (youtubeHero) youtubeHero.style.display = 'none';
  sequenceHero.play().catch(() => {});
  clearTimeout(sequenceTimer);
  sequenceTimer = setTimeout(() => {
    sequenceIndex = (sequenceIndex + 1) % sequenceFiles.length;
    playNextHeroVideo();
  }, 10000);
}
// Video 1 is the supplied YouTube clip. After ten seconds, continue with videos 2, 3, and 4.
setTimeout(playNextHeroVideo, 10000);

const form = document.querySelector('#contact-form');
const status = document.querySelector('#form-status');
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  status.textContent = 'Saving enquiry...';
  const data = Object.fromEntries(new FormData(form));
  try {
    const response = await fetch('/api/enquiries', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not save enquiry.');
    form.reset();
    status.textContent = 'Enquiry saved. Thank you.';
  } catch (error) { status.textContent = error.message; }
});
const links = [...document.querySelectorAll('nav a[href^="#"]')];
const sections = [...document.querySelectorAll('main section[id]')];
const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) links.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`)); }), { rootMargin: '-35% 0px -55% 0px' });
sections.forEach(section => observer.observe(section));
