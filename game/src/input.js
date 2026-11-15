// Keyboard and mouse input for Prism Breaker. The game reads this module's
// state each frame; edge-triggered actions (launch, fire, restart) are
// consumed once, so holding a key does not repeat them. Mouse position is
// converted into the canvas's logical coordinates.
export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.mouseX = null;
    this.mouseActive = false;
    this.clicked = false;
    this.pressedKeys = new Set();
    this.pilot = null;
    this.attach();
  }

  attach() {
    window.addEventListener('keydown', (event) => {
      if (['ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) event.preventDefault();
      if (!event.repeat) this.pressedKeys.add(event.code);
      this.keys.add(event.code);
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
    });
    this.canvas.addEventListener('mousemove', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = ((event.clientX - rect.left) / rect.width) * this.canvas.width;
      this.mouseActive = true;
    });
    this.canvas.addEventListener('mousedown', (event) => {
      event.preventDefault();
      this.clicked = true;
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = ((event.clientX - rect.left) / rect.width) * this.canvas.width;
      this.mouseActive = true;
    });
    this.canvas.addEventListener('touchstart', (event) => {
      event.preventDefault();
      this.clicked = true;
      const rect = this.canvas.getBoundingClientRect();
      const touch = event.touches[0];
      this.mouseX = ((touch.clientX - rect.left) / rect.width) * this.canvas.width;
      this.mouseActive = true;
    }, { passive: false });
    this.canvas.addEventListener('touchmove', (event) => {
      event.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const touch = event.touches[0];
      this.mouseX = ((touch.clientX - rect.left) / rect.width) * this.canvas.width;
      this.mouseActive = true;
    }, { passive: false });
  }

  get left() {
    return this.keys.has('ArrowLeft') || this.keys.has('KeyA');
  }

  get right() {
    return this.keys.has('ArrowRight') || this.keys.has('KeyD');
  }

  /** True once when Space or Enter was pressed since the last frame. */
  get actionPressed() {
    return this.pressedKeys.has('Space') || this.pressedKeys.has('Enter') || this.clicked;
  }

  /** True once when the named key was pressed since the last frame. */
  wasPressed(code) {
    return this.pressedKeys.has(code);
  }

  /** Clear the edge-triggered presses after the frame has read them. */
  endFrame() {
    this.pressedKeys.clear();
    this.clicked = false;
  }

  /** The autopilot (screenshot mode) drives the paddle through this. */
  setPilot(pilot) {
    this.pilot = pilot;
  }
}
