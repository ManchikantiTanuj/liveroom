'use client'

import { useState } from 'react'

interface RoomHeaderProps {
  roomId: string
  isHost: boolean
  isRecording: boolean
  viewerCount: number
}

export default function RoomHeader({ roomId, isHost, isRecording, viewerCount }: RoomHeaderProps) {
  const [copied, setCopied] = useState(false)

  function copyLink() {
    const url = `${window.location.origin}/room/${roomId}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <header className="border-b border-zinc-900 px-4 py-3">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        {/* Left: brand + room */}
        <div className="flex items-center gap-4">
          <a href="/" className="font-mono text-sm text-green-400 font-medium">
            LiveRoom
          </a>
          <div className="w-px h-4 bg-zinc-800" />
          <span className="font-mono text-xs text-zinc-600">
            #{roomId}
          </span>
          {isHost && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-zinc-800 text-zinc-500">
              host
            </span>
          )}
        </div>

        {/* Right: status + viewers + share */}
        <div className="flex items-center gap-3">
          {/* Live indicator */}
          {isRecording && (
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-red-500 ring-pulse opacity-60" />
              </div>
              <span className="text-xs font-mono text-red-400">LIVE</span>
            </div>
          )}

          {/* Viewer count */}
          <div className="flex items-center gap-1.5 text-zinc-600 text-xs font-mono">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            {viewerCount}
          </div>

          {/* Share button */}
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800
                       text-xs font-mono text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
          >
            {copied ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                Share link
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
