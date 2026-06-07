// 全局确认对话框：useConfirm() 返回 confirm(message, opts) => Promise<boolean>。
// 复刻 app.js 的 confirmAction（含 danger 变体）。
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useT } from '@/i18n/i18n'

export interface ConfirmOpts {
  title?: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'danger'
}

type ConfirmFn = (message: string, opts?: ConfirmOpts) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

interface ConfirmState {
  message: string
  opts: ConfirmOpts
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const t = useT()
  const [state, setState] = useState<ConfirmState | null>(null)
  const resolverRef = useRef<((v: boolean) => void) | null>(null)

  const confirm = useCallback<ConfirmFn>((message, opts = {}) => {
    // 若已有挂起的确认，先以 false 结束它
    if (resolverRef.current) {
      resolverRef.current(false)
      resolverRef.current = null
    }
    setState({ message, opts })
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  const settle = useCallback((value: boolean) => {
    if (resolverRef.current) {
      resolverRef.current(value)
      resolverRef.current = null
    }
    setState(null)
  }, [])

  const open = state !== null
  const opts = state?.opts ?? {}

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog open={open} onOpenChange={(o) => { if (!o) settle(false) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{opts.title ?? t('common.confirm')}</AlertDialogTitle>
            <AlertDialogDescription>{state?.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => settle(false)}>
              {opts.cancelText ?? t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className={cn(opts.variant === 'danger' && buttonVariants({ variant: 'destructive' }))}
              onClick={() => settle(true)}
            >
              {opts.confirmText ?? t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx
}
