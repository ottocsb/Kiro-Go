// 用量控制卡：allowOverUsage 开关。
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useT } from '@/i18n/i18n'
import { apiFetch } from '@/lib/api'
import { toastError, toastSuccess } from '@/lib/toast'

export function UsageCard({ initial }: { initial: boolean }) {
  const t = useT()
  const [allow, setAllow] = useState(initial)
  useEffect(() => setAllow(initial), [initial])

  async function save() {
    try {
      await apiFetch('/settings', { method: 'POST', body: { allowOverUsage: allow } })
      toastSuccess(t('settings.overUsageSaved'))
    } catch {
      toastError(t('common.saveFailed'))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.usageSettings')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Switch checked={allow} onCheckedChange={setAllow} />
          {t('settings.allowOverUsage')}
        </label>
        <p className="text-xs text-muted-foreground">{t('settings.allowOverUsageHint')}</p>
        <Button type="button" onClick={save}>
          {t('settings.saveUsage')}
        </Button>
      </CardContent>
    </Card>
  )
}
