// Settings 页：API设置 / 用量 / Thinking / 端点 / 重试 / 管理密码 / 出站代理 / Prompt 过滤 / 统计重置。
import { useEffect, useState } from 'react'
import { apiGet } from '@/lib/api'
import type { AppSettings } from '@/lib/types'
import { useApiKeys } from '@/features/settings/use-api-keys'
import { ApiSettingsCard } from '@/features/settings/api-settings-card'
import { UsageCard } from '@/features/settings/usage-card'
import { ThinkingCard } from '@/features/settings/thinking-card'
import { EndpointCard } from '@/features/settings/endpoint-card'
import { RetryCard } from '@/features/settings/retry-card'
import { PasswordCard } from '@/features/settings/password-card'
import { ProxyCard } from '@/features/settings/proxy-card'
import { PromptFilterCard } from '@/features/settings/prompt-filter-card'
import { StatsResetCard } from '@/features/settings/stats-reset-card'

export function SettingsPage() {
  const apiKeysApi = useApiKeys()
  const [settings, setSettings] = useState<AppSettings | null>(null)

  useEffect(() => {
    apiGet<AppSettings>('/settings')
      .then(setSettings)
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-4">
      <ApiSettingsCard initialRequire={settings?.requireApiKey ?? false} apiKeysApi={apiKeysApi} />
      <UsageCard initial={settings?.allowOverUsage ?? false} />
      <ThinkingCard />
      <EndpointCard />
      <RetryCard initialOn={settings?.retryOnThrottle ?? false} initialMax={settings?.retryMaxRetries || 3} />
      <PasswordCard />
      <ProxyCard />
      <PromptFilterCard />
      <StatsResetCard />
    </div>
  )
}
