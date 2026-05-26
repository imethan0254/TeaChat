// Example:product 自己 wrap DS Button 加業務語意。Storybook 是 PM / designer / QA 看「真實產品 UI」的 surface,
// 不是 DS library reference doc(那個 DS repo 的 Storybook 有);兩者各有目的。
//
// Per user 2026-05-26「product-workspace 應該用 storybook 來 demo 產品嗎?那些 addon 才有屁用啊」directive:
// Consumer apps 必須寫 stories 才讓 a11y / docs / controls 等 addons 有作用。

import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '@qijenchen/design-system'

// Consumer wrap example:商品結帳按鈕
function CheckoutButton({ amount, onCheckout }: { amount: number; onCheckout?: () => void }) {
  return (
    <Button variant="primary" size="md" onClick={onCheckout}>
      結帳 NT$ {amount.toLocaleString()}
    </Button>
  )
}

const meta: Meta<typeof CheckoutButton> = {
  title: 'Apps/_template/ProductButton',
  component: CheckoutButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '示範 consumer 如何 wrap DS `<Button>` 加業務語意(formatter / event handler / 命名)。Story args 可 inspect 不同金額情境。',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    amount: { control: { type: 'number', min: 0, step: 100 } },
  },
  args: {
    amount: 1280,
    onCheckout: () => console.log('checkout clicked'),
  },
}

export default meta
type Story = StoryObj<typeof CheckoutButton>

export const Default: Story = {
  name: '預設(NT$1,280)',
}

export const LargeAmount: Story = {
  name: '大金額(NT$120,500)',
  args: { amount: 120500 },
}

export const Zero: Story = {
  name: '0 元(邊界值)',
  args: { amount: 0 },
}
