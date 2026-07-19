# Bloom — платформа медиабаинга (демо)

Standalone-прототип рекламной платформы с CRUD-операциями **без бэкенда**.
Все данные хранятся в `localStorage` браузера и переживают перезагрузку.

Совершенно другой визуальный язык относительно основного проекта:
светлый премиум-минимал (индиго + лайм), крупный гротеск (Space Grotesk),
мягкие тени, стекло, анимации на Framer Motion.

## Запуск

```bash
cd newplatform
npm install
npm run dev
```

Откроется на `http://localhost:5178`.

## Доступы (демо)

На экране входа введите логин и пароль. Доступны две учётки:

- `admin` / `admin` — полный доступ;
- `adv` / `adv` — доступ рекламодателя (первый бренд из демо-данных).

Данные и доступы отличаются:

| Раздел         | admin         | adv                      |
| -------------- | :-----------: | :----------------------: |
| Обзор          | все данные    | только свой бренд        |
| Кампании       | все + CRUD    | только свои + CRUD своих |
| Рекламодатели  | CRUD          | скрыт                    |
| Площадки       | CRUD          | только просмотр          |
| Отчёты         | по всем       | по своему бренду         |

## CRUD

Полностью рабочие create / edit / delete для **кампаний**, **рекламодателей**
и **площадок**. Изменения реактивно обновляют интерфейс и сохраняются в `localStorage`
(ключ `bloom.db.v1`). Чтобы вернуть демо-данные — очистите этот ключ в DevTools
или вызовите `resetDb()` из `src/lib/store.js`.

## Стек

React 18 · Vite 5 · React Router 6 · Tailwind CSS · Framer Motion · lucide-react.
Графики — собственные на чистом SVG (без сторонних чарт-библиотек).

## Структура

```
src/
  components/
    ui/        — дизайн-система (Button, Card, Modal, Field, Toast, …)
    charts/    — SVG-графики (Area, Bar, Donut, Sparkline)
    forms/     — модальные формы CRUD
    layout/    — AppShell, Sidebar, Topbar
  context/     — AuthContext (роли), DataContext (CRUD-store)
  lib/         — store (localStorage), seed, metrics, format, хуки
  pages/       — Login, Dashboard, Campaigns, Advertisers, Channels, Reports
```
