/* FITCOACH — limpeza segura da tela de autenticação.
   Oculta apenas atalhos da área autenticada; nunca oculta o container do login. */
(() => {
  const authSelectors = [
    'input[type="password"]',
    '.auth-screen', '.auth-card', '.auth-wrap',
    '.login', '.login-screen', '[data-login]', '#login'
  ]

  const isAuthScreen = () => authSelectors.some(selector => document.querySelector(selector))

  const isLoginContainer = (el) => el.closest('form, input, label, .auth-card, .auth-wrap, .auth-screen, .login, .login-screen')

  const clean = () => {
    if (!isAuthScreen()) return

    // IDs/classes conhecidos de recursos que pertencem somente à área autenticada.
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
      '[data-check-in]',
      '[data-pro-plan]',
      '#pro10PlansHome',
      '#pro11Launcher',
      '#pro11StudentCard',
      '#pro12Quick',
      '#pro13Launcher',
      '#pro14Launcher',
      '#pro15Launcher'
    ]

    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        if (isLoginContainer(el)) return
        el.style.setProperty('display', 'none', 'important')
        el.setAttribute('aria-hidden', 'true')
      })
    })

    // Fallback para versões que renderizam esses atalhos sem IDs/classes estáveis.
    // Procura somente botões/links/cards visíveis na tela de autenticação e nunca toca no formulário.
    const authRoot = document.querySelector('.auth-screen, .login-screen, [data-login], #login')
    if (!authRoot) return

    const forbiddenText = /^(fc\s*pro|chat\s*(ia|fitcoach|in)|chatin|check-?ins?|check\s*in)$/i
    authRoot.querySelectorAll('button, a, [role="button"], .card, .feature-card, .quick-actions > *').forEach(el => {
      if (isLoginContainer(el)) return
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim()
      if (text && forbiddenText.test(text)) {
        el.style.setProperty('display', 'none', 'important')
        el.setAttribute('aria-hidden', 'true')
      }
    })
  }

  clean()
  new MutationObserver(clean).observe(document.documentElement, {
    childList: true,
    subtree: true
  })
})()
