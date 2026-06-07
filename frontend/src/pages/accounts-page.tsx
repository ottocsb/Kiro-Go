// Accounts 首页：工具栏（隐私/导出/刷新模型/添加）+ 筛选 + 选择 + 批量 + 卡片列表 + 弹窗。
import { useMemo, useState } from 'react'
import { FileDown, Plus, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useT } from '@/i18n/i18n'
import { usePrivacy } from '@/hooks/use-privacy'
import { useAppData } from '@/hooks/use-app-data'
import { toastWarning } from '@/lib/toast'
import type { Account } from '@/lib/types'
import { AccountCard } from '@/features/accounts/account-card'
import { useAccountActions } from '@/features/accounts/use-account-actions'
import { DetailDialog } from '@/features/accounts/detail-dialog'
import { TestDialog } from '@/features/accounts/test-dialog'
import { AddAccountDialog } from '@/features/accounts/add-account-dialog'
import { ExportDialog } from '@/features/accounts/export-dialog'

function filterAccounts(accounts: Account[], keyword: string, status: string): Account[] {
  const kw = keyword.toLowerCase()
  return accounts.filter((a) => {
    if (status === 'enabled' && !a.enabled) return false
    if (status === 'disabled' && (a.enabled || (a.banStatus && a.banStatus !== 'ACTIVE'))) return false
    if (status === 'banned' && (!a.banStatus || a.banStatus === 'ACTIVE')) return false
    if (kw && !(a.email || '').toLowerCase().includes(kw)) return false
    return true
  })
}

export function AccountsPage() {
  const t = useT()
  const { enabled: privacy, setEnabled: setPrivacy } = usePrivacy()
  const { accounts } = useAppData()
  const actions = useAccountActions()

  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [detailId, setDetailId] = useState<string | null>(null)
  const [testId, setTestId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)

  const filtered = useMemo(() => filterAccounts(accounts, keyword, status), [accounts, keyword, status])

  const selectedFiltered = filtered.filter((a) => selected.has(a.id)).length
  const allChecked = filtered.length > 0 && selectedFiltered === filtered.length
  const someChecked = selectedFiltered > 0 && selectedFiltered < filtered.length
  const selectAllValue: boolean | 'indeterminate' = allChecked ? true : someChecked ? 'indeterminate' : false

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll(checked: boolean) {
    setSelected(checked ? new Set(filtered.map((a) => a.id)) : new Set())
  }

  function clearSelection() {
    setSelected(new Set())
  }

  async function runBatch(fn: Promise<boolean>) {
    const ok = await fn
    if (ok) clearSelection()
  }

  function handleExport() {
    if (accounts.length === 0) {
      toastWarning(t('accounts.empty'))
      return
    }
    setExportOpen(true)
  }

  const ids = [...selected]

  return (
    <>
      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <CardTitle>{t('accounts.title')}</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm" title={t('privacy.tooltip')}>
              <Switch checked={privacy} onCheckedChange={setPrivacy} />
              <span className="hidden sm:inline">{t('privacy.label')}</span>
            </label>
            <Button type="button" variant="outline" size="sm" onClick={handleExport}>
              <FileDown className="size-4" />
              {t('accounts.export')}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => void actions.refreshAllModels()}>
              <RefreshCw className="size-4" />
              {t('models.refreshAll')}
            </Button>
            <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="size-4" />
              {t('accounts.add')}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 工具栏 */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={selectAllValue} onCheckedChange={(v) => toggleSelectAll(v === true)} />
              {t('batch.selectAll')}
            </label>

            {selected.size > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-1">
                <span className="px-1 text-sm font-medium">{selected.size}</span>
                <Button size="sm" onClick={() => void runBatch(actions.batchAction('enable', ids))}>
                  {t('batch.enable')}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => void runBatch(actions.batchAction('disable', ids))}>
                  {t('batch.disable')}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => void runBatch(actions.batchAction('refresh', ids))}>
                  {t('batch.refresh')}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => void runBatch(actions.batchRefreshModels(ids))}>
                  {t('batch.refreshModels')}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => void runBatch(actions.batchDelete(ids))}>
                  {t('batch.delete')}
                </Button>
              </div>
            ) : null}

            <div className="ml-auto flex items-center gap-2">
              <Input
                value={keyword}
                placeholder={t('filter.search')}
                className="w-56"
                onChange={(e) => setKeyword(e.target.value)}
              />
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-32" aria-label={t('filter.status')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filter.all')}</SelectItem>
                  <SelectItem value="enabled">{t('filter.enabled')}</SelectItem>
                  <SelectItem value="disabled">{t('filter.disabled')}</SelectItem>
                  <SelectItem value="banned">{t('filter.banned')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 列表 */}
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">{t('accounts.empty')}</div>
          ) : (
            <div className="space-y-3">
              {filtered.map((a) => (
                <AccountCard
                  key={a.id}
                  account={a}
                  selected={selected.has(a.id)}
                  onToggleSelect={toggleSelect}
                  onOpenDetail={setDetailId}
                  onOpenTest={setTestId}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DetailDialog accountId={detailId} onClose={() => setDetailId(null)} />
      <TestDialog accountId={testId} onClose={() => setTestId(null)} />
      <AddAccountDialog open={addOpen} onClose={() => setAddOpen(false)} />
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />
    </>
  )
}
