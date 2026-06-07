// 导出账号弹窗：勾选账号 → 显示完整 JSON / 复制精简凭证 / 下载完整 JSON。
import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useT } from '@/i18n/i18n'
import { usePrivacy } from '@/hooks/use-privacy'
import { useAppData } from '@/hooks/use-app-data'
import { apiFetch } from '@/lib/api'
import { copyText } from '@/lib/clipboard'
import { toastError, toastPrimary, toastWarning } from '@/lib/toast'
import { formatAuthMethod, formatSubscriptionLabel, getDisplayEmail } from '@/lib/format'

interface ExportCred {
  accessToken?: string
  refreshToken?: string
  clientId?: string
  clientSecret?: string
}
interface ExportData {
  accounts?: { credentials?: ExportCred }[]
}

export function ExportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT()
  const { enabled: privacy } = usePrivacy()
  const { accounts } = useAppData()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [jsonText, setJsonText] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setSelected(new Set(accounts.map((a) => a.id)))
      setJsonText(null)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const allSelected = accounts.length > 0 && selected.size === accounts.length

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(accounts.map((a) => a.id)))
  }

  async function getExportData(): Promise<ExportData | null> {
    if (selected.size === 0) {
      toastWarning(t('export.noSelection'))
      return null
    }
    const res = await apiFetch('/export', { method: 'POST', body: { ids: [...selected] } })
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string }
      toastError(t('common.failed') + ': ' + (err.error || t('common.unknownError')))
      return null
    }
    return (await res.json()) as ExportData
  }

  async function showJson() {
    const data = await getExportData()
    if (!data) return
    setJsonText(JSON.stringify(data, null, 2))
  }

  async function copyJson() {
    if (selected.size === 0) {
      toastWarning(t('export.noSelection'))
      return
    }
    const p = getExportData().then((data) => {
      if (!data) throw new Error('no-data')
      const filtered = (data.accounts || []).map((a) => {
        const { clientId, clientSecret, accessToken, refreshToken } = a.credentials || {}
        return { clientId, clientSecret, accessToken, refreshToken }
      })
      return JSON.stringify(filtered, null, 2)
    })
    try {
      await copyText(p)
      toastPrimary(t('export.copied'))
    } catch (e) {
      if ((e as Error).message !== 'no-data') toastError(t('common.failed'))
    }
  }

  async function downloadJson() {
    const data = await getExportData()
    if (!data) return
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'kiro-accounts-' + new Date().toISOString().slice(0, 10) + '.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('export.title')}</DialogTitle>
          <DialogDescription className="sr-only">{t('export.title')}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t('export.selected', selected.size)}</span>
          <Button type="button" variant="outline" size="sm" onClick={toggleAll}>
            {allSelected ? t('export.deselectAll') : t('export.selectAll')}
          </Button>
        </div>

        <ScrollArea className="max-h-64 rounded-md border">
          <div className="divide-y">
            {accounts.map((a) => (
              <label key={a.id} className="flex cursor-pointer items-center gap-3 p-2.5 text-sm hover:bg-accent">
                <Checkbox checked={selected.has(a.id)} onCheckedChange={() => toggle(a.id)} />
                <div className="min-w-0 flex-1">
                  <div className="truncate">{getDisplayEmail(a.email, a.id, privacy)}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatAuthMethod(t, a.provider || a.authMethod)} · {formatSubscriptionLabel(t, a.subscriptionType)}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </ScrollArea>

        {jsonText !== null ? (
          <Textarea readOnly className="h-40 font-mono text-xs" value={jsonText} />
        ) : null}

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="button" variant="outline" onClick={showJson}>
            {t('export.showJson')}
          </Button>
          <Button type="button" variant="outline" onClick={copyJson}>
            {t('export.copyJson')}
          </Button>
          <Button type="button" onClick={downloadJson}>
            {t('export.downloadJson')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
