'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const router = useRouter()
  const [joinCode, setJoinCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  async function createRoom() {
    setCreating(true)
    const roomId = uuidv4().slice(0, 8)
    const { error } = await supabase.from('rooms').insert({
      id: roomId,
      title: 'Live Session',
      is_active: true,
    })
    if (error) {
      setError('Could not create room. Check Supabase setup.')
      setCreating(false)
      return
    }
    router.push(`/room/${roomId}?host=true`)
  }

  function joinRoom() {
    const code = joinCode.trim()
    if (!code) return
    router.push(`/room/${code}`)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Background grid */}
      <div className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo / header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-400 ring-pulse" />
            </div>
            <span className="font-mono text-sm text-green-400 tracking-widest uppercase">Live</span>
          </div>
          <h1 className="text-5xl font-light tracking-tight text-white mb-3">
            Live<span className="text-green-400">Room</span>
          </h1>
          <p className="text-zinc-500 text-base font-light">
            Speak. Your friends see it live.
          </p>
        </div>

        {/* Create room */}
        <div className="mb-4">
          <button
            onClick={createRoom}
            disabled={creating}
            className="w-full py-4 rounded-xl bg-green-400 text-black font-medium text-base
                       hover:bg-green-300 active:scale-[0.98] transition-all duration-150
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'Creating room...' : 'Create a new room'}
          </button>
          <p className="text-center text-zinc-600 text-xs mt-2">
            You speak — share the link — friends watch live
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-zinc-600 text-xs font-mono">or join</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        {/* Join room */}
        <div className="flex gap-2">
          <input
            type="text"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && joinRoom()}
            placeholder="Enter room code..."
            className="flex-1 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800
                       text-white placeholder-zinc-600 font-mono text-sm
                       focus:outline-none focus:border-zinc-600 transition-colors"
          />
          <button
            onClick={joinRoom}
            className="px-5 py-3 rounded-xl bg-zinc-800 text-white font-medium text-sm
                       hover:bg-zinc-700 active:scale-[0.98] transition-all duration-150"
          >
            Join
          </button>
        </div>

        {error && (
          <p className="mt-4 text-red-400 text-sm text-center">{error}</p>
        )}

        {/* How it works */}
        <div className="mt-16 grid grid-cols-3 gap-4 text-center">
          {[
            { step: '01', label: 'Create a room' },
            { step: '02', label: 'Share the link' },
            { step: '03', label: 'Speak live' },
          ].map(({ step, label }) => (
            <div key={step}>
              <div className="font-mono text-xs text-zinc-600 mb-1">{step}</div>
              <div className="text-xs text-zinc-400">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
