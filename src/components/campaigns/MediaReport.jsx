import { useState } from 'react'
import { CampaignTabs, EditableSpotTable } from './CampaignMediaTabs.jsx'
import { SpotLogTable } from './SpotLogTable.jsx'
import {
  ChannelSummaryReport,
  SocialMediaReport,
  TotalStatisticsReport,
} from './CampaignReportPanels.jsx'

// Логи выходов: вкладка → лист в загружаемом отчёте.
const SPOT_LOGS = {
  ss1uzb: {
    sheetName: 'SS1 UZB',
    title: 'SS1 UZB',
    subtitle: 'Setanta Sports 1 · выходы роликов на UZB TV',
  },
  ss2uzb: {
    sheetName: 'SS2 UZB',
    title: 'SS2 UZB',
    subtitle: 'Setanta Sports 2 · выходы роликов на UZB TV',
  },
  promo1: {
    sheetName: 'Event Promo SS 1',
    title: 'Event Promo SS1',
    subtitle: 'Setanta Sports 1 · промо событий в эфире',
  },
  promo2: {
    sheetName: 'Event Promo SS2',
    title: 'Event Promo SS2',
    subtitle: 'Setanta Sports 2 · промо событий в эфире',
  },
}

/**
 * Медиаплан и отчёты: вкладки каналов и таблица выбранной вкладки.
 * Один и тот же блок открывается со страницы кампании и по месяцу в списке.
 */
export function MediaReport({ className }) {
  const [tab, setTab] = useState('spot1')

  return (
    <div className={className}>
      <CampaignTabs value={tab} onChange={setTab} />

      {SPOT_LOGS[tab] ? (
        <SpotLogTable logKey={tab} {...SPOT_LOGS[tab]} />
      ) : tab === 'stats' ? (
        <TotalStatisticsReport />
      ) : tab === 'channels' ? (
        <ChannelSummaryReport />
      ) : tab === 'social' ? (
        <SocialMediaReport />
      ) : (
        <EditableSpotTable key={tab} tableKey={tab} />
      )}
    </div>
  )
}
