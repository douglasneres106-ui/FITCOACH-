/* FITCOACH PRO 14 — AI launcher layout fix */
(() => {
  const normalize = (value = '') => value.replace(/\s+/g, ' ').trim().toUpperCase()
  const markAI = () => {
    const candidates = [...document.querySelectorAll('button,a,[role="button"],div')]
    candidates.forEach(el => {
      if (el.dataset.fcAiFixed === '1') return
      const text = normalize(el.textContent)
      if (!text || text.length > 42) return
      if (!text.includes('IA FITCOACH') && !text.includes('IA • FITCOACH') && !text.includes('✦ IA')) return
      el.dataset.fcAiFixed = '1'
      el.classList.add('fc-ai-launcher')
    })
  }
  const css = document.createElement('style')
  css.id = 'fc-ai-launcher-style'
  css.textContent = `
    .fc-ai-launcher {
      position: fixed !important;
      right: max(18px, env(safe-area-inset-right)) !important;
      bottom: calc(76px + env(safe-area-inset-bottom)) !important;
      z-index: 1200 !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 8px !important;
      min-height: 52px !important;
      min-width: 148px !important;
      max-width: calc(100vw - 36px) !important;
      padding: 12px 18px !important;
      margin: 0 !important;
      border-radius: 999px !important;
      border: 1px solid rgba(121,245,157,.34) !important;
      background: rgba(10,25,16,.96) !important;
      color: #b8ffc9 !important;
      box-shadow: 0 14px 38px rgba(0,0,0,.34), 0 0 0 1px rgba(121,245,157,.04) !important;
      backdrop-filter: blur(18px) saturate(130%) !important;
      -webkit-backdrop-filter: blur(18px) saturate(130%) !important;
      font-weight: 850 !important;
      font-size: 13px !important;
      line-height: 1.1 !important;
      white-space: nowrap !important;
      transform: translateZ(0) !important;
    }
    .fc-ai-launcher:hover { transform: translateY(-2px) !important; }
    .fc-ai-launcher:active { transform: scale(.98) !important; }
    @media (max-width: 520px) {
      .fc-ai-launcher {
        right: 14px !important;
        bottom: calc(84px + env(safe-area-inset-bottom)) !important;
        min-height: 48px !important;
        min-width: 136px !important;
        padding: 11px 15px !important;
      }
    }
    @media (display-mode: standalone) {
      .fc-ai-launcher { bottom: calc(88px + env(safe-area-inset-bottom)) !important; }
    }
  `
  document.head.appendChild(css)
  markAI()
  const observer = new MutationObserver(markAI)
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true })
  window.addEventListener('resize', markAI)
})()
