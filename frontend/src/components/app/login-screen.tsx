// 登录页：密码输入 + 显示/隐藏 + 记住密码，校验 /status 通过后回调。
import { useState, type FormEvent } from 'react'
import { ArrowRightToLine, Eye, EyeOff, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useT } from '@/i18n/i18n'
import { LangSwitch } from './lang-switch'
import { ThemeToggle } from './theme-toggle'
import { apiFetch } from '@/lib/api'
import { getRememberedLogin, setActivePassword, setMemoryPassword } from '@/lib/auth'
import { toastError } from '@/lib/toast'

export function LoginScreen({ onLoggedIn }: { onLoggedIn: () => void }) {
  const t = useT()
  const remembered = getRememberedLogin()
  const [password, setPassword] = useState(remembered.password)
  const [remember, setRemember] = useState(remembered.remember)
  const [showPwd, setShowPwd] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setMemoryPassword(password)
    try {
      const res = await apiFetch('/status')
      if (res.ok) {
        setActivePassword(password, remember)
        onLoggedIn()
      } else {
        toastError(t('login.error'))
      }
    } catch {
      toastError(t('login.connectError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center justify-between border-b px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <img src="/admin/icon.png" alt="" className="size-7" />
          <span className="font-semibold">Kiro-Go</span>
        </div>
        <div className="flex items-center gap-2">
          <LangSwitch />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center p-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm"
        >
          <h1 className="text-2xl font-semibold tracking-tight">{t('login.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('login.subtitle')}</p>

          <div className="mt-6 space-y-2">
            <Label htmlFor="pwdField">{t('login.password')}</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="pwdField"
                type={showPwd ? 'text' : 'password'}
                value={password}
                autoFocus
                placeholder={t('login.passwordPlaceholder')}
                onChange={(e) => setPassword(e.target.value)}
                className="px-9"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? t('login.hidePassword') : t('login.showPassword')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
              >
                {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              id="rememberPwd"
              checked={remember}
              onCheckedChange={(v) => setRemember(v === true)}
            />
            {t('login.remember')}
          </label>

          <Button type="submit" size="lg" className="mt-6 w-full" disabled={submitting}>
            <ArrowRightToLine className="size-4" />
            {t('login.submit')}
          </Button>
        </form>
      </main>
    </div>
  )
}
