// 方式2：IAM Identity Center 企业 SSO（start → 粘贴回调 URL → complete，单按钮两阶段）。
import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useT } from '@/i18n/i18n'
import { apiPost } from '@/lib/api'
import { copyText } from '@/lib/clipboard'
import { toastError, toastPrimary } from '@/lib/toast'

export function IamPanel({
  onBack,
  finish,
}: {
  onBack: () => void
  finish: (ids: string | string[]) => void
}) {
  const t = useT()
  const [startUrl, setStartUrl] = useState('')
  const [region, setRegion] = useState('us-east-1')
  const [authUrl, setAuthUrl] = useState('')
  const [callback, setCallback] = useState('')
  const [sessionId, setSessionId] = useState('')

  async function handle() {
    if (!sessionId) {
      try {
        const d = await apiPost<{ sessionId: string; authorizeUrl: string }>('/auth/iam-sso/start', {
          startUrl,
          region,
        })
        if (d.authorizeUrl) {
          setSessionId(d.sessionId)
          setAuthUrl(d.authorizeUrl)
        } else {
          toastError(t('common.failed'))
        }
      } catch (e) {
        toastError(t('common.failed') + ': ' + ((e as Error).message || ''))
      }
    } else {
      try {
        const d = await apiPost<{ success: boolean; account?: { id: string; email: string }; error?: string }>(
          '/auth/iam-sso/complete',
          { sessionId, callbackUrl: callback },
        )
        if (d.success && d.account) {
          toastPrimary(t('builderid.success') + ': ' + (d.account.email || d.account.id))
          finish(d.account.id)
        } else {
          toastError(t('common.failed') + ': ' + (d.error || ''))
        }
      } catch (e) {
        toastError(t('common.failed') + ': ' + ((e as Error).message || ''))
      }
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t('modal.iamDesc')}</p>
      <div className="space-y-2">
        <Label htmlFor="iamStartUrl">{t('iam.startUrl')}</Label>
        <Input
          id="iamStartUrl"
          value={startUrl}
          placeholder="https://xxx.awsapps.com/start"
          onChange={(e) => setStartUrl(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="iamRegion">{t('detail.region')}</Label>
        <Input id="iamRegion" value={region} onChange={(e) => setRegion(e.target.value)} />
      </div>

      {sessionId ? (
        <>
          <div className="space-y-1">
            <Label>{t('iam.loginUrl')}</Label>
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate rounded-md border px-2 py-1.5 text-sm">{authUrl}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => window.open(authUrl, '_blank')}>
                <ExternalLink className="size-4" />
                {t('builderid.open')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void copyText(authUrl).then(() => toastPrimary(t('common.copied')))}
              >
                {t('common.copy')}
              </Button>
            </div>
          </div>
          <p className="text-sm text-emerald-600">{t('iam.completeLogin')}</p>
          <div className="space-y-2">
            <Label htmlFor="iamCallback">{t('iam.callbackUrl')}</Label>
            <Input
              id="iamCallback"
              value={callback}
              placeholder="http://127.0.0.1:xxx/?code=..."
              onChange={(e) => setCallback(e.target.value)}
            />
          </div>
        </>
      ) : null}

      <div className="flex justify-between">
        <Button type="button" variant="secondary" onClick={onBack}>
          {t('common.back')}
        </Button>
        <Button type="button" onClick={handle}>
          {sessionId ? t('iam.complete') : t('builderid.startLogin')}
        </Button>
      </div>
    </div>
  )
}
