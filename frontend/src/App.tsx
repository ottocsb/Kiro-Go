import { useEffect, useState } from 'react'
import { ThemeProvider } from '@/hooks/use-theme'
import { I18nProvider } from '@/i18n/i18n'
import { PrivacyProvider } from '@/hooks/use-privacy'
import { ConfirmProvider } from '@/components/app/confirm-dialog'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { LoginScreen } from '@/components/app/login-screen'
import { AppShell } from '@/components/app/app-shell'
import { AppDataProvider } from '@/hooks/use-app-data'
import { UpdateProvider } from '@/features/update/use-update'
import { apiFetch } from '@/lib/api'
import { clearActivePassword, getPassword, isLoginExpired } from '@/lib/auth'

function AuthedApp({ onLogout }: { onLogout: () => void }) {
  return (
    <AppDataProvider>
      <UpdateProvider>
        <AppShell onLogout={onLogout} />
      </UpdateProvider>
    </AppDataProvider>
  )
}

function AuthGate() {
  // null = 校验中，false = 未登录，true = 已登录
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    async function tryAutoLogin() {
      if (!getPassword()) {
        if (!cancelled) setAuthed(false)
        return
      }
      if (isLoginExpired()) {
        clearActivePassword()
        if (!cancelled) setAuthed(false)
        return
      }
      try {
        const res = await apiFetch('/status')
        if (!cancelled) setAuthed(res.ok)
      } catch {
        if (!cancelled) setAuthed(false)
      }
    }
    void tryAutoLogin()
    return () => {
      cancelled = true
    }
  }, [])

  function handleLogout() {
    clearActivePassword()
    setAuthed(false)
  }

  if (authed === null) return <div className="min-h-svh bg-background" />
  if (!authed) return <LoginScreen onLoggedIn={() => setAuthed(true)} />
  return <AuthedApp onLogout={handleLogout} />
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <PrivacyProvider>
          <TooltipProvider>
            <ConfirmProvider>
              <AuthGate />
            </ConfirmProvider>
            <Toaster position="top-center" />
          </TooltipProvider>
        </PrivacyProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
