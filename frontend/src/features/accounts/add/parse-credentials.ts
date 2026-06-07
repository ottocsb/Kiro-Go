// 凭证解析：复刻 importCredentials 的 JSON 三形态 + parseLineCredentials 行格式。
export interface RawCred {
  refreshToken?: string
  accessToken?: string
  clientId?: string
  clientSecret?: string
  region?: string
  authMethod?: string
  provider?: string
}

interface AccountsShapeItem {
  credentials?: RawCred
  idp?: string
  refreshToken?: string
  accessToken?: string
  clientId?: string
  clientSecret?: string
  region?: string
  authMethod?: string
  provider?: string
}

/** 行格式：分隔符优先级 ---- > tab > 空白；需 ≥5 字段，refreshToken=第3字段 */
export function parseLineCredentials(text: string): { items: RawCred[]; skipped: number } {
  const items: RawCred[] = []
  let skipped = 0
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue
    let parts: string[]
    if (line.includes('----')) parts = line.split('----').map((p) => p.trim())
    else if (line.includes('\t')) parts = line.split(/\t+/).map((p) => p.trim())
    else parts = line.split(/\s+/).map((p) => p.trim())
    if (parts.length < 5) {
      skipped++
      continue
    }
    if (!parts[2]) {
      skipped++
      continue
    }
    items.push({ refreshToken: parts[2], clientId: parts[3], clientSecret: parts[4] })
  }
  return { items, skipped }
}

/** 解析凭证输入：先尝试 JSON（accounts 形态 / 数组 / 单对象），失败回退行格式 */
export function parseCredentials(raw: string): { items: RawCred[]; skipped: number } {
  try {
    const json = JSON.parse(raw)
    if (json && Array.isArray(json.accounts)) {
      const items: RawCred[] = (json.accounts as AccountsShapeItem[]).map((a) => ({
        refreshToken: a.credentials?.refreshToken ?? a.refreshToken,
        clientId: a.credentials?.clientId ?? a.clientId,
        clientSecret: a.credentials?.clientSecret ?? a.clientSecret,
        region: a.credentials?.region ?? a.region,
        authMethod: a.credentials?.authMethod ?? a.authMethod,
        provider: a.credentials?.provider ?? a.provider ?? a.idp,
      }))
      return { items, skipped: 0 }
    }
    const items: RawCred[] = Array.isArray(json) ? json : [json]
    return { items, skipped: 0 }
  } catch {
    return parseLineCredentials(raw)
  }
}

/** 行格式解析与 JSON 解析的区分（用于错误提示分支） */
export function isJsonParseable(raw: string): boolean {
  try {
    JSON.parse(raw)
    return true
  } catch {
    return false
  }
}
