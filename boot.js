(() => {
  const app = document.querySelector('#app')

  const showFatal = (error) => {
    if (!app) return
    const message = String(error?.message || error || 'Erro desconhecido')
    app.innerHTML = `<section style="min-height:100dvh;display:grid;place-items:center;padding:24px;background:#070a08;color:#f4fff6;font-family:-apple-system,BlinkMacSystemFont,Inter,sans-serif"><div style="width:min(440px,100%);text-align:center;padding:28px;border:1px solid rgba(255,110,110,.18);border-radius:24px;background:#0d140f"><div style="font-size:11px;letter-spacing:.16em;opacity:.55;font-weight:800">FITCOACH PROFESSIONAL</div><h1 style="font-size:24px;margin:16px 0 8px">Não foi possível iniciar o app</h1><p style="margin:0 0 18px;color:#9aa79e;line-height:1.5;font-size:14px">O FITCOACH encontrou um erro ao iniciar. Toque abaixo para tentar novamente.</p><button id="fcBootRetry" type="button" style="width:100%;border:0;border-radius:14px;padding:14px 16px;background:#74e887;color:#071008;font-size:15px;font-weight:900">Tentar novamente</button><details style="margin-top:14px;text-align:left;color:#77847b;font-size:11px"><summary>Detalhes técnicos</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere">${message.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</pre></details></div></section>`
    document.querySelector('#fcBootRetry')?.addEventListener('click',()=>location.reload())
  }
  const loadOptional = async () => {
    await Promise.allSettled([
      import('./planos-fitcoach.js'),import('./features-loader.js'),import('./pro-suite.js'),import('./pro-suite-v2.js'),import('./pro-plan-gate.js'),import('./home-ai-checkin.js'),import('./chat-ia.js'),import('./ai-role-auto.js'),import('./pro-ai.js'),import('./trainer-ai-home.js'),import('./ui-plan-edit-actions.js'),import('./pro-level14.js'),import('./pro-level15.js'),import('./pro-level16.js'),import('./plans-header.js'),import('./plans-v2.js'),import('./auth-ui-cleanup.js'),import('./produtos-digitais.js'),import('./pwa.js')
    ].map(p=>p.catch(error=>{console.warn('FITCOACH optional module failed',error);return null})))
  }
  const load = async () => { try { await import('./main.js') } catch(error){ console.error('FITCOACH main boot failed:',error); showFatal(error); return } await loadOptional() }
  load()
})()