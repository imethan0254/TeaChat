# Create New Product App

從 template 生新 product app — 1 command, 自動 setup。

## Generator command

```
npm run create-app <kebab-case-name>
# Example: npm run create-app order-dashboard
```

行為(`scripts/create-app.mjs`,2026-05-28 全盤 sweep):
1. **Validate name**:kebab-case lowercase / 不可為 `template`(reserved) / 不可 duplicate
2. **Copy** `apps/template/` → `apps/<name>/`(filter callback 排除 `node_modules / dist / storybook-static / .turbo / .next / .cache / tsconfig.tsbuildinfo`)
3. **Patch `package.json`** name → `@product/<name>`
4. **Patch `index.html`** `<title>` → `<name>`
5. **Patch story titles** `*.stories.{tsx,ts,mdx}` 內 `title: 'Apps/template/...'` → `Apps/<name>/...`(防 Storybook duplicate id 與 template 衝突)
6. **REQUIRED file invariant check**:5 critical files(`package.json` / `tsconfig.json` / `vite.config.ts` / `index.html` / `src`)缺一 → error
7. **Safety-net rmSync**:filter 漏抓 dist / tsbuildinfo / storybook-static → 兜底清
8. **Print** Storybook + dev guidance(含 sidebar path `apps-<name>-...`)

## After generation

```
cd apps/<name>
npm run dev        # http://localhost:5173
npm run build      # production build to dist/
npm run typecheck  # tsc no-emit
```

## 第一個 component

`apps/<name>/src/App.tsx` 用 DS:

```tsx
import { Button, Avatar, TooltipProvider } from '@qijenchen/design-system'

export default function App() {
  return (
    <main className="bg-canvas text-foreground p-8">
      <h1 className="text-h2 mb-4">My Product</h1>
      <Button variant="primary">Save</Button>
      <Avatar name="Wendy" />
    </main>
  )
}
```

注意:
- **Top barrel import only**(`from '@qijenchen/design-system'`)
- 禁 import `/src/...`、`/dist/...` 內部路徑(`npm run lint:imports` CI gate 攔)
- 樣式 token(`bg-canvas` / `text-foreground` / `text-h2`)由 globals.css 引入的 DS tokens 提供

## Deploy(自動,無需 secret)

新 app 自動進 Storybook(`netlify.toml:14` `build.command = "npm run build-storybook"`)+ git push main → Netlify auto-rebuild → 可見於 `https://<your-netlify-site>/?path=/story/apps-<name>-...`。

**Fork user 第一次 setup**:
- `npm run setup:netlify`(1 OAuth click)auto-creates site `${ghUser}-${repoName}.netlify.app` + Identity gate
- 之後每 push main → 自動 build + deploy + URL 進 Claude reply(`.claude/hooks/inject_deploy_url_after_push.sh`)

**Per-app standalone deploy**(`apps/<name>/dist` 獨立 site)是 advanced option,需 `NETLIFY_SITE_ID_<NAME_UPPERCASE>` + `.github/workflows/deploy.yml` matrix(legacy approach,通常不用,Storybook 統一展示 OK)。

## 找 DS component 用法

- Storybook: https://ajenchen-design-system.netlify.app/
- 元件總覽 / 設計規格 / 設計原則 3 層 stories
- Claude session 跑 `/component-quality-gate` audit 你產品 UI 對 DS canonical 對齊度

## Next

→ `docs/03-co-edit-workflow.md` 多人共編 workflow
