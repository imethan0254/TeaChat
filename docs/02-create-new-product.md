# Create New Product App

從 template 生新 product app — 1 command, 自動 setup。

## Generator command

```
npm run create-app <kebab-case-name>
# Example: npm run create-app order-dashboard
```

行為:
1. Copy `apps/template/` → `apps/<name>/`
2. Patch `package.json` name → `@product/<name>`
3. Patch `index.html` title → `<name>`
4. Print next steps

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

## Deploy(per-app Netlify)

1. 開 Netlify → Add new site → Import from Git → `ajenchen/product-workspace`
2. Build settings:
   - Base directory: `apps/<name>`
   - Build command: `npm run build`
   - Publish directory: `apps/<name>/dist`
3. Site ID 記下 → GitHub repo secrets 加 `NETLIFY_SITE_ID_<NAME_UPPERCASE>`
4. `.github/workflows/deploy.yml` 加 1 job(matrix 化)

## 找 DS component 用法

- Storybook: https://ajenchen.github.io/design-system/
- 元件總覽 / 設計規格 / 設計原則 3 層 stories
- Claude session 跑 `/component-quality-gate` audit 你產品 UI 對 DS canonical 對齊度

## Next

→ `docs/03-co-edit-workflow.md` 多人共編 workflow
