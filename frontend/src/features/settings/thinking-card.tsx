// Thinking 模式设置卡：触发后缀 + OpenAI/Claude 输出格式。
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useT } from '@/i18n/i18n'
import { apiFetch, apiGet } from '@/lib/api'
import { toastError, toastSuccess } from '@/lib/toast'
import type { ThinkingConfig } from '@/lib/types'

export function ThinkingCard() {
  const t = useT()
  const [suffix, setSuffix] = useState('-thinking')
  const [openaiFormat, setOpenaiFormat] = useState('reasoning_content')
  const [claudeFormat, setClaudeFormat] = useState('thinking')

  useEffect(() => {
    apiGet<ThinkingConfig>('/thinking')
      .then((d) => {
        setSuffix(d.suffix || '-thinking')
        setOpenaiFormat(d.openaiFormat || 'reasoning_content')
        setClaudeFormat(d.claudeFormat || 'thinking')
      })
      .catch(() => {})
  }, [])

  async function save() {
    try {
      const res = await apiFetch('/thinking', {
        method: 'POST',
        body: { suffix: suffix || '-thinking', openaiFormat, claudeFormat },
      })
      const d = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string }
      if (d.success) toastSuccess(t('settings.thinkingSaved'))
      else toastError(t('common.saveFailed') + ': ' + (d.error || ''))
    } catch {
      toastError(t('common.saveFailed'))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.thinkingSettings')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="thinkingSuffix">{t('settings.thinkingSuffix')}</Label>
          <Input
            id="thinkingSuffix"
            value={suffix}
            placeholder="-thinking"
            onChange={(e) => setSuffix(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">{t('settings.thinkingSuffixHint')}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t('settings.openaiFormat')}</Label>
            <Select value={openaiFormat} onValueChange={setOpenaiFormat}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reasoning_content">{t('settings.formatReasoningContent')}</SelectItem>
                <SelectItem value="thinking">{t('settings.formatThinkingClaude')}</SelectItem>
                <SelectItem value="think">{t('settings.formatThinkOpenAI')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('settings.claudeFormat')}</Label>
            <Select value={claudeFormat} onValueChange={setClaudeFormat}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thinking">{t('settings.formatThinkingClaude')}</SelectItem>
                <SelectItem value="think">{t('settings.formatThinkOpenAI')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button type="button" onClick={save}>
          {t('settings.saveThinking')}
        </Button>
      </CardContent>
    </Card>
  )
}
