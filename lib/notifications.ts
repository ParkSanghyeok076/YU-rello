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
  if (!('Notification' in window)) return

  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' })
  } else if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' })
    }
  }
}
