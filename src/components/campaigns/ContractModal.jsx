import { useEffect, useState } from 'react'
import { FileText, Trash2 } from 'lucide-react'
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
  legalName: '',
  package: '',
  leagues: [],
  start: '',
  end: '',
  paymentDate: `${new Date().getFullYear()}-08-31`,
  file: null,
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
  const { update } = useData()
  const { isAdvertiser } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const [form, setForm] = useState(emptyContract)
  const [error, setError] = useState('')

  const creating = !contract

  useEffect(() => {
    if (!open) return
    setForm(
      contract
        ? { ...contract, leagues: [...(contract.leagues ?? [])] }
        : { ...emptyContract(), legalName: advertiser?.legalName || '' },
    )
    setError('')
  }, [open, contract, advertiser])

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const save = () => {
    const number = form.number.trim()
    if (!number) {
      setError('Укажите номер договора')
      return
    }
    const contracts = advertiser.contracts ?? []
    const duplicate = contracts.some(
      (c) => c.id !== contract?.id && c.number.trim() === number,
    )
    if (duplicate) {
      setError('Такой номер у бренда уже есть')
      return
    }

    const next = creating
      ? [...contracts, { ...form, id: uid('ctr'), number }]
      : contracts.map((c) => (c.id === contract.id ? { ...form, number } : c))

    update('advertisers', advertiser.id, { contracts: next })
    toast.success(creating ? 'Договор добавлен' : 'Договор обновлён')
    onClose()
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
          {!isAdvertiser && !creating && (
            <Button variant="danger" onClick={remove} className="mr-auto">
              <Trash2 size={16} />
              Удалить
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            {isAdvertiser ? 'Закрыть' : 'Отмена'}
          </Button>
          {!isAdvertiser && (
            <Button variant="primary" onClick={save}>
              {creating ? 'Добавить' : 'Сохранить'}
            </Button>
          )}
        </>
      }
    >
      {isAdvertiser ? (
        <dl className="space-y-2">
          <Row label="Номер договора" value={form.number} />
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
                <span className="truncate">{form.file.name}</span>
              </a>
            </div>
          )}
        </dl>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Номер договора" required error={error}>
              <Input
                value={form.number}
                onChange={(e) => set('number', e.target.value)}
                placeholder="Например, Д-2026/114"
              />
            </Field>
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
          </div>

          <Field label="Наименование юр. лица">
            <Input
              value={form.legalName}
              onChange={(e) => set('legalName', e.target.value)}
              placeholder='ООО «Пример»'
            />
          </Field>

          <Field label="Лиги" hint="Можно выбрать несколько.">
            <MultiSelect
              options={LEAGUES}
              value={form.leagues}
              onChange={(leagues) => set('leagues', leagues)}
              placeholder="— не выбраны —"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
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
            <Field label="Сроки оплаты">
              <Input
                type="date"
                value={form.paymentDate}
                onChange={(e) => set('paymentDate', e.target.value)}
              />
            </Field>
          </div>

          <Field label="Файл договора">
            <FilePicker
              accept=".pdf,.doc,.docx,image/*"
              emptyLabel="Загрузить договор"
              name={form.file?.name}
              onPick={(file) => set('file', file)}
            />
          </Field>
        </div>
      )}
    </Modal>
  )
}
