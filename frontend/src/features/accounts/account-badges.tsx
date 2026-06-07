// 账号卡片的徽章行：订阅 / 试用 / 权重 / overage / 认证 / 状态（顺序与配色严格对齐旧版）。
import { KiroBadge, type BadgeVariant } from '@/components/app/kiro-badge'
import { useT } from '@/i18n/i18n'
import { formatAuthMethod, formatSubscriptionLabel } from '@/lib/format'
import type { Account } from '@/lib/types'

function subVariant(type: string): BadgeVariant {
  const s = (type || '').toUpperCase()
  if (s.includes('POWER')) return 'power'
  if (s.includes('PRO_PLUS') || s.includes('PROPLUS')) return 'proplus'
  if (s.includes('PRO')) return 'pro'
  return 'free'
}

export function AccountBadges({ account: a }: { account: Account }) {
  const t = useT()
  const banned = !!a.banStatus && a.banStatus !== 'ACTIVE'
  const weight = a.weight || 0
  const overage = (a.overageStatus || '').toUpperCase()

  const statusBadges: { variant: BadgeVariant; text: string }[] = []
  if (banned) {
    if (a.banStatus === 'BANNED') statusBadges.push({ variant: 'banned', text: t('accounts.banned') })
    else if (a.banStatus === 'SUSPENDED')
      statusBadges.push({ variant: 'suspended', text: t('accounts.suspended') })
    statusBadges.push({ variant: 'warning', text: t('accounts.disabled') })
  } else {
    if (!a.hasToken) statusBadges.push({ variant: 'error', text: t('accounts.noToken') })
    else if (a.expiresAt && a.expiresAt < Date.now() / 1000)
      statusBadges.push({ variant: 'warning', text: t('accounts.expired') })
    else statusBadges.push({ variant: 'success', text: t('accounts.normal') })
    statusBadges.push(
      a.enabled
        ? { variant: 'info', text: t('accounts.enabled') }
        : { variant: 'warning', text: t('accounts.disabled') },
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <KiroBadge variant={subVariant(a.subscriptionType)}>
        {formatSubscriptionLabel(t, a.subscriptionType)}
      </KiroBadge>

      {a.trialStatus === 'ACTIVE' && a.trialUsageLimit > 0 ? (
        <KiroBadge variant="trial">{t('accounts.trial')}</KiroBadge>
      ) : null}

      {weight >= 2 ? (
        <KiroBadge variant="warning">
          {t('accounts.weightShort')}:{weight}
        </KiroBadge>
      ) : null}

      {overage === 'ENABLED' ? (
        <KiroBadge variant="warning">{t('accounts.overageOn')}</KiroBadge>
      ) : overage === 'DISABLED' ? (
        <KiroBadge variant="muted">{t('accounts.overageOff')}</KiroBadge>
      ) : null}

      <KiroBadge variant="info">{formatAuthMethod(t, a.provider || a.authMethod)}</KiroBadge>

      {statusBadges.map((b, i) => (
        <KiroBadge key={i} variant={b.variant}>
          {b.text}
        </KiroBadge>
      ))}
    </div>
  )
}
