// 语言切换：中文 / EN 两个按钮，高亮当前语言。
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useI18n } from '@/i18n/i18n'

export function LangSwitch() {
  const { lang, setLang, t } = useI18n()
  return (
    <div className="flex items-center rounded-md border p-0.5" role="group" aria-label={t('lang.label')}>
      <Button
        type="button"
        size="sm"
        variant={lang === 'zh' ? 'secondary' : 'ghost'}
        className={cn('h-7 px-2 text-xs', lang === 'zh' && 'font-semibold')}
        onClick={() => setLang('zh')}
      >
        {t('lang.zh')}
      </Button>
      <Button
        type="button"
        size="sm"
        variant={lang === 'en' ? 'secondary' : 'ghost'}
        className={cn('h-7 px-2 text-xs', lang === 'en' && 'font-semibold')}
        onClick={() => setLang('en')}
      >
        {t('lang.en')}
      </Button>
    </div>
  )
}
