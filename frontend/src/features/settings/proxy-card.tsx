// 出站代理卡：后端只存一个 proxyURL 字符串，前端拆解/重组（含认证）。
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useT } from '@/i18n/i18n'
import { apiFetch, apiGet } from '@/lib/api'
import { toastError, toastSuccess, toastWarning } from '@/lib/toast'

export function ProxyCard() {
  const t = useT()
  const [type, setType] = useState('none')
  const [host, setHost] = useState('')
  const [port, setPort] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    apiGet<{ proxyURL: string }>('/proxy')
      .then((d) => {
        const url = d.proxyURL || ''
        if (!url) {
          setType('none')
          return
        }
        try {
          const u = new URL(url)
          const scheme = u.protocol.replace(/:$/, '')
          setType(scheme.startsWith('socks5') ? 'socks5' : 'http')
          setHost(u.hostname)
          setPort(u.port)
          setUsername(decodeURIComponent(u.username))
          setPassword(decodeURIComponent(u.password))
        } catch {
          setType('none')
        }
      })
      .catch(() => {})
  }, [])

  async function save() {
    let url = ''
    if (type !== 'none') {
      const h = host.trim()
      const p = port.trim()
      if (!h || !p) {
        toastWarning(t('settings.proxyHostRequired'))
        return
      }
      const u = username.trim()
      const pw = password.trim()
      let auth = ''
      if (u && pw) auth = encodeURIComponent(u) + ':' + encodeURIComponent(pw) + '@'
      else if (u) auth = encodeURIComponent(u) + '@'
      url = type + '://' + auth + h + ':' + p
    }
    try {
      const res = await apiFetch('/proxy', { method: 'POST', body: { proxyURL: url } })
      const d = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string }
      if (d.success) toastSuccess(t('settings.proxySaved'))
      else toastError(t('common.saveFailed') + ': ' + (d.error || ''))
    } catch {
      toastError(t('common.saveFailed'))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.proxySettings')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>{t('settings.proxyType')}</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('settings.proxyNone')}</SelectItem>
              <SelectItem value="socks5">{t('settings.proxySocks5')}</SelectItem>
              <SelectItem value="http">{t('settings.proxyHttp')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {type !== 'none' ? (
          <>
            <div className="space-y-2">
              <Label>{t('settings.proxyHost')}</Label>
              <div className="flex gap-2">
                <Input placeholder="127.0.0.1" value={host} onChange={(e) => setHost(e.target.value)} />
                <Input
                  type="number"
                  min={1}
                  max={65535}
                  placeholder="1080"
                  className="w-28"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('settings.proxyAuth')}</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  autoComplete="off"
                  placeholder={t('settings.proxyUsername')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder={t('settings.proxyPassword')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </>
        ) : null}

        <Button type="button" onClick={save}>
          {t('settings.saveProxy')}
        </Button>
      </CardContent>
    </Card>
  )
}
