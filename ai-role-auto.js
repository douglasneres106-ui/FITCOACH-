import { supabase } from './supabase'

(() => {
  if (window.__FITCOACH_AI_AUTO_ROLE__) return
  window.__FITCOACH_AI_AUTO_ROLE__ = true

  const STORAGE_KEY = 'fitcoach_ai_chat_v1'
  const detectRole = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return null
      const { data: profile } = await supabase
        .from('profiles')
        .select('role,full_name')
        .eq('id', session.user.id)
        .maybeSingle()
      const role = profile?.role === 'trainer' || profile?.role === 'personal' ? 'personal' : 'aluno'
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      saved.role = role
      saved.user_id = session.user.id
      saved.user_name = profile?.full_name || session.user.user_metadata?.full_name || ''
      saved.messages = Array.isArray(saved.messages) ? saved.messages : []
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
      window.__FITCOACH_AI_ROLE__ = role
      window.__FITCOACH_AI_USER_ID__ = session.user.id
      return role
    } catch (error) {
      console.warn('FITCOACH IA: não foi possível detectar o perfil automaticamente', error)
      return null
    }
  }

  const patchUI = () => {
    const role = window.__FITCOACH_AI_ROLE__
    if (!role) return
    const select = document.querySelector('#fc-role')
    if (select) {
      select.value = role
      select.disabled = true
      select.setAttribute('aria-label', role === 'personal' ? 'Modo Professor' : 'Modo Aluno')
      select.title = role === 'personal' ? 'Modo Professor — definido pela sua conta' : 'Modo Aluno — definido pela sua conta'
    }
    const sub = document.querySelector('#fc-ai .sub')
    if (sub) sub.textContent = role === 'personal' ? 'Modo Professor • conta reconhecida automaticamente' : 'Modo Aluno • conta reconhecida automaticamente'
  }

  const run = async () => { await detectRole(); patchUI() }
  run()
  new MutationObserver(() => patchUI()).observe(document.documentElement, { childList: true, subtree: true })
  supabase.auth.onAuthStateChange(() => setTimeout(run, 0))
})()
