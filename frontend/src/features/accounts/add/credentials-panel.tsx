// 方式4：凭证 JSON / 行格式批量导入。逐条 POST /auth/credentials（后端导入前会真实刷新一次）。
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useT } from '@/i18n/i18n'
import { apiFetch } from '@/lib/api'
import { toastError, toastPrimary, toastWarning } from '@/lib/toast'
import { isJsonParseable, parseCredentials, parseLineCredentials, type RawCred } from './parse-credentials'

const CRED_PLACEHOLDER =
  '[{"refreshToken":"xxx","provider":"BuilderID"}]\n或\nemail----password----refreshToken----clientId----clientSecret'

export function CredentialsPanel({
  onBack,
  finish,
}: {
  onBack: () => void
  finish: (ids: string | string[]) => void
}) {
  const t = useT()
  const [raw, setRaw] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    const text = raw.trim()
    if (!text) {
      toastWarning(t('credentials.jsonError'))
      return
    }

    let items: RawCred[]
    let skipped = 0
    if (isJsonParseable(text)) {
      items = parseCredentials(text).items
    } else {
      const r = parseLineCredentials(text)
      items = r.items
      skipped = r.skipped
      if (items.length === 0 && skipped === 0) {
        toastWarning(t('credentials.jsonError'))
        return
      }
      if (items.length === 0) {
        toastWarning(t('credentials.lineParseAllSkipped', skipped))
        return
      }
    }

    setBusy(true)
    let ok = 0
    let fail = 0
    const newIds: string[] = []
    for (const item of items) {
      if (!item.refreshToken) {
        fail++
        continue
      }
      let authMethod = item.authMethod || ''
      if (item.clientId && item.clientSecret) authMethod = 'idc'
      else if (!authMethod || authMethod === 'social') authMethod = 'social'
      else authMethod = authMethod.toLowerCase() === 'idc' ? 'idc' : 'social'

      let provider = item.provider || ''
      if (!provider && authMethod === 'social') provider = 'Google'
      if (!provider && authMethod === 'idc') provider = 'BuilderId'

      try {
        const res = await apiFetch('/auth/credentials', {
          method: 'POST',
          body: {
            refreshToken: item.refreshToken,
            accessToken: item.accessToken || '',
            clientId: item.clientId || '',
            clientSecret: item.clientSecret || '',
            authMethod,
            provider,
            region: item.region || 'us-east-1',
          },
        })
        const d = (await res.json().catch(() => ({}))) as { success?: boolean; account?: { id: string } }
        if (res.ok && d.success && d.account) {
          ok++
          newIds.push(d.account.id)
        } else {
          fail++
        }
      } catch {
        fail++
      }
    }
    setBusy(false)

    if (ok === 0 && fail > 0) {
      toastError(t('common.failed'))
    }
    let msg = t('sso.importSuccess', ok)
    if (fail > 0) msg += t('sso.importPartial', fail)
    if (skipped > 0) msg += t('credentials.lineParseSkipped', skipped)
    toastPrimary(msg, { duration: 5200 })
    finish(newIds)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t('modal.credentialsDesc')}</p>
      <p className="rounded-md border bg-muted/40 p-2.5 text-xs text-muted-foreground">{t('credentials.batchHint')}</p>
      <div className="space-y-2">
        <Label htmlFor="credJson">{t('credentials.label')}</Label>
        <Textarea
          id="credJson"
          className="font-mono text-xs"
          rows={6}
          value={raw}
          placeholder={CRED_PLACEHOLDER}
          onChange={(e) => setRaw(e.target.value)}
        />
      </div>
      <div className="flex justify-between">
        <Button type="button" variant="secondary" onClick={onBack}>
          {t('common.back')}
        </Button>
        <Button type="button" disabled={busy} onClick={submit}>
          {t('common.add')}
        </Button>
      </div>
    </div>
  )
}
