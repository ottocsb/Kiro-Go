// API 设置卡：requireApiKey 主开关 + API keys 列表。
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useT } from '@/i18n/i18n'
import { useConfirm } from '@/components/app/confirm-dialog'
import { apiFetch } from '@/lib/api'
import { toastError, toastSuccess } from '@/lib/toast'
import { ApiKeysSection } from './api-keys-section'
import type { ApiKeysApi } from './use-api-keys'

export function ApiSettingsCard({
  initialRequire,
  apiKeysApi,
}: {
  initialRequire: boolean
  apiKeysApi: ApiKeysApi
}) {
  const t = useT()
  const confirm = useConfirm()
  const [requireApiKey, setRequireApiKey] = useState(initialRequire)

  useEffect(() => setRequireApiKey(initialRequire), [initialRequire])

  async function save() {
    if (requireApiKey) {
      const hasEnabled = apiKeysApi.keys.some((k) => k.enabled)
      if (!hasEnabled) {
        const ok = await confirm(t('apiKeys.requireWithoutEnabledKeyWarning'), {
          title: t('settings.apiSettings'),
        })
        if (!ok) {
          setRequireApiKey(false)
          return
        }
      }
    }
    try {
      const res = await apiFetch('/settings', { method: 'POST', body: { requireApiKey } })
      const d = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string }
      if (!res.ok || d.success === false) throw new Error(d.error || t('common.saveFailed'))
      toastSuccess(t('detail.saved'))
    } catch (e) {
      toastError((e as Error).message || t('common.saveFailed'))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.apiSettings')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Switch checked={requireApiKey} onCheckedChange={setRequireApiKey} />
          {t('settings.enableApiKey')}
        </label>
        <p className="text-xs text-muted-foreground">{t('apiKeys.requireHint')}</p>
        <Button type="button" onClick={save}>
          {t('settings.saveApiKey')}
        </Button>
        <Separator />
        <ApiKeysSection api={apiKeysApi} />
      </CardContent>
    </Card>
  )
}
