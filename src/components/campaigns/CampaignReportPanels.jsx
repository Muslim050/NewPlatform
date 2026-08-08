import {
  Clapperboard,
  Instagram,
  MapPin,
  MonitorSmartphone,
  PlayCircle,
  RadioTower,
  Send,
  Timer,
  Tv,
} from "lucide-react";
import { formatNumber, formatPct } from "@/lib/format.js";
import { Card } from "@/components/ui/Card.jsx";
import { DonutChart } from "@/components/charts/DonutChart.jsx";

const CHANNELS = [
  {
    name: "Setanta Sports 1",
    code: "S1",
    standardSpots: 329,
    standardSeconds: 9870,
    liveAds: 272,
    liveSeconds: 8160,
    liveViews: 14111352,
  },
  {
    name: "Setanta Sports 2",
    code: "S2",
    standardSpots: 315,
    standardSeconds: 9450,
    liveAds: 172,
    liveSeconds: 5160,
    liveViews: 9596809,
  },
];

const SOCIAL_CHANNELS = [
  {
    name: "Instagram",
    icon: Instagram,
    color: "#8B5CF6",
    posts: 7,
    impressions: 188000,
    linkPrefix: "instagram.com/",
    rows: [51102, 30399, 29222, 27392, 23915, 14127, 11889],
  },
  {
    name: "Telegram",
    icon: Send,
    color: "#29B6F6",
    posts: 7,
    impressions: 307000,
    linkPrefix: "t.me/setanta_uzb/",
    rows: [35000, 39200, 42600, 58800, 46200, 42600, 42800],
  },
];

const TOTAL_METRICS = [
  { label: "Прямые эфиры", value: 111, icon: RadioTower },
  { label: "Рекламные ролики", value: 1088, icon: Clapperboard },
  { label: "Промо в эфире", value: 1295, icon: Tv },
  { label: "Хронометраж, сек.", value: 32640, icon: Timer },
  { label: "Просмотры Live Ads", value: 23708161, icon: PlayCircle },
];

const DEVICE_SHARE = [
  { label: "Браузер", value: 3, color: "#4A9BDF" },
  { label: "Smart TV", value: 66, color: "#F47B20" },
  { label: "Телефон", value: 30, color: "#A3A3A3" },
  { label: "Планшет", value: 1, color: "#FFD106" },
];

const CITY_SHARE = [
  ["Ташкент", 62.3],
  ["Самарканд", 12.6],
  ["Бухара", 7.3],
  ["Андижан", 2.1],
  ["Джизак", 2.1],
  ["Чирчик", 2.1],
  ["ZZC", 1.8],
  ["Навои", 1],
  ["Карши", 1],
  ["Фергана", 1],
  ["Наманган", 1],
  ["Шахрисабз", 0.8],
  ["Нукус", 0.7],
  ["Алмалык", 0.7],
  ["Денау", 0.7],
  ["Байсун", 0.6],
  ["Гулистан", 0.6],
  ["Зарафшан", 0.5],
  ["Хива", 0.5],
  ["Хорезмская область", 0.3],
  ["GHUST", 0.2],
  ["Коканд", 0.1],
].map(([name, value]) => ({ name, value }));

function ReportHeader({ eyebrow, title, subtitle }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-800">
        {eyebrow}
      </p>
      <h3 className="mt-2 font-display text-2xl font-semibold text-ink sm:text-3xl">
        {title}
      </h3>
      <p className="mt-1 max-w-2xl text-sm text-ink-muted">{subtitle}</p>
    </div>
  );
}

function ChannelMetric({ label, value, unit, accent = "coral" }) {
  const accentClass =
    accent === "green"
      ? "border-success/20 bg-gradient-to-br from-surface to-success/[0.06]"
      : "border-indigo-200 bg-gradient-to-br from-surface to-indigo-50";

  return (
    <div className={`rounded-2xl border p-4 shadow-soft ${accentClass}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl font-semibold text-ink tnum">
        {formatNumber(value)}
      </p>
      {unit && <p className="mt-0.5 text-[12px] text-ink-muted">{unit}</p>}
    </div>
  );
}

function ChannelPanel({ channel }) {
  return (
    <div className="rounded-3xl border border-line bg-surface/90 p-4 shadow-soft sm:p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 font-display text-sm font-bold text-ink">
          {channel.code}
        </span>
        <div>
          <h4 className="font-display text-lg font-semibold text-ink">
            {channel.name}
          </h4>
          <p className="text-[12px] text-ink-muted">TV media performance</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <ChannelMetric
          label="Standard spot"
          value={channel.standardSpots}
          unit="роликов"
        />
        <ChannelMetric
          label="Live spot UFC / Football"
          value={channel.liveAds}
          unit="Live Ads"
        />
        <ChannelMetric
          label="Standard spot"
          value={channel.standardSeconds}
          unit="секунд"
        />
        <ChannelMetric
          label="Live spot UFC / Football"
          value={channel.liveSeconds}
          unit="секунд"
        />
        <div className="col-span-2">
          <ChannelMetric
            label="TV Live Ads Views"
            value={channel.liveViews}
            unit="просмотров"
          />
        </div>
      </div>
    </div>
  );
}

export function ChannelSummaryReport() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-indigo-200 bg-gradient-to-br from-surface via-[#fffdf5] to-indigo-100 p-5 shadow-lift sm:p-6">
      <div className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full border border-indigo-300/60" />
      <div className="pointer-events-none absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-indigo-100/70 blur-3xl" />
      <ReportHeader
        eyebrow="Channel report"
        title="Total Spot statistic"
        subtitle="Сводные показатели стандартных и live-размещений по двум телеканалам."
      />

      <div className="relative mt-6 grid gap-4 xl:grid-cols-2">
        {CHANNELS.map((channel) => (
          <ChannelPanel key={channel.code} channel={channel} />
        ))}
      </div>

      <div className="relative mt-4 grid gap-4 sm:grid-cols-2">
        <ChannelMetric
          label="TV Event Promo Count"
          value={1295}
          unit="промо в эфире"
          accent="green"
        />
        <ChannelMetric
          label="OTT Pre-roll Views"
          value={884310}
          unit="просмотров"
          accent="green"
        />
      </div>
    </section>
  );
}

function SocialReportCard({ channel }) {
  const Icon = channel.icon;
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b border-line p-5">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
            style={{ backgroundColor: channel.color }}
          >
            <Icon size={20} />
          </span>
          <div>
            <h4 className="font-display text-lg font-semibold text-ink">
              {channel.name}
            </h4>
            <p className="text-[12px] text-ink-muted">Social media report</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-semibold text-ink tnum">
            {formatNumber(channel.impressions)}
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
          <p className="text-[11px] text-ink-muted">Impressions</p>
          <p className="mt-1 font-display text-xl font-semibold text-ink tnum">
            {formatNumber(channel.impressions)}
          </p>
        </div>
      </div>

      <div className="divide-y divide-line">
        {channel.rows.map((value, index) => (
          <div
            key={`${channel.name}-${index + 1}`}
            className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-3"
          >
            <span className="truncate text-[12px] font-medium text-ink-soft">
              {channel.linkPrefix}XXXXXXX
            </span>
            <span className="text-[12px] font-semibold text-ink tnum">
              {formatNumber(value)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function SocialMediaReport() {
  return (
    <div>
      <section className="relative overflow-hidden rounded-3xl border border-indigo-200 bg-gradient-to-br from-surface via-[#fffdf5] to-indigo-100 p-5 shadow-lift sm:p-6">
        <div className="pointer-events-none absolute -right-12 -top-20 h-44 w-44 rounded-full border border-indigo-300/60" />
        <ReportHeader
          eyebrow="Social media report"
          title="Instagram | Telegram"
          subtitle="Публикации и показы в социальных каналах Setanta Sports."
        />
      </section>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {SOCIAL_CHANNELS.map((channel) => (
          <SocialReportCard key={channel.name} channel={channel} />
        ))}
      </div>
    </div>
  );
}

function TotalMetric({ item }) {
  const Icon = item.icon;
  return (
    <div className="rounded-2xl border border-line bg-surface/85 p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-muted">
          {item.label}
        </p>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-900">
          <Icon size={16} />
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold text-ink tnum">
        {formatNumber(item.value)}
      </p>
    </div>
  );
}

export function TotalStatisticsReport() {
  return (
    <div>
      <section className="relative overflow-hidden rounded-3xl border border-indigo-200 bg-gradient-to-br from-surface via-[#fffdf5] to-indigo-100 p-5 shadow-lift sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full border border-indigo-300/60" />
        <div className="pointer-events-none absolute right-32 top-0 h-32 w-32 rounded-full bg-indigo-200/50 blur-3xl" />
        <ReportHeader
          eyebrow="Total statistics"
          title="Общая статистика размещений"
          subtitle="Сводка эфира, социальных сетей, устройств и географии аудитории."
        />
        <div className="relative mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {TOTAL_METRICS.map((item) => (
            <TotalMetric key={item.label} item={item} />
          ))}
        </div>
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.72fr_0.95fr_1.1fr]">
        <Card className="p-5">
          <h4 className="font-display text-base font-semibold text-ink">
            Социальные сети
          </h4>
          <p className="text-[12px] text-ink-muted">Instagram и Telegram</p>
          <div className="mt-4 space-y-3">
            {SOCIAL_CHANNELS.map((channel) => {
              const Icon = channel.icon;
              return (
                <div
                  key={channel.name}
                  className="rounded-2xl border border-line bg-paper/40 p-4"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
                      style={{ backgroundColor: channel.color }}
                    >
                      <Icon size={16} />
                    </span>
                    <span className="font-display text-sm font-semibold text-ink">
                      {channel.name}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-ink-muted">
                        Posts
                      </p>
                      <p className="mt-1 text-lg font-semibold text-ink tnum">
                        {channel.posts}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-ink-muted">
                        Impressions
                      </p>
                      <p className="mt-1 text-lg font-semibold text-ink tnum">
                        {formatNumber(channel.impressions)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="font-display text-base font-semibold text-ink">
                Распределение устройств
              </h4>
              <p className="text-[12px] text-ink-muted">Device share</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-900">
              <MonitorSmartphone size={18} />
            </span>
          </div>
          <div className="mt-5 flex flex-col items-center gap-5">
            <DonutChart
              data={DEVICE_SHARE}
              size={190}
              thickness={22}
              centerValue="66%"
              centerLabel="Smart TV"
            />
            <div className="w-full space-y-2">
              {DEVICE_SHARE.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 text-sm"
                >
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
          <div className="flex items-start justify-between gap-3 border-b border-line p-5 pb-4">
            <div>
              <h4 className="font-display text-base font-semibold text-ink">
                География аудитории
              </h4>
              <p className="text-[12px] text-ink-muted">City viewers</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-900">
              <MapPin size={18} />
            </span>
          </div>
          <div className="max-h-[470px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-paper/95 backdrop-blur">
                <tr className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                  <th className="w-10 py-2.5 pl-5 text-left">№</th>
                  <th className="py-2.5 pl-2.5 pr-5 text-left">Город</th>
                  <th className="px-5 py-2.5 text-right">Зрители</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {CITY_SHARE.map((city, index) => (
                  <tr key={city.name} className="hover:bg-ink/[0.015]">
                    <td className="py-2.5 pl-5 text-[12px] text-ink-muted tnum">
                      {index + 1}
                    </td>
                    <td className="py-2.5 pl-2.5 pr-5 font-medium text-ink-soft">
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
    </div>
  );
}
