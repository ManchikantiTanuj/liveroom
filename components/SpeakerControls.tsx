'use client'

import { useRef, useCallback } from 'react'

interface SpeakerControlsProps {
  isRecording: boolean
  setIsRecording: (v: boolean) => void
  setLiveText: (t: string) => void
  onChunkFinalized: (text: string) => void
  hasTranscript: boolean
  onSummarize: () => void
  summarizing: boolean
  hasSummary: boolean
}

export default function SpeakerControls({
  isRecording,
  setIsRecording,
  setLiveText,
  onChunkFinalized,
  hasTranscript,
  onSummarize,
  summarizing,
  hasSummary,
}: SpeakerControlsProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const finalBufferRef = useRef('')

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY
      if (!apiKey) {
        alert('Deepgram API key missing. Add NEXT_PUBLIC_DEEPGRAM_API_KEY to your Vercel environment variables.')
        stream.getTracks().forEach(t => t.stop())
        return
      }

      const params = new URLSearchParams({
        model: 'nova-2',
        language: 'en-US',
        smart_format: 'true',
        interim_results: 'true',
        utterance_end_ms: '1500',
        vad_events: 'true',
      })

      const ws = new WebSocket(
        `wss://api.deepgram.com/v1/listen?${params.toString()}`,
        ['token', apiKey]
      )

      wsRef.current = ws

      const connectTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close()
          stream.getTracks().forEach(t => t.stop())
          alert('Could not connect to Deepgram. Check your API key.')
        }
      }, 5000)

      ws.onopen = () => {
        clearTimeout(connectTimeout)
        setIsRecording(true)

        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : ''

        const mediaRecorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream)

        mediaRecorderRef.current = mediaRecorder

        mediaRecorder.ondataavailable = (e) => {