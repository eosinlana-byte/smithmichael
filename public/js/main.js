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
    } catch (error) {
      status.textContent = error.message;
    }
  });
}
const links = [...document.querySelectorAll('nav a[href^="#"]')];
const sections = [...document.querySelectorAll('main section[id]')];
const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) links.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
}), { rootMargin: '-35% 0px -55% 0px' });
sections.forEach(section => observer.observe(section));
