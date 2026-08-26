/* =========================================================
   ToqueFlow — Universal Mobile Menu (drawer premium)
   - Slide-in drawer from right
   - Backdrop with fade
   - Animated hamburger -> X
   - Auto-injected into every <nav>
   ========================================================= */
(function(){
  if (window.__tfMobileMenuLoaded) return;
  window.__tfMobileMenuLoaded = true;

  var css = `
  /* Hamburger button */
  .mobile-toggle{
    display:none;background:rgba(139,92,246,.08);border:1px solid rgba(139,92,246,.2);
    cursor:pointer;width:44px;height:44px;padding:0;border-radius:12px;
    align-items:center;justify-content:center;color:#fff;
    z-index:1001;position:relative;transition:background .2s,border-color .2s;
  }
  .mobile-toggle:hover{background:rgba(139,92,246,.16);border-color:rgba(139,92,246,.4);}
  .mobile-toggle .bars{position:relative;width:20px;height:14px;}
  .mobile-toggle .bars span{
    position:absolute;left:0;display:block;width:100%;height:2px;
    background:#06b6d4;border-radius:2px;
    transition:transform .35s cubic-bezier(.6,.05,.28,1.6),opacity .25s,top .35s,background .25s;
  }
  .mobile-toggle .bars span:nth-child(1){top:0;}
  .mobile-toggle .bars span:nth-child(2){top:6px;}
  .mobile-toggle .bars span:nth-child(3){top:12px;}
  .mobile-toggle.open .bars span{background:#fff;}
  .mobile-toggle.open .bars span:nth-child(1){top:6px;transform:rotate(45deg);}
  .mobile-toggle.open .bars span:nth-child(2){opacity:0;transform:translateX(-12px);}
  .mobile-toggle.open .bars span:nth-child(3){top:6px;transform:rotate(-45deg);}

  /* Backdrop */
  .mobile-backdrop{
    position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(8px);
    -webkit-backdrop-filter:blur(8px);z-index:998;
    opacity:0;pointer-events:none;transition:opacity .35s ease;
  }
  .mobile-backdrop.open{opacity:1;pointer-events:auto;}

  /* Drawer */
  .mobile-drawer{
    position:fixed;top:0;right:0;bottom:0;width:min(360px,88vw);max-width:100vw;
    background:linear-gradient(180deg,#0a0a14 0%,#01010a 100%);
    border-left:1px solid rgba(139,92,246,.2);
    box-shadow:-20px 0 60px rgba(0,0,0,.5);
    z-index:999;transform:translateX(105%);transition:transform .42s cubic-bezier(.7,0,.2,1),visibility .42s;
    display:flex;flex-direction:column;overflow:hidden;
    visibility:hidden;will-change:transform;
  }
  .mobile-drawer.open{transform:translateX(0);visibility:visible;transition:transform .42s cubic-bezier(.7,0,.2,1);}

  .mobile-drawer .md-glow{
    position:absolute;top:-120px;right:-120px;width:280px;height:280px;
    background:radial-gradient(circle,rgba(139,92,246,.25),transparent 70%);
    filter:blur(40px);pointer-events:none;
  }
  .mobile-drawer .md-glow2{
    position:absolute;bottom:-100px;left:-80px;width:240px;height:240px;
    background:radial-gradient(circle,rgba(6,182,212,.18),transparent 70%);
    filter:blur(40px);pointer-events:none;
  }

  .mobile-drawer .md-header{
    padding:22px 24px 18px;border-bottom:1px solid rgba(255,255,255,.06);
    display:flex;align-items:center;justify-content:space-between;position:relative;z-index:1;
  }
  .mobile-drawer .md-brand{
    display:flex;align-items:center;gap:10px;color:#fff;
    font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:17px;letter-spacing:-.3px;
  }
  .mobile-drawer .md-brand-dot{
    width:32px;height:32px;border-radius:9px;
    background:linear-gradient(135deg,#8b5cf6,#06b6d4);
    display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:13px;
  }
  .mobile-drawer .md-close{
    background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);
    color:#fff;width:36px;height:36px;border-radius:10px;cursor:pointer;
    display:flex;align-items:center;justify-content:center;font-size:18px;
    transition:background .2s;
  }
  .mobile-drawer .md-close:hover{background:rgba(255,255,255,.1);}

  .mobile-drawer .md-body{
    flex:1;overflow-y:auto;padding:18px 16px 24px;position:relative;z-index:1;
  }
  .mobile-drawer .md-section{
    font-family:'Space Mono',monospace;font-size:10px;font-weight:600;
    letter-spacing:2px;text-transform:uppercase;color:rgba(244,244,248,.35);
    padding:14px 12px 8px;
  }
  .mobile-drawer .md-link{
    display:flex;align-items:center;justify-content:space-between;
    color:#f4f4f8;text-decoration:none;font-family:'Space Grotesk',sans-serif;
    font-size:16px;font-weight:500;
    padding:13px 14px;border-radius:12px;
    border:1px solid transparent;
    transition:background .2s,border-color .2s,color .2s,transform .2s;
    margin-bottom:2px;
  }
  .mobile-drawer .md-link:hover,
  .mobile-drawer .md-link.active{
    background:rgba(139,92,246,.08);border-color:rgba(139,92,246,.18);
    color:#fff;
  }
  .mobile-drawer .md-link .arrow{
    color:#06b6d4;font-size:14px;opacity:0;transform:translateX(-6px);
    transition:opacity .2s,transform .2s;
  }
  .mobile-drawer .md-link:hover .arrow,
  .mobile-drawer .md-link.active .arrow{opacity:1;transform:translateX(0);}
  .mobile-drawer .md-link .ico{
    font-size:13px;color:rgba(6,182,212,.7);font-family:'Space Mono',monospace;
    margin-right:10px;display:inline-block;width:22px;
  }

  .mobile-drawer .md-footer{
    padding:18px 20px 22px;border-top:1px solid rgba(255,255,255,.06);
    position:relative;z-index:1;
  }
  .mobile-drawer .md-cta{
    display:flex;align-items:center;justify-content:center;gap:8px;
    background:linear-gradient(135deg,#8b5cf6,#06b6d4);
    color:#fff;text-decoration:none;
    padding:15px 22px;border-radius:14px;
    font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:15px;
    box-shadow:0 8px 24px rgba(139,92,246,.35);
    transition:transform .2s,box-shadow .2s;
  }
  .mobile-drawer .md-cta:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(139,92,246,.45);}
  .mobile-drawer .md-tag{
    display:block;text-align:center;margin-top:14px;
    font-family:'Space Mono',monospace;font-size:10px;
    color:rgba(244,244,248,.35);letter-spacing:1px;
  }

  /* Show toggle on mobile */
  @media(max-width:820px){
    .mobile-toggle{display:flex;}
  }
  body.menu-open{overflow:hidden;}

  /* Stagger animation for links */
  .mobile-drawer.open .md-link{
    animation: mdSlide .42s cubic-bezier(.2,.6,.2,1) backwards;
  }
  .mobile-drawer.open .md-link:nth-child(1){animation-delay:.05s;}
  .mobile-drawer.open .md-link:nth-child(2){animation-delay:.08s;}
  .mobile-drawer.open .md-link:nth-child(3){animation-delay:.11s;}
  .mobile-drawer.open .md-link:nth-child(4){animation-delay:.14s;}
  .mobile-drawer.open .md-link:nth-child(5){animation-delay:.17s;}
  .mobile-drawer.open .md-link:nth-child(6){animation-delay:.20s;}
  .mobile-drawer.open .md-link:nth-child(7){animation-delay:.23s;}
  .mobile-drawer.open .md-link:nth-child(8){animation-delay:.26s;}
  @keyframes mdSlide {
    from { opacity:0; transform: translateX(20px); }
    to   { opacity:1; transform: translateX(0); }
  }
  `;

  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  // Determine current page
  var path = (location.pathname.split('/').pop() || '').toLowerCase();

  function isActive(href){
    return path === href.toLowerCase() ||
      (path === '' && href.toLowerCase() === 'toqueflow home.html');
  }

  // Build backdrop
  var backdrop = document.createElement('div');
  backdrop.className = 'mobile-backdrop';
  document.body.appendChild(backdrop);

  // Build drawer
  var drawer = document.createElement('aside');
  drawer.className = 'mobile-drawer';
  drawer.setAttribute('role','dialog');
  drawer.setAttribute('aria-label','Menú de navegación');

  var links = [
    {section:'Navegación'},
    {href:'ToqueFlow Home.html', label:'Inicio', ico:'01'},
    {href:'nosotros.html', label:'Nosotros', ico:'02'},
    {href:'blog.html', label:'Blog', ico:'03'},
    {section:'Servicios'},
    {href:'servicios.html', label:'Todos los Servicios', ico:'→'},
    {href:'agentes-virtuales.html', label:'Agentes Virtuales', ico:'AI'},
    {href:'seguimiento-leads.html', label:'Seguimiento de Leads', ico:'LD'},
    {href:'automatizacion.html', label:'Automatización a Medida', ico:'AT'},
    {section:'Contacto'},
    {href:'contacto.html', label:'Hablemos', ico:'@'}
  ];

  var html = ''
    + '<div class="md-glow"></div>'
    + '<div class="md-glow2"></div>'
    + '<div class="md-header">'
    +   '<div class="md-brand"><span class="md-brand-dot">T</span>ToqueFlow</div>'
    +   '<button class="md-close" aria-label="Cerrar menú">×</button>'
    + '</div>'
    + '<nav class="md-body">';

  links.forEach(function(item){
    if (item.section) {
      html += '<div class="md-section">'+item.section+'</div>';
    } else {
      var active = isActive(item.href) ? ' active' : '';
      html += '<a class="md-link'+active+'" href="'+item.href+'">'
        + '<span><span class="ico">'+item.ico+'</span>'+item.label+'</span>'
        + '<span class="arrow">→</span>'
      + '</a>';
    }
  });

  html += '</nav>'
    + '<div class="md-footer">'
    +   '<a class="md-cta" href="contacto.html">Solicita Demo Gratis →</a>'
    +   '<span class="md-tag">// flow.activated</span>'
    + '</div>';

  drawer.innerHTML = html;
  document.body.appendChild(drawer);

  function open(){
    drawer.classList.add('open');
    backdrop.classList.add('open');
    document.body.classList.add('menu-open');
    document.querySelectorAll('.mobile-toggle').forEach(function(b){
      b.classList.add('open');
      b.setAttribute('aria-expanded','true');
    });
  }
  function close(){
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
    document.body.classList.remove('menu-open');
    document.querySelectorAll('.mobile-toggle').forEach(function(b){
      b.classList.remove('open');
      b.setAttribute('aria-expanded','false');
    });
  }

  // Inject toggle into each <nav>
  document.querySelectorAll('nav').forEach(function(nav){
    if (nav.closest('.mobile-drawer')) return;
    if (nav.querySelector('.mobile-toggle')) return;
    var btn = document.createElement('button');
    btn.className = 'mobile-toggle';
    btn.setAttribute('aria-label','Abrir menú');
    btn.setAttribute('aria-expanded','false');
    btn.innerHTML = '<span class="bars"><span></span><span></span><span></span></span>';
    nav.appendChild(btn);
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      drawer.classList.contains('open') ? close() : open();
    });
  });

  // Close on backdrop, close button, link click, ESC
  backdrop.addEventListener('click', close);
  drawer.querySelector('.md-close').addEventListener('click', close);
  drawer.querySelectorAll('.md-link, .md-cta').forEach(function(a){
    a.addEventListener('click', function(){ setTimeout(close, 80); });
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && drawer.classList.contains('open')) close();
  });
})();
