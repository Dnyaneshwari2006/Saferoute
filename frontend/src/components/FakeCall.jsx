import { useState, useEffect, useRef } from 'react'

const CALLERS = [
  { name: 'Mom', emoji: '👩', color: '#d946ef' },
  { name: 'Dad', emoji: '👨', color: '#4f46e5' },
  { name: 'Boss', emoji: '👔', color: '#0891b2' },
  { name: 'Best Friend', emoji: '👯', color: '#059669' },
]

const DELAY_OPTIONS = [
  { label: '15 sec', value: 15 },
  { label: '30 sec', value: 30 },
  { label: '1 min', value: 60 },
]



function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function FakeCall() {
  const [showSetup, setShowSetup] = useState(true)
  const [selectedCaller, setSelectedCaller] = useState(CALLERS[0])
  const [delay, setDelay] = useState(15)
  const [countdown, setCountdown] = useState(null)
  const [ringing, setRinging] = useState(false)
  const [inCall, setInCall] = useState(false)
  const [callTime, setCallTime] = useState(0)
  const audioRef = useRef(null)
  const timerRef = useRef(null)

  // Countdown to ring
  useEffect(() => {
    if (countdown === null) return
    if (countdown <= 0) {
      setCountdown(null)
      triggerCall()
      return
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => stopAudio()
  }, [])

  // Call timer
  useEffect(() => {
    if (!inCall) return
    const t = setInterval(() => setCallTime(c => c + 1), 1000)
    return () => clearInterval(t)
  }, [inCall])

  const triggerCall = () => {
    setRinging(true)
    // Vibrate if supported
    if (navigator.vibrate) {
      navigator.vibrate([300, 200, 300, 200, 300, 1000, 300, 200, 300, 200, 300])
    }
    // Play ringtone using HTML5 Audio
    try {
      const audio = new Audio('/ringtone.wav')
      audio.loop = true
      audioRef.current = audio
      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay blocked — audio will remain silent, UI still works
          console.log('Audio autoplay blocked by browser')
        })
      }
    } catch (e) {
      console.log('Audio not available')
    }
  }

  const acceptCall = () => {
    stopAudio()
    setRinging(false)
    setInCall(true)
    setCallTime(0)
  }

  const declineCall = () => {
    stopAudio()
    setRinging(false)
    setInCall(false)
    setShowSetup(false)
    if (navigator.vibrate) navigator.vibrate(0)
  }

  const endCall = () => {
    setInCall(false)
    setShowSetup(false)
    setCallTime(0)
  }

  const stopAudio = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        audioRef.current.src = ''
      } catch (_) {}
      audioRef.current = null
    }
    if (navigator.vibrate) navigator.vibrate(0)
  }

  const startCountdown = () => {
    setShowSetup(false)
    setCountdown(delay)
  }

  const cancelCountdown = () => {
    setCountdown(null)
  }

  // Full-screen ringing overlay
  if (ringing) {
    return (
      <>
        <style>{`
          @keyframes fc-fadein { from { opacity: 0; transform: scale(1.04); } to { opacity: 1; transform: scale(1); } }
          @keyframes fc-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
          @keyframes fc-ring-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); } 50% { box-shadow: 0 0 0 18px rgba(34,197,94,0); } }
        `}</style>
        <div className="fakecall-overlay ringing" style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          animation: 'fc-fadein 0.4s ease-out',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}>
          <div className="fakecall-incoming" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '80px' }}>
            <div className="fakecall-caller-emoji" style={{
              fontSize: '72px', width: '120px', height: '120px',
              borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '16px',
            }}>{selectedCaller.emoji}</div>
            <div className="fakecall-caller-name" style={{
              fontSize: '32px', fontWeight: 600, color: '#fff', letterSpacing: '0.3px',
            }}>{selectedCaller.name}</div>
            <div className="fakecall-status" style={{
              fontSize: '15px', color: 'rgba(255,255,255,0.55)', fontWeight: 400,
              animation: 'fc-pulse 2s ease-in-out infinite',
            }}>Incoming call…</div>
          </div>
          <div className="fakecall-actions" style={{
            display: 'flex', gap: '80px', alignItems: 'center',
          }}>
            <button className="fakecall-decline" onClick={declineCall} style={{
              width: '68px', height: '68px', borderRadius: '50%',
              background: '#ef4444', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px', color: '#fff', transition: 'transform 0.15s',
            }}>
              <span style={{ transform: 'rotate(135deg)', display: 'inline-block' }}>📞</span>
            </button>
            <button className="fakecall-accept" onClick={acceptCall} style={{
              width: '68px', height: '68px', borderRadius: '50%',
              background: '#22c55e', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px', color: '#fff', transition: 'transform 0.15s',
              animation: 'fc-ring-pulse 1.5s ease-in-out infinite',
            }}>
              <span>📞</span>
            </button>
          </div>
          <div style={{ display: 'flex', gap: '60px', marginTop: '14px' }}>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', textAlign: 'center', width: '68px' }}>Decline</span>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', textAlign: 'center', width: '68px' }}>Accept</span>
          </div>
        </div>
      </>
    )
  }

  // Full-screen in-call overlay
  if (inCall) {
    return (
      <div className="fakecall-overlay incall" style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        <div className="fakecall-incoming" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '100px' }}>
          <div className="fakecall-caller-emoji" style={{
            fontSize: '64px', width: '110px', height: '110px',
            borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '12px',
          }}>{selectedCaller.emoji}</div>
          <div className="fakecall-caller-name" style={{
            fontSize: '28px', fontWeight: 600, color: '#fff',
          }}>{selectedCaller.name}</div>
          <div className="fakecall-timer" style={{
            fontSize: '16px', color: 'rgba(255,255,255,0.5)', fontWeight: 400, fontVariantNumeric: 'tabular-nums',
          }}>{formatTime(callTime)}</div>
        </div>
        <div className="fakecall-actions">
          <button className="fakecall-end" onClick={endCall} style={{
            width: '68px', height: '68px', borderRadius: '50%',
            background: '#ef4444', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', color: '#fff',
          }}>
            <span style={{ transform: 'rotate(135deg)', display: 'inline-block' }}>📞</span>
          </button>
          <span style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginTop: '10px' }}>End</span>
        </div>
      </div>
    )
  }

  // Countdown indicator — subtle, no fake-call reveal
  if (countdown !== null) {
    return (
      <div className="fakecall-countdown" onClick={cancelCountdown} style={{
        position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 99998, background: 'rgba(15,15,26,0.92)', backdropFilter: 'blur(12px)',
        color: 'rgba(255,255,255,0.7)', padding: '10px 22px', borderRadius: '28px',
        fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px',
        cursor: 'pointer', boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        <span className="fakecall-countdown-icon" style={{ fontSize: '16px' }}>📞</span>
        <span>{countdown}s</span>
        <span className="fakecall-cancel" style={{ opacity: 0.5, fontSize: '13px' }}>✕</span>
      </div>
    )
  }

  // Setup panel — shown when user clicks the trigger
  if (showSetup) {
    return (
      <div className="fakecall-setup">
        <div className="fakecall-setup-header">
          <h4>📱 Fake Call</h4>
          <button className="fakecall-setup-close" onClick={() => setShowSetup(false)}>✕</button>
        </div>
        <p className="fakecall-setup-desc">Set up a fake incoming call to help you leave an uncomfortable situation safely.</p>

        <label className="fakecall-label">Who's calling?</label>
        <div className="fakecall-callers">
          {CALLERS.map(c => (
            <button
              key={c.name}
              className={`fakecall-caller-btn ${selectedCaller.name === c.name ? 'active' : ''}`}
              onClick={() => setSelectedCaller(c)}
              style={{ '--caller-color': c.color }}
            >
              <span>{c.emoji}</span> {c.name}
            </button>
          ))}
        </div>

        <label className="fakecall-label">Ring in...</label>
        <div className="fakecall-delays">
          {DELAY_OPTIONS.map(d => (
            <button
              key={d.value}
              className={`fakecall-delay-btn ${delay === d.value ? 'active' : ''}`}
              onClick={() => setDelay(d.value)}
            >
              {d.label}
            </button>
          ))}
        </div>

        <button className="fakecall-start" onClick={startCountdown}>
          📞 Schedule Call
        </button>
      </div>
    )
  }

  // Trigger button (shown in SOS area)
  return null
}

// Export the trigger separately so SOSButton can use it
export function FakeCallTrigger({ onClick }) {
  return (
    <button className="sos-fakecall" onClick={onClick}>
      📱 Fake Incoming Call
    </button>
  )
}
