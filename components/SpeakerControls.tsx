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
        alert('Deepgram API key missing. Add NEXT_PUBLIC_DEEPGRAM_API_KEY to .env.local')
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
        encoding: 'linear16',
        sample_rate: '16000',
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
          alert('Could not connect to Deepgram. Check your API key in .env.local')
        }
      }, 5000)

      ws.onopen = () => {
        clearTimeout(connectTimeout)
        setIsRecording(true)

        const audioCtx = new AudioContext({ sampleRate: 16000 })
        const source = audioCtx.createMediaStreamSource(stream)
        const processor = audioCtx.createScriptProcessor(4096, 1, 1)

        source.connect(processor)
        processor.connect(audioCtx.destination)

        processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return
          const input = e.inputBuffer.getChannelData(0)
          const pcm = convertFloat32ToInt16(input)
          ws.send(pcm.buffer)
        }

        ;(wsRef.current as any)._processor = processor
        ;(wsRef.current as any)._audioCtx = audioCtx
        ;(wsRef.current as any)._stream = stream
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === 'Results') {
            const transcript = data.channel?.alternatives?.[0]?.transcript || ''
            const isFinal = data.is_final
            const speechFinal = data.speech_final

            if (transcript) {
              if (isFinal) {
                finalBufferRef.current += (finalBufferRef.current ? ' ' : '') + transcript
                setLiveText(finalBufferRef.current)
              } else {
                setLiveText(finalBufferRef.current + (finalBufferRef.current ? ' ' : '') + transcript)
              }
            }

            if (speechFinal && finalBufferRef.current.trim()) {
              onChunkFinalized(finalBufferRef.current)
              finalBufferRef.current = ''
              setLiveText('')
            }
          }

          if (data.type === 'UtteranceEnd') {
            if (finalBufferRef.current.trim()) {
              onChunkFinalized(finalBufferRef.current)
              finalBufferRef.current = ''
              setLiveText('')
            }
          }
        } catch (e) {
          console.error('Parse error:', e)
        }
      }

      ws.onerror = (e) => {
        clearTimeout(connectTimeout)
        console.error('Deepgram WS error:', e)
        alert('Deepgram connection failed. Check your API key and internet connection.')
        stream.getTracks().forEach(t => t.stop())
        setIsRecording(false)
      }

      ws.onclose = () => {
        clearTimeout(connectTimeout)
        setIsRecording(false)
        try {
          ;(ws as any)._processor?.disconnect()
          ;(ws as any)._audioCtx?.close()
          ;(ws as any)._stream?.getTracks().forEach((t: MediaStreamTrack) => t.stop())
        } catch {}
        stream.getTracks().forEach(t => t.stop())
      }

    } catch (err: any) {
      console.error('Mic error:', err)
      if (err.name === 'NotAllowedError') {
        alert('Microphone permission denied. Please allow mic access in your browser settings.')
      } else if (err.name === 'NotFoundError') {
        alert('No microphone found. Please connect a microphone and try again.')
      } else {
        alert(`Microphone error: ${err.message}`)
      }
    }
  }, [onChunkFinalized, setIsRecording, setLiveText])

  function stopRecording() {
    if (finalBufferRef.current.trim()) {
      onChunkFinalized(finalBufferRef.current)
      finalBufferRef.current = ''
      setLiveText('')
    }
    wsRef.current?.close()
    setIsRecording(false)
  }

  async function testMic() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(t => t.stop())
      alert('✅ Microphone works!\n\nIf recording still fails, check your NEXT_PUBLIC_DEEPGRAM_API_KEY in .env.local')
    } catch (err: any) {
      alert(`❌ Mic blocked: ${err.message}\n\nIn Chrome: click the lock icon in the address bar → allow microphone → reload page.`)
    }
  }

  function convertFloat32ToInt16(buffer: Float32Array): Int16Array {
    const l = buffer.length
    const buf = new Int16Array(l)
    for (let i = 0; i < l; i++) {
      buf[i] = Math.min(1, buffer[i]) * 0x7fff
    }
    return buf
  }

  return (
    <div className="border-t border-zinc-900 pt-4 pb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200
              ${isRecording
                ? 'bg-red-500 hover:bg-red-400 scale-105'
                : 'bg-zinc-800 hover:bg-zinc-700 hover:scale-105'
              }`}
          >
            {isRecording && (
              <div className="absolute inset-0 rounded-full bg-red-500 ring-pulse opacity-40" />
            )}
            {isRecording ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <rect x="6" y="6" width="12" height="12" rx="2"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            )}
          </button>

          <div>
            <p className="text-sm font-medium text-white">
              {isRecording ? 'Recording...' : 'Ready to speak'}
            </p>
            <p className="text-xs text-zinc-600 font-mono mt-0.5">
              {isRecording ? 'Click to stop' : 'Click mic to start'}
            </p>
          </div>
        </div>

        {isRecording && (
          <div className="flex items-center gap-0.5 h-8">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="w-0.5 bg-green-400 rounded-full"
                style={{
                  height: `${Math.random() * 24 + 4}px`,
                  animation: `pulse-dot ${0.5 + Math.random() * 0.8}s ease-in-out infinite`,
                  animationDelay: `${i * 0.05}s`,
                  opacity: 0.7 + Math.random() * 0.3,
                }}
              />
            ))}
          </div>
        )}

        {hasTranscript && !isRecording && (
          <button
            onClick={onSummarize}
            disabled={summarizing || hasSummary}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800
                       text-xs font-mono text-zinc-400 hover:text-white hover:border-zinc-700
                       transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {summarizing ? (
              <>
                <div className="w-3 h-3 border border-zinc-500 border-t-white rounded-full animate-spin" />
                Summarizing...
              </>
            ) : hasSummary ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Summary ready
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                Summarize
              </>
            )}
          </button>
        )}
      </div>

      {!isRecording && (
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={testMic}
            className="text-xs font-mono text-zinc-700 hover:text-zinc-500 transition-colors"
          >
            test microphone
          </button>
          <span className="text-zinc-800 text-xs">·</span>
          <span className="text-xs font-mono text-zinc-800">
            Deepgram: {process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY ? '✓ set' : '✗ missing in .env.local'}
          </span>
        </div>
      )}
    </div>
  )
}