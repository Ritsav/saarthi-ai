# Saarthi AI — Frontend Development Plan

> **Saarthi AI** is an AI-powered Government Process Copilot for Nepal. It guides citizens through bureaucratic processes (company registration, PAN, passports, etc.) via a chat-first interface with document upload, OCR analysis, readiness tracking, and bilingual (English/Nepali) support.

**Tech Stack:**
- React 18+ with Vite + TypeScript
- Tailwind CSS + shadcn/ui
- React Router v6
- React Context + useReducer for state
- fetch API for HTTP + SSE streaming
- react-i18next for i18n
- MediaRecorder API for speech input
- JWT auth with localStorage

---

## 1. Project Structure

```
frontend/
├── public/
│   ├── locales/
│   │   ├── en/
│   │   │   └── translation.json
│   │   └── ne/
│   │       └── translation.json
│   └── favicon.svg
├── src/
│   ├── main.tsx                  # React DOM entry point
│   ├── App.tsx                   # Root component: providers + router
│   ├── index.css                 # Tailwind directives (@tailwind base/components/utilities)
│   ├── config/
│   │   ├── api.ts                # Configured fetch/axios instance with auth interceptor
│   │   └── i18n.ts               # react-i18next initialization
│   ├── context/
│   │   ├── AuthContext.tsx        # User state, login/logout/register actions
│   │   ├── ChatContext.tsx        # Active chat, messages[], streaming state
│   │   └── LanguageContext.tsx    # EN/NE toggle, persisted to localStorage
│   ├── hooks/
│   │   ├── useAuth.ts            # Convenience hook: useContext(AuthContext)
│   │   ├── useChat.ts            # Send message, subscribe to SSE stream, manage messages
│   │   ├── useDocuments.ts       # Upload, analyze, list documents
│   │   ├── useSpeech.ts          # Record audio via MediaRecorder, POST to Whisper endpoint
│   │   └── useProcess.ts         # Get requirements, checklist, prefill data
│   ├── components/
│   │   ├── ui/                   # shadcn/ui primitives (Button, Input, Card, Dialog, etc.)
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx       # Chat history list, new chat button, collapsible
│   │   │   ├── Header.tsx        # Logo, language toggle, user avatar + dropdown
│   │   │   └── Layout.tsx        # Main layout wrapper: sidebar + header + content slot
│   │   ├── chat/
│   │   │   ├── ChatWindow.tsx    # Message list container + auto-scroll + typing indicator
│   │   │   ├── MessageBubble.tsx # Single message: markdown, attachments, citations
│   │   │   ├── ChatInput.tsx     # Textarea + send + attach file + mic button
│   │   │   ├── StreamingMessage.tsx  # Token-by-token animated display
│   │   │   ├── ToolCallCard.tsx  # Inline card: "Analyzing document...", "Searching..."
│   │   │   └── FilePreview.tsx   # Thumbnail preview of attached file
│   │   ├── document/
│   │   │   ├── UploadZone.tsx    # Drag-and-drop + click file picker
│   │   │   ├── DocumentCard.tsx  # Doc thumbnail, OCR status badge, readiness indicator
│   │   │   ├── AnalysisResult.tsx # Extracted fields table, missing items, suggestions
│   │   │   └── ConsentModal.tsx  # Privacy consent dialog before first upload
│   │   ├── dashboard/
│   │   │   ├── ReadinessScore.tsx # Circular progress ring (0-100%)
│   │   │   ├── RequirementsList.tsx # Checklist with check/cross/warning icons
│   │   │   ├── ProcessCard.tsx   # Process summary card with status + action
│   │   │   └── ActionButton.tsx  # Styled action: "Download Form", "Get Portal Link"
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx     # Email + password form
│   │   │   └── RegisterForm.tsx  # Email + password + name form
│   │   └── common/
│   │       ├── LanguageToggle.tsx # EN/NE switch button
│   │       ├── LoadingSpinner.tsx # Centered spinner
│   │       └── ErrorBoundary.tsx # React error boundary with fallback UI
│   ├── pages/
│   │   ├── LoginPage.tsx         # Centered card with LoginForm
│   │   ├── RegisterPage.tsx      # Centered card with RegisterForm
│   │   ├── ChatPage.tsx          # Main page: sidebar + ChatWindow
│   │   ├── DashboardPage.tsx     # Readiness overview for a specific process
│   │   └── DocumentsPage.tsx     # Grid/list of all uploaded documents
│   ├── types/
│   │   ├── index.ts              # Re-exports all types
│   │   ├── chat.ts               # Message, Chat, StreamEvent types
│   │   ├── document.ts           # Document, AnalysisResult, UploadResponse types
│   │   └── process.ts            # ProcessType, Requirement, ReadinessData types
│   ├── utils/
│   │   ├── formatters.ts         # Date formatting, currency (NPR), file size
│   │   └── validators.ts        # Email, password, file type/size validation
│   └── lib/
│       └── utils.ts              # shadcn/ui utility function: cn() (clsx + twMerge)
├── components.json               # shadcn/ui configuration
├── tailwind.config.js            # Tailwind config with custom colors
├── vite.config.ts                # Vite config with API proxy
├── tsconfig.json                 # TypeScript config
├── Dockerfile                    # Multi-stage build: node -> nginx
├── package.json                  # Dependencies and scripts
└── .env.example                  # VITE_API_URL=http://localhost:8000
```

### Key File Purposes

| File | Responsibility |
|------|---------------|
| `config/api.ts` | Creates a configured fetch wrapper that auto-attaches `Authorization: Bearer <token>` header. Handles 401 responses globally (clears token, redirects to /login). Sets base URL from `VITE_API_URL`. |
| `config/i18n.ts` | Initializes react-i18next with `HttpBackend` to load JSON translation files from `/locales/{lang}/translation.json`. Defaults to `en`, falls back to `en`. |
| `context/AuthContext.tsx` | Provides `user`, `token`, `isAuthenticated`, `isLoading`, `login()`, `logout()`, `register()`. Wraps entire app. |
| `context/ChatContext.tsx` | Provides `chats[]`, `activeChat`, `messages[]`, `isStreaming`, `sendMessage()`, `createChat()`, `loadChat()`, `deleteChat()`. |
| `context/LanguageContext.tsx` | Provides `language` (`'en'` or `'ne'`), `setLanguage()`. Syncs with i18n and localStorage. |
| `lib/utils.ts` | The `cn()` function combining `clsx` and `tailwind-merge` — required by all shadcn/ui components. |

### Initial shadcn/ui Components to Install

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input card dialog sheet avatar badge progress tabs textarea dropdown-menu separator scroll-area tooltip alert toast
```

---

## 2. Routing & Page Layout

### 2.1 Route Definitions

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { LanguageProvider } from './context/LanguageContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';
import DashboardPage from './pages/DashboardPage';
import DocumentsPage from './pages/DocumentsPage';

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <ChatProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected routes — wrapped in Layout */}
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/chat" element={<ChatPage />} />
                  <Route path="/chat/:chatId" element={<ChatPage />} />
                  <Route path="/dashboard/:processType" element={<DashboardPage />} />
                  <Route path="/documents" element={<DocumentsPage />} />
                </Route>
              </Route>

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/chat" replace />} />
              <Route path="*" element={<Navigate to="/chat" replace />} />
            </Routes>
          </ChatProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
```

### 2.2 Route Table

| Path | Component | Auth Required | Description |
|------|-----------|---------------|-------------|
| `/` | — | No | Redirects to `/chat` |
| `/login` | `LoginPage` | No | Login form, redirects to `/chat` on success |
| `/register` | `RegisterPage` | No | Registration form, redirects to `/login` on success |
| `/chat` | `ChatPage` | Yes | New chat or last active chat |
| `/chat/:chatId` | `ChatPage` | Yes | Specific chat loaded by ID |
| `/dashboard/:processType` | `DashboardPage` | Yes | Readiness dashboard for a process (e.g., `company_registration`) |
| `/documents` | `DocumentsPage` | Yes | All uploaded documents |

### 2.3 ProtectedRoute Component

```tsx
// src/components/common/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from './LoadingSpinner';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // While checking token validity, show spinner
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Not authenticated — redirect to login, preserve intended destination
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authenticated — render child routes
  return <Outlet />;
}
```

### 2.4 Layout Component

The `Layout` component provides the persistent shell for all authenticated pages: a collapsible sidebar on the left and header bar on top.

```tsx
// src/components/layout/Layout.tsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { Button } from '../ui/button';
import { Menu } from 'lucide-react';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar — hidden on mobile */}
        <aside
          className={`hidden md:flex flex-col border-r bg-slate-50 transition-all duration-300 ${
            sidebarOpen ? 'w-72' : 'w-0 overflow-hidden'
          }`}
        >
          <Sidebar />
        </aside>

        {/* Mobile Sidebar — Sheet/Drawer */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden absolute top-3 left-3 z-50">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <Sidebar />
          </SheetContent>
        </Sheet>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

### 2.5 Header Component

```tsx
// src/components/layout/Header.tsx
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { LanguageToggle } from '../common/LanguageToggle';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '../ui/dropdown-menu';
import { PanelLeftClose, PanelLeftOpen, LogOut, User } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-4 shrink-0">
      {/* Left: sidebar toggle + logo */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="hidden md:flex">
          <PanelLeftClose className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-[#1e3a5f]">Saarthi AI</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {t('app.subtitle')}
          </span>
        </div>
      </div>

      {/* Right: language toggle + user menu */}
      <div className="flex items-center gap-3">
        <LanguageToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-[#1e3a5f] text-white text-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled>
              <User className="mr-2 h-4 w-4" />
              {user?.email}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              {t('auth.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
```

### 2.6 Sidebar Component

```tsx
// src/components/layout/Sidebar.tsx
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useChat } from '../../hooks/useChat';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { MessageSquarePlus, MessageSquare, FileText, BarChart3, Trash2 } from 'lucide-react';

export function Sidebar() {
  const { t } = useTranslation();
  const { chats, createChat, deleteChat } = useChat();
  const navigate = useNavigate();
  const { chatId } = useParams();

  const handleNewChat = async () => {
    const newChat = await createChat();
    navigate(`/chat/${newChat.id}`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* New Chat Button */}
      <div className="p-3">
        <Button onClick={handleNewChat} className="w-full bg-[#1e3a5f] hover:bg-[#2a4f7f]">
          <MessageSquarePlus className="mr-2 h-4 w-4" />
          {t('chat.newChat')}
        </Button>
      </div>

      {/* Chat History */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer hover:bg-slate-200 ${
                chatId === chat.id ? 'bg-slate-200 font-medium' : ''
              }`}
              onClick={() => navigate(`/chat/${chat.id}`)}
            >
              <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate flex-1">{chat.title || t('chat.newChat')}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Bottom Navigation Links */}
      <div className="border-t p-3 space-y-1">
        <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/documents')}>
          <FileText className="mr-2 h-4 w-4" />
          {t('nav.documents')}
        </Button>
        <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/dashboard/company_registration')}>
          <BarChart3 className="mr-2 h-4 w-4" />
          {t('nav.dashboard')}
        </Button>
      </div>
    </div>
  );
}
```

### 2.7 Responsive Behavior

| Breakpoint | Sidebar | Header | Content |
|------------|---------|--------|---------|
| `>= md` (768px) | Visible, collapsible via header button. Width: 288px or 0. | Full header with all elements. | Fills remaining width. |
| `< md` (mobile) | Hidden by default. Opens as `Sheet` drawer from left edge, triggered by hamburger icon. | Hamburger menu button replaces sidebar toggle. Logo and user menu visible. | Full width. |

**Key responsive rules:**
- Chat input stays fixed at bottom of ChatWindow on all screen sizes.
- File previews and tool call cards stack vertically on mobile.
- Dashboard cards use `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` responsive grid.
- Modal dialogs (ConsentModal) become full-screen sheets on mobile via shadcn `Sheet` component.
## 3. Core Components Specification

### ChatWindow.tsx

The main chat area that displays all messages and manages the SSE connection.

**Key behaviors:**
- Renders a scrollable list of `MessageBubble` components
- Auto-scrolls to bottom when new messages arrive (use `useRef` + `scrollIntoView`)
- Shows a `StreamingMessage` component when assistant is responding
- Shows a typing indicator ("Saarthi is thinking...") before first token arrives
- Manages SSE connection lifecycle (connect on send, cleanup on unmount)

**shadcn/ui components:** `ScrollArea`, `Separator`

```tsx
// Pseudocode structure
function ChatWindow({ chatId }: { chatId: string }) {
  const { messages, isStreaming, streamingContent } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);
  
  return (
    <ScrollArea className="flex-1 p-4">
      {messages.length === 0 && <EmptyState />}
      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {isStreaming && (
        <StreamingMessage content={streamingContent} />
      )}
      <div ref={scrollRef} />
    </ScrollArea>
  );
}
```

**EmptyState:** Show when no messages exist — display Saarthi AI logo, greeting in EN/NE, and 3 suggestion chips:
- "Register a company"
- "Apply for PAN"
- "Get a passport"

Clicking a chip sends that as the first message.

---

### ChatInput.tsx

The input area at the bottom of the chat.

**Key behaviors:**
- `Textarea` that auto-resizes up to 5 lines, then scrolls internally
- **Enter** sends the message, **Shift+Enter** inserts newline
- File attach button (paperclip icon): opens native file picker, accepts `.jpg, .jpeg, .png, .pdf` (max 10MB)
- Microphone button: toggles recording (see `useSpeech` hook)
- When file is attached: show `FilePreview` component between input and message list
- All buttons disabled while `isStreaming` is true
- Send button changes to a stop icon during streaming (cancel stream)

**shadcn/ui components:** `Textarea`, `Button`, `Tooltip`

```tsx
function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const { isRecording, startRecording, stopRecording, transcript } = useSpeech();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Auto-populate from speech transcript
  useEffect(() => {
    if (transcript) setText(prev => prev + transcript);
  }, [transcript]);
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleSend = () => {
    if (!text.trim() && attachments.length === 0) return;
    onSend(text, attachments);
    setText('');
    setAttachments([]);
  };
  
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => f.size <= 10 * 1024 * 1024); // 10MB max
    setAttachments(prev => [...prev, ...valid]);
  };
  
  return (
    <div className="border-t p-4 bg-white">
      {attachments.length > 0 && (
        <div className="flex gap-2 mb-2">
          {attachments.map((file, i) => (
            <FilePreview key={i} file={file} onRemove={() => removeAttachment(i)} />
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <Tooltip content="Attach file">
          <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
            <Paperclip className="h-5 w-5" />
          </Button>
        </Tooltip>
        <input ref={fileInputRef} type="file" hidden accept=".jpg,.jpeg,.png,.pdf" multiple onChange={handleFileSelect} />
        
        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('chat.placeholder')}
          className="flex-1 min-h-[40px] max-h-[120px] resize-none"
          disabled={disabled}
        />
        
        <Tooltip content={isRecording ? "Stop recording" : "Voice input"}>
          <Button
            variant={isRecording ? "destructive" : "ghost"}
            size="icon"
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? <MicOff className="h-5 w-5 animate-pulse" /> : <Mic className="h-5 w-5" />}
          </Button>
        </Tooltip>
        
        <Button onClick={handleSend} disabled={disabled || (!text.trim() && attachments.length === 0)}>
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
```

---

### MessageBubble.tsx

Renders a single chat message (user or assistant).

**Key behaviors:**
- **User messages:** right-aligned, blue/primary background, white text
- **Assistant messages:** left-aligned, gray/white background, with avatar icon
- Render markdown using `react-markdown` (install: `react-markdown` + `remark-gfm` for tables/strikethrough)
- Support inline elements: bullet lists, numbered lists, links (clickable, open in new tab), code blocks, bold/italic, tables
- Show attached files as small thumbnails below the message text
- Show `ToolCallCard` components inline when the message metadata contains tool calls
- Show source citations at the bottom of assistant messages (URLs as clickable links with a "Source" label)

**shadcn/ui components:** `Avatar`, `Badge`, `Card`

```tsx
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  
  return (
    <div className={cn("flex gap-3 mb-4", isUser ? "flex-row-reverse" : "flex-row")}>
      <Avatar className="h-8 w-8 shrink-0">
        {isUser ? <UserIcon /> : <BotIcon />}
      </Avatar>
      
      <div className={cn(
        "max-w-[75%] rounded-lg px-4 py-2",
        isUser ? "bg-primary text-primary-foreground" : "bg-muted"
      )}>
        {/* Tool call cards (before text) */}
        {message.metadata?.tools_used?.map((tool, i) => (
          <ToolCallCard key={i} tool={tool} />
        ))}
        
        {/* Message content with markdown */}
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                {children}
              </a>
            ),
            // ... other component overrides
          }}
        >
          {message.content}
        </ReactMarkdown>
        
        {/* Attached files */}
        {message.attachments?.map((file, i) => (
          <FilePreview key={i} file={file} compact />
        ))}
        
        {/* Source citations */}
        {message.metadata?.sources && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <span className="text-xs text-gray-500">Sources:</span>
            {message.metadata.sources.map((url, i) => (
              <a key={i} href={url} target="_blank" className="text-xs text-blue-500 block truncate">
                {url}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### StreamingMessage.tsx

Displays the assistant's response as it streams in, token by token.

```tsx
function StreamingMessage({ content, toolCalls }: { content: string; toolCalls?: ToolCall[] }) {
  return (
    <div className="flex gap-3 mb-4">
      <Avatar className="h-8 w-8 shrink-0">
        <BotIcon />
      </Avatar>
      <div className="max-w-[75%] rounded-lg px-4 py-2 bg-muted">
        {toolCalls?.map((tc, i) => (
          <ToolCallCard key={i} tool={tc.name} status={tc.status} />
        ))}
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
        {/* Blinking cursor */}
        <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1" />
      </div>
    </div>
  );
}
```

---

### ToolCallCard.tsx

Shows when the agent calls a tool (e.g., "Retrieving requirements...", "Analyzing document...").

```tsx
const TOOL_LABELS: Record<string, { label: string; icon: ReactNode }> = {
  retrieve_requirements: { label: 'Retrieving official requirements...', icon: <Search /> },
  analyze_document: { label: 'Analyzing your document...', icon: <FileSearch /> },
  generate_prefill: { label: 'Generating pre-filled form...', icon: <FileText /> },
  get_portal_link: { label: 'Finding portal link...', icon: <ExternalLink /> },
  calculate_readiness: { label: 'Calculating readiness score...', icon: <BarChart /> },
};

function ToolCallCard({ tool, status }: { tool: string; status?: 'running' | 'done' }) {
  const info = TOOL_LABELS[tool] || { label: tool, icon: <Cog /> };
  
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500 my-2 p-2 bg-gray-50 rounded">
      {status === 'running' ? <Loader2 className="h-4 w-4 animate-spin" /> : info.icon}
      <span>{info.label}</span>
      {status === 'done' && <Check className="h-4 w-4 text-green-500" />}
    </div>
  );
}
```

---

### UploadZone.tsx

Drag-and-drop file upload area.

**shadcn/ui components:** `Card`, `Progress`

```tsx
function UploadZone({ onUpload, processType }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { showConsent, hasConsent } = useConsent();
  
  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  };
  
  const processFiles = async (files: File[]) => {
    // Check consent first
    if (!hasConsent) {
      const consented = await showConsent(); // shows ConsentModal
      if (!consented) return;
    }
    
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File too large. Maximum 10MB.');
        continue;
      }
      setUploading(true);
      setProgress(0);
      await onUpload(file, processType, (p) => setProgress(p));
      setUploading(false);
    }
  };
  
  return (
    <Card
      className={cn(
        "border-2 border-dashed p-8 text-center cursor-pointer transition-colors",
        isDragging ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400"
      )}
      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      <Upload className="h-10 w-10 mx-auto text-gray-400 mb-3" />
      <p className="text-sm text-gray-600">{t('document.drag_drop')}</p>
      <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF — Max 10MB</p>
      <input id="file-input" type="file" hidden accept=".jpg,.jpeg,.png,.pdf" multiple onChange={e => processFiles(Array.from(e.target.files || []))} />
      
      {uploading && <Progress value={progress} className="mt-4" />}
    </Card>
  );
}
```

---

### ConsentModal.tsx

Privacy consent dialog before first document upload.

**shadcn/ui components:** `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `Checkbox`, `Button`

```tsx
function ConsentModal({ open, onAccept, onDecline }: Props) {
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  
  return (
    <Dialog open={open} onOpenChange={() => onDecline()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('document.consent_title')}</DialogTitle>
          <DialogDescription>
            {t('document.consent_description')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-gray-600">
            By uploading documents, you agree to the following:
          </p>
          
          <div className="flex items-start gap-3">
            <Checkbox id="c1" checked={consent1} onCheckedChange={setConsent1} />
            <label htmlFor="c1" className="text-sm">
              I consent to AI-powered document analysis. My documents will be processed by 
              AI to extract relevant information for form filling.
            </label>
          </div>
          
          <div className="flex items-start gap-3">
            <Checkbox id="c2" checked={consent2} onCheckedChange={setConsent2} />
            <label htmlFor="c2" className="text-sm">
              I understand this is a prototype. I will verify all extracted information 
              against official sources before submission.
            </label>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onDecline}>Decline</Button>
          <Button onClick={onAccept} disabled={!consent1 || !consent2}>Accept & Upload</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

### ReadinessScore.tsx

Circular progress indicator showing application readiness.

```tsx
function ReadinessScore({ score, complete, total }: { score: number; complete: number; total: number }) {
  const color = score >= 71 ? 'text-green-500' : score >= 41 ? 'text-amber-500' : 'text-red-500';
  const bgColor = score >= 71 ? 'stroke-green-500' : score >= 41 ? 'stroke-amber-500' : 'stroke-red-500';
  
  // SVG circular progress
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={radius} fill="none"
            className={bgColor}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-3xl font-bold", color)}>{score}%</span>
        </div>
      </div>
      <p className="text-sm text-gray-500 mt-2">
        {complete}/{total} {t('readiness.documents_ready')}
      </p>
    </div>
  );
}
```

---

### RequirementsList.tsx

Checklist of required documents with status indicators.

**shadcn/ui components:** `Badge`, `Button`

```tsx
function RequirementsList({ requirements }: { requirements: RequirementItem[] }) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg">{t('readiness.required_documents')}</h3>
      {requirements.map((req, i) => (
        <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
          <div className="flex items-center gap-3">
            {req.status === 'complete' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            {req.status === 'missing' && <XCircle className="h-5 w-5 text-red-500" />}
            {req.status === 'invalid' && <AlertCircle className="h-5 w-5 text-amber-500" />}
            <span className="text-sm">{req.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={
              req.status === 'complete' ? 'default' : 
              req.status === 'invalid' ? 'secondary' : 'destructive'
            }>
              {t(`readiness.${req.status}`)}
            </Badge>
            {req.status !== 'complete' && (
              <Button variant="outline" size="sm">
                {req.status === 'invalid' ? t('document.re_upload') : t('document.upload')}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 4. State Management

### AuthContext (`src/context/AuthContext.tsx`)

```tsx
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('saarthi_token'),
    isAuthenticated: false,
    isLoading: true,
  });
  
  // On mount: validate existing token
  useEffect(() => {
    const token = localStorage.getItem('saarthi_token');
    if (token) {
      api.get('/api/auth/me')
        .then(res => setState({ user: res.data.user, token, isAuthenticated: true, isLoading: false }))
        .catch(() => {
          localStorage.removeItem('saarthi_token');
          setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
        });
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);
  
  const login = async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('saarthi_token', res.data.token);
    setState({ user: res.data.user, token: res.data.token, isAuthenticated: true, isLoading: false });
  };
  
  const register = async (email: string, password: string, name: string) => {
    const res = await api.post('/api/auth/register', { email, password, name });
    localStorage.setItem('saarthi_token', res.data.token);
    setState({ user: res.data.user, token: res.data.token, isAuthenticated: true, isLoading: false });
  };
  
  const logout = () => {
    localStorage.removeItem('saarthi_token');
    setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
  };
  
  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### ChatContext (`src/context/ChatContext.tsx`)

```tsx
interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  streamingToolCalls: ToolCall[];
}

interface ChatContextValue extends ChatState {
  createChat: (title?: string, processType?: string) => Promise<Chat>;
  loadChat: (chatId: string) => Promise<void>;
  sendMessage: (content: string, attachments?: File[]) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  cancelStream: () => void;
}

// Key implementation: sendMessage with SSE
const sendMessage = async (content: string, attachments?: File[]) => {
  // 1. Upload attachments first if any
  let attachmentIds: string[] = [];
  if (attachments?.length) {
    for (const file of attachments) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('chat_id', activeChat.id);
      const res = await api.post('/api/document/upload', formData);
      attachmentIds.push(res.data.document.id);
    }
  }
  
  // 2. Add user message to local state immediately
  const userMsg: Message = { id: tempId(), role: 'user', content, attachments };
  dispatch({ type: 'ADD_MESSAGE', message: userMsg });
  
  // 3. Start SSE stream
  dispatch({ type: 'START_STREAMING' });
  const abortController = new AbortController();
  
  const response = await fetch(`${API_URL}/api/chat/${activeChat.id}/message`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content, attachments: attachmentIds }),
    signal: abortController.signal,
  });
  
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep incomplete line in buffer
    
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7);
      } else if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        handleSSEEvent(currentEvent, data);
      }
    }
  }
  
  dispatch({ type: 'STOP_STREAMING' });
};
```

### API Client (`src/config/api.ts`)

```tsx
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
});

// Add auth token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('saarthi_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('saarthi_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```
## 5. SSE (Server-Sent Events) Integration

### Why Not EventSource

The browser's native `EventSource` API only supports GET requests. We need POST (to send the message body + auth header). Use `fetch` with `ReadableStream` instead.

### Implementation Pattern (`useChat` hook SSE logic)

```typescript
async function streamMessage(
  chatId: string,
  content: string,
  attachments: string[],
  token: string,
  callbacks: {
    onToken: (text: string) => void;
    onToolCall: (tool: string, input: any) => void;
    onToolResult: (tool: string, result: any) => void;
    onIntent: (intent: string) => void;
    onDone: (messageId: string) => void;
    onError: (message: string) => void;
  }
): Promise<void> {
  const abortController = new AbortController();
  
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/chat/${chatId}/message`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, attachments }),
      signal: abortController.signal,
    }
  );
  
  if (!response.ok) {
    const errorData = await response.json();
    callbacks.onError(errorData.message || 'Request failed');
    return;
  }
  
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let currentEvent = '';
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      // Split by double newline (SSE event boundary)
      const parts = buffer.split('\n');
      buffer = parts.pop() || '';
      
      for (const line of parts) {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('event: ')) {
          currentEvent = trimmed.slice(7);
        } else if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.slice(6));
            
            switch (currentEvent) {
              case 'token':
                callbacks.onToken(data.content);
                break;
              case 'tool_call':
                callbacks.onToolCall(data.tool, data.input);
                break;
              case 'tool_result':
                callbacks.onToolResult(data.tool, data.result);
                break;
              case 'intent':
                callbacks.onIntent(data.intent);
                break;
              case 'done':
                callbacks.onDone(data.message_id);
                break;
              case 'error':
                callbacks.onError(data.message);
                break;
            }
          } catch (parseError) {
            // Skip malformed JSON
            console.warn('Failed to parse SSE data:', trimmed);
          }
        }
        // Lines starting with ':' are comments (heartbeat) — ignore
      }
    }
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      console.log('Stream aborted by user');
    } else {
      callbacks.onError('Connection lost. Please try again.');
    }
  }
  
  return () => abortController.abort(); // Return cleanup function
}
```

### Usage in ChatContext

```typescript
const sendMessage = async (content: string, attachments?: File[]) => {
  // ... upload attachments, add user message to state ...
  
  dispatch({ type: 'START_STREAMING' });
  let streamedContent = '';
  
  const cleanup = await streamMessage(
    activeChat.id,
    content,
    attachmentIds,
    token,
    {
      onToken: (text) => {
        streamedContent += text;
        dispatch({ type: 'UPDATE_STREAM', content: streamedContent });
      },
      onToolCall: (tool, input) => {
        dispatch({ type: 'ADD_TOOL_CALL', tool, input, status: 'running' });
      },
      onToolResult: (tool, result) => {
        dispatch({ type: 'UPDATE_TOOL_CALL', tool, status: 'done', result });
      },
      onIntent: (intent) => {
        dispatch({ type: 'SET_INTENT', intent });
      },
      onDone: (messageId) => {
        // Convert streaming message to regular message
        dispatch({
          type: 'FINALIZE_STREAM',
          message: {
            id: messageId,
            role: 'assistant',
            content: streamedContent,
          }
        });
      },
      onError: (message) => {
        toast.error(message);
        dispatch({ type: 'STOP_STREAMING' });
      },
    }
  );
  
  // Store cleanup function for cancel button
  abortRef.current = cleanup;
};

const cancelStream = () => {
  abortRef.current?.();
  dispatch({ type: 'STOP_STREAMING' });
};
```

### Cleanup on Component Unmount

```typescript
useEffect(() => {
  return () => {
    // Cancel any active stream when component unmounts
    abortRef.current?.();
  };
}, []);
```

---

## 6. Speech-to-Text (Microphone)

### `useSpeech` Hook (`src/hooks/useSpeech.ts`)

```typescript
import { useState, useRef, useCallback } from 'react';
import api from '../config/api';

interface UseSpeechReturn {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string | null;
  duration: number;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  clearTranscript: () => void;
}

export function useSpeech(chatId: string): UseSpeechReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  
  const MAX_DURATION = 60; // seconds
  
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setTranscript(null);
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        } 
      });
      
      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : 'audio/webm';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Create audio blob
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        
        // Send to backend for transcription
        setIsProcessing(true);
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, `recording.webm`);
          
          const response = await api.post(`/api/chat/${chatId}/speech`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          
          setTranscript(response.data.text);
        } catch (err) {
          setError('Failed to transcribe audio. Please try again.');
        } finally {
          setIsProcessing(false);
        }
      };
      
      // Start recording
      mediaRecorder.start(1000); // Collect data every 1 second
      setIsRecording(true);
      startTimeRef.current = Date.now();
      
      // Update duration every second
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);
        
        // Auto-stop at max duration
        if (elapsed >= MAX_DURATION) {
          stopRecording();
        }
      }, 1000);
      
    } catch (err) {
      if ((err as Error).name === 'NotAllowedError') {
        setError('Microphone permission denied. Please allow microphone access in your browser settings.');
      } else {
        setError('Failed to start recording. Please check your microphone.');
      }
    }
  }, [chatId]);
  
  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, []);
  
  const clearTranscript = useCallback(() => {
    setTranscript(null);
    setDuration(0);
  }, []);
  
  return {
    isRecording, isProcessing, transcript, duration, error,
    startRecording, stopRecording, clearTranscript,
  };
}
```

### Recording UI Indicator

When recording, the mic button area should show:
- Pulsing red dot animation
- Duration timer (e.g., "0:23")
- "Tap to stop" hint text

```tsx
{isRecording && (
  <div className="flex items-center gap-2 text-red-500 text-sm">
    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
    <span>{Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}</span>
  </div>
)}
{isProcessing && (
  <div className="flex items-center gap-2 text-gray-500 text-sm">
    <Loader2 className="h-4 w-4 animate-spin" />
    <span>Transcribing...</span>
  </div>
)}
```

---

## 7. Internationalization (i18n)

### Setup (`src/config/i18n.ts`)

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'ne'],
    defaultNS: 'translation',
    
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    
    interpolation: {
      escapeValue: false, // React already escapes
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'saarthi_language',
    },
  });

export default i18n;
```

### English Translation (`public/locales/en/translation.json`)

```json
{
  "app": {
    "title": "Saarthi AI",
    "subtitle": "Government Process Copilot",
    "tagline": "Your intelligent guide to Nepal government services"
  },
  "nav": {
    "chat": "Chat",
    "documents": "Documents",
    "dashboard": "Dashboard",
    "settings": "Settings",
    "logout": "Logout"
  },
  "auth": {
    "login": "Login",
    "register": "Register",
    "email": "Email Address",
    "password": "Password",
    "name": "Full Name",
    "login_title": "Welcome Back",
    "login_subtitle": "Sign in to continue to Saarthi AI",
    "register_title": "Create Account",
    "register_subtitle": "Start navigating government processes with AI",
    "no_account": "Don't have an account?",
    "has_account": "Already have an account?",
    "login_error": "Invalid email or password",
    "register_error": "Registration failed. Please try again."
  },
  "chat": {
    "placeholder": "Ask about any government process...",
    "send": "Send",
    "new_chat": "New Chat",
    "delete_chat": "Delete Chat",
    "no_chats": "No conversations yet",
    "start_prompt": "What government process can I help you with?",
    "suggestions": {
      "company": "Register a company",
      "pan": "Apply for PAN",
      "passport": "Get a passport"
    },
    "streaming": "Saarthi is thinking...",
    "error": "Failed to send message. Please try again."
  },
  "document": {
    "upload": "Upload Document",
    "analyze": "Analyze",
    "re_upload": "Re-upload",
    "drag_drop": "Drag & drop your documents here, or click to browse",
    "consent_title": "Document Upload Consent",
    "consent_description": "Please review and accept the following before uploading documents.",
    "consent_checkbox_1": "I consent to AI-powered document analysis",
    "consent_checkbox_2": "I understand this is a prototype and will verify information independently",
    "accept": "Accept & Upload",
    "decline": "Decline",
    "uploading": "Uploading...",
    "analyzing": "Analyzing document...",
    "analysis_complete": "Analysis Complete",
    "no_documents": "No documents uploaded yet",
    "delete_confirm": "Are you sure you want to delete this document?"
  },
  "process": {
    "company": "Company Registration",
    "company_desc": "Register a private or public limited company with OCR",
    "pan": "PAN Registration",
    "pan_desc": "Register for Permanent Account Number with IRD",
    "passport": "Passport Application",
    "passport_desc": "Apply for a new passport or renewal"
  },
  "readiness": {
    "score": "Readiness Score",
    "documents_ready": "documents ready",
    "required_documents": "Required Documents",
    "complete": "Complete",
    "missing": "Missing",
    "invalid": "Needs Attention",
    "ready_to_apply": "Ready to Apply!",
    "not_ready": "Not Ready Yet",
    "get_portal_link": "Go to Portal",
    "download_form": "Download Pre-filled Form",
    "view_details": "View Details"
  },
  "speech": {
    "start": "Start voice input",
    "stop": "Stop recording",
    "processing": "Transcribing...",
    "error_permission": "Microphone permission denied",
    "error_generic": "Voice input failed"
  },
  "common": {
    "loading": "Loading...",
    "error": "Something went wrong",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "save": "Save",
    "delete": "Delete",
    "close": "Close",
    "back": "Back",
    "next": "Next",
    "retry": "Retry",
    "search": "Search...",
    "no_results": "No results found",
    "disclaimer": "This is a prototype. Always verify with official sources."
  }
}
```

### Nepali Translation (`public/locales/ne/translation.json`)

```json
{
  "app": {
    "title": "सारथी AI",
    "subtitle": "सरकारी प्रक्रिया सहायक",
    "tagline": "नेपाल सरकारी सेवाहरूको लागि तपाईंको बुद्धिमान मार्गदर्शक"
  },
  "nav": {
    "chat": "कुराकानी",
    "documents": "कागजातहरू",
    "dashboard": "ड्यासबोर्ड",
    "settings": "सेटिङ",
    "logout": "लग आउट"
  },
  "auth": {
    "login": "लग इन",
    "register": "दर्ता गर्नुहोस्",
    "email": "इमेल ठेगाना",
    "password": "पासवर्ड",
    "name": "पूरा नाम",
    "login_title": "स्वागत छ",
    "login_subtitle": "सारथी AI मा जारी राख्न साइन इन गर्नुहोस्",
    "register_title": "खाता बनाउनुहोस्",
    "register_subtitle": "AI को साथमा सरकारी प्रक्रिया सुरु गर्नुहोस्",
    "no_account": "खाता छैन?",
    "has_account": "पहिले नै खाता छ?",
    "login_error": "गलत इमेल वा पासवर्ड",
    "register_error": "दर्ता असफल भयो। कृपया फेरि प्रयास गर्नुहोस्।"
  },
  "chat": {
    "placeholder": "कुनै पनि सरकारी प्रक्रियाको बारेमा सोध्नुहोस्...",
    "send": "पठाउनुहोस्",
    "new_chat": "नयाँ कुराकानी",
    "delete_chat": "कुराकानी मेटाउनुहोस्",
    "no_chats": "अहिलेसम्म कुनै कुराकानी छैन",
    "start_prompt": "कुन सरकारी प्रक्रियामा म तपाईंलाई सहयोग गर्न सक्छु?",
    "suggestions": {
      "company": "कम्पनी दर्ता गर्नुहोस्",
      "pan": "PAN को लागि आवेदन दिनुहोस्",
      "passport": "पासपोर्ट बनाउनुहोस्"
    },
    "streaming": "सारथी सोचिरहेको छ...",
    "error": "सन्देश पठाउन असफल भयो। कृपया फेरि प्रयास गर्नुहोस्।"
  },
  "document": {
    "upload": "कागजात अपलोड गर्नुहोस्",
    "analyze": "विश्लेषण गर्नुहोस्",
    "re_upload": "पुनः अपलोड",
    "drag_drop": "तपाईंको कागजातहरू यहाँ ड्र्याग गर्नुहोस्, वा ब्राउज गर्न क्लिक गर्नुहोस्",
    "consent_title": "कागजात अपलोड सहमति",
    "consent_description": "कागजात अपलोड गर्नु अघि कृपया निम्न समीक्षा र स्वीकार गर्नुहोस्।",
    "consent_checkbox_1": "म AI-संचालित कागजात विश्लेषणमा सहमत छु",
    "consent_checkbox_2": "म बुझ्छु कि यो प्रोटोटाइप हो र जानकारी स्वतन्त्र रूपमा प्रमाणित गर्नेछु",
    "accept": "स्वीकार गर्नुहोस् र अपलोड गर्नुहोस्",
    "decline": "अस्वीकार",
    "uploading": "अपलोड हुँदैछ...",
    "analyzing": "कागजात विश्लेषण हुँदैछ...",
    "analysis_complete": "विश्लेषण पूरा भयो",
    "no_documents": "अहिलेसम्म कुनै कागजात अपलोड गरिएको छैन",
    "delete_confirm": "के तपाईं यो कागजात मेटाउन निश्चित हुनुहुन्छ?"
  },
  "process": {
    "company": "कम्पनी दर्ता",
    "company_desc": "OCR मा निजी वा सार्वजनिक लिमिटेड कम्पनी दर्ता गर्नुहोस्",
    "pan": "PAN दर्ता",
    "pan_desc": "IRD मा स्थायी लेखा नम्बरको लागि दर्ता गर्नुहोस्",
    "passport": "पासपोर्ट आवेदन",
    "passport_desc": "नयाँ पासपोर्ट वा नवीकरणको लागि आवेदन दिनुहोस्"
  },
  "readiness": {
    "score": "तत्परता स्कोर",
    "documents_ready": "कागजातहरू तयार",
    "required_documents": "आवश्यक कागजातहरू",
    "complete": "पूरा",
    "missing": "छुटेको",
    "invalid": "ध्यान चाहिन्छ",
    "ready_to_apply": "आवेदन दिन तयार!",
    "not_ready": "अझै तयार छैन",
    "get_portal_link": "पोर्टलमा जानुहोस्",
    "download_form": "पूर्व-भरिएको फारम डाउनलोड गर्नुहोस्",
    "view_details": "विवरण हेर्नुहोस्"
  },
  "speech": {
    "start": "भ्वाइस इनपुट सुरु गर्नुहोस्",
    "stop": "रेकर्डिङ बन्द गर्नुहोस्",
    "processing": "ट्रान्सक्राइब हुँदैछ...",
    "error_permission": "माइक्रोफोन अनुमति अस्वीकृत",
    "error_generic": "भ्वाइस इनपुट असफल भयो"
  },
  "common": {
    "loading": "लोड हुँदैछ...",
    "error": "केही गलत भयो",
    "cancel": "रद्द गर्नुहोस्",
    "confirm": "पुष्टि गर्नुहोस्",
    "save": "सेभ गर्नुहोस्",
    "delete": "मेटाउनुहोस्",
    "close": "बन्द गर्नुहोस्",
    "back": "पछाडि",
    "next": "अर्को",
    "retry": "पुनः प्रयास",
    "search": "खोज्नुहोस्...",
    "no_results": "कुनै नतिजा भेटिएन",
    "disclaimer": "यो प्रोटोटाइप हो। सधैं आधिकारिक स्रोतहरूसँग प्रमाणित गर्नुहोस्।"
  }
}
```

### LanguageToggle Component

```tsx
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Globe } from 'lucide-react';

function LanguageToggle() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;
  
  const toggleLanguage = () => {
    const newLang = currentLang === 'en' ? 'ne' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('saarthi_language', newLang);
    
    // Optionally update user profile in backend
    api.patch('/api/auth/me', { language_preference: newLang }).catch(() => {});
  };
  
  return (
    <Button variant="ghost" size="sm" onClick={toggleLanguage} className="gap-2">
      <Globe className="h-4 w-4" />
      {currentLang === 'en' ? 'नेपाली' : 'English'}
    </Button>
  );
}
```

### Using Translations in Components

```tsx
import { useTranslation } from 'react-i18next';

function SomeComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('app.title')}</h1>
      <p>{t('app.tagline')}</p>
      <Button>{t('chat.send')}</Button>
    </div>
  );
}
```

### Sending Language Preference to Backend

When sending a chat message, include the language so the LLM responds in the correct language:

```typescript
// In the sendMessage function
const response = await fetch(`${API_URL}/api/chat/${chatId}/message`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    content,
    attachments: attachmentIds,
    language: i18n.language, // 'en' or 'ne'
  }),
});
```

The backend then adds a language instruction to the system prompt:
```
Respond in ${language === 'ne' ? 'Nepali (नेपाली)' : 'English'}.
```
## 8. Dashboard & Process Views

### DashboardPage (`src/pages/DashboardPage.tsx`)

The dashboard shows a full overview of a user's readiness for a specific government process.

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ Header: "Company Registration" + description    │
├───────────────┬─────────────────────────────────┤
│               │                                 │
│  Readiness    │  Requirements Checklist         │
│  Score        │  ☑ Citizenship copy             │
│  [72%]        │  ☐ MoA                          │
│  3/5 docs     │  ☐ AoA                          │
│               │  ☑ Passport photo               │
│               │  ☐ Office proof                 │
├───────────────┴─────────────────────────────────┤
│ Uploaded Documents Grid                         │
│ ┌─────┐ ┌─────┐ ┌─────┐                       │
│ │ Doc │ │ Doc │ │ Doc │                         │
│ │  1  │ │  2  │ │  3  │                         │
│ └─────┘ └─────┘ └─────┘                         │
├─────────────────────────────────────────────────┤
│ [Go to Portal]  [Download Pre-filled Form]      │
│ [Start Chat about this Process]                 │
│                                                 │
│ Fees: NPR 5,000  |  Est. Time: 7-15 days       │
└─────────────────────────────────────────────────┘
```

**shadcn/ui components:** `Card`, `CardHeader`, `CardContent`, `Badge`, `Button`, `Separator`, `Tabs`, `TabsContent`

```tsx
function DashboardPage() {
  const { processType } = useParams<{ processType: string }>();
  const { t } = useTranslation();
  const { requirements, readinessScore, documents, fees, timeline } = useProcess(processType);
  
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t(`process.${processType}`)}</h1>
        <p className="text-gray-500">{t(`process.${processType}_desc`)}</p>
      </div>
      
      {/* Score + Checklist row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardContent className="flex justify-center py-8">
            <ReadinessScore 
              score={readinessScore.score} 
              complete={readinessScore.complete} 
              total={readinessScore.total} 
            />
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <h3 className="font-semibold">{t('readiness.required_documents')}</h3>
          </CardHeader>
          <CardContent>
            <RequirementsList requirements={requirements} />
          </CardContent>
        </Card>
      </div>
      
      {/* Uploaded Documents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className="font-semibold">{t('document.uploaded')}</h3>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            {t('document.upload')}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {documents.map(doc => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Action Buttons + Info */}
      <div className="flex flex-wrap gap-3">
        <Button className="bg-[#1e3a5f]">
          <ExternalLink className="h-4 w-4 mr-2" />
          {t('readiness.get_portal_link')}
        </Button>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          {t('readiness.download_form')}
        </Button>
        <Button variant="secondary">
          <MessageSquare className="h-4 w-4 mr-2" />
          {t('chat.start_about_process')}
        </Button>
      </div>
      
      {/* Fees and Timeline */}
      {(fees || timeline) && (
        <Card>
          <CardContent className="flex gap-8 py-4">
            {fees && (
              <div>
                <span className="text-sm text-gray-500">Fees:</span>
                <span className="ml-2 font-medium">{fees}</span>
              </div>
            )}
            {timeline && (
              <div>
                <span className="text-sm text-gray-500">Est. Time:</span>
                <span className="ml-2 font-medium">{timeline}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

### ProcessCard (Sidebar Mini Card)

When the agent detects a process intent during chat, show a mini card in the sidebar or chat area:

```tsx
function ProcessCard({ processType, readinessScore }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const color = readinessScore >= 71 ? 'border-green-500' : readinessScore >= 41 ? 'border-amber-500' : 'border-red-500';
  
  return (
    <Card className={cn("cursor-pointer hover:shadow-md transition-shadow border-l-4", color)}
          onClick={() => navigate(`/dashboard/${processType}`)}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">{t(`process.${processType}`)}</p>
            <p className="text-xs text-gray-500">{readinessScore}% {t('readiness.score').toLowerCase()}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 9. File Upload & Document Management

### DocumentsPage (`src/pages/DocumentsPage.tsx`)

Full page showing all uploaded documents with filtering and analysis status.

```tsx
function DocumentsPage() {
  const { t } = useTranslation();
  const { documents, isLoading, deleteDocument } = useDocuments();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<string>('all');
  
  const filtered = filter === 'all' 
    ? documents 
    : documents.filter(d => d.process_type === filter);
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('nav.documents')}</h1>
        <div className="flex gap-2">
          {/* Filter tabs */}
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="company_registration">{t('process.company')}</TabsTrigger>
              <TabsTrigger value="pan_registration">{t('process.pan')}</TabsTrigger>
              <TabsTrigger value="passport_application">{t('process.passport')}</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* View toggle */}
          <Button variant="ghost" size="icon" onClick={() => setView(v => v === 'grid' ? 'list' : 'grid')}>
            {view === 'grid' ? <List /> : <Grid />}
          </Button>
        </div>
      </div>
      
      {/* Upload zone */}
      <UploadZone onUpload={handleUpload} className="mb-6" />
      
      {/* Documents grid/list */}
      {documents.length === 0 ? (
        <EmptyState icon={<FileX />} message={t('document.no_documents')} />
      ) : (
        <div className={cn(
          view === 'grid' 
            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" 
            : "space-y-3"
        )}>
          {filtered.map(doc => (
            <DocumentCard key={doc.id} document={doc} view={view} onDelete={deleteDocument} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### DocumentCard

```tsx
function DocumentCard({ document, view, onDelete }: Props) {
  const [showAnalysis, setShowAnalysis] = useState(false);
  
  const statusColors = {
    pending: 'bg-gray-100 text-gray-600',
    analyzing: 'bg-blue-100 text-blue-600',
    analyzed: 'bg-green-100 text-green-600',
    error: 'bg-red-100 text-red-600',
  };
  
  if (view === 'list') {
    return (
      <Card className="flex items-center p-3 gap-4">
        <FileIcon className="h-8 w-8 text-gray-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{document.file_name}</p>
          <p className="text-xs text-gray-500">{formatDate(document.created_at)}</p>
        </div>
        <Badge variant="outline">{document.process_type}</Badge>
        <Badge className={statusColors[document.status]}>{document.status}</Badge>
        <Button variant="ghost" size="icon" onClick={() => setShowAnalysis(true)}>
          <Eye className="h-4 w-4" />
        </Button>
      </Card>
    );
  }
  
  return (
    <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setShowAnalysis(true)}>
      {/* Thumbnail */}
      <div className="aspect-[3/4] bg-gray-100 relative">
        {document.file_type.startsWith('image/') ? (
          <img src={document.thumbnail_url} alt={document.file_name} className="object-cover w-full h-full" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <FileText className="h-12 w-12 text-gray-300" />
          </div>
        )}
        <Badge className={cn("absolute top-2 right-2 text-xs", statusColors[document.status])}>
          {document.status}
        </Badge>
      </div>
      
      <CardContent className="p-3">
        <p className="text-sm font-medium truncate">{document.file_name}</p>
        <p className="text-xs text-gray-500">{formatDate(document.created_at)}</p>
      </CardContent>
      
      {/* Analysis dialog */}
      {showAnalysis && (
        <AnalysisDialog document={document} open={showAnalysis} onClose={() => setShowAnalysis(false)} />
      )}
    </Card>
  );
}
```

### AnalysisResult Component (Dialog)

Shows the OCR analysis results for a document:

```tsx
function AnalysisDialog({ document, open, onClose }: Props) {
  const analysis = document.validation_result;
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('document.analysis_complete')}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Document preview */}
          <div className="border rounded-lg overflow-hidden">
            <img src={document.preview_url} alt="Document" className="w-full" />
          </div>
          
          {/* Extracted fields */}
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Extracted Fields</h4>
              <div className="space-y-2">
                {analysis?.fields?.map((field, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-500">{field.name}</span>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{field.value || '—'}</span>
                      {field.status === 'present' && <Check className="h-3 w-3 text-green-500" />}
                      {field.status === 'missing' && <X className="h-3 w-3 text-red-500" />}
                      {field.status === 'low_confidence' && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Warnings */}
            {analysis?.warnings?.length > 0 && (
              <div className="bg-amber-50 p-3 rounded-lg">
                <h4 className="font-medium text-amber-800 mb-1">Warnings</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  {analysis.warnings.map((w, i) => <li key={i}>- {w}</li>)}
                </ul>
              </div>
            )}
            
            {/* Suggestions */}
            {analysis?.suggestions?.length > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-1">Suggestions</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  {analysis.suggestions.map((s, i) => <li key={i}>- {s}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 10. UI/UX Design Guidelines

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Primary (Deep Blue) | `#1e3a5f` | Headers, primary buttons, sidebar background |
| Accent (Saffron) | `#e8731a` | CTAs, highlights, Nepal flag inspired |
| Success | `#22c55e` | Complete status, readiness ≥71% |
| Warning | `#f59e0b` | Needs attention, readiness 41-70% |
| Error | `#ef4444` | Missing items, readiness <41%, errors |
| Background | `#f8fafc` (slate-50) | Page background |
| Card Background | `#ffffff` | Cards, chat bubbles |
| Text Primary | `#1e293b` (slate-800) | Main text |
| Text Secondary | `#64748b` (slate-500) | Secondary/muted text |
| Border | `#e2e8f0` (slate-200) | Card borders, dividers |

### Tailwind Config Customization

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1e3a5f',
          50: '#f0f4f8',
          100: '#d9e2ec',
          // ... generate shades
          900: '#0a1628',
        },
        accent: {
          DEFAULT: '#e8731a',
          50: '#fff7ed',
          // ... generate shades
        },
      },
      fontFamily: {
        sans: ['Inter', 'Mukta', 'system-ui', 'sans-serif'],
        nepali: ['Mukta', 'sans-serif'],
      },
    },
  },
};
```

### Typography

- **English:** Inter (from Google Fonts) — clean, modern, excellent readability
- **Nepali:** Mukta (from Google Fonts) — supports Devanagari script, pairs well with Inter
- Load both in `index.html`:
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Mukta:wght@400;500;600;700&display=swap" rel="stylesheet">
  ```

### Component Styling Patterns

- Cards: `rounded-lg border shadow-sm` (shadcn/ui default)
- Buttons: use shadcn/ui variants (`default`, `outline`, `ghost`, `destructive`)
- Primary button override: `bg-[#1e3a5f] hover:bg-[#2a4f7f]`
- Accent button: `bg-[#e8731a] hover:bg-[#d4681a] text-white`
- Inputs: shadcn/ui defaults with `focus:ring-[#1e3a5f]`

### Logo

Text-based for hackathon speed:
```tsx
function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 bg-[#1e3a5f] rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-sm">S</span>
      </div>
      <div>
        <span className="font-bold text-[#1e3a5f]">Saarthi</span>
        <span className="font-light text-[#e8731a] ml-1">AI</span>
      </div>
    </div>
  );
}
```

### Empty States

For empty chat, no documents, etc., show a friendly message with an icon:

```tsx
function EmptyState({ icon, message, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="text-gray-500 mb-4">{message}</p>
      {action}
    </div>
  );
}
```

---

## 11. Docker & Build

### Frontend Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=http://localhost:3001
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Production stage — serve with nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Config (`frontend/nginx.conf`)

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback — all routes serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # SSE support
        proxy_set_header X-Accel-Buffering no;
        proxy_buffering off;
        proxy_cache off;
    }
}
```

### Frontend Dev Dockerfile (`frontend/Dockerfile.dev`)

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

### Vite Config (`vite.config.ts`)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

### Environment Variables

```
# frontend/.env.example
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=Saarthi AI
```

---

## 12. Development Workflow

### npm Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .ts,.tsx"
  }
}
```

### Adding shadcn/ui Components

```bash
# Initialize shadcn/ui (first time)
npx shadcn-ui@latest init

# Add individual components as needed
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add scroll-area
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add sheet          # For mobile sidebar
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add tooltip
npx shadcn-ui@latest add dropdown-menu  # For user menu
npx shadcn-ui@latest add toast          # For notifications (use sonner)
```

### Component Development Order

| Order | Component / Task | Time | Description |
|-------|-----------------|------|-------------|
| 1 | **Project scaffold + routing** | 45 min | Vite init, install deps, set up React Router, create page shells |
| 2 | **Layout components** | 45 min | Layout wrapper, Header (with logo, language toggle, user menu), Sidebar (chat list, new chat button) |
| 3 | **Auth pages** | 1.5 hrs | LoginForm, RegisterForm, AuthContext, protected route wrapper, connect to API |
| 4 | **Chat interface** | 3 hrs | ChatWindow, ChatInput, MessageBubble (with react-markdown), EmptyState with suggestion chips |
| 5 | **SSE streaming** | 1 hr | StreamingMessage, ToolCallCard, fetch + ReadableStream integration in ChatContext |
| 6 | **File upload** | 1.5 hrs | UploadZone, FilePreview, ConsentModal, connect to upload API |
| 7 | **Document analysis display** | 1 hr | AnalysisResult, field extraction display, inline in chat |
| 8 | **Dashboard page** | 2 hrs | ReadinessScore (SVG circle), RequirementsList, ProcessCard, DashboardPage layout |
| 9 | **Documents page** | 1 hr | DocumentsPage, DocumentCard grid/list, filter tabs |
| 10 | **Speech-to-text** | 1 hr | useSpeech hook, mic button UI, recording indicator |
| 11 | **i18n** | 1 hr | react-i18next setup, EN + NE translation files, LanguageToggle, wrap all text with t() |
| 12 | **Polish** | 2 hrs | Responsive fixes (mobile sidebar as Sheet), loading states, error toasts, empty states, animations |
| **Total** | | **~15 hrs** | |

### Key Libraries to Install

```bash
npm install react-router-dom axios react-markdown remark-gfm react-i18next i18next i18next-http-backend lucide-react
npm install -D @types/react-router-dom
```

### File Organization Tips

- Keep components small — one component per file
- Put shared types in `src/types/`
- Use barrel exports (`index.ts`) in each directory
- Keep hooks thin — business logic in context, hooks are just wrappers
- Use `cn()` utility from shadcn/ui for conditional class merging
