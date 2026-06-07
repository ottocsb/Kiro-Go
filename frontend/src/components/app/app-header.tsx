// 页头：品牌 + 三标签导航 + 语言/主题切换 + 退出登录。
import { LogOut, Plug, Sliders, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useT } from '@/i18n/i18n'
import { LangSwitch } from './lang-switch'
import { ThemeToggle } from './theme-toggle'

export type TabKey = 'accounts' | 'settings' | 'api'

const TABS: { key: TabKey; labelKey: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'accounts', labelKey: 'tabs.accounts', icon: Users },
  { key: 'settings', labelKey: 'tabs.settings', icon: Sliders },
  { key: 'api', labelKey: 'tabs.api', icon: Plug },
]

export function AppHeader({
  active,
  onChange,
  onLogout,
}: {
  active: TabKey
  onChange: (tab: TabKey) => void
  onLogout: () => void
}) {
  const t = useT()
  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-2">
          <img src="/admin/icon.png" alt="" className="size-7" />
          <span className="hidden font-semibold sm:inline">Kiro-Go</span>
        </div>

        <nav className="flex items-center gap-1" aria-label={t('aria.sections')}>
          {TABS.map(({ key, labelKey, icon: Icon }) => (
            <Button
              key={key}
              type="button"
              variant={active === key ? 'secondary' : 'ghost'}
              size="sm"
              className={cn('gap-1.5', active === key && 'font-semibold')}
              onClick={() => onChange(key)}
            >
              <Icon className="size-4" />
              <span className="hidden sm:inline">{t(labelKey)}</span>
            </Button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <LangSwitch />
          <ThemeToggle />
          <Button type="button" variant="outline" size="sm" onClick={onLogout}>
            <LogOut className="size-4" />
            <span className="hidden sm:inline">{t('common.logout')}</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
