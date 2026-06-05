// Chat prototype — 3-column messaging UI(Nav rail / Chat list / Conversation)
// 對齊 DS canonical「走 DS primitive composition」+ 視覺 token 全走 DS semantic tokens。
//
// Layout(由左而右):
//   1. Nav rail   — 48px 寬 / 32px icon button / neutral-2 active / Settings modal
//   2. Chat list  — 可拖拉寬度 / 兩種列表樣式(preview toggle)
//   3. Conversation — header / message area / input box

import { useEffect, useRef, useState } from 'react'
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  Button,
  Avatar,
  ProfileCard,
  ProfileCardDefaultActions,
  Badge,
  Separator,
  ScrollArea,
  Textarea,
  Popover,
  PopoverTrigger,
  PopoverContent,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  ResizeHandle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Switch,
} from '@qijenchen/design-system'
import {
  Home,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronRight,
  Users,
  Video,
  Pencil,
  Smile,
  Type,
  Send,
  SmilePlus,
  MessagesSquare,
  Reply,
  Volume2,
  Star,
  ExternalLink,
  AppWindow,
  LogOut,
  Maximize2,
  Settings,
  HelpCircle,
} from 'lucide-react'

// ── 共用 icon button — 32×32px(size="md" iconOnly = h-field-md = 32px in md density) ──
function NavBtn({
  icon,
  label,
  active,
  onClick,
  overlayBadge,
}: {
  icon: React.ComponentProps<typeof Button>['startIcon']
  label: string
  active?: boolean
  onClick?: () => void
  overlayBadge?: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="text"
          size="md"
          iconOnly
          startIcon={icon}
          aria-label={label}
          onClick={onClick}
          overlayBadge={overlayBadge}
          className={active ? '!bg-neutral-selected' : ''}
        />
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}

// Chat list header button — 28×28px(size="sm" iconOnly = h-field-sm = 28px in md density)
function ListBtn({
  icon,
  label,
  onClick,
}: {
  icon: React.ComponentProps<typeof Button>['startIcon']
  label: string
  onClick?: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="text" size="sm" iconOnly startIcon={icon} aria-label={label} onClick={onClick} />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

// Conversation / message area small button
function IconBtnSm({
  icon,
  label,
}: {
  icon: React.ComponentProps<typeof Button>['startIcon']
  label: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="text" size="sm" iconOnly startIcon={icon} aria-label={label} />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

// ── Data model ───────────────────────────────────────────────────────────────
type Presence = 'online' | 'away' | 'busy' | 'offline'
type Color = 'blue' | 'green' | 'purple' | 'magenta' | 'turquoise' | 'indigo' | 'red'

type Person = {
  name: string
  color: Color
  status: Presence
  role: string
  email: string
  avatar: string
}

type Reaction = { emoji: string; count: number }
type Message = {
  id: string
  author: 'me' | string
  text: string
  time: string
  reactions?: Reaction[]
  replies?: number
}

type Room = {
  id: string
  type: 'dm' | 'general'
  title: string
  section: 'favorites' | 'chats'
  unread: boolean
  person?: Person
  memberKeys?: string[]
  messages: Message[]
}

const PEOPLE: Record<string, Person> = {
  shinichi: { name: 'Kudo Shinichi 工藤新一', color: 'blue', status: 'online', role: 'Detective', email: 'shinichi@teachat.app', avatar: 'https://i.pravatar.cc/96?img=12' },
  ai: { name: 'Haibara Ai 灰原哀', color: 'purple', status: 'busy', role: 'Researcher', email: 'ai@teachat.app', avatar: 'https://i.pravatar.cc/96?img=5' },
  ran: { name: 'Mouri Ran 毛利蘭', color: 'magenta', status: 'away', role: 'Karate Captain', email: 'ran@teachat.app', avatar: 'https://i.pravatar.cc/96?img=9' },
  guanyu: { name: 'Chen Guan-Yu 陳冠宇', color: 'green', status: 'online', role: 'Product Manager', email: 'guanyu@teachat.app', avatar: 'https://i.pravatar.cc/96?img=13' },
  yating: { name: 'Lin Ya-Ting 林雅婷', color: 'turquoise', status: 'offline', role: 'Designer', email: 'yating@teachat.app', avatar: 'https://i.pravatar.cc/96?img=16' },
  kenji: { name: 'Takahashi Kenji 高橋健二', color: 'indigo', status: 'online', role: 'Engineer', email: 'kenji@teachat.app', avatar: 'https://i.pravatar.cc/96?img=33' },
  yui: { name: 'Watanabe Yui 渡邊結衣', color: 'red', status: 'away', role: 'QA Lead', email: 'yui@teachat.app', avatar: 'https://i.pravatar.cc/96?img=20' },
}

const ME: Person = { name: 'Me 我', color: 'green', status: 'online', role: 'You', email: 'me@teachat.app', avatar: 'https://i.pravatar.cc/96?img=8' }

const ROOMS: Room[] = [
  {
    id: 'shinichi',
    type: 'dm',
    title: PEOPLE.shinichi.name,
    section: 'favorites',
    unread: true,
    person: PEOPLE.shinichi,
    messages: [
      { id: 'm1', author: 'shinichi', text: 'Morning! Is the oolong tasting flight ready?', time: '09:12', reactions: [{ emoji: '👍', count: 8 }], replies: 8 },
      { id: 'm2', author: 'me', text: 'All set — 10:30 in tasting room No.3.', time: '09:14' },
      { id: 'm3', author: 'shinichi', text: 'Great, I will prepare the scoring sheet.', time: '09:15' },
    ],
  },
  {
    id: 'tea-team',
    type: 'general',
    title: 'Tea Tasting 品茶小組',
    section: 'favorites',
    unread: false,
    memberKeys: ['shinichi', 'guanyu', 'yating', 'kenji'],
    messages: [
      { id: 'g1', author: 'guanyu', text: 'Cupcake ipsum: the tasting report is updated, please take a look on Figma.', time: '08:40', reactions: [{ emoji: '👍', count: 8 }, { emoji: '🍵', count: 3 }], replies: 8 },
      { id: 'g2', author: 'me', text: 'Got it, reviewing now.', time: '08:42' },
    ],
  },
  {
    id: 'ai',
    type: 'dm',
    title: PEOPLE.ai.name,
    section: 'chats',
    unread: true,
    person: PEOPLE.ai,
    messages: [
      { id: 'a1', author: 'ai', text: 'The new supplier samples arrived.', time: '5/28', replies: 2 },
      { id: 'a2', author: 'me', text: 'Perfect, let us cup them tomorrow.', time: '5/28' },
    ],
  },
  {
    id: 'ran',
    type: 'dm',
    title: PEOPLE.ran.name,
    section: 'chats',
    unread: false,
    person: PEOPLE.ran,
    messages: [{ id: 'r1', author: 'ran', text: 'Thanks! Have a great weekend 🍵', time: '5/25' }],
  },
  {
    id: 'product-team',
    type: 'general',
    title: 'Product Team 產品團隊',
    section: 'chats',
    unread: true,
    memberKeys: ['guanyu', 'yating', 'kenji', 'yui', 'ran'],
    messages: [
      { id: 'p1', author: 'kenji', text: 'Deploy is green. Shipping to staging now.', time: '11:02', reactions: [{ emoji: '🚀', count: 4 }] },
      { id: 'p2', author: 'me', text: 'Nice work team.', time: '11:05' },
    ],
  },
  {
    id: 'engineering',
    type: 'general',
    title: 'Engineering',
    section: 'chats',
    unread: false,
    memberKeys: ['kenji', 'yui'],
    messages: [{ id: 'e1', author: 'kenji', text: 'PR merged. Closing the ticket.', time: '5/26' }],
  },
]

const COMMON_EMOJI = ['👍', '❤️', '😂', '🎉']

// ── Avatar helpers ────────────────────────────────────────────────────────────
function makeProfileCard(p: Person) {
  return (
    <ProfileCard
      name={p.name}
      subtitle={p.role}
      status={p.status}
      avatar={{ alt: p.name, color: p.color, src: p.avatar }}
      fields={[
        { label: 'Role', value: p.role },
        { label: 'Email', value: p.email },
      ]}
      actions={<ProfileCardDefaultActions />}
    />
  )
}

function PersonAvatar({ person, size = 32 }: { person: Person; size?: number }) {
  return (
    <Avatar
      src={person.avatar}
      alt={person.name}
      color={person.color}
      status={person.status}
      size={size}
      hoverCard={makeProfileCard(person)}
    />
  )
}

// 多人聊天室:neutral-6 底 + MessagesSquare icon(多人對話意象,貫穿整個 prototype)
function GroupAvatar({ size = 32 }: { size?: number }) {
  return (
    <Avatar
      icon={MessagesSquare}
      size={size}
      shape="circle"
      className="[&>div]:!bg-[var(--color-neutral-6)] [&>div]:!text-[var(--on-emphasis)]"
    />
  )
}

// ════════════════════════════════════════════════════════════════════════════
// Settings modal — 兩欄結構:左側 nav / 右側 panel
// ════════════════════════════════════════════════════════════════════════════
function SettingsModal({
  open,
  onOpenChange,
  showPreview,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  showPreview: boolean
  onConfirm: (v: boolean) => void
}) {
  // 本地 draft state:確認前不套用
  const [draft, setDraft] = useState(showPreview)

  // 每次 modal 開啟時 sync draft
  useEffect(() => {
    if (open) setDraft(showPreview)
  }, [open, showPreview])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="flex h-[480px]">
          {/* 左側 nav */}
          <nav className="flex w-44 shrink-0 flex-col gap-0.5 border-r border-divider bg-surface p-3">
            <p className="px-2 pb-1 pt-0.5 text-caption font-semibold uppercase tracking-wide text-fg-secondary">
              Settings
            </p>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md bg-neutral-selected px-2 py-1.5 text-left text-body font-medium text-foreground"
            >
              <MessagesSquare size={15} />
              Chats
            </button>
          </nav>

          {/* 右側 panel */}
          <div className="flex min-w-0 flex-1 flex-col">
            <DialogHeader className="border-b border-divider px-6 py-4">
              <DialogTitle>Chats list</DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Setting item: show message previews */}
              <div className="flex items-center justify-between gap-4 rounded-lg py-3">
                <div>
                  <p className="text-body font-medium">Show message previews for chats</p>
                  <p className="text-caption text-fg-secondary mt-0.5">
                    Display the latest message below each chat name
                  </p>
                </div>
                <Switch
                  checked={draft}
                  onCheckedChange={setDraft}
                  aria-label="Show message previews for chats"
                />
              </div>
            </div>

            <DialogFooter className="border-t border-divider px-6 py-3">
              <Button variant="text" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={() => {
                  onConfirm(draft)
                  onOpenChange(false)
                }}
              >
                Save changes
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// 1. Nav rail — 48px 寬 / 32×32px buttons / neutral-2 active state
// ════════════════════════════════════════════════════════════════════════════
function Logo() {
  return (
    <svg width={28} height={28} viewBox="0 0 32 32" aria-label="TeaChat" role="img">
      <defs>
        <linearGradient id="teachat-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>
      <path
        d="M16 3.2 Q16.9 3.2 17.7 3.7 L26.3 8.6 Q27.1 9.1 27.1 10.1 L27.1 21.9 Q27.1 22.9 26.3 23.4 L17.7 28.3 Q16.9 28.8 16 28.8 Q15.1 28.8 14.3 28.3 L5.7 23.4 Q4.9 22.9 4.9 21.9 L4.9 10.1 Q4.9 9.1 5.7 8.6 L14.3 3.7 Q15.1 3.2 16 3.2 Z"
        fill="url(#teachat-logo)"
      />
    </svg>
  )
}

function NavRail({
  unreadCount,
  onOpenSettings,
}: {
  unreadCount: number
  onOpenSettings: () => void
}) {
  const [tab, setTab] = useState<'home' | 'chat'>('chat')

  return (
    // Nav rail: 48px 寬(w-12)
    <nav className="flex w-12 shrink-0 flex-col items-center border-r border-divider bg-surface py-2">
      {/* Logo */}
      <div className="flex h-10 items-center justify-center">
        <Logo />
      </div>
      <div className="w-8 py-1">
        <Separator />
      </div>

      {/* Navigation tabs */}
      <div className="flex flex-col gap-1 py-1">
        <NavBtn
          icon={Home}
          label="Home"
          active={tab === 'home'}
          onClick={() => setTab('home')}
        />
        <NavBtn
          icon={MessageCircle}
          label="Chat"
          active={tab === 'chat'}
          onClick={() => setTab('chat')}
          overlayBadge={
            unreadCount > 0
              ? <Badge variant="critical" count={unreadCount} max={99} />
              : undefined
          }
        />
      </div>

      {/* Bottom: More → Settings → modal (top), then Avatar (bottom) */}
      <div className="mt-auto flex flex-col items-center gap-1 py-1">
        {/* More button — Settings 在 dropdown 中 */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="text"
                  size="md"
                  iconOnly
                  startIcon={MoreHorizontal}
                  aria-label="More"
                />
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right">More</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" side="right">
            <DropdownMenuItem startIcon={Settings} onSelect={onOpenSettings}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem startIcon={HelpCircle}>Help</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem startIcon={LogOut}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Me avatar */}
        <Avatar
          src={ME.avatar}
          alt={ME.name}
          color={ME.color}
          status={ME.status}
          size={32}
          hoverCard={makeProfileCard(ME)}
        />
      </div>
    </nav>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// 2. Chat list
// ════════════════════════════════════════════════════════════════════════════
function AddPopover() {
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="text" size="sm" iconOnly startIcon={Plus} aria-label="Add" />
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Add</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-52 p-1">
        <button type="button" className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-body hover:bg-neutral-hover">
          <Plus size={16} /> Create new chat
        </button>
        <button type="button" className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-body hover:bg-neutral-hover">
          <Plus size={16} /> Create new section
        </button>
      </PopoverContent>
    </Popover>
  )
}

// Section header — 首字大寫其餘小寫(title case handled at call site)
function Section({
  label,
  open,
  onToggle,
  trailing,
}: {
  label: string
  open: boolean
  onToggle: () => void
  trailing?: React.ReactNode
}) {
  return (
    <div className="mt-2 flex items-center gap-1 px-1">
      <button
        type="button"
        onClick={onToggle}
        className="flex flex-1 items-center gap-1 rounded-md py-1 text-caption font-semibold text-fg-secondary hover:text-foreground"
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {label}
      </button>
      {trailing}
    </div>
  )
}

function RoomMoreMenu({ type }: { type: 'dm' | 'general' }) {
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="text" size="sm" iconOnly startIcon={MoreHorizontal} aria-label="More" />
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>More</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end">
        <DropdownMenuItem startIcon={Volume2}>Mute</DropdownMenuItem>
        <DropdownMenuItem startIcon={Star}>Favorite</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem startIcon={ExternalLink}>Open in new tab</DropdownMenuItem>
        <DropdownMenuItem startIcon={AppWindow}>Open in new window</DropdownMenuItem>
        {type === 'general' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem startIcon={LogOut} className="text-fg-error">Leave</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ── RoomRow — 兩種樣式由 showPreview 控制 ──────────────────────────────────
// showPreview=true(預設):32×32 avatar + name(14px) + 時間 + 第二行訊息預覽(12px, neutral-8)
// showPreview=false:20×20 avatar + name(14px) compact
function RoomRow({
  room,
  active,
  onSelect,
  showPreview,
}: {
  room: Room
  active: boolean
  onSelect: (id: string) => void
  showPreview: boolean
}) {
  const latestMsg = room.messages[room.messages.length - 1]
  const latestAuthor = latestMsg?.author === 'me' ? 'You' : (PEOPLE[latestMsg?.author]?.name.split(' ')[0] ?? '')
  const previewText = latestMsg ? `${latestAuthor}: ${latestMsg.text}` : ''

  const avatarSize = showPreview ? 32 : 20

  return (
    <div
      className={`group relative flex cursor-pointer items-center gap-2.5 rounded-lg px-2 cursor-pointer ${
        showPreview ? 'py-2' : 'py-1.5'
      } ${active ? 'bg-neutral-selected' : 'hover:bg-neutral-hover'}`}
      onClick={() => onSelect(room.id)}
    >
      {/* Avatar */}
      {room.type === 'dm' && room.person ? (
        <PersonAvatar person={room.person} size={avatarSize} />
      ) : (
        <GroupAvatar size={avatarSize} />
      )}

      {/* Text content */}
      {showPreview ? (
        // Preview mode: two-line
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex items-baseline justify-between gap-1">
            <span
              className="truncate text-foreground"
              style={{ fontSize: 14, fontWeight: room.unread ? 600 : 400 }}
            >
              {room.title}
            </span>
            <span className="shrink-0 text-fg-secondary" style={{ fontSize: 12 }}>
              {latestMsg?.time ?? ''}
            </span>
          </div>
          <p
            className="truncate text-fg-secondary"
            style={{ fontSize: 12, color: 'var(--color-neutral-8)' }}
          >
            {previewText}
          </p>
        </div>
      ) : (
        // Compact mode: single line
        <span
          className="min-w-0 flex-1 truncate text-foreground"
          style={{ fontSize: 14, fontWeight: room.unread ? 600 : 400 }}
        >
          {room.title}
        </span>
      )}

      {/* 未讀紅點(hover 時被 more 遮擋) */}
      {room.unread && (
        <span className="group-hover:hidden shrink-0">
          <Badge dot variant="critical" />
        </span>
      )}

      {/* hover → more */}
      <div
        className="absolute right-2 hidden group-hover:block"
        onClick={(e) => e.stopPropagation()}
      >
        <RoomMoreMenu type={room.type} />
      </div>
    </div>
  )
}

const CHAT_LIST_MIN = 260
const CHAT_LIST_MAX = 480

function ChatList({
  activeId,
  onSelect,
  onCollapse,
  width,
  onWidthChange,
  showPreview,
}: {
  activeId: string
  onSelect: (id: string) => void
  onCollapse: () => void
  width: number
  onWidthChange: (w: number) => void
  showPreview: boolean
}) {
  const [openFav, setOpenFav] = useState(true)
  const [openChats, setOpenChats] = useState(true)
  const [dragging, setDragging] = useState(false)
  const favorites = ROOMS.filter((r) => r.section === 'favorites')
  const chats = ROOMS.filter((r) => r.section === 'chats')

  function startResize(e: React.PointerEvent) {
    e.preventDefault()
    const startX = e.clientX
    const startW = width
    setDragging(true)
    const onMove = (ev: PointerEvent) => {
      onWidthChange(Math.max(CHAT_LIST_MIN, Math.min(CHAT_LIST_MAX, startW + (ev.clientX - startX))))
    }
    const onUp = () => {
      setDragging(false)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <aside className="relative flex shrink-0 flex-col border-r border-divider bg-surface" style={{ width }}>
      {/* Header — Chats(16px) + 28px buttons(gap-2 = 8px) */}
      <header className="flex items-center border-b border-divider px-3 py-2">
        <h2 className="flex-1 truncate font-semibold" style={{ fontSize: 16 }}>Chats</h2>
        <div className="flex items-center gap-2">
          <AddPopover />
          <ListBtn icon={Search} label="Search" />
          <ListBtn icon={PanelLeftClose} label="Collapse sidebar" onClick={onCollapse} />
        </div>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <div className="px-2 pb-3">
          {/* "Favorites" — 首字大寫, 其餘小寫 */}
          <Section label="Favorites" open={openFav} onToggle={() => setOpenFav((v) => !v)} />
          {openFav && favorites.map((r) => (
            <RoomRow key={r.id} room={r} active={r.id === activeId} onSelect={onSelect} showPreview={showPreview} />
          ))}

          <Section
            label="Chats"
            open={openChats}
            onToggle={() => setOpenChats((v) => !v)}
            trailing={<ListBtn icon={Plus} label="Add chat" />}
          />
          {openChats && chats.map((r) => (
            <RoomRow key={r.id} room={r} active={r.id === activeId} onSelect={onSelect} showPreview={showPreview} />
          ))}
        </div>
      </ScrollArea>

      <ResizeHandle
        direction="horizontal"
        position="end"
        isResizing={dragging}
        aria-label="拖曳調整聊天列表寬度"
        onPointerDown={startResize}
      />
    </aside>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// 3. Conversation
// ════════════════════════════════════════════════════════════════════════════
function TeamsCallButton() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="text" size="md" startIcon={Video} endIcon={ChevronDown} aria-label="Teams call" />
      </TooltipTrigger>
      <TooltipContent>Teams call</TooltipContent>
    </Tooltip>
  )
}

function RoomInfoButton({ count }: { count: number }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="text" size="md" startIcon={Users} aria-label="Room information">
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-caption font-medium text-fg-secondary">
            {count}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>Room information</TooltipContent>
    </Tooltip>
  )
}

function HeaderMoreMenu({ type }: { type: 'dm' | 'general' }) {
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="text" size="md" iconOnly startIcon={MoreHorizontal} aria-label="More" />
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>More</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end">
        {type === 'general' && (
          <>
            <DropdownMenuItem startIcon={Users}>Room information</DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem startIcon={Maximize2}>Full width</DropdownMenuItem>
        <DropdownMenuItem startIcon={Volume2}>Mute</DropdownMenuItem>
        <DropdownMenuItem startIcon={Star}>Favorite</DropdownMenuItem>
        {type === 'general' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem startIcon={LogOut} className="text-fg-error">Leave</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ConversationHeader({
  room,
  listOpen,
  onExpandList,
}: {
  room: Room
  listOpen: boolean
  onExpandList: () => void
}) {
  const memberCount = room.memberKeys?.length ?? 0
  return (
    <header className="flex items-center gap-2.5 h-[var(--chrome-header-height)] px-4 border-b border-divider bg-surface">
      {!listOpen && (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="text" size="md" iconOnly startIcon={PanelLeftOpen} aria-label="Expand sidebar" onClick={onExpandList} />
            </TooltipTrigger>
            <TooltipContent>Expand sidebar</TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" className="h-6" />
        </>
      )}
      {room.type === 'dm' && room.person ? (
        <PersonAvatar person={room.person} size={36} />
      ) : (
        <GroupAvatar size={36} />
      )}
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <h1 className="truncate text-body-lg font-semibold">{room.title}</h1>
        {room.type === 'general' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="text" size="md" iconOnly startIcon={Pencil} aria-label="Edit chatroom name" />
            </TooltipTrigger>
            <TooltipContent>Edit name</TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="flex items-center gap-1">
        <TeamsCallButton />
        {room.type === 'general' && <RoomInfoButton count={memberCount} />}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="text" size="md" iconOnly startIcon={Search} aria-label="Search" />
          </TooltipTrigger>
          <TooltipContent>Search</TooltipContent>
        </Tooltip>
        <HeaderMoreMenu type={room.type} />
      </div>
    </header>
  )
}

function ReactionBar() {
  return (
    <div className="absolute -top-4 right-2 z-10 hidden items-center gap-0.5 rounded-lg border border-divider bg-surface-raised p-0.5 shadow-md group-hover/msg:flex">
      {COMMON_EMOJI.map((e) => (
        <Tooltip key={e}>
          <TooltipTrigger asChild>
            <button type="button" aria-label={`React ${e}`} className="rounded-md px-1.5 py-1 text-body hover:bg-neutral-hover">
              {e}
            </button>
          </TooltipTrigger>
          <TooltipContent>{e}</TooltipContent>
        </Tooltip>
      ))}
      <IconBtnSm icon={SmilePlus} label="Add reaction" />
      <Separator orientation="vertical" className="mx-0.5 h-5" />
      <IconBtnSm icon={MessagesSquare} label="Reply in thread" />
      <IconBtnSm icon={Reply} label="Reply with quote" />
      <IconBtnSm icon={MoreHorizontal} label="More" />
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const mine = message.author === 'me'
  const author = mine ? null : PEOPLE[message.author] ?? null

  return (
    <div className={`group/msg flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
      {!mine && author && (
        <div className="mb-1 flex items-center gap-2 pl-11">
          <span className="text-body font-medium">{author.name}</span>
          <span className="text-caption text-fg-secondary">{message.time}</span>
        </div>
      )}
      <div className={`flex items-start gap-2 ${mine ? 'flex-row-reverse' : ''} max-w-[78%]`}>
        {!mine && author && <PersonAvatar person={author} size={32} />}
        <div className="relative">
          <ReactionBar />
          <div className={`rounded-2xl px-3.5 py-2.5 text-body ${
            mine ? 'rounded-tr-sm bg-primary-subtle text-foreground' : 'rounded-tl-sm bg-muted text-foreground'
          }`}>
            <p className="whitespace-pre-wrap break-words">{message.text}</p>
            {message.reactions && message.reactions.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {message.reactions.map((r) => (
                  <span key={r.emoji} className="flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-caption">
                    <span>{r.emoji}</span>
                    <span className="text-fg-secondary">{r.count}</span>
                  </span>
                ))}
                <button type="button" aria-label="Add reaction" className="flex items-center rounded-full bg-surface px-1.5 py-1 text-fg-secondary hover:text-foreground">
                  <SmilePlus size={14} />
                </button>
              </div>
            )}
          </div>
          {message.replies != null && message.replies > 0 && (
            <button type="button" className="mt-1 flex items-center gap-1.5 text-caption text-info-text hover:underline">
              <MessagesSquare size={14} />
              {message.replies} replies
            </button>
          )}
        </div>
      </div>
      {mine && <span className="mt-1 pr-1 text-caption text-fg-secondary">{message.time}</span>}
    </div>
  )
}

function MessageArea({ room }: { room: Room }) {
  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="flex flex-col gap-5 px-6 py-4">
        {room.messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
      </div>
    </ScrollArea>
  )
}

function InputBox() {
  const [value, setValue] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [value])

  function send() { setValue('') }

  return (
    <div className="border-t border-divider bg-surface px-4 py-3">
      <div className="rounded-xl border border-border bg-canvas px-3 py-2 focus-within:border-border-hover">
        <Textarea
          ref={ref}
          rows={1}
          variant="bare"
          placeholder="Type a message"
          aria-label="Type a message"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
          }}
          className="!resize-none !border-0 !px-0 !py-0 max-h-40"
        />
        <div className="mt-1.5 flex items-center justify-end gap-0.5">
          <IconBtnSm icon={Type} label="Rich editor" />
          <IconBtnSm icon={Smile} label="Emoji" />
          <IconBtnSm icon={Plus} label="Attach files" />
          <Separator orientation="vertical" className="mx-1 h-5" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="primary" size="sm" iconOnly startIcon={Send} aria-label="Send" onClick={send} disabled={!value.trim()} />
            </TooltipTrigger>
            <TooltipContent>Send</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

function Conversation({ room, listOpen, onExpandList }: { room: Room; listOpen: boolean; onExpandList: () => void }) {
  return (
    <section className="flex min-w-0 flex-1 flex-col bg-canvas">
      <ConversationHeader room={room} listOpen={listOpen} onExpandList={onExpandList} />
      <MessageArea room={room} />
      <InputBox key={room.id} />
    </section>
  )
}

// ════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [activeId, setActiveId] = useState<string>(ROOMS[0].id)
  const [listOpen, setListOpen] = useState(true)
  const [listWidth, setListWidth] = useState(320)
  const [showPreview, setShowPreview] = useState(true)      // settings state
  const [settingsOpen, setSettingsOpen] = useState(false)
  const current = ROOMS.find((r) => r.id === activeId) ?? ROOMS[0]
  const unreadCount = ROOMS.filter((r) => r.unread).length

  return (
    <TooltipProvider delayDuration={400} skipDelayDuration={200}>
      <div className="flex h-screen w-full overflow-hidden bg-canvas text-foreground">
        <NavRail unreadCount={unreadCount} onOpenSettings={() => setSettingsOpen(true)} />
        {listOpen && (
          <ChatList
            activeId={activeId}
            onSelect={setActiveId}
            onCollapse={() => setListOpen(false)}
            width={listWidth}
            onWidthChange={setListWidth}
            showPreview={showPreview}
          />
        )}
        <Conversation room={current} listOpen={listOpen} onExpandList={() => setListOpen(true)} />
      </div>

      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        showPreview={showPreview}
        onConfirm={setShowPreview}
      />
    </TooltipProvider>
  )
}
