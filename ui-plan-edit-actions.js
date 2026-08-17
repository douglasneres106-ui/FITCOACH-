// FITCOACH — ações de edição das fichas de treino.
(() => {
  const isLogin = () => !!document.querySelector('input[type="password"], [data-login], .login, .login-screen, #login');
  const findText = (texts) => [...document.querySelectorAll('button,a,[role="button"],h1,h2,h3')]
    .find(el => texts.some(t => el.textContent?.trim().toLowerCase().includes(t)));

  function getWorkoutCards() {
    const viewButtons = [...document.querySelectorAll('button,a,[role="button"]')]
      .filter(el => /^\s*ver ficha\s*$/i.test(el.textContent || ''));

    return viewButtons.map((view) => {
      const card = view.closest('article, .item-card, .workout-card, .card') || view.parentElement;
      return card && /ficha|treino/i.test(card.textContent || '') ? { card, view } : null;
    }).filter(Boolean);
  }

  function addEditButtonsToEveryWorkout() {
    if (isLogin()) return;

    getWorkoutCards().forEach(({ card }) => {
      if (card.querySelector(':scope > .fc-edit-workout, .fc-edit-workout')) return;

      const title = [...card.querySelectorAll('h1,h2,h3,.item-title,strong')]
        .map(el => el.textContent?.trim())
        .find(Boolean) || 'Ficha de treino';

      const btn = document.createElement('button');
      btn.className = 'btn sec fc-edit-workout';
      btn.type = 'button';
      btn.textContent = '✎ Editar';
      btn.dataset.workoutName = title;
      btn.addEventListener('click', () => window.FITCOACH_UI?.editWorkout?.({ name: title, card }));

      const actions = card.querySelector('.actions, .item-actions, .card-actions');
      if (actions) actions.appendChild(btn);
      else card.appendChild(btn);
    });
  }

  function removeEditFromBottomNav() {
    document.querySelectorAll('nav,footer,[class*="bottom"],[class*="navbar"],[class*="tabbar"]').forEach(nav => {
      nav.querySelectorAll('.fc-edit-workout').forEach(el => el.remove());
    });
  }

  function addEditToStudentWorkoutArea() {
    // Mantém compatibilidade com áreas antigas que não usam cards "Ver ficha".
    if (isLogin() || getWorkoutCards().length) return;
    if (document.querySelector('.fc-edit-workout')) return;

    const student = findText(['alunos', 'aluno']);
    if (!student) return;
    const workout = [...document.querySelectorAll('button,a,[role="button"],h1,h2,h3')]
      .find(el => /ficha de treino|fichas de treino|treinos/i.test(el.textContent || ''));
    if (!workout) return;
    const parent = workout.closest('section,article') || workout.parentElement;
    if (!parent || !/treino|ficha/i.test(parent.textContent || '')) return;

    const btn = document.createElement('button');
    btn.className = 'btn sec fc-edit-workout';
    btn.type = 'button';
    btn.textContent = '✎ Editar treino';
    btn.onclick = () => window.FITCOACH_UI?.editWorkout?.();
    parent.appendChild(btn);
  }

  function addPlansBesideBadge() {
    if (isLogin() || document.querySelector('.fc-plans')) return;
    const badge = findText(['minha insígnia', 'insígnia']);
    if (!badge) return;
    const parent = badge.parentElement;
    if (!parent) return;
    const btn = document.createElement('button');
    btn.className = 'btn fc-plans';
    btn.type = 'button';
    btn.textContent = '◆ Planos';
    btn.onclick = () => window.FITCOACH_UI?.openPlans?.();
    parent.appendChild(btn);
  }

  function wireAIWithWorkoutBuilder() {
    if (isLogin() || document.querySelector('.fc-ai-help')) return;
    const anchor = findText(['montar treino']);
    if (!anchor) return;
    const parent = anchor.closest('section,article') || anchor.parentElement;
    if (!parent) return;
    const box = document.createElement('div');
    box.className = 'fc-ai-help';
    box.innerHTML = '<button type="button" class="btn primary fc-ai-chat">✦ Conversar com IA FITCOACH</button>';
    parent.appendChild(box);
    box.querySelector('button').onclick = () => window.FITCOACH_UI?.openAIChat?.();
  }

  window.FITCOACH_UI = window.FITCOACH_UI || {};
  window.FITCOACH_UI.editWorkout = (workout = {}) => {
    document.querySelector('#modal')?.remove();
    const name = workout.name || 'Ficha de treino';
    document.body.insertAdjacentHTML('beforeend', `<div id="modal" class="modal"><div class="card modal-card">
      <button class="icon-btn" id="fcEditClose" type="button">×</button>
      <span class="eyebrow">EDIÇÃO DE TREINO</span>
      <h2>Editar treino</h2>
      <p class="muted"><strong>${name.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}</strong></p>
      <p class="muted">Edite exercícios, séries, repetições, carga e descanso.</p>
      <textarea class="input" rows="4" placeholder="Descreva a alteração..."></textarea>
      <div class="row gap"><button class="btn" id="fcEditManual" type="button">Editar manualmente</button><button class="btn primary" id="fcEditAI" type="button">✦ Editar com IA</button></div>
    </div></div>`);
    document.querySelector('#fcEditClose').onclick=()=>document.querySelector('#modal')?.remove();
  };

  window.FITCOACH_UI.openPlans = () => {
    document.querySelector('#modal')?.remove();
    document.body.insertAdjacentHTML('beforeend','<div id="modal" class="modal"><div class="card modal-card"><button class="icon-btn" id="fcPlansClose">×</button><h2>Planos</h2><p class="muted">Escolha seu plano mensal ou semestral.</p><div class="grid two"><div class="card"><h3>Mensal</h3><button class="btn primary full">Escolher mensal</button></div><div class="card"><h3>Semestral</h3><button class="btn primary full">Escolher semestral</button></div></div></div></div>');
    document.querySelector('#fcPlansClose').onclick=()=>document.querySelector('#modal')?.remove();
  };

  const sync = () => {
    if (isLogin()) {
      document.querySelectorAll('.fc-edit-workout,.fc-plans,.fc-ai-help').forEach(e=>e.remove());
      return;
    }
    removeEditFromBottomNav();
    addEditButtonsToEveryWorkout();
    addEditToStudentWorkoutArea();
    addPlansBesideBadge();
    wireAIWithWorkoutBuilder();
  };

  sync();
  new MutationObserver(sync).observe(document.body,{childList:true,subtree:true});
})();
