/* FITCOACH — elementos exclusivos da área autenticada
   Na tela de login/cadastro, não exibir os atalhos IA FITCOACH e FC PRO.
   O botão "Instalar FITCOACH" continua sendo controlado exclusivamente por pwa.js. */
(() => {
  const isAuthScreen = () => !!document.querySelector(
    'input[type="password"], .auth-screen, .auth-card, .login, .login-screen, [data-login], #login'
  )

  const clean = () => {
    const auth = isAuthScreen()
    const selectors = [
      '#fc-ai-btn',
      '#fc-pro-launcher',
      '.fc-ai-launcher',
      '[data-fc-ai-launcher]'
    ]

    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        if (auth) el.style.setProperty('display', 'none', 'important')
        else el.style.removeProperty('display')
      })
    })
  }

  clean()
  new MutationObserver(clean).observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  })
})()
