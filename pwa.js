const installButton = document.querySelector('#installAppButton')
const installHelp = document.querySelector('#installHelp')
const closeInstallHelp = document.querySelector('#closeInstallHelp')
const confirmInstallHelp = document.querySelector('#confirmInstallHelp')

let deferredInstallPrompt = null

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true

function showInstallButton() {
  if (!isStandalone) installButton.classList.remove('hidden')
}

function hideInstallButton() {
  installButton.classList.add('hidden')
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
  showInstallButton()
})

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null
  hideInstallButton()
})

installButton.addEventListener('click', async () => {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt()
    await deferredInstallPrompt.userChoice
    deferredInstallPrompt = null
    hideInstallButton()
    return
  }

  if (isIOS) installHelp.classList.remove('hidden')
})

function dismissInstallHelp() {
  installHelp.classList.add('hidden')
}

closeInstallHelp.addEventListener('click', dismissInstallHelp)
confirmInstallHelp.addEventListener('click', dismissInstallHelp)
installHelp.addEventListener('click', (event) => {
  if (event.target === installHelp) dismissInstallHelp()
})

if (isIOS) showInstallButton()
