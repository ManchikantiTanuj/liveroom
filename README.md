# LiveRoom — Real-time Collaborative Transcription

> Speak. Your friends see it live.

A real-time transcription app where you speak in your browser and anyone with the link sees the words appear live — no refresh, no delay.

---

## What it does

- You create a room → get a unique URL
- Share that URL with anyone
- Press the mic button and speak
- Everyone watching sees your words appear word-by-word in real time
- When you're done, hit "Summarize" → Claude generates a summary + key points + action items
- The full transcript + summary is saved forever via the room URL

---

## Tech Stack

| Layer | Tool | Cost |
|---|---|---|
| Frontend + API | Next.js on Vercel | Free |
| Database + Realtime | Supabase | Free |
| Live Transcription | Deepgram Nova-2 | Free (12k min/mo) |
| AI Summary | Claude Haiku | ~$0.01/session |

**Total running cost: ~$0–5/month**

---

## Setup Guide (30 minutes)

### Step 1 — Clone and install

```bash
git clone <your-repo>
cd liveroom
npm install
```

### Step 2 — Set up Supabase (free)

1. Go to [supabase.com](https://supabase.com) → New project
2. Go to **SQL Editor** → paste the contents of `supabase-schema.sql` → Run
3. Go to **Settings → API** → copy:
   - Project URL
   - `anon` public key

### Step 3 — Get Deepgram API key (free)

1. Go to [deepgram.com](https://deepgram.com) → Sign up
2. Go to **API Keys** → Create a new key
3. Copy the key

### Step 4 — Get Claude API key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up → **API Keys** → Create key
3. Copy the key

### Step 5 — Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
NEXT_PUBLIC_DEEPGRAM_API_KEY=your_deepgram_key
ANTHROPIC_API_KEY=sk-ant-xxx...
```

> ⚠️ Note: `NEXT_PUBLIC_DEEPGRAM_API_KEY` is exposed to the browser (needed for WebSocket). For production, proxy this through your API route instead.

### Step 6 — Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel (free)

```bash
npm install -g vercel
vercel
```

Add all your `.env.local` variables in Vercel → Settings → Environment Variables.

---

## How the realtime sync works

```
You speak
  → Browser mic captures audio
  → Sends raw PCM audio to Deepgram via WebSocket every 250ms
  → Deepgram sends back text chunks (interim + final)
  → Final chunks saved to Supabase transcript_chunks table
  → Supabase Realtime broadcasts the INSERT to all subscribers
  → Your friend's browser receives it via WebSocket
  → Text appears on their screen instantly
```

The key is **Supabase Realtime** — it's a persistent WebSocket connection that pushes database changes to all connected clients instantly, without polling.

---

## Project Structure

```
liveroom/
├── app/
│   ├── page.tsx              # Home — create or join room
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   ├── room/[roomId]/
│   │   └── page.tsx          # Main room page (speaker + viewer)
│   └── api/
│       └── summarize/
│           └── route.ts      # Claude summarization endpoint
├── components/
│   ├── RoomHeader.tsx        # Top bar with share link
│   ├── TranscriptView.tsx    # Live scrolling transcript
│   ├── SpeakerControls.tsx   # Mic button + Deepgram streaming
│   └── SummaryPanel.tsx      # AI summary display
├── lib/
│   └── supabase.ts           # Supabase client + types
├── supabase-schema.sql       # Run this in Supabase SQL editor
└── .env.local.example        # Copy to .env.local and fill in
```

---

## Future improvements

- [ ] Multiple speakers with different colors
- [ ] Export transcript as PDF/TXT
- [ ] Password-protected rooms
- [ ] Record + replay sessions
- [ ] Speaker diarization (Deepgram can label who spoke)
- [ ] Mobile app (React Native)
- [ ] Slack/Notion export after session
