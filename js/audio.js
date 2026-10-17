/**
 * ============================================================================
 * TUSUPERCARD - SISTEMA DE AUDIO NATIVO Y HÁPTICO (Web Audio API)
 * ============================================================================
 * Genera micro-sonidos de interfaz sutiles, modernos y profesionales
 * (clics táctiles, transición suave al girar y confirmación al copiar/compartir)
 * 100% nativo y offline sin archivos externos.
 */

class SmartCardAudioSystem {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.initialized = false;

    // Cargar preferencia persistente (silenciado por defecto para máxima discreción)
    const saved = localStorage.getItem("tusupercard_audio_muted");
    if (saved !== null) {
      this.muted = saved === "true";
    }
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.initialized = true;
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem("tusupercard_audio_muted", this.muted);
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  // Clic háptico sutil al interactuar con una tarjeta
  playCardDraw() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.04);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.03, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {
      // Audio fallback silencioso
    }
  }

  // Transición suave al girar la tarjeta en 3D
  playCardFlip() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.06);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.025, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {
      // Audio fallback silencioso
    }
  }

  // Transición al cambiar de sección o extender la baraja
  playShuffle() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.02, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {
      // Audio fallback silencioso
    }
  }

  // Chime moderno y elegante al copiar enlace o compartir tarjeta
  playPortalChime() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [587.33, 739.99, 880.0]; // D5, F#5, A5 (Acorde moderno y limpio)
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.025);

        gain.gain.setValueAtTime(0.001, now + i * 0.025);
        gain.gain.linearRampToValueAtTime(0.035, now + i * 0.025 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.025 + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.025);
        osc.stop(now + i * 0.025 + 0.25);
      });
    } catch (e) {
      // Audio fallback silencioso
    }
  }
}

// Instancia global con alias de compatibilidad
window.smartCardAudio = new SmartCardAudioSystem();
window.mysticAudio = window.smartCardAudio;
