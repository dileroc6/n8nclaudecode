// ─────────────────────────────────────────
//  Shared site behavior — Que Dice Mi Perro
// ─────────────────────────────────────────

// Header scrolled state
const header = document.querySelector('.site-header');
if (header){
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

// Mobile menu
const menuBtn = document.querySelector('.menu-btn');
const mobileNav = document.getElementById('mobileNav');
if (menuBtn && mobileNav){
  const closeBtn = mobileNav.querySelector('.close');
  menuBtn.addEventListener('click', () => mobileNav.classList.add('open'));
  closeBtn?.addEventListener('click', () => mobileNav.classList.remove('open'));
  mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileNav.classList.remove('open')));
}

// Highlight current nav link based on filename
(function highlightCurrent(){
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav.primary a, .mobile-nav a').forEach(a => {
    const href = a.getAttribute('href');
    if (!href) return;
    if (href === path || (path === '' && href === 'index.html') || (path === 'index.html' && href === 'index.html')){
      a.classList.add('current');
    }
  });
})();

// Reveals on scroll
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting){
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// Tabs (precios)
function activateTab(tabName) {
  const btn = document.querySelector(`.tab[data-tab="${tabName}"]`);
  if (!btn) return false;
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t === btn);
    t.setAttribute('aria-selected', t === btn);
  });
  document.querySelectorAll('.tab-panel').forEach(p => {
    p.classList.toggle('active', p.id === 'panel-' + tabName);
  });
  return true;
}

document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => activateTab(btn.dataset.tab));
});

// Activate tab from URL hash on load (e.g. precios.html#dias)
(function() {
  const tabName = location.hash.replace('#', '');
  if (activateTab(tabName)) {
    const section = document.querySelector('.pricing');
    if (section) section.scrollIntoView({ behavior: 'instant' });
  }
})();

// FAQ acordeón
document.querySelectorAll('.faq-item').forEach(item => {
  const btn = item.querySelector('.faq-q');
  const ans = item.querySelector('.faq-a');
  btn.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(other => {
      other.classList.remove('open');
      other.querySelector('.faq-a').style.maxHeight = '0px';
    });
    if (!isOpen){
      item.classList.add('open');
      ans.style.maxHeight = ans.scrollHeight + 'px';
    }
  });
});

// Form → WhatsApp
const reserveForm = document.getElementById('reserveForm');
if (reserveForm){
  reserveForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const nombre = fd.get('nombre') || '';
    const perro = fd.get('perro') || '';
    const servicio = fd.get('servicio') || 'guardería';
    const mensaje = fd.get('mensaje') || '';
    const text =
      `¡Hola! Soy ${nombre} 🐾%0A` +
      `Quiero reservar *${servicio}* para mi peludo *${perro}*.%0A%0A` +
      (mensaje ? `📝 ${mensaje}%0A%0A` : '') +
      `(Enviado desde el sitio web)`;
    window.open(`https://wa.me/573112146996?text=${text}`, '_blank');
  });
}

// Polaroids: carrusel automático infinito (clona contenidos para loop seamless)
(function(){
  const el = document.getElementById('polaroids');
  if (!el) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;
  const originals = Array.from(el.children);
  originals.forEach(node => {
    const clone = node.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    el.appendChild(clone);
  });
  el.classList.add('carousel');
})();

// Hero animation (only on home)
window.addEventListener('load', () => {
  if (!document.getElementById('heroTitle')) return;
  if (typeof gsap === 'undefined') return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from('.hero-eyebrow',   { y: 18, opacity: 0, duration: .8, delay: .15 })
    .from('#heroTitle .word',{ y: 60, opacity: 0, rotateX: -30, stagger: .09, duration: 1 }, "-=.5")
    .from('.hero-sub',       { y: 22, opacity: 0, duration: .8 }, "-=.6")
    .from('.hero-ctas',      { y: 22, opacity: 0, duration: .7 }, "-=.6")
    .from('.hero-stats .stat', { y: 22, opacity: 0, stagger: .12, duration: .7 }, "-=.5")
    .from('.hero-visual',    { scale: .85, opacity: 0, duration: 1.2, ease: "back.out(1.4)" }, "-=1.6")
    .from('.bubble',         { scale: 0, opacity: 0, stagger: .12, duration: .7, ease: "back.out(1.7)" }, "-=.8");

  document.querySelectorAll('.counter').forEach(el => {
    const target = +el.dataset.target;
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 1.4, ease: "power2.out", delay: 1.45,
      onUpdate: () => el.textContent = Math.round(obj.v)
    });
  });

  if (window.ScrollTrigger){
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray('.float-decor').forEach((el, i) => {
      gsap.to(el, {
        yPercent: -10 - (i % 3) * 8,
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
      });
    });
  }
});
