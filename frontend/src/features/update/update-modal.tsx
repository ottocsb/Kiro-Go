// 更新弹窗：当前 vs 最新版本对比卡 + 可选 changelog + 下载链接。
import { ArrowUp } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useT } from '@/i18n/i18n'
import { useAppData } from '@/hooks/use-app-data'
import { stripLeadingV } from '@/lib/format'
import { useUpdate } from './use-update'

export function UpdateModal() {
  const t = useT()
  const { version } = useAppData()
  const { modal, closeModal } = useUpdate()

  const open = modal !== null
  const current = stripLeadingV(version)

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) closeModal() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('update.title')}</DialogTitle>
          <DialogDescription className="sr-only">{t('update.newVersionMessage')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ArrowUp className="size-5" />
            </div>
            <div>
              <div className="font-semibold">{t('update.newVersion')}</div>
              <div className="text-sm text-muted-foreground">{t('update.newVersionMessage')}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">{t('update.current')}</div>
              <div className="mt-1 font-mono text-lg">{current || '-'}</div>
            </div>
            <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
              <div className="text-xs text-muted-foreground">{t('update.latest')}</div>
              <div className="mt-1 font-mono text-lg text-primary">{modal?.version || '-'}</div>
            </div>
          </div>

          {modal?.changelog ? (
            <div className="rounded-lg border bg-muted/40 p-3">
              <div className="mb-1 text-xs font-medium text-muted-foreground">
                {t('update.changelog')}
              </div>
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap text-sm">
                {modal.changelog}
              </pre>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          {modal?.url ? (
            <Button asChild>
              <a href={modal.url} target="_blank" rel="noopener noreferrer">
                {t('update.goDownload')}
              </a>
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
