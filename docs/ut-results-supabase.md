# 把 UT 測試結果自動匯集到 Supabase + 出大總結

測試到摘要頁時,引擎會自動把每位受測者的**結構化結果** POST 到 Supabase 一張表,讓你集中批次分析。
(螢幕錄影 webm 太大不在此範圍 —— 那是另接檔案儲存的第二階段。)

---

## 一、建 Supabase 專案 + 資料表(一次性)

1. 到 [supabase.com](https://supabase.com) 用 GitHub 登入 → **New project**(免費 tier 即可,選離你近的 region)。
2. 左側 **SQL Editor** → 貼上並執行:

```sql
create table public.ut_results (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  test_id     text,        -- 測試 id(project.id)
  kind        text,        -- 'single' | 'combined'
  variants    text,        -- 'A' 或 'A,B,C'
  tester      text,        -- 受測者工號姓名
  lang        text,        -- 'zh' | 'en'
  started_at  timestamptz,
  finished_at timestamptz,
  result      jsonb        -- 完整結果(成敗 / SEQ / 問卷 / 逐字稿 / false-easy)
);

-- 開 RLS,只允許「匿名 anon 寫入」、不允許讀 → anon key 外洩也只能寫不能偷看別人資料。
alter table public.ut_results enable row level security;
create policy "anon insert only" on public.ut_results
  for insert to anon with check (true);
-- 故意不建 select policy:你自己用 Dashboard / service role 看資料即可。
```

3. 左側 **Project Settings → API**,複製兩個值:
   - **Project URL**(像 `https://abcdefgh.supabase.co`)
   - **anon public** key

---

## 二、填進 repo(一次性)

編輯 `apps/chat/src/ut/utSubmit.ts`,把剛剛兩個值貼進去:

```ts
const SUPABASE_URL = 'https://abcdefgh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGci...(你的 anon public key)'
```

> anon key 設計上可公開(配上面的 RLS insert-only 才安全),所以放進 repo 沒問題。
> 兩者留空 = 不上傳,維持原本本地匯出。

push main → Netlify 重新 deploy 後即生效。之後每位受測者跑完,摘要頁會自動 insert 一列,並跳「結果已上傳」toast。

---

## 三、看資料 + 出大總結

**看原始資料**:Supabase → **Table editor → ut_results**(每列一位受測者一場)。
但明細(email / 答題 / SEQ / 逐字稿 / 結論)全塞在最後一欄 `result`(jsonb)裡,不是獨立欄位。
要把它們攤成正常欄位、或依測試 / 版本分開看,建議用下面的 **view**(建一次,之後自動跟著新資料更新)。

### 3-1 把 result 攤平成欄位(全測試共用)

SQL Editor 跑一次,左側就會多一個 `ut_results_flat`(眼睛圖示 = view),打開即看到 email 等欄位:

```sql
create or replace view public.ut_results_flat as
select
  id, created_at, test_id, kind, variants,
  tester                as 姓名,
  result->>'email'      as email,
  lang,
  started_at, finished_at,
  round(extract(epoch from (finished_at - started_at))/60, 1) as 耗時分鐘,
  result->>'conclusion' as 結論,
  result                as 完整結果
from public.ut_results;
```

### 3-2 各測試分開一個 view(像不同表)

```sql
-- 只看 message-area-width
create or replace view public.ut_message_area_width as
select created_at, variants, tester as 姓名, result->>'email' as email, lang,
       round(extract(epoch from (finished_at - started_at))/60, 1) as 耗時分鐘,
       result->>'conclusion' as 結論, result as 完整結果
from public.ut_results
where test_id = 'message-area-width'
order by created_at desc;

-- 只看 chat-list-preview
create or replace view public.ut_chat_list_preview as
select created_at, variants, tester as 姓名, result->>'email' as email, lang,
       round(extract(epoch from (finished_at - started_at))/60, 1) as 耗時分鐘,
       result->>'conclusion' as 結論, result as 完整結果
from public.ut_results
where test_id = 'chat-list-preview'
order by created_at desc;
```

> 多一個測試就照樣複製一段、改 `where test_id = '...'` 與 view 名稱即可。

### 3-3 依 variants 彙總(group by)

```sql
create or replace view public.ut_by_variants as
select test_id, variants,
       count(*)                                                         as 受測人次,
       round(avg(extract(epoch from (finished_at - started_at))/60), 1) as 平均耗時分鐘,
       min(created_at) as 最早, max(created_at) as 最近
from public.ut_results
group by test_id, variants
order by test_id, variants;
```

### 3-4 各版本 / 各任務成功率(combined 測試,進階)

combined 測試的成功率藏在 `result->'runs'` 陣列、每個 run 的 `outcomes` 再藏每題成敗,
要 unnest 兩層 jsonb 才能算。下面兩個 view 直接幫你攤好:

```sql
-- 各測試 × 各版本的整體平均成功率(每個 run 的 rate 平均)
create or replace view public.ut_variant_rate as
select r.test_id,
       run->>'variant'                     as variant,
       count(*)                            as 場次,
       round(avg((run->>'rate')::numeric)) as 平均成功率
from public.ut_results r,
     jsonb_array_elements(r.result->'runs') as run
where r.kind = 'combined'
group by r.test_id, run->>'variant'
order by r.test_id, variant;

-- 各測試 × 各版本 × 各任務的成功率(最細,找出哪個版本哪一題卡關)
create or replace view public.ut_task_success as
select r.test_id,
       run->>'variant'                                                                  as variant,
       outcome->>'id'                                                                   as task_id,
       count(*)                                                                         as 受測人次,
       count(*) filter (where outcome->>'result' = 'success')                           as 成功數,
       round(100.0 * count(*) filter (where outcome->>'result' = 'success') / count(*)) as 成功率
from public.ut_results r,
     jsonb_array_elements(r.result->'runs')   as run,
     jsonb_array_elements(run->'outcomes')    as outcome
where r.kind = 'combined'
group by r.test_id, run->>'variant', outcome->>'id'
order by r.test_id, variant, task_id;
```

### 3-5 匯出給 Claude 出質化總結

```sql
-- 看某測試的所有逐字稿 + 開放題(匯出給 Claude 用)
select tester, lang, result
from ut_results
where test_id = 'chat-list-preview'
order by created_at desc;
```

> view 都是即時的:`ut_results` 之後新增資料,所有 view 自動跟著更新,不用重建;
> 要改欄位重跑一次對應的 `create or replace view ...` 覆蓋即可。

**質化大總結(用 Claude)**:
1. 在 Supabase 把該測試的 rows **Export → CSV**(或上面 SQL 結果)。
2. 丟給 Claude:「這是 N 位受測者的 UT 結果,幫我歸納:① 各版本量化差異 ② 共同痛點/正面回饋主題 ③ false-easy(自覺容易卻失敗)的任務代表什麼 ④ 給設計的建議。」
3. 得到整批的質化 + 量化大總結。

---

## 四、提醒

- **個資**:`tester`(工號姓名)+ 逐字稿屬個資。測試說明頁已可加「結果將回傳供研究分析」告知;資料存在你的 Supabase 專案內,自行控管存取。
- **要連螢幕錄影也集中**:webm 需另接檔案儲存(Supabase **Storage** bucket / Google Drive),把上傳的 URL 也寫進 result —— 那是第二階段,需要時再做。
- **多個測試共用同一張表**:用 `test_id` 區分即可,不用每個測試各建表。
