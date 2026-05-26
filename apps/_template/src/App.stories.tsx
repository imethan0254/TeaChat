// 2026-05-26 example stories per user 「product-workspace 不是應該用 storybook 來 demo 產品嗎」directive。
// Consumer app stories demonstrate REAL product UI composition consuming `@qijenchen/design-system` components.
// 對齊 product workflow:designer/PM 走 product-workspace Storybook 看真實 product UI(non-DS-library docs),
// 同時 a11y / docs / controls / DS Devmode addons 才有作用。

import type { Meta, StoryObj } from '@storybook/react'
import App from './App'

const meta: Meta<typeof App> = {
  title: 'Apps/_template/App',
  component: App,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '`_template` 是 fork product-workspace 後的起始 app skeleton。Consumer 替換 `App.tsx` 為真實產品 UI,但保持 stories 同步寫(讓 a11y / controls / docs 等 addons 有 surface)。',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof App>

export const Default: Story = {
  name: '預設',
}
