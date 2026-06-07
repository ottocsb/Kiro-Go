// 单个账号卡片：选择框 + 邮箱 + 徽章 + 操作按钮 + 用量条 + 统计行。
import { useState } from 'react'
import { Check, Copy, RefreshCw, User } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { useT } from '@/i18n/i18n'
import { usePrivacy } from '@/hooks/use-privacy'
import { formatNum, formatTokenExpiry, formatTrialExpiry, getDisplayEmail } from '@/lib/format'
import type { Account } from '@/lib/types'
import { AccountBadges } from './account-badges'
import { UsageBar } from '@/components/app/usage-bar'
import { useAccountActions } from './use-account-actions'

export function AccountCard({
  account: a,
  selected,
  onToggleSelect,
  onOpenDetail,
  onOpenTest,
}: {
  account: Account
  selected: boolean
  onToggleSelect: (id: string) => void
  onOpenDetail: (id: string) => void
  onOpenTest: (id: string) => void
}) {
  const t = useT()
  const { enabled: privacy } = usePrivacy()
  const actions = useAccountActions()
  const [refreshing, setRefreshing] = useState(false)
  const [copied, setCopied] = useState(false)

  const banned = !!a.banStatus && a.banStatus !== 'ACTIVE'
  const displayEmail = getDisplayEmail(a.email, a.id, privacy)

  async function handleRefresh() {
    setRefreshing(true)
    await actions.refresh(a.id)
    setRefreshing(false)
  }

  async function handleCopy() {
    const ok = await actions.copyJSON(a.id)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 800)
    }
  }

  return (
    <Card className={cn('gap-3 p-4 transition-opacity', selected && 'ring-2 ring-primary', refreshing && 'opacity-60')}>
      <div className="flex flex-wrap items-start gap-3">
        <Checkbox
          className="mt-1"
          checked={selected}
          onCheckedChange={() => onToggleSelect(a.id)}
          aria-label={t('accounts.selectAccount', displayEmail)}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium" title={displayEmail}>
            {displayEmail}
          </div>
          <div className="mt-1.5">
            <AccountBadges account={a} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            title={t('accounts.refresh')}
            disabled={refreshing}
            onClick={handleRefresh}
          >
            <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            title={t('accounts.detail')}
            onClick={() => onOpenDetail(a.id)}
          >
            <User className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn('size-8', copied && 'text-emerald-600')}
            title={t('accounts.copyJSON')}
            onClick={handleCopy}
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </Button>
          {!banned ? (
            <Button
              type="button"
              variant={a.enabled ? 'outline' : 'default'}
              size="sm"
              onClick={() => actions.toggle(a.id, !a.enabled)}
            >
              {a.enabled ? t('accounts.disable') : t('accounts.enable')}
            </Button>
          ) : null}
          <Button type="button" variant="secondary" size="sm" onClick={() => onOpenTest(a.id)}>
            {t('accounts.test')}
          </Button>
          <Button type="button" variant="destructive" size="sm" onClick={() => actions.remove(a.id)}>
            {t('accounts.delete')}
          </Button>
        </div>
      </div>

      {a.usageLimit > 0 ? (
        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t('accounts.mainQuota')}</span>
            <span>
              {(a.usageCurrent || 0).toFixed(1)} / {(a.usageLimit || 0).toFixed(0)} ·{' '}
              {((a.usagePercent || 0) * 100).toFixed(1)}%
            </span>
          </div>
          <UsageBar percent={(a.usagePercent || 0) * 100} />
        </div>
      ) : null}

      {a.trialUsageLimit > 0 ? (
        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {t('accounts.trialQuota')} {formatTrialExpiry(t, a.trialExpiresAt)}
            </span>
            <span>
              {(a.trialUsageCurrent || 0).toFixed(1)} / {(a.trialUsageLimit || 0).toFixed(0)} ·{' '}
              {((a.trialUsagePercent || 0) * 100).toFixed(1)}%
            </span>
          </div>
          <UsageBar percent={(a.trialUsagePercent || 0) * 100} />
        </div>
      ) : null}

      <div className="grid grid-cols-4 gap-2 border-t pt-3 text-center">
        <Stat value={String(a.requestCount || 0)} label={t('accounts.requests')} />
        <Stat value={formatNum(a.totalTokens || 0)} label={t('accounts.tokens')} />
        <Stat value={(a.totalCredits || 0).toFixed(1)} label={t('accounts.credits')} />
        <Stat value={formatTokenExpiry(t, a.expiresAt)} label={t('accounts.expiry')} />
      </div>
    </Card>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-sm font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
