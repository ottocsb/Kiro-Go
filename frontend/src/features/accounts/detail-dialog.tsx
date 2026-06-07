// 账号详情弹窗：基本信息 / 机器码 / 权重 / overage / 代理 / 订阅 / 统计 / 模型 8 段。
import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useT } from '@/i18n/i18n'
import { usePrivacy } from '@/hooks/use-privacy'
import { useAppData } from '@/hooks/use-app-data'
import { apiGet } from '@/lib/api'
import { toastError, toastWarning } from '@/lib/toast'
import {
  formatAuthMethod,
  formatNum,
  formatSubscriptionLabel,
  getDisplayEmail,
} from '@/lib/format'
import type { ModelInfo } from '@/lib/types'
import { useAccountActions } from './use-account-actions'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const HEX32_RE = /^[0-9a-f]{32}$/i
const PROXY_RE = /^(socks5|socks5h|http|https):\/\//

function DRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-2.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 break-all text-sm">{value}</div>
    </div>
  )
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{title}</h4>
        {action}
      </div>
      {children}
    </section>
  )
}

export function DetailDialog({ accountId, onClose }: { accountId: string | null; onClose: () => void }) {
  const t = useT()
  const { enabled: privacy } = usePrivacy()
  const { accounts } = useAppData()
  const actions = useAccountActions()
  const a = accountId ? accounts.find((x) => x.id === accountId) ?? null : null

  const [machineId, setMachineId] = useState('')
  const [weight, setWeight] = useState('0')
  const [proxyURL, setProxyURL] = useState('')
  const [overageBusy, setOverageBusy] = useState(false)
  const [models, setModels] = useState<ModelInfo[] | null>(null)
  const [modelsState, setModelsState] = useState<'idle' | 'loading' | 'error'>('idle')

  // 打开/切换账号时同步表单初值
  useEffect(() => {
    if (a) {
      setMachineId(a.machineId || '')
      setWeight(String(a.weight || 0))
      setProxyURL(a.proxyURL || '')
      setModels(null)
      setModelsState('idle')
    }
  }, [accountId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!a) {
    return (
      <Dialog open={false} onOpenChange={(o) => !o && onClose()}>
        <DialogContent />
      </Dialog>
    )
  }

  const overage = (a.overageStatus || '').toUpperCase()
  const capable = !a.overageCapability || a.overageCapability === 'OVERAGE_CAPABLE'
  const overageLabel =
    overage === 'ENABLED'
      ? t('detail.overageEnabled')
      : overage === 'DISABLED'
        ? t('detail.overageDisabled')
        : t('detail.overageUnknown')
  const checkedAt = a.overageCheckedAt ? new Date(a.overageCheckedAt * 1000).toLocaleString() : '-'

  async function saveMachineId() {
    const m = machineId.trim()
    if (m && !UUID_RE.test(m) && !HEX32_RE.test(m)) {
      toastWarning(t('detail.machineIdError'))
      return
    }
    await actions.putAccount(a!.id, { machineId: m }, t('detail.saved'))
  }

  async function saveWeight() {
    await actions.putAccount(a!.id, { weight: parseInt(weight, 10) || 0 }, t('detail.saved'))
  }

  async function saveProxy() {
    const url = proxyURL.trim()
    if (url && !PROXY_RE.test(url)) {
      toastWarning(t('detail.proxyFormatError'))
      return
    }
    await actions.putAccount(a!.id, { proxyURL: url }, t('detail.proxySaved'))
  }

  async function handleGenerate() {
    const id = await actions.generateMachineId()
    if (id) setMachineId(id)
  }

  async function handleToggleOverage(desired: boolean) {
    setOverageBusy(true)
    try {
      await actions.toggleOverage(a!.id, desired)
    } catch (e) {
      toastWarning(t('accounts.overageSwitchFailed') + ': ' + ((e as Error).message || e))
    } finally {
      setOverageBusy(false)
    }
  }

  async function handleRefreshOverage() {
    try {
      await actions.refreshOverage(a!.id)
    } catch (e) {
      toastWarning(t('accounts.overageSwitchFailed') + ': ' + ((e as Error).message || e))
    }
  }

  async function loadModels() {
    setModelsState('loading')
    try {
      const d = await apiGet<{ success: boolean; models?: ModelInfo[]; error?: string }>(
        `/accounts/${a!.id}/models`,
      )
      if (d.success && d.models) {
        const sorted = [...d.models].sort((m1, m2) => {
          if (m1.modelId === 'auto') return -1
          if (m2.modelId === 'auto') return 1
          return (m1.rateMultiplier || 1) - (m2.rateMultiplier || 1)
        })
        setModels(sorted)
        setModelsState('idle')
      } else {
        setModelsState('error')
        toastError(t('detail.loadFailed') + (d.error ? ': ' + d.error : ''))
      }
    } catch {
      setModelsState('error')
      toastError(t('detail.loadFailed'))
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('detail.title')}</DialogTitle>
          <DialogDescription className="sr-only">{a.email || a.id}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-3">
          <div className="space-y-5">
            {/* 1. 基本信息 */}
            <Section title={t('detail.basicInfo')}>
              <div className="grid grid-cols-2 gap-2">
                <DRow label={t('detail.email')} value={getDisplayEmail(a.email, '', privacy)} />
                <DRow label={t('detail.userId')} value={a.userId || '-'} />
                <DRow label={t('detail.authMethod')} value={formatAuthMethod(t, a.provider || a.authMethod)} />
                <DRow label={t('detail.region')} value={a.region || 'us-east-1'} />
              </div>
            </Section>

            <Separator />

            {/* 2. 机器码 */}
            <Section title={t('detail.machineId')}>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  className="min-w-48 flex-1"
                  value={machineId}
                  placeholder="UUID"
                  onChange={(e) => setMachineId(e.target.value)}
                />
                <Button type="button" variant="outline" onClick={handleGenerate}>
                  {t('detail.generate')}
                </Button>
                <Button type="button" onClick={saveMachineId}>
                  {t('detail.save')}
                </Button>
              </div>
            </Section>

            {/* 3. 权重 */}
            <Section title={t('detail.weight')}>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={10}
                  className="w-28"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
                <Button type="button" onClick={saveWeight}>
                  {t('detail.save')}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{t('detail.weightHint')}</p>
            </Section>

            {/* 4. Overage */}
            <Section
              title={t('detail.overage')}
              action={
                <Button type="button" variant="outline" size="sm" onClick={handleRefreshOverage}>
                  {t('detail.overageRefresh')}
                </Button>
              }
            >
              <p className="text-xs text-muted-foreground">{t('detail.overageHint')}</p>
              <div className="flex items-center gap-3 rounded-md border p-3">
                <Switch
                  checked={overage === 'ENABLED'}
                  disabled={!capable || overageBusy}
                  onCheckedChange={(v) => handleToggleOverage(v)}
                />
                <span className="text-sm">{overageBusy ? t('detail.overageSwitching') : overageLabel}</span>
              </div>
              {!capable ? (
                <p className="text-xs text-[#ef4444]">{t('detail.overageNotCapable')}</p>
              ) : null}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <DRow label={t('detail.overageStatus')} value={a.overageStatus || '-'} />
                <DRow label={t('detail.overageCap')} value={a.overageCap ? '$' + a.overageCap.toFixed(2) : '-'} />
                <DRow label={t('detail.overageRate')} value={a.overageRate ? '$' + a.overageRate.toFixed(4) : '-'} />
                <DRow
                  label={t('detail.overageCurrent')}
                  value={a.currentOverages ? '$' + a.currentOverages.toFixed(4) : '$0'}
                />
                <DRow label={t('detail.overageCheckedAt')} value={checkedAt} />
              </div>
            </Section>

            {/* 5. 独立代理 */}
            <Section title={t('detail.proxyURL')}>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  className="min-w-48 flex-1"
                  value={proxyURL}
                  placeholder="socks5://host:port"
                  onChange={(e) => setProxyURL(e.target.value)}
                />
                <Button type="button" onClick={saveProxy}>
                  {t('detail.save')}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{t('detail.proxyHint')}</p>
            </Section>

            <Separator />

            {/* 6. 订阅信息 */}
            <Section title={t('detail.subscription')}>
              <div className="grid grid-cols-2 gap-2">
                <DRow
                  label={t('detail.subscriptionType')}
                  value={
                    a.subscriptionTitle ||
                    (a.subscriptionType ? formatSubscriptionLabel(t, a.subscriptionType) : '-')
                  }
                />
                <DRow
                  label={t('detail.tokenExpiry')}
                  value={a.expiresAt ? new Date(a.expiresAt * 1000).toLocaleString() : '-'}
                />
                <DRow
                  label={t('detail.mainQuota')}
                  value={`${(a.usageCurrent || 0).toFixed(1)} / ${(a.usageLimit || 0).toFixed(0)}`}
                />
                <DRow label={t('detail.resetDate')} value={a.nextResetDate || '-'} />
                {a.trialUsageLimit > 0 ? (
                  <>
                    <DRow
                      label={t('detail.trialQuota')}
                      value={`${(a.trialUsageCurrent || 0).toFixed(1)} / ${(a.trialUsageLimit || 0).toFixed(0)}`}
                    />
                    <DRow label={t('detail.trialStatus')} value={a.trialStatus || '-'} />
                    <DRow
                      label={t('detail.trialExpiry')}
                      value={a.trialExpiresAt ? new Date(a.trialExpiresAt * 1000).toLocaleString() : '-'}
                    />
                  </>
                ) : null}
              </div>
            </Section>

            {/* 7. 统计 */}
            <Section title={t('detail.statistics')}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <DRow label={t('detail.requestCount')} value={String(a.requestCount || 0)} />
                <DRow label={t('detail.errorCount')} value={String(a.errorCount || 0)} />
                <DRow label={t('detail.totalTokens')} value={formatNum(a.totalTokens || 0)} />
                <DRow label={t('detail.totalCredits')} value={(a.totalCredits || 0).toFixed(2)} />
              </div>
            </Section>

            <Separator />

            {/* 8. 可用模型 */}
            <Section
              title={t('detail.models')}
              action={
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={loadModels}>
                    {t('detail.loadModels')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => actions.refreshModelsCache(a.id)}
                  >
                    {t('detail.refreshModelCache')}
                  </Button>
                </div>
              }
            >
              {modelsState === 'loading' ? (
                <div className="py-3 text-center text-sm text-muted-foreground">{t('detail.loading')}</div>
              ) : modelsState === 'error' ? (
                <div className="py-3 text-center text-sm text-destructive">{t('detail.loadFailed')}</div>
              ) : models && models.length > 0 ? (
                <div className="space-y-1.5">
                  {models.map((m) => (
                    <div key={m.modelId} className="rounded-md border p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm">{m.modelId}</span>
                        <span className="text-xs text-muted-foreground">
                          {t('detail.creditMultiplier', m.rateMultiplier || 1)}
                        </span>
                      </div>
                      {m.description ? (
                        <div className="mt-0.5 text-xs text-muted-foreground">{m.description}</div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : models && models.length === 0 ? (
                <div className="py-3 text-center text-sm text-muted-foreground">{t('detail.noModels')}</div>
              ) : null}
            </Section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
