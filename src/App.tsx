import { useState, useEffect } from 'react'
import { realtimedb } from './firebase'
import { ref, onChildAdded, onValue, get, set} from 'firebase/database'
import ThreeCanvas from './ThreeCanvas'

import './App.css'


const DEMO_VIDEOS = []

export default function App() {
  const [demoIndex, setDemoIndex] = useState(0)
  
  // Input
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const [chatIdTest] = useState(() => {
  const existing = sessionStorage.getItem('chatId')
    if (existing) return existing
    const newId = crypto.randomUUID().slice(0, 8)
    sessionStorage.setItem('chatId', newId)
    return newId
  })
  const [threeSceneStarted, setThreeSceneStarted] = useState(false)


  useEffect(() => {
    set(ref(realtimedb, `${chatIdTest}/test`), {
      message: 'hello!',
      time: Date.now()
    })
  }, [])

  /** Test firing from realtime db updates! */
  useEffect(() => {
    const vizRef = ref(realtimedb, `chats/${chatIdTest}/visualizations`)
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
      position: 'fixed', bottom: '42px', left: '50%',
      transform: 'translateX(-50%)',
      width: '50vw', maxWidth: '660px', minWidth: '300px',
      background: 'rgba(10,10,10,0.8)',
      backdropFilter: 'blur(24px)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '16px',
      padding: '10px 10px 10px 16px',
      display: 'flex', gap: '10px', alignItems: 'flex-end',
      zIndex: 10,
    }}>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) e.preventDefault()
        }}
        placeholder="What do you want to visualize?"
        rows={1}
        style={{
          flex: 1, background: 'none', border: 'none', outline: 'none',
          color: '#fff', fontSize: '15px',
          fontFamily: 'Inter, sans-serif', fontWeight: 400,
          resize: 'none', lineHeight: '1.6', maxHeight: '120px',
        }}
      />
      <button disabled={isLoading} style={{
        width: '40px', height: '40px', borderRadius: '10px',
        background: '#1e40af', border: 'none',
        color: '#fff', fontSize: '18px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, opacity: isLoading ? 0.5 : 1,
        transition: 'transform 0.15s',
      }}>
        →
      </button>
    </div>
      

    </div>
  )
}