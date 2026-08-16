import https from 'node:https'

const BASE = 'https://jixiangying.github.io/anatomy/'
const cache = new Map()

function fetchUpstream(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path || '', BASE)
    https.get(url, { headers: { 'User-Agent': 'FITCOACH-Anatomy-Proxy/1.0' } }, res => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => resolve({ status: res.statusCode || 502, type: res.headers['content-type'] || 'application/octet-stream', body: Buffer.concat(chunks) }))
    }).on('error', reject)
  })
}

function translateHtml(html) {
  const replacements = {
    'Skeletal System':'Sistema esquelético','Muscular System':'Sistema muscular','Cardiovascular System':'Sistema cardiovascular','Nervous System':'Sistema nervoso','Digestive System':'Sistema digestivo','Respiratory System':'Sistema respiratório','Urinary System':'Sistema urinário','Reproductive System':'Sistema reprodutor','Endocrine System':'Sistema endócrino','Lymphatic System':'Sistema linfático','Integumentary System':'Sistema tegumentar','Skeletal':'Esquelético','Muscular':'Muscular','Cardiovascular':'Cardiovascular','Nervous':'Nervoso','Digestive':'Digestivo','Respiratory':'Respiratório','Urinary':'Urinário','Reproductive':'Reprodutor','Endocrine':'Endócrino','Lymphatic':'Linfático','Integumentary':'Tegumentar','Search':'Pesquisar','Layers':'Camadas','Models':'Modelos','Home':'Início','Fullscreen':'Tela cheia','Search model name or ID...':'Pesquisar nome ou ID do modelo...'
  }
  let out = html
  for (const [a,b] of Object.entries(replacements)) out = out.split(a).join(b)
  const inject = `<script>(function(){try{document.documentElement.lang='pt-BR';document.title='Atlas Anatômico 3D • FITCOACH';const obs=new MutationObserver(()=>{const map={'Skeletal':'Esquelético','Muscular':'Muscular','Cardiovascular':'Cardiovascular','Nervous':'Nervoso','Digestive':'Digestivo','Respiratory':'Respiratório','Urinary':'Urinário','Reproductive':'Reprodutor','Endocrine':'Endócrino','Lymphatic':'Linfático','Integumentary':'Tegumentar','Search':'Pesquisar','Layers':'Camadas','Models':'Modelos','Home':'Início','Fullscreen':'Tela cheia'};document.querySelectorAll('button,input,span,div').forEach(e=>{if(e.children.length===0&&e.textContent){let t=e.textContent.trim();if(map[t])e.textContent=map[t]}});document.querySelectorAll('input[placeholder]').forEach(e=>{if(/search|model/i.test(e.placeholder))e.placeholder='Pesquisar nome ou ID do modelo...'})});obs.observe(document.documentElement,{childList:true,subtree:true,characterData:true});setTimeout(()=>obs.disconnect(),120000)}catch(e){console.warn('FITCOACH PT-BR',e)}})();</script>`
  return out.replace('</body>', `${inject}</body>`)
}

export default async function handler(req, res) {
  try {
    const p = Array.isArray(req.query?.path) ? req.query.path.join('/') : ''
    const key = p || 'index.html'
    if (cache.has(key)) {
      const hit = cache.get(key)
      res.setHeader('Content-Type', hit.type)
      res.setHeader('Cache-Control','public, max-age=3600, stale-while-revalidate=86400')
      return res.status(200).send(hit.body)
    }
    const upstream = await fetchUpstream(key)
    if (upstream.status >= 400) return res.status(upstream.status).send(upstream.body)
    let body = upstream.body
    let type = upstream.type
    if (type.includes('text/html')) {
      body = Buffer.from(translateHtml(body.toString('utf8')))
      type = 'text/html; charset=utf-8'
    }
    const value = { type, body }
    cache.set(key, value)
    res.setHeader('Content-Type', type)
    res.setHeader('Cache-Control','public, max-age=3600, stale-while-revalidate=86400')
    return res.status(200).send(body)
  } catch (e) {
    console.error('Anatomy proxy error', e)
    return res.status(502).json({ error: 'Não foi possível carregar o Atlas 3D.' })
  }
}
