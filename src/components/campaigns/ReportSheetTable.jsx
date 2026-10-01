import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { FileSpreadsheet, Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import { isApiError } from '@/api/errors'
import { useAuth } from '@/features/auth/useAuth'
import { useSaveReportSheet } from '@/features/reports/queries'
import { useToast } from '@/components/ui/Toast.jsx'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card.jsx'
import { formatNumber } from '@/lib/format.js'
import { cn } from '@/lib/cn.js'

// Блок выходов ролика в эфире — так он подписан в файле.
const SPOTS_GROUP = 'Live ads spots for 1 brand'

// Бренды, чьи ролики шли в эфире, — блок справа, как в файле. Колонки
// заводят руками, не больше восьми.
const BRANDS_GROUP = 'Total ads spots'
const MAX_BRANDS = 8
const brandKey = (n) => `brand${n}`

/** Колонки брендов 1…count. `brand` — номер бренда. */
const brandColumns = (count) =>
  Array.from({ length: count }, (_, i) => ({
    key: brandKey(i + 1),
    label: `Brand ${i + 1}`,
    type: 'text',
    brand: i + 1,
    group: BRANDS_GROUP,
  }))

/**
 * Сколько колонок брендов заведено: по самой дальней. Заведённая колонка
 * есть в каждой строке — хотя бы пустой строкой.
 */
const countBrands = (rows) =>
  rows.reduce((max, row) => {
    for (let n = MAX_BRANDS; n > max; n -= 1) {
      if (row[brandKey(n)] !== undefined) return n
    }
    return max
  }, 0)

/** Строка с полями брендов 1…count: недостающие — пустые. */
const withBrands = (row, count) => {
  const next = { ...row }
  for (let n = 1; n <= count; n += 1) {
    if (next[brandKey(n)] === undefined) next[brandKey(n)] = ''
  }
  return next
}

/** Выход ролика в эфире: секунды, пусто — выхода не было («-» в файле). */
const spot = (key, label) => ({
  key,
  label,
  type: 'number',
  spot: true,
  nullable: true,
  group: SPOTS_GROUP,
})

/**
 * Колонки по форме листа. Таблицу выбираем по `kind`, а не по коду листа:
 * логов выходов четыре, эфиров два, соцсеть одна — форм всего три.
 * `accent` — дата и время выхода, их красим так же, как в файле.
 * `group` — общая подпись над колонками во второй строке шапки.
 * `nullable` — пустое число остаётся пустым, а не становится нулём.
 * `width` — своя ширина текстовой колонки; без неё колонка тянется.
 * Колонки брендов у эфиров добавляются к этим отдельно — см. brandColumns.
 */
const COLUMNS = {
  spot_log: [
    { key: 'item', label: 'Item name', type: 'text' },
    { key: 'date', label: 'Date', type: 'date', accent: true },
    { key: 'time', label: 'Time', type: 'time', accent: true },
  ],
  live_event: [
    { key: 'date', label: 'Date', type: 'date', accent: true },
    { key: 'time', label: 'Time', type: 'time', accent: true },
    { key: 'tournament', label: 'Tournament', type: 'text' },
    // Event уже, чтобы место досталось блоку выходов.
    { key: 'event', label: 'Event', type: 'text', width: 'w-[220px]' },
    spot('pre', 'pre'),
    spot('mid1', 'mid'),
    spot('mid2', 'mid'),
    spot('post', 'post'),
    {
      key: 'views',
      label: 'Views',
      type: 'number',
      nullable: true,
      group: SPOTS_GROUP,
    },
  ],
  social: [
    { key: 'link', label: 'Ссылка', type: 'text' },
    { key: 'impressions', label: 'Impressions', type: 'number' },
  ],
}

/** Пустая строка для «Добавить строку» — по форме листа. */
const EMPTY_ROW = {
  spot_log: () => ({ item: '', date: '', time: '' }),
  live_event: () => ({
    date: '',
    time: '',
    tournament: '',
    event: '',
    pre: null,
    mid1: null,
    mid2: null,
    post: null,
    views: null,
  }),
  social: (network) => ({ network, link: '', impressions: 0 }),
}

// Без скрытых колонок. Постоянный массив, чтобы не сбивать мемоизацию.
const NO_COLUMNS = []

/**
 * Соседние элементы с одинаковым ключом — одной ячейкой шапки: так группа
 * встаёт над своими колонками, а две «mid» сливаются в одну, как в файле.
 * Ключ null не сливается ни с чем.
 */
const mergeSpans = (columns, keyOf) =>
  columns.reduce((spans, column) => {
    const last = spans[spans.length - 1]
    const key = keyOf(column)
    if (last && key !== null && keyOf(last.column) === key) last.span += 1
    else spans.push({ column, span: 1 })
    return spans
  }, [])

/** Класс ячейки шапки по колонке. */
const headClass = (column, span = 1) =>
  cn(
    'border-l border-black/10 px-3',
    column.accent
      ? 'w-[130px] bg-[#ff665f]/90 text-center'
      : column.spot
        ? cn('text-center', span > 1 ? 'w-32' : 'w-16')
        : column.brand
          ? 'min-w-[140px] text-center'
          : column.type === 'number'
            ? 'w-[140px] text-right'
            : cn('text-left', column.width),
  )

// Соцсети в листе идут блоками: сначала Instagram, потом Telegram.
const NETWORK_ORDER = ['instagram', 'telegram']

const EYEBROW = {
  spot_log: 'Broadcast log',
  live_event: 'Live events',
  social: 'Social media report',
}

/**
 * ISO-дата из файла → дд.мм.гггг. Разбираем строкой, без Date: он читает
 * `2026-01-09` как полночь по UTC, и западнее Гринвича день съехал бы назад.
 */
const isoToRu = (value) => {
  const [year, month, day] = String(value).split('-')
  return year && month && day ? `${day}.${month}.${year}` : value
}

/** Значение ячейки в режиме просмотра. */
function display(column, value) {
  if (value === '' || value === null || value === undefined) return '—'
  if (column.type === 'date') return isoToRu(value)
  if (column.type === 'number') return formatNumber(value)
  return value
}

/**
 * Число из поля: всё лишнее отбрасываем. Пустое — ноль, а у необязательных
 * колонок остаётся пустым (null).
 */
const toCount = (value, nullable = false) => {
  const digits = String(value ?? '').replace(/[^\d]/g, '')
  if (!digits) return nullable ? null : 0
  return Number(digits)
}

/** Значение числовой ячейки в поле правки. */
const editValue = (column, value) =>
  column.nullable && (value === null || value === undefined)
    ? ''
    : formatNumber(value)

// Блоки красим, как в файле: выходы — красным (как дата и время в шапке),
// бренды — зелёным.
const GROUP_CELL = {
  [SPOTS_GROUP]: 'border-white/50 bg-[#ff665f]/90',
  [BRANDS_GROUP]: 'border-white/50 bg-[#84c450]/90',
}

/**
 * Строка в режиме правки. Мемоизирована: в логе промо бывает под 800 строк,
 * и без этого каждая набранная буква перерисовывала бы весь лист.
 */
const EditRow = memo(function EditRow({
  row,
  index,
  columns,
  errors,
  onChange,
  onRemove,
  onInsert,
}) {
  return (
    <tr className={cn('group', index % 2 ? 'bg-paper/35' : 'bg-surface')}>
      <td className="relative px-2 py-1.5 text-center text-[11px] text-ink-muted tnum">
        {index + 1}
        {/* «+» на нижней границе строки: вставляет пустую строку под ней. */}
        <button
          type="button"
          onClick={() => onInsert(index)}
          aria-label={`Добавить строку после ${index + 1}`}
          title="Добавить строку ниже"
          className="absolute -bottom-2.5 left-1/2 z-[5] flex size-5 -translate-x-1/2 items-center justify-center rounded-full bg-indigo-500 text-ink opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:scale-110 focus-visible:opacity-100 focus-ring"
        >
          <Plus size={12} strokeWidth={3} />
        </button>
      </td>
      {columns.map((column) => {
        const error = errors?.[column.key]
        return (
          <td
            key={column.key}
            className={cn(
              'border-l border-line px-1.5 py-1',
              GROUP_CELL[column.group],
            )}
          >
            <input
              type={
                column.type === 'number'
                  ? 'text'
                  : column.type === 'text'
                    ? 'text'
                    : column.type
              }
              // Время с секундами: так оно записано в файле.
              step={column.type === 'time' ? 1 : undefined}
              inputMode={column.type === 'number' ? 'numeric' : undefined}
              value={
                column.type === 'number'
                  ? editValue(column, row[column.key])
                  : (row[column.key] ?? '')
              }
              placeholder={column.nullable ? '—' : undefined}
              onChange={(e) =>
                onChange(
                  index,
                  column.key,
                  column.type === 'number'
                    ? toCount(e.target.value, column.nullable)
                    : e.target.value,
                )
              }
              aria-invalid={!!error}
              title={error}
              className={cn(
                'w-full rounded-lg border bg-surface px-2 py-1 text-[13px] text-ink outline-hidden transition-colors tnum focus:ring-2',
                (column.spot || column.brand) && 'text-center',
                error
                  ? 'border-danger focus:border-danger focus:ring-danger/20'
                  : 'border-line focus:border-indigo-400 focus:ring-indigo-200',
              )}
            />
          </td>
        )
      })}
      <td className="w-10 px-1 text-center">
        <button
          type="button"
          onClick={() => onRemove(index)}
          aria-label={`Удалить строку ${index + 1}`}
          title="Удалить строку"
          className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-danger/10 hover:text-danger focus-ring"
        >
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  )
})

/**
 * Лист отчёта за месяц: просмотр и правка. Сохраняется целиком по кнопке —
 * сервер принимает весь список строк в нужном порядке и отвечает листом с
 * новой версией.
 *
 * У соцсети лист один на обе сети, а вкладок две: `network` показывает
 * только строки своей сети, а при сохранении вторая сеть уходит нетронутой.
 *
 * `onSave(rows)` — свой способ сохранить вместо сервера: так таблицу берут
 * разделы, которых в файле отчёта нет (OTT живёт в браузере).
 * `hiddenColumns` — ключи колонок, которых в этом разделе нет (у OTT — post).
 * Передавайте постоянным массивом: от него зависит мемоизация строк.
 */
export function ReportSheetTable({
  sheet,
  contractId,
  period,
  network,
  title,
  subtitle,
  onSave,
  emptyHint = 'В загруженном файле этот лист пустой.',
  hiddenColumns = NO_COLUMNS,
}) {
  const { canEdit, isAdvertiser } = useAuth()
  // Загружать и править отчёт может только площадка.
  const readOnly = isAdvertiser || !canEdit
  const toast = useToast()
  const { mutate: saveSheet, isPending: saving } = useSaveReportSheet()

  const isSocial = sheet.kind === 'social'
  // Бренды «Total ads spots» заводят только у эфиров: Live spot и OTT.
  const isLive = sheet.kind === 'live_event'

  // Строки этой вкладки: у соцсети — только своей сети.
  const rows = useMemo(
    () =>
      isSocial
        ? sheet.rows.filter((row) => row.network === network)
        : sheet.rows,
    [sheet.rows, isSocial, network],
  )

  // Черновик правки: null — лист в режиме просмотра.
  const [draft, setDraft] = useState(null)
  // Ошибки сервера по ячейкам: { [индекс строки во вкладке]: { поле: текст } }.
  const [cellErrors, setCellErrors] = useState({})
  const editing = draft !== null
  const shown = editing ? draft : rows

  const brandCount = isLive ? countBrands(shown) : 0
  const columns = useMemo(
    () => [
      ...COLUMNS[sheet.kind].filter(
        (column) => !hiddenColumns.includes(column.key),
      ),
      ...brandColumns(brandCount),
    ],
    [sheet.kind, brandCount, hiddenColumns],
  )

  // Сменили лист или месяц — незаконченную правку не тащим за собой.
  useEffect(() => {
    setDraft(null)
    setCellErrors({})
  }, [sheet.code, network, period, contractId])

  const change = useCallback((index, key, value) => {
    setDraft((current) =>
      current.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    )
    setCellErrors((current) => {
      if (!current[index]?.[key]) return current
      const next = { ...current, [index]: { ...current[index] } }
      delete next[index][key]
      return next
    })
  }, [])

  const remove = useCallback((index) => {
    setDraft((current) => current.filter((_, i) => i !== index))
    // Ошибки привязаны к индексам — после удаления строки они съезжают.
    setCellErrors({})
  }, [])

  const insertAfter = useCallback(
    (index) => {
      setDraft((current) => [
        ...current.slice(0, index + 1),
        withBrands(EMPTY_ROW[sheet.kind](network), countBrands(current)),
        ...current.slice(index + 1),
      ])
      // Индексы ниже вставки съехали — ошибки к ним уже не относятся.
      setCellErrors({})
    },
    [sheet.kind, network],
  )

  const startEditing = () => {
    const count = countBrands(rows)
    setDraft(rows.map((row) => withBrands(row, count)))
    setCellErrors({})
  }

  const cancel = () => {
    setDraft(null)
    setCellErrors({})
  }

  const addRow = () =>
    setDraft((current) => [
      ...current,
      withBrands(EMPTY_ROW[sheet.kind](network), countBrands(current)),
    ])

  /** Новая колонка бренда — пустая ячейка в каждой строке. */
  const addBrand = () =>
    setDraft((current) => {
      const count = countBrands(current)
      if (count >= MAX_BRANDS) return current
      return current.map((row) => withBrands(row, count + 1))
    })

  /** Убрать колонку бренда: колонки правее съезжают на её место. */
  const removeBrand = (n) => {
    setDraft((current) => {
      const count = countBrands(current)
      return current.map((row) => {
        const next = { ...row }
        for (let k = n; k < count; k += 1) {
          next[brandKey(k)] = row[brandKey(k + 1)] ?? ''
        }
        delete next[brandKey(count)]
        return next
      })
    })
    // Ошибки привязаны к колонкам — после сдвига они уже не о тех ячейках.
    setCellErrors({})
  }

  /**
   * Весь лист в порядке файла. У соцсети сети идут блоками — правленая
   * встаёт на своё место, вторая остаётся как была. Смещение нужно, чтобы
   * разобрать ошибки сервера: он отвечает индексами всего листа.
   */
  const buildRows = (edited) => {
    if (!isSocial) return { all: edited, offset: 0 }
    let offset = 0
    const all = []
    for (const name of NETWORK_ORDER) {
      if (name === network) {
        offset = all.length
        all.push(...edited)
      } else {
        all.push(...sheet.rows.filter((row) => row.network === name))
      }
    }
    return { all, offset }
  }

  /** `rows[12].date` → { 12 - смещение: { date: текст } }. */
  const errorsByCell = (fields, offset) => {
    const result = {}
    for (const [path, message] of Object.entries(fields)) {
      const match = path.match(/^rows\[(\d+)\]\.(\w+)$/)
      if (!match) continue
      const index = Number(match[1]) - offset
      if (index < 0) continue
      result[index] = { ...result[index], [match[2]]: message }
    }
    return result
  }

  const save = () => {
    if (onSave) {
      try {
        onSave(draft)
      } catch {
        toast.error('Не удалось сохранить таблицу')
        return
      }
      setDraft(null)
      setCellErrors({})
      toast.success(`${title}: таблица сохранена`)
      return
    }

    const { all, offset } = buildRows(draft)
    saveSheet(
      {
        contractId,
        period,
        code: sheet.code,
        input: { version: sheet.version, rows: all },
      },
      {
        onSuccess: () => {
          setDraft(null)
          setCellErrors({})
          toast.success(`${title}: лист сохранён`)
        },
        onError: (error) => {
          if (isApiError(error) && error.status === 409) {
            // Лист успели изменить: отчёт уже перечитывается, правку
            // закрываем — поверх чужих данных её сохранять нельзя.
            setDraft(null)
            toast.error('Данные изменились, обновите страницу')
            return
          }
          if (isApiError(error) && Object.keys(error.fields).length) {
            setCellErrors(errorsByCell(error.fields, offset))
          }
          toast.error(error.message || 'Не удалось сохранить лист')
        },
      },
    )
  }

  const errorCount = Object.values(cellErrors).reduce(
    (sum, row) => sum + Object.keys(row ?? {}).length,
    0,
  )
  // Показы соцсети — сумма по строкам, как её считает и сервер.
  const impressions = isSocial
    ? shown.reduce((sum, row) => sum + (Number(row.impressions) || 0), 0)
    : 0

  // Шапка в две строки, если у колонок есть общая подпись группы.
  const grouped = columns.some((column) => column.group)
  // Итог по выходам, как под таблицей в файле: сколько эфиров с выходом
  // в каждой колонке и сколько выходов всего. Колонки выходов идут подряд.
  const firstSpot = columns.findIndex((column) => column.spot)
  const spotCounts = columns
    .filter((column) => column.spot)
    .map((column) => ({
      key: column.key,
      count: shown.filter((row) => Number(row[column.key]) > 0).length,
    }))
  const spotsTotal = spotCounts.reduce((sum, { count }) => sum + count, 0)
  const afterSpots = columns.length - firstSpot - spotCounts.length

  return (
    <Card className="relative overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-line bg-linear-to-br from-surface via-indigo-50 to-indigo-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-800">
            {EYEBROW[sheet.kind]}
          </p>
          <h3 className="mt-1 font-display text-xl font-semibold text-ink">
            {title}
          </h3>
          <p className="mt-1 text-[13px] text-ink-muted">{subtitle}</p>
        </div>

        {!readOnly && (
          <div className="flex flex-wrap items-center gap-2">
            {editing ? (
              <>
                <Button size="sm" variant="secondary" onClick={addRow}>
                  <Plus size={15} />
                  Добавить строку
                </Button>
                {isLive && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={addBrand}
                    disabled={!draft.length || brandCount >= MAX_BRANDS}
                    title={
                      !draft.length
                        ? 'Сначала добавьте строку'
                        : brandCount >= MAX_BRANDS
                          ? `Не больше ${MAX_BRANDS} брендов`
                          : 'Добавить колонку бренда в Total ads spots'
                    }
                  >
                    <Plus size={15} />
                    {brandCount
                      ? `Добавить бренд · ${brandCount}/${MAX_BRANDS}`
                      : 'Total ads spots'}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={cancel}
                  disabled={saving}
                >
                  <X size={15} />
                  Отмена
                </Button>
                <Button size="sm" onClick={save} disabled={saving}>
                  <Save size={15} />
                  {saving ? 'Сохраняем…' : 'Сохранить'}
                </Button>
              </>
            ) : (
              <Button size="sm" variant="secondary" onClick={startEditing}>
                <Pencil size={15} />
                Редактировать
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Сводка соцсети: публикации — это строки, показы — их сумма. */}
      {isSocial && (
        <div className="grid grid-cols-2 gap-3 border-b border-line p-4 sm:max-w-md">
          <div className="rounded-2xl border border-line bg-paper/40 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
              Публикации
            </p>
            <p className="mt-1 font-display text-xl font-semibold text-ink tnum">
              {formatNumber(shown.length)}
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-paper/40 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
              Impressions
            </p>
            <p className="mt-1 font-display text-xl font-semibold text-ink tnum">
              {formatNumber(impressions)}
            </p>
          </div>
        </div>
      )}

      {errorCount > 0 && (
        <p className="border-b border-danger/20 bg-danger/5 px-5 py-2.5 text-[13px] text-danger">
          Проверьте подсвеченные ячейки: ошибок — {errorCount}. Подсказка — при
          наведении на ячейку.
        </p>
      )}

      <div className="max-h-[560px] overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-indigo-500 text-[11px] font-semibold uppercase tracking-wider text-ink">
              <th
                rowSpan={grouped ? 2 : undefined}
                className="w-12 px-2 py-3 text-center"
              >
                №
              </th>
              {mergeSpans(columns, (column) => column.group ?? null).map(
                ({ column, span }) =>
                  column.group ? (
                    <th
                      key={column.group}
                      colSpan={span}
                      className="border-b border-l border-black/10 px-3 py-2 text-center"
                    >
                      {column.group}
                    </th>
                  ) : (
                    <th
                      key={column.key}
                      rowSpan={grouped ? 2 : undefined}
                      className={cn(headClass(column), 'py-3')}
                    >
                      {column.label}
                    </th>
                  ),
              )}
              {editing && (
                <th rowSpan={grouped ? 2 : undefined} className="w-10" />
              )}
            </tr>
            {grouped && (
              <tr className="bg-indigo-500 text-[11px] font-semibold uppercase tracking-wider text-ink">
                {mergeSpans(
                  columns.filter((column) => column.group),
                  (column) => column.label,
                ).map(({ column, span }) => (
                  <th
                    key={column.key}
                    colSpan={span}
                    className={cn(headClass(column, span), 'py-2')}
                  >
                    {column.brand && editing ? (
                      <span className="inline-flex items-center gap-1">
                        {column.label}
                        <button
                          type="button"
                          onClick={() => removeBrand(column.brand)}
                          aria-label={`Убрать колонку ${column.label}`}
                          title="Убрать колонку"
                          className="rounded p-0.5 opacity-60 transition-opacity hover:bg-black/10 hover:opacity-100 focus-ring"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ) : (
                      column.label
                    )}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-line">
            {!shown.length && (
              <tr>
                <td
                  colSpan={columns.length + (editing ? 2 : 1)}
                  className="px-4 py-12 text-center"
                >
                  <FileSpreadsheet
                    size={26}
                    className="mx-auto text-ink-muted"
                  />
                  <p className="mt-3 text-sm font-medium text-ink-soft">
                    Строк нет
                  </p>
                  <p className="mt-1 text-[13px] text-ink-muted">
                    {editing
                      ? 'Добавьте строку или отмените правку.'
                      : emptyHint}
                  </p>
                </td>
              </tr>
            )}
            {editing
              ? shown.map((row, index) => (
                  <EditRow
                    key={index}
                    row={row}
                    index={index}
                    columns={columns}
                    errors={cellErrors[index]}
                    onChange={change}
                    onRemove={remove}
                    onInsert={insertAfter}
                  />
                ))
              : shown.map((row, index) => (
                  <tr
                    key={index}
                    className={cn(
                      'transition-colors hover:bg-paper/70',
                      index % 2 ? 'bg-paper/35' : 'bg-surface',
                    )}
                  >
                    <td className="px-2 py-2 text-center text-[11px] text-ink-muted tnum">
                      {index + 1}
                    </td>
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          'border-l border-line px-3 py-2 text-[13px] text-ink',
                          column.accent && 'text-center tnum',
                          column.spot
                            ? 'text-center tnum'
                            : column.type === 'number' && 'text-right tnum',
                          column.brand && 'text-center',
                          GROUP_CELL[column.group],
                          column.key === 'link' && 'max-w-0 truncate',
                        )}
                        title={column.key === 'link' ? row.link : undefined}
                      >
                        {column.key === 'link' && row.link ? (
                          <a
                            href={row.link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-900 underline-offset-2 hover:underline"
                          >
                            {row.link}
                          </a>
                        ) : (
                          display(column, row[column.key])
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
          {firstSpot >= 0 && shown.length > 0 && (
            <tfoot className="sticky bottom-0 z-10 bg-paper text-[13px] font-semibold text-ink tnum">
              <tr className="border-t border-line">
                <td
                  colSpan={firstSpot + 1}
                  className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider text-ink-muted"
                >
                  Эфиров с выходом
                </td>
                {spotCounts.map(({ key, count }) => (
                  <td
                    key={key}
                    className="border-l border-line px-2 py-2 text-center"
                  >
                    {formatNumber(count)}
                  </td>
                ))}
                <td
                  colSpan={afterSpots + (editing ? 1 : 0)}
                  className="border-l border-line"
                />
              </tr>
              <tr className="border-t border-line">
                <td
                  colSpan={firstSpot + 1}
                  className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider text-ink-muted"
                >
                  Всего выходов
                </td>
                <td
                  colSpan={spotCounts.length}
                  className="border-l border-line px-2 py-2 text-center"
                >
                  {formatNumber(spotsTotal)}
                </td>
                <td
                  colSpan={afterSpots + (editing ? 1 : 0)}
                  className="border-l border-line"
                />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-line bg-paper/40 px-5 py-2.5 text-[12px] text-ink-muted">
        <span className="tnum">Строк: {formatNumber(shown.length)}</span>
        {editing && (
          <span>
            Изменения сохранятся для всего листа по кнопке «Сохранить»
          </span>
        )}
      </div>
    </Card>
  )
}
