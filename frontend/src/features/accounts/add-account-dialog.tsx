// 添加账号弹窗：方式选择器 + 路由到 6 个方式面板，成功后对新账号自动刷新并重载列表。
import { useEffect, useState } from 'react'
import { ChevronRight, Code2, Cookie, FolderOpen, IdCard, KeyRound, ShieldCheck } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useT } from '@/i18n/i18n'
import { apiPost } from '@/lib/api'
import { useAppData } from '@/hooks/use-app-data'
import { BuilderIdPanel } from './add/builderid-panel'
import { IamPanel } from './add/iam-panel'
import { SsoPanel } from './add/sso-panel'
import { CredentialsPanel } from './add/credentials-panel'
import { LocalPanel } from './add/local-panel'
import { CookiePanel } from './add/cookie-panel'

type Method = 'add' | 'builderid' | 'iam' | 'sso' | 'local' | 'credentials' | 'cookie'

const METHODS: { key: Exclude<Method, 'add'>; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'builderid', icon: IdCard },
  { key: 'iam', icon: KeyRound },
  { key: 'sso', icon: ShieldCheck },
  { key: 'local', icon: FolderOpen },
  { key: 'credentials', icon: Code2 },
  { key: 'cookie', icon: Cookie },
]

const TITLE_KEY: Record<Method, string> = {
  add: 'modal.addAccount',
  builderid: 'modal.builderIdTitle',
  iam: 'modal.iamTitle',
  sso: 'modal.ssoTitle',
  local: 'modal.localTitle',
  credentials: 'modal.credentialsTitle',
  cookie: 'modal.cookieTitle',
}

export function AddAccountDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT()
  const { reloadAccounts, reloadStatus } = useAppData()
  const [method, setMethod] = useState<Method>('add')

  useEffect(() => {
    if (open) setMethod('add')
  }, [open])

  async function finish(ids: string | string[]) {
    onClose()
    const arr = Array.isArray(ids) ? ids : [ids]
    for (const id of arr) {
      if (!id) continue
      try {
        await apiPost(`/accounts/${id}/refresh`)
      } catch {
        /* 自动刷新失败忽略 */
      }
    }
    await Promise.all([reloadAccounts(), reloadStatus()])
  }

  const back = () => setMethod('add')

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t(TITLE_KEY[method])}</DialogTitle>
          <DialogDescription className="sr-only">{t('modal.addAccount')}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[72vh] pr-3">
          {method === 'add' ? (
            <div className="space-y-2">
              {METHODS.map(({ key, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                  onClick={() => setMethod(key)}
                >
                  <Icon className="size-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{t(TITLE_KEY[key])}</div>
                    <div className="text-xs text-muted-foreground">{t('modal.' + key + 'Desc')}</div>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
              <div className="flex justify-end pt-2">
                <Button type="button" variant="secondary" onClick={onClose}>
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          ) : method === 'builderid' ? (
            <BuilderIdPanel onBack={back} finish={finish} />
          ) : method === 'iam' ? (
            <IamPanel onBack={back} finish={finish} />
          ) : method === 'sso' ? (
            <SsoPanel onBack={back} finish={finish} />
          ) : method === 'local' ? (
            <LocalPanel onBack={back} finish={finish} />
          ) : method === 'credentials' ? (
            <CredentialsPanel onBack={back} finish={finish} />
          ) : (
            <CookiePanel onBack={back} finish={finish} />
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
