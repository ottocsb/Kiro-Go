// 统计重置卡。
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useT } from '@/i18n/i18n'
import { useConfirm } from '@/components/app/confirm-dialog'
import { useAppData } from '@/hooks/use-app-data'
import { apiPost } from '@/lib/api'
import { toastError, toastPrimary } from '@/lib/toast'

export function StatsResetCard() {
  const t = useT()
  const confirm = useConfirm()
  const { reloadStatus } = useAppData()

  async function reset() {
    const ok = await confirm(t('settings.confirmReset'), {
      title: t('settings.resetStats'),
      confirmText: t('settings.resetStats'),
      variant: 'danger',
    })
    if (!ok) return
    try {
      await apiPost('/stats/reset')
      toastPrimary(t('settings.statsReset'))
      await reloadStatus()
    } catch (e) {
      toastError((e as Error).message || t('common.failed'))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.statistics')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button type="button" variant="destructive" onClick={reset}>
          {t('settings.resetStats')}
        </Button>
      </CardContent>
    </Card>
  )
}
