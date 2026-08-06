import { Film } from 'lucide-react'

/**
 * Кнопка-иконка рекламного ролика: открывает видео в новой вкладке.
 * Ссылка может быть как абсолютной, так и относительной (файл из /public).
 */
export function CreativeLink({ url, label = 'Посмотреть ролик', className }) {
  if (!url) {
    return (
      <span
        className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border border-dashed border-line text-ink-muted ${className || ''}`}
        title="Ролик не добавлен"
      >
        <Film size={18} />
      </span>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      title={label}
      aria-label={label}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-900 transition-colors hover:border-indigo-400 hover:bg-indigo-100 focus-ring ${className || ''}`}
    >
      <Film size={18} />
    </a>
  )
}
