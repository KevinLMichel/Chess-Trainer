type AudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext
  }

let audioContext: AudioContext | undefined

const getAudioContext = () => {
  if (typeof window === 'undefined') return undefined
  const audioWindow = window as AudioWindow
  const AudioContextConstructor = audioWindow.AudioContext ?? audioWindow.webkitAudioContext
  if (!AudioContextConstructor) return undefined
  audioContext ??= new AudioContextConstructor()
  return audioContext
}

export const playMoveClick = async (enabled: boolean) => {
  if (!enabled) return
  const context = getAudioContext()
  if (!context) return

  if (context.state === 'suspended') {
    await context.resume()
  }

  const start = context.currentTime
  const duration = 0.085
  const master = context.createGain()
  const low = context.createOscillator()
  const high = context.createOscillator()
  const filter = context.createBiquadFilter()

  low.type = 'triangle'
  high.type = 'sine'
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(980, start)
  filter.Q.setValueAtTime(1.4, start)

  low.frequency.setValueAtTime(410, start)
  low.frequency.exponentialRampToValueAtTime(210, start + duration)
  high.frequency.setValueAtTime(1280, start)
  high.frequency.exponentialRampToValueAtTime(760, start + duration * 0.72)

  master.gain.setValueAtTime(0.0001, start)
  master.gain.exponentialRampToValueAtTime(0.14, start + 0.006)
  master.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  low.connect(filter)
  high.connect(filter)
  filter.connect(master)
  master.connect(context.destination)

  low.start(start)
  high.start(start)
  low.stop(start + duration)
  high.stop(start + duration)
}
