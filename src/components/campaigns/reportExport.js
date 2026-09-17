import { PLAN_COLUMNS, loadPlanRows } from './CampaignMediaTabs.jsx'
import { loadSpotLogRows } from './SpotLogTable.jsx'
import {
  SOCIAL_CHANNELS,
  SPOT_SEED,
  TOTAL_SEED,
  loadSocialReport,
  loadStats,
} from './CampaignReportPanels.jsx'

/**
 * Выгрузка всей статистики отчёта: лист книги на вкладку. Данные берём из
 * тех же загрузчиков, что рисуют панели, — в файл попадает ровно то, что
 * видно на экране, включая скрытые от наблюдателя показатели.
 */

/** Наблюдателю просмотры не показываем — ни в панелях, ни в выгрузке. */
const HIDDEN_FOR_VIEWER = 'Просмотры Live Ads'

const text = (value) =>
  value === null || value === undefined ? '' : String(value)

/** Сводка «Total»: эфирные показатели, соцсети, устройства и города. */
function totalSheet(isViewer) {
  const data = loadStats('total', TOTAL_SEED)
  const rows = [['Показатель', 'Значение']]

  for (const metric of data.metrics ?? []) {
    if (isViewer && metric.label === HIDDEN_FOR_VIEWER) continue
    rows.push([text(metric.label), text(metric.value)])
  }

  rows.push([], ['Соцсеть', 'Публикации', 'Показы'])
  for (const channel of data.social ?? []) {
    rows.push([
      text(channel.name),
      text(channel.posts),
      text(channel.impressions),
    ])
  }

  if (!isViewer) {
    rows.push([], ['Устройство', 'Доля, %'])
    for (const device of data.devices ?? []) {
      rows.push([text(device.label), text(device.value)])
    }
    rows.push([], ['Город', 'Доля, %'])
    for (const city of data.cities ?? []) {
      rows.push([text(city.name), text(city.value)])
    }
  }

  return { name: 'Total', rows }
}

/** Сводка «Spot»: показатели по двум телеканалам плюс промо и pre-roll. */
function spotSheet(isViewer) {
  const data = loadStats('spot', SPOT_SEED)
  const header = [
    'Канал',
    'Standard spot, роликов',
    'Standard spot, секунд',
    'Live spot, Live Ads',
    'Live spot, секунд',
  ]
  if (!isViewer) header.push('TV Live Ads Views')

  const rows = [header]
  for (const channel of data.channels ?? []) {
    const row = [
      text(channel.name),
      text(channel.standardSpots),
      text(channel.standardSeconds),
      text(channel.liveAds),
      text(channel.liveSeconds),
    ]
    if (!isViewer) row.push(text(channel.liveViews))
    rows.push(row)
  }

  rows.push(
    [],
    ['TV Event Promo Count', text(data.eventPromo)],
    ['OTT Pre-roll Views', text(data.ottPreroll)],
  )

  return { name: 'Spot', rows }
}

/** Медиаплан канала — те же колонки, что в таблице. */
function planSheet(tab, isViewer) {
  const columns = isViewer
    ? PLAN_COLUMNS.filter((column) => column.key !== 'views')
    : PLAN_COLUMNS
  const rows = loadPlanRows(tab.value)

  return {
    name: sheetName(tab),
    rows: [
      columns.map((column) => column.label),
      ...rows.map((row) => columns.map((column) => text(row[column.key]))),
    ],
  }
}

/** Лог выходов ролика. */
function logSheet(tab) {
  return {
    name: sheetName(tab),
    rows: [
      ['ITEM NAME', 'DATE', 'TIME'],
      ...loadSpotLogRows(tab.value).map((row) => [
        text(row.item),
        text(row.date),
        text(row.time),
      ]),
    ],
  }
}

/** Соцсеть: итоги сверху, ниже — публикации со ссылками. */
function socialSheet(tab) {
  const channel =
    SOCIAL_CHANNELS.find((item) => item.name === tab.label) ??
    SOCIAL_CHANNELS[0]
  const report = loadSocialReport(tab.value, channel)

  return {
    name: sheetName(tab),
    rows: [
      ['Публикации', text(report.posts)],
      ['Показы', text(report.impressions)],
      [],
      ['Ссылка', 'Просмотры'],
      ...(report.rows ?? []).map((row) => [text(row.link), text(row.views)]),
    ],
  }
}

/** Имя листа: категория и канал. Длину и запрещённые символы чистит книга. */
const sheetName = (tab) => (tab.group ? `${tab.group} ${tab.label}` : tab.label)

/**
 * Листы для книги: по вкладкам отчёта, в том же порядке, что на экране.
 * tabs — плоский список из useCampaignTabs.
 */
export function buildReportSheets({ tabs = [], isViewer = false }) {
  return tabs
    .map((tab) => {
      if (tab.value === 'stats') return totalSheet(isViewer)
      if (tab.value === 'channels') return spotSheet(isViewer)
      if (tab.kind === 'plan') return planSheet(tab, isViewer)
      if (tab.kind === 'log') return logSheet(tab)
      if (tab.kind === 'social') return socialSheet(tab)
      return null
    })
    .filter(Boolean)
}
