// 隐私模式：邮箱打码开关，持久化到 privacyMode（默认开启）。
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

function readPrivacy(): boolean {
  const saved = localStorage.getItem('privacyMode')
  return saved === null ? true : saved === 'true'
}

interface PrivacyContextValue {
  enabled: boolean
  setEnabled: (v: boolean) => void
}

const PrivacyContext = createContext<PrivacyContextValue | null>(null)

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState<boolean>(readPrivacy)

  const setEnabled = useCallback((v: boolean) => {
    setEnabledState(v)
    localStorage.setItem('privacyMode', String(v))
  }, [])

  const value = useMemo<PrivacyContextValue>(() => ({ enabled, setEnabled }), [enabled, setEnabled])
  return <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>
}

export function usePrivacy(): PrivacyContextValue {
  const ctx = useContext(PrivacyContext)
  if (!ctx) throw new Error('usePrivacy must be used within PrivacyProvider')
  return ctx
}
