// 方式6：从 Kiro 网页 Cookie 获取的社交 RefreshToken（Google/Github）。
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useT } from '@/i18n/i18n'
import { apiPost } from '@/lib/api'
import { toastError, toastPrimary, toastWarning } from '@/lib/toast'

export function CookiePanel({
  onBack,
  finish,
}: {
  onBack: () => void
  finish: (ids: string | string[]) => void
}) {
  const t = useT()
  const [provider, setProvider] = useState('Google')
  const [refreshToken, setRefreshToken] = useState('')

  async function submit() {
    const rt = refreshToken.trim()
    if (!rt) {
      toastWarning(t('cookie.refreshTokenMissing'))
      return
    }
    try {
      const d = await apiPost<{ success: boolean; account?: { id: string; email: string }; error?: string }>(
        '/auth/credentials',
        { refreshToken: rt, accessToken: '', clientId: '', clientSecret: '', authMethod: 'social', provider },
      )
      if (d.success && d.account) {
        toastPrimary(t('cookie.importSuccess') + ': ' + (d.account.email || d.account.id))
        finish(d.account.id)
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
        <div className="font-semibold">{t('cookie.howToGet')}</div>
        <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-muted-foreground">
          <li>
            {t('cookie.step1')}{' '}
            <a className="text-primary underline" href={t('cookie.link')} target="_blank" rel="noopener noreferrer">
              {t('cookie.link')}
            </a>
          </li>
          <li>{t('cookie.step2')}</li>
          <li>{t('cookie.step3')}</li>
        </ol>
      </div>
      <div className="space-y-2">
        <Label>{t('cookie.provider')}</Label>
        <Select value={provider} onValueChange={setProvider}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Google">{t('cookie.google')}</SelectItem>
            <SelectItem value="Github">{t('cookie.github')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="cookieRefreshToken">{t('cookie.refreshToken')}</Label>
        <Textarea
          id="cookieRefreshToken"
          className="font-mono text-xs"
          rows={4}
          value={refreshToken}
          placeholder={t('cookie.refreshTokenPlaceholder')}
          onChange={(e) => setRefreshToken(e.target.value)}
        />
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
