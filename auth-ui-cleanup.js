/* FITCOACH — limpeza segura da tela de autenticação.
   Oculta apenas atalhos da área autenticada; nunca oculta o container do login. */
(() => {
  const authSelectors = [
    'input[type="password"]',
    '.auth-screen', '.auth-card', '.auth-wrap',
    '.login', '.login-screen', '[data-login]', '#login'
  ]

  const isAuthScreen = () => authSelectors.some(selector => document.querySelector(selector))

  const clean = () => {
    if (!isAuthScreen()) return

    // Somente elementos explicitamente identificados como recursos internos.
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
        // Nunca esconder um ancestral/container que possa conter o formulário.
        if (el.closest('form, input, label, .auth-card, .auth-wrap, .auth-screen, .login, .login-screen')) return
        el.style.setProperty('display', 'none', 'important')
        el.setAttribute('aria-hidden', 'true')
      })
    })
  }

  clean()
  new MutationObserver(clean).observe(document.documentElement, {
    childList: true,
    subtree: true
  })
})()
