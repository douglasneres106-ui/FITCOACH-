/* FITCOACH — elementos exclusivos da área autenticada
   Na tela de login/cadastro, não exibir IA, FC PRO, check-ins ou atalhos do app.
   O botão "Instalar FITCOACH" continua sendo controlado exclusivamente por pwa.js. */
(() => {
  const isAuthScreen = () => !!document.querySelector(
    'input[type="password"], .auth-screen, .auth-card, .login, .login-screen, [data-login], #login'
  )

  const shouldHide = (el) => {
    if (!el || el.nodeType !== 1) return false
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase()
    const id = String(el.id || '').toLowerCase()
    const cls = String(el.className || '').toLowerCase()

    return (
      /fc\s*pro|fc-pro|fitcoach\s*pro/.test(text) ||
      /check\s*-?\s*ins?|checkin|check-ins|checkins/.test(text) ||
      /fc[-_]?pro|check[-_]?in/.test(id) ||
      /fc[-_]?pro|check[-_]?in/.test(cls)
    )
  }

  const clean = () => {
    if (!isAuthScreen()) return

    const selectors = [
      '#fc-ai-btn',
      '#fc-pro-launcher',
      '.fc-ai-launcher',
      '[data-fc-ai-launcher]',
      '[data-fc-pro-launcher]',
      '.fc-pro-launcher',
      '.fc-pro',
      '.checkin',
      '.check-ins',
      '[data-checkin]',
      '[data-check-in]'
    ]

    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.style.setProperty('display', 'none', 'important')
        el.setAttribute('aria-hidden', 'true')
      })
    })

    // Fallback robusto: identifica textos/atalhos que foram inseridos por módulos
    // diferentes e oculta o bloco inteiro sem afetar o formulário de login.
    document.querySelectorAll('button, a, [role="button"], .card, .tile, .quick-actions, section, article, div').forEach(el => {
      if (el.matches('form, input, label, .auth-card, .auth-wrap')) return
      if (!shouldHide(el)) return

      // Evita esconder o container inteiro da tela de login caso o termo apareça
      // incidentalmente no texto de um bloco maior.
      if (el.closest('.auth-card, .auth-wrap') && el.children.length > 8) return

      el.style.setProperty('display', 'none', 'important')
      el.setAttribute('aria-hidden', 'true')
    })
  }

  clean()
  new MutationObserver(clean).observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  })
})()
