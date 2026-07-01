// UT 結果 dashboard — 匯出層。四種輸出:
//   1. 量化彙總 CSV(無個資)— 各版本 / 各任務成功率、SEQ、場次。可公開。
//   2. 逐字稿 / 開放題 CSV(含個資)— 受測者、email、逐字稿、問卷開放題、結論。供丟 Claude 出質化總結。
//   3. 原始 raw CSV(含個資)— 每列一場,含攤平欄位 + 完整 result JSON 字串。
//   4. PDF / 截圖 — 走瀏覽器原生 window.print()(免額外依賴,存成 PDF 最穩)。
// CSV 一律加 UTF-8 BOM,Excel 開中文不亂碼。

import type { Session, SurveyAnswer, TaskSurvey } from './types'
import { taskAggregates, variantAggregates } from './analytics'

// ── CSV 基礎 ───────────────────────────────────────────────────────────────
function csvCell(v: unknown): string {
  const s = v == null ? '' : String(v)
  // 逗號 / 引號 / 換行 → 以雙引號包起並將內部引號 escape。
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
export function toCsv(rows: (string | number)[][]): string {
  const body = rows.map((r) => r.map(csvCell).join(',')).join('\r\n')
  return '﻿' + body // UTF-8 BOM
}

export function downloadText(filename: string, text: string, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

function stamp(): string {
  return new Date().toISOString().slice(0, 10)
}
function slug(s: string): string {
  return (s || 'all').replace(/[^a-zA-Z0-9_-]+/g, '-')
}

// ── 1. 量化彙總 CSV(無個資)──────────────────────────────────────────────
export function quantCsv(sessions: Session[]): string {
  const rows: (string | number)[][] = []
  rows.push(['# 版本彙總'])
  rows.push(['test_id', 'variant', 'variant_label', '場次', '平均成功率(%)', '平均SEQ'])
  const testId = sessions[0]?.testId ?? ''
  for (const v of variantAggregates(sessions)) {
    rows.push([testId, v.variant, v.variantLabel, v.runs, v.avgRate, v.avgSeq ?? ''])
  }
  rows.push([])
  rows.push(['# 各版本 × 各任務'])
  rows.push(['test_id', 'variant', 'task_id', 'task_title', '受測人次', '成功數', '成功率(%)'])
  for (const t of taskAggregates(sessions)) {
    rows.push([testId, t.variant, t.taskId, t.taskTitle, t.n, t.success, t.rate])
  }
  return toCsv(rows)
}

// ── 2. 逐字稿 / 開放題 CSV(含個資)────────────────────────────────────────
function openAnswers(taskSurveys: TaskSurvey[]): string {
  const lines: string[] = []
  for (const ts of taskSurveys) {
    for (const a of ts.answers as SurveyAnswer[]) {
      if (a.questionType === 'writtenResponse') {
        const val = String(a.value ?? '').trim()
        if (val) lines.push(`[${ts.taskTitle}] ${a.prompt}: ${val}`)
      }
    }
  }
  return lines.join('\n')
}

export function transcriptCsv(sessions: Session[]): string {
  const rows: (string | number)[][] = []
  rows.push(['created_at', 'test_id', 'tester', 'email', 'lang', 'variant', '成功率(%)', '逐字稿', '開放題', '結論'])
  for (const s of sessions) {
    for (const run of s.runs) {
      rows.push([
        s.createdAt,
        s.testId,
        s.tester,
        s.email,
        s.lang,
        run.variant,
        run.rate,
        run.transcript,
        openAnswers(run.taskSurveys),
        s.conclusion,
      ])
    }
  }
  return toCsv(rows)
}

// ── 3. 原始 raw CSV(含個資)──────────────────────────────────────────────
export function rawCsv(sessions: Session[]): string {
  const rows: (string | number)[][] = []
  rows.push(['id', 'created_at', 'test_id', 'kind', 'variants', 'tester', 'email', 'lang', 'started_at', 'finished_at', '耗時分鐘', '整體成功率(%)', 'result_json'])
  for (const s of sessions) {
    rows.push([
      s.id,
      s.createdAt,
      s.testId,
      s.kind,
      s.variants,
      s.tester,
      s.email,
      s.lang,
      s.startedAt ?? '',
      s.finishedAt ?? '',
      s.durationMin ?? '',
      s.overallRate,
      JSON.stringify(s.raw.result ?? {}),
    ])
  }
  return toCsv(rows)
}

// ── 檔名 ───────────────────────────────────────────────────────────────────
export function exportFilename(kind: 'quant' | 'transcript' | 'raw', testId: string): string {
  return `ut-${slug(testId)}-${kind}-${stamp()}.csv`
}

// ── 4. PDF / 截圖(瀏覽器原生列印)──────────────────────────────────────────
export function printReport() {
  window.print()
}
