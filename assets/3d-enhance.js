(() => {
  const root = document.documentElement;
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  hero.classList.add('portal-hero');

  const role = hero.querySelector('.hero-role');
  if (role) role.innerHTML = '<span>CREATIVE DESIGNER</span><span class="dot">·</span><span>VIDEO EDITOR</span><span class="dot">·</span><span>AI CREATOR</span>';
  const title = hero.querySelector('h1');
  if (title) title.innerHTML = '<span class="portal-line">I CREATE WHAT</span><span class="portal-line portal-outline">PEOPLE REMEMBER.</span>';

  const scene = document.createElement('div');
  scene.className = 'portal-scene';
  scene.innerHTML = `
    <div class="portal-backtype"><span>FRANK</span><span>CREATIVE</span></div>
    <div class="portal-beam"></div>
    <div class="portal-core"><div class="portal-ring r1"></div><div class="portal-ring r2"></div><div class="portal-ring r3"></div></div>
    <div class="portal-floor"></div><div class="portal-haze"></div>
    <div class="portal-shard s1"></div><div class="portal-shard s2"></div><div class="portal-shard s3"></div>
    <canvas id="portal-particles" aria-hidden="true"></canvas>`;
  hero.prepend(scene);

  const hud = document.createElement('div');
  hud.className = 'portal-hud';
  hud.innerHTML = '<strong class="live">Available for work</strong><span>Based in Thailand</span><span>10+ years experience</span>';
  hero.appendChild(hud);
  const index = document.createElement('div');
  index.className = 'portal-index';
  index.textContent = 'FRANK CREATIVE / PORTFOLIO 2026 / 01';
  hero.appendChild(index);
  const scrollCue = document.createElement('div');
  scrollCue.className = 'portal-scroll';
  scrollCue.innerHTML = '<span>Scroll to enter</span><i></i>';
  hero.appendChild(scrollCue);

  let tx = 0, ty = 0, px = 0, py = 0, currentScrollY = scrollYValue();
  function scrollYValue(){ return window.scrollY || document.documentElement.scrollTop || 0; }
  root.style.setProperty('--px', '0'); root.style.setProperty('--py', '0');
  root.style.setProperty('--hero-progress', '0');

  addEventListener('pointermove', (e) => {
    root.style.setProperty('--mx', `${e.clientX}px`);
    root.style.setProperty('--my', `${e.clientY}px`);
    tx = (e.clientX / innerWidth - .5) * 2;
    ty = (e.clientY / innerHeight - .5) * 2;
  }, {passive:true});
  addEventListener('scroll', () => { currentScrollY = scrollYValue(); }, {passive:true});

  const grid = hero.querySelector('.hero-grid');
  const photo = hero.querySelector('.hero-photo-frame');
  const copy = grid?.firstElementChild;
  function animate(){
    px += (tx - px) * .055; py += (ty - py) * .055;
    const progress = Math.max(0, Math.min(1, currentScrollY / Math.max(hero.offsetHeight * .72, 1)));
    root.style.setProperty('--px', px.toFixed(3)); root.style.setProperty('--py', py.toFixed(3));
    root.style.setProperty('--hero-progress', progress.toFixed(4));
    if (!reduceMotion && !coarse) {
      if (grid) grid.style.transform = `rotateX(${py * -1.15}deg) rotateY(${px * 1.6}deg)`;
      if (photo) photo.style.transform = `perspective(1450px) rotateX(${py * -3.2}deg) rotateY(${px * 5.6}deg) translate3d(${px * 12}px,${py * 8 - progress * 42}px,95px) scale(${1 + progress * .035})`;
      if (copy) copy.style.opacity = String(Math.max(.15, 1 - progress * .88));
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  // Real-time chroma key: uses the supplied green-screen portrait without generating a new image.
  const portrait = photo?.querySelector('img');
  async function removeGreenScreen(img){
    try{
      if (!img.complete) await new Promise((res,rej)=>{img.addEventListener('load',res,{once:true});img.addEventListener('error',rej,{once:true});});
      const maxW = 1080, scale = Math.min(1, maxW / img.naturalWidth);
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement('canvas'); canvas.width=w; canvas.height=h;
      const ctx = canvas.getContext('2d',{willReadFrequently:true}); ctx.drawImage(img,0,0,w,h);
      const frame = ctx.getImageData(0,0,w,h), d=frame.data;
      let greenPixels=0;
      for(let i=0;i<d.length;i+=4){const r=d[i],g=d[i+1],b=d[i+2];if(g-Math.max(r,b)>55)greenPixels++;}
      if(greenPixels/(w*h)<.08) return img.src;
      for(let i=0;i<d.length;i+=4){
        const r=d[i],g=d[i+1],b=d[i+2];
        const ex=g-Math.max(r,b); let key=Math.max(0,Math.min(1,(ex-16)/105)); key=key*key*(3-2*key);
        const alpha=Math.round(255*(1-key));
        if(key>.08) d[i+1]=Math.round(g*(1-key*.82)+Math.min(g,(r+b)/2+8)*(key*.82));
        d[i+3]=alpha<9?0:alpha;
      }
      ctx.putImageData(frame,0,0);
      return await new Promise(resolve=>canvas.toBlob(blob=>resolve(blob?URL.createObjectURL(blob):canvas.toDataURL('image/png')),'image/webp',.92));
    }catch(e){console.warn('Chroma key skipped',e);return img.src;}
  }
  if(portrait){
    removeGreenScreen(portrait).then(src=>{
      portrait.src=src;
      const echo=portrait.cloneNode(); echo.className='portal-echo'; echo.alt=''; echo.setAttribute('aria-hidden','true');
      const outline=portrait.cloneNode(); outline.className='portal-outline-img'; outline.alt=''; outline.setAttribute('aria-hidden','true');
      photo.prepend(outline); photo.prepend(echo);
    });
  }

  // Lightweight depth particles.
  const canvas = document.getElementById('portal-particles');
  if(canvas){
    const ctx=canvas.getContext('2d'); let w=0,h=0,dpr=1,particles=[];
    function resize(){
      const r=hero.getBoundingClientRect(); dpr=Math.min(devicePixelRatio||1,1.6); w=Math.max(1,r.width); h=Math.max(1,hero.offsetHeight);
      canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr); canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;opacity:.64'; ctx.setTransform(dpr,0,0,dpr,0,0);
      const count=Math.min(62,Math.max(24,Math.round(w*h/26000)));
      particles=Array.from({length:count},()=>({x:Math.random()*w,y:Math.random()*h,z:Math.random(),s:.4+Math.random()*1.7,v:.06+Math.random()*.18}));
    }
    resize(); addEventListener('resize',resize,{passive:true});
    function drawParticles(){
      ctx.clearRect(0,0,w,h);
      for(const p of particles){
        p.y-=p.v*(.45+p.z); if(p.y<-8){p.y=h+8;p.x=Math.random()*w;}
        const x=p.x+px*(p.z-.5)*34, y=p.y+py*(p.z-.5)*20;
        ctx.fillStyle=p.z>.72?'rgba(200,56,70,.62)':`rgba(255,255,255,${.12+p.z*.34})`;
        ctx.beginPath();ctx.arc(x,y,p.s*(.55+p.z),0,Math.PI*2);ctx.fill();
      }
      if(!reduceMotion)requestAnimationFrame(drawParticles);
    }
    drawParticles();
  }

  if(!coarse && !reduceMotion){
    document.querySelectorAll('.work-card').forEach(card=>{
      card.addEventListener('pointermove',e=>{
        const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
        card.style.transform=`perspective(1150px) rotateX(${-y*10}deg) rotateY(${x*13}deg) translate3d(0,-9px,42px)`;
      });
      card.addEventListener('pointerleave',()=>card.style.transform='perspective(1150px) rotateX(0) rotateY(0) translate3d(0,0,0)');
    });
  }

  const dockItems=document.querySelectorAll('.dock-item'), sections=[...document.querySelectorAll('section[id]')];
  if(dockItems.length&&sections.length){
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)dockItems.forEach(item=>item.classList.toggle('active',item.dataset.target===entry.target.id));}),{rootMargin:'-42% 0px -48% 0px'});
    sections.forEach(section=>observer.observe(section));
  }
  document.body.classList.add('immersive-ready');
})();
