/**
 * Retro sound synthesis via WebAudio. No audio files are loaded —
 * every sound is generated on the fly (short, subtle, retro-gaming flavored).
 */

export type SoundName =
  | "click"
  | "select"
  | "nav"
  | "purchase"
  | "success"
  | "error"
  | "upgrade"
  | "trade"
  | "listing"
  | "pack";

let ctx: AudioContext | null = null;
let clickSuppressedUntil = 0;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

type ToneOpts = {
  freq: number;
  endFreq?: number;
  type?: OscillatorType;
  dur: number;
  vol?: number;
  delay?: number;
};

function tone(ac: AudioContext, o: ToneOpts) {
  const t0 = ac.currentTime + (o.delay ?? 0);
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = o.type ?? "square";
  osc.frequency.setValueAtTime(o.freq, t0);
  if (o.endFreq && o.endFreq !== o.freq) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.endFreq), t0 + o.dur);
  }
  const vol = o.vol ?? 0.07;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + o.dur + 0.03);
}

function noise(ac: AudioContext, dur: number, vol = 0.05, delay = 0) {
  const t0 = ac.currentTime + delay;
  const buffer = ac.createBuffer(1, Math.max(1, Math.floor(ac.sampleRate * dur)), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  const filter = ac.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 900;
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start(t0);
}

export function playSound(name: SoundName) {
  const ac = getCtx();
  if (!ac) return;

  switch (name) {
    case "click":
      tone(ac, { freq: 1500, endFreq: 1000, type: "square", dur: 0.05, vol: 0.035 });
      break;
    case "select":
      tone(ac, { freq: 900, type: "square", dur: 0.05, vol: 0.04 });
      tone(ac, { freq: 1300, type: "square", dur: 0.05, vol: 0.04, delay: 0.055 });
      break;
    case "nav":
      tone(ac, { freq: 520, endFreq: 760, type: "triangle", dur: 0.07, vol: 0.045 });
      break;
    case "purchase":
      tone(ac, { freq: 880, type: "sine", dur: 0.07, vol: 0.06 });
      tone(ac, { freq: 1320, type: "sine", dur: 0.09, vol: 0.06, delay: 0.07 });
      tone(ac, { freq: 1760, type: "sine", dur: 0.12, vol: 0.045, delay: 0.14 });
      break;
    case "success":
      tone(ac, { freq: 660, type: "triangle", dur: 0.07, vol: 0.05 });
      tone(ac, { freq: 880, type: "triangle", dur: 0.07, vol: 0.05, delay: 0.07 });
      tone(ac, { freq: 1320, type: "triangle", dur: 0.14, vol: 0.05, delay: 0.14 });
      break;
    case "error":
      tone(ac, { freq: 240, endFreq: 170, type: "square", dur: 0.14, vol: 0.04 });
      break;
    case "upgrade":
      tone(ac, { freq: 300, endFreq: 900, type: "sawtooth", dur: 0.16, vol: 0.04 });
      tone(ac, { freq: 1200, type: "sine", dur: 0.1, vol: 0.05, delay: 0.16 });
      break;
    case "trade":
      tone(ac, { freq: 700, type: "square", dur: 0.06, vol: 0.04 });
      tone(ac, { freq: 500, type: "square", dur: 0.06, vol: 0.04, delay: 0.08 });
      tone(ac, { freq: 900, type: "square", dur: 0.09, vol: 0.04, delay: 0.16 });
      break;
    case "listing":
      tone(ac, { freq: 620, endFreq: 980, type: "triangle", dur: 0.12, vol: 0.05 });
      break;
    case "pack":
      noise(ac, 0.18, 0.05);
      tone(ac, { freq: 240, endFreq: 720, type: "sine", dur: 0.22, vol: 0.05, delay: 0.05 });
      tone(ac, { freq: 1280, type: "sine", dur: 0.14, vol: 0.06, delay: 0.24 });
      break;
  }
}

/** Suppress the next global click sound (used before explicit event sounds). */
export function suppressNextClick() {
  clickSuppressedUntil = Date.now() + 140;
}

export function shouldSuppressClick() {
  return Date.now() < clickSuppressedUntil;
}