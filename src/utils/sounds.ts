/* ─── Web Audio API Sound Effects ─────────────────────────────────────────
 * Subtle synthetic tones for key interactions. No external audio files needed.
 * Uses OscillatorNode + GainNode for short, pleasant sounds.
 * AudioContext is lazily created on first user interaction to comply with
 * browser autoplay policies.
 * All functions check the user's soundEnabled preference in IndexedDB
 * before playing — no sound if it's disabled.
 * ───────────────────────────────────────────────────────────────────────── */

import { getUserProgress } from '../data';

let audioCtx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  // Resume if suspended (autoplay policy)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/* ─── Check if sound is enabled ──────────────────────────────────────────── */
async function isSoundEnabled(): Promise<boolean> {
  try {
    const progress = await getUserProgress();
    return progress?.soundEnabled !== false; // default to true
  } catch {
    return true; // allow sound if we can't read settings
  }
}

/* ─── Card flip / tap ────────────────────────────────────────────────────── *
 * A soft "pop" — short burst at ~800Hz with quick decay (80ms).
 * Low volume to avoid being jarring.                                    */
export async function playFlip(): Promise<void> {
  if (!(await isSoundEnabled())) return;
  try {
    const ctx = getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  } catch {
    // Silently ignore — audio is non-critical
  }
}

/* ─── Correct answer / success ──────────────────────────────────────────── *
 * A bright ascending two-note chime: C5 → E5 (~523Hz → ~659Hz).
 * Each note 100ms, overlapping slightly. Gentle gain envelope.          */
export async function playCorrect(): Promise<void> {
  if (!(await isSoundEnabled())) return;
  try {
    const ctx = getContext();
    const now = ctx.currentTime;

    // First note (C5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.1, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.12);

    // Second note (E5) — starts slightly after first
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659, now + 0.1);
    gain2.gain.setValueAtTime(0, now + 0.1);
    gain2.gain.linearRampToValueAtTime(0.1, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.28);
  } catch {
    // Silently ignore
  }
}

/* ─── Note saved ─────────────────────────────────────────────────────────── *
 * A short pleasant three-note arpeggio: C4 → E4 → G4 (~262Hz → ~330Hz → ~392Hz).
 * Quick and crisp, like a "ding ding ding".                              */
export async function playSave(): Promise<void> {
  if (!(await isSoundEnabled())) return;
  try {
    const ctx = getContext();
    const now = ctx.currentTime;
    const notes = [262, 330, 392]; // C4, E4, G4

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + i * 0.07;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.07, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    });
  } catch {
    // Silently ignore
  }
}
