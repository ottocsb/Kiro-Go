// 版本更新检查：对比硬编码 GitHub raw version.json，手动→弹窗，自动→toast。
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
import { useT } from '@/i18n/i18n'
import { apiGet } from '@/lib/api'
import { compareVersions, stripLeadingV } from '@/lib/format'
import { toastSuccess, toastWarning, toastError } from '@/lib/toast'
import { useAppData } from '@/hooks/use-app-data'

const REMOTE_VERSION_URL = 'https://raw.githubusercontent.com/Quorinex/Kiro-Go/main/version.json'

export interface UpdateModalState {
  version: string
  url: string
  changelog: string
}

interface UpdateContextValue {
  checking: boolean
  modal: UpdateModalState | null
  checkUpdate: (manual: boolean) => Promise<void>
  closeModal: () => void
}

const UpdateContext = createContext<UpdateContextValue | null>(null)

export function UpdateProvider({ children }: { children: ReactNode }) {
  const t = useT()
  const { version } = useAppData()
  const [checking, setChecking] = useState(false)
  const [modal, setModal] = useState<UpdateModalState | null>(null)
  const autoChecked = useRef(false)

  const checkUpdate = useCallback(
    async (manual: boolean) => {
      if (manual) setChecking(true)
      try {
        let current = stripLeadingV(version)
        if (!current) {
          const d = await apiGet<{ version: string }>('/version')
          current = stripLeadingV(d.version || '')
        }
        if (!current) throw new Error('no current version')

        const res = await fetch(REMOTE_VERSION_URL + '?t=' + Date.now(), { cache: 'no-store' })
        const d = (await res.json()) as { version?: string; download?: string; changelog?: string }
        const latest = stripLeadingV(d.version || '')
        if (!latest) throw new Error('no latest version')

        if (latest !== current && compareVersions(latest, current) > 0) {
          if (manual) {
            setModal({ version: latest, url: d.download || '', changelog: d.changelog || '' })
          } else {
            toastWarning(t('update.availableToast') + ': ' + latest, {
              duration: 5200,
              action: { label: t('update.goDownload'), onClick: () => void checkUpdate(true) },
            })
          }
        } else if (manual) {
          toastSuccess(t('update.noUpdatesToast'), { duration: 3600 })
        }
      } catch {
        if (manual) toastError(t('update.checkFailed'), { duration: 4200 })
      } finally {
        if (manual) setChecking(false)
      }
    },
    [version, t],
  )

  // 数据加载后约 2s 自动静默检查一次
  useEffect(() => {
    if (autoChecked.current) return
    autoChecked.current = true
    const timer = window.setTimeout(() => void checkUpdate(false), 2000)
    return () => window.clearTimeout(timer)
  }, [checkUpdate])

  const closeModal = useCallback(() => setModal(null), [])

  const value = useMemo<UpdateContextValue>(
    () => ({ checking, modal, checkUpdate, closeModal }),
    [checking, modal, checkUpdate, closeModal],
  )

  return <UpdateContext.Provider value={value}>{children}</UpdateContext.Provider>
}

export function useUpdate(): UpdateContextValue {
  const ctx = useContext(UpdateContext)
  if (!ctx) throw new Error('useUpdate must be used within UpdateProvider')
  return ctx
}
