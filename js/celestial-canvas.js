/**
 * ============================================================================
 * TUSUPERCARD - LIENZO DIGITAL DE FONDO (CANVAS INTERACTIVO)
 * ============================================================================
 * Renderiza una red de partículas interactivas, constelaciones digitales
 * y sutiles halos de luz ambiental en 60 FPS con mínimo impacto en CPU.
 */

class DigitalAmbientCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");
    this.particles = [];
    this.mouse = { x: -1000, y: -1000, radius: 150 };
    this.particleCount = 80;
    this.running = true;
    this.isVisible = true;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener("resize", () => this.resize());

    window.addEventListener("mousemove", (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    window.addEventListener("mouseleave", () => {
      this.mouse.x = -1000;
      this.mouse.y = -1000;
    });

    // Pausar renderizado cuando la pestaña está oculta para ahorrar batería/CPU
    document.addEventListener("visibilitychange", () => {
      this.isVisible = !document.hidden;
      if (this.isVisible && !this.animationFrameId) {
        this.animate();
      }
    });

    this.createParticles();
    this.animate();
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
    
    // Conteo balanceado según resolución
    const area = this.width * this.height;
    this.particleCount = Math.floor(area / 16000);
    this.particleCount = Math.min(Math.max(this.particleCount, 40), 100);
    this.createParticles();
  }

  createParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 1.8 + 0.8,
        baseAlpha: Math.random() * 0.45 + 0.15,
        alpha: Math.random() * 0.45 + 0.15,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.02 + 0.008,
        color: i % 4 === 0 ? "#38bdf8" : (i % 6 === 0 ? "#818cf8" : "#94a3b8")
      });
    }
  }

  drawAmbientNetwork() {
    const maxDist = 110;
    const pLen = this.particles.length;

    for (let i = 0; i < pLen; i++) {
      const p1 = this.particles[i];

      // Conexión con el cursor del ratón
      const dxMouse = this.mouse.x - p1.x;
      const dyMouse = this.mouse.y - p1.y;
      const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

      if (distMouse < this.mouse.radius) {
        const mouseAlpha = (1 - distMouse / this.mouse.radius) * 0.4;
        this.ctx.strokeStyle = `rgba(56, 189, 248, ${mouseAlpha})`;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(this.mouse.x, this.mouse.y);
        this.ctx.stroke();

        // Leve empuje suave
        p1.x -= dxMouse * 0.005;
        p1.y -= dyMouse * 0.005;
      }

      // Conexión entre nodos vecinos
      for (let j = i + 1; j < pLen; j++) {
        const p2 = this.particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDist) {
          const edgeAlpha = (1 - dist / maxDist) * 0.18;
          this.ctx.strokeStyle = `rgba(99, 102, 241, ${edgeAlpha})`;
          this.ctx.lineWidth = 0.75;
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
        }
      }
    }
  }

  animate() {
    if (!this.isVisible) {
      this.animationFrameId = null;
      return;
    }

    this.ctx.clearRect(0, 0, this.width, this.height);

    // Actualizar y dibujar partículas
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      p.x += p.vx;
      p.y += p.vy;

      // Rebote suave en los bordes
      if (p.x < 0 || p.x > this.width) p.vx *= -1;
      if (p.y < 0 || p.y > this.height) p.vy *= -1;

      // Pulso sutil de brillo
      p.phase += p.pulseSpeed;
      p.alpha = p.baseAlpha + Math.sin(p.phase) * 0.15;

      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = Math.max(0.1, Math.min(1, p.alpha));
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.globalAlpha = 1;

    // Dibujar red de conexiones interactivas
    this.drawAmbientNetwork();

    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }
}

// Instanciar al cargar el DOM con alias de retrocompatibilidad
window.addEventListener("DOMContentLoaded", () => {
  window.ambientCanvas = new DigitalAmbientCanvas("celestial-bg");
  window.celestialCanvas = window.ambientCanvas;
});
