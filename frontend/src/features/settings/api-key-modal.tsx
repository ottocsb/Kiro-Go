// API key 创建/编辑弹窗。编辑模式 key 只读且不回传；负数/NaN 上限归零。
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useT } from '@/i18n/i18n'
import type { ApiKeyView } from '@/lib/types'
import type { ApiKeysApi } from './use-api-keys'

export function ApiKeyModal({
  open,
  entry,
  api,
  onClose,
  onShowKey,
}: {
  open: boolean
  entry: ApiKeyView | null
  api: ApiKeysApi
  onClose: () => void
  onShowKey: (key: string) => void
}) {
  const t = useT()
  const editing = !!entry
  const [name, setName] = useState('')
  const [keyVal, setKeyVal] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [tokenLimit, setTokenLimit] = useState('0')
  const [creditLimit, setCreditLimit] = useState('0')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(entry?.name || '')
    setKeyVal(editing ? entry?.keyMasked || '' : '')
    setEnabled(editing ? !!entry?.enabled : true)
    setTokenLimit(editing ? String(entry?.tokenLimit || 0) : '0')
    setCreditLimit(editing ? String(entry?.creditLimit || 0) : '0')
    setSubmitting(false)
  }, [open, entry, editing])

  async function submit() {
    if (submitting) return
    setSubmitting(true)
    let tl = parseInt(tokenLimit, 10)
    if (!Number.isFinite(tl) || tl < 0) tl = 0
    let cl = parseFloat(creditLimit)
    if (!Number.isFinite(cl) || cl < 0) cl = 0
    const payload = { name: name.trim(), enabled, tokenLimit: tl, creditLimit: cl }

    if (editing && entry) {
      const ok = await api.updateKey(entry.id, payload)
      if (ok) onClose()
      else setSubmitting(false)
    } else {
      const k = keyVal.trim()
      const newKey = await api.createKey(k ? { ...payload, key: k } : payload)
      if (newKey !== null) {
        onClose()
        onShowKey(newKey)
      } else {
        setSubmitting(false)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t(editing ? 'apiKeys.modalTitleEdit' : 'apiKeys.modalTitleCreate')}</DialogTitle>
          <DialogDescription className="sr-only">{t('apiKeys.listTitle')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKeyForm_name">{t('apiKeys.formName')}</Label>
            <Input
              id="apiKeyForm_name"
              value={name}
              placeholder={t('apiKeys.formNamePlaceholder')}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiKeyForm_key">{t('apiKeys.formKey')}</Label>
            <Input
              id="apiKeyForm_key"
              value={keyVal}
              readOnly={editing}
              placeholder={t('apiKeys.formKeyPlaceholder')}
              onChange={(e) => setKeyVal(e.target.value)}
              className={editing ? 'font-mono text-muted-foreground' : 'font-mono'}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Switch checked={enabled} onCheckedChange={setEnabled} />
            {t('apiKeys.formEnabled')}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="apiKeyForm_tokenLimit">{t('apiKeys.limitTokens')}</Label>
              <Input
                id="apiKeyForm_tokenLimit"
                type="number"
                min={0}
                step={1}
                value={tokenLimit}
                onChange={(e) => setTokenLimit(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t('apiKeys.limitHint')}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKeyForm_creditLimit">{t('apiKeys.limitCredits')}</Label>
              <Input
                id="apiKeyForm_creditLimit"
                type="number"
                min={0}
                step={0.01}
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t('apiKeys.limitHint')}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('apiKeys.cancelBtn')}
          </Button>
          <Button type="button" disabled={submitting} onClick={submit}>
            {t('apiKeys.saveBtn')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
