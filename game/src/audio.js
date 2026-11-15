// All sound in Prism Breaker is synthesized with WebAudio: no audio files.
// SoundEngine owns one AudioContext, a master gain and a tiny step sequencer
// that plays a quiet bass-and-arp loop while the game runs. It starts only
// after a user gesture (or never, in screenshot mode), and never throws.
export class SoundEngine {
  constructor() {
    this.context = null;
    this.master = null;
    this.muted = false;
    this.musicTimer = null;
    this.musicStep = 0;
    this.nextNoteTime = 0;
    this.enabled = true;
  }

  /** Create the context on a user gesture; safe to call more than once. */
  unlock() {
    if (!this.enabled || this.context) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.context.destination);
    } catch {
      this.context = null;
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.5, this.context.currentTime, 0.02);
    }
  }

  /** A short oscillator blip with a pitch slide and an exponential fade. */
  blip(freqStart, freqEnd, duration, type, volume) {
    if (!this.context || this.muted) return;
    try {
      const now = this.context.currentTime;
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.type = type || 'square';
      osc.frequency.setValueAtTime(freqStart, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), now + duration);
      gain.gain.setValueAtTime(volume || 0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch {
      // Sound is decoration: a failure must never break the game.
    }
  }

  /** A short filtered noise burst (used for explosions and impacts). */
  noise(duration, volume, cutoff) {
    if (!this.context || this.muted) return;
    try {
      const now = this.context.currentTime;
      const length = Math.max(1, Math.floor(this.context.sampleRate * duration));
      const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      const filter = this.context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = cutoff || 1200;
      const gain = this.context.createGain();
      gain.gain.setValueAtTime(volume || 0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      source.start(now);
    } catch {
      // Sound is decoration: a failure must never break the game.
    }
  }

  paddleHit() {
    this.blip(220, 330, 0.07, 'square', 0.16);
  }

  wallHit() {
    this.blip(160, 200, 0.05, 'square', 0.1);
  }

  brickHit(hp) {
    this.blip(520 + hp * 60, 340, 0.08, 'triangle', 0.22);
    this.noise(0.05, 0.08, 2400);
  }

  brickBreak() {
    this.blip(660, 180, 0.14, 'sawtooth', 0.2);
    this.noise(0.16, 0.2, 1800);
  }

  bomb() {
    this.noise(0.4, 0.35, 900);
    this.blip(180, 40, 0.35, 'sawtooth', 0.25);
  }

  powerup() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.blip(freq, freq, 0.12, 'sine', 0.18), i * 55);
    });
  }

  launch() {
    this.blip(300, 620, 0.12, 'sine', 0.18);
  }

  laser() {
    this.blip(880, 220, 0.09, 'square', 0.12);
  }

  loseLife() {
    this.blip(320, 90, 0.4, 'sawtooth', 0.22);
    this.noise(0.25, 0.15, 700);
  }

  levelClear() {
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((freq, i) => {
      setTimeout(() => this.blip(freq, freq, 0.18, 'triangle', 0.2), i * 90);
    });
  }

  victory() {
    const notes = [523, 659, 784, 1047, 784, 1047, 1319, 1568];
    notes.forEach((freq, i) => {
      setTimeout(() => this.blip(freq, freq, 0.22, 'triangle', 0.2), i * 110);
    });
  }

  gameOver() {
    const notes = [392, 330, 262, 196];
    notes.forEach((freq, i) => {
      setTimeout(() => this.blip(freq, freq * 0.9, 0.3, 'sawtooth', 0.18), i * 160);
    });
  }

  /** Start the quiet bass-and-arp music loop. */
  startMusic() {
    if (!this.context || this.musicTimer) return;
    this.nextNoteTime = this.context.currentTime + 0.1;
    this.musicStep = 0;
    this.musicTimer = setInterval(() => this.scheduleMusic(), 40);
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  scheduleMusic() {
    if (!this.context || this.muted) return;
    // A minor: bass roots and a pentatonic arp, 16 steps at 116 BPM.
    const bass = [110, 0, 110, 0, 98, 0, 98, 0, 87.3, 0, 87.3, 0, 123.5, 0, 98, 0];
    const arp = [220, 261.6, 329.6, 440, 523.3, 440, 329.6, 261.6, 220, 261.6, 329.6, 392, 440, 392, 329.6, 261.6];
    const stepSeconds = 60 / 116 / 4;
    while (this.nextNoteTime < this.context.currentTime + 0.15) {
      const step = this.musicStep % 16;
      const bassNote = bass[step];
      if (bassNote) this.noteAt(bassNote, this.nextNoteTime, stepSeconds * 1.8, 'triangle', 0.1);
      if (step % 2 === 0) this.noteAt(arp[step], this.nextNoteTime, stepSeconds, 'sine', 0.05);
      this.nextNoteTime += stepSeconds;
      this.musicStep += 1;
    }
  }

  noteAt(freq, time, duration, type, volume) {
    try {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(time);
      osc.stop(time + duration + 0.02);
    } catch {
      // Sound is decoration: a failure must never break the game.
    }
  }
}
