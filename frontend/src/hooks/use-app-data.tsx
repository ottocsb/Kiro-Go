// 登录后的共享数据：账号列表、运行状态、版本号。含 10s 状态轮询。
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { apiGet } from '@/lib/api'
import type { Account, StatusInfo } from '@/lib/types'

interface AppDataValue {
  status: StatusInfo | null
  accounts: Account[]
  version: string
  reloadStatus: () => Promise<void>
  reloadAccounts: () => Promise<void>
}

const AppDataContext = createContext<AppDataValue | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<StatusInfo | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [version, setVersion] = useState('')
  const mounted = useRef(true)

  const reloadStatus = useCallback(async () => {
    try {
      const s = await apiGet<StatusInfo>('/status')
      if (mounted.current) setStatus(s)
    } catch {
      /* 状态拉取失败静默 */
    }
  }, [])

  const reloadAccounts = useCallback(async () => {
    try {
      const list = await apiGet<Account[]>('/accounts')
      if (mounted.current) setAccounts(Array.isArray(list) ? list : [])
    } catch {
      /* 账号拉取失败静默 */
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    void reloadStatus()
    void reloadAccounts()
    apiGet<{ version: string }>('/version')
      .then((d) => mounted.current && setVersion(d.version || ''))
      .catch(() => {})
    return () => {
      mounted.current = false
    }
  }, [reloadStatus, reloadAccounts])

  // 每 10s 刷新一次运行状态
  useEffect(() => {
    const timer = window.setInterval(() => void reloadStatus(), 10000)
    return () => window.clearInterval(timer)
  }, [reloadStatus])

  const value = useMemo<AppDataValue>(
    () => ({ status, accounts, version, reloadStatus, reloadAccounts }),
    [status, accounts, version, reloadStatus, reloadAccounts],
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData(): AppDataValue {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider')
  return ctx
}
