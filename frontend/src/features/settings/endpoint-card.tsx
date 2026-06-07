// Kiro 端点设置卡：首选端点 + 不可用时自动切换。
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useT } from '@/i18n/i18n'
import { apiFetch, apiGet } from '@/lib/api'
import { toastError, toastSuccess } from '@/lib/toast'
import type { EndpointConfig } from '@/lib/types'

export function EndpointCard() {
  const t = useT()
  const [preferred, setPreferred] = useState('auto')
  const [fallback, setFallback] = useState(true)

  useEffect(() => {
    apiGet<EndpointConfig>('/endpoint')
      .then((d) => {
        setPreferred(d.preferredEndpoint || 'auto')
        setFallback(d.endpointFallback !== false)
      })
      .catch(() => {})
  }, [])

  async function save() {
    try {
      const res = await apiFetch('/endpoint', {
        method: 'POST',
        body: { preferredEndpoint: preferred, endpointFallback: fallback },
      })
      const d = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string }
      if (d.success) toastSuccess(t('settings.endpointSaved'))
      else toastError(t('common.saveFailed') + ': ' + (d.error || ''))
    } catch {
      toastError(t('common.saveFailed'))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.endpointSettings')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>{t('settings.preferredEndpoint')}</Label>
          <Select value={preferred} onValueChange={setPreferred}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">{t('settings.endpointAuto')}</SelectItem>
              <SelectItem value="kiro">{t('settings.endpointKiro')}</SelectItem>
              <SelectItem value="codewhisperer">{t('settings.endpointCodeWhisperer')}</SelectItem>
              <SelectItem value="amazonq">{t('settings.endpointAmazonQ')}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{t('settings.endpointHint')}</p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Switch checked={fallback} onCheckedChange={setFallback} />
          {t('settings.endpointFallback')}
        </label>
        <p className="text-xs text-muted-foreground">{t('settings.endpointFallbackHint')}</p>
        <Button type="button" onClick={save}>
          {t('settings.saveEndpoint')}
        </Button>
      </CardContent>
    </Card>
  )
}
