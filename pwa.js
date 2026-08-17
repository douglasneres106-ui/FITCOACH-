// FITCOACH PWA
// O botão "Instalar FITCOACH" aparece SOMENTE nas telas de login/criação de conta.
// Depois que o usuário entra no app, o botão é removido de qualquer área da interface.

(() => {
  let deferredPrompt = null
  const INSTALL_TEXT = /instalar\s*fitcoach|instalar\s*fit\s*coach/i

  const isAuthScreen = () => !!document.querySelector(
    'input[type="password"], .auth-screen, .auth-card, .login, [data-login], #login'
  )

  const removeInstallButtons = () => {
    document.querySelectorAll('button,a,[role="button"]').forEach((el) => {
      if (INSTALL_TEXT.test(el.textContent || '')) el.remove()
    })
  }

  const showIOSInstructions = () => {
    const existing = document.querySelector('#fc-ios-install-modal')
    if (existing) return
    document.body.insertAdjacentHTML('beforeend', `
      <div id="fc-ios-install-modal" class="modal">
        <div class="card modal-card">
          <div class="modal-head">
            <div><span class="eyebrow">INSTALAR FITCOACH</span><h2>Adicionar à Tela de Início</h2></div>
            <button class="icon-btn" id="fcIosClose" type="button">×</button>
          </div>
          <p class="muted">No iPhone, toque em <strong>Compartilhar</strong> e depois em <strong>Adicionar à Tela de Início</strong>.</p>
          <button class="btn full" id="fcIosDone" type="button">Entendi</button>
        </div>
      </div>
    `)
    const close = () => document.querySelector('#fc-ios-install-modal')?.remove()
    document.querySelector('#fcIosClose').onclick = close
    document.querySelector('#fcIosDone').onclick = close
  }

  const install = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      await deferredPrompt.userChoice.catch(() => null)
      deferredPrompt = null
      return
    }
    // Safari/iOS não expõe beforeinstallprompt: orientar pelo menu Compartilhar.
    showIOSInstructions()
  }

  const addLoginInstallButton = () => {
    if (!isAuthScreen()) return
    if (document.querySelector('[data-fc-install-button]')) return

    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'btn sec full fc-install-button'
    button.dataset.fcInstallButton = 'true'
    button.textContent = 'Instalar FITCOACH'
    button.addEventListener('click', install)

    const submit = document.querySelector('.auth-submit, #submit')
    const card = submit?.closest('.auth-card, .card')
    if (card && submit) {
      submit.insertAdjacentElement('afterend', button)
    } else {
      const target = document.querySelector('.auth-card, .auth-wrap, .login')
      target?.appendChild(button)
    }
  }

  const sync = () => {
    if (isAuthScreen()) {
      addLoginInstallButton()
    } else {
      removeInstallButtons()
    }
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event
    sync()
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    removeInstallButtons()
  })

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.warn('Service Worker não registrado:', error)
      })
    })
  }

  sync()
  new MutationObserver(sync).observe(document.body, { childList: true, subtree: true })
})()
