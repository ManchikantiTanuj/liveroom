'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase, type TranscriptChunk, type Room } from '@/lib/supabase'
import TranscriptView from '@/components/TranscriptView'
import SpeakerControls from '@/components/SpeakerControls'
import RoomHeader from '@/components/RoomHeader'
import SummaryPanel from '@/components/SummaryPanel'

export default function RoomPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const roomId = params.roomId as string
  const isHost = searchParams.get('host') === 'true'

  const [room, setRoom] = useState<Room | null>(null)
  const [chunks, setChunks] = useState<TranscriptChunk[]>([])
  const [liveText, setLiveText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [viewerCount, setViewerCount] = useState(1)
  const [notFound, setNotFound] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [summarizing, setSummarizing] = useState(false)

  // Load room + existing chunks
  useEffect(() => {
    async function loadRoom() {
      const { data: roomData, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single()

      if (error || !roomData) {
        setNotFound(true)
        return
      }
      setRoom(roomData)
      if (roomData.summary) setShowSummary(true)

      const { data: chunkData } = await supabase
        .from('transcript_chunks')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (chunkData) setChunks(chunkData)
    }
    loadRoom()
  }, [roomId])

  // Subscribe to realtime new chunks
  useEffect(() => {
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transcript_chunks',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newChunk = payload.new as TranscriptChunk
          setChunks(prev => [...prev, newChunk])
          setLiveText('') // clear interim when we get a real chunk
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          setRoom(payload.new as Room)
          if (payload.new.summary) {
            setShowSummary(true)
            setSummarizing(false)
          }
        }
      )
      .subscribe()

    // Presence for viewer count
    const presenceChannel = supabase.channel(`presence:${roomId}`)
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        setViewerCount(Object.keys(state).length)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ online_at: new Date().toISOString() })
        }
      })

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(presenceChannel)
    }
  }, [roomId])

  // Save a finalized chunk to DB (called from SpeakerControls)
  const saveChunk = useCallback(async (text: string) => {
    if (!text.trim()) return
    await supabase.from('transcript_chunks').insert({
      room_id: roomId,
      text: text.trim(),
      speaker: 'You',
    })
  }, [roomId])

  // Generate summary
  async function generateSummary() {
    setSummarizing(true)
    const fullText = chunks.map(c => c.text).join(' ')
    const res = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, transcript: fullText }),
    })
    if (!res.ok) setSummarizing(false)
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-500 text-lg mb-4">Room not found</p>
          <a href="/" className="text-green-400 text-sm hover:underline">← Create a new room</a>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-mono text-zinc-600 text-sm animate-pulse">Connecting...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      <RoomHeader
        roomId={roomId}
        isHost={isHost}
        isRecording={isRecording}
        viewerCount={viewerCount}
      />

      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 pb-4">
        {/* Transcript area */}
        <TranscriptView
          chunks={chunks}
          liveText={liveText}
          isRecording={isRecording}
        />

        {/* Summary panel */}
        {showSummary && room.summary && (
          <SummaryPanel summary={room.summary} />
        )}

        {/* Speaker controls (only host sees mic button) */}
        {isHost && (
          <SpeakerControls
            isRecording={isRecording}
            setIsRecording={setIsRecording}
            setLiveText={setLiveText}
            onChunkFinalized={saveChunk}
            hasTranscript={chunks.length > 0}
            onSummarize={generateSummary}
            summarizing={summarizing}
            hasSummary={!!room.summary}
          />
        )}

        {/* Viewer message */}
        {!isHost && (
          <div className="mt-4 text-center text-zinc-600 text-xs font-mono py-3">
            {isRecording || chunks.length > 0
              ? 'Listening live...'
              : 'Waiting for speaker to start...'}
          </div>
        )}
      </div>
    </div>
  )
}
