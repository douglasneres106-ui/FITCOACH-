/* FITCOACH PRO 15 — professional UI polish + robust workout editing */
(() => {
  const STYLE_ID = 'fc-pro15-style'
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = `
      :root { --fc-green:#72e3a0; --fc-green-strong:#8af04b; --fc-bg:#070a08; --fc-panel:#0e1712; --fc-border:rgba(114,227,160,.16); }
      body { -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility; }
      button, a, input, textarea, select { -webkit-tap-highlight-color:transparent; }
      button { font-family:inherit; }
      .fc-edit-workout { min-height:40px !important; border-radius:12px !important; font-weight:800 !important; transition:transform .16s ease, box-shadow .16s ease, background .16s ease !important; }
      .fc-edit-workout:active { transform:scale(.97) !important; }
      #modal { z-index:100000 !important; isolation:isolate; }
      #modal::before { content:""; position:fixed; inset:0; background:rgba(0,0,0,.58); backdrop-filter:blur(8px); z-index:-1; }
      #modal .modal-card { position:relative; z-index:1; max-height:min(88vh,860px); overflow:auto; overscroll-behavior:contain; border:1px solid var(--fc-border) !important; box-shadow:0 30px 100px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.03) inset !important; }
      .fc-manual-editor .modal-head { position:sticky; top:-1px; z-index:4; margin:-1px -1px 18px; padding:18px 20px; background:rgba(14,23,18,.96); backdrop-filter:blur(16px); border-bottom:1px solid rgba(114,227,160,.12); }
      .fc-manual-editor .exercise-box { display:grid; gap:10px; }
      .fc-manual-editor .fc-edit-exercise { display:grid; grid-template-columns:minmax(150px,2fr) repeat(4,minmax(70px,1fr)) 42px; gap:9px; align-items:end; padding:14px; background:rgba(255,255,255,.025); border:1px solid rgba(255,255,255,.07); border-radius:14px; }
      .fc-manual-editor .fc-edit-exercise label { display:block; margin:0 0 6px; font-size:10px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:#7f8a84; }
      .fc-manual-editor .fc-edit-exercise input { width:100%; box-sizing:border-box; min-height:42px; border-radius:10px; border:1px solid rgba(255,255,255,.09); background:#09100c; color:#fff; padding:10px 11px; outline:none; }
      .fc-manual-editor .fc-edit-exercise input:focus { border-color:rgba(114,227,160,.6); box-shadow:0 0 0 3px rgba(114,227,160,.08); }
      .fc-manual-editor .fc-remove-exercise { min-height:42px !important; min-width:42px; }
      .fc-manual-editor .modal-actions { position:sticky; bottom:-1px; z-index:4; margin:18px -1px -1px; padding:14px 0 0; background:linear-gradient(to bottom, transparent, rgba(14,23,18,.98) 28%); }
      #fcEditManual, #fcEditAI, #fcSaveManual, #fcEditCancel, #fcAddExercise, #fcEditClose { position:relative; z-index:5; pointer-events:auto !important; }
      #fcEditManual { min-height:48px !important; }
      #fcEditAI { min-height:48px !important; }
      .fc-ai-help { position:relative; z-index:2; }
      @media (max-width:760px) {
        .fc-manual-editor .fc-edit-exercise { grid-template-columns:1fr 1fr; }
        .fc-manual-editor .fc-edit-exercise .exercise-name { grid-column:1 / -1; }
        .fc-manual-editor .fc-remove-exercise { grid-column:2; }
        #modal .modal-card { width:min(94vw,680px) !important; max-height:90vh; }
      }
      @media (max-width:430px) {
        .fc-manual-editor .fc-edit-exercise { grid-template-columns:1fr; }
        .fc-manual-editor .fc-edit-exercise .exercise-name, .fc-manual-editor .fc-remove-exercise { grid-column:auto; }
        .fc-manual-editor .modal-actions { display:grid !important; grid-template-columns:1fr; gap:8px; }
      }
      .fc-pro15-toast { position:fixed; left:50%; bottom:max(24px,env(safe-area-inset-bottom)); transform:translate(-50%,20px); opacity:0; z-index:200000; background:#101b15; color:#dfffea; border:1px solid rgba(114,227,160,.28); box-shadow:0 14px 50px rgba(0,0,0,.4); border-radius:999px; padding:10px 16px; font-size:13px; font-weight:800; pointer-events:none; transition:opacity .2s,transform .2s; }
      .fc-pro15-toast.show { opacity:1; transform:translate(-50%,0); }
    `
    document.head.appendChild(style)
  }

  const loginScreen = () => !!document.querySelector('input[type="password"], [data-login], .login, .login-screen, #login')

  const cleanInstallButtons = () => {
    const onLogin = loginScreen()
    document.querySelectorAll('[id*="install" i], [class*="install" i], button, a').forEach(el => {
      const text = (el.textContent || '').replace(/\s+/g,' ').trim().toLowerCase()
      if (!text.includes('instalar fitcoach') && !/install.*fitcoach/i.test(el.id || '') && !/install.*fitcoach/i.test(el.className || '')) return
      if (onLogin) {
        el.style.removeProperty('display')
        el.style.removeProperty('visibility')
      } else {
        el.style.setProperty('display','none','important')
      }
    })
  }

  const closeModal = () => {
    document.querySelector('#modal')?.remove()
    document.body.style.overflow = ''
  }

  const wireModalControls = () => {
    const modal = document.querySelector('#modal')
    if (!modal || modal.dataset.fc15Wired === '1') return
    modal.dataset.fc15Wired = '1'
    document.body.style.overflow = 'hidden'

    modal.addEventListener('click', event => {
      const target = event.target.closest?.('#fcEditManual, #fcEditAI, #fcEditClose, #fcEditCancel, #fcAddExercise, #fcSaveManual')
      if (!target) return
      if (target.id === 'fcEditClose' || target.id === 'fcEditCancel') {
        event.preventDefault(); event.stopPropagation(); closeModal()
        return
      }
      if (target.id === 'fcEditManual') {
        event.preventDefault(); event.stopPropagation()
        const name = modal.querySelector('.muted strong')?.textContent || 'Ficha de treino'
        const id = document.querySelector('.fc-edit-workout[data-workout-id]')?.dataset.workoutId || ''
        if (typeof window.FITCOACH_UI?.editWorkout === 'function' && !modal.querySelector('.fc-manual-editor')) {
          /* ui-plan-edit-actions owns the real editor; trigger its existing handler safely. */
          target.blur()
          window.FITCOACH_UI.editWorkout({ name, id })
        }
      }
    }, true)
  }

  const enhance = () => {
    cleanInstallButtons()
    wireModalControls()
  }

  enhance()
  new MutationObserver(enhance).observe(document.body, { childList:true, subtree:true })
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && document.querySelector('#modal')) closeModal() })
})()
