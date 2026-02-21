import { createBrowserClient } from '@supabase/ssr'

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
        Insert: {
          id: string
          email: string
          name: string
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      boards: {
        Row: {
          id: string
          title: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      lists: {
        Row: {
          id: string
          board_id: string
          title: string
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          board_id: string
          title: string
          position: number
          created_at?: string
        }
        Update: {
          id?: string
          board_id?: string
          title?: string
          position?: number
          created_at?: string
        }
        Relationships: []
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
        Insert: {
          id?: string
          list_id: string
          title: string
          description?: string | null
          due_date?: string | null
          position: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          list_id?: string
          title?: string
          description?: string | null
          due_date?: string | null
          position?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
        Insert: {
          id?: string
          card_id: string
          title: string
          due_date?: string | null
          completed?: boolean
          position: number
          created_at?: string
        }
        Update: {
          id?: string
          card_id?: string
          title?: string
          due_date?: string | null
          completed?: boolean
          position?: number
          created_at?: string
        }
        Relationships: []
      }
      labels: {
        Row: {
          id: string
          board_id: string
          name: string
          color: string
        }
        Insert: {
          id?: string
          board_id: string
          name: string
          color: string
        }
        Update: {
          id?: string
          board_id?: string
          name?: string
          color?: string
        }
        Relationships: []
      }
      card_labels: {
        Row: {
          card_id: string
          label_id: string
        }
        Insert: {
          card_id: string
          label_id: string
        }
        Update: {
          card_id?: string
          label_id?: string
        }
        Relationships: []
      }
      card_members: {
        Row: {
          card_id: string
          user_id: string
        }
        Insert: {
          card_id: string
          user_id: string
        }
        Update: {
          card_id?: string
          user_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          id: string
          card_id: string
          user_id: string | null
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          card_id: string
          user_id?: string | null
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          card_id?: string
          user_id?: string | null
          content?: string
          created_at?: string
        }
        Relationships: []
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
        Insert: {
          id?: string
          user_id: string
          type: string
          card_id: string
          message: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          card_id?: string
          message?: string
          read?: boolean
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}

export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
