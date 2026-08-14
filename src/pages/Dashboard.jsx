import {
  Instagram,
  Send,
  RadioTower,
  Clapperboard,
  Tv,
  Timer,
  PlayCircle,
  MonitorSmartphone,
  MapPin,
  UsersRound,
  Trophy,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext.jsx'
import { formatCompact, formatPct, formatNumber } from '@/lib/format.js'
import { PageHeader } from '@/components/PageHeader.jsx'
import { Card } from '@/components/ui/Card.jsx'
import { Badge } from '@/components/ui/Badge.jsx'
import { DonutChart } from '@/components/charts/DonutChart.jsx'

const MEDIA_TOTALS = [
  { label: 'Прямые эфиры', value: 111, icon: RadioTower },
  { label: 'Рекламные ролики', value: 1088, icon: Clapperboard },
  { label: 'Промо в эфире', value: 1295, icon: Tv },
  { label: 'Хронометраж, сек.', value: 32640, icon: Timer },
  { label: 'Просмотры Live Ads', value: 23708161, icon: PlayCircle },
]

const SOCIAL_CHANNELS = [
  {
    name: 'Instagram',
    icon: Instagram,
    color: '#FFD106',
    posts: 7,
    impressions: 188046,
    rows: [51102, 30399, 29222, 27392, 23915, 14127, 11889].map(
      (value, index) => ({ id: `instagram-${index + 1}`, value }),
    ),
  },
  {
    name: 'Telegram',
    icon: Send,
    color: '#0EA5E9',
    posts: 7,
    impressions: 307200,
    rows: [35000, 39200, 42600, 58800, 46200, 42600, 42800].map(
      (value, index) => ({ id: `telegram-${index + 1}`, value }),
    ),
  },
]

const DEVICE_SHARE = [
  { label: 'Браузер', value: 3, color: '#68A9DC' },
  { label: 'Smart TV', value: 66, color: '#EE9B5A' },
  { label: 'Телефон', value: 30, color: '#A7ADB4' },
  { label: 'Планшет', value: 1, color: '#EFCB55' },
]

const AGE_SHARE = [
  { label: '18–24', value: 33, color: '#F2C94C' },
  { label: '25–34', value: 42, color: '#84C65A' },
  { label: '35–44', value: 18, color: '#76B7E5' },
  { label: '45–54', value: 6, color: '#F1DFC0' },
  { label: '13–17', value: 1, color: '#F27474' },
]

const PLATFORM_DEVICE_SHARE = [
  {
    platform: 'OTT',
    data: [
      { label: 'Телефон', value: 65, color: '#68A9DC' },
      { label: 'Smart TV', value: 22, color: '#EFCB55' },
      { label: 'Браузер', value: 10, color: '#A7ADB4' },
      { label: 'Планшет', value: 3, color: '#EE9B5A' },
    ],
  },
  {
    platform: 'TV',
    data: [
      { label: 'Smart TV', value: 54, color: '#EFCB55' },
      { label: 'Телефон', value: 33, color: '#68A9DC' },
      { label: 'Браузер', value: 12, color: '#A7ADB4' },
      { label: 'Планшет', value: 1, color: '#EE9B5A' },
    ],
  },
]

const LEAGUE_AGE_ROWS = [
  {
    sport: 'Football',
    leagues: 'EPL, LaLiga, Ligue 1, Bundesliga, Serie A',
    ages: ['27,8%', '33,3%', '22,2%', '16,7%'],
  },
  {
    sport: 'MMA Fights',
    leagues: 'UFC, Bellator, PFL',
    ages: ['37,9%', '34,5%', '16,5%', '11,1%'],
  },
  {
    sport: 'Racing',
    leagues: 'F1',
    ages: ['15,6%', '31,9%', '27,9%', '24,6%'],
  },
  {
    sport: 'Tennis',
    leagues: 'WTA, ATP',
    ages: ['17,0%', '31,2%', '28,2%', '23,6%'],
  },
  {
    sport: 'Basketball',
    leagues: 'NBA',
    ages: ['35,3%', '28,8%', '24,7%', '11,2%'],
  },
  {
    sport: 'Hockey',
    leagues: 'NHL',
    ages: ['15,8%', '25,5%', '32,5%', '26,2%'],
  },
]

const CITY_SHARE = [
  ['Ташкент', 62.3],
  ['Самарканд', 12.6],
  ['Бухара', 7.3],
  ['Андижан', 2.1],
  ['Джизак', 2.1],
  ['Чирчик', 2.1],
  ['ZZC', 1.8],
  ['Навои', 1],
  ['Карши', 1],
  ['Фергана', 1],
  ['Наманган', 1],
  ['Шахрисабз', 0.8],
  ['Нукус', 0.7],
  ['Алмалык', 0.7],
  ['Денау', 0.7],
  ['Байсун', 0.6],
  ['Гулистан', 0.6],
  ['Зарафшан', 0.5],
  ['Хива', 0.5],
  ['Хорезмская область', 0.3],
  ['GHUST', 0.2],
  ['Коканд', 0.1],
].map(([name, value]) => ({ name, value }))

function MediaMetric({ item }) {
  const Icon = item.icon
  return (
    <div className="group rounded-2xl border border-line bg-surface p-4 shadow-soft transition-colors hover:border-indigo-300">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted">
          {item.label}
        </span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-900 transition-transform group-hover:scale-105">
          <Icon size={16} />
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold text-ink tnum">
        {formatNumber(item.value)}
      </p>
    </div>
  )
}

function SocialChannelCard({ channel }) {
  const Icon = channel.icon
  const max = Math.max(...channel.rows.map((row) => row.value))
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b border-line p-5">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl text-ink"
            style={{ backgroundColor: channel.color }}
          >
            <Icon size={19} />
          </span>
          <div>
            <h3 className="font-display text-base font-semibold text-ink">
              {channel.name}
            </h3>
            <p className="text-[12px] text-ink-muted">Результаты публикаций</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-xl font-semibold text-ink tnum">
            {formatCompact(channel.impressions)}
          </p>
          <p className="text-[11px] text-ink-muted">показов</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 bg-paper/45 p-4">
        <div className="rounded-xl bg-surface px-3 py-2.5">
          <p className="text-[11px] text-ink-muted">Публикации</p>
          <p className="mt-1 font-display text-xl font-semibold text-ink tnum">
            {channel.posts}
          </p>
        </div>
        <div className="rounded-xl bg-surface px-3 py-2.5">
          <p className="text-[11px] text-ink-muted">Средний охват</p>
          <p className="mt-1 font-display text-xl font-semibold text-ink tnum">
            {formatCompact(channel.impressions / channel.posts)}
          </p>
        </div>
      </div>
      <div className="space-y-3 p-5 pt-4">
        {channel.rows.map((row, index) => (
          <div
            key={row.id}
            className="grid grid-cols-[92px_1fr_62px] items-center gap-3"
          >
            <span className="text-[12px] text-ink-muted">
              Публикация {String(index + 1).padStart(2, '0')}
            </span>
            <span className="h-1.5 overflow-hidden rounded-full bg-ink/[0.06]">
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${(row.value / max) * 100}%`,
                  backgroundColor: channel.color,
                }}
              />
            </span>
            <span className="text-right text-[12px] font-medium text-ink tnum">
              {formatNumber(row.value)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}

function MediaSummary() {
  return (
    <>
      <section className="relative overflow-hidden rounded-[28px] border border-indigo-200 bg-gradient-to-br from-surface via-[#fffdf5] to-indigo-100 p-5 shadow-lift sm:p-7">
        <div className="pointer-events-none absolute -right-24 -top-32 h-72 w-72 rounded-full border border-indigo-300/60" />
        <div className="pointer-events-none absolute -right-8 -top-12 h-44 w-44 rounded-full bg-indigo-200/45 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-800">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
              Setanta Media Report
            </div>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink sm:text-3xl">
              Общая статистика эфира
            </h2>
            <p className="mt-1 max-w-xl text-sm text-ink-muted">
              Ключевые показатели телевизионных и digital-размещений.
            </p>
          </div>
          <div className="flex gap-6 rounded-2xl border border-line bg-surface/90 px-5 py-3.5 shadow-soft backdrop-blur">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-ink-muted">
                Публикации
              </p>
              <p className="mt-1 font-display text-lg font-semibold text-ink tnum">
                14
              </p>
            </div>
            <div className="h-10 w-px bg-line" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-ink-muted">
                Показы в соцсетях
              </p>
              <p className="mt-1 font-display text-lg font-semibold text-ink tnum">
                {formatNumber(495246)}
              </p>
            </div>
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {MEDIA_TOTALS.map((item) => (
            <MediaMetric key={item.label} item={item} />
          ))}
        </div>
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {SOCIAL_CHANNELS.map((channel) => (
          <SocialChannelCard key={channel.name} channel={channel} />
        ))}
      </div>
    </>
  )
}

function AudienceAgeReport() {
  return (
    <section className="mt-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-muted">
            Audience insights
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
            Возраст целевой аудитории
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Демография зрителей Setanta Sports и распределение по лигам.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-line bg-paper/70 px-3 py-2 text-[12px] font-semibold text-ink-soft">
          <UsersRound size={16} />
          95,5% аудитории — мужчины
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="overflow-hidden">
          <div className="border-b border-line bg-paper/45 p-5">
            <h3 className="font-display text-lg font-semibold text-ink">
              Возрастная структура
            </h3>
            <p className="mt-1 text-[13px] text-ink-muted">
              Основное ядро аудитории — зрители от 18 до 34 лет.
            </p>
          </div>
          <div className="flex flex-col items-center gap-6 p-5 sm:flex-row sm:justify-center sm:p-6">
            <DonutChart
              data={AGE_SHARE}
              size={220}
              thickness={34}
              centerValue="95,5%"
              centerLabel="мужчины"
            />
            <div className="w-full max-w-[250px] space-y-2.5">
              {AGE_SHARE.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-xl border border-line bg-paper/55 px-3 py-2.5"
                >
                  <span
                    className="h-3 w-3 rounded-full shadow-[0_0_0_3px_rgba(22,22,28,0.04)]"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium text-ink-soft">
                    {item.label}
                  </span>
                  <span className="ml-auto font-display text-base font-semibold text-ink tnum">
                    {formatPct(item.value, 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-start justify-between gap-4 border-b border-line bg-paper/45 p-5">
            <div>
              <h3 className="font-display text-lg font-semibold text-ink">
                Устройства: OTT и TV
              </h3>
              <p className="mt-1 text-[13px] text-ink-muted">
                Доля просмотров по типам экранов в каждой среде.
              </p>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink text-white shadow-soft">
              <MonitorSmartphone size={19} />
            </span>
          </div>
          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
            {PLATFORM_DEVICE_SHARE.map((platform) => (
              <div
                key={platform.platform}
                className="flex flex-col items-center gap-4 rounded-2xl border border-line/80 bg-paper/55 p-4"
              >
                <DonutChart
                  data={platform.data}
                  size={176}
                  thickness={30}
                  centerValue={platform.platform}
                />
                <div className="w-full space-y-2">
                  {platform.data.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-2 text-[13px]"
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-ink-soft">{item.label}</span>
                      <span className="ml-auto font-semibold text-ink tnum">
                        {formatPct(item.value, 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-4 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line bg-paper/45 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">
              Возраст аудитории по лигам
            </h3>
            <p className="mt-1 text-[13px] text-ink-muted">
              Доля зрителей в каждой возрастной группе.
            </p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-white shadow-soft">
            <Trophy size={19} />
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-ink text-white">
              <tr className="text-[11px] font-semibold uppercase tracking-wider">
                <th className="px-5 py-3 text-left">Sport</th>
                <th className="px-5 py-3 text-left">League</th>
                <th className="px-4 py-3 text-center">18–24 y.o.</th>
                <th className="px-4 py-3 text-center">25–34 y.o.</th>
                <th className="px-4 py-3 text-center">35–44 y.o.</th>
                <th className="px-4 py-3 text-center">45–54 y.o.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {LEAGUE_AGE_ROWS.map((row) => (
                <tr key={row.sport} className="transition-colors hover:bg-indigo-50/70">
                  <td className="px-5 py-3.5 font-semibold text-ink">
                    {row.sport}
                  </td>
                  <td className="max-w-[270px] px-5 py-3.5 text-[13px] text-ink-soft">
                    {row.leagues}
                  </td>
                  {row.ages.map((value, index) => (
                    <td
                      key={`${row.sport}-${index}`}
                      className="px-4 py-3.5 text-center font-semibold text-ink tnum"
                    >
                      <span className="inline-flex min-w-[58px] justify-center rounded-lg border border-line bg-paper/70 px-2 py-1.5">
                        {value}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  )
}

function AudienceBreakdown() {
  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[0.82fr_1.18fr]">
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-base font-semibold text-ink">
              Распределение устройств
            </h3>
            <p className="text-[13px] text-ink-muted">
              Доля просмотров по типам экранов
            </p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-900">
            <MonitorSmartphone size={18} />
          </span>
        </div>
        <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
          <DonutChart
            data={DEVICE_SHARE}
            size={190}
            thickness={22}
            centerValue="66%"
            centerLabel="Smart TV"
          />
          <div className="w-full max-w-[220px] space-y-2.5">
            {DEVICE_SHARE.map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-sm">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-ink-soft">{item.label}</span>
                <span className="ml-auto font-semibold text-ink tnum">
                  {formatPct(item.value, 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-line p-5 pb-4">
          <div>
            <h3 className="font-display text-base font-semibold text-ink">
              География аудитории
            </h3>
            <p className="text-[13px] text-ink-muted">
              Доля зрителей по городам Узбекистана
            </p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-900">
            <MapPin size={18} />
          </span>
        </div>
        <div className="max-h-[330px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-paper/95 backdrop-blur">
              <tr className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                <th className="px-5 py-2.5 text-left">Город</th>
                <th className="px-5 py-2.5 text-right">Зрители</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {CITY_SHARE.map((city) => (
                <tr key={city.name} className="hover:bg-ink/[0.015]">
                  <td className="px-5 py-2.5 font-medium text-ink-soft">
                    {city.name}
                  </td>
                  <td className="relative px-5 py-2.5 text-right">
                    <span
                      className="absolute inset-y-1.5 right-3 rounded-md bg-indigo-100"
                      style={{ width: `${Math.max(city.value, 4)}%` }}
                    />
                    <span className="relative font-semibold text-ink tnum">
                      {formatPct(city.value, 2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default function Dashboard() {
  const { user, isAdvertiser } = useAuth()
  const firstName = user.name.split(' ')[0]

  return (
    <div>
      <PageHeader
        title={`Здравствуйте, ${firstName}`}
        subtitle={
          isAdvertiser
            ? 'Сводка по вашим медиаразмещениям.'
            : 'Сводка медиаразмещений и социальных сетей.'
        }
      >

      </PageHeader>

      <MediaSummary />
      <AudienceAgeReport />
      <AudienceBreakdown />
    </div>
  )
}
