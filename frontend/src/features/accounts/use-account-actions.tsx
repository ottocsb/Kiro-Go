// 账号操作集中 hook：单账号 + 批量。统一处理确认、toast、刷新。
import { useT } from '@/i18n/i18n'
import { useConfirm } from '@/components/app/confirm-dialog'
import { useAppData } from '@/hooks/use-app-data'
import { apiDelete, apiFetch, apiGet, apiPost, apiPut } from '@/lib/api'
import {
  dismissToast,
  notify,
  toastError,
  toastLoading,
  toastPrimary,
  toastSuccess,
} from '@/lib/toast'
import { copyText } from '@/lib/clipboard'
import type { AccountFull, OverageInfo } from '@/lib/types'

export function useAccountActions() {
  const t = useT()
  const confirm = useConfirm()
  const { reloadAccounts, reloadStatus } = useAppData()

  async function refresh(id: string) {
    try {
      const d = await apiPost<{ success: boolean; error?: string }>(`/accounts/${id}/refresh`)
      if (d.success) await reloadAccounts()
      else toastError(t('accounts.refreshFailed') + ': ' + (d.error || ''))
    } catch {
      toastError(t('accounts.refreshFailed'))
    }
  }

  async function toggle(id: string, enabled: boolean) {
    try {
      await apiPut(`/accounts/${id}`, { enabled })
      await reloadAccounts()
    } catch {
      /* 与旧版一致：无 toast */
    }
  }

  async function remove(id: string) {
    const ok = await confirm(t('accounts.confirmDelete'), {
      title: t('accounts.delete'),
      confirmText: t('accounts.delete'),
      variant: 'danger',
    })
    if (!ok) return
    try {
      await apiDelete(`/accounts/${id}`)
      toastSuccess(t('accounts.deleteSuccess'))
      await Promise.all([reloadAccounts(), reloadStatus()])
    } catch (e) {
      toastError((e as Error).message || t('common.failed'))
    }
  }

  /** 复制账号凭证 JSON（仅 clientId/clientSecret/accessToken/refreshToken）。成功返回 true */
  async function copyJSON(id: string): Promise<boolean> {
    const p = (async () => {
      const full = await apiGet<AccountFull>(`/accounts/${id}/full`)
      return JSON.stringify(
        {
          clientId: full.clientId,
          clientSecret: full.clientSecret,
          accessToken: full.accessToken,
          refreshToken: full.refreshToken,
        },
        null,
        2,
      )
    })()
    try {
      await copyText(p)
      toastPrimary(t('accounts.copyJSONSuccess'))
      return true
    } catch {
      toastError(t('common.failed'))
      return false
    }
  }

  async function refreshModelsCache(id: string) {
    const tid = toastLoading(t('detail.refreshModelCache') + '…')
    try {
      const d = await apiPost<{ success: boolean; count?: number; error?: string }>(
        `/accounts/${id}/models/refresh`,
      )
      dismissToast(tid)
      if (d.success) toastSuccess(t('detail.refreshModelCache') + ' · ' + (d.count || 0))
      else toastError(t('common.failed') + (d.error ? ': ' + d.error : ''))
    } catch {
      dismissToast(tid)
      toastError(t('common.failed'))
    }
  }

  /** 通用保存（机器码/权重/代理）。成功返回 true */
  async function putAccount(id: string, body: Record<string, unknown>, successMsg: string): Promise<boolean> {
    try {
      const d = await apiPut<{ success: boolean; error?: string }>(`/accounts/${id}`, body)
      if (d.success) {
        toastSuccess(successMsg)
        await reloadAccounts()
        return true
      }
      toastError(t('detail.saveFailed') + (d.error ? ': ' + d.error : ''))
      return false
    } catch {
      toastError(t('detail.saveFailed'))
      return false
    }
  }

  async function generateMachineId(): Promise<string | null> {
    try {
      const d = await apiGet<{ machineId: string }>('/generate-machine-id')
      return d.machineId || null
    } catch {
      toastError(t('detail.generateFailed'))
      return null
    }
  }

  /** 切换 overage，成功返回最新 OverageInfo（失败抛出，调用方回滚 UI） */
  async function toggleOverage(id: string, enabled: boolean): Promise<OverageInfo> {
    const res = await apiFetch(`/accounts/${encodeURIComponent(id)}/overage`, {
      method: 'POST',
      body: { enabled },
    })
    const d = (await res.json().catch(() => ({}))) as OverageInfo & { success?: boolean; error?: string }
    if (!res.ok || d.success === false) {
      throw new Error(d.error || t('accounts.overageSwitchFailed'))
    }
    await reloadAccounts()
    return d
  }

  async function refreshOverage(id: string): Promise<OverageInfo> {
    const res = await apiFetch(`/accounts/${encodeURIComponent(id)}/overage`)
    const d = (await res.json().catch(() => ({}))) as OverageInfo & { success?: boolean; error?: string }
    if (!res.ok || d.success === false) {
      throw new Error(d.error || t('accounts.overageSwitchFailed'))
    }
    await reloadAccounts()
    return d
  }

  // ===== 批量操作（返回 true 表示已执行，false 表示取消）=====

  async function batchAction(action: 'enable' | 'disable' | 'refresh', ids: string[]): Promise<boolean> {
    if (!ids.length) return false
    const cap = action.charAt(0).toUpperCase() + action.slice(1)
    const ok = await confirm(t('batch.confirm' + cap, ids.length), {
      title: t('common.confirm'),
      confirmText: t('common.confirm'),
      variant: action === 'disable' ? 'danger' : 'default',
    })
    if (!ok) return false
    const tid = toastLoading(t('batch.processing'))
    try {
      const d = await apiPost<{ success: boolean; count?: number; refreshed?: number; failed?: number; error?: string }>(
        '/accounts/batch',
        { ids, action },
      )
      dismissToast(tid)
      if (action === 'refresh') {
        notify(
          t('batch.refreshResult', d.refreshed || 0, d.failed || 0),
          d.failed ? 'warning' : 'success',
        )
      } else if (action === 'enable') {
        toastSuccess(t('batch.enableResult', d.count ?? ids.length))
      } else {
        toastSuccess(t('batch.disableResult', d.count ?? ids.length))
      }
      await Promise.all([reloadAccounts(), reloadStatus()])
      return true
    } catch (e) {
      dismissToast(tid)
      toastError((e as Error).message || t('common.failed'))
      return false
    }
  }

  async function batchRefreshModels(ids: string[]): Promise<boolean> {
    if (!ids.length) return false
    const ok = await confirm(t('batch.confirmRefreshModels', ids.length), {
      title: t('models.refreshAll'),
      confirmText: t('common.confirm'),
    })
    if (!ok) return false
    const tid = toastLoading(t('detail.refreshModelCache') + '…')
    let okc = 0
    let fail = 0
    for (const id of ids) {
      try {
        const res = await apiFetch(`/accounts/${id}/models/refresh`, { method: 'POST' })
        const d = (await res.json().catch(() => ({}))) as { success?: boolean }
        if (res.ok && d.success) okc++
        else fail++
      } catch {
        fail++
      }
    }
    dismissToast(tid)
    notify(t('batch.refreshModelsResult', okc, fail), fail ? 'warning' : 'success')
    await reloadAccounts()
    return true
  }

  async function batchDelete(ids: string[]): Promise<boolean> {
    if (!ids.length) return false
    const ok = await confirm(t('batch.confirmDelete', ids.length), {
      title: t('accounts.delete'),
      confirmText: t('accounts.delete'),
      variant: 'danger',
    })
    if (!ok) return false
    const tid = toastLoading(t('batch.deleting'))
    let okc = 0
    let fail = 0
    for (const id of ids) {
      try {
        const res = await apiFetch(`/accounts/${id}`, { method: 'DELETE' })
        const d = (await res.json().catch(() => ({}))) as { success?: boolean }
        if (res.ok && d.success !== false) okc++
        else fail++
      } catch {
        fail++
      }
    }
    dismissToast(tid)
    notify(t('batch.deleteResult', okc, fail), fail ? 'warning' : 'success')
    await Promise.all([reloadAccounts(), reloadStatus()])
    return true
  }

  async function refreshAllModels(): Promise<void> {
    const ok = await confirm(t('models.confirmRefreshAll'), {
      title: t('models.refreshAll'),
      confirmText: t('models.refreshAll'),
    })
    if (!ok) return
    const tid = toastLoading(t('detail.refreshModelCache') + '…')
    try {
      const d = await apiPost<{ refreshed?: number }>('/accounts/models/refresh')
      dismissToast(tid)
      toastSuccess(t('models.refreshAllDone', d.refreshed || 0))
    } catch {
      dismissToast(tid)
      toastError(t('common.failed'))
    }
  }

  return {
    refresh,
    toggle,
    remove,
    copyJSON,
    refreshModelsCache,
    putAccount,
    generateMachineId,
    toggleOverage,
    refreshOverage,
    batchAction,
    batchRefreshModels,
    batchDelete,
    refreshAllModels,
  }
}
