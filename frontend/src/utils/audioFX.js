/**
 * Zero-asset Procedural Web Audio API Sound Synthesizer
 * Generates futuristic acoustic feedback with 0 external sound file dependencies.
 */
class BiometricAudioFX {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.activeNodes = null;
  }

  ensureContext() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      return this.ctx.resume();
    }
    return Promise.resolve();
  }

  init() {
    this.ensureContext();
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.isMuted && this.activeNodes) {
      this.stopContinuousSurge();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.activeNodes) {
      this.stopContinuousSurge();
    }
    return this.isMuted;
  }

  playClick() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // AudioContext policy or playback error ignored
    }
  }

  startContinuousSurge(durationSec = 3.5) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    this.stopContinuousSurge();

    try {
      const now = this.ctx.currentTime;
      const endTime = now + durationSec;

      // 1. Sub-Bass Voltage Oscillator (50Hz -> 85Hz)
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = "sine";
      subOsc.frequency.setValueAtTime(50, now);
      subOsc.frequency.linearRampToValueAtTime(85, endTime);
      subGain.gain.setValueAtTime(0.22, now);
      subGain.gain.linearRampToValueAtTime(0.38, endTime);
      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(now);
      subOsc.stop(endTime);

      // 2. Dual Detuned Transformer Coils (70Hz -> 980Hz)
      const coil1 = this.ctx.createOscillator();
      const coil2 = this.ctx.createOscillator();
      const coilGain = this.ctx.createGain();
      const coilFilter = this.ctx.createBiquadFilter();

      coil1.type = "sawtooth";
      coil2.type = "sawtooth";
      coil1.frequency.setValueAtTime(70, now);
      coil1.frequency.exponentialRampToValueAtTime(980, endTime);
      coil2.frequency.setValueAtTime(73, now);
      coil2.frequency.exponentialRampToValueAtTime(995, endTime);

      coilFilter.type = "lowpass";
      coilFilter.frequency.setValueAtTime(180, now);
      coilFilter.frequency.exponentialRampToValueAtTime(4500, endTime);
      coilFilter.Q.setValueAtTime(5.5, now);

      coilGain.gain.setValueAtTime(0.02, now);
      coilGain.gain.linearRampToValueAtTime(0.18, endTime);

      coil1.connect(coilFilter);
      coil2.connect(coilFilter);
      coilFilter.connect(coilGain);
      coilGain.connect(this.ctx.destination);

      coil1.start(now);
      coil2.start(now);
      coil1.stop(endTime);
      coil2.stop(endTime);

      // 3. Pink Noise Spark Crackle Generator
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99 * b0 + white * 0.05;
        b1 = 0.95 * b1 + white * 0.11;
        b2 = 0.85 * b2 + white * 0.25;
        output[i] = (b0 + b1 + b2) * 0.4;
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.setValueAtTime(1200, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(3800, endTime);
      noiseFilter.Q.setValueAtTime(6.0, now);

      const tremolo = this.ctx.createOscillator();
      tremolo.type = "square";
      tremolo.frequency.setValueAtTime(16, now);
      tremolo.frequency.linearRampToValueAtTime(48, endTime);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.01, now);
      noiseGain.gain.linearRampToValueAtTime(0.09, endTime);

      tremolo.connect(noiseGain.gain);
      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      tremolo.start(now);
      noiseSource.start(now);
      tremolo.stop(endTime);
      noiseSource.stop(endTime);

      this.activeNodes = { subOsc, coil1, coil2, noiseSource, tremolo };
    } catch {
      // AudioContext policy or playback error ignored
    }
  }

  stopContinuousSurge() {
    if (this.activeNodes) {
      try {
        Object.values(this.activeNodes).forEach((node) => {
          try {
            node.stop();
          } catch {
            // ignore
          }
          try {
            node.disconnect();
          } catch {
            // ignore
          }
        });
      } catch {
        // ignore
      }
      this.activeNodes = null;
    }
  }

  playMilestone(stage) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const chords = {
        1: [330, 440],
        2: [440, 660, 880],
        3: [554.37, 830.6, 1108.7],
      };

      const freqs = chords[stage] || [440, 880];
      freqs.forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, now + idx * 0.02);
        osc.frequency.exponentialRampToValueAtTime(f * 1.05, now + 0.35);

        gain.gain.setValueAtTime(0.08, now + idx * 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.02);
        osc.stop(now + 0.4);
      });
    } catch {
      // AudioContext policy or playback error ignored
    }
  }

  playPowerUp(stage = 1) {
    this.playMilestone(stage);
  }

  playSupernovaCompletion() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const boomOsc = this.ctx.createOscillator();
      const boomGain = this.ctx.createGain();
      boomOsc.type = "sine";
      boomOsc.frequency.setValueAtTime(180, now);
      boomOsc.frequency.exponentialRampToValueAtTime(28, now + 1.2);

      boomGain.gain.setValueAtTime(0.4, now);
      boomGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);

      boomOsc.connect(boomGain);
      boomGain.connect(this.ctx.destination);
      boomOsc.start(now);
      boomOsc.stop(now + 1.3);

      const shimmerOsc = this.ctx.createOscillator();
      const shimmerGain = this.ctx.createGain();
      const shimmerFilter = this.ctx.createBiquadFilter();

      shimmerOsc.type = "sawtooth";
      shimmerOsc.frequency.setValueAtTime(1760, now);
      shimmerOsc.frequency.exponentialRampToValueAtTime(4400, now + 0.5);

      shimmerFilter.type = "bandpass";
      shimmerFilter.frequency.setValueAtTime(2400, now);
      shimmerFilter.Q.setValueAtTime(4.0, now);

      shimmerGain.gain.setValueAtTime(0.18, now);
      shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      shimmerOsc.connect(shimmerFilter);
      shimmerFilter.connect(shimmerGain);
      shimmerGain.connect(this.ctx.destination);

      shimmerOsc.start(now);
      shimmerOsc.stop(now + 0.9);
    } catch {
      // AudioContext policy or playback error ignored
    }
  }

  playScanLock() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.09);
      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch {
      // AudioContext policy or playback error ignored
    }
  }

  playEmotionShift(mood = "neutral") {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const chords = {
        happy: [523.25, 659.25, 783.99], // C Major
        sad: [392.0, 466.16, 587.33], // G Minor
        surprise: [659.25, 880.0, 1046.5], // E High
        angry: [220.0, 277.18, 311.13], // Low Diminished
        fear: [440.0, 466.16, 622.25], // Dissonant Minor
        disgust: [311.13, 370.0, 415.3],
        neutral: [440.0, 554.37, 659.25], // A Major
      };

      const notes = chords[mood] || chords.neutral;
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.03);
        gain.gain.setValueAtTime(0.04, this.ctx.currentTime + i * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + i * 0.03);
        osc.stop(this.ctx.currentTime + 0.35);
      });
    } catch {
      // AudioContext policy or playback error ignored
    }
  }
}

export const soundFX = new BiometricAudioFX();
