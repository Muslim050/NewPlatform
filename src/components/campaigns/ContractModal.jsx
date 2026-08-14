import { useEffect, useState } from 'react'
import { Check, Download, FileText, Film, Trash2 } from 'lucide-react'
import { useData } from '@/context/DataContext.jsx'
import { useAuth } from '@/context/AuthContext.jsx'
import { useToast } from '@/components/ui/Toast.jsx'
import { useConfirm } from '@/components/ui/Confirm.jsx'
import { Modal } from '@/components/ui/Modal.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { Field, Input, Select } from '@/components/ui/Field.jsx'
import { MultiSelect } from '@/components/ui/MultiSelect.jsx'
import { FilePicker } from '@/components/ui/FilePicker.jsx'
import { LEAGUES, PACKAGES, leagueLabel } from '@/lib/metrics.js'
import { formatDate } from '@/lib/format.js'
import { uid } from '@/lib/id.js'

const emptyContract = () => ({
  number: '',
  // Рекламная кампания, под которую заключён договор.
  campaignName: '',
  legalName: '',
  package: '',
  leagues: [],
  start: '',
  end: '',
  paymentDate: `${new Date().getFullYear()}-08-31`,
  file: null,
  // Ролик договора — его подставляем в кампании по этому договору.
  creative: null,
})

/** Строка «поле — значение» для режима просмотра. */
function Row({ label, value }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5 text-[13px] sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="shrink-0 text-ink-muted sm:w-40">{label}</dt>
      <dd className="min-w-0 font-medium text-ink">{value}</dd>
    </div>
  )
}

/**
 * Карточка договора бренда: рекламодателю — только просмотр,
 * площадке — правка, добавление и удаление.
 */
export function ContractModal({ open, contract, advertiser, onClose }) {
  const { advertisers, update } = useData()
  const { isAdvertiser, canEdit } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const [form, setForm] = useState(emptyContract)
  const [error, setError] = useState('')
  // Подтверждение прямо на кнопке: тост в углу легко не заметить.
  const [saved, setSaved] = useState(false)

  const creating = !contract

  // Заполняем форму при открытии. Зависимости — по id, иначе сохранение
  // обновляет бренд в сторе и форма тут же сбрасывается сама на себя.
  useEffect(() => {
    if (!open) return
    setForm(
      contract
        ? { ...contract, leagues: [...(contract.leagues ?? [])] }
        : { ...emptyContract(), legalName: advertiser?.legalName || '' },
    )
    setError('')
    setSaved(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, contract?.id, advertiser?.id])

  // Держим «Сохранено» на экране секунду и закрываем карточку.
  useEffect(() => {
    if (!saved) return
    const timer = setTimeout(onClose, 900)
    return () => clearTimeout(timer)
  }, [saved, onClose])

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const save = () => {
    const number = form.number.trim()
    if (!number) {
      setError('Укажите номер договора')
      return
    }
    const contracts = advertiser.contracts ?? []
    // Номер уникален по всей базе: иначе один договор всплывает у двух брендов.
    const owner = advertisers.find((brand) =>
      (brand.contracts ?? []).some(
        (c) => c.id !== contract?.id && c.number.trim() === number,
      ),
    )
    if (owner) {
      setError(
        owner.id === advertiser.id
          ? 'Такой номер у бренда уже есть'
          : `Такой номер уже занят брендом ${owner.name}`,
      )
      return
    }

    const payload = {
      ...form,
      number,
      campaignName: (form.campaignName ?? '').trim(),
    }
    const next = creating
      ? [...contracts, { ...payload, id: uid('ctr') }]
      : contracts.map((c) => (c.id === contract.id ? payload : c))

    update('advertisers', advertiser.id, { contracts: next })
    toast.success(
      creating
        ? `Договор ${number} добавлен бренду ${advertiser.name}`
        : `Договор ${number} сохранён`,
    )
    setSaved(true)
  }

  const remove = async () => {
    const ok = await confirm({
      title: 'Удалить договор?',
      description: contract.number,
      body: 'Кампании, оформленные по нему, останутся — у них сохранится номер договора.',
    })
    if (!ok) return
    update('advertisers', advertiser.id, {
      contracts: (advertiser.contracts ?? []).filter((c) => c.id !== contract.id),
    })
    toast.info('Договор удалён')
    onClose()
  }

  const term =
    form.start && form.end
      ? `${formatDate(form.start)} — ${formatDate(form.end)}`
      : null

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={FileText}
      title={creating ? 'Новый договор' : `Договор ${contract?.number ?? ''}`}
      description={advertiser?.name || 'Договор бренда'}
      size="lg"
      footer={
        <>
          {canEdit && !isAdvertiser && !creating && (
            <Button variant="danger" onClick={remove} className="mr-auto">
              <Trash2 size={16} />
              Удалить
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            {isAdvertiser || !canEdit ? "Закрыть" : "Отмена"}
          </Button>
          {canEdit && !isAdvertiser && (
            <Button variant="primary" onClick={save} disabled={saved}>
              {saved ? (
                <>
                  <Check size={16} />
                  {creating ? 'Договор добавлен' : 'Сохранено'}
                </>
              ) : creating ? (
                'Добавить'
              ) : (
                'Сохранить'
              )}
            </Button>
          )}
        </>
      }
    >
      {isAdvertiser || !canEdit ? (
        <dl className="space-y-2">
          <Row label="Номер договора" value={form.number} />
          <Row label="Рекламная кампания" value={form.campaignName} />
          <Row label="Пакет" value={PACKAGES[form.package]?.label} />
          <Row
            label="Лиги"
            value={form.leagues?.map(leagueLabel).join(', ')}
          />
          <Row label="Срок договора" value={term} />
          <Row
            label="Сроки оплаты"
            value={form.paymentDate ? formatDate(form.paymentDate) : null}
          />
          {form.file && (
            <div className="pt-2">
              <a
                href={form.file.url}
                download={form.file.name}
                className="flex items-center gap-2 rounded-xl border border-line bg-paper/55 px-3 py-2 text-[13px] font-medium text-ink transition-colors hover:border-indigo-300 hover:bg-indigo-50 focus-ring"
              >
                <FileText size={16} className="shrink-0 text-indigo-800" />
                <span className="min-w-0 flex-1 truncate">{form.file.name}</span>
                <Download size={15} className="shrink-0 text-ink-muted" />
              </a>
            </div>
          )}
        </dl>
      ) : (
        <div className="space-y-4">
          {/* Срок договора идёт первым — с него заполняют карточку. */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Начало">
              <Input
                type="date"
                value={form.start}
                max={form.end || undefined}
                onChange={(e) => set('start', e.target.value)}
              />
            </Field>
            <Field label="Окончание">
              <Input
                type="date"
                value={form.end}
                min={form.start || undefined}
                onChange={(e) => set('end', e.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Номер договора" required error={error}>
              <Input
                value={form.number}
                onChange={(e) => set('number', e.target.value)}
                placeholder="Например, Д-2026/114"
              />
            </Field>
            <Field label="Файл договора">
              <FilePicker
                accept=".pdf,.doc,.docx,image/*"
                emptyLabel="Загрузить договор"
                downloadLabel="Скачать договор"
                name={form.file?.name}
                url={form.file?.url}
                onPick={(file) => set('file', file)}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Под какую рекламную кампанию заключён договор. */}
            <Field label="Название рекламной кампании">
              <Input
                value={form.campaignName ?? ''}
                onChange={(e) => set('campaignName', e.target.value)}
                placeholder="Например, Кондиционеры — лето"
              />
            </Field>
            {/* Ролик договора подставляется в кампании этого договора. */}
            <Field label="Рекламный ролик">
              <FilePicker
                accept="video/*"
                icon={Film}
                emptyLabel="Загрузить ролик"
                downloadLabel="Скачать ролик"
                name={form.creative?.name}
                url={form.creative?.url}
                onPick={(creative) => set('creative', creative)}
              />
            </Field>
          </div>

          {/* Юр. лицо подставляется из карточки бренда, сроки оплаты живут
              в самом договоре — в форме их не спрашиваем. */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Пакет">
              <Select
                value={form.package}
                onChange={(e) => set('package', e.target.value)}
              >
                <option value="">— не выбран —</option>
                {Object.entries(PACKAGES).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Лиги" hint="Можно выбрать несколько.">
              <MultiSelect
                options={LEAGUES}
                value={form.leagues}
                onChange={(leagues) => set('leagues', leagues)}
                placeholder="— не выбраны —"
              />
            </Field>
          </div>

        </div>
      )}
    </Modal>
  )
}
