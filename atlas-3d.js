/* FITCOACH Atlas 3D — real GLB viewer */
const MODEL_VIEWER_SRC='https://ajax.googleapis.com/ajax/libs/model-viewer/4.1.0/model-viewer.min.js';
const MODEL_SRC='https://raw.githubusercontent.com/UMRAM-Bilkent/supine-human-model/main/assets/human_posed.glb';
const STYLE_ID='fitcoach-atlas-real-3d-style';

function installStyle(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement('style');s.id=STYLE_ID;
  s.textContent=`
    .pro12-real3d-wrap{position:relative;width:100%;min-height:420px;border-radius:24px;overflow:hidden;background:radial-gradient(circle at 50% 35%,rgba(114,227,160,.12),rgba(7,10,8,.96) 62%);border:1px solid rgba(255,255,255,.08)}
    .pro12-real3d-wrap model-viewer{width:100%;height:420px;background:transparent;--poster-color:transparent;touch-action:pan-y;}
    .pro12-real3d-controls{position:absolute;left:12px;right:12px;bottom:12px;display:flex;gap:8px;justify-content:center;pointer-events:none}
    .pro12-real3d-controls button{pointer-events:auto;border:1px solid rgba(255,255,255,.12);background:rgba(10,14,12,.86);color:#fff;border-radius:999px;padding:9px 14px;font-size:12px;backdrop-filter:blur(10px)}
    .pro12-real3d-note{display:flex;gap:8px;align-items:center;margin-top:10px;font-size:11px;color:rgba(255,255,255,.58)}
    .pro12-real3d-dot{width:7px;height:7px;border-radius:50%;background:#72e3a0;box-shadow:0 0 12px rgba(114,227,160,.8)}
    @media(max-width:600px){.pro12-real3d-wrap,.pro12-real3d-wrap model-viewer{min-height:390px;height:390px}}
  `;document.head.appendChild(s)
}

function loadViewer(){return new Promise((resolve,reject)=>{
  if(customElements.get('model-viewer'))return resolve();
  const existing=document.querySelector(`script[src="${MODEL_VIEWER_SRC}"]`);
  if(existing){existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true});return}
  const script=document.createElement('script');script.type='module';script.src=MODEL_VIEWER_SRC;script.onload=resolve;script.onerror=reject;document.head.appendChild(script)
})}

async function enhanceAtlas(root=document){
  installStyle();
  const anatomy=root.querySelector('.pro12-anatomy');
  if(!anatomy||anatomy.dataset.real3d==='1')return;
  anatomy.dataset.real3d='1';
  try{await loadViewer()}catch(e){console.error('FITCOACH Atlas 3D viewer failed to load',e);anatomy.dataset.real3d='0';return}

  const oldSvg=anatomy.querySelector('svg');
  const wrap=document.createElement('div');wrap.className='pro12-real3d-wrap';
  const viewer=document.createElement('model-viewer');
  viewer.setAttribute('src',MODEL_SRC);
  viewer.setAttribute('alt','Modelo humano 3D interativo do Atlas Muscular FITCOACH');
  viewer.setAttribute('camera-controls','');
  viewer.setAttribute('touch-action','pan-y');
  viewer.setAttribute('auto-rotate','');
  viewer.setAttribute('rotation-per-second','12deg');
  viewer.setAttribute('interaction-prompt','auto');
  viewer.setAttribute('shadow-intensity','0.7');
  viewer.setAttribute('exposure','0.9');
  viewer.setAttribute('camera-orbit','0deg 78deg 2.8m');
  viewer.setAttribute('field-of-view','30deg');
  wrap.appendChild(viewer);

  const controls=document.createElement('div');controls.className='pro12-real3d-controls';
  controls.innerHTML='<button type="button" data-real3d="front">Frontal</button><button type="button" data-real3d="back">Posterior</button><button type="button" data-real3d="reset">Resetar</button>';
  wrap.appendChild(controls);
  oldSvg?.replaceWith(wrap);

  const setOrbit=side=>viewer.setAttribute('camera-orbit',`${side==='back'?180:0}deg 78deg 2.8m`);
  controls.querySelector('[data-real3d="front"]').onclick=()=>setOrbit('front');
  controls.querySelector('[data-real3d="back"]').onclick=()=>setOrbit('back');
  controls.querySelector('[data-real3d="reset"]').onclick=()=>{setOrbit('front');viewer.setAttribute('camera-target','0m 0.9m 0m');viewer.setAttribute('camera-orbit','0deg 78deg 2.8m')};

  const caption=root.querySelector('.pro12-map-caption');
  if(caption&&!caption.querySelector('.pro12-real3d-note')){const n=document.createElement('div');n.className='pro12-real3d-note';n.innerHTML='<span class="pro12-real3d-dot"></span><span>Modelo 3D real • gire com o dedo • pinça para zoom</span>';caption.appendChild(n)}
}

new MutationObserver(()=>enhanceAtlas()).observe(document.documentElement,{childList:true,subtree:true});
addEventListener('load',()=>enhanceAtlas());
