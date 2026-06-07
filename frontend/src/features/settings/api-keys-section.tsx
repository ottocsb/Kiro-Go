// API keys 子区：列表（用量 + 启用/编辑/重置/删除）+ 添加按钮 + 创建/编辑/展示弹窗。
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { UsageBar } from '@/components/app/usage-bar'
import { useT } from '@/i18n/i18n'
import { formatNumber } from '@/lib/format'
import type { ApiKeyView } from '@/lib/types'
import type { ApiKeysApi } from './use-api-keys'
import { ApiKeyModal } from './api-key-modal'
import { ApiKeyShowModal } from './api-key-show-modal'

function UsageLine({ label, used, limit }: { label: string; used: number; limit: number }) {
  const t = useT()
  if (!limit || limit <= 0) {
    return (
      <div className="text-xs text-muted-foreground">
        {label}: {formatNumber(used)} / {t('apiKeys.unlimited')}
      </div>
    )
  }
  return (
    <div>
      <div className="text-xs text-muted-foreground">
        {label}: {formatNumber(used)} / {formatNumber(limit)}
      </div>
      <UsageBar kind="apikey" percent={(used / limit) * 100} />
    </div>
  )
}

function ApiKeyRow({
  item,
  api,
  onEdit,
}: {
  item: ApiKeyView
  api: ApiKeysApi
  onEdit: (entry: ApiKeyView) => void
}) {
  const t = useT()
  return (
    <div className="rounded-lg border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">
            {item.name || <span className="text-muted-foreground">{t('apiKeys.unnamed')}</span>}
          </span>
          {item.migrated ? (
            <span className="rounded bg-[#3b82f6]/15 px-1.5 py-0.5 text-xs text-[#3b82f6]">
              {t('apiKeys.migrated')}
            </span>
          ) : null}
          {!item.enabled ? (
            <span className="rounded bg-[#ef4444]/15 px-1.5 py-0.5 text-xs text-[#ef4444]">
              {t('apiKeys.disabled')}
            </span>
          ) : null}
          <span className="font-mono text-xs text-muted-foreground">{item.keyMasked || ''}</span>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={item.enabled}
            title={item.enabled ? t('accounts.disable') : t('accounts.enable')}
            onCheckedChange={(v) => api.toggle(item.id, v)}
          />
          <Button type="button" variant="outline" size="sm" onClick={() => onEdit(item)}>
            {t('apiKeys.actionEdit')}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => api.resetUsage(item.id, item.name)}>
            {t('apiKeys.actionReset')}
          </Button>
          <Button type="button" variant="destructive" size="sm" onClick={() => api.remove(item.id, item.name)}>
            {t('apiKeys.actionDelete')}
          </Button>
        </div>
      </div>
      <div className="mt-2 grid gap-1.5">
        <UsageLine label={t('apiKeys.tokens')} used={item.tokensUsed || 0} limit={item.tokenLimit || 0} />
        <UsageLine label={t('apiKeys.credits')} used={item.creditsUsed || 0} limit={item.creditLimit || 0} />
        <div className="text-xs text-muted-foreground">
          {t('apiKeys.requests')}: {formatNumber(item.requestsCount || 0)}
        </div>
      </div>
    </div>
  )
}

export function ApiKeysSection({ api }: { api: ApiKeysApi }) {
  const t = useT()
  const [modalOpen, setModalOpen] = useState(false)
  const [editEntry, setEditEntry] = useState<ApiKeyView | null>(null)
  const [showKey, setShowKey] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">{t('apiKeys.listTitle')}</div>
          <div className="text-xs text-muted-foreground">{t('apiKeys.listHint')}</div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setEditEntry(null)
            setModalOpen(true)
          }}
        >
          <Plus className="size-4" />
          {t('apiKeys.add')}
        </Button>
      </div>

      {api.loadFailed ? (
        <div className="py-2 text-sm text-muted-foreground">{t('apiKeys.loadFailed')}</div>
      ) : api.keys.length === 0 ? (
        <div className="py-2 text-sm text-muted-foreground">{t('apiKeys.empty')}</div>
      ) : (
        <div className="space-y-2">
          {api.keys.map((k) => (
            <ApiKeyRow
              key={k.id}
              item={k}
              api={api}
              onEdit={(entry) => {
                setEditEntry(entry)
                setModalOpen(true)
              }}
            />
          ))}
        </div>
      )}

      <ApiKeyModal
        open={modalOpen}
        entry={editEntry}
        api={api}
        onClose={() => setModalOpen(false)}
        onShowKey={(k) => setShowKey(k)}
      />
      <ApiKeyShowModal value={showKey} onClose={() => setShowKey(null)} />
    </div>
  )
}
