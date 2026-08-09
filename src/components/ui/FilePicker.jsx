import { useRef } from 'react'
import { Download, FileText, Paperclip, X } from 'lucide-react'
import { cn } from '@/lib/cn.js'
import { useToast } from '@/components/ui/Toast.jsx'

// Файлы храним прямо в базе (localStorage), поэтому ограничиваем размер.
const MAX_INLINE_SIZE = 2 * 1024 * 1024

/**
 * Поле выбора файла: клик по нему открывает системный диалог.
 * Небольшие файлы кладём в базу как data-URL, крупные держим ссылкой на сессию —
 * иначе они не помещаются в localStorage.
 * onPick получает { name, url } либо null, если файл убрали.
 */
export function FilePicker({
  name,
  url,
  onPick,
  accept,
  emptyLabel = 'Выбрать файл',
  icon: Icon = FileText,
  className,
}) {
  const inputRef = useRef(null)
  const toast = useToast()

  const pick = (e) => {
    const picked = e.target.files?.[0]
    // Сбрасываем input, иначе повторный выбор того же файла не сработает.
    e.target.value = ''
    if (!picked) return
    if (picked.size <= MAX_INLINE_SIZE) {
      const reader = new FileReader()
      reader.onload = () => onPick({ name: picked.name, url: String(reader.result) })
      reader.onerror = () => toast.error('Не удалось прочитать файл')
      reader.readAsDataURL(picked)
      return
    }
    onPick({ name: picked.name, url: URL.createObjectURL(picked) })
    toast.info('Файл больше 2 МБ — ссылка на него живёт до перезагрузки страницы')
  }

  // Кнопки «скачать» и «убрать» держим соседями поля выбора, а не внутри него:
  // ссылка внутри button — невалидная вложенность.
  return (
    <div
      className={cn(
        'flex h-11 w-full items-center gap-1 rounded-xl border pr-2 transition-colors',
        name
          ? 'border-line bg-surface hover:border-indigo-300'
          : 'border-dashed border-line bg-surface hover:border-indigo-300 hover:bg-indigo-50',
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={pick}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        title={name || emptyLabel}
        className={cn(
          'flex h-full min-w-0 flex-1 items-center gap-2 rounded-xl pl-3.5 text-left text-sm focus-ring',
          name ? 'text-ink' : 'text-ink-soft',
        )}
      >
        {name ? (
          <Icon size={16} className="shrink-0 text-indigo-800" />
        ) : (
          <Paperclip size={16} className="shrink-0 text-ink-muted" />
        )}
        <span className="min-w-0 flex-1 truncate">{name || emptyLabel}</span>
      </button>
      {name && url && (
        <a
          href={url}
          download={name}
          aria-label="Скачать файл"
          title="Скачать файл"
          className="shrink-0 rounded-lg p-1 text-ink-muted transition-colors hover:bg-ink/[0.06] hover:text-indigo-800 focus-ring"
        >
          <Download size={14} />
        </a>
      )}
      {name && (
        <button
          type="button"
          aria-label="Убрать файл"
          title="Убрать файл"
          onClick={() => onPick(null)}
          className="shrink-0 rounded-lg p-1 text-ink-muted transition-colors hover:bg-ink/[0.06] hover:text-ink focus-ring"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
