export const COMPANY = {
  name: 'Medida Virante LDA',
  slogan: 'Climatizacao eficiente para casas e negocios em Lisboa.',
  whatsapp: '351967722023',
  instagram: 'https://instagram.com/',
  email: 'geral@medidavirante.pt',
}

// ROTA PRIVADA DA EMPRESA:
// /acesso-empresa-medida-virante-portal-privado
export const PRIVATE_ROUTE = '/acesso-empresa-medida-virante-portal-privado'
export const MAX_SERVICES_PER_DAY = 3

export const SERVICES = ['Instalacao', 'Manutencao', 'Limpeza', 'Reparacao']
export const BASE_MEDIA = [
  '/img/arCondicional.jpeg',
  '/img/img1.jpeg',
  '/img/img2.jpeg',
  '/img/img3.jpeg',
  '/img/img4.jpeg',
  '/img/img5.jpeg',
  '/img/img6.jpeg',
  '/img/img7.jpeg',
  '/img/img8.jpeg',
  '/img/img9.jpeg',
  '/img/img10.jpeg',
].map((url, idx) => ({ id: `base-${idx}`, type: 'image', url, label: `Projeto ${idx + 1}` }))

export const KEYS = {
  users: 'mv_users',
  session: 'mv_session',
  orders: 'mv_orders',
  media: 'mv_media',
  reviews: 'mv_reviews',
  theme: 'mv_theme',
}

export const DEFAULT_REVIEWS = [
  { id: 'r1', name: 'Ana Pires', rating: 5, text: 'Servico rapido e profissional.' },
  { id: 'r2', name: 'Joao Silva', rating: 5, text: 'Instalacao limpa e atendimento excelente.' },
]

export const readJson = (k, fallback) => {
  try {
    const raw = localStorage.getItem(k)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export const writeJson = (k, v) => localStorage.setItem(k, JSON.stringify(v))

export const today = () => new Date().toISOString().slice(0, 10)

export function addDays(date, n) {
  const d = new Date(`${date}T00:00:00`)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export const daySpan = (start, days) =>
  Array.from({ length: Number(days) || 1 }, (_, i) => addDays(start, i))

export function countLoad(orders, day) {
  return orders.reduce((acc, order) => {
    if (order.status === 'cancelado') return acc
    return daySpan(order.date, order.durationDays).includes(day) ? acc + 1 : acc
  }, 0)
}

export function nextAvailableDate(orders, wanted, durationDays) {
  const base = wanted || today()
  for (let i = 0; i < 366; i += 1) {
    const candidate = addDays(base, i)
    const canFit = daySpan(candidate, durationDays).every(
      (day) => countLoad(orders, day) < MAX_SERVICES_PER_DAY,
    )
    if (canFit) return candidate
  }
  return base
}

export function initStore() {
  if (!readJson(KEYS.users, null)) {
    writeJson(KEYS.users, [
      { username: 'supervisor', password: 'super123', role: 'supervisor' },
      { username: 'empregado1', password: 'emp123', role: 'empregado' },
    ])
  }
  if (!readJson(KEYS.orders, null)) writeJson(KEYS.orders, [])
  if (!readJson(KEYS.media, null)) writeJson(KEYS.media, [])
  if (!readJson(KEYS.reviews, null)) writeJson(KEYS.reviews, DEFAULT_REVIEWS)
}
