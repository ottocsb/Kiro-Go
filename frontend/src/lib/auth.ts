// 管理密码存储与鉴权状态，严格对齐原 app.js 行为（双存储 + 72h 过期 + 启动清理）
// storage key 名称保持与旧版完全一致，确保老用户浏览器无感迁移。

const LOGIN_TTL_MS = 72 * 3600 * 1000 // 持久登录 72 小时过期

let password = ''

// 启动清理：未勾选"记住密码"时，清除持久化的密码与登录时间
export function initAuthStorage() {
  if (localStorage.getItem('kiro_remember') !== '1') {
    localStorage.removeItem('admin_password')
    localStorage.removeItem('admin_login_time')
  }
  password =
    sessionStorage.getItem('admin_password') ||
    localStorage.getItem('admin_password') ||
    ''
}

export function getPassword() {
  return password
}

/** 仅设置内存中的密码（登录校验前设置请求头用，校验通过后再调 setActivePassword 持久化） */
export function setMemoryPassword(p: string) {
  password = p
}

export function clearActivePassword() {
  sessionStorage.removeItem('admin_password')
  sessionStorage.removeItem('admin_login_time')
  localStorage.removeItem('admin_password')
  localStorage.removeItem('admin_login_time')
  password = ''
}

function getActiveLoginTime(): number {
  const storage = sessionStorage.getItem('admin_password') ? sessionStorage : localStorage
  return parseInt(storage.getItem('admin_login_time') || '0', 10)
}

export function setActivePassword(nextPassword: string, remember: boolean) {
  password = nextPassword
  const now = Date.now().toString()
  sessionStorage.setItem('admin_password', nextPassword)
  sessionStorage.setItem('admin_login_time', now)
  if (remember) {
    localStorage.setItem('admin_password', nextPassword)
    localStorage.setItem('admin_login_time', now)
    localStorage.setItem('kiro_remember', '1')
    localStorage.setItem('kiro_remembered_pwd', nextPassword)
  } else {
    localStorage.removeItem('admin_password')
    localStorage.removeItem('admin_login_time')
    localStorage.removeItem('kiro_remember')
    localStorage.removeItem('kiro_remembered_pwd')
  }
}

/** 启动时读取"记住密码"预填值 */
export function getRememberedLogin(): { remember: boolean; password: string } {
  if (localStorage.getItem('kiro_remember') === '1') {
    return { remember: true, password: localStorage.getItem('kiro_remembered_pwd') || '' }
  }
  return { remember: false, password: '' }
}

/** 持久登录是否已过期（仅在启动时检查一次，与旧版一致） */
export function isLoginExpired(): boolean {
  const loginTime = getActiveLoginTime()
  return !!loginTime && Date.now() - loginTime > LOGIN_TTL_MS
}
