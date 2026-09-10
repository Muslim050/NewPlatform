import { useEffect, useState } from 'react'
import { UserCog } from 'lucide-react'
import { useSaveUser } from '@/features/users/queries'
import { useAdvertisers } from '@/features/advertisers/queries'
import { useToast } from '@/components/ui/Toast.jsx'
import { Modal } from '@/components/ui/Modal.jsx'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Field'

// Через платформу заводят только рекламодателей — роль не спрашиваем.
// У уже заведённой площадки или наблюдателя роль берётся из его карточки
// и остаётся прежней: правка контактов не должна менять права.
const DEFAULT_ROLE = 'advertiser'

const emptyForm = {
  firstName: '',
  lastName: '',
  login: '',
  email: '',
  phone: '',
  role: DEFAULT_ROLE,
  advertiserId: '',
  isActive: true,
  password: '',
}

/**
 * Пользователь с сервера → состояние формы. Пароль наружу не приходит.
 *
 * Фамилии в API нет — имя приходит одной строкой, поэтому делим её по
 * первому пробелу, а при сохранении склеиваем обратно. Уйдёт, когда
 * на бэкенде появятся отдельные поля (см. docs/backend.md, п. 3.6).
 */
const formFrom = (user) => {
  const [firstName = '', ...rest] = (user.name ?? '').trim().split(/\s+/)
  return {
    firstName,
    lastName: rest.join(' '),
    login: user.login,
    email: user.email ?? '',
    phone: '',
    role: user.role,
    advertiserId: user.advertiserId ? String(user.advertiserId) : '',
    isActive: user.isActive,
    password: '',
  }
}

/**
 * Карточка пользователя платформы. Заводим здесь только рекламодателей —
 * им нужно указать, чей раздел человек будет видеть.
 */
export function UserForm({ open, onClose, initial }) {
  const { mutate: saveUser, isPending } = useSaveUser()
  // Список тот же, что и в разделе «Рекламодатели».
  const { data: advertisers } = useAdvertisers()
  const toast = useToast()
  const editing = !!initial
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!open) return
    setForm(initial ? formFrom(initial) : emptyForm)
    setErrors({})
    // Зависимости — по id: после сохранения список обновится, и форма иначе
    // сбросила бы несохранённые правки сама на себя.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.id])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = () => {
    const err = {}
    if (!form.login.trim()) err.login = 'Укажите логин'
    if (form.email.trim() && !form.email.includes('@'))
      err.email = 'Некорректный email'
    // Пароль обязателен только у нового: у существующего пустое поле значит
    // «оставить прежний».
    if (!editing && !form.password) err.password = 'Задайте пароль'
    if (form.role === 'advertiser' && !form.advertiserId)
      err.advertiserId = 'Выберите рекламодателя'
    setErrors(err)
    if (Object.keys(err).length) return

    const user = {
      login: form.login.trim(),
      // Пока имя на сервере одно поле — склеиваем.
      name: [form.firstName.trim(), form.lastName.trim()]
        .filter(Boolean)
        .join(' '),
      email: form.email.trim(),
      role: form.role,
      // Связка есть только у рекламодателя — у остальных ролей её снимаем.
      advertiserId:
        form.role === 'advertiser' ? Number(form.advertiserId) : null,
      isActive: form.isActive,
    }
    if (form.password) user.password = form.password

    saveUser(
      { id: initial?.id, user },
      {
        onSuccess: () => {
          toast.success(
            editing
              ? `Пользователь ${user.login} сохранён`
              : `Пользователь ${user.login} добавлен`,
          )
          onClose()
        },
        onError: (err2) => {
          // Сервер вернул ошибки по полям — показываем их прямо в форме.
          if (err2.fields && Object.keys(err2.fields).length) {
            setErrors(err2.fields)
          }
          toast.error(err2.message || 'Не удалось сохранить пользователя')
        },
      },
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={UserCog}
      title={editing ? 'Редактировать пользователя' : 'Новый пользователь'}
      description="Доступ к платформе."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button variant="primary" onClick={submit} disabled={isPending}>
            {isPending ? 'Сохраняем…' : editing ? 'Сохранить' : 'Добавить'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Имя">
            <Input
              value={form.firstName}
              onChange={(e) => set('firstName', e.target.value)}
              placeholder="Тимур"
            />
          </Field>
          <Field label="Фамилия">
            <Input
              value={form.lastName}
              onChange={(e) => set('lastName', e.target.value)}
              placeholder="Рахимов"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" error={errors.email}>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="name@setanta.uz"
            />
          </Field>
          {/* Телефона в API пока нет: поле стоит на месте, но не сохраняется —
              включим, когда на бэкенде появится поле. */}
          <Field
            label="Номер телефона"
            hint="Появится, когда поле добавят на сервере."
          >
            <Input
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="+998 90 000 00 00"
              inputMode="tel"
              disabled
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Логин" required error={errors.login}>
            <Input
              value={form.login}
              onChange={(e) => set('login', e.target.value)}
              placeholder="ivanov"
              autoComplete="off"
            />
          </Field>
          <Field
            label="Пароль"
            required={!editing}
            error={errors.password}
            hint={
              editing ? 'Пусто — прежний пароль останется как есть.' : undefined
            }
          >
            <Input
              type="password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              placeholder={editing ? '••••••' : 'Не короче 8 символов'}
              autoComplete="new-password"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Рекламодателя спрашиваем только у этой роли: площадка и
              наблюдатель видят всех. */}
          {form.role === 'advertiser' && (
            <Field label="Рекламодатель" required error={errors.advertiserId}>
              <Select
                value={form.advertiserId}
                onChange={(e) => set('advertiserId', e.target.value)}
              >
                <option value="">— не выбран —</option>
                {(advertisers ?? []).map((advertiser) => (
                  <option key={advertiser.id} value={advertiser.id}>
                    {advertiser.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field
            label="Доступ"
            hint="Отключённый не сможет войти, но останется в списке."
          >
            <Select
              value={form.isActive ? 'active' : 'inactive'}
              onChange={(e) => set('isActive', e.target.value === 'active')}
            >
              <option value="active">Активен</option>
              <option value="inactive">Отключён</option>
            </Select>
          </Field>
        </div>
      </div>
    </Modal>
  )
}
