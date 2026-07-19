import { buildSeed } from './seed.js'
import { uid } from './id.js'

const DB_KEY = 'bloom.db.v1'

// --- Загрузка / сохранение ------------------------------------------------

function load() {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (!raw) {
      const seed = buildSeed()
      localStorage.setItem(DB_KEY, JSON.stringify(seed))
      return seed
    }
    const parsed = JSON.parse(raw)
    // Мягкая миграция — гарантируем наличие всех коллекций.
    return {
      advertisers: parsed.advertisers ?? [],
      channels: parsed.channels ?? [],
      campaigns: parsed.campaigns ?? [],
    }
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
  state = buildSeed()
  emit()
}

// Синхронизация между вкладками.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === DB_KEY && e.newValue) {
      try {
        state = JSON.parse(e.newValue)
        listeners.forEach((l) => l())
      } catch {
        /* ignore */
      }
    }
  })
}
