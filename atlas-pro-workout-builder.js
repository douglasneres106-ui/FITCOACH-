/* FITCOACH Atlas PRO — exercise prescription bridge */
(() => {
 const init=()=>document.querySelectorAll('.fc-atlas-pro').forEach(card=>{if(card.dataset.builder==='1')return;card.dataset.builder='1';
 const b=document.createElement('button');b.className='fc-atlas-prescribe';b.textContent='＋ Adicionar exercício ao treino';
 const s=document.createElement('style');s.textContent=`.fc-atlas-prescribe{position:absolute;z-index:12;left:18px;bottom:58px;border:1px solid rgba(100,210,140,.32);background:rgba(24,82,48,.78);backdrop-filter:blur(12px);color:#fff;border-radius:13px;padding:10px 14px;font-size:11px;font-weight:900;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.25)}.fc-atlas-prescribe:active{transform:scale(.98)}@media(max-width:650px){.fc-atlas-prescribe{left:12px;bottom:52px}}`;document.head.appendChild(s);
 b.onclick=()=>{const name=card.querySelector('.fc-panel-detail h4')?.textContent||'Exercício'; const event=new CustomEvent('fitcoach:add-exercise',{detail:{muscle:name}});window.dispatchEvent(event);b.textContent='✓ Enviado para o treino';setTimeout(()=>b.textContent='＋ Adicionar exercício ao treino',1800)};card.appendChild(b);
 });
 new MutationObserver(init).observe(document.documentElement,{childList:true,subtree:true});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
