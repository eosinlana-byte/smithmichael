const form = document.querySelector('#contact-form');
const status = document.querySelector('#form-status');
if (form) {
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
}
async function loadManagedContent() {
  const work = document.querySelector('.real-work');
  const testimonials = document.querySelector('.testimonial-grid');
  try {
    const response = await fetch('/api/content');
    if (!response.ok) return;
    const data = await response.json();
    if (work && data.portfolios.length) {
      work.innerHTML = data.portfolios.map((item, index) => {
        const colors = ['jackson-card','okolibooks-card','mirah-card'];
        const tags = String(item.tags || '').split(',').map(tag => tag.trim()).filter(Boolean).map(tag => `<span>${tag}</span>`).join('');
        return `<article class="project"><a class="project-link" href="${escapeHtml(item.url || '#')}" target="_blank" rel="noreferrer"><div class="live-card ${colors[index % colors.length]}">${item.image ? `<img class="portfolio-thumb" src="${item.image}" alt="">` : item.quote ? `<blockquote class="portfolio-quote">“${escapeHtml(item.quote)}”</blockquote>` : ''}<span>${escapeHtml(item.name)}</span><strong>Client website</strong><em>OPEN SITE ↗</em></div></a><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description)}</p><div class="tags">${tags}</div></article>`;
      }).join('');
    }
    if (testimonials && data.testimonials.length) {
      testimonials.innerHTML = data.testimonials.map(item => `<blockquote><p>“${escapeHtml(item.quote)}”</p><cite>${escapeHtml(item.client)}${item.role ? `, ${escapeHtml(item.role)}` : ''}</cite></blockquote>`).join('');
    }
  } catch (_) {}
}
function escapeHtml(value) { return String(value || '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }
loadManagedContent();
const links = [...document.querySelectorAll('nav a[href^="#"]')];
const sections = [...document.querySelectorAll('main section[id]')];
const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) links.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`)); }), { rootMargin: '-35% 0px -55% 0px' });
sections.forEach(section => observer.observe(section));
