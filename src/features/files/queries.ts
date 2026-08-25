import { useCallback, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import * as filesApi from '@/api/endpoints/files'
import type { StoredFile } from '@/api/types'

/**
 * Загрузка файла. Сервер отдаёт `{id, name, url, …}`: `id` уходит в сущность
 * (`fileId`, `creativeId`), остальное показываем в интерфейсе.
 */
export function useUploadFile() {
  return useMutation({
    mutationFn: ({
      file,
      kind,
    }: {
      file: File
      kind: filesApi.FileKind
    }): Promise<StoredFile> => filesApi.upload(file, kind),
  })
}

/** Ссылка на чужой хост — её отдаём браузеру как есть. */
const isExternal = (url: string) => /^https?:\/\//i.test(url)

/**
 * Сохранение файла на диск. Скачивание на сервере закрыто токеном, поэтому
 * ссылку нельзя просто положить в `<a download>`: файл тянем транспортом
 * и отдаём браузеру уже блобом.
 */
export function useFileDownload() {
  // Пока идёт скачивание, кнопка показывает это — файлы бывают тяжёлыми.
  const [pendingUrl, setPendingUrl] = useState<string | null>(null)

  const save = useCallback(
    async (file: { name?: string; url?: string } | null | undefined) => {
      if (!file?.url) return
      const name = file.name || 'file'

      if (isExternal(file.url)) {
        // Внешние ссылки (например, старые логотипы) токена не требуют.
        window.open(file.url, '_blank', 'noopener')
        return
      }

      setPendingUrl(file.url)
      try {
        const blob = await filesApi.download(file.url)
        const objectUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = objectUrl
        link.download = name
        document.body.append(link)
        link.click()
        link.remove()
        // Отзываем не сразу: Safari успевает начать скачивание не мгновенно.
        setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000)
      } finally {
        setPendingUrl(null)
      }
    },
    [],
  )

  return { save, pendingUrl }
}
