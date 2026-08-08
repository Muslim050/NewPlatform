import { ADVERTISERS, CAMPAIGNS, buildSeed } from './seed.js'
import { uid } from './id.js'

// Юр. лица демо-брендов — добираем их в базах, созданных до появления поля.
const SEED_LEGAL_NAMES = new Map(ADVERTISERS.map((a) => [a.id, a.legalName]))
// Время создания демо-кампаний: в старых базах даты сохранены без времени.
const SEED_CREATED_AT = new Map(CAMPAIGNS.map((c) => [c.id, c.createdAt]))

// Ключ версионируем: при смене набора демо-кампаний старая база в localStorage
// заменяется свежим сидом.
const DB_KEY = 'bloom.db.v10'
// При смене версии демо-кампании догоняют сид: статусы воронки и условия
// договора. Заполненное руками не трогаем — дописываем только пустые поля.
const CAMPAIGN_STATUS_LAYOUT_VERSION = 5
const DEMO_CAMPAIGN_STATUSES = Object.fromEntries(
  CAMPAIGNS.map((c) => [c.id, c.status]),
)
const SEED_CAMPAIGNS = new Map(CAMPAIGNS.map((c) => [c.id, c]))
const CONTRACT_FIELDS = [
  'contractNumber',
  'legalName',
  'package',
  'leagues',
  'contractStart',
  'contractEnd',
  'paymentDate',
]

/** Дописываем условия договора из сида в те поля, что остались пустыми. */
function fillContract(campaign) {
  const seed = SEED_CAMPAIGNS.get(campaign.id)
  if (!seed) return campaign

  const patch = {}
  for (const field of CONTRACT_FIELDS) {
    const value = campaign[field]
    const isEmpty = Array.isArray(value) ? !value.length : !value
    if (isEmpty) patch[field] = Array.isArray(seed[field]) ? [...seed[field]] : seed[field]
  }
  return Object.keys(patch).length ? { ...campaign, ...patch } : campaign
}

function normalizeCampaignStatus(campaign) {
  if (campaign.status !== 'paused' && campaign.status !== 'draft') {
    return campaign
  }

  const today = new Date().toISOString().slice(0, 10)
  const status = campaign.endDate && campaign.endDate < today
    ? 'completed'
    : 'active'

  return { ...campaign, status }
}

function normalizeDatabase(database) {
  const shouldUpdateDemoStatuses =
    database.campaignStatusLayoutVersion !== CAMPAIGN_STATUS_LAYOUT_VERSION

  return {
    advertisers: (database.advertisers ?? []).map((advertiser) =>
      advertiser.legalName
        ? advertiser
        : {
            ...advertiser,
            legalName: SEED_LEGAL_NAMES.get(advertiser.id) ?? '',
          },
    ),
    channels: database.channels ?? [],
    campaigns: (database.campaigns ?? []).map((campaign) => {
      const normalizedCampaign = normalizeCampaignStatus(campaign)
      const demoStatus = DEMO_CAMPAIGN_STATUSES[campaign.id]
      const withStatus =
        shouldUpdateDemoStatuses && demoStatus
          ? { ...normalizedCampaign, status: demoStatus }
          : normalizedCampaign

      // Дата без времени — берём полную метку из сида, если кампания демо-шная.
      const seedCreatedAt = SEED_CREATED_AT.get(campaign.id)
      const withCreatedAt =
        seedCreatedAt && !String(campaign.createdAt).includes('T')
          ? { ...withStatus, createdAt: seedCreatedAt }
          : withStatus

      return shouldUpdateDemoStatuses ? fillContract(withCreatedAt) : withCreatedAt
    }),
    campaignStatusLayoutVersion: CAMPAIGN_STATUS_LAYOUT_VERSION,
  }
}

// --- Загрузка / сохранение ------------------------------------------------

function load() {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (!raw) {
      const seed = normalizeDatabase(buildSeed())
      localStorage.setItem(DB_KEY, JSON.stringify(seed))
      return seed
    }
    const parsed = normalizeDatabase(JSON.parse(raw))
    // Мягкая миграция — гарантируем наличие всех коллекций.
    localStorage.setItem(DB_KEY, JSON.stringify(parsed))
    return parsed
  } catch {
    return buildSeed()
  }
}

let state = load()
const listeners = new Set()

function persist() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(state))
  } catch {
    /* переполнение квоты игнорируем — данные останутся в памяти */
  }
}

function emit() {
  persist()
  listeners.forEach((l) => l())
}

// --- Внешний API для useSyncExternalStore --------------------------------

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getState() {
  return state
}

// --- CRUD ------------------------------------------------------------------

export function create(collection, item) {
  const record = {
    id: uid(collection.slice(0, 3)),
    createdAt: new Date().toISOString(),
    ...item,
  }
  state = { ...state, [collection]: [record, ...state[collection]] }
  emit()
  return record
}

export function update(collection, id, patch) {
  state = {
    ...state,
    [collection]: state[collection].map((r) =>
      r.id === id ? { ...r, ...patch } : r,
    ),
  }
  emit()
}

export function remove(collection, id) {
  state = {
    ...state,
    [collection]: state[collection].filter((r) => r.id !== id),
  }
  emit()
}

/** Полный сброс к начальным данным (кнопка в настройках). */
export function resetDb() {
  state = normalizeDatabase(buildSeed())
  emit()
}

// Синхронизация между вкладками.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === DB_KEY && e.newValue) {
      try {
        state = normalizeDatabase(JSON.parse(e.newValue))
        listeners.forEach((l) => l())
      } catch {
        /* ignore */
      }
    }
  })
}
