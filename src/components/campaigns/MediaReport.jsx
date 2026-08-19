import { useEffect, useState } from 'react'
import {
  CampaignTabs,
  EditableSpotTable,
  useCampaignTabs,
} from './CampaignMediaTabs.jsx'
import { SpotLogTable } from './SpotLogTable.jsx'
import {
  ChannelSummaryReport,
  SocialMediaReport,
  TotalStatisticsReport,
} from './CampaignReportPanels.jsx'

/**
 * Медиаплан и отчёты: вкладки категорий и таблица выбранной вкладки.
 * Состав вкладок пользователь собирает сам, свой у каждого договора.
 */
export function MediaReport({ className, scopeId }) {
  const [tab, setTab] = useState('channels')
  const { groups, tabs, addCategory, removeCategory } = useCampaignTabs(scopeId)
  const current = tabs.find((item) => item.value === tab)

  // Договор сменился — открытая вкладка могла исчезнуть.
  useEffect(() => {
    if (!tabs.some((item) => item.value === tab)) setTab('channels')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeId])

  // Категорию открываем сразу на её первом канале.
  const createCategory = (name) => {
    const created = addCategory(name)
    if (created?.channels?.length) setTab(created.channels[0].id)
  }

  // Убрали категорию с открытой вкладкой — возвращаемся к сводке.
  const dropCategory = (categoryId) => {
    removeCategory(categoryId)
    if (current?.categoryId === categoryId) setTab('channels')
  }

  return (
    <div className={className}>
      <CampaignTabs
        value={tab}
        onChange={setTab}
        groups={groups}
        onAddCategory={createCategory}
        onRemoveCategory={dropCategory}
      />

      {tab === 'stats' ? (
        <TotalStatisticsReport />
      ) : tab === 'channels' ? (
        <ChannelSummaryReport />
      ) : current?.kind === 'social' ? (
        <SocialMediaReport channel={current.label} channelKey={tab} />
      ) : current?.kind === 'log' ? (
        <SpotLogTable
          key={tab}
          logKey={tab}
          sheetName={current.label}
          title={current.label}
          subtitle={`${current.group} · выходы роликов`}
        />
      ) : current ? (
        <EditableSpotTable
          key={tab}
          tableKey={tab}
          title={`${current.group.toUpperCase()} — ${current.label.toUpperCase()}`}
          subtitle={`${current.label} · размещения и расписание эфиров`}
        />
      ) : null}
    </div>
  )
}
