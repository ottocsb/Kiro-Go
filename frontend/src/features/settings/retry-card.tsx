// 限流自动重试卡：retryOnThrottle + retryMaxRetries(1-10，默认3)。
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useT } from '@/i18n/i18n'
import { apiFetch } from '@/lib/api'
import { toastError, toastSuccess } from '@/lib/toast'

export function RetryCard({ initialOn, initialMax }: { initialOn: boolean; initialMax: number }) {
  const t = useT()
  const [on, setOn] = useState(initialOn)
  const [max, setMax] = useState(String(initialMax))
  useEffect(() => setOn(initialOn), [initialOn])
  useEffect(() => setMax(String(initialMax)), [initialMax])

  async function save() {
    let n = parseInt(max, 10)
    if (!Number.isFinite(n) || n < 1) n = 3
    if (n > 10) n = 10
    setMax(String(n))
    try {
      await apiFetch('/settings', { method: 'POST', body: { retryOnThrottle: on, retryMaxRetries: n } })
      toastSuccess(t('settings.retrySaved'))
    } catch {
      toastError(t('common.saveFailed'))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.retrySettings')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Switch checked={on} onCheckedChange={setOn} />
          {t('settings.retryOnThrottle')}
        </label>
        <p className="text-xs text-muted-foreground">{t('settings.retryOnThrottleHint')}</p>
        <div className="space-y-2">
          <label className="text-sm" htmlFor="retryMaxRetries">
            {t('settings.retryMaxRetries')}
          </label>
          <Input
            id="retryMaxRetries"
            type="number"
            min={1}
            max={10}
            step={1}
            className="w-28"
            value={max}
            onChange={(e) => setMax(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">{t('settings.retryMaxRetriesHint')}</p>
        </div>
        <Button type="button" onClick={save}>
          {t('settings.saveRetry')}
        </Button>
      </CardContent>
    </Card>
  )
}
