// FITCOACH — ações de edição de treino e acesso aos planos.
(() => {
  const editWorkout = () => {
    document.querySelector('#modal')?.remove();
    document.body.insertAdjacentHTML('beforeend', `<div id="modal" class="modal"><div class="card modal-card"><button class="icon-btn" id="fcEditClose">×</button><h2>Editar treino</h2><p class="muted">Edite exercícios, séries, repetições, carga e descanso.</p><label>O que deseja alterar?<textarea id="fcEditText" class="input" rows="4" placeholder="Ex.: adicione 2 exercícios de costas e retire o exercício X"></textarea></label><div class="row gap"><button class="btn" id="fcEditManual">Editar manualmente</button><button class="btn primary" id="fcEditAI">✦ Editar com IA</button></div></div></div>`);
    document.querySelector('#fcEditClose').onclick=()=>document.querySelector('#modal')?.remove();
    document.querySelector('#fcEditManual').onclick=()=>alert('Selecione a ficha para editar os exercícios.');
    document.querySelector('#fcEditAI').onclick=()=>alert('Use o chat IA FITCOACH para solicitar a alteração do treino.');
  };
  const openPlans = () => {
    document.querySelector('#modal')?.remove();
    document.body.insertAdjacentHTML('beforeend', `<div id="modal" class="modal"><div class="card modal-card"><button class="icon-btn" id="fcPlansClose">×</button><h2>Planos</h2><p class="muted">Escolha seu plano mensal ou semestral.</p><div class="grid two"><div class="card"><h3>Mensal</h3><button class="btn primary full" id="fcMonthly">Escolher mensal</button></div><div class="card"><h3>Semestral</h3><button class="btn primary full" id="fcSemi">Escolher semestral</button></div></div></div></div>`);
    document.querySelector('#fcPlansClose').onclick=()=>document.querySelector('#modal')?.remove();
  };
  function addButtons(){
    // Nunca renderizar ações globais na tela de login.
    const loggedIn = !document.querySelector('input[type="password"]') && !document.querySelector('[data-login], .login, .login-screen, #login');
    const app = document.querySelector('#app');
    if (!app || !loggedIn) { document.querySelector('#fcGlobalActions')?.remove(); return; }
    if(document.querySelector('#fcGlobalActions')) return;
    const wrap=document.createElement('div'); wrap.id='fcGlobalActions'; wrap.className='row gap'; wrap.style.cssText='position:fixed;top:12px;right:12px;z-index:90;display:flex;gap:8px';
    wrap.innerHTML='<button class="btn" id="fcEditWorkoutBtn">✎ Editar treino</button><button class="btn" id="fcPlansBtn">◆ Planos</button>';
    document.body.appendChild(wrap);
    document.querySelector('#fcEditWorkoutBtn').onclick=editWorkout;
    document.querySelector('#fcPlansBtn').onclick=openPlans;
  }
  addButtons();
  new MutationObserver(addButtons).observe(document.body,{childList:true,subtree:true});
  window.FITCOACH_UI={editWorkout,openPlans};
})();
