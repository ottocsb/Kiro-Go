// API keys 数据与操作 hook：加载、增删改、启用切换、重置用量。
import { useCallback, useEffect, useState } from 'react'
import { useT } from '@/i18n/i18n'
import { useConfirm } from '@/components/app/confirm-dialog'
import { apiFetch, apiGet } from '@/lib/api'
import { toastError, toastSuccess } from '@/lib/toast'
import type { ApiKeyView } from '@/lib/types'

export interface ApiKeyPayload {
  name: string
  enabled: boolean
  tokenLimit: number
  creditLimit: number
  key?: string
}

export function useApiKeys() {
  const t = useT()
  const confirm = useConfirm()
  const [keys, setKeys] = useState<ApiKeyView[]>([])
  const [loadFailed, setLoadFailed] = useState(false)

  const reload = useCallback(async () => {
    try {
      const d = await apiGet<{ apiKeys: ApiKeyView[] }>('/api-keys')
      setKeys(Array.isArray(d.apiKeys) ? d.apiKeys : [])
      setLoadFailed(false)
    } catch {
      setKeys([])
      setLoadFailed(true)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  /** 创建 Key，成功返回明文 key（仅此一次） */
  async function createKey(payload: ApiKeyPayload): Promise<string | null> {
    try {
      const res = await apiFetch('/api-keys', { method: 'POST', body: payload })
      const d = (await res.json().catch(() => ({}))) as { success?: boolean; key?: string; error?: string }
      if (!res.ok || d.success === false) throw new Error(d.error || t('common.saveFailed'))
      toastSuccess(t('apiKeys.created'))
      await reload()
      return d.key || null
    } catch (e) {
      toastError((e as Error).message || t('common.saveFailed'))
      return null
    }
  }

  async function updateKey(id: string, payload: Omit<ApiKeyPayload, 'key'>): Promise<boolean> {
    try {
      const res = await apiFetch(`/api-keys/${encodeURIComponent(id)}`, { method: 'PUT', body: payload })
      const d = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string }
      if (!res.ok || d.success === false) throw new Error(d.error || t('common.saveFailed'))
      toastSuccess(t('apiKeys.updated'))
      await reload()
      return true
    } catch (e) {
      toastError((e as Error).message || t('common.saveFailed'))
      return false
    }
  }

  async function toggle(id: string, enabled: boolean) {
    // 乐观更新
    setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, enabled } : k)))
    try {
      const res = await apiFetch(`/api-keys/${encodeURIComponent(id)}`, { method: 'PUT', body: { enabled } })
      const d = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string }
      if (!res.ok || d.success === false) throw new Error(d.error || t('common.saveFailed'))
    } catch (e) {
      toastError((e as Error).message || t('common.saveFailed'))
      await reload()
    }
  }

  async function remove(id: string, name?: string) {
    const ok = await confirm(t('apiKeys.confirmDelete', name || t('apiKeys.unnamed')), {
      title: t('apiKeys.actionDelete'),
      confirmText: t('apiKeys.actionDelete'),
      variant: 'danger',
    })
    if (!ok) return
    try {
      const res = await apiFetch(`/api-keys/${encodeURIComponent(id)}`, { method: 'DELETE' })
      const d = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string }
      if (!res.ok || d.success === false) throw new Error(d.error || t('common.failed'))
      toastSuccess(t('apiKeys.deleteSuccess'))
      await reload()
    } catch (e) {
      toastError((e as Error).message || t('common.failed'))
    }
  }

  async function resetUsage(id: string, name?: string) {
    const ok = await confirm(t('apiKeys.confirmReset', name || t('apiKeys.unnamed')), {
      title: t('apiKeys.actionReset'),
      confirmText: t('apiKeys.actionReset'),
    })
    if (!ok) return
    try {
      const res = await apiFetch(`/api-keys/${encodeURIComponent(id)}/reset-usage`, { method: 'POST' })
      const d = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string }
      if (!res.ok || d.success === false) throw new Error(d.error || t('common.failed'))
      toastSuccess(t('apiKeys.usageReset'))
      await reload()
    } catch (e) {
      toastError((e as Error).message || t('common.failed'))
    }
  }

  return { keys, loadFailed, reload, createKey, updateKey, toggle, remove, resetUsage }
}

export type ApiKeysApi = ReturnType<typeof useApiKeys>
