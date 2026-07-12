import type { Meta, StoryObj } from '@storybook/react'
import App from './App'

// TeaChat Desktop version — 獨立 prototype,重點展示 Microsoft Teams 風格的 Rich
// editor 輸入功能(RichTextEditor.tsx)。
//
// 網站結構(2026-07-12 user 指定,對齊「Teams 整合」prototype 的 top-search chrome):
// - chrome: 'top-search' → 最左側 NavRail 移除;最頂端改為 universal search bar
//   (置中 search input;最右由右至左為 PersonAvatar → More DropdownMenu)。
//   ChatList 收合時最左出現獨立 CollapsedListRail;search 有關鍵字時整個 Conversation
//   換成全頁 SearchPageView。
// - initialShowPreview: false → chat message preview 預設 OFF。
//
// Rich editor 功能(三處輸入框共用:主輸入框 / Thread panel 輸入框 / chat bubble
// hover → More → Edit 的編輯狀態輸入框):
// - Toggle ON → format toolbar(對齊 Teams 順序):Bold / Italic / Underline /
//   Strikethrough │ Text highlight color / Font color / Font size │ Bulleted list /
//   Numbered list │ Insert link / More(Quote / Code snippet / Horizontal rule /
//   Clear all formatting)
// - Enter 直接送出(list 內 = 換 item)、Shift+Enter 換行
// - 鍵盤清單捷徑:「-」/「*」+空白 → bulleted list;「1.」+空白 → numbered list
// - Link:右鍵 → Edit link / Remove link;Insert link dialog 走 DS Field 規範
//   (必填 * 前綴 + URL 驗證「Invalid URL」)
const meta: Meta<typeof App> = {
  title: 'Apps/chat/TeaChat Desktop version',
  component: App,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj<typeof App>

export const Default: Story = {
  name: 'TeaChat Desktop 預設',
  // top-search chrome(無 NavRail + 頂部 universal search)+ preview 預設 OFF,
  // 對齊「Teams 整合」prototype 的結構。不注入 Teams 匯入房(那是 Teams 整合 demo
  // 的內容主題,本 prototype 專注 Rich editor 展示)。
  render: () => <App config={{ chrome: 'top-search', initialShowPreview: false }} />,
}
