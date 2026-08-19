// FITCOACH PWA — safe runtime
// Installation button stays only on auth screens.
// No automatic cache deletion or auth-state deletion during normal startup.
(() => {
  let deferredPrompt = null
  let reloading = false
  const INSTALL_TEXT = /instalar\s*fitcoach|instalar\s*fit\s*coach/i

  const isAuthScreen = () => !!document.querySelector('input[type="password"], .auth-screen, .auth-card, .login, [data-login], #login')

  const removeInstallButtons = () => document.querySelectorAll('button,a,[role="button"]').forEach(el => { if (INSTALL_TEXT.test(el.textContent || '')) el.remove() })

  const showIOSInstructions = () => {
    if (document.querySelector('#fc-ios-install-modal')) return
    document.body.insertAdjacentHTML('beforeend', '<div id="fc-ios-install-modal" class="modal"><div class="card modal-card"><div class="modal-head"><div><span class="eyebrow">INSTALAR FITCOACH</span><h2>Adicionar à Tela de Início</h2></div><button class="icon-btn" id="fcIosClose" type="button">×</button></div><p class="muted">No iPhone, toque em <strong>Compartilhar</strong> e depois em <strong>Adicionar à Tela de Início</strong>.</p><button class="btn full" id="fcIosDone" type="button">Entendi</button></div></div>')
    const close=()=>document.querySelector('#fc-ios-install-modal')?.remove()
    document.querySelector('#fcIosClose').onclick=close
    document.querySelector('#fcIosDone').onclick=close
  }

  const install = async () => {
    if (!deferredPrompt) return showIOSInstructions()
    deferredPrompt.prompt()
    await deferredPrompt.userChoice.catch(() => null)
    deferredPrompt = null
  }

  const addLoginInstallButton = () => {
    if (!isAuthScreen() || document.querySelector('[data-fc-install-button]')) return
    const button=document.createElement('button')
    button.type='button'; button.className='btn sec full fc-install-button'; button.dataset.fcInstallButton='true'; button.textContent='Instalar FITCOACH'; button.onclick=install
    const submit=document.querySelector('.auth-submit,#submit'); const card=submit?.closest('.auth-card,.card')
    if(card&&submit) submit.insertAdjacentElement('afterend',button); else document.querySelector('.auth-card,.auth-wrap,.login')?.appendChild(button)
  }

  const sync=()=>isAuthScreen()?addLoginInstallButton():removeInstallButtons()

  const activateWaitingWorker = registration => {
    if (registration?.waiting) registration.waiting.postMessage({type:'FITCOACH_SKIP_WAITING'})
  }

  const watchForUpdates = async () => {
    if (!('serviceWorker' in navigator)) return
    const registration=await navigator.serviceWorker.ready
    activateWaitingWorker(registration)
    await registration.update().catch(()=>{})
    activateWaitingWorker(registration)
    setInterval(()=>registration.update().catch(()=>{}),60000)
    registration.addEventListener('updatefound',()=>{
      const worker=registration.installing
      if(!worker)return
      worker.addEventListener('statechange',()=>{
        if(worker.state==='installed'&&navigator.serviceWorker.controller) activateWaitingWorker(registration)
      })
    })
  }

  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredPrompt=event;sync()})
  window.addEventListener('appinstalled',()=>{deferredPrompt=null;removeInstallButtons()})
  navigator.serviceWorker?.addEventListener('controllerchange',()=>{if(reloading)return;reloading=true;location.reload()})

  const boot=async()=>{
    if('serviceWorker' in navigator){
      await navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).then(watchForUpdates).catch(e=>console.warn('Service Worker não registrado:',e))
    }
    sync()
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});else sync()
  new MutationObserver(sync).observe(document.body,{childList:true,subtree:true})
  window.addEventListener('load',boot,{once:true})
})()
