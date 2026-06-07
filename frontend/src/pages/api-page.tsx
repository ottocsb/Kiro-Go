// API 端点参考页（只读）：5 个公开端点 URL + 复制按钮。
import { BarChart3, Copy, Layers, MessageSquare, MessagesSquare, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useT } from '@/i18n/i18n'
import { copyText } from '@/lib/clipboard'
import { toastPrimary, toastError } from '@/lib/toast'

const baseUrl = location.origin

const ENDPOINTS: {
  titleKey: string
  methodKey: string
  path: string
  copyKey: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { titleKey: 'api.claude', methodKey: 'api.methodPost', path: '/v1/messages', copyKey: 'api.copyClaude', icon: MessageSquare },
  { titleKey: 'api.openai', methodKey: 'api.methodPost', path: '/v1/chat/completions', copyKey: 'api.copyOpenAI', icon: Sparkles },
  { titleKey: 'api.openaiResponses', methodKey: 'api.methodPost', path: '/v1/responses', copyKey: 'api.copyOpenAIResponses', icon: MessagesSquare },
  { titleKey: 'api.modelList', methodKey: 'api.methodGet', path: '/v1/models', copyKey: 'api.copyModels', icon: Layers },
  { titleKey: 'api.stats', methodKey: 'api.methodGet', path: '/v1/stats', copyKey: 'api.copyStats', icon: BarChart3 },
]

export function ApiPage() {
  const t = useT()

  async function copy(url: string) {
    try {
      await copyText(url)
      toastPrimary(t('common.copied'))
    } catch {
      toastError(t('common.failed'))
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>{t('api.endpoints')}</CardTitle>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {t('api.protocolHttp')}
        </span>
      </CardHeader>
      <CardContent className="space-y-3">
        {ENDPOINTS.map((e) => {
          const url = baseUrl + e.path
          const Icon = e.icon
          return (
            <div key={e.path} className="rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  <Icon className="size-4" />
                </span>
                <span className="font-medium">{t(e.titleKey)}</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  {t(e.methodKey)}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-md border bg-muted/40 px-2 py-1.5 text-sm">
                  {url}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-8 shrink-0"
                  aria-label={t(e.copyKey)}
                  onClick={() => copy(url)}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>
          )
        })}
        <p className="text-xs text-muted-foreground">{t('api.statsHint')}</p>
      </CardContent>
    </Card>
  )
}
