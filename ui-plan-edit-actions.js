// FITCOACH — ações globais para edição de treinos e acesso aos planos.
(() => {
  const esc = (v='') => String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))
  function editWorkout() {
    const existing = document.querySelector('#modal');
    existing?.remove();
    document.body.insertAdjacentHTML('beforeend', `<div id="modal" class="modal"><div class="card modal-card"><button class="icon-btn" id="fcEditClose">×</button><h2>Editar treino</h2><p class="muted">Edite qualquer ficha, ajuste exercícios, séries, repetições, carga e descanso.</p><div class="stack"><label>O que deseja alterar?<textarea id="fcEditText" class="input" rows="4" placeholder="Ex.: adicione 2 exercícios de costas e retire o exercício X"></textarea></label><div class="row gap"><button class="btn" id="fcEditManual">Editar manualmente</button><button class="btn primary" id="fcEditAI">✦ Editar com IA</button></div><p class="muted small">As alterações devem ser revisadas pelo profissional antes de aplicar.</p></div></div></div>`)
    document.querySelector('#fcEditClose').onclick=()=>document.querySelector('#modal')?.remove()
    document.querySelector('#fcEditManual').onclick=()=>alert('Editor de ficha pronto para receber os dados do treino selecionado.')
    document.querySelector('#fcEditAI').onclick=()=>alert('Descreva a alteração e use o chat IA FITCOACH para aplicar a sugestão ao treino selecionado.')
  }
  function openPlans(){
    const existing=document.querySelector('#modal'); existing?.remove();
    document.body.insertAdjacentHTML('beforeend', `<div id="modal" class="modal"><div class="card modal-card"><button class="icon-btn" id="fcPlansClose">×</button><div class="eyebrow">FITCOACH</div><h2>Planos</h2><p class="muted">Escolha o plano mensal ou semestral que melhor combina com sua rotina.</p><div class="grid two"><div class="card"><h3>Mensal</h3><p class="muted">Acesso contínuo com cobrança mensal.</p><button class="btn primary full" id="fcMonthly">Escolher mensal</button></div><div class="card"><h3>Semestral</h3><p class="muted">Acesso por 6 meses em uma única assinatura.</p><button class="btn primary full" id="fcSemi">Escolher semestral</button></div></div></div></div>`)
    document.querySelector('#fcPlansClose').onclick=()=>document.querySelector('#modal')?.remove()
    document.querySelector('#fcMonthly').onclick=()=>alert('Plano mensal selecionado. Configure o checkout para concluir a assinatura.')
    document.querySelector('#fcSemi').onclick=()=>alert('Plano semestral selecionado. Configure o checkout para concluir a assinatura.')
  }
  function addButtons(){
    if(document.querySelector('#fcGlobalActions')) return
    const wrap=document.createElement('div'); wrap.id='fcGlobalActions'; wrap.className='row gap'; wrap.style.cssText='position:fixed;top:12px;right:12px;z-index:90;display:flex;gap:8px'
    wrap.innerHTML='<button class="btn" id="fcEditWorkoutBtn">✎ Editar treino</button><button class="btn" id="fcPlansBtn">◆ Planos</button>'
    document.body.appendChild(wrap)
    document.querySelector('#fcEditWorkoutBtn').onclick=editWorkout
    document.querySelector('#fcPlansBtn').onclick=openPlans
  }
  addButtons();
  new MutationObserver(addButtons).observe(document.body,{childList:true,subtree:true})
  window.FITCOACH_UI={editWorkout,openPlans}
})();
