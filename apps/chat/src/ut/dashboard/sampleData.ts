// 離線預覽用假資料 —— 結構完全比照 @imethan0254/ut-model-a 送到 Supabase 的 combined payload。
// 只給 Storybook「Preview(離線)」story 與本地視覺驗證用;正式站台走 Netlify function 讀真資料。
import type { UTRow } from './types'

function combinedResult(email: string, conclusion: string, rates: [number, number, number]) {
  const variants = ['A', 'B', 'C']
  const labels = ['版本 A:列表顯示訊息預覽', '版本 B:精簡列表(不顯示訊息預覽)', '版本 C:精簡列表 + 字母頭像']
  return {
    email,
    conclusion,
    thinkAloud: '受測者多次提到列表資訊密度與未讀標記的可辨識度。',
    runs: variants.map((v, i) => {
      const rate = rates[i]
      const outcomes = [
        { id: 't1', title: '用搜尋找到並開啟指定聊天室', result: (rate >= 50 ? 'success' : 'fail') as 'success' | 'fail' },
        { id: 't2', title: '找出有未讀訊息的聊天室並進入', result: (rate >= 75 ? 'success' : 'fail') as 'success' | 'fail' },
        { id: 't3', title: '把任一聊天室設為靜音', result: 'success' as const },
        { id: 't4', title: '開啟討論串並回覆一句話', result: (rate >= 100 ? 'success' : 'fail') as 'success' | 'fail' },
      ]
      const success = outcomes.filter((o) => o.result === 'success').length
      return {
        variant: v,
        variantLabel: labels[i],
        rate,
        successCount: success,
        total: outcomes.length,
        outcomes,
        transcript: `(${v})「嗯…我先找搜尋列。」「這個未讀點點有點小。」「靜音在右鍵選單裡。」`,
        taskSurveys: outcomes.map((o) => ({
          taskId: o.id,
          taskTitle: o.title,
          answers: [
            { questionId: 'seq', questionType: 'singleEase' as const, prompt: '整體而言,這個任務有多容易或多困難?', value: Math.max(2, Math.round(rate / 20)), scaleMax: 7 },
            { questionId: 'comment', questionType: 'writtenResponse' as const, prompt: '想補充說明嗎?', value: o.result === 'fail' ? '找了一下才找到,不太直覺。' : '' },
          ],
        })),
        falseEasy: [],
      }
    }),
    postTest: [
      { questionId: 'preview-pref', questionType: 'writtenResponse' as const, prompt: '你比較喜歡有顯示還是不顯示訊息預覽?', value: '偏好 A,有預覽比較快掃到重點。' },
    ],
  }
}

export const sampleRows: UTRow[] = [
  {
    id: '595c1f9c-69a4-4b6e-0001',
    created_at: '2026-06-29T05:27:39.903Z',
    test_id: 'chat-list-preview',
    kind: 'combined',
    variants: 'A,B,C',
    tester: '綾小路文麿',
    lang: 'zh',
    started_at: '2026-06-29T05:22:57.012Z',
    finished_at: '2026-06-29T05:26:43.234Z',
    result: combinedResult('ayanokoji@abc.com', '版本 A(顯示訊息預覽)任務成功率最高:100%,整體易用性表現最佳。', [100, 75, 75]),
  },
  {
    id: '8d550a4b-05dc-0002',
    created_at: '2026-06-28T14:35:04.384Z',
    test_id: 'chat-list-preview',
    kind: 'combined',
    variants: 'A,B,C',
    tester: '陳裕升',
    lang: 'zh',
    started_at: '2026-06-28T14:33:45.439Z',
    finished_at: '2026-06-28T14:34:58.752Z',
    result: combinedResult('chen@abc.com', '版本 A 與 C 並列較高;B 精簡列表在搜尋任務略吃虧。', [75, 50, 75]),
  },
  {
    id: 'b8dcdc4e-ee68-0003',
    created_at: '2026-06-30T03:04:15.103Z',
    test_id: 'chat-list-preview',
    kind: 'combined',
    variants: 'A,B,C',
    tester: 't',
    lang: 'zh',
    started_at: '2026-06-30T03:02:28.738Z',
    finished_at: '2026-06-30T03:04:07.675Z',
    result: combinedResult('t@abc.com', '三版差異不大,建議再補受測人數。', [75, 75, 50]),
  },
  {
    id: 'aa11bb22-0004',
    created_at: '2026-06-20T09:10:00.000Z',
    test_id: 'message-area-width',
    kind: 'combined',
    variants: 'A,B',
    tester: '王小明',
    lang: 'zh',
    started_at: '2026-06-20T09:05:00.000Z',
    finished_at: '2026-06-20T09:12:00.000Z',
    result: {
      email: 'wang@abc.com',
      conclusion: '較寬版面在長訊息閱讀上略優。',
      thinkAloud: '受測者提到寬版比較好讀但需要更多水平掃視。',
      runs: [
        {
          variant: 'A', variantLabel: '版本 A:寬版面', rate: 100, successCount: 2, total: 2,
          outcomes: [
            { id: 't1', title: '閱讀並找出指定段落', result: 'success' },
            { id: 't2', title: '複製一段文字', result: 'success' },
          ],
          transcript: '(A) 這個寬度看起來蠻舒服的。',
          taskSurveys: [
            { taskId: 't1', taskTitle: '閱讀並找出指定段落', answers: [{ questionId: 'seq', questionType: 'singleEase', prompt: '難易度?', value: 6, scaleMax: 7 }] },
          ],
          falseEasy: [],
        },
        {
          variant: 'B', variantLabel: '版本 B:窄版面', rate: 50, successCount: 1, total: 2,
          outcomes: [
            { id: 't1', title: '閱讀並找出指定段落', result: 'success' },
            { id: 't2', title: '複製一段文字', result: 'fail' },
          ],
          transcript: '(B) 窄一點的話字比較集中,但要一直捲動。',
          taskSurveys: [
            { taskId: 't1', taskTitle: '閱讀並找出指定段落', answers: [{ questionId: 'seq', questionType: 'singleEase', prompt: '難易度?', value: 4, scaleMax: 7 }] },
          ],
          falseEasy: [],
        },
      ],
      postTest: [],
    },
  },
]
