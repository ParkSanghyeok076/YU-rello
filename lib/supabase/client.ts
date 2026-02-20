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

export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
