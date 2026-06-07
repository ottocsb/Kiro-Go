// 新建 API key 后一次性展示明文（关闭即清除）。
import { useEffect, useRef } from 'react'
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
import { useT } from '@/i18n/i18n'
import { copyText } from '@/lib/clipboard'
import { toastError, toastSuccess } from '@/lib/toast'

export function ApiKeyShowModal({ value, onClose }: { value: string | null; onClose: () => void }) {
  const t = useT()
  const inputRef = useRef<HTMLInputElement>(null)
  const open = value !== null

  useEffect(() => {
    if (open) {
      const timer = window.setTimeout(() => inputRef.current?.select(), 0)
      return () => window.clearTimeout(timer)
    }
  }, [open])

  async function copy() {
    if (!value) return
    try {
      await copyText(value)
      toastSuccess(t('apiKeys.copySuccess'))
    } catch {
      toastError(t('common.failed'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('apiKeys.showTitle')}</DialogTitle>
          <DialogDescription>{t('apiKeys.showWarning')}</DialogDescription>
        </DialogHeader>
        <Input ref={inputRef} readOnly value={value || ''} className="font-mono" />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={copy}>
            {t('apiKeys.copyBtn')}
          </Button>
          <Button type="button" onClick={onClose}>
            {t('apiKeys.closeBtn')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
