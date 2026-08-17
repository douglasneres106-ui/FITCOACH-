/* FITCOACH PRO 14 — single AI launcher layout */
(() => {
  const css = document.createElement('style')
  css.id = 'fc-ai-launcher-style'
  css.textContent = `
    /* The chat-ia.js button is the only launcher allowed to float. */
    .fc-ai-launcher:not(#fc-ai-btn),
    button:not(#fc-ai-btn)[id*="ai"],
    a:not(#fc-ai-btn)[id*="ai"],
    [role="button"]:not(#fc-ai-btn)[id*="ai"] { display:none !important; }
    #fc-ai-btn.fc-ai-launcher { position:fixed !important; }
  `
  document.head.appendChild(css)

  const cleanDuplicates = () => {
    document.querySelectorAll('.fc-ai-launcher').forEach(el => {
      if (el.id !== 'fc-ai-btn') el.style.setProperty('display','none','important')
    })
    document.querySelectorAll('button,a,[role="button"]').forEach(el => {
      if (el.id === 'fc-ai-btn') return
      const text = (el.textContent || '').replace(/\s+/g,' ').trim().toUpperCase()
      if (/^(✦\s*)?IA FITCOACH$/.test(text) || text === 'CONVERSAR COM IA FITCOACH') {
        el.style.setProperty('display','none','important')
      }
    })
  }

  cleanDuplicates()
  const observer = new MutationObserver(cleanDuplicates)
  observer.observe(document.documentElement, { childList:true, subtree:true, characterData:true })
})()
