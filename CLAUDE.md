# Product Workspace — Claude Code Instructions

## 🛑 第 −1 步:Plugin install BLOCKER(2026-05-26 anchor — 沒裝 = 視覺跑版 + AI 憑記憶寫 mock)

**Claude 開啟本 repo 第一件事(沒裝 plugin 不准動 production code)**:

```bash
/plugin marketplace add github:ajenchen/design-system
/plugin install design-system@qijenchen-ds
```

**沒裝後果**(2026-05-26 anchor case):
- 41 個 DS governance hooks 全部不 fire(M29 anchor preflight / approval-preflight / SSOT propagation 全失效)
- AI 寫 `apps/template/src/App.tsx` 憑記憶寫 simplified mock(漏 SidebarTrigger / collapsible / startIcon / tooltip / footer)
- 視覺直接跑版 + 互動破損(menu toggle 不見 / sidebar 收不起來)

**自動 detect**:`npm install` 後跑 `scripts/check-plugin-installed.mjs` 印紅色 warning(不 exit 1 避免擋 CI);DS-side SessionStart hook `check_fork_user_plugin_install.sh` 二次攔截(plugin 裝完後自帶)。

---

## 🚨 第 0 步:Cross-load DS canonical(Claude 開啟本 repo 第二件事必做)

**Why**:本 repo 消費 `@qijenchen/design-system`。DS 設計原則 / M-rules / spec / rules / references 是 **SSOT 在 DS repo**,隨 npm package 自動 ship 到本地 `node_modules/`,**但 Claude 不會自動 cross-load**。

**Claude 開啟本 repo 第一件事(必執行,不可跳)**:

```bash
# Read DS canonical(SSOT,every session)
@node_modules/@qijenchen/design-system/CLAUDE.md
@node_modules/@qijenchen/design-system/ds-canonical/rules/meta-patterns.md
```

Plus on-demand 讀 `ds-canonical/` 內:
- `rules/` — 31 M-rules + ui-development / spec-rules / story-rules / self-verify
- `references/` — naming-conventions / ssot-consultation / tailwind-gotchas / props-naming 等 SSOT lookup tables
- `skills/` — 22 skills(/prototype / /component-quality-gate / /codify-corrections 等)— via plugin install 也 expose

→ **DS canonical 永遠是 SSOT,本 repo 規則只 extend / override consumer-specific 部分**。

---

## 🚀 Fork-and-go onboarding(Claude 自動執行流程)

Fork 本 repo 後,user 用 Claude 開啟,Claude **必依以下順序**做 painless onboarding:

| Step | Action | Why |
|---|---|---|
| 0 | Cross-load DS canonical(見上)| 拿 design SSOT |
| 1 | `npm install` | 拉 `@qijenchen/design-system` + `@qijenchen/storybook-config` npm deps + DS canonical 隨 npm 落地 |
| 2 | `/plugin marketplace add github:ajenchen/design-system` | 拿 DS governance plugin(22 skills / 38 hooks 自動下載) |
| 3 | `/plugin install design-system` | 啟動 plugin |
| 4 | `npm run setup:netlify` | Netlify CLI 自動 enable Identity + restrict access + invite team |
| 5 | `npm run create-app <new-app-name>`(若需新 product app) | copy `template/` → 新 app folder |
| 6 | `npm run storybook` 本地 verify | 確認 DS components 視覺正確 |
| 7 | Push main → Netlify auto-deploy + Storybook auto-rebuild | done |

---

## 🔄 Daily dev workflow(SSOT auto-sync)

| 事件 | 自動發生什麼 |
|---|---|
| DS publish 新 beta | Dependabot daily(`.github/dependabot.yml`)+ `sync-design-system.yml` repository_dispatch → 本 repo 自動 bump deps + commit |
| Plugin / skills / hooks 更新 | User 偶爾跑 `/plugin marketplace update` 拿最新 |
| 你寫 product code | Plugin hooks 自動 enforce SSOT(import DS internals 攔截 / canonical drift 警告 / story 規範等) |
| Push main | `audit.yml` tsc + lint:imports + build / `deploy.yml` apps Netlify / Storybook netlify.toml auto-rebuild |

---

## 📐 Consumer canonical(本 repo specific)

1. **禁** import DS internals(`@qijenchen/design-system/src/...` or `/dist/...`)— 用 public surface only。Hook + `npm run lint:imports` 攔。
2. **禁** 修 `node_modules/@qijenchen/design-system/` — 有需求 file PR 回 DS repo,不在 product workspace fork。
3. 每新 app(`npm run create-app <name>`)務必走 `template/`(已配 AppShell + Sidebar + globals.css + storybook 標準 import)。
4. App-level CSS 只 extend / override,**不重寫** DS tokens(`--color-*` / `--space-*` 等)。
5. **App.tsx 起點走 AppShell + Sidebar**,不從孤立 Button 開始(per `template` 範例)。

---

## 📚 Storybook 用途分工

- **DS repo Storybook**(<https://ajenchen.github.io/design-system/>)= DS library 元件 reference docs(public 或 password protected by DS owner)
- **本 repo Storybook**(Netlify deploy,Identity protected)= **真實 product UI demo**(PM / designer / QA 看業務情境)
- Stories 寫 PRODUCT scenarios(不是 DS element trait grid)— DS trait grid 是 DS repo 責任

---

## 🔒 Access control(strict required for Netlify)

**Default = Netlify Identity**(自動 invite,per-user revoke,免費 1000 users)。
- `npm run setup:netlify` 自動跑完(scripts/setup-netlify-access.mjs)
- 或手動 Dashboard:Site → Identity → Enable + Invite-only + Restrict access + Invite users
- `.storybook/manager-head.html` Identity widget 已 codify(fork user 不需動 code)

### 🆘 Claude 引導使用者 — Netlify onboarding(user 不一定知道 Netlify)

**當 user 卡在「不知道該怎麼設定 deploy / Netlify」時,Claude 必依以下話術引導**:

1. **解釋 Netlify 是什麼**(一句話):「Netlify 是免費 deploy 平台(類似 Vercel),用來自動跑 Storybook + 給 team 看內部 product UI。Free tier 1000 user / 100GB bandwidth / 0 maintenance」
2. **沒帳號?GitHub 1-click 自動建**:「因為你 fork 本 repo 必有 GitHub 帳號,Netlify 走 GitHub OAuth — 跑 `npm run setup:netlify` Step 2 會開瀏覽器,點『Continue with GitHub』 → GitHub 授權 1 click → Netlify 自動用你的 GitHub identity 建帳號,< 5 秒搞定,**不需要 separate sign up**」
3. **不會用 CLI 怎麼辦?**「全程互動式問答(輸入 team email 邀請即可),script 內 step-by-step echo 你下一步該做什麼」
4. **怕設錯權限?**「script 預設 visitor_access=private(只有 invited team 可看)+ 雙保險 netlify.toml `X-Robots-Tag noindex`(Google 不收錄)」
5. **Setup 失敗 fallback**「告訴 user 去 https://app.netlify.com/sites/<your-site>/settings/identity 手動 enable Identity + restrict access + invite users。詳 `netlify.toml` 註解」
6. **驗證 deploy 成功**「push main 後 2-3 min,Netlify Dashboard `Deploys` tab 變綠勾 = OK。Site URL = `https://<site-name>.netlify.app`」
7. **GitHub CLI 未 login?**「Setup script Step 0 會偵測 `gh auth status`,若 user 沒 login 會建議先跑 `gh auth login`(瀏覽器 OAuth,1 分鐘)— 這樣 Netlify 連 fork repo 才能順利讀 push event auto-deploy」

**OAuth security 本質**:Netlify 不能完全 headless 自動建 user 帳號(OAuth 必 user 在瀏覽器 click「Authorize」)。**最自動化 = 2 clicks**(Continue with GitHub + Authorize Netlify GitHub App)。Script 自動處理其他 5 步。

### 🚦 真實「斷點」清單(2026-05-26 verified — 哪些真不能自動,哪些其實可以)

| # | 斷點 | 可自動? | 設計選擇 |
|---|---|---|---|
| 1 | Plugin install slash command | ❌ Claude Code architecture 不允許 AI type slash 給自己 | Postinstall warning 直印 2 行 copy-paste,user 30 秒搞定 |
| 2 | `netlify login` OAuth | ❌ OAuth security 強制 user 在瀏覽器 click「Authorize」 | gh auth pre-check + 解釋「Continue with GitHub 1 click」 |
| 3 | `netlify init` site 建立 + 選擇 | ✅ **已自動**(2026-05-26 enhance):`netlify sites:create` + `netlify link` auto-run,site name = `<gh-user>-<repo>` |
| 4 | Team email invite | ✅ **已自動**(2026-05-26 enhance):設 `NETLIFY_TEAM_EMAILS` env var(or `.env`)→ skip prompt;or `npm run setup:netlify -- --skip-invite` 完全跳過 |
| 5 | Push main 觸發 production | ❌ **設計上 user gate**(Git solo-work canonical 鐵律 — user「OK / 合 main」trigger 才推 main,讓 user 在 preview 驗完才 ship) | 不修;是設計選擇不是 bug |

→ **真斷點剩 2 個(plugin install + OAuth),都是「外部 architecture / security」不可繞**。 onboarding 流程約 3-5 分鐘(2 個 click + 等網路)。

### 📋 Frictionless onboarding modes

**互動模式**(預設):
```
npm install                        # postinstall warning + 41 deps install
# (Claude session) /plugin marketplace add github:ajenchen/design-system
# (Claude session) /plugin install design-system@qijenchen-ds
npm run setup:netlify              # 互動 prompt 問 team emails
```

**Zero-prompt 模式**(CI / 老手 user):
```
echo "NETLIFY_TEAM_EMAILS=alice@x.com,bob@y.com" > .env
npm install
npm run setup:netlify -- --skip-invite   # OR 設 .env 走 NETLIFY_TEAM_EMAILS auto-invite
```

**Claude DO NOT**:假設 user 已知 Netlify / 跳過 onboarding 直接寫 code / 沒解釋就要 user 跑 setup 命令 / 嘗試「fully headless 註冊」(OAuth security violation,做不到)。

---

## ✅ Compliance check(永遠合規 + 永遠 SSOT 機制)

Plugin install 後自動執行的合規 gate(逐 phase):

| Phase | Gate | 自動 trigger |
|---|---|---|
| Edit time | Hook `check_substantive_edit_approval_preflight.sh` | Pre-write 攔 SSOT-affecting edit 需 user approval |
| Edit time | Hook `check_ssot_consultation.sh` / `auto_regen_ds_barrel.sh` | 偵 import / canonical drift |
| Pre-commit | `audit-content-quality.mjs` | DS spec 一致性 |
| CI(push)| `audit.yml` tsc + lint:imports + build | 攔語法 / 邊界 |
| Pre-deploy | Storybook smoke + visual baseline(via DS repo CI) | 視覺 drift |
| 季度 / 大改 | `/design-system-audit --deep` skill | 56 dim 全掃 |

→ **Claude 寫 code 時 plugin hooks 自動 fire,user 不必每次提醒,違規 = 立即 BLOCKER**。

---

## 🗂 Task navigation

| 任務 | 走法 |
|------|-------|
| 建新 product UI / 開新 page | `/prototype` skill(走 DS plugin)|
| 元件用法問題 | DS Storybook URL OR `node_modules/@qijenchen/design-system/dist/index.d.ts` types |
| App 完成要 ship | `/component-quality-gate` skill → review → push main |
| Bug fix | 查 DS spec(`ds-canonical/`)+ grep 本 repo apps/* 既有用法,**不發明新 pattern** |
| 新 product | `npm run create-app <name>` |
| 升 DS 版本 | Dependabot auto-PR / `npm update @qijenchen/design-system` |

---

## Stack

Vite + React 19 + TypeScript + Tailwind v4 + Storybook 8.6 + `@qijenchen/design-system@beta`.

## CI

- `audit.yml` — tsc + lint:imports + build per push/PR
- `deploy.yml` — `apps/template/dist` per-app Netlify(需 NETLIFY_AUTH_TOKEN + NETLIFY_SITE_ID_TEMPLATE secrets)
- `netlify.toml` — Storybook Netlify Git integration(無需 secret,直接讀 build command + access headers)
- `sync-design-system.yml` — Dependabot daily + repository_dispatch(DS release 自動 bump deps)
