// Toast 封装：基于 sonner，映射旧 app.js 的 toast(msg, variant, opts) 接口。
// variant: primary | warning | error | success；opts 支持 duration 与 action（点击动作）。
import { toast as sonnerToast } from 'sonner'

export type ToastVariant = 'primary' | 'warning' | 'error' | 'success'

export interface ToastOpts {
  duration?: number
  action?: { label: string; onClick: () => void }
}

export function notify(msg: string, variant: ToastVariant = 'primary', opts: ToastOpts = {}) {
  const options = {
    duration: opts.duration,
    action: opts.action,
  }
  switch (variant) {
    case 'success':
      return sonnerToast.success(msg, options)
    case 'warning':
      return sonnerToast.warning(msg, options)
    case 'error':
      return sonnerToast.error(msg, options)
    default:
      return sonnerToast.info(msg, options)
  }
}

/** 持久 loading 提示，返回 id；用 dismissToast(id) 关闭 */
export function toastLoading(msg: string): string | number {
  return sonnerToast.loading(msg)
}

export function dismissToast(id: string | number) {
  sonnerToast.dismiss(id)
}

export const toastPrimary = (msg: string, opts?: ToastOpts) => notify(msg, 'primary', opts)
export const toastWarning = (msg: string, opts?: ToastOpts) => notify(msg, 'warning', opts)
export const toastError = (msg: string, opts?: ToastOpts) => notify(msg, 'error', opts)
export const toastSuccess = (msg: string, opts?: ToastOpts) => notify(msg, 'success', opts)
