const DIGITAL_PRODUCTS = [
  { id:'hipertrofia-8', title:'Programa Hipertrofia — 8 semanas', category:'Treino', price:'R$ 29,90', description:'Programa estruturado de 8 semanas para organização e progressão de treinos.', tag:'Mais vendido' },
  { id:'emagrecimento-30', title:'Programa Treino — 30 dias', category:'Treino', price:'R$ 24,90', description:'Calendário de 30 dias com sessões organizadas para manter consistência.', tag:'Novo' },
  { id:'mobilidade-21', title:'Mobilidade — 21 dias', category:'Performance', price:'R$ 19,90', description:'Rotina progressiva de mobilidade para complementar o treinamento.', tag:'Prático' },
  { id:'planner-30', title:'Planner Fitness — 30 dias', category:'Organização', price:'R$ 14,90', description:'Planner digital para metas, treinos, cargas, hábitos e acompanhamento.', tag:'Digital' },
  { id:'fichas-50', title:'Biblioteca — 50 fichas de treino', category:'Personal', price:'R$ 39,90', description:'Coleção de modelos editáveis para agilizar a montagem de treinos.', tag:'Pro' },
  { id:'avaliacao', title:'Kit de avaliação física digital', category:'Personal', price:'R$ 19,90', description:'Modelos digitais para organizar medidas, registros e acompanhamento do aluno.', tag:'Profissional' }
]

const STYLE_ID='fitcoach-digital-products-style'
const PANEL_ID='fitcoach-digital-products'

function installDigitalProductsStyle(){
  if(document.getElementById(STYLE_ID)) return
  const style=document.createElement('style')
  style.id=STYLE_ID
  style.textContent=`
    .fc-products-btn{width:100%;display:flex;align-items:center;gap:10px;border:0;background:transparent;color:inherit;padding:12px 14px;border-radius:12px;cursor:pointer;font:inherit;text-align:left}
    .fc-products-btn:hover,.fc-products-btn.active{background:rgba(114,227,160,.10);color:#72e3a0}
    .fc-products-btn .fc-products-icon{width:28px;text-align:center;font-size:17px}
    .fc-products-panel{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.68);backdrop-filter:blur(10px);display:grid;place-items:center;padding:20px}
    .fc-products-card{width:min(1080px,100%);max-height:min(88vh,900px);overflow:auto;background:#0b100d;color:#fff;border:1px solid rgba(255,255,255,.09);border-radius:24px;box-shadow:0 24px 80px rgba(0,0,0,.45);padding:26px}
    .fc-products-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:22px}
    .fc-products-kicker{font-size:11px;letter-spacing:.15em;font-weight:800;opacity:.55}
    .fc-products-head h2{margin:6px 0 6px;font-size:30px;line-height:1.05}
    .fc-products-head p{margin:0;color:rgba(255,255,255,.62);max-width:680px}
    .fc-products-close{border:0;background:rgba(255,255,255,.07);color:#fff;width:40px;height:40px;border-radius:12px;font-size:22px;cursor:pointer}
    .fc-products-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
    .fc-product{border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.035);border-radius:18px;padding:18px;display:flex;flex-direction:column;min-height:245px}
    .fc-product-top{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:15px}
    .fc-product-category{font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#72e3a0;font-weight:800}
    .fc-product-tag{font-size:10px;padding:5px 8px;border-radius:999px;background:rgba(114,227,160,.10);color:#72e3a0;font-weight:800}
    .fc-product h3{margin:0 0 9px;font-size:18px;line-height:1.2}
    .fc-product p{margin:0;color:rgba(255,255,255,.62);font-size:13px;line-height:1.5;flex:1}
    .fc-product-bottom{display:flex;align-items:end;justify-content:space-between;gap:12px;margin-top:18px}
    .fc-product-price{font-size:20px;font-weight:900}
    .fc-product-buy{border:0;background:#72e3a0;color:#07100b;border-radius:11px;padding:10px 13px;font-weight:900;cursor:pointer}
    .fc-products-note{margin-top:16px;padding:13px 15px;border-radius:14px;background:rgba(255,255,255,.035);color:rgba(255,255,255,.55);font-size:12px;line-height:1.5}
    @media(max-width:800px){.fc-products-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.fc-products-card{padding:20px}}
    @media(max-width:560px){.fc-products-panel{padding:10px}.fc-products-card{border-radius:18px;padding:16px}.fc-products-grid{grid-template-columns:1fr}.fc-products-head h2{font-size:24px}}
  `
  document.head.appendChild(style)
}

function closeDigitalProducts(){document.getElementById(PANEL_ID)?.remove()}
window.closeDigitalProducts=closeDigitalProducts

function requestDigitalProduct(productId){
  const product=DIGITAL_PRODUCTS.find(p=>p.id===productId)
  if(!product) return
  const requests=JSON.parse(localStorage.getItem('fitcoach_digital_product_interest')||'[]')
  requests.push({productId,createdAt:new Date().toISOString()})
  localStorage.setItem('fitcoach_digital_product_interest',JSON.stringify(requests.slice(-30)))
  const button=document.querySelector(`[data-digital-buy="${productId}"]`)
  if(button){button.textContent='Solicitado ✓';button.disabled=true}
  const note=document.querySelector('.fc-products-note')
  if(note) note.textContent=`Produto selecionado: ${product.title}. O catálogo já registrou seu interesse. Conecte um checkout (Stripe/Mercado Pago) para transformar este botão em compra automática.`
}

function openDigitalProducts(){
  installDigitalProductsStyle()
  closeDigitalProducts()
  const panel=document.createElement('div')
  panel.id=PANEL_ID
  panel.className='fc-products-panel'
  panel.innerHTML=`<section class="fc-products-card" role="dialog" aria-modal="true" aria-label="Produtos digitais FITCOACH">
    <header class="fc-products-head">
      <div><div class="fc-products-kicker">FITCOACH STORE</div><h2>Produtos digitais</h2><p>Produtos prontos para gerar uma nova fonte de receita dentro do FITCOACH.</p></div>
      <button class="fc-products-close" onclick="closeDigitalProducts()" aria-label="Fechar">×</button>
    </header>
    <div class="fc-products-grid">${DIGITAL_PRODUCTS.map(p=>`<article class="fc-product">
      <div class="fc-product-top"><span class="fc-product-category">${p.category}</span><span class="fc-product-tag">${p.tag}</span></div>
      <h3>${p.title}</h3><p>${p.description}</p>
      <div class="fc-product-bottom"><strong class="fc-product-price">${p.price}</strong><button class="fc-product-buy" data-digital-buy="${p.id}">Quero adquirir</button></div>
    </article>`).join('')}</div>
    <div class="fc-products-note">Os produtos estão cadastrados no catálogo. O próximo passo para cobrança automática é conectar os links/checkout de pagamento de cada produto.</div>
  </section>`
  panel.addEventListener('click',event=>{if(event.target===panel)closeDigitalProducts()})
  panel.querySelectorAll('[data-digital-buy]').forEach(button=>button.onclick=()=>requestDigitalProduct(button.dataset.digitalBuy))
  document.body.appendChild(panel)
}

function injectDigitalProductsButton(){
  const nav=document.querySelector('.nav')
  if(!nav || nav.querySelector('[data-digital-products]')) return
  const button=document.createElement('button')
  button.className='fc-products-btn'
  button.dataset.digitalProducts='true'
  button.innerHTML='<span class="fc-products-icon">◈</span><span>Produtos digitais</span>'
  button.onclick=openDigitalProducts
  nav.appendChild(button)
}

const observer=new MutationObserver(()=>injectDigitalProductsButton())
observer.observe(document.documentElement,{childList:true,subtree:true})
installDigitalProductsStyle()
injectDigitalProductsButton()
