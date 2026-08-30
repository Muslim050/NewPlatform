import { useEffect, useRef } from 'react'

/**
 * Горизонтальная лента, которую крутят колесом мыши прямо над блоками —
 * без полосы прокрутки снизу. Обычное колесо у мыши вертикальное, поэтому
 * переводим его в горизонтальное движение; тачпад и shift+колесо и так
 * дают горизонтальную дельту — их отдаём браузеру как есть.
 *
 * `activeKey` — что-то, меняющееся при переключении вкладки: по нему лента
 * подматывает выбранный элемент в видимую часть, иначе до дальних вкладок
 * приходится долистывать руками.
 */
export function useHorizontalScroll(activeKey) {
  const ref = useRef(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const onWheel = (event) => {
      // Горизонтальный жест уже горизонтальный — не мешаем.
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
      // Крутить нечего — пусть страница прокручивается как обычно.
      if (node.scrollWidth <= node.clientWidth) return

      const atStart = node.scrollLeft <= 0
      const atEnd = node.scrollLeft + node.clientWidth >= node.scrollWidth - 1
      // Доехали до края — отдаём прокрутку странице, иначе лента «залипает».
      if ((event.deltaY < 0 && atStart) || (event.deltaY > 0 && atEnd)) return

      event.preventDefault()
      node.scrollLeft += event.deltaY
    }

    node.addEventListener('wheel', onWheel, { passive: false })
    return () => node.removeEventListener('wheel', onWheel)
  }, [])

  // Переключили вкладку — показываем её целиком.
  useEffect(() => {
    const node = ref.current
    if (!node || activeKey == null) return
    const active = node.querySelector('[data-active="true"]')
    active?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [activeKey])

  return ref
}
