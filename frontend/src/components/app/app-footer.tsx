// 页脚：版本徽章 + 运行状态点 + 检查更新 + GitHub 链接 + 年份。
import { RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useT } from '@/i18n/i18n'
import { useAppData } from '@/hooks/use-app-data'
import { stripLeadingV } from '@/lib/format'
import { useUpdate } from '@/features/update/use-update'

export function AppFooter() {
  const t = useT()
  const { version } = useAppData()
  const { checking, checkUpdate } = useUpdate()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t" aria-label={t('aria.footer')}>
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <img src="/admin/icon.png" alt="" className="size-6" />
          <div className="flex items-center gap-2">
            <span className="font-semibold">Kiro-Go</span>
            {version ? (
              <span
                className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                aria-label={t('aria.currentVersion')}
              >
                v{stripLeadingV(version)}
              </span>
            ) : null}
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground" title={t('status.running')}>
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              {t('status.running')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={checking}
            aria-busy={checking}
            onClick={() => void checkUpdate(true)}
          >
            <RotateCw className={`size-4 ${checking ? 'animate-spin' : ''}`} />
            {checking ? t('update.checking') : t('update.check')}
          </Button>
          <Button asChild variant="ghost" size="sm">
            <a href="https://github.com/Quorinex/Kiro-Go" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 16 16" className="size-4" fill="currentColor" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              {t('footer.github')}
            </a>
          </Button>
          <span className="text-xs text-muted-foreground">© {year} Kiro-Go</span>
        </div>
      </div>
    </footer>
  )
}
