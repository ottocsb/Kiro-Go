// 格式化与展示工具，严格复刻 web/app.js 中对应函数的行为。
import type { TFunc } from '@/i18n/i18n'

/** 紧凑数字：1.2K / 3.4M（用于统计 token 等） */
export function formatNum(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return n.toString()
}

/** 千分位数字（API key 用量，硬编码 en-US，与旧版一致） */
export function formatNumber(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '0'
  if (Math.abs(n) >= 1 && Math.floor(n) === n) return Number(n).toLocaleString('en-US')
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: 4 })
}

/** 邮箱打码：privacy 关闭/空/无 @ 时原样返回 */
export function maskEmail(email: string, enabled: boolean): string {
  if (!enabled || !email || !email.includes('@')) return email
  const [local, domain] = email.split('@')
  const maskPart = (s: string) => (s.length <= 2 ? s : s.slice(0, 2) + '***')
  const maskedLocal = maskPart(local)
  const parts = domain.split('.')
  let maskedDomain: string
  if (parts.length >= 2) {
    const tld = parts[parts.length - 1]
    const sld = maskPart(parts[parts.length - 2])
    const subs = parts.slice(0, parts.length - 2).map(maskPart)
    maskedDomain = [...subs, sld, tld].join('.')
  } else {
    maskedDomain = domain
  }
  return maskedLocal + '@' + maskedDomain
}

/** 展示用邮箱：无邮箱时回退到截断 id */
export function getDisplayEmail(email: string, id: string, enabled: boolean): string {
  const raw = email || (id ? id.slice(0, 12) + '...' : '-')
  return maskEmail(raw, enabled)
}

/** 版本号逐段数值比较，无 semver 预发布处理 */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const na = pa[i] || 0
    const nb = pb[i] || 0
    if (na > nb) return 1
    if (na < nb) return -1
  }
  return 0
}

export function stripLeadingV(v: string): string {
  return v.replace(/^v/i, '')
}

/** token 过期相对时间 */
export function formatTokenExpiry(t: TFunc, ts: number): string {
  if (!ts) return '-'
  const diff = ts - Date.now() / 1000
  if (diff <= 0) return t('time.expired')
  if (diff < 3600) return Math.floor(diff / 60) + t('time.minutes')
  if (diff < 86400) return Math.floor(diff / 3600) + t('time.hours')
  return Math.floor(diff / 86400) + t('time.days')
}

/** 试用到期提示（仅剩余 ≤7 天/已过期时显示） */
export function formatTrialExpiry(t: TFunc, ts: number): string {
  if (!ts) return ''
  const date = new Date(ts * 1000)
  const diffDays = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return '(' + t('accounts.trialExpired') + ')'
  if (diffDays === 0) return '(' + t('accounts.trialToday') + ')'
  if (diffDays <= 7) return '(' + diffDays + t('accounts.trialDays') + ')'
  return ''
}

export function formatSubscriptionLabel(t: TFunc, type: string): string {
  const s = (type || '').toUpperCase()
  if (s.includes('POWER')) return t('subscription.power')
  if (s.includes('PRO_PLUS') || s.includes('PROPLUS')) return t('subscription.proPlus')
  if (s.includes('PRO')) return t('subscription.pro')
  if (s.includes('FREE')) return t('subscription.free')
  return type || t('subscription.free')
}

export function formatAuthMethod(t: TFunc, method: string): string {
  if (!method) return '-'
  const n = String(method).toLowerCase()
  if (n === 'idc') return t('auth.enterprise')
  if (n === 'social') return t('auth.social')
  if (n === 'builderid') return 'BuilderID'
  if (n === 'github') return t('local.providerGithub')
  if (n === 'google') return t('local.providerGoogle')
  return method
}

/** 用量条颜色阈值（API key 用量：95% 红 / 80% 橙 / 其它蓝） */
export function usageBarColor(ratio: number): string {
  if (ratio >= 0.95) return '#ef4444'
  if (ratio >= 0.8) return '#f59e0b'
  return '#3b82f6'
}
