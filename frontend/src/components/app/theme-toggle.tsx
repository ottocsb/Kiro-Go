// 主题切换图标按钮：system → light → dark 循环。
import { Monitor, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/use-theme'
import { useT } from '@/i18n/i18n'

export function ThemeToggle() {
  const { pref, toggle } = useTheme()
  const t = useT()
  const label = t('theme.status', t('theme.' + pref))
  const Icon = pref === 'light' ? Sun : pref === 'dark' ? Moon : Monitor
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-8"
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      <Icon className="size-4" />
    </Button>
  )
}
