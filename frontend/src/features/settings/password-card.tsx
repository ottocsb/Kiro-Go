// 管理密码卡：修改后立即用新密码更新本地鉴权状态。
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useT } from '@/i18n/i18n'
import { apiFetch } from '@/lib/api'
import { setActivePassword } from '@/lib/auth'
import { toastError, toastSuccess, toastWarning } from '@/lib/toast'

export function PasswordCard() {
  const t = useT()
  const [pwd, setPwd] = useState('')

  async function change() {
    if (!pwd) {
      toastWarning(t('settings.passwordRequired'))
      return
    }
    try {
      const res = await apiFetch('/settings', { method: 'POST', body: { password: pwd } })
      const d = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string }
      if (!res.ok || d.success === false) throw new Error(d.error || t('common.saveFailed'))
      setActivePassword(pwd, localStorage.getItem('kiro_remember') === '1')
      toastSuccess(t('settings.passwordChanged'))
      setPwd('')
    } catch (e) {
      toastError((e as Error).message || t('common.saveFailed'))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.adminPassword')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm" htmlFor="newPassword">
            {t('settings.newPassword')}
          </label>
          <Input
            id="newPassword"
            type="password"
            value={pwd}
            placeholder={t('settings.newPasswordPlaceholder')}
            onChange={(e) => setPwd(e.target.value)}
          />
        </div>
        <Button type="button" onClick={change}>
          {t('settings.changePassword')}
        </Button>
      </CardContent>
    </Card>
  )
}
