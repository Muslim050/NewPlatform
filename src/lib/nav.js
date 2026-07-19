import {
  LayoutDashboard,
  Megaphone,
  Building2,
  Radio,
  LineChart,
} from 'lucide-react'

export const NAV = [
  {
    to: '/app',
    end: true,
    label: 'Обзор',
    icon: LayoutDashboard,
    roles: ['admin', 'advertiser'],
  },
  {
    to: '/app/campaigns',
    label: 'Кампании',
    icon: Megaphone,
    roles: ['admin', 'advertiser'],
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
  },
  {
    to: '/app/reports',
    label: 'Отчёты',
    icon: LineChart,
    roles: ['admin', 'advertiser'],
  },
]
