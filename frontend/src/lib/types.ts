// 与 Go 后端 /admin/api 契约对应的类型定义（见 .migration/api-contracts.md）

/** GET /accounts 返回的账号对象（每个 key 必定存在） */
export interface Account {
  id: string
  email: string
  userId: string
  nickname: string
  authMethod: string // "idc" | "social"
  provider: string // "BuilderId" | "GitHub" | "Google" | ""
  region: string
  enabled: boolean
  banStatus: string // "ACTIVE" | "BANNED" | "SUSPENDED" | ""
  banReason: string
  banTime: number
  expiresAt: number // unix 秒
  hasToken: boolean
  machineId: string
  weight: number
  overageStatus: string // "ENABLED" | "DISABLED" | "UNKNOWN" | ""
  overageCapability: string
  overageCap: number
  overageRate: number
  currentOverages: number
  overageCheckedAt: number
  proxyURL: string
  subscriptionType: string // FREE | PRO | PRO_PLUS | POWER
  subscriptionTitle: string
  daysRemaining: number
  usageCurrent: number
  usageLimit: number
  usagePercent: number // 0.0 - 1.0
  nextResetDate: string
  lastRefresh: number
  trialUsageCurrent: number
  trialUsageLimit: number
  trialUsagePercent: number
  trialStatus: string // ACTIVE | EXPIRED | NONE
  trialExpiresAt: number
  requestCount: number
  errorCount: number
  totalTokens: number
  totalCredits: number
  lastUsed: number
}

/** GET /accounts/{id}/full 额外携带的密钥字段 */
export interface AccountFull extends Account {
  accessToken: string
  refreshToken: string
  clientId: string
  clientSecret: string
}

/** /accounts/{id}/refresh 返回的 info（PascalCase！这是唯一一个） */
export interface AccountInfo {
  Email: string
  UserId: string
  SubscriptionType: string
  SubscriptionTitle: string
  DaysRemaining: number
  UsageCurrent: number
  UsageLimit: number
  UsagePercent: number
  NextResetDate: string
  LastRefresh: number
  TrialUsageCurrent: number
  TrialUsageLimit: number
  TrialUsagePercent: number
  TrialStatus: string
  TrialExpiresAt: number
}

export interface ModelInfo {
  modelId: string
  modelName: string
  description: string
  supportedInputTypes: string[]
  rateMultiplier: number
  tokenLimits: { maxInputTokens: number; maxOutputTokens: number } | null
}

export interface OverageInfo {
  overageStatus: string
  overageCapability: string
  subscriptionTitle: string
  overageCap: number
  overageRate: number
  currentOverages: number
  overageCheckedAt: number
}

export interface StatusInfo {
  accounts: number
  available: number
  totalRequests: number
  successRequests: number
  failedRequests: number
  totalTokens: number
  totalCredits: number
  uptime: number
}

export interface AppSettings {
  apiKey: string
  requireApiKey: boolean
  port: number
  host: string
  allowOverUsage: boolean
  retryOnThrottle: boolean
  retryMaxRetries: number
}

export interface ThinkingConfig {
  suffix: string
  openaiFormat: string
  claudeFormat: string
}

export interface EndpointConfig {
  preferredEndpoint: string // auto | kiro | codewhisperer | amazonq
  endpointFallback: boolean
}

export type PromptRuleType = 'regex' | 'lines-containing'

export interface PromptFilterRule {
  id: string
  name: string
  type: PromptRuleType
  match: string
  replace?: string
  enabled: boolean
}

export interface PromptFilterConfig {
  filterClaudeCode: boolean
  filterEnvNoise: boolean
  filterStripBoundaries: boolean
  rules: PromptFilterRule[]
}

export interface ApiKeyView {
  id: string
  name?: string
  keyMasked: string
  enabled: boolean
  migrated?: boolean
  createdAt: number
  lastUsedAt?: number
  tokenLimit?: number
  creditLimit?: number
  tokensUsed: number
  creditsUsed: number
  requestsCount: number
}
