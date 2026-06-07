// 账号测试弹窗：拉取缓存模型 → 选模型 → 单次 POST 测试（客户端计时）+ 日志。
import { useEffect, useRef, useState } from 'react'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useT } from '@/i18n/i18n'
import { usePrivacy } from '@/hooks/use-privacy'
import { useAppData } from '@/hooks/use-app-data'
import { apiFetch, apiGet } from '@/lib/api'
import { formatAuthMethod, getDisplayEmail } from '@/lib/format'

interface LogLine {
  time: string
  msg: string
  type: 'info' | 'ok' | 'err'
}

const DEFAULT_MODEL = 'claude-sonnet-4'

export function TestDialog({ accountId, onClose }: { accountId: string | null; onClose: () => void }) {
  const t = useT()
  const { enabled: privacy } = usePrivacy()
  const { accounts } = useAppData()
  const acc = accountId ? accounts.find((x) => x.id === accountId) ?? null : null

  const [loadingModels, setLoadingModels] = useState(true)
  const [modelError, setModelError] = useState(false)
  const [models, setModels] = useState<string[]>([])
  const [model, setModel] = useState(DEFAULT_MODEL)
  const [running, setRunning] = useState(false)
  const [logs, setLogs] = useState<LogLine[]>([])
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!accountId) return
    setLoadingModels(true)
    setModelError(false)
    setModels([])
    setModel(DEFAULT_MODEL)
    setRunning(false)
    setLogs([])
    apiGet<{ success: boolean; models?: string[] }>(`/accounts/${accountId}/models/cached`)
      .then((d) => {
        const list = Array.isArray(d.models) ? [...d.models].sort() : []
        setModels(list)
        if (list.length > 0) setModel(list[0])
      })
      .catch(() => setModelError(true))
      .finally(() => setLoadingModels(false))
  }, [accountId])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [logs])

  if (!acc) {
    return (
      <Dialog open={false} onOpenChange={(o) => !o && onClose()}>
        <DialogContent />
      </Dialog>
    )
  }

  const email = getDisplayEmail(acc.email, acc.id, privacy)
  const proxy = acc.proxyURL || t('accounts.testLog.globalProxy')
  const statusText = loadingModels
    ? t('accounts.testModelsLoading')
    : modelError
      ? t('accounts.testModelsFallback')
      : t('accounts.testModelsReady', models.length)

  function addLog(msg: string, type: LogLine['type']) {
    setLogs((prev) => {
      const next = [...prev, { time: new Date().toLocaleTimeString(), msg, type }]
      return next.length > 100 ? next.slice(next.length - 100) : next
    })
  }

  async function run() {
    if (running) return
    setRunning(true)
    addLog(t('accounts.testLog.start', email, model, proxy), 'info')
    const startTime = Date.now()
    try {
      const res = await apiFetch(`/accounts/${acc!.id}/test`, { method: 'POST', body: { model } })
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      const d = (await res.json().catch(() => ({}))) as { success?: boolean; reply?: string; error?: string }
      if (d.success) {
        addLog(t('accounts.testLog.success', email, elapsed, d.reply || ''), 'ok')
      } else {
        addLog(t('accounts.testLog.failed', email, elapsed, d.error || t('common.unknownError')), 'err')
      }
    } catch (e) {
      addLog(t('accounts.testLog.error', email, (e as Error).message), 'err')
    } finally {
      setRunning(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('accounts.testModalTitle')}</DialogTitle>
          <DialogDescription className="sr-only">{email}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border p-3">
            <div className="font-medium">{email}</div>
            <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
              <span>{formatAuthMethod(t, acc.provider || acc.authMethod)}</span>
              <span>{proxy}</span>
              <span>{statusText}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="testModelChoice">{t('accounts.selectModel')}</Label>
            {loadingModels ? (
              <div className="text-sm text-muted-foreground">{t('accounts.testModelsLoading')}</div>
            ) : models.length > 0 ? (
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger id="testModelChoice" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="testModelChoice"
                value={model}
                placeholder={DEFAULT_MODEL}
                onChange={(e) => setModel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !running) {
                    e.preventDefault()
                    void run()
                  }
                }}
              />
            )}
          </div>

          <div className="rounded-md border">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <span className="text-sm font-medium">{t('accounts.testLog.title')}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => setLogs([])}>
                {t('accounts.testLog.clear')}
              </Button>
            </div>
            <div ref={logRef} className="max-h-56 overflow-auto p-3 font-mono text-xs">
              {logs.length === 0 ? (
                <div className="text-muted-foreground">{t('accounts.testLog.empty')}</div>
              ) : (
                logs.map((l, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex gap-2 py-0.5',
                      l.type === 'ok' && 'text-emerald-600',
                      l.type === 'err' && 'text-destructive',
                    )}
                  >
                    <span className="shrink-0 text-muted-foreground">{l.time}</span>
                    <span className="break-all">{l.msg}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('common.close')}
          </Button>
          <Button type="button" disabled={loadingModels || running} aria-busy={running} onClick={run}>
            {t('accounts.test')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
