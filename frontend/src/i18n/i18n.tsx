// i18n：默认 zh，zh 作为兜底字典；占位符为 {0}/{1}…（与旧版 app.js 一致）。
// locale 直接打包进 bundle（原版是 fetch /admin/locales/<lang>.json，这里内联更简单可靠）。
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import enDict from './en.json'
import zhDict from './zh.json'

export type Lang = 'zh' | 'en'

const dicts: Record<Lang, Record<string, string>> = {
  en: enDict as Record<string, string>,
  zh: zhDict as Record<string, string>,
}

export type TFunc = (key: string, ...args: (string | number)[]) => string

function translate(lang: Lang, key: string, args: (string | number)[]): string {
  const active = dicts[lang] || {}
  const fallback = dicts.zh || {}
  let text = active[key] ?? fallback[key] ?? key
  args.forEach((arg, idx) => {
    text = text.replace('{' + idx + '}', String(arg))
  })
  return text
}

interface I18nContextValue {
  lang: Lang
  t: TFunc
  setLang: (lang: Lang) => void
  toggleLang: () => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

function readInitialLang(): Lang {
  const saved = localStorage.getItem('kiro_lang')
  return saved === 'en' ? 'en' : 'zh'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitialLang)

  const t = useCallback<TFunc>(
    (key, ...args) => translate(lang, key, args),
    [lang],
  )

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    localStorage.setItem('kiro_lang', next)
  }, [])

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next: Lang = prev === 'zh' ? 'en' : 'zh'
      localStorage.setItem('kiro_lang', next)
      return next
    })
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = translate(lang, 'app.title', [])
  }, [lang])

  const value = useMemo<I18nContextValue>(
    () => ({ lang, t, setLang, toggleLang }),
    [lang, t, setLang, toggleLang],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

/** 便捷 hook：仅取 t 函数 */
export function useT(): TFunc {
  return useI18n().t
}
