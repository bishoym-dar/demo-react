import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent } from 'react'

type ToneModule = typeof import('tone')
type Point = { x: number; y: number }

const W = 640
const H = 320
const STEPS = 16
const ROOT_MIDI = 48 // C3
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const SCALES: Record<string, { label: string; intervals: number[] }> = {
  pentatonic: { label: 'Pentatonic', intervals: [0, 2, 4, 7, 9] },
  minor: { label: 'Minor pentatonic', intervals: [0, 3, 5, 7, 10] },
  dorian: { label: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10] },
  wholetone: { label: 'Whole tone', intervals: [0, 2, 4, 6, 8, 10] },
}

function midiToName(midi: number) {
  return `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`
}

function buildLadder(scale: string) {
  const { intervals } = SCALES[scale]
  const ladder: string[] = []
  for (let octave = 0; octave < 2; octave++) {
    for (const i of intervals) ladder.push(midiToName(ROOT_MIDI + octave * 12 + i))
  }
  ladder.push(midiToName(ROOT_MIDI + 24))
  return ladder
}

// Turns the drawn strokes into one note (or a rest) per step by reading the
// stroke's height wherever it crosses each step column.
function sampleNotes(strokes: Point[][], ladder: string[]): (string | null)[] {
  const half = W / STEPS / 2
  const points = strokes.flat()
  return Array.from({ length: STEPS }, (_, i) => {
    const cx = (i + 0.5) * (W / STEPS)
    const near = points.filter((p) => Math.abs(p.x - cx) <= half)
    if (near.length === 0) return null
    const y = near.reduce((sum, p) => sum + p.y, 0) / near.length
    const idx = Math.round((1 - y / H) * (ladder.length - 1))
    return ladder[Math.min(ladder.length - 1, Math.max(0, idx))]
  })
}

function squiggle(): Point[] {
  const phase = Math.random() * Math.PI * 2
  const waves = 1 + Math.random() * 2.5
  const wobble = Math.random() * 2 + 1
  return Array.from({ length: 80 }, (_, i) => {
    const t = i / 79
    const y = H / 2 + Math.sin(t * Math.PI * 2 * waves + phase) * H * 0.28 +
      Math.sin(t * Math.PI * 2 * waves * wobble) * H * 0.1
    return { x: 8 + t * (W - 16), y }
  })
}

const toPath = (stroke: Point[]) =>
  stroke.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')

export default function Loom() {
  const [strokes, setStrokes] = useState<Point[][]>([])
  const [scale, setScale] = useState('pentatonic')
  const [bpm, setBpm] = useState(110)
  const [playing, setPlaying] = useState(false)
  const [step, setStep] = useState(-1)
  const [error, setError] = useState('')
  const drawing = useRef(false)
  const tone = useRef<ToneModule | null>(null)
  const synth = useRef<InstanceType<ToneModule['Synth']> | null>(null)
  const fx = useRef<{ dispose: () => void }[]>([])
  const eventId = useRef<number | null>(null)

  const ladder = useMemo(() => buildLadder(scale), [scale])
  const notes = useMemo(() => sampleNotes(strokes, ladder), [strokes, ladder])
  const notesRef = useRef(notes)

  useEffect(() => {
    notesRef.current = notes
  }, [notes])

  useEffect(() => {
    if (tone.current) tone.current.getTransport().bpm.value = bpm
  }, [bpm])

  useEffect(
    () => () => {
      const T = tone.current
      if (T) {
        T.getTransport().stop()
        T.getTransport().cancel()
      }
      synth.current?.dispose()
      fx.current.forEach((node) => node.dispose())
    },
    [],
  )

  async function start() {
    try {
      const T = tone.current ?? (await import('tone'))
      tone.current = T
      await T.start()
      if (!synth.current) {
        const reverb = new T.Reverb({ decay: 4, wet: 0.35 })
        const delay = new T.FeedbackDelay({ delayTime: '8n.', feedback: 0.3, wet: 0.25 })
        const s = new T.Synth({
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.8 },
        })
        s.chain(delay, reverb, T.getDestination())
        s.volume.value = -8
        synth.current = s
        fx.current = [reverb, delay]
      }
      const transport = T.getTransport()
      transport.bpm.value = bpm
      let counter = 0
      eventId.current = transport.scheduleRepeat((time) => {
        const i = counter++ % STEPS
        const note = notesRef.current[i]
        if (note) synth.current?.triggerAttackRelease(note, '8n', time)
        T.getDraw().schedule(() => setStep(i), time)
      }, '8n')
      transport.start()
      setError('')
      setPlaying(true)
    } catch {
      setError('Audio could not be started in this browser.')
    }
  }

  function stop() {
    const transport = tone.current?.getTransport()
    if (transport) {
      transport.stop()
      if (eventId.current !== null) transport.clear(eventId.current)
    }
    eventId.current = null
    setPlaying(false)
    setStep(-1)
  }

  function toPoint(e: PointerEvent<SVGSVGElement>): Point {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: Math.min(W, Math.max(0, ((e.clientX - rect.left) / rect.width) * W)),
      y: Math.min(H, Math.max(0, ((e.clientY - rect.top) / rect.height) * H)),
    }
  }

  function onDown(e: PointerEvent<SVGSVGElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    drawing.current = true
    const p = toPoint(e)
    setStrokes((s) => [...s, [p]])
  }

  function onMove(e: PointerEvent<SVGSVGElement>) {
    if (!drawing.current) return
    const p = toPoint(e)
    setStrokes((s) => [...s.slice(0, -1), [...s[s.length - 1], p]])
  }

  function onUp() {
    drawing.current = false
  }

  return (
    <section className="loom">
      <h1 className="toolbox__title">Melody Loom</h1>
      <p className="toolbox__subtitle">
        Draw a line and hear its shape. Height becomes pitch on a musical scale, and
        the loop plays what you drew, step by step. Keep drawing while it plays.
      </p>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="loom__canvas"
        role="img"
        aria-label="Drawing canvas: draw a curve to compose a melody"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {Array.from({ length: STEPS }, (_, i) => (
          <rect
            key={i}
            x={i * (W / STEPS)}
            y={0}
            width={W / STEPS}
            height={H}
            className={i === step ? 'loom__col loom__col--active' : 'loom__col'}
          />
        ))}
        {strokes.map((s, i) => (
          <path key={i} d={toPath(s)} className="loom__stroke" />
        ))}
        {notes.map((n, i) =>
          n ? (
            <circle
              key={i}
              cx={(i + 0.5) * (W / STEPS)}
              cy={H - (ladder.indexOf(n) / (ladder.length - 1)) * H}
              r={i === step ? 9 : 5}
              className="loom__note"
            />
          ) : null,
        )}
        {strokes.length === 0 && (
          <text x={W / 2} y={H / 2} textAnchor="middle" className="loom__hint">
            ✍️ Draw here
          </text>
        )}
      </svg>

      <div className="loom__notes" aria-live="off">
        {notes.map((n, i) => (
          <span key={i} className={i === step ? 'loom__label loom__label--active' : 'loom__label'}>
            {n ?? '·'}
          </span>
        ))}
      </div>

      <div className="toolbox__filters" role="group" aria-label="Scale">
        {Object.entries(SCALES).map(([key, { label }]) => (
          <button
            key={key}
            type="button"
            className={key === scale ? 'chip chip--active' : 'chip'}
            aria-pressed={key === scale}
            onClick={() => setScale(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="focus__controls">
        <button type="button" onClick={playing ? stop : () => void start()}>
          {playing ? 'Stop' : 'Play'}
        </button>
        <button type="button" onClick={() => setStrokes([squiggle()])}>
          Surprise me
        </button>
        <button type="button" onClick={() => setStrokes((s) => s.slice(0, -1))} disabled={!strokes.length}>
          Undo
        </button>
        <button type="button" onClick={() => setStrokes([])} disabled={!strokes.length}>
          Clear
        </button>
      </div>

      <label className="loom__tempo">
        Tempo {bpm} BPM
        <input
          type="range"
          min={60}
          max={180}
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
        />
      </label>

      {error && <p role="alert">{error}</p>}
    </section>
  )
}
