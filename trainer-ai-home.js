import { supabase } from './supabase'
import './trainer-ai-home.css'

(() => {
  if (window.__FITCOACH_TRAINER_AI_HOME__) return
  window.__FITCOACH_TRAINER_AI_HOME__ = true

  const esc = (v='') => String(v).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))
  let observer
  let openAttempts = 0

  async function isTrainer() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return false
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle()
    return profile?.role === 'trainer'
  }

  async function openAI() {
    openAttempts = 0
    const tryOpen = async () => {
      const launcher = document.querySelector('#fc-ai-pro-launcher')
      if (launcher) {
        launcher.click()
        return
      }
      if (openAttempts === 0) {
        try { await import('./pro-ai.js') } catch (error) { console.warn('FITCOACH IA Pro bridge', error) }
      }
      openAttempts += 1
      if (openAttempts < 12) return setTimeout(tryOpen, 180)
      const message = document.querySelector('#fc-trainer-ai-status')
      if (message) message.textContent = 'A IA profissional ainda está inicializando. Toque novamente em alguns segundos.'
    }
    await tryOpen()
  }

  function render() {
    const content = document.querySelector('#content')
    if (!content || document.querySelector('#fc-trainer-ai-home')) return
    if (!document.querySelector('[data-page="home"].active') && !location.hash.includes('home')) {
      // main.js does not expose the current page; the presence of the dashboard hero is the safest signal.
      if (!content.querySelector('.hero-card')) return
    }
    const card = document.createElement('section')
    card.id = 'fc-trainer-ai-home'
    card.className = 'fc-trainer-ai-home'
    card.innerHTML = `
      <div class="fc-trainer-ai-home-copy">
        <div class="fc-trainer-ai-kicker">FITCOACH INTELLIGENCE</div>
        <h2>IA profissional do Personal</h2>
        <p>Use os dados reais dos seus alunos para montar, adaptar e acompanhar treinos com mais precisão.</p>
        <div class="fc-trainer-ai-pills">
          <span>Treino personalizado</span><span>Adaptação por evolução</span><span>Histórico</span><span>Progressão de carga</span><span>Avaliações</span><span>Métricas</span>
        </div>
        <button type="button" id="fcTrainerAiOpen">Abrir IA do Personal <b>→</b></button>
        <small id="fc-trainer-ai-status">A IA reconhece automaticamente a conta de Personal.</small>
      </div>
      <div class="fc-trainer-ai-orbit"><span>✦</span><b>IA</b><small>PRO</small></div>`
    content.appendChild(card)
    card.querySelector('#fcTrainerAiOpen').addEventListener('click', openAI)
  }

  async function enhance() {
    if (!(await isTrainer())) return
    render()
  }

  observer = new MutationObserver(() => setTimeout(render, 80))
  observer.observe(document.documentElement, { childList:true, subtree:true })
  supabase.auth.onAuthStateChange(() => setTimeout(enhance, 0))
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhance, { once:true })
  else enhance()
})()
