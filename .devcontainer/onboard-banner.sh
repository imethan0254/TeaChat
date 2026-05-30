#!/usr/bin/env bash
# Codespaces onboard banner — fork user 一打開 terminal 看到的具體指引
# Per 2026-05-29 user directive「真的無法自動化的要有具體的言簡意賅的中文明確引導」

cat <<'BANNER'

╭─────────────────────────────────────────────────────────────╮
│                                                             │
│   🎉 Codespaces 環境 ready!                                  │
│   已自動裝:Node 22 + gh CLI + jq + Claude Code + netlify    │
│           + npm dependencies(全 workspaces)                │
│                                                             │
╰─────────────────────────────────────────────────────────────╯

下一步(依序 3 step,約 5 分鐘):

  ① 啟動 Claude Code(governance hooks 全 fire)
     $ claude

  ② Claude 內裝 plugin(2 條 slash command,30 秒 copy-paste)
     /plugin marketplace add github:ajenchen/design-system
     /plugin install design-system@qijenchen-ds

  ③ Setup Netlify(OAuth + 30 秒 dashboard 設密碼)
     $ npm run setup:netlify
     → 跟著 script 印的 dashboard URL 設 Basic Password

之後寫 code:
  $ npm run create-app <kebab-name>   # 開新 product app
  $ npm run storybook                  # localhost:6006 看視覺

詳:README.md "Template Usage" 段 + CLAUDE.md "🚀 Fork-and-go onboarding"

BANNER
