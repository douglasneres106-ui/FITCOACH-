// Carrega os upgrades depois que o núcleo do FITCOACH já pode renderizar.
// Isso evita que o Atlas/recursos Professional bloqueiem a primeira tela no iPhone.
const modules = [
  './pro-level2.js','./pro-level3.js','./pro-level4.js','./pro-level5.js','./pro-level6.js',
  './pro-level7.js','./pro-level8.js','./pro-level9.js','./pro-level10.js','./pro-level11.js',
  './atlas-3d.js','./pro-level13.js','./atlas-ptbr-i18n.js','./atlas-ptbr-embed.js',
  './atlas-professional-v5.js','./atlas-professional-panel.js','./atlas-pro-dashboard.js',
  './atlas-pro-workout-builder.js','./fitcoach-pro-dashboard.js','./pwa.js'
]

const load = () => Promise.allSettled(modules.map(path => import(path))).then(results => {
  const failed = results.filter(r => r.status === 'rejected')
  if (failed.length) console.warn(`FITCOACH: ${failed.length} módulo(s) Professional não carregaram.`, failed)
})

if ('requestIdleCallback' in window) requestIdleCallback(load, { timeout: 1200 })
else setTimeout(load, 250)
