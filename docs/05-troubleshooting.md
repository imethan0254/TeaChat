# Troubleshooting

常見問題 + fix。

## Install / Build

| 症狀 | 修法 |
|---|---|
| `npm ci` ERESOLVE peer dep | 加 `--legacy-peer-deps`(`.npmrc` 已配)|
| `Failed to resolve "lucide-react"` | DS beta.10 以前 peerDep bug,升 `@qijenchen/design-system@beta` 拿 beta.13+ 修 |
| `Failed to resolve "react-is"` | DS beta.10 以前 transitive peer 漏,升 beta.13+ |
| `npm run build` TS5062 path substitution | Root tsconfig 不要 paths 用 `*`,per-app tsconfig 才宣告 `@/*: ./src/*` |
| Tailwind class 不生效(Button 純文字無樣式)| globals.css 漏 `@source '../node_modules/@qijenchen/design-system/src/**/*'` directive |

## Render

| 症狀 | 修法 |
|---|---|
| iconOnly Button 卡 / warn | App root 缺 `<TooltipProvider>` |
| Sidebar selection 行為怪 | 用 `<SidebarProvider activeId={...}>` 不要 `isActive` prop |
| Dark mode 不切 | `<html data-theme="dark">`(attribute 不是 class)|
| Dialog content 空 | Dialog 需 `<DialogPrimitive.Trigger>` 或 `open` prop |
| Chart 不 render(width(-1) warning)| Chart container 要 explicit width / height(或 aspect ratio)|

## Claude session

| 症狀 | 修法 |
|---|---|
| `/design-system-audit` 等 skills 沒出現 | 跑 `npx qijenchen-ds-init` → 重啟 Claude session |
| DS hooks 沒 fire | 確認 `.claude/design-system/hooks/` symlink 存在(`ls -la .claude/`) |
| CLAUDE.md instructions 沒 load | `CLAUDE.design-system.md` symlink 在 cwd(`ls -la CLAUDE*`) |

## Netlify deploy

| 症狀 | 修法 |
|---|---|
| Deploy 404 | 第一次 deploy 還沒成功 → 看 Netlify build log debug |
| ERESOLVE during deploy | `.npmrc` legacy-peer-deps=true 已配,確認 file 在 repo root |
| Build 過但 site 純白 | SPA root `<div id="root">` 沒 hydrate,看 console JS error(F12)|

## Misc

| 症狀 | 修法 |
|---|---|
| `npm run lint:imports` 報內部路徑 | 改 import 為 top barrel `from '@qijenchen/design-system'` |
| 改 DS 想 fix bug 怎麼辦? | **不改 node_modules**。Open issue / PR to `ajenchen/design-system` repo |
| 找不到某 component | Storybook https://ajenchen-design-system.netlify.app/ 全覽 |

## Get help

- DS Storybook: https://ajenchen-design-system.netlify.app/
- DS repo issues: https://github.com/ajenchen/design-system/issues
- Claude session `/help` 列 skills
