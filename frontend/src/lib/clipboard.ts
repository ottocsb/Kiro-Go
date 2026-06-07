// 复制到剪贴板：支持传入值或 Promise（异步场景用 ClipboardItem，需在用户手势内）。
// 复刻 web/app.js 的 copyText。
export async function copyText(input: string | Promise<string>): Promise<void> {
  const isPromise = input && typeof (input as Promise<string>).then === 'function'

  if (
    isPromise &&
    typeof ClipboardItem !== 'undefined' &&
    navigator.clipboard &&
    navigator.clipboard.write
  ) {
    const item = new ClipboardItem({
      'text/plain': (input as Promise<string>).then(
        (text) => new Blob([text], { type: 'text/plain' }),
      ),
    })
    await navigator.clipboard.write([item])
    return
  }

  const text = await input
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch {
      /* 回退到 execCommand */
    }
  }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.focus()
  ta.select()
  try {
    document.execCommand('copy')
  } finally {
    document.body.removeChild(ta)
  }
}
