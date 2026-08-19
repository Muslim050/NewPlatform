import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  Eye,
  MousePointerClick,
  Radio,
  Target,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { useData } from "@/context/DataContext.jsx";
import { useScopedCampaigns } from "@/lib/useScope.js";
import {
  STATUS,
  cpa,
  cpm,
  ctr,
  cvr,
  pacing,
  statusLabel,
} from "@/lib/metrics.js";
import { seededSeries } from "@/lib/id.js";
import {
  formatCompact,
  formatDate,
  formatMoney,
  formatMoneyCompact,
  formatPct,
  lastNDates,
} from "@/lib/format.js";
import { PageHeader } from "@/components/PageHeader.jsx";
import { Logo } from "@/components/Logo.jsx";
import { AreaChart } from "@/components/charts/AreaChart.jsx";
import { Avatar } from "@/components/ui/Avatar.jsx";
import { Badge } from "@/components/ui/Badge.jsx";
import { Button } from "@/components/ui/Button.jsx";
import { Card } from "@/components/ui/Card.jsx";
import { Progress } from "@/components/ui/Progress.jsx";
import { SegmentTabs } from "@/components/ui/Tabs.jsx";
import { MediaReport } from "@/components/campaigns/MediaReport.jsx";

const METRICS = {
  spent: { label: "Расход", color: "#FFD106", format: formatMoneyCompact },
  impressions: { label: "Показы", color: "#0EA5E9", format: formatCompact },
  clicks: { label: "Клики", color: "#12A150", format: formatCompact },
};

function MetricCard({ icon: Icon, label, value, hint }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-medium text-ink-muted">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-900">
          <Icon size={16} />
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold text-ink tnum">
        {value}
      </p>
      <p className="mt-1 text-[12px] text-ink-muted">{hint}</p>
    </Card>
  );
}

export default function CampaignStats() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const campaigns = useScopedCampaigns();
  const { advertiserById, channelById } = useData();
  const [metric, setMetric] = useState("spent");

  const campaign = campaigns.find((item) => item.id === campaignId);
  if (!campaign) return <Navigate to="/app/campaigns" replace />;

  const advertiser = advertiserById(campaign.advertiserId);
  // Медиаплан и отчётные вкладки доступны у всех запущенных кампаний.
  const hasMediaTables = campaign.status === "active";
  const channels = campaign.channelIds.flatMap((id) => {
    const channel = channelById(id);
    return channel ? [channel] : [];
  });
  const status = STATUS[campaign.status];
  const budgetPacing = pacing(campaign);
  const remaining = Math.max(0, campaign.budget - campaign.spent);
  const metricConfig = METRICS[metric];
  const period = 14;
  const series = seededSeries(
    `campaign-${campaign.id}-${metric}`,
    period,
    Math.max(campaign[metric] / period, metric === "clicks" ? 10 : 100),
    0.28,
  );

  return (
    <div>
      <PageHeader
        title="Статистика кампании"
        subtitle="Подробные показатели, динамика и распределение бюджета."
      >
        <Button variant="secondary" onClick={() => navigate("/app/campaigns")}>
          <ArrowLeft size={17} />Назад
        </Button>
      </PageHeader>

      <section className="relative mb-4 overflow-hidden rounded-3xl border border-indigo-200 bg-gradient-to-br from-surface via-indigo-50 to-indigo-100 p-5 shadow-soft sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full border border-indigo-300/50" />
        <div className="pointer-events-none absolute right-16 top-4 h-20 w-20 rounded-full bg-indigo-200/40 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            {advertiser && (
              <Avatar
                name={advertiser.name}
                color={advertiser.color}
                src={advertiser.logo}
                size="lg"
              />
            )}
            <div className="min-w-0">
              <h2 className="truncate font-display text-xl font-semibold sm:text-2xl">
                {campaign.name}
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                {advertiser?.name || "Рекламодатель не указан"}
              </p>
            </div>
          </div>
          <Badge tone={status.tone} dot className="w-fit shadow-soft">
            {statusLabel(campaign.status)}
          </Badge>
        </div>
      </section>

      {hasMediaTables ? (
        <MediaReport scopeId={campaign.contractNumber || campaign.id} />
      ) : (
        <>
          <section className="relative overflow-hidden rounded-3xl border border-indigo-200 bg-gradient-to-br from-surface via-[#fffdf5] to-indigo-100 p-5 shadow-lift sm:p-6">
            <div className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full border border-indigo-300/60" />
            <div className="pointer-events-none absolute right-24 top-0 h-32 w-32 rounded-full bg-indigo-200/45 blur-3xl" />
            <div className="relative">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-800">
                Total statistics
              </p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-ink sm:text-3xl">
                Общая статистика кампании
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-ink-muted">
                Ключевые показатели кампании «{campaign.name}» за выбранный
                период.
              </p>
            </div>

            <div className="relative mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
              <MetricCard
                icon={WalletCards}
                label="Бюджет"
                value={formatMoneyCompact(campaign.budget)}
                hint={`Освоено ${formatPct(budgetPacing, 0)}`}
              />
              <MetricCard
                icon={CircleDollarSign}
                value={formatMoneyCompact(campaign.spent)}
                hint={`Осталось ${formatMoneyCompact(remaining)}`}
              />
              <MetricCard
                icon={Eye}
                label="Показы"
                value={formatCompact(campaign.impressions)}
                hint={`CPM ${formatMoney(cpm(campaign))}`}
              />
              <MetricCard
                icon={MousePointerClick}
                value={formatCompact(campaign.clicks)}
                hint={`CTR ${formatPct(ctr(campaign))}`}
              />
              <MetricCard
                icon={Target}
                value={formatCompact(campaign.conversions)}
                hint={`CVR ${formatPct(cvr(campaign))}`}
              />
            </div>
          </section>

          <Card className="mt-4">
            <div className="flex flex-col gap-3 p-5 pb-0 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-display text-base font-semibold text-ink">
                  Динамика за 14 дней
                </h3>
                <p className="text-[13px] text-ink-muted">
                  Наведите на график для точных значений
                </p>
              </div>
              <SegmentTabs
                value={metric}
                onChange={setMetric}
                items={Object.entries(METRICS).map(([value, item]) => ({
                  value,
                  label: item.label,
                }))}
              />
            </div>
            <div className="p-3 sm:p-5">
              <AreaChart
                data={series}
                labels={lastNDates(period)}
                color={metricConfig.color}
                height={280}
                formatValue={metricConfig.format}
              />
            </div>
          </Card>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] font-medium text-ink-muted">
                    Освоение бюджета
                  </p>
                  <p className="mt-1 font-display text-3xl font-semibold text-ink tnum">
                    {formatPct(budgetPacing, 0)}
                  </p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-900">
                  <TrendingUp size={21} />
                </span>
              </div>
              <Progress value={budgetPacing} className="mt-5 h-2" />
              <div className="mt-3 flex justify-between text-[12px] text-ink-muted">
                <span>Потрачено {formatMoneyCompact(campaign.spent)}</span>
                <span>Бюджет {formatMoneyCompact(campaign.budget)}</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4">
                <div>
                  <p className="text-[12px] text-ink-muted">CPA</p>
                  <p className="mt-1 font-semibold text-ink tnum">
                    {campaign.conversions ? formatMoney(cpa(campaign)) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] text-ink-muted">
                    Средняя цена клика
                  </p>
                  <p className="mt-1 font-semibold text-ink tnum">
                    {campaign.clicks
                      ? formatMoney(campaign.spent / campaign.clicks)
                      : "—"}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 text-ink">
                <CalendarDays size={18} className="text-indigo-800" />
                <h3 className="font-display text-sm font-semibold">Период</h3>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                <span className="text-ink-muted">Начало</span>
                <span className="font-medium text-ink">
                  {formatDate(campaign.startDate)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                <span className="text-ink-muted">Завершение</span>
                <span className="font-medium text-ink">
                  {formatDate(campaign.endDate)}
                </span>
              </div>

              <div className="mt-5 flex items-center gap-2 border-t border-line pt-4 text-ink">
                <Radio size={18} className="text-indigo-800" />
                <h3 className="font-display text-sm font-semibold">Площадки</h3>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {channels.length > 0 ? (
                  channels.map((channel) => (
                    <span
                      key={channel.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-paper px-2.5 py-1.5 text-[12px] font-medium text-ink-soft"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: channel.color }}
                      />
                      {channel.name}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-ink-muted">Не выбраны</span>
                )}
              </div>
            </Card>
          </div>
        </>
      )}

      {hasMediaTables && (
        <div className="mt-8 flex items-center gap-3 border-t border-line pt-5">
          <Logo size={44} withWord={false} />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
              Setanta Sports
            </p>
            <p className="text-[12px] text-ink-soft">Campaign media report</p>
          </div>
        </div>
      )}
    </div>
  );
}
