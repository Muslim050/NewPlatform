import { useEffect, useState } from 'react'
import { Download, FileText, Film } from 'lucide-react'
// Кампании переехали на сервер. Мок остаётся для разделов, которые ещё
// не подключены: import { useData } from '@/context/DataContext.jsx'
import { useVisibleAdvertisers } from '@/features/advertisers/queries'
import { useSaveCampaign } from '@/features/campaigns/queries'
import { useFileDownload } from '@/features/files/queries'
import { useAuth } from '@/features/auth/useAuth'
import { useToast } from '@/components/ui/Toast.jsx'
import { Modal } from '@/components/ui/Modal.jsx'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Field'
import { CreativeLink } from '@/components/campaigns/CreativePlayer.jsx'
import { Logo } from '@/components/Logo'
import { STATUS, leagueLabel, statusLabel } from '@/lib/metrics.js'
import { formatDate, formatDateTime } from '@/lib/format.js'

const emptyForm = {
  name: '',
  objective: 'awareness',
  status: 'sent',
  startDate: '',
  endDate: '',
  // Ролик приходит из выбранной рекламной кампании — дефолта нет.
  creativeUrl: '',
  creativeName: '',
  // Когда ролик загрузили — показываем это рядом с полем и в карточке.
  creativeAddedAt: '',
  contractNumber: '',
}

/** Кампания с сервера → состояние формы. */
const formFrom = (campaign) => ({
  name: campaign.name,
  objective: campaign.objective || 'awareness',
  status: campaign.status,
  startDate: campaign.startDate ?? '',
  endDate: campaign.endDate ?? '',
  creativeUrl: campaign.creativeUrl || '',
  creativeName: campaign.creativeName || '',
  creativeAddedAt: campaign.creativeAddedAt || '',
  contractNumber: campaign.contractNumber || '',
})

/** Сервер принимает в `creativeUrl` только абсолютную ссылку. */
function isValidUrl(value) {
  if (!value) return false
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/** Имя файла из ссылки — подпись ролику, если своей нет. */
const fileNameFromUrl = (url) => (url ? url.split('/').pop() || '' : '')

export function CampaignForm({ open, onClose, initial }) {
  const { mutate: saveCampaign, isPending } = useSaveCampaign()
  const { data: advertisers = [] } = useVisibleAdvertisers()
  const { save: saveFile } = useFileDownload()
  const { user, isAdmin, isAdvertiser } = useAuth()
  const toast = useToast()
  const editing = !!initial
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  // Бренд заявки: у рекламодателя свой, у площадки — бренд правимой кампании.
  // Сменить его нельзя: на создании сервер берёт бренд из сессии автора.
  const advertiserId = editing ? initial.advertiserId : user?.advertiserId
  const advertiser = advertisers.find((a) => a.id === advertiserId)
  // Договоры бренда — из них выбирается номер, всё остальное сервер
  // подставит в кампанию сам.
  const contracts = advertiser?.contracts ?? []
  const selectedContract = contracts.find(
    (c) => c.number === form.contractNumber,
  )

  useEffect(() => {
    if (!open) return
    setForm(initial ? formFrom(initial) : emptyForm)
    setErrors({})
    // Зависимости — по id: после сохранения список обновится, и форма иначе
    // сбросила бы несохранённые правки сама на себя.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.id])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  /**
   * Выбрали рекламную кампанию — вместе с ней подтягивается ролик договора.
   * Дальше это снимок: правка договора существующие кампании не меняет.
   */
  const selectCampaign = (name) => {
    const creative =
      name && name === selectedContract?.campaignName
        ? selectedContract.creative
        : null
    setForm((f) => ({
      ...f,
      name,
      ...(creative
        ? {
            creativeUrl: creative.url,
            creativeName: creative.name,
            creativeAddedAt: creative.addedAt || '',
          }
        : null),
    }))
  }

  const submit = () => {
    const err = {}
    if (!form.name.trim()) err.name = 'Укажите название'
    if (!form.startDate) err.startDate = 'Укажите начало периода'
    if (!form.endDate) err.endDate = 'Укажите окончание периода'
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      err.endDate = 'Окончание должно быть позже начала'
    }
    if (form.creativeUrl.trim() && !isValidUrl(form.creativeUrl.trim())) {
      err.creativeUrl = 'Нужна ссылка вида https://…'
    }
    setErrors(err)
    if (Object.keys(err).length) return

    const creativeUrl = form.creativeUrl.trim()
    const campaign = {
      name: form.name.trim(),
      objective: form.objective,
      startDate: form.startDate,
      endDate: form.endDate,
      // Условия договора сервер проставляет сам по его номеру: пакет, лиги,
      // юр. лицо, срок и дату оплаты отправлять не нужно.
      contractNumber: form.contractNumber.trim(),
      creativeUrl,
      creativeName: creativeUrl
        ? form.creativeName || fileNameFromUrl(creativeUrl)
        : '',
      // Дату загрузки ставим сами, если ролик появился только что.
      creativeAddedAt: creativeUrl
        ? form.creativeAddedAt || new Date().toISOString()
        : null,
    }
    // Статус ведёт площадка, и только у существующей заявки: новая всегда
    // заводится как «Отправлен».
    if (editing && isAdmin) campaign.status = form.status

    saveCampaign(
      { id: initial?.id, campaign },
      {
        onSuccess: () => {
          if (
            editing &&
            campaign.status &&
            campaign.status !== initial.status
          ) {
            // Смена статуса — событие само по себе, о нём говорим отдельно.
            toast.success(
              `«${campaign.name}»: ${statusLabel(initial.status)} → ${statusLabel(
                campaign.status,
              )}`,
            )
          } else {
            toast.success(editing ? 'Кампания обновлена' : 'Кампания создана')
          }
          onClose()
        },
        onError: (err2) => {
          // Сервер вернул ошибки по полям — показываем их прямо в форме.
          if (err2.fields && Object.keys(err2.fields).length) {
            setErrors(err2.fields)
          }
          toast.error(err2.message || 'Не удалось сохранить кампанию')
        },
      },
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      logo={<Logo size={40} withWord={false} />}
      title={editing ? 'Редактировать кампанию' : 'Новая кампания'}
      description={
        editing
          ? 'Обновите параметры кампании.'
          : 'Заполните параметры запуска кампаний.'
      }
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button variant="primary" onClick={submit} disabled={isPending}>
            {isPending
              ? 'Сохраняем…'
              : editing
                ? 'Сохранить'
                : 'Создать кампанию'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Период кампании идёт первым — с него начинают заполнять форму. */}
        <div>
          <p className="mb-2 text-[13px] font-medium text-ink-soft">
            Период кампании <span className="text-danger">*</span>
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Начало периода" required error={errors.startDate}>
              <Input
                type="date"
                value={form.startDate}
                max={form.endDate || undefined}
                onChange={(e) => set('startDate', e.target.value)}
              />
            </Field>
            <Field label="Окончание периода" required error={errors.endDate}>
              <Input
                type="date"
                value={form.endDate}
                min={form.startDate || undefined}
                onChange={(e) => set('endDate', e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* Сначала договор, затем рекламная кампания из него: с ней в форму
            приходит ролик, а на сервере — условия договора. */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Номер договора"
            error={errors.contractNumber}
            hint={
              contracts.length
                ? 'Пакет, лиги, юр. лицо и срок сервер подставит из договора.'
                : 'У бренда нет договоров — добавьте их в карточке рекламодателя.'
            }
          >
            {contracts.length ? (
              <Select
                value={form.contractNumber}
                onChange={(e) => set('contractNumber', e.target.value)}
              >
                <option value="">— выберите договор —</option>
                {contracts.map((contract) => (
                  <option key={contract.id} value={contract.number}>
                    {contract.number}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                value={form.contractNumber}
                onChange={(e) => set('contractNumber', e.target.value)}
                placeholder="Например, Д-2026/114"
              />
            )}
          </Field>

          {/* Название кампании вписывают руками. Совпало с названием из
              договора — вместе с ним подтянется ролик. */}
          <Field
            label="Рекламная кампания"
            required
            error={errors.name}
            hint={
              selectedContract?.campaignName
                ? `В договоре указана: ${selectedContract.campaignName}`
                : undefined
            }
          >
            <Input
              list={
                selectedContract?.campaignName
                  ? 'contract-campaigns'
                  : undefined
              }
              value={form.name}
              onChange={(e) => selectCampaign(e.target.value)}
              placeholder="Например, Летняя распродажа"
            />
            {selectedContract?.campaignName && (
              <datalist id="contract-campaigns">
                <option value={selectedContract.campaignName} />
              </datalist>
            )}
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Лиги ведёт площадка в договоре: сервер снимает их с него сам и
              на запись у кампании закрывает. Здесь только показываем. */}
          <Field
            label="Лиги"
            hint={
              selectedContract ? undefined : 'Появятся из выбранного договора.'
            }
          >
            <Input
              value={(selectedContract?.leagues ?? [])
                .map(leagueLabel)
                .join(', ')}
              placeholder="Из договора"
              disabled
              readOnly
            />
          </Field>

          {/* Ролик сервер хранит ссылкой: файл к кампании прикрепить некуда,
              поля под идентификатор файла у неё нет (docs/backend.md, п. 3.4). */}
          <Field label="Рекламный ролик" error={errors.creativeUrl}>
            <div className="flex items-center gap-2">
              <Input
                value={form.creativeUrl}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    creativeUrl: e.target.value,
                    creativeName: '',
                  }))
                }
                placeholder="https://example.com/creative.mp4"
                inputMode="url"
                // Рекламодателю ролик приходит из договора — он его не правит.
                disabled={isAdvertiser && !!selectedContract?.creative}
              />
              <CreativeLink
                url={isValidUrl(form.creativeUrl) ? form.creativeUrl : ''}
              />
            </div>
            {form.creativeUrl && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-ink-muted">
                <Film size={13} className="shrink-0 text-indigo-800" />
                <span className="min-w-0 truncate">
                  {form.creativeName || fileNameFromUrl(form.creativeUrl)}
                </span>
                {form.creativeAddedAt && (
                  <span className="shrink-0 tnum">
                    · добавлен {formatDateTime(form.creativeAddedAt)}
                  </span>
                )}
              </p>
            )}
          </Field>
        </div>

        {/* Срок договора менять отсюда нельзя — он живёт в карточке бренда. */}
        <div>
          <p className="mb-2 text-[13px] font-medium text-ink-soft">
            Срок договора
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Начало">
              <Input
                value={
                  selectedContract?.start
                    ? formatDate(selectedContract.start)
                    : ''
                }
                placeholder="Из договора"
                disabled
                readOnly
              />
            </Field>
            <Field label="Окончание">
              <Input
                value={
                  selectedContract?.end ? formatDate(selectedContract.end) : ''
                }
                placeholder="Из договора"
                disabled
                readOnly
              />
            </Field>
          </div>
        </div>

        {/* Скан договора: скачивание закрыто токеном, поэтому не ссылка,
            а кнопка — файл тянем транспортом и отдаём блобом. */}
        <Field label="Файл договора">
          {selectedContract?.file?.url ? (
            <button
              type="button"
              onClick={() => saveFile(selectedContract.file)}
              className="flex w-full items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 text-left text-[13px] font-medium text-ink transition-colors hover:border-indigo-300 hover:bg-indigo-50 focus-ring"
            >
              <FileText size={16} className="shrink-0 text-indigo-800" />
              <span className="min-w-0 flex-1 truncate">
                {selectedContract.file.name}
              </span>
              <span className="flex shrink-0 items-center gap-1.5 text-ink-muted">
                <Download size={15} />
                Скачать договор
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-line px-3 py-2.5 text-[13px] text-ink-muted">
              <FileText size={16} className="shrink-0" />
              {selectedContract ? 'К договору не приложен' : 'Из договора'}
            </div>
          )}
        </Field>

        {/* Статус ведёт площадка и только у заведённой заявки. */}
        {isAdmin && editing && (
          <Field label="Статус">
            <Select
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
            >
              {Object.entries(STATUS)
                .filter(([k]) => k !== 'archived')
                .map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
            </Select>
          </Field>
        )}
      </div>
    </Modal>
  )
}
