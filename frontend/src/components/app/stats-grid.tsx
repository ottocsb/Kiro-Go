// 顶部统计栏：账号 / 请求 / 成功 / 失败 四张卡（始终可见）。
import { CircleCheck, CircleX, Route, Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useT } from '@/i18n/i18n'
import { useAppData } from '@/hooks/use-app-data'
import { formatNum } from '@/lib/format'

export function StatsGrid() {
  const t = useT()
  const { status } = useAppData()
  const s = status

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        title={t('stats.accounts')}
        value={s ? String(s.accounts) : '-'}
        sub={`${s ? s.totalCredits.toFixed(1) : '0'} ${t('stats.credits')}`}
        icon={<Users className="size-5" />}
      />
      <StatCard
        title={t('stats.requests')}
        value={s ? String(s.totalRequests) : '-'}
        sub={`${s ? formatNum(s.totalTokens) : '0'} ${t('stats.tokens')}`}
        icon={<Route className="size-5" />}
      />
      <StatCard
        title={t('stats.success')}
        value={s ? String(s.successRequests) : '-'}
        sub={t('stats.completed')}
        icon={<CircleCheck className="size-5" />}
      />
      <StatCard
        title={t('stats.failed')}
        value={s ? String(s.failedRequests) : '-'}
        sub={t('stats.errors')}
        icon={<CircleX className="size-5" />}
        danger
      />
    </div>
  )
}

function StatCard({
  title,
  value,
  sub,
  icon,
  danger,
}: {
  title: string
  value: string
  sub: string
  icon: React.ReactNode
  danger?: boolean
}) {
  return (
    <Card className="p-4">
      <div className="text-xs font-medium text-muted-foreground">{title}</div>
      <div className="mt-2 flex items-end justify-between">
        <div>
          <div className={`text-2xl font-semibold ${danger ? 'text-destructive' : ''}`}>{value}</div>
          <div className="text-xs text-muted-foreground">{sub}</div>
        </div>
        <div className={danger ? 'text-destructive/70' : 'text-muted-foreground/60'}>{icon}</div>
      </div>
    </Card>
  )
}
