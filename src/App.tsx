import { useState, useEffect } from 'react'
import { realtimedb } from './firebase'
import { ref, onChildAdded, onValue, get, set} from 'firebase/database'
import ThreeCanvas from './ThreeCanvas'

import './App.css'


const DEMO_VIDEOS = [
    'https://videosforteaching.s3.amazonaws.com/videos/718b8f5d-34b0-4e49-9ab9-e1562cf4df42/mlymepkp.mp4', // spacetime + gravity!
    'https://videosforteaching.s3.us-east-1.amazonaws.com/videos/testchattypescript2/mlydsofw.mp4',
    'https://videosforteaching.s3.amazonaws.com/videos/eaf3b392-c75e-4cab-bc53-e99bf9fbf874/mlzxw1cm.mp4', // fourier series on heat
    'https://videosforteaching.s3.amazonaws.com/videos/eaf3b392-c75e-4cab-bc53-e99bf9fbf874/mlzy1i5i.mp4', // PHASE SPACE PORTRAITS
    'https://videosforteaching.s3.amazonaws.com/videos/eaf3b392-c75e-4cab-bc53-e99bf9fbf874/mlzxjah3.mp4',
    'https://videosforteaching.s3.amazonaws.com/videos/eaf3b392-c75e-4cab-bc53-e99bf9fbf874/mlzx9zuj.mp4', // quarternion rotation!
    'https://videosforteaching.s3.amazonaws.com/videos/cd799bd0-b4c2-40e3-810a-7690c8114e0a/mlzvpgse.mp4', // laminar flow!'
    'https://videosforteaching.s3.amazonaws.com/videos/6b110d29-29e8-4973-9b33-529a93b865a7/mlzwspfv.mp4', // wave diffraction
    'https://videosforteaching.s3.amazonaws.com/videos/e3f8b16b-e3c0-4493-a99f-4868be1c6f01/mm0xq5a8.mp4', // token embeddings :)
    'https://videosforteaching.s3.amazonaws.com/videos/6b110d29-29e8-4973-9b33-529a93b865a7/mlzwzsp9.mp4', // cell mitosis!
    'https://videosforteaching.s3.amazonaws.com/videos/5d48ad7e-9bf9-4f21-b21d-246e3bee2f69/mm04mb0m.mp4', // law of large numbers

  ]

export default function App() {
  const [demoIndex, setDemoIndex] = useState(0)
  
  // Input
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  /** set up streaming!! */
  const [messages, setMessages] = useState<{role: string, content: string}[]>([])
  const [streamingText, setStreamingText] = useState('')


  const [chatIdTest] = useState(() => {
  const existing = sessionStorage.getItem('chatId')
    if (existing) return existing
    const newId = crypto.randomUUID().slice(0, 8)
    sessionStorage.setItem('chatId', newId)
    return newId
  })
  const [threeSceneStarted, setThreeSceneStarted] = useState(false)

  // Handle sbumit, with the .trim() thing handled:
  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return
    const userMessage = input
    setInput('')
    setIsLoading(true)
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      const response = await fetch('https://yides5irnvewly2wvfmqd7y5c40hqoip.lambda-url.us-east-1.on.aws/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }],
          chatId: chatIdTest,
        })
      })

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          fullText += decoder.decode(value)
          setStreamingText(fullText)
        }
      } finally {
        reader.cancel()
      }

      if (fullText.trim()) {
        setMessages(prev => [...prev, { role: 'assistant', content: fullText }])
      }
      setStreamingText('')

    } catch (err) {
      console.error('Error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    set(ref(realtimedb, `${chatIdTest}/test`), {
      message: 'hello!',
      time: Date.now()
    })
  }, [])

  /** Test firing from realtime db updates! */
  useEffect(() => {
    const vizRef = ref(realtimedb, `${chatIdTest}/visuals`)
    const unsubscribe = onValue(vizRef, (snapshot) => {
      if (!snapshot.exists()) return
      const data = snapshot.val()
      const entries = Object.values(data) as any[]
      const latest = entries[entries.length - 1]
      if (latest?.code) {
        setThreeSceneStarted(true)
        setTimeout(() => (window as any).runScene(latest.code), 100)
      }
    })
    return () => unsubscribe()
}, [])

  // useEffect(() => {

  //   if (!threeSceneStarted) return

  //   setTimeout(() => {
  //     (window as any).runScene(`

  //     `)
  //   }, 500)
  // }, [threeSceneStarted])

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#0a0a0a', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, sans-serif'
    }}>

      {/* Title */}
      <h1 style={{
        color: '#fff', fontSize: 'clamp(18px, 2vw, 28px)', fontWeight: 200,
        marginBottom: '8px', letterSpacing: '-0.02em',
      }}>
        Academic AI that can talk visually.
      </h1>

      <p style={{
        color: '#555', fontSize: 'clamp(12px, 1.1vw, 15px)', fontWeight: 400, marginTop: '12px',
  marginBottom: '16px', maxWidth: '73%', textAlign: 'center', lineHeight: '1.6'
      }}>
        The first academic AI that can teach you anything in visual language. Concepts in biology, physics, arts, law - expressed visually, instantly. 
      </p>

      {/* === DISPLAY AREA === */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

      {/* This div is the slot. Video now. Three.js canvas later. Same container. */}
      <div style={{
        position: 'relative',
        height: '72vh',
        aspectRatio: '16/9',
        borderRadius: '14px', overflow: 'hidden',
        background: '#111',
      }}>
        {threeSceneStarted ? (
          <ThreeCanvas />
        ) : (
          <video
            key={DEMO_VIDEOS[demoIndex]}
            src={DEMO_VIDEOS[demoIndex]}
            autoPlay muted loop
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        )}

        {/* trying otu a right arrow overlay thing */}
        <button
          onClick={() => setDemoIndex(i => (i + 1) % DEMO_VIDEOS.length)}
          style={{
            position: 'absolute', right: '14px', top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '50%', width: '65px', height: '65px',
            color: '#fff', fontSize: '25px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          ›
        </button>
      </div>

  {/* test these vertical dots that float right.  */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '10px',
        }}>
          {DEMO_VIDEOS.map((_, i) => (
            <div key={i} onClick={() => setDemoIndex(i)} style={{
              width: '7px',
              height: i === demoIndex ? '20px' : '7px',
              borderRadius: '4px',
              background: i === demoIndex ? '#fff' : '#444',
              cursor: 'pointer', transition: 'all 0.25s',
            }} />
          ))}
        </div>

      </div>

   {/* === FLOATING CHAT BOX === */}
    <div style={{
      position: 'fixed', bottom: '24px', left: '50%',
      transform: 'translateX(-50%)',
      width: '50vw', maxWidth: '660px', minWidth: '300px',
      background: 'rgba(10,10,10,0.85)',
      backdropFilter: 'blur(24px)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '16px',
      padding: '12px 12px 12px 16px',
      display: 'flex', flexDirection: 'column', gap: '8px',
      zIndex: 10,
    }}>

      {/* Rendering toast */}
      {isLoading && (
        <div style={{ color: '#888', fontSize: '13px', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          ⏳ Thinking...
        </div>
      )}

      {/* Last message */}
      {!isLoading && messages.length > 0 && (
        <div style={{
          color: '#ccc', fontSize: '14px', lineHeight: '1.6',
          maxHeight: '100px', overflowY: 'auto',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          paddingBottom: '8px',
        }}>
          {streamingText || messages[messages.length - 1]?.content}
        </div>
      )}

      {/* Input row */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              e.stopPropagation()
              handleSubmit()
            }
          }}
          placeholder="What do you want to visualize?"
          rows={1}
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            color: '#fff', fontSize: '15px',
            fontFamily: 'Inter, sans-serif', fontWeight: 400,
            resize: 'none', lineHeight: '1.6', maxHeight: '120px',
            paddingTop: '2px',
          }}
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: '#1e40af', border: 'none',
            color: '#fff', fontSize: '18px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, opacity: isLoading ? 0.5 : 1,
          }}>
          {isLoading ? '...' : '→'}
        </button>
      </div>
    </div>
      

    </div>
  )
}