/* FITCOACH Atlas 3D — professional UX layer v5 */
(() => {
  const URL3D = 'https://jixiangying.github.io/anatomy/';
  const init = () => {
    const root = document.querySelector('.pro12-anatomy');
    if (!root || root.dataset.professionalAtlas === '5') return;
    root.dataset.professionalAtlas = '5';
    const host = document.createElement('section');
    host.className = 'fc-atlas-pro';
    host.innerHTML = `
      <header class="fc-atlas-head">
        <div><span class="fc-kicker">FITCOACH PRO</span><h3>Atlas Anatômico 3D</h3><p>Explore músculos, estruturas e movimentos em 360°.</p></div>
        <div class="fc-atlas-actions"><button data-fc="open">Tela cheia</button><button data-fc="reset">Recarregar</button></div>
      </header>
      <div class="fc-atlas-view"><div class="fc-atlas-loading"><strong>Atlas 3D</strong><span>Pronto para explorar</span><button data-fc="start">Abrir modelo 3D</button></div><iframe title="Atlas anatômico 3D FITCOACH" loading="lazy" allow="fullscreen" allowfullscreen></iframe></div>
      <footer class="fc-atlas-foot"><span>↔ Arraste para girar</span><span>⌕ Pinça para aproximar</span><span>● Estruturas interativas</span></footer>`;
    const style = document.createElement('style');
    style.textContent = `.fc-atlas-pro{margin-top:18px;border:1px solid rgba(255,255,255,.12);border-radius:26px;overflow:hidden;background:#07100b;color:#fff;box-shadow:0 20px 60px rgba(0,0,0,.28)}.fc-atlas-head{display:flex;justify-content:space-between;gap:16px;padding:20px 22px;background:linear-gradient(180deg,rgba(255,255,255,.06),transparent)}.fc-kicker{font-size:10px;font-weight:900;letter-spacing:.14em;opacity:.65}.fc-atlas-head h3{margin:5px 0 4px;font-size:21px}.fc-atlas-head p{margin:0;font-size:12px;opacity:.62}.fc-atlas-actions{display:flex;gap:8px;align-items:flex-start}.fc-atlas-actions button,.fc-atlas-loading button{border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.07);color:#fff;border-radius:12px;padding:9px 12px;font-weight:800;font-size:11px;cursor:pointer}.fc-atlas-view{position:relative;height:610px;background:radial-gradient(circle at 50% 45%,rgba(74,176,112,.14),transparent 38%),#030604}.fc-atlas-view iframe{width:100%;height:100%;border:0;display:block;opacity:0;transition:opacity .25s}.fc-atlas-view.loaded iframe{opacity:1}.fc-atlas-loading{position:absolute;inset:0;z-index:2;display:grid;place-content:center;justify-items:center;gap:8px;text-align:center}.fc-atlas-loading strong{font-size:18px}.fc-atlas-loading span{font-size:12px;opacity:.58}.fc-atlas-loading button{margin-top:8px;background:rgba(100,210,140,.14)}.fc-atlas-view.loaded .fc-atlas-loading{display:none}.fc-atlas-foot{display:flex;gap:18px;padding:12px 18px;font-size:10px;opacity:.55;border-top:1px solid rgba(255,255,255,.08)}@media(max-width:650px){.fc-atlas-head{display:block}.fc-atlas-actions{margin-top:12px}.fc-atlas-view{height:520px}.fc-atlas-foot{flex-wrap:wrap;gap:10px}}`;
    document.head.appendChild(style);
    root.replaceChildren(host);
    const frame = host.querySelector('iframe');
    const view = host.querySelector('.fc-atlas-view');
    const start = host.querySelector('[data-fc="start"]');
    let started = false;
    const load = () => { if (started) return; started = true; start.textContent='Carregando…'; frame.src=URL3D; frame.addEventListener('load',()=>view.classList.add('loaded'),{once:true}); };
    start.addEventListener('click',load);
    host.querySelector('[data-fc="open"]').addEventListener('click',()=>window.open(URL3D,'_blank','noopener,noreferrer'));
    host.querySelector('[data-fc="reset"]').addEventListener('click',()=>{ frame.src=''; started=false; view.classList.remove('loaded'); start.textContent='Abrir modelo 3D'; });
  };
  new MutationObserver(init).observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
