import { createClient } from '@supabase/supabase-js'
import originalHandler from './ai-workout.js'

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8')
  return res.end(JSON.stringify(body))
}

function getToken(req) {
  const header = req.headers.authorization || req.headers.Authorization || ''
  return header.startsWith('Bearer ') ? header.slice(7).trim() : ''
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' })

  const token = getToken(req)
  if (!token) return json(res, 401, { error: 'Sessão obrigatória.' })

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY
  if (!supabaseUrl || !supabaseKey) return json(res, 500, { error: 'Configuração do servidor incompleta.' })

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const { data: authData, error: authError } = await supabase.auth.getUser(token)
  const user = authData?.user
  if (authError || !user) return json(res, 401, { error: 'Sessão inválida ou expirada.' })

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.role !== 'trainer') {
    return json(res, 403, { error: 'A IA de prescrição é exclusiva para contas de personal.' })
  }

  const { data: preference, error: preferenceError } = await supabase
    .from('trainer_plan_preferences')
    .select('billing_cycle')
    .eq('trainer_id', user.id)
    .maybeSingle()

  if (preferenceError) return json(res, 500, { error: 'Não foi possível verificar seu plano.' })

  const isPro = preference?.billing_cycle === 'monthly' || preference?.billing_cycle === 'semiannual'
  if (!isPro) {
    return json(res, 403, {
      error: 'A IA FITCOACH está disponível nos planos Pro Mensal e Pro Semestral. Faça upgrade para liberar a IA.',
      code: 'PRO_PLAN_REQUIRED',
    })
  }

  return originalHandler(req, res)
}
