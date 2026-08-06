import { buildSeed } from './seed.js'
import { uid } from './id.js'

const DB_KEY = 'bloom.db.v9'
const CAMPAIGN_STATUS_LAYOUT_VERSION = 3
const DEMO_CAMPAIGN_STATUSES = {
  cmp_1001: 'active',
  cmp_1002: 'active',
  cmp_1003: 'active',
  cmp_1004: 'received',
  cmp_1005: 'received',
  cmp_1006: 'reviewing',
  cmp_1007: 'completed',
  cmp_1008: 'active',
  cmp_1009: 'reviewing',
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
    advertisers: database.advertisers ?? [],
    channels: database.channels ?? [],
    campaigns: (database.campaigns ?? []).map((campaign) => {
      const normalizedCampaign = normalizeCampaignStatus(campaign)
      const demoStatus = DEMO_CAMPAIGN_STATUSES[campaign.id]

      return shouldUpdateDemoStatuses && demoStatus
        ? { ...normalizedCampaign, status: demoStatus }
        : normalizedCampaign
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
