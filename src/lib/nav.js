import {
  LayoutDashboard,
  Megaphone,
  Building2,
  Radio,
  LineChart,
} from 'lucide-react'

export const NAV = [
  {
    to: '/app/campaigns',
    label: 'Кампании',
    icon: Megaphone,
    roles: ['admin', 'advertiser'],
  },
  {
    to: '/app/overview',
    label: 'Обзор',
    icon: LayoutDashboard,
    roles: ['admin'],
  },
  {
    to: '/app/advertisers',
    label: 'Рекламодатели',
    icon: Building2,
    roles: ['admin'],
  },
  {
    to: '/app/channels',
    label: 'Площадки',
    icon: Radio,
    roles: ['admin', 'advertiser'],
    hidden: true,
  },
  {
    to: '/app/reports',
    label: 'Отчёт',
    icon: LineChart,
    roles: ['advertiser'],
  },
]
