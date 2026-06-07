// 方式3：SSO Token（x-amz-sso_authn）批量导入（每行一个 token）。
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useT } from '@/i18n/i18n'
import { apiPost } from '@/lib/api'
import { toastError, toastPrimary } from '@/lib/toast'

export function SsoPanel({
  onBack,
  finish,
}: {
  onBack: () => void
  finish: (ids: string | string[]) => void
}) {
  const t = useT()
  const [token, setToken] = useState('')
  const [region, setRegion] = useState('us-east-1')

  async function submit() {
    try {
      const d = await apiPost<{
        success: boolean
        accounts?: { id: string; email: string }[]
        errors?: string[]
        error?: string
      }>('/auth/sso-token', { bearerToken: token, region })
      if (d.success) {
        const count = d.accounts?.length || 0
        const errs = d.errors?.length || 0
        let msg = t('sso.importSuccess', count)
        if (errs > 0) msg += t('sso.importPartial', errs)
        toastPrimary(msg, { duration: 5200 })
        finish((d.accounts || []).map((a) => a.id))
      } else {
        toastError(t('common.failed') + ': ' + (d.error || ''))
      }
    } catch (e) {
      toastError(t('common.failed') + ': ' + ((e as Error).message || ''))
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-muted/40 p-3 text-sm">
        <div className="font-semibold">{t('sso.howToGet')}</div>
        <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-muted-foreground">
          <li>
            {t('sso.step1')} <code className="rounded bg-background px-1">view.awsapps.com/start</code>
          </li>
          <li>{t('sso.step2')}</li>
          <li>
            {t('sso.step3')} <code className="rounded bg-background px-1">x-amz-sso_authn</code>
          </li>
        </ol>
      </div>
      <div className="space-y-2">
        <Label htmlFor="ssoToken">
          {t('sso.tokenLabel')} <span className="text-xs text-muted-foreground">{t('sso.tokenHint')}</span>
        </Label>
        <Textarea
          id="ssoToken"
          value={token}
          rows={4}
          placeholder={t('sso.tokenPlaceholder')}
          onChange={(e) => setToken(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ssoRegion">{t('detail.region')}</Label>
        <Input id="ssoRegion" value={region} onChange={(e) => setRegion(e.target.value)} />
      </div>
      <div className="flex justify-between">
        <Button type="button" variant="secondary" onClick={onBack}>
          {t('common.back')}
        </Button>
        <Button type="button" onClick={submit}>
          {t('common.add')}
        </Button>
      </div>
    </div>
  )
}
