(() => {
  const start = () => {
    const app = document.querySelector('#app');
    if (!app) return;
    if (!app.innerHTML.trim()) {
      app.innerHTML = `<section style="min-height:100vh;display:grid;place-items:center;padding:24px;background:#070a08;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',Inter,sans-serif"><div style="width:min(420px,100%);padding:28px;border:1px solid rgba(255,255,255,.1);border-radius:28px;background:rgba(255,255,255,.04);text-align:center"><div style="font-size:11px;letter-spacing:.18em;opacity:.5;font-weight:900">FITCOACH PROFESSIONAL</div><div style="width:34px;height:34px;margin:22px auto 14px;border:3px solid rgba(255,255,255,.12);border-top-color:#72e3a0;border-radius:50%;animation:fcbootspin .8s linear infinite"></div><h2 style="margin:0 0 8px;font-size:22px">Carregando seu ambiente</h2><p style="margin:0;color:rgba(255,255,255,.55);font-size:13px;line-height:1.5">Conectando sua sessão e preparando o FITCOACH.</p></div></section><style>@keyframes fcbootspin{to{transform:rotate(360deg)}}</style>`;
    }
    let settled = false;
    const finish = () => { settled = true; document.documentElement.classList.add('fc-app-ready'); };
    const fail = (message) => {
      if (settled || app.querySelector('.fc-boot-error')) return;
      app.innerHTML = `<section class="fc-boot-error" style="min-height:100vh;display:grid;place-items:center;padding:24px;background:#070a08;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',Inter,sans-serif"><div style="width:min(430px,100%);padding:28px;border:1px solid rgba(255,120,120,.22);border-radius:28px;background:rgba(70,20,20,.18);text-align:center"><div style="font-size:11px;letter-spacing:.18em;opacity:.5;font-weight:900">FITCOACH PROFESSIONAL</div><h2 style="margin:16px 0 8px">Não foi possível carregar o app</h2><p style="margin:0 0 20px;color:rgba(255,255,255,.6);font-size:13px;line-height:1.5">${String(message || 'A conexão demorou mais que o esperado.').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</p><button id="fcBootRetry" style="border:1px solid rgba(114,227,160,.35);background:rgba(114,227,160,.12);color:#fff;border-radius:14px;padding:12px 18px;font-weight:800">Tentar novamente</button></div></section>`;
      document.querySelector('#fcBootRetry').onclick = () => location.reload();
    };
    window.addEventListener('error', e => {
      if (e?.filename && /assets\//.test(e.filename)) fail('Um recurso do aplicativo não carregou corretamente.');
    });
    window.addEventListener('unhandledrejection', e => {
      if (!settled) console.warn('FITCOACH boot:', e.reason);
    });
    setTimeout(() => {
      if (app.querySelector('.fc-boot-error')) return;
      if (app.querySelector('.login,.app-frame')) finish();
      else fail('A conexão com o ambiente do FITCOACH demorou mais que o esperado.');
    }, 10000);
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start, {once:true}) : start();
})();
