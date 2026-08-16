// FITCOACH — ações posicionadas nas áreas corretas da aplicação.
(() => {
  const isLogin = () => !!document.querySelector('input[type="password"], [data-login], .login, .login-screen, #login');
  const findText = (texts) => [...document.querySelectorAll('button,a,[role="button"],h1,h2,h3')].find(el => texts.some(t => el.textContent?.trim().toLowerCase().includes(t)));

  function addEditToWorkoutArea() {
    if (isLogin()) return;
    // O botão fica somente junto das fichas/área de treino, não como botão flutuante global.
    const anchors = [...document.querySelectorAll('button,a,[role="button"],h1,h2,h3')].filter(el => /treino|ficha|montar treino/i.test(el.textContent || ''));
    anchors.forEach(anchor => {
      const parent = anchor.closest('section,article,div') || anchor.parentElement;
      if (!parent || parent.querySelector('.fc-edit-workout')) return;
      const btn = document.createElement('button');
      btn.className = 'btn fc-edit-workout';
      btn.type = 'button';
      btn.textContent = '✎ Editar treino';
      btn.onclick = () => window.FITCOACH_UI?.editWorkout?.();
      parent.appendChild(btn);
    });
  }

  function addPlansBesideBadge() {
    if (isLogin()) return;
    // Procura a insígnia/perfil e coloca Planos imediatamente ao lado.
    const badge = findText(['minha insígnia', 'insígnia', 'meu perfil']);
    if (!badge) return;
    const parent = badge.parentElement;
    if (!parent || parent.querySelector('.fc-plans')) return;
    const btn = document.createElement('button');
    btn.className = 'btn fc-plans';
    btn.type = 'button';
    btn.textContent = '◆ Planos';
    btn.onclick = () => window.FITCOACH_UI?.openPlans?.();
    parent.appendChild(btn);
  }

  function wireAIWithWorkoutBuilder() {
    if (isLogin()) return;
    // IA fica dentro da área "Montar treino", abaixo dela, como chat para dúvidas.
    const anchor = findText(['montar treino']);
    if (!anchor) return;
    const parent = anchor.closest('section,article,div') || anchor.parentElement;
    if (!parent || parent.querySelector('.fc-ai-help')) return;
    const box = document.createElement('div');
    box.className = 'fc-ai-help';
    box.innerHTML = '<button type="button" class="btn primary fc-ai-chat">✦ Conversar com IA FITCOACH</button>';
    parent.appendChild(box);
    box.querySelector('button').onclick = () => {
      const chat = [...document.querySelectorAll('button,a,[role="button"]')].find(el => /ia|chat/i.test(el.textContent || ''));
      if (chat && chat !== box.querySelector('button')) chat.click();
      else window.FITCOACH_UI?.openAIChat?.();
    };
  }

  window.FITCOACH_UI = window.FITCOACH_UI || {};
  window.FITCOACH_UI.editWorkout = () => {
    document.querySelector('#modal')?.remove();
    document.body.insertAdjacentHTML('beforeend','<div id="modal" class="modal"><div class="card modal-card"><button class="icon-btn" id="fcEditClose">×</button><h2>Editar treino</h2><p class="muted">Edite exercícios, séries, repetições, carga e descanso.</p><textarea class="input" rows="4" placeholder="Descreva a alteração..."></textarea><div class="row gap"><button class="btn" id="fcEditManual">Editar manualmente</button><button class="btn primary" id="fcEditAI">✦ Editar com IA</button></div></div></div>');
    document.querySelector('#fcEditClose').onclick=()=>document.querySelector('#modal')?.remove();
  };
  window.FITCOACH_UI.openPlans = () => {
    document.querySelector('#modal')?.remove();
    document.body.insertAdjacentHTML('beforeend','<div id="modal" class="modal"><div class="card modal-card"><button class="icon-btn" id="fcPlansClose">×</button><h2>Planos</h2><p class="muted">Escolha seu plano mensal ou semestral.</p><div class="grid two"><div class="card"><h3>Mensal</h3><button class="btn primary full">Escolher mensal</button></div><div class="card"><h3>Semestral</h3><button class="btn primary full">Escolher semestral</button></div></div></div></div>');
    document.querySelector('#fcPlansClose').onclick=()=>document.querySelector('#modal')?.remove();
  };
  const sync = () => { if (isLogin()) { document.querySelectorAll('.fc-edit-workout,.fc-plans,.fc-ai-help').forEach(e=>e.remove()); return; } addEditToWorkoutArea(); addPlansBesideBadge(); wireAIWithWorkoutBuilder(); };
  sync();
  new MutationObserver(sync).observe(document.body,{childList:true,subtree:true});
})();
