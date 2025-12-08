class Timer {
  constructor(defaultDuration = 60) {
    this.defaultDuration = defaultDuration;
    this.interval = null;
    this.remaining = defaultDuration;
  }

  start(duration = this.defaultDuration, onTick, onComplete) {
    this.stop();
    this.remaining = duration;

    // Immediately notify current time left
    if (onTick) onTick(this.remaining);

    this.interval = setInterval(() => {
      this.remaining -= 1;
      if (this.remaining <= 0) {
        this.stop();
        if (onComplete) onComplete();
      } else if (onTick) {
        onTick(this.remaining);
      }
    }, 1000);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  getRemaining() {
    return this.remaining;
  }
}

module.exports = Timer;
