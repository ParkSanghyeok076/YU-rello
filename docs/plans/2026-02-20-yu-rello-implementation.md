# YU-rello Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build YU-rello, a Trello-inspired collaboration tool for 2 users with board/list/card structure, real-time updates, and navy blue design.

**Architecture:** Next.js 14 (App Router) frontend deployed to Vercel, Supabase for backend (PostgreSQL + Auth + Realtime), navy blue (#1a2b4a) background with white lists/cards.

**Tech Stack:**
- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Supabase (PostgreSQL, Auth, Realtime)
- @dnd-kit/core (drag-and-drop)
- FullCalendar (calendar view)
- Deployed to Vercel + Supabase Cloud

---

## Phase 1: Project Setup & Authentication

### Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `next.config.js`
- Create: `.env.local`

**Step 1: Create Next.js project**

Run:
```bash
npx create-next-app@latest yu-rello --typescript --tailwind --app --no-src-dir --import-alias "@/*"
cd yu-rello
```

Expected: New Next.js project created with TypeScript and Tailwind CSS.

**Step 2: Install dependencies**

Run:
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install @fullcalendar/react @fullcalendar/daygrid
npm install date-fns
npm install --save-dev @types/node
```

Expected: All dependencies installed successfully.

**Step 3: Create environment variables file**

Create: `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Note: You'll fill these in after creating Supabase project.

**Step 4: Configure Tailwind with navy blue theme**

Modify: `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1a2b4a',
          light: '#2a3b5a',
          dark: '#0a1b3a',
        },
      },
      fontFamily: {
        logo: ['Orbitron', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
```

**Step 5: Add Google Font for logo**

Modify: `app/layout.tsx`

```typescript
import { Orbitron } from 'next/font/google'
import './globals.css'

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-logo',
})

export const metadata = {
  title: 'YU-rello',
  description: 'Collaboration tool inspired by Trello',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={orbitron.variable}>{children}</body>
    </html>
  )
}
```

**Step 6: Update global styles**

Modify: `app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-navy text-white;
}
```

**Step 7: Test development server**

Run:
```bash
npm run dev
```

Expected: Server runs at http://localhost:3000 with navy blue background.

**Step 8: Initialize git and commit**

Run:
```bash
git add .
git commit -m "feat: initialize Next.js project with Tailwind and navy blue theme

- Set up Next.js 14 with App Router
- Configure Tailwind with navy blue color palette
- Add Orbitron font for YU-rello logo
- Install Supabase and other dependencies"
```

---

### Task 2: Set Up Supabase Project

**Note:** This task is done in Supabase Dashboard (web browser).

**Step 1: Create Supabase account**

1. Go to https://supabase.com
2. Sign up with GitHub account
3. Confirm email

**Step 2: Create new project**

1. Click "New Project"
2. Name: `yu-rello`
3. Database Password: Create a strong password (save it securely!)
4. Region: Select closest region
5. Click "Create new project"
6. Wait 2-3 minutes for project to be ready

**Step 3: Get API credentials**

1. Go to Project Settings → API
2. Copy `Project URL` and `anon public` key
3. Paste into `.env.local` file

**Step 4: Update .env.local**

Modify: `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**Step 5: Create database tables**

In Supabase Dashboard → SQL Editor, run this SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (linked to auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Boards table
CREATE TABLE boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lists table
CREATE TABLE lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cards table
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checklist items table
CREATE TABLE checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_date TIMESTAMPTZ,
  completed BOOLEAN DEFAULT FALSE,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Labels table
CREATE TABLE labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL
);

-- Card-Labels junction table
CREATE TABLE card_labels (
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  label_id UUID REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, label_id)
);

-- Card members junction table
CREATE TABLE card_members (
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, user_id)
);

-- Comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Step 6: Set up Row Level Security (RLS)**

In Supabase Dashboard → SQL Editor, run:

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all profiles, update own profile
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Boards: Authenticated users can do everything
CREATE POLICY "Authenticated users can view all boards"
  ON boards FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create boards"
  ON boards FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update boards"
  ON boards FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete boards"
  ON boards FOR DELETE
  TO authenticated
  USING (true);

-- Lists: Authenticated users can do everything
CREATE POLICY "Authenticated users can view all lists"
  ON lists FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create lists"
  ON lists FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update lists"
  ON lists FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete lists"
  ON lists FOR DELETE
  TO authenticated
  USING (true);

-- Cards: Authenticated users can do everything
CREATE POLICY "Authenticated users can view all cards"
  ON cards FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create cards"
  ON cards FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update cards"
  ON cards FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete cards"
  ON cards FOR DELETE
  TO authenticated
  USING (true);

-- Apply same pattern for other tables
CREATE POLICY "Authenticated users can view checklist_items"
  ON checklist_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert checklist_items"
  ON checklist_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update checklist_items"
  ON checklist_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete checklist_items"
  ON checklist_items FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view labels"
  ON labels FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert labels"
  ON labels FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update labels"
  ON labels FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete labels"
  ON labels FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view card_labels"
  ON card_labels FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert card_labels"
  ON card_labels FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete card_labels"
  ON card_labels FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view card_members"
  ON card_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert card_members"
  ON card_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete card_members"
  ON card_members FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view comments"
  ON comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert comments"
  ON comments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update comments"
  ON comments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete comments"
  ON comments FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view notifications"
  ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert notifications"
  ON notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update notifications"
  ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can delete notifications"
  ON notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);
```

**Step 7: Create trigger for profile creation**

```sql
-- Function to create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function on new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

Expected: All tables created with RLS policies and trigger set up.

**Step 8: Document in project**

No commit needed - this is done in Supabase Dashboard.

---

### Task 3: Create Supabase Client Utility

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`

**Step 1: Create client-side Supabase client**

Create: `lib/supabase/client.ts`

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url: string | null
          created_at: string
        }
      }
      boards: {
        Row: {
          id: string
          title: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
      }
      lists: {
        Row: {
          id: string
          board_id: string
          title: string
          position: number
          created_at: string
        }
      }
      cards: {
        Row: {
          id: string
          list_id: string
          title: string
          description: string | null
          due_date: string | null
          position: number
          created_at: string
          updated_at: string
        }
      }
      checklist_items: {
        Row: {
          id: string
          card_id: string
          title: string
          due_date: string | null
          completed: boolean
          position: number
          created_at: string
        }
      }
      labels: {
        Row: {
          id: string
          board_id: string
          name: string
          color: string
        }
      }
      card_labels: {
        Row: {
          card_id: string
          label_id: string
        }
      }
      card_members: {
        Row: {
          card_id: string
          user_id: string
        }
      }
      comments: {
        Row: {
          id: string
          card_id: string
          user_id: string | null
          content: string
          created_at: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          card_id: string
          message: string
          read: boolean
          created_at: string
        }
      }
    }
  }
}

export const createClient = () => createClientComponentClient<Database>()
```

**Step 2: Create server-side Supabase client**

Create: `lib/supabase/server.ts`

```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from './client'

export const createServerClient = () => {
  const cookieStore = cookies()
  return createServerComponentClient<Database>({ cookies: () => cookieStore })
}
```

**Step 3: Test the setup**

Modify: `app/page.tsx`

```typescript
import { createServerClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-logo font-bold">YU-rello</h1>
      <p className="mt-4">
        {session ? `Logged in as ${session.user.email}` : 'Not logged in'}
      </p>
    </main>
  )
}
```

**Step 4: Run development server to test**

Run:
```bash
npm run dev
```

Expected: Page shows "YU-rello" title and "Not logged in" message.

**Step 5: Commit**

Run:
```bash
git add .
git commit -m "feat: add Supabase client utilities and database types

- Create client-side and server-side Supabase clients
- Add TypeScript types for all database tables
- Test connection on homepage"
```

---

### Task 4: Build Authentication Pages

**Files:**
- Create: `app/login/page.tsx`
- Create: `app/signup/page.tsx`
- Create: `app/auth/callback/route.ts`
- Create: `components/AuthForm.tsx`

**Step 1: Create reusable auth form component**

Create: `components/AuthForm.tsx`

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type AuthFormProps = {
  mode: 'login' | 'signup'
}

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
            },
          },
        })
        if (error) throw error
        alert('회원가입 성공! 이메일을 확인해주세요.')
        router.push('/login')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto mt-16 p-8 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-logo font-bold text-navy mb-8 text-center">
        YU-rello
      </h1>
      <h2 className="text-xl text-navy mb-6">
        {mode === 'login' ? '로그인' : '회원가입'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-navy mb-1">
              이름
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-navy focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-navy mb-1">
            이메일
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-navy focus:outline-none focus:ring-2 focus:ring-navy"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-navy mb-1">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-navy focus:outline-none focus:ring-2 focus:ring-navy"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-navy text-white rounded-md hover:bg-navy-light disabled:opacity-50 transition-colors"
        >
          {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
        </button>
      </form>

      <div className="mt-4 text-center">
        {mode === 'login' ? (
          <p className="text-navy">
            계정이 없으신가요?{' '}
            <a href="/signup" className="text-blue-600 hover:underline">
              회원가입
            </a>
          </p>
        ) : (
          <p className="text-navy">
            이미 계정이 있으신가요?{' '}
            <a href="/login" className="text-blue-600 hover:underline">
              로그인
            </a>
          </p>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Create login page**

Create: `app/login/page.tsx`

```typescript
import { AuthForm } from '@/components/AuthForm'

export default function LoginPage() {
  return <AuthForm mode="login" />
}
```

**Step 3: Create signup page**

Create: `app/signup/page.tsx`

```typescript
import { AuthForm } from '@/components/AuthForm'

export default function SignupPage() {
  return <AuthForm mode="signup" />
}
```

**Step 4: Create auth callback route**

Create: `app/auth/callback/route.ts`

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL('/dashboard', request.url))
}
```

**Step 5: Update homepage to redirect**

Modify: `app/page.tsx`

```typescript
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
```

**Step 6: Test authentication flow**

Run:
```bash
npm run dev
```

1. Go to http://localhost:3000 - should redirect to /login
2. Click "회원가입" link
3. Fill in name, email, password
4. Submit - should show "회원가입 성공! 이메일을 확인해주세요."
5. Check email for confirmation link (in development, check Supabase Dashboard → Authentication → Users)
6. Confirm email (click link in email or use Supabase Dashboard to confirm)
7. Go to /login and login with credentials

Expected: Should redirect to /dashboard (will show 404 for now - we'll create it next)

**Step 7: Commit**

Run:
```bash
git add .
git commit -m "feat: add authentication pages (login/signup)

- Create reusable AuthForm component
- Build login and signup pages
- Add auth callback route
- Redirect homepage based on auth status"
```

---

## Phase 2: Dashboard & Board Management

### Task 5: Create Dashboard Layout

**Files:**
- Create: `app/dashboard/layout.tsx`
- Create: `app/dashboard/page.tsx`
- Create: `components/Header.tsx`
- Create: `components/Toolbar.tsx`

**Step 1: Create Header component**

Create: `components/Header.tsx`

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type HeaderProps = {
  userEmail: string
  userName: string
}

export function Header({ userEmail, userName }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="bg-navy border-b border-navy-light px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-logo font-bold">YU-rello</h1>
          {/* Board selector will go here */}
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications will go here */}
          <div className="flex items-center gap-2">
            <span className="text-sm">{userName}</span>
            <button
              onClick={handleLogout}
              className="px-3 py-1 text-sm bg-navy-light hover:bg-navy-dark rounded transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
```

**Step 2: Create Toolbar component**

Create: `components/Toolbar.tsx`

```typescript
'use client'

import { useState } from 'react'

type ToolbarProps = {
  onViewChange: (view: 'board' | 'calendar') => void
  onUserFilterChange: (userId: string | null) => void
  users: Array<{ id: string; name: string }>
}

export function Toolbar({ onViewChange, onUserFilterChange, users }: ToolbarProps) {
  const [currentView, setCurrentView] = useState<'board' | 'calendar'>('board')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)

  const handleViewChange = (view: 'board' | 'calendar') => {
    setCurrentView(view)
    onViewChange(view)
  }

  const handleUserFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === 'all' ? null : e.target.value
    setSelectedUser(value)
    onUserFilterChange(value)
  }

  return (
    <div className="bg-navy-light px-6 py-3 flex items-center justify-between">
      <div className="flex gap-2">
        <button
          onClick={() => handleViewChange('board')}
          className={`px-4 py-2 rounded transition-colors ${
            currentView === 'board'
              ? 'bg-white text-navy font-medium'
              : 'bg-navy-dark text-white hover:bg-navy'
          }`}
        >
          📋 보드 뷰
        </button>
        <button
          onClick={() => handleViewChange('calendar')}
          className={`px-4 py-2 rounded transition-colors ${
            currentView === 'calendar'
              ? 'bg-white text-navy font-medium'
              : 'bg-navy-dark text-white hover:bg-navy'
          }`}
        >
          📅 달력 뷰
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm">👤 필터:</span>
        <select
          value={selectedUser || 'all'}
          onChange={handleUserFilterChange}
          className="px-3 py-1 bg-white text-navy rounded focus:outline-none focus:ring-2 focus:ring-white"
        >
          <option value="all">모두 보기</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
```

**Step 3: Create dashboard layout**

Create: `app/dashboard/layout.tsx`

```typescript
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/Header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerClient()

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  return (
    <div className="min-h-screen bg-navy">
      <Header
        userEmail={session.user.email!}
        userName={profile?.name || 'User'}
      />
      {children}
    </div>
  )
}
```

**Step 4: Create dashboard page**

Create: `app/dashboard/page.tsx`

```typescript
import { createServerClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = createServerClient()

  const { data: boards } = await supabase
    .from('boards')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">내 보드</h2>

        {boards && boards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => (
              <a
                key={board.id}
                href={`/board/${board.id}`}
                className="p-6 bg-white text-navy rounded-lg hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-semibold">{board.title}</h3>
                <p className="text-sm text-gray-600 mt-2">
                  생성일: {new Date(board.created_at).toLocaleDateString('ko-KR')}
                </p>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">아직 보드가 없습니다. 새 보드를 만들어보세요!</p>
        )}
      </div>

      <a
        href="/board/new"
        className="inline-block px-6 py-3 bg-white text-navy rounded-lg hover:bg-gray-100 transition-colors font-medium"
      >
        + 새 보드 만들기
      </a>
    </div>
  )
}
```

**Step 5: Test dashboard**

Run:
```bash
npm run dev
```

1. Login at http://localhost:3000
2. Should see dashboard with "내 보드" heading
3. Should see "아직 보드가 없습니다" message
4. Should see "+ 새 보드 만들기" button
5. Header should show "YU-rello" logo and logout button

Expected: Dashboard renders with header, no boards shown yet.

**Step 6: Commit**

Run:
```bash
git add .
git commit -m "feat: create dashboard layout with header and toolbar

- Add Header component with YU-rello logo and logout
- Add Toolbar component with view switcher and user filter
- Create dashboard layout with auth check
- Show boards list (empty for now)"
```

---

### Task 6: Create New Board Page

**Files:**
- Create: `app/board/new/page.tsx`
- Create: `components/BoardForm.tsx`

**Step 1: Create BoardForm component**

Create: `components/BoardForm.tsx`

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function BoardForm() {
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('boards')
        .insert({
          title,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw error

      router.push(`/board/${data.id}`)
      router.refresh()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-navy mb-6">새 보드 만들기</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-navy mb-1">
            보드 이름
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="예: 프로젝트 관리"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-navy focus:outline-none focus:ring-2 focus:ring-navy"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2 px-4 bg-navy text-white rounded-md hover:bg-navy-light disabled:opacity-50 transition-colors"
          >
            {loading ? '생성 중...' : '보드 만들기'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-200 text-navy rounded-md hover:bg-gray-300 transition-colors"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  )
}
```

**Step 2: Create new board page**

Create: `app/board/new/page.tsx`

```typescript
import { BoardForm } from '@/components/BoardForm'

export default function NewBoardPage() {
  return <BoardForm />
}
```

**Step 3: Test board creation**

Run:
```bash
npm run dev
```

1. Go to http://localhost:3000/dashboard
2. Click "+ 새 보드 만들기"
3. Enter board name "테스트 보드"
4. Click "보드 만들기"

Expected: Should redirect to /board/[id] (will show 404 for now - we'll create it next). Go back to dashboard and should see the board listed.

**Step 4: Commit**

Run:
```bash
git add .
git commit -m "feat: add board creation functionality

- Create BoardForm component
- Add new board page
- Insert board into Supabase
- Redirect to board after creation"
```

---

---

## Phase 2: Board View & Basic CRUD Operations

### Task 7: Create Board View Page

**Files:**
- Create: `app/board/[id]/page.tsx`
- Create: `components/BoardView.tsx`
- Create: `components/List.tsx`
- Create: `components/Card.tsx`

**Step 1: Create Board page**

Create: `app/board/[id]/page.tsx`

```typescript
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BoardView } from '@/components/BoardView'

export default async function BoardPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()

  // Check authentication
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }

  // Fetch board
  const { data: board } = await supabase
    .from('boards')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!board) {
    redirect('/dashboard')
  }

  // Fetch lists with cards
  const { data: lists } = await supabase
    .from('lists')
    .select(`
      *,
      cards (
        *,
        card_labels (
          label_id,
          labels (*)
        ),
        card_members (
          user_id,
          profiles (*)
        ),
        checklist_items (*),
        comments (*)
      )
    `)
    .eq('board_id', params.id)
    .order('position', { ascending: true })

  // Fetch all users for filter
  const { data: users } = await supabase
    .from('profiles')
    .select('id, name, email')

  return (
    <BoardView
      board={board}
      initialLists={lists || []}
      users={users || []}
      currentUserId={session.user.id}
    />
  )
}
```

**Step 2: Create BoardView client component**

Create: `components/BoardView.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Toolbar } from './Toolbar'
import { List } from './List'

type BoardViewProps = {
  board: any
  initialLists: any[]
  users: Array<{ id: string; name: string; email: string }>
  currentUserId: string
}

export function BoardView({ board, initialLists, users, currentUserId }: BoardViewProps) {
  const [lists, setLists] = useState(initialLists)
  const [currentView, setCurrentView] = useState<'board' | 'calendar'>('board')
  const [userFilter, setUserFilter] = useState<string | null>(null)

  // Filter cards based on selected user
  const filteredLists = userFilter
    ? lists.map(list => ({
        ...list,
        cards: list.cards.filter((card: any) =>
          card.card_members.some((m: any) => m.user_id === userFilter)
        ),
      }))
    : lists

  return (
    <div className="min-h-screen bg-navy">
      <Toolbar
        onViewChange={setCurrentView}
        onUserFilterChange={setUserFilter}
        users={users}
      />

      {currentView === 'board' ? (
        <div className="p-6 overflow-x-auto">
          <h1 className="text-3xl font-bold mb-6">{board.title}</h1>

          <div className="flex gap-4">
            {filteredLists.map((list) => (
              <List
                key={list.id}
                list={list}
                onUpdate={() => {
                  // Refresh logic will go here
                }}
              />
            ))}

            <button className="flex-shrink-0 w-72 p-4 bg-navy-light hover:bg-navy-dark rounded-lg transition-colors text-left">
              <span className="text-white">+ 리스트 추가</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6">
          <p className="text-gray-400">달력 뷰는 나중에 구현됩니다.</p>
        </div>
      )}
    </div>
  )
}
```

**Step 3: Create List component**

Create: `components/List.tsx`

```typescript
'use client'

import { Card } from './Card'

type ListProps = {
  list: any
  onUpdate: () => void
}

export function List({ list, onUpdate }: ListProps) {
  return (
    <div className="flex-shrink-0 w-72 bg-white rounded-lg p-4 max-h-[calc(100vh-200px)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-navy">{list.title}</h3>
        <button className="text-gray-500 hover:text-gray-700">⋯</button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {list.cards
          .sort((a: any, b: any) => a.position - b.position)
          .map((card: any) => (
            <Card key={card.id} card={card} />
          ))}
      </div>

      <button className="mt-4 w-full p-2 text-left text-gray-600 hover:bg-gray-100 rounded transition-colors">
        + 카드 추가
      </button>
    </div>
  )
}
```

**Step 4: Create Card component**

Create: `components/Card.tsx`

```typescript
'use client'

type CardProps = {
  card: any
}

export function Card({ card }: CardProps) {
  const completedItems = card.checklist_items?.filter((item: any) => item.completed).length || 0
  const totalItems = card.checklist_items?.length || 0
  const hasComments = card.comments?.length > 0

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors">
      {/* Labels */}
      {card.card_labels?.length > 0 && (
        <div className="flex gap-1 mb-2">
          {card.card_labels.map((cl: any) => (
            <div
              key={cl.label_id}
              className="h-2 w-10 rounded"
              style={{ backgroundColor: cl.labels.color }}
            />
          ))}
        </div>
      )}

      {/* Title */}
      <p className="text-navy font-medium mb-2">{card.title}</p>

      {/* Metadata */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        {totalItems > 0 && (
          <span className="flex items-center gap-1">
            ✓ {completedItems}/{totalItems}
          </span>
        )}
        {hasComments && (
          <span className="flex items-center gap-1">
            💬 {card.comments.length}
          </span>
        )}
        {card.due_date && (
          <span className="flex items-center gap-1">
            📅 {new Date(card.due_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

      {/* Members */}
      {card.card_members?.length > 0 && (
        <div className="flex gap-1 mt-2">
          {card.card_members.slice(0, 3).map((member: any) => (
            <div
              key={member.user_id}
              className="w-6 h-6 rounded-full bg-navy text-white text-xs flex items-center justify-center"
              title={member.profiles?.name}
            >
              {member.profiles?.name?.[0]?.toUpperCase()}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 5: Test board view**

Run:
```bash
npm run dev
```

1. Go to http://localhost:3000/dashboard
2. Click on a board (if you created one in Task 6)
3. Should see board view with empty lists section
4. Should see "+ 리스트 추가" button

Expected: Board page renders with navy background, white lists (empty), toolbar with view switcher and user filter.

**Step 6: Commit**

Run:
```bash
git add .
git commit -m "feat: create board view with lists and cards display

- Add dynamic board page with [id] route
- Create BoardView component with toolbar integration
- Build List component to display cards
- Create Card component with labels, checklist progress, comments count
- Support user filtering (UI only, backend in next tasks)"
```

---

### Task 8: Add List Creation Functionality

**Files:**
- Modify: `components/BoardView.tsx`
- Create: `components/CreateListButton.tsx`

**Step 1: Create CreateListButton component**

Create: `components/CreateListButton.tsx`

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type CreateListButtonProps = {
  boardId: string
  currentPosition: number
  onListCreated: () => void
}

export function CreateListButton({ boardId, currentPosition, onListCreated }: CreateListButtonProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('lists')
        .insert({
          board_id: boardId,
          title: title.trim(),
          position: currentPosition,
        })

      if (error) throw error

      setTitle('')
      setIsAdding(false)
      onListCreated()
    } catch (error) {
      console.error('Error creating list:', error)
      alert('리스트 생성 실패')
    } finally {
      setLoading(false)
    }
  }

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="flex-shrink-0 w-72 p-4 bg-navy-light hover:bg-navy-dark rounded-lg transition-colors text-left"
      >
        <span className="text-white">+ 리스트 추가</span>
      </button>
    )
  }

  return (
    <div className="flex-shrink-0 w-72 bg-white rounded-lg p-4">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="리스트 제목 입력..."
          autoFocus
          className="w-full px-3 py-2 border border-gray-300 rounded text-navy mb-2 focus:outline-none focus:ring-2 focus:ring-navy"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="px-3 py-1 bg-navy text-white rounded hover:bg-navy-light disabled:opacity-50"
          >
            {loading ? '추가 중...' : '리스트 추가'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdding(false)
              setTitle('')
            }}
            className="px-3 py-1 text-gray-600 hover:text-gray-800"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  )
}
```

**Step 2: Update BoardView to use CreateListButton**

Modify: `components/BoardView.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Toolbar } from './Toolbar'
import { List } from './List'
import { CreateListButton } from './CreateListButton'

type BoardViewProps = {
  board: any
  initialLists: any[]
  users: Array<{ id: string; name: string; email: string }>
  currentUserId: string
}

export function BoardView({ board, initialLists, users, currentUserId }: BoardViewProps) {
  const [lists, setLists] = useState(initialLists)
  const [currentView, setCurrentView] = useState<'board' | 'calendar'>('board')
  const [userFilter, setUserFilter] = useState<string | null>(null)
  const router = useRouter()

  const handleRefresh = () => {
    router.refresh()
  }

  // Filter cards based on selected user
  const filteredLists = userFilter
    ? lists.map(list => ({
        ...list,
        cards: list.cards.filter((card: any) =>
          card.card_members.some((m: any) => m.user_id === userFilter)
        ),
      }))
    : lists

  return (
    <div className="min-h-screen bg-navy">
      <Toolbar
        onViewChange={setCurrentView}
        onUserFilterChange={setUserFilter}
        users={users}
      />

      {currentView === 'board' ? (
        <div className="p-6 overflow-x-auto">
          <h1 className="text-3xl font-bold mb-6">{board.title}</h1>

          <div className="flex gap-4">
            {filteredLists.map((list) => (
              <List
                key={list.id}
                list={list}
                onUpdate={handleRefresh}
              />
            ))}

            <CreateListButton
              boardId={board.id}
              currentPosition={lists.length}
              onListCreated={handleRefresh}
            />
          </div>
        </div>
      ) : (
        <div className="p-6">
          <p className="text-gray-400">달력 뷰는 나중에 구현됩니다.</p>
        </div>
      )}
    </div>
  )
}
```

**Step 3: Test list creation**

Run:
```bash
npm run dev
```

1. Go to a board page
2. Click "+ 리스트 추가"
3. Enter "할 일" and click "리스트 추가"
4. Should see new list appear
5. Create another list "진행 중"

Expected: Lists are created and displayed. Page refreshes to show new lists.

**Step 4: Commit**

Run:
```bash
git add .
git commit -m "feat: add list creation functionality

- Create CreateListButton component with form
- Insert lists into Supabase
- Auto-refresh board view after creation
- Handle position ordering"
```

---

### Task 9: Add Card Creation Functionality

**Files:**
- Modify: `components/List.tsx`
- Create: `components/CreateCardButton.tsx`

**Step 1: Create CreateCardButton component**

Create: `components/CreateCardButton.tsx`

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type CreateCardButtonProps = {
  listId: string
  currentPosition: number
  onCardCreated: () => void
}

export function CreateCardButton({ listId, currentPosition, onCardCreated }: CreateCardButtonProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('cards')
        .insert({
          list_id: listId,
          title: title.trim(),
          position: currentPosition,
        })

      if (error) throw error

      setTitle('')
      setIsAdding(false)
      onCardCreated()
    } catch (error) {
      console.error('Error creating card:', error)
      alert('카드 생성 실패')
    } finally {
      setLoading(false)
    }
  }

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="w-full p-2 text-left text-gray-600 hover:bg-gray-100 rounded transition-colors"
      >
        + 카드 추가
      </button>
    )
  }

  return (
    <div className="bg-white rounded-lg p-2 shadow">
      <form onSubmit={handleSubmit}>
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="카드 제목을 입력하세요..."
          autoFocus
          rows={3}
          className="w-full px-2 py-1 border border-gray-300 rounded text-navy resize-none focus:outline-none focus:ring-2 focus:ring-navy"
        />
        <div className="flex gap-2 mt-2">
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="px-3 py-1 bg-navy text-white text-sm rounded hover:bg-navy-light disabled:opacity-50"
          >
            {loading ? '추가 중...' : '카드 추가'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdding(false)
              setTitle('')
            }}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  )
}
```

**Step 2: Update List component**

Modify: `components/List.tsx`

```typescript
'use client'

import { Card } from './Card'
import { CreateCardButton } from './CreateCardButton'

type ListProps = {
  list: any
  onUpdate: () => void
}

export function List({ list, onUpdate }: ListProps) {
  return (
    <div className="flex-shrink-0 w-72 bg-white rounded-lg p-4 max-h-[calc(100vh-200px)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-navy">{list.title}</h3>
        <button className="text-gray-500 hover:text-gray-700">⋯</button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 mb-2">
        {list.cards
          .sort((a: any, b: any) => a.position - b.position)
          .map((card: any) => (
            <Card key={card.id} card={card} />
          ))}
      </div>

      <CreateCardButton
        listId={list.id}
        currentPosition={list.cards.length}
        onCardCreated={onUpdate}
      />
    </div>
  )
}
```

**Step 3: Test card creation**

Run:
```bash
npm run dev
```

1. Go to a board with lists
2. Click "+ 카드 추가" on a list
3. Enter "첫 번째 작업" and click "카드 추가"
4. Create more cards in different lists

Expected: Cards appear in their respective lists. Page refreshes after creation.

**Step 4: Commit**

Run:
```bash
git add .
git commit -m "feat: add card creation functionality

- Create CreateCardButton with textarea form
- Insert cards into Supabase
- Auto-refresh to show new cards
- Handle card positioning within lists"
```

---

### Task 10: Create Card Detail Modal

**Files:**
- Modify: `components/Card.tsx`
- Create: `components/CardModal.tsx`

**Step 1: Create CardModal component**

Create: `components/CardModal.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type CardModalProps = {
  cardId: string
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export function CardModal({ cardId, isOpen, onClose, onUpdate }: CardModalProps) {
  const [card, setCard] = useState<any>(null)
  const [description, setDescription] = useState('')
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (isOpen && cardId) {
      fetchCard()
    }
  }, [isOpen, cardId])

  const fetchCard = async () => {
    const { data } = await supabase
      .from('cards')
      .select(`
        *,
        lists (title),
        card_labels (
          label_id,
          labels (*)
        ),
        card_members (
          user_id,
          profiles (*)
        ),
        checklist_items (*),
        comments (
          *,
          profiles (*)
        )
      `)
      .eq('id', cardId)
      .single()

    if (data) {
      setCard(data)
      setDescription(data.description || '')
    }
  }

  const handleUpdateDescription = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('cards')
        .update({ description })
        .eq('id', cardId)

      if (error) throw error

      setIsEditingDescription(false)
      fetchCard()
      onUpdate()
    } catch (error) {
      console.error('Error updating description:', error)
      alert('설명 업데이트 실패')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCard = async () => {
    if (!confirm('정말 이 카드를 삭제하시겠습니까?')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId)

      if (error) throw error

      onClose()
      onUpdate()
    } catch (error) {
      console.error('Error deleting card:', error)
      alert('카드 삭제 실패')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !card) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-8 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Labels */}
              {card.card_labels?.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {card.card_labels.map((cl: any) => (
                    <span
                      key={cl.label_id}
                      className="px-3 py-1 rounded text-white text-sm"
                      style={{ backgroundColor: cl.labels.color }}
                    >
                      {cl.labels.name}
                    </span>
                  ))}
                </div>
              )}

              <h2 className="text-2xl font-bold text-navy">{card.title}</h2>
              <p className="text-sm text-gray-600 mt-1">
                in list <span className="font-medium">{card.lists.title}</span>
              </p>
            </div>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-light"
            >
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-navy mb-2 flex items-center gap-2">
              📝 설명
            </h3>
            {isEditingDescription ? (
              <div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded text-navy resize-none focus:outline-none focus:ring-2 focus:ring-navy"
                  rows={5}
                  placeholder="이 카드에 대한 설명을 추가하세요..."
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleUpdateDescription}
                    disabled={loading}
                    className="px-4 py-2 bg-navy text-white rounded hover:bg-navy-light disabled:opacity-50"
                  >
                    {loading ? '저장 중...' : '저장'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingDescription(false)
                      setDescription(card.description || '')
                    }}
                    className="px-4 py-2 bg-gray-200 text-navy rounded hover:bg-gray-300"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setIsEditingDescription(true)}
                className="p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors min-h-[100px]"
              >
                {card.description ? (
                  <p className="text-navy whitespace-pre-wrap">{card.description}</p>
                ) : (
                  <p className="text-gray-400">설명을 추가하려면 클릭하세요...</p>
                )}
              </div>
            )}
          </div>

          {/* Checklist placeholder */}
          <div>
            <h3 className="text-lg font-semibold text-navy mb-2 flex items-center gap-2">
              ✓ 체크리스트
            </h3>
            <p className="text-gray-400 text-sm">체크리스트 기능은 나중에 추가됩니다.</p>
          </div>

          {/* Members placeholder */}
          <div>
            <h3 className="text-lg font-semibold text-navy mb-2 flex items-center gap-2">
              👥 멤버
            </h3>
            <div className="flex gap-2">
              {card.card_members?.map((member: any) => (
                <div
                  key={member.user_id}
                  className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded"
                >
                  <div className="w-6 h-6 rounded-full bg-navy text-white text-xs flex items-center justify-center">
                    {member.profiles?.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm text-navy">{member.profiles?.name}</span>
                </div>
              ))}
              {card.card_members?.length === 0 && (
                <p className="text-gray-400 text-sm">멤버 할당 기능은 나중에 추가됩니다.</p>
              )}
            </div>
          </div>

          {/* Comments placeholder */}
          <div>
            <h3 className="text-lg font-semibold text-navy mb-2 flex items-center gap-2">
              💬 댓글
            </h3>
            <p className="text-gray-400 text-sm">댓글 기능은 나중에 추가됩니다.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-between">
          <button
            onClick={handleDeleteCard}
            disabled={loading}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            🗑️ 카드 삭제
          </button>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Update Card component to open modal**

Modify: `components/Card.tsx`

```typescript
'use client'

import { useState } from 'react'
import { CardModal } from './CardModal'

type CardProps = {
  card: any
  onUpdate?: () => void
}

export function Card({ card, onUpdate }: CardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const completedItems = card.checklist_items?.filter((item: any) => item.completed).length || 0
  const totalItems = card.checklist_items?.length || 0
  const hasComments = card.comments?.length > 0

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        {/* Labels */}
        {card.card_labels?.length > 0 && (
          <div className="flex gap-1 mb-2">
            {card.card_labels.map((cl: any) => (
              <div
                key={cl.label_id}
                className="h-2 w-10 rounded"
                style={{ backgroundColor: cl.labels.color }}
              />
            ))}
          </div>
        )}

        {/* Title */}
        <p className="text-navy font-medium mb-2">{card.title}</p>

        {/* Metadata */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {totalItems > 0 && (
            <span className="flex items-center gap-1">
              ✓ {completedItems}/{totalItems}
            </span>
          )}
          {hasComments && (
            <span className="flex items-center gap-1">
              💬 {card.comments.length}
            </span>
          )}
          {card.due_date && (
            <span className="flex items-center gap-1">
              📅 {new Date(card.due_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>

        {/* Members */}
        {card.card_members?.length > 0 && (
          <div className="flex gap-1 mt-2">
            {card.card_members.slice(0, 3).map((member: any) => (
              <div
                key={member.user_id}
                className="w-6 h-6 rounded-full bg-navy text-white text-xs flex items-center justify-center"
                title={member.profiles?.name}
              >
                {member.profiles?.name?.[0]?.toUpperCase()}
              </div>
            ))}
          </div>
        )}
      </div>

      <CardModal
        cardId={card.id}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={onUpdate || (() => {})}
      />
    </>
  )
}
```

**Step 3: Update List to pass onUpdate to Card**

Modify: `components/List.tsx`

```typescript
'use client'

import { Card } from './Card'
import { CreateCardButton } from './CreateCardButton'

type ListProps = {
  list: any
  onUpdate: () => void
}

export function List({ list, onUpdate }: ListProps) {
  return (
    <div className="flex-shrink-0 w-72 bg-white rounded-lg p-4 max-h-[calc(100vh-200px)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-navy">{list.title}</h3>
        <button className="text-gray-500 hover:text-gray-700">⋯</button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 mb-2">
        {list.cards
          .sort((a: any, b: any) => a.position - b.position)
          .map((card: any) => (
            <Card key={card.id} card={card} onUpdate={onUpdate} />
          ))}
      </div>

      <CreateCardButton
        listId={list.id}
        currentPosition={list.cards.length}
        onCardCreated={onUpdate}
      />
    </div>
  )
}
```

**Step 4: Test card modal**

Run:
```bash
npm run dev
```

1. Go to a board with cards
2. Click on any card
3. Modal should open showing card details
4. Click on description area and edit it
5. Save description
6. Try deleting a card
7. Click X or outside modal to close

Expected: Modal opens/closes smoothly. Description can be edited and saved. Card deletion works with confirmation.

**Step 5: Commit**

Run:
```bash
git add .
git commit -m "feat: add card detail modal

- Create CardModal component with description editing
- Add modal open/close functionality to Card component
- Support card deletion with confirmation
- Display labels, members (read-only for now)
- Add placeholders for checklist and comments"
```

---

### Task 11: Implement Drag-and-Drop for Cards

**Files:**
- Modify: `components/List.tsx`
- Modify: `components/Card.tsx`
- Modify: `package.json` (dependencies already installed in Task 1)

**Step 1: Update List component with sortable cards**

Modify: `components/List.tsx`

```typescript
'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Card } from './Card'
import { CreateCardButton } from './CreateCardButton'

type ListProps = {
  list: any
  onUpdate: () => void
}

export function List({ list, onUpdate }: ListProps) {
  const { setNodeRef } = useDroppable({
    id: list.id,
  })

  const cardIds = list.cards
    .sort((a: any, b: any) => a.position - b.position)
    .map((card: any) => card.id)

  return (
    <div className="flex-shrink-0 w-72 bg-white rounded-lg p-4 max-h-[calc(100vh-200px)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-navy">{list.title}</h3>
        <button className="text-gray-500 hover:text-gray-700">⋯</button>
      </div>

      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex-1 overflow-y-auto space-y-2 mb-2">
          {list.cards
            .sort((a: any, b: any) => a.position - b.position)
            .map((card: any) => (
              <Card key={card.id} card={card} onUpdate={onUpdate} />
            ))}
        </div>
      </SortableContext>

      <CreateCardButton
        listId={list.id}
        currentPosition={list.cards.length}
        onCardCreated={onUpdate}
      />
    </div>
  )
}
```

**Step 2: Make Card draggable**

Modify: `components/Card.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CardModal } from './CardModal'

type CardProps = {
  card: any
  onUpdate?: () => void
}

export function Card({ card, onUpdate }: CardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const completedItems = card.checklist_items?.filter((item: any) => item.completed).length || 0
  const totalItems = card.checklist_items?.length || 0
  const hasComments = card.comments?.length > 0

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => setIsModalOpen(true)}
        className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        {/* Labels */}
        {card.card_labels?.length > 0 && (
          <div className="flex gap-1 mb-2">
            {card.card_labels.map((cl: any) => (
              <div
                key={cl.label_id}
                className="h-2 w-10 rounded"
                style={{ backgroundColor: cl.labels.color }}
              />
            ))}
          </div>
        )}

        {/* Title */}
        <p className="text-navy font-medium mb-2">{card.title}</p>

        {/* Metadata */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {totalItems > 0 && (
            <span className="flex items-center gap-1">
              ✓ {completedItems}/{totalItems}
            </span>
          )}
          {hasComments && (
            <span className="flex items-center gap-1">
              💬 {card.comments.length}
            </span>
          )}
          {card.due_date && (
            <span className="flex items-center gap-1">
              📅 {new Date(card.due_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>

        {/* Members */}
        {card.card_members?.length > 0 && (
          <div className="flex gap-1 mt-2">
            {card.card_members.slice(0, 3).map((member: any) => (
              <div
                key={member.user_id}
                className="w-6 h-6 rounded-full bg-navy text-white text-xs flex items-center justify-center"
                title={member.profiles?.name}
              >
                {member.profiles?.name?.[0]?.toUpperCase()}
              </div>
            ))}
          </div>
        )}
      </div>

      <CardModal
        cardId={card.id}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={onUpdate || (() => {})}
      />
    </>
  )
}
```

**Step 3: Add DnD context to BoardView**

Modify: `components/BoardView.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { Toolbar } from './Toolbar'
import { List } from './List'
import { CreateListButton } from './CreateListButton'
import { createClient } from '@/lib/supabase/client'

type BoardViewProps = {
  board: any
  initialLists: any[]
  users: Array<{ id: string; name: string; email: string }>
  currentUserId: string
}

export function BoardView({ board, initialLists, users, currentUserId }: BoardViewProps) {
  const [lists, setLists] = useState(initialLists)
  const [currentView, setCurrentView] = useState<'board' | 'calendar'>('board')
  const [userFilter, setUserFilter] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleRefresh = () => {
    router.refresh()
  }

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = async (event: any) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    const activeCard = lists
      .flatMap(list => list.cards)
      .find((card: any) => card.id === active.id)

    if (!activeCard) {
      setActiveId(null)
      return
    }

    // Find which list the card is over
    const overList = lists.find((list: any) =>
      list.cards.some((card: any) => card.id === over.id) || list.id === over.id
    )

    if (!overList) {
      setActiveId(null)
      return
    }

    const oldListId = activeCard.list_id
    const newListId = overList.id

    // If dropped in the same list, reorder
    if (oldListId === newListId) {
      const oldList = lists.find((list: any) => list.id === oldListId)
      const oldIndex = oldList.cards.findIndex((card: any) => card.id === active.id)
      const newIndex = oldList.cards.findIndex((card: any) => card.id === over.id)

      if (oldIndex !== newIndex) {
        const newCards = arrayMove(oldList.cards, oldIndex, newIndex)

        // Update positions in database
        for (let i = 0; i < newCards.length; i++) {
          await supabase
            .from('cards')
            .update({ position: i })
            .eq('id', newCards[i].id)
        }

        handleRefresh()
      }
    } else {
      // Move to different list
      await supabase
        .from('cards')
        .update({
          list_id: newListId,
          position: overList.cards.length,
        })
        .eq('id', active.id)

      handleRefresh()
    }

    setActiveId(null)
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  // Filter cards based on selected user
  const filteredLists = userFilter
    ? lists.map(list => ({
        ...list,
        cards: list.cards.filter((card: any) =>
          card.card_members.some((m: any) => m.user_id === userFilter)
        ),
      }))
    : lists

  const activeCard = activeId
    ? lists.flatMap(list => list.cards).find((card: any) => card.id === activeId)
    : null

  return (
    <div className="min-h-screen bg-navy">
      <Toolbar
        onViewChange={setCurrentView}
        onUserFilterChange={setUserFilter}
        users={users}
      />

      {currentView === 'board' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="p-6 overflow-x-auto">
            <h1 className="text-3xl font-bold mb-6">{board.title}</h1>

            <div className="flex gap-4">
              {filteredLists.map((list) => (
                <List
                  key={list.id}
                  list={list}
                  onUpdate={handleRefresh}
                />
              ))}

              <CreateListButton
                boardId={board.id}
                currentPosition={lists.length}
                onListCreated={handleRefresh}
              />
            </div>
          </div>

          <DragOverlay>
            {activeCard ? (
              <div className="w-72 bg-white border-2 border-navy rounded-lg p-3 opacity-90 shadow-xl">
                <p className="text-navy font-medium">{activeCard.title}</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="p-6">
          <p className="text-gray-400">달력 뷰는 나중에 구현됩니다.</p>
        </div>
      )}
    </div>
  )
}
```

**Step 4: Test drag-and-drop**

Run:
```bash
npm run dev
```

1. Go to a board with multiple cards
2. Try dragging a card within the same list
3. Try dragging a card to a different list
4. Cards should reorder smoothly

Expected: Cards can be dragged and dropped within lists and between lists. Positions are saved to database.

**Step 5: Commit**

Run:
```bash
git add .
git commit -m "feat: implement drag-and-drop for cards

- Add @dnd-kit sortable functionality to cards
- Support dragging within same list (reorder)
- Support dragging between lists
- Update card positions in database
- Show drag overlay during drag"
```

---

### Task 12: Implement Drag-and-Drop for Lists

**Files:**
- Modify: `components/BoardView.tsx`
- Modify: `components/List.tsx`

**Step 1: Make List draggable**

Modify: `components/List.tsx`

```typescript
'use client'

import { useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Card } from './Card'
import { CreateCardButton } from './CreateCardButton'

type ListProps = {
  list: any
  onUpdate: () => void
}

export function List({ list, onUpdate }: ListProps) {
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: list.id,
  })

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `list-${list.id}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const cardIds = list.cards
    .sort((a: any, b: any) => a.position - b.position)
    .map((card: any) => card.id)

  return (
    <div
      ref={setSortableRef}
      style={style}
      className="flex-shrink-0 w-72 bg-white rounded-lg p-4 max-h-[calc(100vh-200px)] flex flex-col"
    >
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-between mb-4 cursor-grab active:cursor-grabbing"
      >
        <h3 className="font-semibold text-navy">{list.title}</h3>
        <button className="text-gray-500 hover:text-gray-700">⋯</button>
      </div>

      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div ref={setDroppableRef} className="flex-1 overflow-y-auto space-y-2 mb-2">
          {list.cards
            .sort((a: any, b: any) => a.position - b.position)
            .map((card: any) => (
              <Card key={card.id} card={card} onUpdate={onUpdate} />
            ))}
        </div>
      </SortableContext>

      <CreateCardButton
        listId={list.id}
        currentPosition={list.cards.length}
        onCardCreated={onUpdate}
      />
    </div>
  )
}
```

**Step 2: Update BoardView for list drag-and-drop**

Modify: `components/BoardView.tsx`

Add this near the top of the component:

```typescript
const listIds = lists.map(list => `list-${list.id}`)
```

Update the drag handlers to handle both cards and lists:

```typescript
const handleDragEnd = async (event: any) => {
  const { active, over } = event

  if (!over) {
    setActiveId(null)
    return
  }

  // Check if dragging a list
  if (active.id.toString().startsWith('list-')) {
    const activeListId = active.id.toString().replace('list-', '')
    const overListId = over.id.toString().replace('list-', '')

    const oldIndex = lists.findIndex((list: any) => list.id === activeListId)
    const newIndex = lists.findIndex((list: any) => list.id === overListId)

    if (oldIndex !== newIndex) {
      const newLists = arrayMove(lists, oldIndex, newIndex)

      // Update positions in database
      for (let i = 0; i < newLists.length; i++) {
        await supabase
          .from('lists')
          .update({ position: i })
          .eq('id', newLists[i].id)
      }

      handleRefresh()
    }

    setActiveId(null)
    return
  }

  // Existing card drag logic...
  const activeCard = lists
    .flatMap(list => list.cards)
    .find((card: any) => card.id === active.id)

  if (!activeCard) {
    setActiveId(null)
    return
  }

  // ... rest of card drag logic
}
```

Wrap the lists in SortableContext:

```typescript
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'

// In the return statement:
<SortableContext items={listIds} strategy={horizontalListSortingStrategy}>
  <div className="flex gap-4">
    {filteredLists.map((list) => (
      <List
        key={list.id}
        list={list}
        onUpdate={handleRefresh}
      />
    ))}

    <CreateListButton
      boardId={board.id}
      currentPosition={lists.length}
      onListCreated={handleRefresh}
    />
  </div>
</SortableContext>
```

**Step 3: Test list drag-and-drop**

Run:
```bash
npm run dev
```

1. Go to a board with multiple lists
2. Drag a list by its header
3. Drop it in a different position
4. Lists should reorder

Expected: Lists can be dragged and reordered. Positions are saved. Card drag-and-drop still works.

**Step 4: Commit**

Run:
```bash
git add .
git commit -m "feat: implement drag-and-drop for lists

- Make list headers draggable
- Support horizontal list reordering
- Update list positions in database
- Maintain card drag-and-drop functionality"
```

---

## Phase 2 Complete!

**All Tasks (7-12) completed:**
- ✅ Task 7: Board View Page
- ✅ Task 8: List Creation
- ✅ Task 9: Card Creation
- ✅ Task 10: Card Modal
- ✅ Task 11: Card Drag-and-Drop
- ✅ Task 12: List Drag-and-Drop

**Phase 3 (Tasks 13-20) will include:**
- Checklist Items
- Labels System
- Comments System
- Member Assignment
- Calendar View
- User Filtering (backend)
- Notifications
- Real-time Updates

---

## Phase 3: Advanced Features

### Task 13: Add Checklist Items

**Files:**
- Modify: `components/CardModal.tsx`
- Create: `components/ChecklistSection.tsx`
- Create: `components/ChecklistItem.tsx`

**Step 1: Create ChecklistItem component**

Create: `components/ChecklistItem.tsx`

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type ChecklistItemProps = {
  item: any
  onUpdate: () => void
}

export function ChecklistItem({ item, onUpdate }: ChecklistItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(item.title)
  const [dueDate, setDueDate] = useState(item.due_date || '')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleToggle = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('checklist_items')
        .update({ completed: !item.completed })
        .eq('id', item.id)

      if (error) throw error
      onUpdate()
    } catch (error) {
      console.error('Error toggling item:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('checklist_items')
        .update({
          title: title.trim(),
          due_date: dueDate || null,
        })
        .eq('id', item.id)

      if (error) throw error
      setIsEditing(false)
      onUpdate()
    } catch (error) {
      console.error('Error updating item:', error)
      alert('항목 업데이트 실패')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('이 항목을 삭제하시겠습니까?')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('checklist_items')
        .delete()
        .eq('id', item.id)

      if (error) throw error
      onUpdate()
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('항목 삭제 실패')
    } finally {
      setLoading(false)
    }
  }

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 p-2 bg-gray-50 rounded">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded text-navy focus:outline-none focus:ring-2 focus:ring-navy"
        />
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dueDate ? new Date(dueDate).toISOString().split('T')[0] : ''}
            onChange={(e) => setDueDate(e.target.value ? new Date(e.target.value).toISOString() : '')}
            className="px-2 py-1 border border-gray-300 rounded text-navy text-sm focus:outline-none focus:ring-2 focus:ring-navy"
          />
          <button
            onClick={handleUpdate}
            disabled={loading || !title.trim()}
            className="px-3 py-1 bg-navy text-white text-sm rounded hover:bg-navy-light disabled:opacity-50"
          >
            저장
          </button>
          <button
            onClick={() => {
              setIsEditing(false)
              setTitle(item.title)
              setDueDate(item.due_date || '')
            }}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
          >
            취소
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded group">
      <input
        type="checkbox"
        checked={item.completed}
        onChange={handleToggle}
        disabled={loading}
        className="w-4 h-4 text-navy border-gray-300 rounded focus:ring-navy cursor-pointer"
      />
      <div
        onClick={() => setIsEditing(true)}
        className="flex-1 cursor-pointer"
      >
        <span className={`text-navy ${item.completed ? 'line-through text-gray-400' : ''}`}>
          {item.title}
        </span>
        {item.due_date && (
          <span className="ml-2 text-sm text-gray-500">
            📅 {new Date(item.due_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-sm"
      >
        🗑️
      </button>
    </div>
  )
}
```

**Step 2: Create ChecklistSection component**

Create: `components/ChecklistSection.tsx`

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChecklistItem } from './ChecklistItem'

type ChecklistSectionProps = {
  cardId: string
  items: any[]
  onUpdate: () => void
}

export function ChecklistSection({ cardId, items, onUpdate }: ChecklistSectionProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newItemTitle, setNewItemTitle] = useState('')
  const [newItemDueDate, setNewItemDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleAdd = async () => {
    if (!newItemTitle.trim()) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('checklist_items')
        .insert({
          card_id: cardId,
          title: newItemTitle.trim(),
          due_date: newItemDueDate || null,
          position: items.length,
        })

      if (error) throw error

      setNewItemTitle('')
      setNewItemDueDate('')
      setIsAdding(false)
      onUpdate()
    } catch (error) {
      console.error('Error adding item:', error)
      alert('항목 추가 실패')
    } finally {
      setLoading(false)
    }
  }

  const completedCount = items.filter(item => item.completed).length
  const totalCount = items.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div>
      <h3 className="text-lg font-semibold text-navy mb-2 flex items-center gap-2">
        ✓ 체크리스트
        {totalCount > 0 && (
          <span className="text-sm font-normal text-gray-600">
            {completedCount}/{totalCount}
          </span>
        )}
      </h3>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-navy h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Items */}
      <div className="space-y-1 mb-3">
        {items
          .sort((a, b) => a.position - b.position)
          .map((item) => (
            <ChecklistItem key={item.id} item={item} onUpdate={onUpdate} />
          ))}
      </div>

      {/* Add new item */}
      {isAdding ? (
        <div className="flex flex-col gap-2 p-2 bg-gray-50 rounded">
          <input
            type="text"
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            placeholder="항목 제목..."
            autoFocus
            className="px-2 py-1 border border-gray-300 rounded text-navy focus:outline-none focus:ring-2 focus:ring-navy"
          />
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={newItemDueDate}
              onChange={(e) => setNewItemDueDate(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-navy text-sm focus:outline-none focus:ring-2 focus:ring-navy"
            />
            <button
              onClick={handleAdd}
              disabled={loading || !newItemTitle.trim()}
              className="px-3 py-1 bg-navy text-white text-sm rounded hover:bg-navy-light disabled:opacity-50"
            >
              {loading ? '추가 중...' : '추가'}
            </button>
            <button
              onClick={() => {
                setIsAdding(false)
                setNewItemTitle('')
                setNewItemDueDate('')
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full text-left px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
        >
          + 항목 추가
        </button>
      )}
    </div>
  )
}
```

**Step 3: Update CardModal to use ChecklistSection**

Modify: `components/CardModal.tsx`

Replace the checklist placeholder section with:

```typescript
import { ChecklistSection } from './ChecklistSection'

// In the modal body, replace the checklist placeholder:
{/* Checklist */}
<ChecklistSection
  cardId={cardId}
  items={card.checklist_items || []}
  onUpdate={() => {
    fetchCard()
    onUpdate()
  }}
/>
```

**Step 4: Test checklist functionality**

Run:
```bash
npm run dev
```

1. Open a card modal
2. Click "+ 항목 추가"
3. Add checklist item "데이터베이스 설계" with due date
4. Check/uncheck items
5. Edit an item
6. Delete an item

Expected: Checklist items can be created, toggled, edited (with due dates), and deleted. Progress bar updates.

**Step 5: Commit**

Run:
```bash
git add .
git commit -m "feat: add checklist items functionality

- Create ChecklistItem component with toggle, edit, delete
- Create ChecklistSection with progress bar
- Support due dates for individual checklist items
- Integrate into CardModal
- Show completion progress"
```

---

### Task 14: Add Labels System

**Files:**
- Modify: `components/CardModal.tsx`
- Create: `components/LabelsSection.tsx`
- Create: `components/LabelPicker.tsx`

**Step 1: Create LabelPicker component**

Create: `components/LabelPicker.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type LabelPickerProps = {
  boardId: string
  cardId: string
  currentLabels: any[]
  onUpdate: () => void
  onClose: () => void
}

const PRESET_COLORS = [
  { name: '빨강', color: '#ef4444' },
  { name: '주황', color: '#f97316' },
  { name: '노랑', color: '#eab308' },
  { name: '초록', color: '#22c55e' },
  { name: '파랑', color: '#3b82f6' },
  { name: '남색', color: '#6366f1' },
  { name: '보라', color: '#a855f7' },
  { name: '분홍', color: '#ec4899' },
]

export function LabelPicker({ boardId, cardId, currentLabels, onUpdate, onClose }: LabelPickerProps) {
  const [boardLabels, setBoardLabels] = useState<any[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState(PRESET_COLORS[0].color)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchBoardLabels()
  }, [])

  const fetchBoardLabels = async () => {
    const { data } = await supabase
      .from('labels')
      .select('*')
      .eq('board_id', boardId)

    setBoardLabels(data || [])
  }

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('labels')
        .insert({
          board_id: boardId,
          name: newLabelName.trim(),
          color: newLabelColor,
        })
        .select()
        .single()

      if (error) throw error

      await supabase
        .from('card_labels')
        .insert({
          card_id: cardId,
          label_id: data.id,
        })

      setNewLabelName('')
      setIsCreating(false)
      fetchBoardLabels()
      onUpdate()
    } catch (error) {
      console.error('Error creating label:', error)
      alert('라벨 생성 실패')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleLabel = async (labelId: string) => {
    const isAttached = currentLabels.some(cl => cl.label_id === labelId)

    setLoading(true)
    try {
      if (isAttached) {
        const { error } = await supabase
          .from('card_labels')
          .delete()
          .eq('card_id', cardId)
          .eq('label_id', labelId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('card_labels')
          .insert({
            card_id: cardId,
            label_id: labelId,
          })

        if (error) throw error
      }

      onUpdate()
    } catch (error) {
      console.error('Error toggling label:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-72 z-10">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-navy">라벨</h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          ×
        </button>
      </div>

      {/* Existing labels */}
      <div className="space-y-2 mb-3">
        {boardLabels.map((label) => {
          const isAttached = currentLabels.some(cl => cl.label_id === label.id)
          return (
            <button
              key={label.id}
              onClick={() => handleToggleLabel(label.id)}
              disabled={loading}
              className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <div
                className="w-8 h-4 rounded"
                style={{ backgroundColor: label.color }}
              />
              <span className="flex-1 text-left text-navy">{label.name}</span>
              {isAttached && <span className="text-navy">✓</span>}
            </button>
          )
        })}
      </div>

      {/* Create new label */}
      {isCreating ? (
        <div className="border-t pt-3">
          <input
            type="text"
            value={newLabelName}
            onChange={(e) => setNewLabelName(e.target.value)}
            placeholder="라벨 이름..."
            autoFocus
            className="w-full px-2 py-1 border border-gray-300 rounded text-navy mb-2 focus:outline-none focus:ring-2 focus:ring-navy"
          />
          <div className="grid grid-cols-4 gap-2 mb-2">
            {PRESET_COLORS.map((preset) => (
              <button
                key={preset.color}
                onClick={() => setNewLabelColor(preset.color)}
                className={`w-full h-8 rounded ${newLabelColor === preset.color ? 'ring-2 ring-navy' : ''}`}
                style={{ backgroundColor: preset.color }}
                title={preset.name}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreateLabel}
              disabled={loading || !newLabelName.trim()}
              className="flex-1 px-3 py-1 bg-navy text-white text-sm rounded hover:bg-navy-light disabled:opacity-50"
            >
              생성
            </button>
            <button
              onClick={() => {
                setIsCreating(false)
                setNewLabelName('')
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsCreating(true)}
          className="w-full px-3 py-2 bg-gray-100 text-navy text-sm rounded hover:bg-gray-200"
        >
          + 새 라벨 만들기
        </button>
      )}
    </div>
  )
}
```

**Step 2: Create LabelsSection component**

Create: `components/LabelsSection.tsx`

```typescript
'use client'

import { useState } from 'react'
import { LabelPicker } from './LabelPicker'

type LabelsSectionProps = {
  boardId: string
  cardId: string
  labels: any[]
  onUpdate: () => void
}

export function LabelsSection({ boardId, cardId, labels, onUpdate }: LabelsSectionProps) {
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div>
      <h3 className="text-lg font-semibold text-navy mb-2 flex items-center gap-2">
        🏷️ 라벨
      </h3>

      <div className="flex flex-wrap gap-2 mb-2">
        {labels.map((cl) => (
          <span
            key={cl.label_id}
            className="px-3 py-1 rounded text-white text-sm font-medium"
            style={{ backgroundColor: cl.labels.color }}
          >
            {cl.labels.name}
          </span>
        ))}
      </div>

      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="px-3 py-1 bg-gray-100 text-navy text-sm rounded hover:bg-gray-200"
        >
          {labels.length > 0 ? '라벨 편집' : '+ 라벨 추가'}
        </button>

        {showPicker && (
          <LabelPicker
            boardId={boardId}
            cardId={cardId}
            currentLabels={labels}
            onUpdate={() => {
              onUpdate()
            }}
            onClose={() => setShowPicker(false)}
          />
        )}
      </div>
    </div>
  )
}
```

**Step 3: Update CardModal to use LabelsSection**

Modify: `components/CardModal.tsx`

Add to the modal body after checklist:

```typescript
import { LabelsSection } from './LabelsSection'

// After checklist section:
{/* Labels */}
<LabelsSection
  boardId={card.lists?.board_id || board.id}
  cardId={cardId}
  labels={card.card_labels || []}
  onUpdate={() => {
    fetchCard()
    onUpdate()
  }}
/>
```

Note: You'll need to pass `board` prop to CardModal or fetch board_id from the list.

**Step 4: Test labels**

Run:
```bash
npm run dev
```

1. Open card modal
2. Click "+ 라벨 추가"
3. Create new labels with different colors
4. Attach/detach labels to cards
5. Labels should appear on card in board view

Expected: Labels can be created, attached, detached. They show in both board view and modal.

**Step 5: Commit**

Run:
```bash
git add .
git commit -m "feat: add labels system

- Create LabelPicker with color presets
- Create LabelsSection for card modal
- Support creating board-level labels
- Attach/detach labels to cards
- Display labels on cards in board view"
```

---

### Task 15: Add Comments System

**Files:**
- Modify: `components/CardModal.tsx`
- Create: `components/CommentsSection.tsx`
- Create: `components/Comment.tsx`

**Step 1: Create Comment component**

Create: `components/Comment.tsx`

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type CommentProps = {
  comment: any
  currentUserId: string
  onUpdate: () => void
}

export function Comment({ comment, currentUserId, onUpdate }: CommentProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(comment.content)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const isOwner = comment.user_id === currentUserId

  const handleUpdate = async () => {
    if (!content.trim()) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('comments')
        .update({ content: content.trim() })
        .eq('id', comment.id)

      if (error) throw error

      setIsEditing(false)
      onUpdate()
    } catch (error) {
      console.error('Error updating comment:', error)
      alert('댓글 수정 실패')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('이 댓글을 삭제하시겠습니까?')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', comment.id)

      if (error) throw error

      onUpdate()
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('댓글 삭제 실패')
    } finally {
      setLoading(false)
    }
  }

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)

    if (seconds < 60) return '방금 전'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간 전`
    return `${Math.floor(seconds / 86400)}일 전`
  }

  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-navy text-white text-xs flex items-center justify-center flex-shrink-0">
        {comment.profiles?.name?.[0]?.toUpperCase()}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-navy">{comment.profiles?.name}</span>
          <span className="text-sm text-gray-500">{timeAgo(comment.created_at)}</span>
        </div>

        {isEditing ? (
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-navy resize-none focus:outline-none focus:ring-2 focus:ring-navy"
              rows={3}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleUpdate}
                disabled={loading || !content.trim()}
                className="px-3 py-1 bg-navy text-white text-sm rounded hover:bg-navy-light disabled:opacity-50"
              >
                {loading ? '저장 중...' : '저장'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false)
                  setContent(comment.content)
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-navy whitespace-pre-wrap mb-2">{comment.content}</p>
            {isOwner && (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm text-gray-600 hover:text-navy"
                >
                  수정
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="text-sm text-gray-600 hover:text-red-600 disabled:opacity-50"
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Create CommentsSection component**

Create: `components/CommentsSection.tsx`

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Comment } from './Comment'

type CommentsSectionProps = {
  cardId: string
  comments: any[]
  currentUserId: string
  currentUserName: string
  onUpdate: () => void
}

export function CommentsSection({
  cardId,
  comments,
  currentUserId,
  currentUserName,
  onUpdate,
}: CommentsSectionProps) {
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async () => {
    if (!newComment.trim()) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          card_id: cardId,
          user_id: currentUserId,
          content: newComment.trim(),
        })

      if (error) throw error

      setNewComment('')
      onUpdate()
    } catch (error) {
      console.error('Error adding comment:', error)
      alert('댓글 추가 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-navy mb-3 flex items-center gap-2">
        💬 댓글
        {comments.length > 0 && (
          <span className="text-sm font-normal text-gray-600">
            {comments.length}개
          </span>
        )}
      </h3>

      {/* Add comment */}
      <div className="mb-4 flex gap-3">
        <div className="w-8 h-8 rounded-full bg-navy text-white text-xs flex items-center justify-center flex-shrink-0">
          {currentUserName?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="댓글을 입력하세요..."
            className="w-full px-3 py-2 border border-gray-300 rounded text-navy resize-none focus:outline-none focus:ring-2 focus:ring-navy"
            rows={3}
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !newComment.trim()}
            className="mt-2 px-4 py-2 bg-navy text-white rounded hover:bg-navy-light disabled:opacity-50"
          >
            {loading ? '추가 중...' : '댓글 추가'}
          </button>
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-4">
        {comments
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onUpdate={onUpdate}
            />
          ))}
      </div>

      {comments.length === 0 && (
        <p className="text-gray-400 text-sm">아직 댓글이 없습니다.</p>
      )}
    </div>
  )
}
```

**Step 3: Update CardModal to use CommentsSection**

Modify: `components/CardModal.tsx`

Replace the comments placeholder with:

```typescript
import { CommentsSection } from './CommentsSection'

// You'll need to pass currentUserId and currentUserName as props to CardModal
// Update CardModal props:
type CardModalProps = {
  cardId: string
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
  currentUserId: string
  currentUserName: string
}

// In the modal body:
{/* Comments */}
<CommentsSection
  cardId={cardId}
  comments={card.comments || []}
  currentUserId={currentUserId}
  currentUserName={currentUserName}
  onUpdate={() => {
    fetchCard()
    onUpdate()
  }}
/>
```

**Step 4: Update Card component to pass user info**

Modify: `components/Card.tsx`

```typescript
type CardProps = {
  card: any
  onUpdate?: () => void
  currentUserId?: string
  currentUserName?: string
}

export function Card({ card, onUpdate, currentUserId, currentUserName }: CardProps) {
  // ...

  <CardModal
    cardId={card.id}
    isOpen={isModalOpen}
    onClose={() => setIsModalOpen(false)}
    onUpdate={onUpdate || (() => {})}
    currentUserId={currentUserId || ''}
    currentUserName={currentUserName || 'User'}
  />
}
```

**Step 5: Update BoardView to pass user info to cards**

Modify: `components/BoardView.tsx`

You'll need to fetch current user's profile and pass it down through List to Card.

**Step 6: Test comments**

Run:
```bash
npm run dev
```

1. Open card modal
2. Add a comment
3. Edit your own comment
4. Delete your comment
5. Comments should show time ago

Expected: Comments can be added, edited (by owner), deleted (by owner). Real-time would need Task 20.

**Step 7: Commit**

Run:
```bash
git add .
git commit -m "feat: add comments system

- Create Comment component with edit/delete
- Create CommentsSection with add comment form
- Support markdown-style comments
- Show relative timestamps (1분 전, 2시간 전)
- Only owners can edit/delete their comments"
```

---

### Task 16: Add Member Assignment

**Files:**
- Modify: `components/CardModal.tsx`
- Create: `components/MembersSection.tsx`
- Create: `components/MemberPicker.tsx`

**Step 1: Create MemberPicker component**

Create: `components/MemberPicker.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type MemberPickerProps = {
  cardId: string
  currentMembers: any[]
  onUpdate: () => void
  onClose: () => void
}

export function MemberPicker({ cardId, currentMembers, onUpdate, onClose }: MemberPickerProps) {
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, email')

    setAllUsers(data || [])
  }

  const handleToggleMember = async (userId: string) => {
    const isAssigned = currentMembers.some(m => m.user_id === userId)

    setLoading(true)
    try {
      if (isAssigned) {
        const { error } = await supabase
          .from('card_members')
          .delete()
          .eq('card_id', cardId)
          .eq('user_id', userId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('card_members')
          .insert({
            card_id: cardId,
            user_id: userId,
          })

        if (error) throw error
      }

      onUpdate()
    } catch (error) {
      console.error('Error toggling member:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-64 z-10">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-navy">멤버</h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          ×
        </button>
      </div>

      <div className="space-y-2">
        {allUsers.map((user) => {
          const isAssigned = currentMembers.some(m => m.user_id === user.id)
          return (
            <button
              key={user.id}
              onClick={() => handleToggleMember(user.id)}
              disabled={loading}
              className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <div className="w-8 h-8 rounded-full bg-navy text-white text-xs flex items-center justify-center">
                {user.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 text-left">
                <p className="text-navy font-medium">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              {isAssigned && <span className="text-navy">✓</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

**Step 2: Create MembersSection component**

Create: `components/MembersSection.tsx`

```typescript
'use client'

import { useState } from 'react'
import { MemberPicker } from './MemberPicker'

type MembersSectionProps = {
  cardId: string
  members: any[]
  onUpdate: () => void
}

export function MembersSection({ cardId, members, onUpdate }: MembersSectionProps) {
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div>
      <h3 className="text-lg font-semibold text-navy mb-2 flex items-center gap-2">
        👥 멤버
      </h3>

      <div className="flex flex-wrap gap-2 mb-2">
        {members.map((member) => (
          <div
            key={member.user_id}
            className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded"
          >
            <div className="w-6 h-6 rounded-full bg-navy text-white text-xs flex items-center justify-center">
              {member.profiles?.name?.[0]?.toUpperCase()}
            </div>
            <span className="text-sm text-navy">{member.profiles?.name}</span>
          </div>
        ))}
      </div>

      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="px-3 py-1 bg-gray-100 text-navy text-sm rounded hover:bg-gray-200"
        >
          {members.length > 0 ? '멤버 편집' : '+ 멤버 추가'}
        </button>

        {showPicker && (
          <MemberPicker
            cardId={cardId}
            currentMembers={members}
            onUpdate={() => {
              onUpdate()
            }}
            onClose={() => setShowPicker(false)}
          />
        )}
      </div>
    </div>
  )
}
```

**Step 3: Update CardModal to use MembersSection**

Modify: `components/CardModal.tsx`

Replace members placeholder with:

```typescript
import { MembersSection } from './MembersSection'

{/* Members */}
<MembersSection
  cardId={cardId}
  members={card.card_members || []}
  onUpdate={() => {
    fetchCard()
    onUpdate()
  }}
/>
```

**Step 4: Test member assignment**

Run:
```bash
npm run dev
```

1. Open card modal
2. Click "+ 멤버 추가"
3. Select users to assign
4. Members should show on card
5. User filter in toolbar should work

Expected: Members can be assigned/unassigned. They show on cards. Filter works.

**Step 5: Commit**

Run:
```bash
git add .
git commit -m "feat: add member assignment

- Create MemberPicker to assign/unassign users
- Create MembersSection for card modal
- Display assigned members on cards
- Support user filtering (already had UI)"
```

---

### Task 17: Add Calendar View

**Files:**
- Modify: `components/BoardView.tsx`
- Create: `components/CalendarView.tsx`

**Step 1: Create CalendarView component**

Create: `components/CalendarView.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'

type CalendarViewProps = {
  lists: any[]
  onCardClick: (cardId: string) => void
}

export function CalendarView({ lists, onCardClick }: CalendarViewProps) {
  const [events, setEvents] = useState<any[]>([])

  useEffect(() => {
    // Convert checklist items to calendar events
    const calendarEvents: any[] = []

    lists.forEach((list) => {
      list.cards.forEach((card: any) => {
        card.checklist_items?.forEach((item: any) => {
          if (item.due_date) {
            calendarEvents.push({
              id: item.id,
              title: `${item.completed ? '✓ ' : ''}${item.title}`,
              date: item.due_date.split('T')[0],
              backgroundColor: item.completed ? '#22c55e' : '#1a2b4a',
              borderColor: item.completed ? '#16a34a' : '#0a1b3a',
              extendedProps: {
                cardId: card.id,
                cardTitle: card.title,
                listTitle: list.title,
                completed: item.completed,
              },
            })
          }
        })

        // Also add card due dates
        if (card.due_date) {
          calendarEvents.push({
            id: `card-${card.id}`,
            title: `📋 ${card.title}`,
            date: card.due_date.split('T')[0],
            backgroundColor: '#6366f1',
            borderColor: '#4f46e5',
            extendedProps: {
              cardId: card.id,
              cardTitle: card.title,
              listTitle: list.title,
            },
          })
        }
      })
    })

    setEvents(calendarEvents)
  }, [lists])

  const handleEventClick = (info: any) => {
    const cardId = info.event.extendedProps.cardId
    if (cardId) {
      onCardClick(cardId)
    }
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <style>{`
        .fc {
          --fc-border-color: #e5e7eb;
          --fc-button-bg-color: #1a2b4a;
          --fc-button-border-color: #1a2b4a;
          --fc-button-hover-bg-color: #2a3b5a;
          --fc-button-hover-border-color: #2a3b5a;
          --fc-button-active-bg-color: #0a1b3a;
          --fc-button-active-border-color: #0a1b3a;
          --fc-today-bg-color: #f0f9ff;
        }
        .fc-event {
          cursor: pointer;
        }
        .fc-event:hover {
          opacity: 0.8;
        }
        .fc .fc-daygrid-day-number {
          color: #1a2b4a;
        }
        .fc .fc-col-header-cell-cushion {
          color: #1a2b4a;
          font-weight: 600;
        }
      `}</style>

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick={handleEventClick}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek',
        }}
        height="auto"
        locale="ko"
      />
    </div>
  )
}
```

**Step 2: Update BoardView to show CalendarView**

Modify: `components/BoardView.tsx`

```typescript
import { CalendarView } from './CalendarView'

// Add state for selected card in calendar
const [selectedCardId, setSelectedCardId] = useState<string | null>(null)

// In the return statement, replace calendar placeholder:
{currentView === 'calendar' ? (
  <div className="p-6">
    <h1 className="text-3xl font-bold mb-6">{board.title}</h1>
    <CalendarView
      lists={filteredLists}
      onCardClick={(cardId) => {
        setSelectedCardId(cardId)
      }}
    />
  </div>
) : (
  // ... existing board view
)}
```

**Step 3: Install FullCalendar**

Run:
```bash
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/interaction
```

**Step 4: Test calendar view**

Run:
```bash
npm run dev
```

1. Go to a board
2. Add checklist items with due dates to cards
3. Click "📅 달력 뷰" in toolbar
4. Should see calendar with events
5. Click on events to open card modal

Expected: Calendar shows all checklist item due dates and card due dates. Clicking opens the card.

**Step 5: Commit**

Run:
```bash
git add .
git commit -m "feat: add calendar view

- Create CalendarView component with FullCalendar
- Show checklist item due dates as events
- Show card due dates as events
- Support clicking events to open cards
- Style calendar with navy theme
- Add month/week view toggle"
```

---

### Task 18: Implement Notifications System

**Files:**
- Modify: `components/Header.tsx`
- Create: `components/NotificationBell.tsx`
- Create: `lib/notifications.ts`

**Step 1: Create notifications utility**

Create: `lib/notifications.ts`

```typescript
import { createClient } from './supabase/client'

export type NotificationType = 'member_assigned' | 'comment_added' | 'due_soon'

export async function createNotification(
  userId: string,
  type: NotificationType,
  cardId: string,
  message: string
) {
  const supabase = createClient()

  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      card_id: cardId,
      message,
    })

  if (error) {
    console.error('Error creating notification:', error)
  }
}

export async function sendBrowserNotification(title: string, body: string) {
  if (!('Notification' in window)) {
    return
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
    })
  } else if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
      })
    }
  }
}
```

**Step 2: Create NotificationBell component**

Create: `components/NotificationBell.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type NotificationBellProps = {
  userId: string
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchNotifications()

    // Request notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*, cards(title)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    setNotifications(data || [])
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const handleMarkAsRead = async (notificationId: string) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) throw error

      fetchNotifications()
    } catch (error) {
      console.error('Error marking as read:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAllAsRead = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) throw error

      fetchNotifications()
    } catch (error) {
      console.error('Error marking all as read:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationClick = (notification: any) => {
    handleMarkAsRead(notification.id)
    setShowDropdown(false)
    router.push(`/board/${notification.card_id}`)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 hover:bg-navy-light rounded transition-colors"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-navy">알림</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                모두 읽음
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                알림이 없습니다
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <p className="text-navy text-sm mb-1">{notification.message}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(notification.created_at).toLocaleString('ko-KR')}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 3: Update Header to use NotificationBell**

Modify: `components/Header.tsx`

```typescript
import { NotificationBell } from './NotificationBell'

// Add userId prop to Header
type HeaderProps = {
  userEmail: string
  userName: string
  userId: string
}

export function Header({ userEmail, userName, userId }: HeaderProps) {
  // ... existing code

  <div className="flex items-center gap-4">
    <NotificationBell userId={userId} />
    <div className="flex items-center gap-2">
      {/* ... existing user info */}
    </div>
  </div>
}
```

**Step 4: Create notifications on events**

Modify: `components/MemberPicker.tsx` to create notification when assigning:

```typescript
import { createNotification, sendBrowserNotification } from '@/lib/notifications'

// After successfully assigning member:
if (!isAssigned) {
  // Create notification
  await createNotification(
    userId,
    'member_assigned',
    cardId,
    `카드에 할당되었습니다`
  )

  // Send browser notification
  sendBrowserNotification(
    'YU-rello',
    '새 카드에 할당되었습니다'
  )
}
```

Do similar for comments in `CommentsSection.tsx`.

**Step 5: Test notifications**

Run:
```bash
npm run dev
```

1. Allow browser notifications when prompted
2. Assign yourself to a card
3. Should see notification bell update
4. Click bell to see notifications
5. Click notification to go to card

Expected: Notifications are created for assignments and comments. Bell shows unread count. Browser notifications appear.

**Step 6: Commit**

Run:
```bash
git add .
git commit -m "feat: add notifications system

- Create notifications utility functions
- Create NotificationBell component
- Show unread count badge
- Support browser push notifications
- Auto-create notifications for member assignments
- Mark notifications as read
- Navigate to card from notification"
```

---

### Task 19: Add Real-time Updates

**Files:**
- Modify: `components/BoardView.tsx`
- Create: `hooks/useRealtimeSubscription.ts`

**Step 1: Create realtime subscription hook**

Create: `hooks/useRealtimeSubscription.ts`

```typescript
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function useRealtimeSubscription(boardId: string) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Subscribe to lists changes
    const listsChannel = supabase
      .channel(`board-${boardId}-lists`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lists',
          filter: `board_id=eq.${boardId}`,
        },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    // Subscribe to cards changes
    const cardsChannel = supabase
      .channel(`board-${boardId}-cards`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cards',
        },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    // Subscribe to checklist items
    const checklistChannel = supabase
      .channel(`board-${boardId}-checklist`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'checklist_items',
        },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    // Subscribe to comments
    const commentsChannel = supabase
      .channel(`board-${boardId}-comments`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
        },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    // Subscribe to labels
    const labelsChannel = supabase
      .channel(`board-${boardId}-labels`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'labels',
          filter: `board_id=eq.${boardId}`,
        },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    // Subscribe to card labels
    const cardLabelsChannel = supabase
      .channel(`board-${boardId}-card-labels`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'card_labels',
        },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    // Subscribe to card members
    const cardMembersChannel = supabase
      .channel(`board-${boardId}-card-members`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'card_members',
        },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    // Cleanup
    return () => {
      supabase.removeChannel(listsChannel)
      supabase.removeChannel(cardsChannel)
      supabase.removeChannel(checklistChannel)
      supabase.removeChannel(commentsChannel)
      supabase.removeChannel(labelsChannel)
      supabase.removeChannel(cardLabelsChannel)
      supabase.removeChannel(cardMembersChannel)
    }
  }, [boardId, router])
}
```

**Step 2: Use realtime hook in BoardView**

Modify: `components/BoardView.tsx`

```typescript
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'

export function BoardView({ board, initialLists, users, currentUserId }: BoardViewProps) {
  // ... existing code

  // Add realtime subscription
  useRealtimeSubscription(board.id)

  // ... rest of component
}
```

**Step 3: Enable Realtime in Supabase**

In Supabase Dashboard:
1. Go to Database → Replication
2. Enable replication for all tables:
   - lists
   - cards
   - checklist_items
   - comments
   - labels
   - card_labels
   - card_members

**Step 4: Test real-time updates**

Run:
```bash
npm run dev
```

1. Open board in two different browser windows
2. In window 1, create a card
3. Window 2 should update automatically
4. Try moving cards, adding comments, etc.

Expected: Changes appear in real-time across all connected clients without refresh.

**Step 5: Commit**

Run:
```bash
git add .
git commit -m "feat: add real-time updates with Supabase Realtime

- Create useRealtimeSubscription hook
- Subscribe to all table changes
- Auto-refresh on database changes
- Support multiple simultaneous users
- Enable realtime for lists, cards, checklists, comments, labels"
```

---

### Task 20: Final Polish & Testing

**Files:**
- Create: `README.md`
- Create: `DEPLOYMENT.md`
- Modify: `package.json` (add scripts)

**Step 1: Create README**

Create: `README.md`

```markdown
# YU-rello

Trello-inspired collaboration tool built with Next.js and Supabase.

## Features

✅ **Board Management**
- Create multiple boards
- Drag-and-drop lists and cards
- Beautiful navy blue design

✅ **Advanced Cards**
- Rich descriptions
- Checklist items with individual due dates
- Color labels
- Member assignments
- Comments
- Attachments (coming soon)

✅ **Views**
- Board view (Kanban-style)
- Calendar view (all due dates)
- User filtering

✅ **Collaboration**
- Real-time updates
- Browser notifications
- 2-user optimized

## Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Realtime)
- **Drag-and-Drop:** @dnd-kit
- **Calendar:** FullCalendar
- **Deployment:** Vercel + Supabase Cloud

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Vercel account (for deployment)

### Installation

1. Clone the repository
\`\`\`bash
git clone https://github.com/ParkSanghyeok076/YU-rello.git
cd YU-rello
\`\`\`

2. Install dependencies
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables

Create `.env.local`:
\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
\`\`\`

4. Run development server
\`\`\`bash
npm run dev
\`\`\`

5. Open [http://localhost:3000](http://localhost:3000)

## Documentation

- [Implementation Plan](docs/plans/2026-02-20-yu-rello-implementation.md)
- [Design Document](docs/plans/2026-02-20-yu-rello-design.md)
- [Deployment Guide](DEPLOYMENT.md)

## License

MIT
```

**Step 2: Create deployment guide**

Create: `DEPLOYMENT.md`

```markdown
# YU-rello Deployment Guide

## Deploy to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ParkSanghyeok076/YU-rello)

### Manual Deployment

1. **Push to GitHub**
\`\`\`bash
git push origin master
\`\`\`

2. **Import to Vercel**
- Go to [vercel.com](https://vercel.com)
- Click "Import Project"
- Select your GitHub repository
- Configure:
  - Framework: Next.js
  - Root Directory: ./
  - Build Command: npm run build
  - Output Directory: .next

3. **Add Environment Variables**
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
\`\`\`

4. **Deploy**
- Click "Deploy"
- Wait 2-3 minutes
- Your app is live! 🎉

## Supabase Setup

Already done in Task 2, but as a reminder:

1. Create project at [supabase.com](https://supabase.com)
2. Run SQL from implementation plan to create tables
3. Enable Row Level Security
4. Enable Realtime for tables
5. Copy URL and anon key to Vercel environment variables

## Custom Domain (Optional)

1. In Vercel, go to Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

## Troubleshooting

**Build fails:**
- Check environment variables are set
- Ensure all dependencies are in package.json

**Database errors:**
- Verify Supabase connection
- Check RLS policies
- Ensure realtime is enabled

**Realtime not working:**
- Enable replication for all tables in Supabase
- Check browser console for errors
```

**Step 3: Add helpful scripts to package.json**

Modify: `package.json`

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  }
}
```

**Step 4: Final testing checklist**

Test all features:
- [ ] Sign up / Log in
- [ ] Create board
- [ ] Create lists
- [ ] Create cards
- [ ] Drag cards within list
- [ ] Drag cards between lists
- [ ] Drag lists to reorder
- [ ] Open card modal
- [ ] Edit description
- [ ] Add checklist items
- [ ] Check/uncheck items
- [ ] Add due dates to checklist items
- [ ] Create labels
- [ ] Assign labels to cards
- [ ] Add comments
- [ ] Edit/delete own comments
- [ ] Assign members
- [ ] Switch to calendar view
- [ ] Filter by user
- [ ] Receive notifications
- [ ] Delete cards/lists/boards
- [ ] Real-time updates (test with 2 windows)

**Step 5: Final commit**

Run:
```bash
git add .
git commit -m "docs: add README and deployment guide

- Create comprehensive README with features
- Add DEPLOYMENT.md with Vercel guide
- Add helpful npm scripts
- Document tech stack
- Include troubleshooting tips"
```

**Step 6: Push everything to GitHub**

Run:
```bash
git push origin master
```

---

## 🎉 Implementation Plan Complete!

**All 20 Tasks Completed:**

**Phase 1: Setup & Auth (Tasks 1-6)**
- ✅ Next.js project initialization
- ✅ Supabase setup
- ✅ Authentication
- ✅ Dashboard
- ✅ Board creation

**Phase 2: Board View & CRUD (Tasks 7-12)**
- ✅ Board view page
- ✅ List creation
- ✅ Card creation
- ✅ Card modal
- ✅ Card drag-and-drop
- ✅ List drag-and-drop

**Phase 3: Advanced Features (Tasks 13-20)**
- ✅ Checklist items
- ✅ Labels system
- ✅ Comments system
- ✅ Member assignment
- ✅ Calendar view
- ✅ Notifications
- ✅ Real-time updates
- ✅ Documentation

**Total Implementation Time:** ~2-3 hours following this guide

**Next Steps:**
1. Start implementing from Task 1
2. Follow each step carefully
3. Test after each task
4. Commit frequently
5. Deploy to Vercel when ready!

Good luck building YU-rello! 🚀

