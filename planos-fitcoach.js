const FITCOACH_PLANS = [
  {
    id: 'free', name: 'Free', price: 0, period: 'sempre', icon: '🆓',
    description: 'Para começar a usar o FITCOACH.',
    features: ['Até 10 alunos', 'Recursos básicos']
  },
  {
    id: 'monthly', name: 'Mensal', price: 29.90, period: 'mês', icon: '⭐',
    description: 'Mais recursos para o Personal.',
    features: ['Mais alunos', 'Recursos avançados']
  },
  {
    id: 'pro', name: 'Pro', price: 49.90, period: 'mês', icon: '🚀',
    description: 'Plano completo para o Personal profissional.',
    features: ['Mais alunos', 'IA FITCOACH', 'Recursos profissionais', 'Evolução avançada', 'Produtos Digitais']
  },
  {
    id: 'semiannual', name: 'Semestral', price: 249.90, period: '6 meses', icon: '🏢',
    description: 'Plano Pro com desconto para fidelização.',
    features: ['Tudo do Pro', 'IA FITCOACH', 'Recursos profissionais', 'Produtos Digitais', 'Desconto por 6 meses'],
    includesPro: true
  }
]

function fitcoachPlanHasDigitalProducts(planId) {
  return planId === 'pro' || planId === 'semiannual'
}

window.FITCOACH_PLANS = FITCOACH_PLANS
window.fitcoachPlanHasDigitalProducts = fitcoachPlanHasDigitalProducts
