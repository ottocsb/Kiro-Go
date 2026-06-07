// 方式1：AWS Builder ID 设备码登录（start → 轮询 poll）。
import { useEffect, useRef, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useT } from '@/i18n/i18n'
import { apiPost } from '@/lib/api'
import { copyText } from '@/lib/clipboard'
import { toastError, toastPrimary } from '@/lib/toast'

interface StartResp {
  sessionId: string
  userCode: string
  verificationUri: string
  interval: number
}
interface PollResp {
  success: boolean
  completed: boolean
  status?: string
  interval?: number
  account?: { id: string; email: string }
  error?: string
}

export function BuilderIdPanel({
  onBack,
  finish,
}: {
  onBack: () => void
  finish: (ids: string | string[]) => void
}) {
  const t = useT()
  const [region, setRegion] = useState('us-east-1')
  const [step, setStep] = useState<1 | 2>(1)
  const [userCode, setUserCode] = useState('')
  const [verifyUrl, setVerifyUrl] = useState('')
  const [status, setStatus] = useState('')
  const timerRef = useRef<number | null>(null)
  const sessionRef = useRef('')

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [])

  function stopTimer() {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  function errorBranch(msg: string) {
    toastError(t('common.failed') + ': ' + (msg || ''))
    stopTimer()
    onBack()
  }

  function schedule(interval: number) {
    timerRef.current = window.setTimeout(async () => {
      try {
        const d = await apiPost<PollResp>('/auth/builderid/poll', { sessionId: sessionRef.current })
        if (d.completed && d.account) {
          stopTimer()
          toastPrimary(t('builderid.success') + ': ' + (d.account.email || d.account.id))
          finish(d.account.id)
        } else if (d.success && !d.completed) {
          setStatus(t('builderid.waiting'))
          schedule(d.interval || interval)
        } else {
          errorBranch(d.error || '')
        }
      } catch (e) {
        errorBranch((e as Error).message)
      }
    }, interval * 1000)
  }

  async function start() {
    try {
      const d = await apiPost<StartResp>('/auth/builderid/start', { region: region || 'us-east-1' })
      if (d.sessionId) {
        sessionRef.current = d.sessionId
        setUserCode(d.userCode)
        setVerifyUrl(d.verificationUri)
        setStatus(t('builderid.waiting'))
        setStep(2)
        schedule(d.interval || 5)
      } else {
        toastError(t('common.failed'))
      }
    } catch (e) {
      toastError(t('common.failed') + ': ' + ((e as Error).message || ''))
    }
  }

  function cancel() {
    stopTimer()
    sessionRef.current = ''
    onBack()
  }

  if (step === 1) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{t('modal.builderIdDesc')}</p>
        <div className="space-y-2">
          <Label htmlFor="builderIdRegion">{t('detail.region')}</Label>
          <Input id="builderIdRegion" value={region} onChange={(e) => setRegion(e.target.value)} />
        </div>
        <div className="flex justify-between">
          <Button type="button" variant="secondary" onClick={onBack}>
            {t('common.back')}
          </Button>
          <Button type="button" onClick={start}>
            {t('builderid.startLogin')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-muted/40 p-4 text-center">
        <div className="font-mono text-2xl font-bold tracking-widest">{userCode}</div>
        <div className="mt-1 text-xs text-muted-foreground">{t('builderid.verifyCode')}</div>
      </div>
      <div className="space-y-1">
        <Label>{t('builderid.verifyUrl')}</Label>
        <div className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate rounded-md border px-2 py-1.5 text-sm">{verifyUrl}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => window.open(verifyUrl, '_blank')}>
            <ExternalLink className="size-4" />
            {t('builderid.open')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void copyText(verifyUrl).then(() => toastPrimary(t('common.copied')))}
          >
            {t('common.copy')}
          </Button>
        </div>
      </div>
      <div className="text-sm text-muted-foreground">{status}</div>
      <div className="flex justify-end">
        <Button type="button" variant="secondary" onClick={cancel}>
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  )
}
