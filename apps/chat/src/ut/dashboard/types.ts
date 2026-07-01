// UT 結果 dashboard — 資料型別。
// 對齊 @imethan0254/ut-model-a 送到 Supabase 的 ResultPayload 形狀(見 packages/ut-model-a/src/index.tsx
// 的 SingleResultScreen / CombinedResultScreen payload 組裝),以及 docs/ut-results-supabase.md 的表結構。
// 這裡故意用寬鬆型別 + 防呆解析(analytics.ts),因為 jsonb 內容跨版本可能微幅演進。

export type UTaskResult = 'success' | 'fail'

export type SurveyAnswer = {
  questionId: string
  questionType: 'singleEase' | 'writtenResponse'
  prompt: string
  value: number | string
  /** singleEase 量表上限(通常 7) */
  scaleMax?: number
}

export type TaskOutcome = {
  id: string
  title: string
  result: UTaskResult
  reason?: string
}

export type TaskSurvey = {
  taskId: string
  taskTitle: string
  answers: SurveyAnswer[]
}

export type FalseEasyItem = {
  taskId?: string
  title: string
  score: number
  scaleMax: number
}

/** combined 測試裡的單一版本 run;single 測試我們也 normalize 成一個 run。 */
export type VariantRun = {
  variant: string
  variantLabel: string
  rate: number
  successCount: number
  total: number
  outcomes: TaskOutcome[]
  transcript: string
  taskSurveys: TaskSurvey[]
  falseEasy: FalseEasyItem[]
}

/** ut_results 一列的 result 欄(jsonb),combined / single 兩形態聯集。 */
export type UTResultBlob = {
  email?: string
  conclusion?: string
  thinkAloud?: string
  // combined:
  runs?: VariantRun[]
  postTest?: SurveyAnswer[]
  // single:
  rate?: number
  successCount?: number
  total?: number
  outcomes?: TaskOutcome[]
  transcript?: string
  taskSurveys?: TaskSurvey[]
  falseEasy?: FalseEasyItem[]
}

/** ut_results 一列(對齊 docs/ut-results-supabase.md 建表 schema)。 */
export type UTRow = {
  id: string
  created_at: string
  test_id: string
  kind: 'single' | 'combined' | string
  variants: string
  tester: string
  lang: string
  started_at: string | null
  finished_at: string | null
  result: UTResultBlob | null
}

/** 一場測試(= 一列 ut_results)normalize 後的樣子,含算好的衍生欄位。 */
export type Session = {
  id: string
  createdAt: string
  testId: string
  kind: string
  variants: string
  tester: string
  email: string
  lang: string
  startedAt: string | null
  finishedAt: string | null
  durationMin: number | null
  /** 各版本 run(single 也 normalize 成 1 個)。 */
  runs: VariantRun[]
  /** 整場平均成功率(各 run rate 平均)。 */
  overallRate: number
  conclusion: string
  raw: UTRow
}
