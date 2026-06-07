// System Prompt 过滤卡：3 个内置开关 + 自定义规则（regex / 行级过滤），保存前仅内存编辑。
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useT } from '@/i18n/i18n'
import { apiFetch, apiGet } from '@/lib/api'
import { toastError, toastSuccess } from '@/lib/toast'
import type { PromptFilterConfig, PromptFilterRule, PromptRuleType } from '@/lib/types'

let ruleSeq = 0

export function PromptFilterCard() {
  const t = useT()
  const [claudeCode, setClaudeCode] = useState(false)
  const [envNoise, setEnvNoise] = useState(false)
  const [stripBoundaries, setStripBoundaries] = useState(false)
  const [rules, setRules] = useState<PromptFilterRule[]>([])

  useEffect(() => {
    apiGet<PromptFilterConfig>('/prompt-filter')
      .then((d) => {
        setClaudeCode(!!d.filterClaudeCode)
        setEnvNoise(!!d.filterEnvNoise)
        setStripBoundaries(!!d.filterStripBoundaries)
        setRules(Array.isArray(d.rules) ? d.rules : [])
      })
      .catch(() => {})
  }, [])

  function addRule(type: PromptRuleType) {
    ruleSeq += 1
    setRules((prev) => [
      ...prev,
      { id: 'rule-' + Date.now() + '-' + ruleSeq, name: '', type, match: '', replace: '', enabled: true },
    ])
  }

  function patchRule(idx: number, field: keyof PromptFilterRule, value: string | boolean) {
    setRules((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)))
  }

  function removeRule(idx: number) {
    setRules((prev) => prev.filter((_, i) => i !== idx))
  }

  async function save() {
    try {
      const res = await apiFetch('/prompt-filter', {
        method: 'POST',
        body: {
          filterClaudeCode: claudeCode,
          filterEnvNoise: envNoise,
          filterStripBoundaries: stripBoundaries,
          rules,
        },
      })
      const d = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string }
      if (d.success) toastSuccess(t('settings.promptFilterSaved'))
      else toastError(t('common.saveFailed') + ': ' + (d.error || ''))
    } catch {
      toastError(t('common.saveFailed'))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.promptFilter')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm font-medium">{t('settings.builtinFilters')}</div>
        <BuiltinToggle
          checked={claudeCode}
          onChange={setClaudeCode}
          label={t('settings.filterClaudeCode')}
          hint={t('settings.filterClaudeCodeHint')}
        />
        <BuiltinToggle
          checked={envNoise}
          onChange={setEnvNoise}
          label={t('settings.filterEnvNoise')}
          hint={t('settings.filterEnvNoiseHint')}
        />
        <BuiltinToggle
          checked={stripBoundaries}
          onChange={setStripBoundaries}
          label={t('settings.filterStripBoundaries')}
          hint={t('settings.filterStripBoundariesHint')}
        />

        <Separator />

        <div className="text-sm font-medium">{t('settings.customRules')}</div>
        {rules.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t('promptFilter.noRules')}</p>
        ) : (
          <div className="space-y-2">
            {rules.map((r, i) => (
              <div key={r.id} className={`rounded-lg border p-3 ${!r.enabled ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-2">
                  <Switch checked={r.enabled} onCheckedChange={(v) => patchRule(i, 'enabled', v)} />
                  <Input
                    className="h-8 flex-1"
                    value={r.name}
                    placeholder={t('promptFilter.unnamed')}
                    onChange={(e) => patchRule(i, 'name', e.target.value)}
                  />
                  <span className="shrink-0 rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {r.type === 'lines-containing' ? t('promptFilter.typeContains') : t('promptFilter.typeRegex')}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0"
                    aria-label={t('common.remove')}
                    onClick={() => removeRule(i)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
                <div className="mt-2 space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs">{t('promptFilter.match')}</Label>
                    <Input
                      className="h-8 font-mono text-xs"
                      value={r.match}
                      placeholder={
                        r.type === 'lines-containing'
                          ? t('promptFilter.matchPlaceholderContains')
                          : t('promptFilter.matchPlaceholderRegex')
                      }
                      onChange={(e) => patchRule(i, 'match', e.target.value)}
                    />
                  </div>
                  {r.type === 'regex' ? (
                    <div className="space-y-1">
                      <Label className="text-xs">{t('promptFilter.replace')}</Label>
                      <Input
                        className="h-8 font-mono text-xs"
                        value={r.replace || ''}
                        placeholder={t('promptFilter.emptyRemove')}
                        onChange={(e) => patchRule(i, 'replace', e.target.value)}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => addRule('regex')}>
            {t('promptFilter.addRegex')}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => addRule('lines-containing')}>
            {t('promptFilter.addContains')}
          </Button>
          <Button type="button" onClick={save}>
            {t('settings.savePromptFilter')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function BuiltinToggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  hint: string
}) {
  return (
    <div>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <Switch checked={checked} onCheckedChange={onChange} />
        {label}
      </label>
      <p className="ml-12 text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}
