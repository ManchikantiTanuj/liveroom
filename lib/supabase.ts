import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 20,
    },
  },
})

export type Room = {
  id: string
  created_at: string
  title: string
  is_active: boolean
  summary: string | null
  full_transcript: string | null
}

export type TranscriptChunk = {
  id: string
  room_id: string
  text: string
  speaker: string
  created_at: string
}
