'use client'

import { useEffect, useRef } from 'react'
import { type TranscriptChunk } from '@/lib/supabase'

interface TranscriptViewProps {
  chunks: TranscriptChunk[]
  liveText: string
  isRecording: boolean
}

export default function TranscriptView({ chunks, liveText, isRecording }: TranscriptViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevChunkCount = useRef(0)

  // Auto-scroll when new content arrives
  useEffect(() => {
    if (chunks.length !== prevChunkCount.current || liveText) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      prevChunkCount.current = chunks.length
    }
  }, [chunks, liveText])

  const isEmpty = chunks.length === 0 && !liveText

  return (
    <div className="flex-1 mt-4 mb-4 overflow-y-auto min-h-0" style={{ maxHeight: 'calc(100vh - 240px)' }}>
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          {isRecording ? (
            <div className="space-y-3">
              <div className="flex justify-center gap-1">
                {[0, 1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className="w-1 bg-green-400 rounded-full"
                    style={{
                      height: `${Math.random() * 20 + 8}px`,
                      animation: `pulse-dot ${0.8 + i * 0.1}s ease-in-out infinite`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
              <p className="text-zinc-600 text-sm font-mono">Listening...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-zinc-700 text-sm">No transcript yet</p>
              <p className="text-zinc-800 text-xs font-mono">
                {isRecording ? 'Start speaking...' : 'Waiting for session to start...'}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-1 pb-2">
          {/* Finalized chunks */}
          {chunks.map((chunk, i) => (
            <div
              key={chunk.id}
              className="animate-slide-up"
            >
              {/* Show timestamp at start or after a gap */}
              {i === 0 && (
                <div className="text-[10px] font-mono text-zinc-700 mb-2 mt-1">
                  {new Date(chunk.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
              <p className="text-zinc-200 text-lg font-light leading-relaxed tracking-wide">
                {chunk.text}
              </p>
            </div>
          ))}

          {/* Live / interim text */}
          {liveText && (
            <p className="text-zinc-500 text-lg font-light leading-relaxed tracking-wide cursor-blink">
              {liveText}
            </p>
          )}

          {/* Recording indicator */}
          {isRecording && !liveText && (
            <span className="inline-block w-2 h-5 bg-green-400 opacity-70 animate-pulse rounded-sm" />
          )}
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
