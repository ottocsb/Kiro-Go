// 语义徽章：保留旧版固定配色（订阅档位/状态色 zinc 无对应，沿用原 hex），白字。
import { cn } from '@/lib/utils'

export type BadgeVariant =
  | 'success'
  | 'info'
  | 'warning'
  | 'error'
  | 'muted'
  | 'banned'
  | 'suspended'
  | 'free'
  | 'pro'
  | 'proplus'
  | 'power'
  | 'trial'

const BADGE_BG: Record<BadgeVariant, string> = {
  success: 'bg-[#0f766e]',
  info: 'bg-[#2563eb]',
  warning: 'bg-[#b45309]',
  error: 'bg-[#dc2626]',
  muted: 'bg-[#94a3b8]',
  banned: 'bg-[#991b1b]',
  suspended: 'bg-[#92400e]',
  free: 'bg-[#737373]',
  pro: 'bg-[#7c3aed]',
  proplus: 'bg-[#9333ea]',
  power: 'bg-[#111827]',
  trial: 'bg-[#0d9488]',
}

export function KiroBadge({
  variant,
  children,
  className,
}: {
  variant: BadgeVariant
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold leading-tight text-white',
        BADGE_BG[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
