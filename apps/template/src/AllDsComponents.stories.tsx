// @anatomy-exempt: import smoke test 用,非 production layout
/**
 * AllDsComponents.stories.tsx — DS public API import + minimal-render smoke(per user 2026-05-27)
 *
 * Strategy:
 *   (a) Import 60+ public component identifiers → tsc 自驗 export 存在
 *   (b) Render 簡單 default API 的子集
 *   (c) Playwright probe verify 全部 render + 0 console error
 */

import type { Meta, StoryObj } from '@storybook/react'
import * as DS from '@qijenchen/design-system'

// 對齊 DS dist/index.d.ts(2026-05-27 actual exports verify)
const allDsExports = {
  // Components(actual public names per .d.ts)
  Accordion: DS.Accordion, AccordionContent: DS.AccordionContent, AccordionItem: DS.AccordionItem, AccordionTrigger: DS.AccordionTrigger,
  Alert: DS.Alert,
  AppShell: DS.AppShell,
  AspectRatio: DS.AspectRatio,
  Avatar: DS.Avatar,
  Badge: DS.Badge,
  Breadcrumb: DS.Breadcrumb,
  BulkActionBar: DS.BulkActionBar,
  Button: DS.Button,
  Calendar: DS.Calendar,
  Carousel: DS.Carousel,
  ChartContainer: DS.ChartContainer, ChartTooltip: DS.ChartTooltip, ChartLegend: DS.ChartLegend,
  Checkbox: DS.Checkbox,
  Chip: DS.Chip,
  CircularProgress: DS.CircularProgress,
  Coachmark: DS.Coachmark,
  Combobox: DS.Combobox,
  Command: DS.Command,
  DataTable: DS.DataTable,
  DateGrid: DS.DateGrid,
  DatePicker: DS.DatePicker,
  DescriptionList: DS.DescriptionList,
  Dialog: DS.Dialog,
  DropdownMenu: DS.DropdownMenu,
  Empty: DS.Empty,
  Field: DS.Field,
  FieldControlGroup: DS.FieldControlGroup,
  FileItem: DS.FileItem,
  FileUpload: DS.FileUpload,
  FileViewer: DS.FileViewer,
  HoverCard: DS.HoverCard,
  Input: DS.Input,
  LinkInput: DS.LinkInput,
  MenuItem: DS.MenuItem, MenuGroup: DS.MenuGroup, MenuFooter: DS.MenuFooter,
  NameCard: DS.NameCard,
  Notice: DS.Notice,
  NumberInput: DS.NumberInput,
  OverflowIndicator: DS.OverflowIndicator,
  PeoplePicker: DS.PeoplePicker,
  Popover: DS.Popover,
  ProgressBar: DS.ProgressBar,
  RadioGroup: DS.RadioGroup,
  Rating: DS.Rating,
  ScrollArea: DS.ScrollArea,
  SegmentedControl: DS.SegmentedControl,
  Select: DS.Select,
  SelectMenu: DS.SelectMenu,
  SelectionItem: DS.SelectionItem,
  Separator: DS.Separator,
  Sheet: DS.Sheet,
  Sidebar: DS.Sidebar, SidebarTrigger: DS.SidebarTrigger,
  Skeleton: DS.Skeleton,
  Slider: DS.Slider,
  Steps: DS.Steps,
  Switch: DS.Switch,
  Tabs: DS.Tabs,
  Tag: DS.Tag,
  Textarea: DS.Textarea,
  TimePicker: DS.TimePicker,
  toast: DS.toast, Toaster: DS.Toaster,
  Tooltip: DS.Tooltip, TooltipContent: DS.TooltipContent, TooltipTrigger: DS.TooltipTrigger,
  TreeView: DS.TreeView,
  // Patterns
  ItemAvatar: DS.ItemAvatar, ItemIcon: DS.ItemIcon, ItemLabel: DS.ItemLabel, ItemPrefix: DS.ItemPrefix, ItemSuffix: DS.ItemSuffix,
}

const exportNames = Object.keys(allDsExports)
const definedCount = Object.values(allDsExports).filter(v => v !== undefined).length

const meta: Meta = {
  title: 'Apps/template/All DS Components',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

export const ImportSmoke: Story = {
  name: '全 DS 元件 import + 預設 render smoke',
  render: () => (
    <div className="p-6 space-y-6" data-testid="all-ds-components">
      <h1 className="text-h3">All DS Components Smoke Test</h1>
      <p className="text-body" data-testid="import-count">
        Import resolved:{' '}
        <span data-testid="defined-count">{definedCount}</span>/
        <span data-testid="total-count">{exportNames.length}</span> DS public exports
      </p>

      <section data-testid="render-subset">
        <h2 className="text-h4 mb-2">Render(default-prop subset)</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <DS.Avatar alt="Test" color="blue" />
          <DS.ItemAvatar alt="Item" color="green" />
          <DS.Button>Primary</DS.Button>
          <DS.Button variant="secondary">Secondary</DS.Button>
          <DS.Button variant="text">Text</DS.Button>
          <DS.Separator orientation="vertical" className="h-6" />
          <DS.ItemLabel>Item label</DS.ItemLabel>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4 max-w-2xl">
          <DS.Input placeholder="Input" />
          <DS.Textarea placeholder="Textarea" rows={2} />
          <DS.Checkbox />
          <DS.Switch />
          <DS.Skeleton className="h-4 w-32" />
          <DS.ProgressBar value={60} />
        </div>
      </section>

      <p className="text-caption text-fg-muted mt-6">
        每元件 prop API + variants 完整稽核 → DS Storybook(<a href="https://ajenchen.github.io/design-system/">link</a>)。
      </p>
    </div>
  ),
}
