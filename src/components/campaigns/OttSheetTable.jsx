import { useMemo, useState } from 'react'
import { ReportSheetTable } from './ReportSheetTable.jsx'

// OTT в файле отчёта нет: его таблицы живут в браузере, пока бэкенд их не
// примет. Свои у каждого договора, месяца и канала.
const STORAGE_KEY = 'setanta.campaign.ott-sheets.v1'

// В OTT колонки post нет.
const HIDDEN_COLUMNS = ['post']

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}
  } catch {
    return {}
  }
}

function loadRows(key) {
  const rows = readAll()[key]
  return Array.isArray(rows) ? rows : []
}

/** Бросает, если хранилище переполнено, — таблица покажет ошибку. */
function persistRows(key, rows) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...readAll(), [key]: rows }),
  )
}

/**
 * Канал OTT (Live spot, Preroll) — с теми же колонками, что лист эфиров
 * Setanta Sports 1: дата, время, турнир, событие и блок выходов ролика,
 * только без post.
 * Ключ компонента у родителя меняется вместе с каналом и месяцем — тогда
 * строки перечитываются из хранилища.
 */
export function OttSheetTable({
  contractId,
  period,
  channelId,
  title,
  subtitle,
}) {
  const storageKey = `${contractId}:${period}:${channelId}`
  const [rows, setRows] = useState(() => loadRows(storageKey))

  const sheet = useMemo(
    () => ({ code: channelId, title, kind: 'live_event', version: 0, rows }),
    [channelId, title, rows],
  )

  const save = (next) => {
    persistRows(storageKey, next)
    setRows(next)
  }

  return (
    <ReportSheetTable
      sheet={sheet}
      contractId={contractId}
      period={period}
      title={title}
      subtitle={subtitle}
      onSave={save}
      hiddenColumns={HIDDEN_COLUMNS}
      emptyHint="Данные OTT за этот месяц ещё не внесены."
    />
  )
}
