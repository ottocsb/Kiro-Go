// 主题：system → light → dark 循环切换，.dark 类挂在 <html>，持久化到 kiro_theme。
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type ThemePref = 'system' | 'light' | 'dark'
const THEME_ORDER: ThemePref[] = ['system', 'light', 'dark']

function readThemePref(): ThemePref {
  const saved = localStorage.getItem('kiro_theme') as ThemePref | null
  return saved && THEME_ORDER.includes(saved) ? saved : 'system'
}

function resolve(pref: ThemePref): 'light' | 'dark' {
  if (pref === 'dark') return 'dark'
  if (pref === 'light') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(pref: ThemePref) {
  const resolved = resolve(pref)
  document.documentElement.classList.toggle('dark', resolved === 'dark')
  document.documentElement.dataset.themePref = pref
}

interface ThemeContextValue {
  pref: ThemePref
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPref] = useState<ThemePref>(readThemePref)

  useEffect(() => {
    applyTheme(pref)
  }, [pref])

  // 跟随系统：仅当偏好为 system 时随系统变化重新应用
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (readThemePref() === 'system') applyTheme('system')
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const toggle = useCallback(() => {
    setPref((prev) => {
      const next = THEME_ORDER[(THEME_ORDER.indexOf(prev) + 1) % THEME_ORDER.length]
      localStorage.setItem('kiro_theme', next)
      return next
    })
  }, [])

  const value = useMemo<ThemeContextValue>(() => ({ pref, toggle }), [pref, toggle])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
