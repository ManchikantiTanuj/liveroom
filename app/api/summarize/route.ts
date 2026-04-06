import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  const { roomId, transcript } = await req.json()

  if (!transcript?.trim()) {
    return NextResponse.json({ error: 'No transcript provided' }, { status: 400 })
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Analyze this live session transcript and return ONLY a JSON object (no markdown, no explanation):

{
  "summary": "2-3 sentence overview of what was discussed",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "actionItems": ["action 1", "action 2"]
}

Transcript:
${transcript}`,
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const clean = raw.replace(/```json|```/g, '').trim()

    // Save summary to room
    await supabase
      .from('rooms')
      .update({ summary: clean, is_active: false })
      .eq('id', roomId)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Summarize error:', err)
    return NextResponse.json({ error: 'Failed to summarize' }, { status: 500 })
  }
}
