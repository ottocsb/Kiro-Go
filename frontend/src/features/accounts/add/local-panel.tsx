// 方式5：Kiro 本地缓存文件（token JSON +（IdC 时）client JSON），社交 provider 无需 client。
import { useState } from 'react'
import { Upload } from 'lucide-react'
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

function readFileInto(file: File | undefined, set: (s: string) => void) {
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => set(String(reader.result || ''))
  reader.readAsText(file)
}

export function LocalPanel({
  onBack,
  finish,
}: {
  onBack: () => void
  finish: (ids: string | string[]) => void
}) {
  const t = useT()
  const [provider, setProvider] = useState('BuilderId')
  const [tokenJson, setTokenJson] = useState('')
  const [clientJson, setClientJson] = useState('')

  const isSocial = provider === 'Google' || provider === 'Github'

  async function submit() {
    const tj = tokenJson.trim()
    const cj = clientJson.trim()
    if (!tj) {
      toastWarning(t('local.tokenMissing'))
      return
    }
    let tokenData: { refreshToken?: string; accessToken?: string; region?: string }
    try {
      tokenData = JSON.parse(tj)
    } catch {
      toastWarning(t('local.tokenInvalid'))
      return
    }
    if (!tokenData.refreshToken) {
      toastWarning(t('local.refreshTokenMissing'))
      return
    }
    let clientData: { clientId?: string; clientSecret?: string } | null = null
    if (!isSocial) {
      if (!cj) {
        toastWarning(t('local.clientMissing'))
        return
      }
      try {
        clientData = JSON.parse(cj)
      } catch {
        toastWarning(t('local.clientInvalid'))
        return
      }
      if (!clientData!.clientId || !clientData!.clientSecret) {
        toastWarning(t('local.clientSecretMissing'))
        return
      }
    }

    const authMethod = clientData ? 'idc' : 'social'
    try {
      const d = await apiPost<{ success: boolean; account?: { id: string; email: string }; error?: string }>(
        '/auth/credentials',
        {
          refreshToken: tokenData.refreshToken,
          accessToken: tokenData.accessToken || '',
          clientId: clientData?.clientId || '',
          clientSecret: clientData?.clientSecret || '',
          region: tokenData.region || '',
          authMethod,
          provider,
        },
      )
      if (d.success && d.account) {
        toastPrimary(t('local.importSuccess') + ': ' + (d.account.email || d.account.id))
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
      <p className="text-sm text-muted-foreground">{t('modal.localDesc')}</p>
      <div className="rounded-md border bg-muted/40 p-2.5 text-xs text-muted-foreground">
        <div className="font-medium">{t('local.fileLocation')}</div>
        <div>
          {t('local.windows')}: <code>%USERPROFILE%\.aws\sso\cache\</code>
        </div>
        <div>
          {t('local.macosLinux')}: <code>~/.aws/sso/cache/</code>
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t('local.loginChannel')}</Label>
        <Select value={provider} onValueChange={setProvider}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BuilderId">{t('local.providerBuilderId')}</SelectItem>
            <SelectItem value="Enterprise">{t('local.providerEnterprise')}</SelectItem>
            <SelectItem value="Google">{t('local.providerGoogle')}</SelectItem>
            <SelectItem value="Github">{t('local.providerGithub')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="localTokenJson">
            {t('local.tokenFile')} <span className="text-xs text-muted-foreground">{t('local.tokenRequired')}</span>
          </Label>
          <label className="inline-flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <Upload className="size-3.5" />
            {t('local.upload')}
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => readFileInto(e.target.files?.[0], setTokenJson)}
            />
          </label>
        </div>
        <Textarea
          id="localTokenJson"
          className="font-mono text-xs"
          rows={4}
          value={tokenJson}
          placeholder={t('local.pasteOrUpload')}
          onChange={(e) => setTokenJson(e.target.value)}
        />
      </div>

      {!isSocial ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="localClientJson">
              {t('local.clientFile')}{' '}
              <span className="text-xs text-muted-foreground">{t('local.clientRequired')}</span>
            </Label>
            <label className="inline-flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <Upload className="size-3.5" />
              {t('local.upload')}
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => readFileInto(e.target.files?.[0], setClientJson)}
              />
            </label>
          </div>
          <Textarea
            id="localClientJson"
            className="font-mono text-xs"
            rows={4}
            value={clientJson}
            placeholder={t('local.pasteOrUpload')}
            onChange={(e) => setClientJson(e.target.value)}
          />
        </div>
      ) : null}

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
