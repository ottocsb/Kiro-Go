// 用量条：account 与 apikey 两套阈值/配色（与旧版一致，刻意不统一）。
import { cn } from '@/lib/utils'

function clampPct(p: number) {
  return Math.max(0, Math.min(100, p || 0))
}

function accountFill(pct: number): string {
  if (pct > 90) return 'bg-[#e54b4f] dark:bg-[#ff5b5b]'
  if (pct > 70) return 'bg-[#ffae04]'
  return 'bg-[#0f766e] dark:bg-[#2dd4bf]'
}

function apikeyFill(pct: number): string {
  if (pct >= 95) return 'bg-[#ef4444]'
  if (pct >= 80) return 'bg-[#f59e0b]'
  return 'bg-[#3b82f6]'
}

export function UsageBar({
  percent,
  kind = 'account',
  className,
}: {
  percent: number
  kind?: 'account' | 'apikey'
  className?: string
}) {
  const pct = clampPct(percent)
  const fill = kind === 'apikey' ? apikeyFill(pct) : accountFill(pct)
  return (
    <div className={cn('mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted', className)}>
      <div
        className={cn('h-full rounded-full transition-[width] duration-300', fill)}
        style={{ width: pct + '%' }}
      />
    </div>
  )
}
