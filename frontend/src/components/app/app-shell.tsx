// 登录后主外壳：页头 + 统计栏 + 当前标签页 + 页脚 + 更新弹窗。
import { useState } from 'react'
import { AppHeader, type TabKey } from './app-header'
import { AppFooter } from './app-footer'
import { StatsGrid } from './stats-grid'
import { AccountsPage } from '@/pages/accounts-page'
import { SettingsPage } from '@/pages/settings-page'
import { ApiPage } from '@/pages/api-page'
import { UpdateModal } from '@/features/update/update-modal'

export function AppShell({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<TabKey>('accounts')

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <AppHeader active={tab} onChange={setTab} onLogout={onLogout} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 sm:px-6">
        <StatsGrid />
        <div className="mt-4">
          {tab === 'accounts' && <AccountsPage />}
          {tab === 'settings' && <SettingsPage />}
          {tab === 'api' && <ApiPage />}
        </div>
      </main>
      <AppFooter />
      <UpdateModal />
    </div>
  )
}
