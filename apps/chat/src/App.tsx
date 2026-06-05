// Chat prototype — 3-column messaging UI(Nav rail / Chat list / Conversation + Thread panel)
// v3: custom status dots / mute-avatar / favorite-move / my-bubble #EBEEFF / thread panel 480px

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
  BellOff,
  Bell,
  Star,
  ExternalLink,
  AppWindow,
  LogOut,
  Maximize2,
  Minimize2,
  Settings,
  HelpCircle,
  Clock,
  Check,
  CheckCheck,
  X,
} from 'lucide-react'

// ── Shared button primitives ──────────────────────────────────────────────────
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

function IconBtnSm({
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

// ── Data model ────────────────────────────────────────────────────────────────
type Presence = 'online' | 'away' | 'busy' | 'offline'
type Color = 'blue' | 'green' | 'purple' | 'magenta' | 'turquoise' | 'indigo' | 'red'
type MsgStatus = 'sending' | 'sent' | 'read'

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
  msgStatus?: MsgStatus
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
      { id: 'm2', author: 'me', text: 'All set — 10:30 in tasting room No.3.', time: '09:14', msgStatus: 'sent' },
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
      { id: 'g2', author: 'me', text: 'Got it, reviewing now.', time: '08:42', msgStatus: 'read' },
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
      { id: 'a2', author: 'me', text: 'Perfect, let us cup them tomorrow.', time: '5/28', msgStatus: 'read' },
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
      { id: 'p2', author: 'me', text: 'Nice work team.', time: '11:05', msgStatus: 'read' },
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

// ── Status dot — custom presence indicator ─────────────────────────────────────
// online=green solid / busy=red solid / away=yellow clock / offline=gray outline
function StatusDot({ status }: { status: Presence }) {
  const base = 'flex items-center justify-center rounded-full ring-1 ring-surface'
  if (status === 'online') {
    return <span className={`${base} bg-green-500`} style={{ width: 10, height: 10 }} />
  }
  if (status === 'busy') {
    return <span className={`${base} bg-red-500`} style={{ width: 10, height: 10 }} />
  }
  if (status === 'away') {
    return (
      <span className={`${base} bg-yellow-400`} style={{ width: 12, height: 12 }}>
        <Clock size={8} className="text-white" strokeWidth={2.5} />
      </span>
    )
  }
  // offline — gray outline
  return <span className={`${base} border-2 border-neutral-400 bg-transparent`} style={{ width: 10, height: 10 }} />
}

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

// PersonAvatar — custom StatusDot overlay, no DS built-in status dot
function PersonAvatar({ person, size = 32 }: { person: Person; size?: number }) {
  return (
    <div className="relative inline-flex shrink-0">
      <Avatar
        src={person.avatar}
        alt={person.name}
        color={person.color}
        size={size}
        hoverCard={makeProfileCard(person)}
      />
      <span className="absolute -bottom-0.5 -right-0.5 z-10">
        <StatusDot status={person.status} />
      </span>
    </div>
  )
}

// GroupAvatar — neutral-6 bg + MessagesSquare icon
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

// MutedAvatar — white bg + gray BellOff icon (replaces normal avatar when muted)
function MutedAvatar({ size = 32 }: { size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full border border-divider bg-white"
      style={{ width: size, height: size }}
    >
      <BellOff size={Math.round(size * 0.5)} className="text-fg-secondary" />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// Settings modal
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
  const [draft, setDraft] = useState(showPreview)

  useEffect(() => {
    if (open) setDraft(showPreview)
  }, [open, showPreview])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="flex h-[480px]">
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
          <div className="flex min-w-0 flex-1 flex-col">
            <DialogHeader className="border-b border-divider px-6 py-4">
              <DialogTitle>Chats list</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="flex items-center justify-between gap-4 rounded-lg py-3">
                <div>
                  <p className="text-body font-medium">Show message previews for chats</p>
                  <p className="text-caption text-fg-secondary mt-0.5">
                    Display the latest message below each chat name
                  </p>
                </div>
                <Switch checked={draft} onCheckedChange={setDraft} aria-label="Show message previews for chats" />
              </div>
            </div>
            <DialogFooter className="border-t border-divider px-6 py-3">
              <Button variant="text" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => { onConfirm(draft); onOpenChange(false) }}>
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
// 1. Nav rail
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

function NavRail({ unreadCount, onOpenSettings }: { unreadCount: number; onOpenSettings: () => void }) {
  const [tab, setTab] = useState<'home' | 'chat'>('chat')

  return (
    <nav className="flex w-12 shrink-0 flex-col items-center border-r border-divider bg-surface py-2">
      <div className="flex h-10 items-center justify-center">
        <Logo />
      </div>
      <div className="w-8 py-1">
        <Separator />
      </div>
      <div className="flex flex-col gap-1 py-1">
        <NavBtn icon={Home} label="Home" active={tab === 'home'} onClick={() => setTab('home')} />
        <NavBtn
          icon={MessageCircle}
          label="Chat"
          active={tab === 'chat'}
          onClick={() => setTab('chat')}
          overlayBadge={unreadCount > 0 ? <Badge variant="critical" count={unreadCount} max={99} /> : undefined}
        />
      </div>
      <div className="mt-auto flex flex-col items-center gap-1 py-1">
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="text" size="md" iconOnly startIcon={MoreHorizontal} aria-label="More" />
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right">More</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" side="right" sideOffset={8}>
            <DropdownMenuItem startIcon={Settings} onSelect={onOpenSettings}>Settings</DropdownMenuItem>
            <DropdownMenuItem startIcon={HelpCircle}>Help</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem startIcon={LogOut}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Avatar src={ME.avatar} alt={ME.name} color={ME.color} size={32} hoverCard={makeProfileCard(ME)} />
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
      <PopoverContent align="end" sideOffset={8} className="w-52 p-1">
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

// RoomMoreMenu — muted/unmuted state + favorite/unfavorite based on section
function RoomMoreMenu({
  room,
  isMuted,
  isFavorite,
  onToggleMute,
  onToggleFavorite,
}: {
  room: Room
  isMuted: boolean
  isFavorite: boolean
  onToggleMute: () => void
  onToggleFavorite: () => void
}) {
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
      <DropdownMenuContent align="end" sideOffset={8}>
        <DropdownMenuItem
          startIcon={isMuted ? Bell : BellOff}
          onSelect={onToggleMute}
        >
          {isMuted ? 'Unmute' : 'Mute'}
        </DropdownMenuItem>
        <DropdownMenuItem
          startIcon={Star}
          className={isFavorite ? 'font-semibold' : ''}
          onSelect={onToggleFavorite}
        >
          {isFavorite ? 'Unfavorite' : 'Favorite'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem startIcon={ExternalLink}>Open in new tab</DropdownMenuItem>
        <DropdownMenuItem startIcon={AppWindow}>Open in new window</DropdownMenuItem>
        {room.type === 'general' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem startIcon={LogOut} className="text-fg-error">Leave</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// RoomRow — two-line preview with time on right, unread dot on right of preview line
function RoomRow({
  room,
  active,
  isMuted,
  isFavorite,
  onSelect,
  onToggleMute,
  onToggleFavorite,
  showPreview,
}: {
  room: Room
  active: boolean
  isMuted: boolean
  isFavorite: boolean
  onSelect: (id: string) => void
  onToggleMute: (id: string) => void
  onToggleFavorite: (id: string) => void
  showPreview: boolean
}) {
  const latestMsg = room.messages[room.messages.length - 1]
  const latestAuthor = latestMsg?.author === 'me' ? 'You' : (PEOPLE[latestMsg?.author]?.name.split(' ')[0] ?? '')
  const previewText = latestMsg ? `${latestAuthor}: ${latestMsg.text}` : ''
  const avatarSize = showPreview ? 32 : 20

  return (
    <div
      className={`group relative flex cursor-pointer items-center gap-2.5 rounded-lg px-2 ${
        showPreview ? 'py-2' : 'py-1.5'
      } ${active ? 'bg-neutral-selected' : 'hover:bg-neutral-hover'}`}
      onClick={() => onSelect(room.id)}
    >
      {/* Avatar — muted shows BellOff icon */}
      {isMuted ? (
        <MutedAvatar size={avatarSize} />
      ) : room.type === 'dm' && room.person ? (
        <PersonAvatar person={room.person} size={avatarSize} />
      ) : (
        <GroupAvatar size={avatarSize} />
      )}

      {/* Text content */}
      {showPreview ? (
        <div className="min-w-0 flex-1 overflow-hidden">
          {/* Line 1: name (left) + time (right) */}
          <div className="flex items-baseline gap-1">
            <span
              className="min-w-0 flex-1 truncate text-foreground"
              style={{ fontSize: 14, fontWeight: room.unread && !isMuted ? 600 : 400 }}
            >
              {room.title}
            </span>
            {/* Time on right of name line — hidden on hover (more button covers) */}
            <span className="shrink-0 text-fg-secondary group-hover:invisible" style={{ fontSize: 12 }}>
              {latestMsg?.time ?? ''}
            </span>
          </div>
          {/* Line 2: preview (left) + unread dot (right) */}
          <div className="flex items-center gap-1">
            <p className="min-w-0 flex-1 truncate text-fg-secondary" style={{ fontSize: 12, color: 'var(--color-neutral-8)' }}>
              {previewText}
            </p>
            {/* Unread dot on right of preview line — hidden on hover */}
            {room.unread && !isMuted && (
              <span className="shrink-0 group-hover:invisible">
                <Badge dot variant="critical" />
              </span>
            )}
          </div>
        </div>
      ) : (
        <span
          className="min-w-0 flex-1 truncate text-foreground"
          style={{ fontSize: 14, fontWeight: room.unread && !isMuted ? 600 : 400 }}
        >
          {room.title}
        </span>
      )}

      {/* Hover: more button, absolute right-2, covers time+dot */}
      <div
        className="absolute right-2 hidden group-hover:block"
        onClick={(e) => e.stopPropagation()}
      >
        <RoomMoreMenu
          room={room}
          isMuted={isMuted}
          isFavorite={isFavorite}
          onToggleMute={() => onToggleMute(room.id)}
          onToggleFavorite={() => onToggleFavorite(room.id)}
        />
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
  mutedIds,
  favOrder,
  onToggleMute,
  onToggleFavorite,
}: {
  activeId: string
  onSelect: (id: string) => void
  onCollapse: () => void
  width: number
  onWidthChange: (w: number) => void
  showPreview: boolean
  mutedIds: Set<string>
  favOrder: string[]
  onToggleMute: (id: string) => void
  onToggleFavorite: (id: string) => void
}) {
  const [openFav, setOpenFav] = useState(true)
  const [openChats, setOpenChats] = useState(true)
  const [dragging, setDragging] = useState(false)

  const favSet = new Set(favOrder)
  const favorites = favOrder.map((id) => ROOMS.find((r) => r.id === id)!).filter(Boolean)
  const chats = ROOMS.filter((r) => !favSet.has(r.id))

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
          <Section label="Favorites" open={openFav} onToggle={() => setOpenFav((v) => !v)} />
          {openFav && favorites.map((r) => (
            <RoomRow
              key={r.id}
              room={r}
              active={r.id === activeId}
              isMuted={mutedIds.has(r.id)}
              isFavorite={true}
              onSelect={onSelect}
              onToggleMute={onToggleMute}
              onToggleFavorite={onToggleFavorite}
              showPreview={showPreview}
            />
          ))}

          <Section
            label="Chats"
            open={openChats}
            onToggle={() => setOpenChats((v) => !v)}
            trailing={<ListBtn icon={Plus} label="Add chat" />}
          />
          {openChats && chats.map((r) => (
            <RoomRow
              key={r.id}
              room={r}
              active={r.id === activeId}
              isMuted={mutedIds.has(r.id)}
              isFavorite={false}
              onSelect={onSelect}
              onToggleMute={onToggleMute}
              onToggleFavorite={onToggleFavorite}
              showPreview={showPreview}
            />
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
      <DropdownMenuContent align="end" sideOffset={8}>
        {type === 'general' && (
          <>
            <DropdownMenuItem startIcon={Users}>Room information</DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem startIcon={Maximize2}>Full width</DropdownMenuItem>
        <DropdownMenuItem startIcon={BellOff}>Mute</DropdownMenuItem>
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
    <header className="flex items-center gap-2.5 h-[var(--chrome-header-height)] px-4 border-b border-divider bg-surface shrink-0">
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

// Message read/sent/sending status icon
function MsgStatusIcon({ status }: { status: MsgStatus }) {
  if (status === 'sending') return <Clock size={12} className="text-fg-secondary" />
  if (status === 'sent') return <Check size={12} className="text-fg-secondary" />
  return <CheckCheck size={12} className="text-primary" />
}

function ReactionBar({ onOpenThread }: { onOpenThread: () => void }) {
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
      <IconBtnSm icon={MessagesSquare} label="Reply in thread" onClick={onOpenThread} />
      <IconBtnSm icon={Reply} label="Reply with quote" />
      <IconBtnSm icon={MoreHorizontal} label="More" />
    </div>
  )
}

function MessageBubble({
  message,
  isLastMine,
  onOpenThread,
}: {
  message: Message
  isLastMine: boolean
  onOpenThread: (m: Message) => void
}) {
  const mine = message.author === 'me'
  const author = mine ? null : PEOPLE[message.author] ?? null

  return (
    <div className={`group/msg flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
      <div className={`flex items-start gap-2 ${mine ? 'flex-row-reverse' : ''} max-w-[78%]`}>
        {/* Other user avatar — top-aligned with name */}
        {!mine && author && (
          <div className="mt-0.5 shrink-0">
            <PersonAvatar person={author} size={32} />
          </div>
        )}

        <div className="flex flex-col gap-0.5 min-w-0">
          {/* My message: time above bubble */}
          {mine && (
            <div className="flex items-center justify-end gap-1.5 pr-1">
              <span className="text-caption text-fg-secondary">{message.time}</span>
            </div>
          )}

          {/* Other: name + time above bubble (top-aligned with avatar) */}
          {!mine && author && (
            <div className="flex items-center gap-1.5 mb-0.5">
              <span style={{ fontSize: 12, color: 'var(--color-neutral-7)', fontWeight: 500 }}>{author.name}</span>
              <span style={{ fontSize: 12, color: 'var(--color-neutral-7)' }}>{message.time}</span>
            </div>
          )}

          {/* Bubble */}
          <div className="relative">
            <ReactionBar onOpenThread={() => onOpenThread(message)} />
            <div
              className={`rounded-2xl px-3.5 py-2.5 text-body ${
                mine ? 'rounded-tr-sm text-foreground' : 'rounded-tl-sm bg-muted text-foreground'
              }`}
              style={mine ? { backgroundColor: '#EBEEFF' } : undefined}
            >
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
              {/* Read/sent/sending status — only on newest mine bubble, bottom-right */}
              {mine && isLastMine && message.msgStatus && (
                <div className="mt-1 flex justify-end">
                  <MsgStatusIcon status={message.msgStatus} />
                </div>
              )}
            </div>
          </div>

          {/* Thread replies — with L-shaped connector line */}
          {message.replies != null && message.replies > 0 && (
            <div className="relative mt-0.5 flex items-center" style={{ marginLeft: mine ? 0 : 0 }}>
              {!mine && (
                <span
                  className="absolute border-l-2 border-b-2 border-neutral-300 rounded-bl"
                  style={{ left: -24, top: -8, height: 14, width: 16 }}
                />
              )}
              <button
                type="button"
                className="flex items-center gap-1.5 text-caption text-info-text hover:underline"
                onClick={() => onOpenThread(message)}
              >
                <MessagesSquare size={14} />
                {message.replies} replies
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MessageArea({ room, onOpenThread }: { room: Room; onOpenThread: (m: Message) => void }) {
  const lastMineId = [...room.messages].reverse().find((m) => m.author === 'me')?.id ?? null
  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="flex flex-col gap-5 px-6 py-4">
        {room.messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            isLastMine={m.id === lastMineId}
            onOpenThread={onOpenThread}
          />
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
    <div className="border-t border-divider bg-surface px-4 py-3 shrink-0">
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

// ── Thread panel ──────────────────────────────────────────────────────────────
const THREAD_MIN = 320
const THREAD_MAX = 720

function ThreadInputBox() {
  const [value, setValue] = useState('')
  const [alsoSend, setAlsoSend] = useState(true)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [value])

  return (
    <div className="border-t border-divider bg-surface px-3 py-2 shrink-0">
      <div className="rounded-xl border border-border bg-canvas px-3 py-2 focus-within:border-border-hover">
        <Textarea
          ref={ref}
          rows={1}
          variant="bare"
          placeholder="Reply in thread..."
          aria-label="Reply in thread"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="!resize-none !border-0 !px-0 !py-0 max-h-32"
        />
        <div className="mt-1.5 flex items-center gap-2">
          <label className="flex flex-1 cursor-pointer items-center gap-1.5 text-caption text-fg-secondary select-none">
            <input
              type="checkbox"
              checked={alsoSend}
              onChange={(e) => setAlsoSend(e.target.checked)}
              className="rounded border-border accent-[var(--color-primary)]"
            />
            Also send to chatroom
          </label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="primary" size="sm" iconOnly startIcon={Send} aria-label="Send reply" disabled={!value.trim()} />
            </TooltipTrigger>
            <TooltipContent>Send</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

function ThreadPanel({
  message,
  width,
  onWidthChange,
  expanded,
  onExpand,
  onCollapse,
  onClose,
}: {
  message: Message
  width?: number
  onWidthChange: (w: number) => void
  expanded: boolean
  onExpand: () => void
  onCollapse: () => void
  onClose: () => void
}) {
  const [dragging, setDragging] = useState(false)
  const author = message.author === 'me' ? ME : (PEOPLE[message.author] ?? null)

  function startResize(e: React.PointerEvent) {
    e.preventDefault()
    const startX = e.clientX
    const startW = width ?? 480
    setDragging(true)
    const onMove = (ev: PointerEvent) => {
      // dragging left edge → larger width as we move left
      const delta = startX - ev.clientX
      onWidthChange(Math.max(THREAD_MIN, Math.min(THREAD_MAX, startW + delta)))
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
    <div
      className="relative flex shrink-0 flex-col border-l border-divider bg-surface"
      style={expanded ? { flex: 1 } : { width: width ?? 480 }}
    >
      {/* Resize handle on left edge (only when not expanded) */}
      {!expanded && (
        <ResizeHandle
          direction="horizontal"
          position="start"
          isResizing={dragging}
          aria-label="拖曳調整 Thread 面板寬度"
          onPointerDown={startResize}
        />
      )}

      {/* Panel header */}
      <div className="flex items-center border-b border-divider px-3 py-2 shrink-0">
        <h2 className="flex-1 font-semibold" style={{ fontSize: 15 }}>Thread</h2>
        {/* Buttons: expand/collapse right-to-left order: expand first, then close */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="text"
                size="sm"
                iconOnly
                startIcon={expanded ? Minimize2 : Maximize2}
                aria-label={expanded ? 'Collapse thread' : 'Expand thread'}
                onClick={expanded ? onCollapse : onExpand}
              />
            </TooltipTrigger>
            <TooltipContent>{expanded ? 'Collapse' : 'Expand'}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="text" size="sm" iconOnly startIcon={X} aria-label="Close thread" onClick={onClose} />
            </TooltipTrigger>
            <TooltipContent>Close</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 px-4 py-4">
          {/* Parent message */}
          <div className="rounded-xl border border-divider bg-canvas p-3">
            <div className="flex items-start gap-2">
              {author && (
                author === ME ? (
                  <div className="relative inline-flex shrink-0">
                    <Avatar src={ME.avatar} alt={ME.name} color={ME.color} size={28} />
                  </div>
                ) : (
                  <PersonAvatar person={author} size={28} />
                )
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <span style={{ fontSize: 13, fontWeight: 500 }}>
                    {author === ME ? 'Me' : author?.name.split(' ')[0]}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--color-neutral-7)' }}>{message.time}</span>
                </div>
                <p className="text-body whitespace-pre-wrap break-words">{message.text}</p>
              </div>
            </div>
          </div>

          {/* Thread replies placeholder */}
          {message.replies != null && message.replies > 0 && (
            <div className="flex items-center gap-2 px-1">
              <Separator className="flex-1" />
              <span className="text-caption text-fg-secondary shrink-0">{message.replies} replies</span>
              <Separator className="flex-1" />
            </div>
          )}
        </div>
      </ScrollArea>

      <ThreadInputBox />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// Conversation wrapper
// ════════════════════════════════════════════════════════════════════════════
function Conversation({
  room,
  listOpen,
  onExpandList,
}: {
  room: Room
  listOpen: boolean
  onExpandList: () => void
}) {
  const [threadMessage, setThreadMessage] = useState<Message | null>(null)
  const [threadExpanded, setThreadExpanded] = useState(false)
  const [threadWidth, setThreadWidth] = useState(480)

  // Reset thread when room changes
  useEffect(() => {
    setThreadMessage(null)
    setThreadExpanded(false)
  }, [room.id])

  return (
    <section className="flex min-w-0 flex-1 overflow-hidden bg-canvas">
      {/* Main chat — hidden when thread is expanded */}
      {!threadExpanded && (
        <div className="flex min-w-0 flex-1 flex-col">
          <ConversationHeader room={room} listOpen={listOpen} onExpandList={onExpandList} />
          <MessageArea room={room} onOpenThread={setThreadMessage} />
          <InputBox key={room.id} />
        </div>
      )}

      {/* Thread panel */}
      {threadMessage && (
        <ThreadPanel
          message={threadMessage}
          width={threadExpanded ? undefined : threadWidth}
          onWidthChange={setThreadWidth}
          expanded={threadExpanded}
          onExpand={() => setThreadExpanded(true)}
          onCollapse={() => setThreadExpanded(false)}
          onClose={() => { setThreadMessage(null); setThreadExpanded(false) }}
        />
      )}
    </section>
  )
}

// ════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [activeId, setActiveId] = useState<string>(ROOMS[0].id)
  const [listOpen, setListOpen] = useState(true)
  const [listWidth, setListWidth] = useState(320)
  const [showPreview, setShowPreview] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Mute state
  const [mutedIds, setMutedIds] = useState<Set<string>>(new Set())

  // Favorite order (starts from rooms with section='favorites')
  const [favOrder, setFavOrder] = useState<string[]>(
    ROOMS.filter((r) => r.section === 'favorites').map((r) => r.id)
  )

  const current = ROOMS.find((r) => r.id === activeId) ?? ROOMS[0]
  const unreadCount = ROOMS.filter((r) => r.unread && !mutedIds.has(r.id)).length

  function handleToggleMute(id: string) {
    setMutedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleToggleFavorite(id: string) {
    const isFav = favOrder.includes(id)
    if (isFav) {
      // Unfavorite → remove from favorites (goes back to Chats)
      setFavOrder((prev) => prev.filter((x) => x !== id))
    } else {
      // Favorite → append to bottom of Favorites
      setFavOrder((prev) => [...prev, id])
    }
  }

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
            mutedIds={mutedIds}
            favOrder={favOrder}
            onToggleMute={handleToggleMute}
            onToggleFavorite={handleToggleFavorite}
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
