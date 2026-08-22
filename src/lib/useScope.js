import { useMemo } from 'react'
import { useAuth } from '@/features/auth/useAuth'
import { useData } from '@/context/DataContext.jsx'

/**
 * Кампании, видимые текущему пользователю.
 * Рекламодатель видит только свои, админ — все.
 */
export function useScopedCampaigns() {
  const { user } = useAuth()
  const { campaigns } = useData()
  return useMemo(() => {
    if (user?.role === 'advertiser') {
      return campaigns.filter((c) => c.advertiserId === user.advertiserId)
    }
    return campaigns
  }, [campaigns, user])
}
