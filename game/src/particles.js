// Sparks, shards and floating score texts. Particles are plain objects in
// one array; the world spawns them on impacts and the renderer draws them
// additively. Nothing here knows about the game rules.
export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.texts = [];
    this.shake = 0;
  }

  /** A burst of glowing sparks at (x, y) in the given colour. */
  burst(x, y, color, count, speed) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = (speed || 260) * (0.3 + Math.random() * 0.7);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 60,
        life: 0.45 + Math.random() * 0.35,
        age: 0,
        size: 2 + Math.random() * 3.5,
        color,
        shard: Math.random() < 0.35,
        spin: (Math.random() - 0.5) * 12,
        angle: Math.random() * Math.PI,
      });
    }
    if (this.particles.length > 420) this.particles.splice(0, this.particles.length - 420);
  }

  /** A small puff used for paddle and wall impacts. */
  puff(x, y, color) {
    this.burst(x, y, color, 6, 140);
  }

  /** A floating score label that rises and fades. */
  floatText(x, y, text, color, big) {
    this.texts.push({ x, y, text, color, age: 0, life: big ? 1.2 : 0.9, big: !!big });
    if (this.texts.length > 24) this.texts.shift();
  }

  /** A screen-shake impulse; decays on its own. */
  addShake(amount) {
    this.shake = Math.min(14, this.shake + amount);
  }

  step(dt) {
    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const p = this.particles[i];
      p.age += dt;
      if (p.age >= p.life) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vy += 520 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.angle += p.spin * dt;
    }
    for (let i = this.texts.length - 1; i >= 0; i -= 1) {
      const t = this.texts[i];
      t.age += dt;
      t.y -= 42 * dt;
      if (t.age >= t.life) this.texts.splice(i, 1);
    }
    this.shake = Math.max(0, this.shake - 34 * dt);
  }

  clear() {
    this.particles.length = 0;
    this.texts.length = 0;
    this.shake = 0;
  }
}
