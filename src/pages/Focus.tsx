import { useEffect, useRef, useState } from 'react'

type Mode = 'focus' | 'short' | 'long'

const MODES: Record<Mode, { label: string; minutes: number; emoji: string }> = {
  focus: { label: 'Focus', minutes: 25, emoji: '🍅' },
  short: { label: 'Short break', minutes: 5, emoji: '☕' },
  long: { label: 'Long break', minutes: 15, emoji: '🌴' },
}

const MODE_ORDER: Mode[] = ['focus', 'short', 'long']
const STORAGE_KEY = 'focus-sessions'
const RADIUS = 90
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function today() {
  return new Date().toISOString().slice(0, 10)
}

function loadSessions(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return 0
    const parsed = JSON.parse(raw) as { date?: string; count?: number }
    return parsed.date === today() && typeof parsed.count === 'number' ? parsed.count : 0
  } catch {
    return 0
  }
}

function saveSessions(count: number) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today(), count }))
  } catch {
    // storage unavailable; the counter simply won't persist
  }
}

function chime() {
  try {
    const ctx = new AudioContext()
    ;[660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const start = ctx.currentTime + i * 0.25
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.15, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5)
      osc.connect(gain).connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 0.5)
    })
    setTimeout(() => void ctx.close(), 1000)
  } catch {
    // audio not available
  }
}

function format(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const durationOf = (mode: Mode) => MODES[mode].minutes * 60_000

export default function Focus() {
  const [mode, setMode] = useState<Mode>('focus')
  const [remaining, setRemaining] = useState(durationOf('focus'))
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(loadSessions)
  const endAt = useRef(0)

  function switchMode(next: Mode) {
    setMode(next)
    setRunning(false)
    setRemaining(durationOf(next))
  }

  function toggle() {
    if (!running) endAt.current = Date.now() + remaining
    setRunning(!running)
  }

  function reset() {
    setRunning(false)
    setRemaining(durationOf(mode))
  }

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      const left = endAt.current - Date.now()
      if (left > 0) {
        setRemaining(left)
        return
      }
      chime()
      setRunning(false)
      if (mode === 'focus') {
        const count = sessions + 1
        setSessions(count)
        saveSessions(count)
        const next: Mode = count % 4 === 0 ? 'long' : 'short'
        setMode(next)
        setRemaining(durationOf(next))
      } else {
        setMode('focus')
        setRemaining(durationOf('focus'))
      }
    }, 250)
    return () => clearInterval(id)
  }, [running, mode, sessions])

  const baseTitle = useRef(document.title)

  useEffect(() => {
    const base = baseTitle.current
    document.title = running ? `${format(remaining)} · ${MODES[mode].label}` : base
    return () => {
      document.title = base
    }
  }, [running, remaining, mode])

  const progress = 1 - remaining / durationOf(mode)

  return (
    <section className="focus">
      <h1 className="toolbox__title">Focus Timer</h1>
      <p className="toolbox__subtitle">
        A Pomodoro timer that keeps counting in your browser tab title and chimes when
        time is up. Every fourth session earns a long break.
      </p>

      <div className="toolbox__filters" role="group" aria-label="Timer mode">
        {MODE_ORDER.map((m) => (
          <button
            key={m}
            type="button"
            className={m === mode ? 'chip chip--active' : 'chip'}
            aria-pressed={m === mode}
            onClick={() => switchMode(m)}
          >
            {MODES[m].label}
          </button>
        ))}
      </div>

      <div className="focus__dial">
        <svg viewBox="0 0 200 200" className="focus__ring" aria-hidden="true">
          <circle className="focus__track" cx="100" cy="100" r={RADIUS} />
          <circle
            className="focus__progress"
            cx="100"
            cy="100"
            r={RADIUS}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          />
        </svg>
        <div className="focus__readout">
          <span className="focus__emoji" aria-hidden="true">
            {MODES[mode].emoji}
          </span>
          <span className="focus__time" role="timer" aria-live="off">
            {format(remaining)}
          </span>
        </div>
      </div>

      <div className="focus__controls">
        <button type="button" onClick={toggle}>
          {running ? 'Pause' : remaining < durationOf(mode) ? 'Resume' : 'Start'}
        </button>
        <button type="button" onClick={reset}>
          Reset
        </button>
      </div>

      <p className="read-the-docs">
        {'🍅'.repeat(Math.min(sessions, 12)) || 'No sessions yet.'}
        {sessions > 0 && ` ${sessions} focus session${sessions === 1 ? '' : 's'} today`}
      </p>
    </section>
  )
}
