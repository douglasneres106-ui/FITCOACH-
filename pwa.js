const installButton = document.querySelector('#installAppButton')
const installHelp = document.querySelector('#installHelp')
const closeInstallHelp = document.querySelector('#closeInstallHelp')
const confirmInstallHelp = document.querySelector('#confirmInstallHelp')

let deferredInstallPrompt = null

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true

// O botão de instalação deve existir somente na tela de login.
function isLoginScreen() {
  return !!document.querySelector('.auth-screen input[type="password"]')
}

function syncInstallButton() {
  if (!installButton) return
  const canShow = !isStandalone && isLoginScreen()
  installButton.classList.toggle('hidden', !canShow)
  if (installHelp && !canShow) installHelp.classList.add('hidden')
}

function hideInstallButton() {
  installButton?.classList.add('hidden')
  installHelp?.classList.add('hidden')
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Service Worker não registrado:', error)
    })
  })
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault()
  deferredInstallPrompt = event
  syncInstallButton()
})

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null
  hideInstallButton()
})

installButton?.addEventListener('click', async () => {
  if (!isLoginScreen()) return

  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt()
    await deferredInstallPrompt.userChoice
    deferredInstallPrompt = null
    syncInstallButton()
    return
  }

  if (isIOS) installHelp?.classList.remove('hidden')
})

function dismissInstallHelp() {
  installHelp?.classList.add('hidden')
}

closeInstallHelp?.addEventListener('click', dismissInstallHelp)
confirmInstallHelp?.addEventListener('click', dismissInstallHelp)
installHelp?.addEventListener('click', (event) => {
  if (event.target === installHelp) dismissInstallHelp()
})

// O app troca de tela dinamicamente após o login; observa essas mudanças
// para esconder imediatamente o botão quando o usuário entra no app.
const installVisibilityObserver = new MutationObserver(() => syncInstallButton())
installVisibilityObserver.observe(document.body, { childList: true, subtree: true })

syncInstallButton()
