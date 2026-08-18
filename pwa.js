// FITCOACH PWA
// O botão "Instalar FITCOACH" aparece SOMENTE nas telas de login/criação de conta.
// Atualizações publicadas são verificadas automaticamente sem trocar o link do app.

(() => {
  let deferredPrompt = null
  let reloading = false
  let recoveryTriggered = false
  const INSTALL_TEXT = /instalar\s*fitcoach|instalar\s*fit\s*coach/i
  const RECOVERY_KEY = 'fitcoach_pwa_recovery_v1'
  const BOOT_RECOVERY_KEY = 'fitcoach_boot_recovery_v2'

  const isAuthScreen = () => !!document.querySelector(
    'input[type="password"], .auth-screen, .auth-card, .login, [data-login], #login'
  )

  const isMainAppMounted = () => {
    const app = document.querySelector('#app')
    if (!app) return true
    if (app.querySelector('form, .auth-screen, .login-screen, .dashboard, .nav, .nav-btn, [data-app-ready]')) return true
    const text = (app.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase()
    return !!text && !text.includes('carregando fitcoach')
  }

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
    if (card && submit) submit.insertAdjacentElement('afterend', button)
    else document.querySelector('.auth-card, .auth-wrap, .login')?.appendChild(button)
  }

  const sync = () => {
    if (isAuthScreen()) addLoginInstallButton()
    else removeInstallButtons()
  }

  const clearAuthPersistence = () => {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (/^sb-.*-auth-token$/.test(key) || /^supabase\./i.test(key)) localStorage.removeItem(key)
      })
    } catch {}
    try {
      Object.keys(sessionStorage).forEach((key) => {
        if (/^supabase\./i.test(key)) sessionStorage.removeItem(key)
      })
    } catch {}
  }

  const recoverBrokenPWA = async () => {
    if (!('serviceWorker' in navigator) || localStorage.getItem(RECOVERY_KEY) === 'done') return false
    let registrations = []
    try { registrations = await navigator.serviceWorker.getRegistrations() } catch {}
    if (!registrations.length) return false
    localStorage.setItem(RECOVERY_KEY, 'done')
    await Promise.all(registrations.map(r => r.unregister().catch(() => false)))
    if ('caches' in window) {
      try {
        const keys = await caches.keys()
        await Promise.all(keys.map(key => caches.delete(key)))
      } catch {}
    }
    clearAuthPersistence()
    const cleanUrl = new URL(window.location.href)
    cleanUrl.searchParams.set('fc-recovery', '1')
    window.location.replace(cleanUrl.toString())
    return true
  }

  const showBootRecovery = () => {
    const app = document.querySelector('#app')
    if (!app || isMainAppMounted()) return
    app.innerHTML = `
      <section style="min-height:100dvh;display:grid;place-items:center;padding:24px;background:#070a08;color:#f4fff6;font-family:-apple-system,BlinkMacSystemFont,Inter,sans-serif">
        <div style="width:min(420px,100%);text-align:center;padding:28px;border:1px solid rgba(114,227,160,.16);border-radius:24px;background:#0d140f;box-shadow:0 24px 80px rgba(0,0,0,.45)">
          <div style="font-size:11px;letter-spacing:.16em;opacity:.55;font-weight:800">FITCOACH PROFESSIONAL</div>
          <h1 style="font-size:24px;margin:16px 0 8px">Vamos recuperar o app</h1>
          <p style="margin:0 0 18px;color:#9aa79e;line-height:1.5;font-size:14px">Detectei que o aplicativo ficou preso no carregamento. Posso limpar apenas o estado local do PWA e abrir novamente a tela de login.</p>
          <button id="fcRecoveryButton" type="button" style="width:100%;border:0;border-radius:14px;padding:14px 16px;background:#74e887;color:#071008;font-size:15px;font-weight:900">Recuperar e abrir</button>
        </div>
      </section>`
    document.querySelector('#fcRecoveryButton')?.addEventListener('click', async () => {
      recoveryTriggered = true
      localStorage.removeItem(BOOT_RECOVERY_KEY)
      await recoverBrokenPWA().catch(() => false)
      const next = new URL(location.href)
      next.searchParams.set('fc-recovery', '1')
      location.replace(next.toString())
    })
  }

  const bootWatchdog = () => {
    const params = new URLSearchParams(location.search)
    const alreadyRecovered = params.get('fc-recovery') === '1'
    setTimeout(async () => {
      if (isMainAppMounted()) return
      if (!alreadyRecovered && !recoveryTriggered && localStorage.getItem(BOOT_RECOVERY_KEY) !== 'done') {
        localStorage.setItem(BOOT_RECOVERY_KEY, 'done')
        recoveryTriggered = true
        await recoverBrokenPWA().catch(() => false)
        const next = new URL(location.href)
        next.searchParams.set('fc-recovery', '1')
        location.replace(next.toString())
        return
      }
      showBootRecovery()
    }, 12000)
  }

  const applyUpdate = (registration) => {
    if (!registration?.waiting) return
    registration.waiting.postMessage({ type: 'FITCOACH_SKIP_WAITING' })
  }

  const watchForUpdates = async () => {
    if (!('serviceWorker' in navigator)) return
    const registration = await navigator.serviceWorker.ready
    applyUpdate(registration)
    await registration.update().catch(() => {})
    applyUpdate(registration)
    setInterval(() => registration.update().catch(() => {}), 60_000)
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing
      if (!worker) return
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) applyUpdate(registration)
      })
    })
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

  const bootPWA = async () => {
    try {
      if (await recoverBrokenPWA()) return
    } catch (error) {
      console.warn('FITCOACH PWA recovery failed:', error)
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloading) return
        reloading = true
        window.location.reload()
      })
      await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
        .then(watchForUpdates)
        .catch((error) => console.warn('Service Worker não registrado:', error))
    }
  }

  bootWatchdog()
  sync()
  new MutationObserver(sync).observe(document.body, { childList: true, subtree: true })
  window.addEventListener('load', bootPWA, { once: true })
})()
