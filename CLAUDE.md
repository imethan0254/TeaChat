# Product Workspace — Claude Code Instructions

## 🛑 第 −1 步:Plugin install BLOCKER(2026-05-26 anchor — 沒裝 = 視覺跑版 + AI 憑記憶寫 mock)

**Claude 開啟本 repo 第一件事(沒裝 plugin 不准動 production code)**:

```bash
/plugin marketplace add github:ajenchen/design-system
/plugin install design-system@qijenchen-ds
```

**沒裝後果**(2026-05-26 anchor case):
- 41 個 DS governance hooks 全部不 fire(M29 anchor preflight / approval-preflight / SSOT propagation 全失效)
- AI 寫 `apps/_template/src/App.tsx` 憑記憶寫 simplified mock(漏 SidebarTrigger / collapsible / startIcon / tooltip / footer)
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
| 5 | `npm run create-app <new-app-name>`(若需新 product app) | copy `_template/` → 新 app folder |
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
3. 每新 app(`npm run create-app <name>`)務必走 `_template/`(已配 AppShell + Sidebar + globals.css + storybook 標準 import)。
4. App-level CSS 只 extend / override,**不重寫** DS tokens(`--color-*` / `--space-*` 等)。
5. **App.tsx 起點走 AppShell + Sidebar**,不從孤立 Button 開始(per `_template` 範例)。

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
- `deploy.yml` — `apps/_template/dist` per-app Netlify(需 NETLIFY_AUTH_TOKEN + NETLIFY_SITE_ID_TEMPLATE secrets)
- `netlify.toml` — Storybook Netlify Git integration(無需 secret,直接讀 build command + access headers)
- `sync-design-system.yml` — Dependabot daily + repository_dispatch(DS release 自動 bump deps)
