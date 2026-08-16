export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' })
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'IA ainda não configurada no servidor. Adicione OPENAI_API_KEY na Vercel.' })
  try {
    const { message, role = 'personal', student = '', history = [] } = req.body || {}
    if (!message?.trim()) return res.status(400).json({ error: 'Mensagem vazia.' })
    const context = role === 'aluno'
      ? `Você é a IA do FITCOACH para um aluno. Aluno: ${student || 'não informado'}. Responda dúvidas sobre treino e acompanhamento com linguagem clara. Não faça diagnóstico médico.`
      : `Você é a IA do FITCOACH para um personal trainer. Aluno em contexto: ${student || 'nenhum selecionado'}. Ajude com treino, periodização, fichas e acompanhamento. Não faça diagnóstico médico.`
    const messages = [{ role: 'system', content: context }, ...history.filter(x => x?.r && x?.t).map(x => ({ role: x.r === 'user' ? 'user' : 'assistant', content: String(x.t).slice(0, 4000) })), { role: 'user', content: String(message).slice(0, 6000) }]
    const r = await fetch('https://api.openai.com/v1/chat/completions', { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.OPENAI_API_KEY}`}, body:JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', messages, temperature:0.4, max_tokens:700 }) })
    const data = await r.json()
    if (!r.ok) return res.status(502).json({ error: data?.error?.message || 'Falha ao consultar a IA.' })
    return res.status(200).json({ reply: data.choices?.[0]?.message?.content || 'Não consegui gerar uma resposta.' })
  } catch (e) { return res.status(500).json({ error: 'Erro interno ao consultar a IA.' }) }
}
