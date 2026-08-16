/* FITCOACH Atlas 3D visual layer — preserves the existing interactive muscle map. */
const STYLE_ID = 'fitcoach-atlas-3d-style'

function installStyle() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    .pro12-anatomy{position:relative;overflow:hidden;border-radius:28px;background:radial-gradient(circle at 50% 18%,rgba(255,255,255,.12),transparent 38%),linear-gradient(145deg,#0d1511,#070a08 72%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.06),0 24px 70px rgba(0,0,0,.28)}
    .pro12-anatomy:before{content:"ATLAS 3D • ANATOMIA MUSCULAR";position:absolute;left:18px;top:16px;z-index:4;font-size:10px;letter-spacing:.16em;font-weight:800;color:rgba(255,255,255,.52)}
    .pro12-anatomy svg{filter:drop-shadow(0 22px 28px rgba(0,0,0,.34));transform:scale(1.025);transform-origin:center}
    .pro12-anatomy .muscle{transition:filter .2s ease,opacity .2s ease,transform .2s ease}
    .pro12-anatomy .muscle:hover{filter:brightness(1.25) drop-shadow(0 0 7px rgba(90,210,140,.45));cursor:pointer}
    .pro12-map-labels{z-index:6}
    .pro12-map-labels button{backdrop-filter:blur(12px);box-shadow:0 8px 24px rgba(0,0,0,.2)}
    .pro12-map-labels button.active{box-shadow:0 0 0 1px rgba(105,230,153,.48),0 10px 30px rgba(40,180,100,.18)}
    .pro12-3d-note{display:flex;gap:8px;align-items:center;margin-top:10px;font-size:11px;color:rgba(255,255,255,.52)}
    .pro12-3d-dot{width:7px;height:7px;border-radius:50%;background:#72e3a0;box-shadow:0 0 12px rgba(114,227,160,.8)}
  `
  document.head.appendChild(style)
}

function enhanceAtlas(root=document) {
  installStyle()
  const anatomy = root.querySelector('.pro12-anatomy')
  if (!anatomy || anatomy.dataset.enhanced==='1') return
  anatomy.dataset.enhanced='1'
  const caption = root.querySelector('.pro12-map-caption')
  if (caption && !caption.querySelector('.pro12-3d-note')) {
    const note = document.createElement('div')
    note.className='pro12-3d-note'
    note.innerHTML='<span class="pro12-3d-dot"></span><span>Mapa anatômico interativo • toque em uma região para explorar</span>'
    caption.appendChild(note)
  }
}

const observer = new MutationObserver(()=>enhanceAtlas())
observer.observe(document.documentElement,{childList:true,subtree:true})
window.addEventListener('load',()=>enhanceAtlas())
