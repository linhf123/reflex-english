(() => {
  "use strict";

  let active = false;
  let wakeLock = null;

  async function acquire() {
    if (!active || !("wakeLock" in navigator) || document.visibilityState !== "visible") {
      return false;
    }
    if (wakeLock && !wakeLock.released) return true;
    try {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => {
        wakeLock = null;
      });
      return true;
    } catch {
      wakeLock = null;
      return false;
    }
  }

  async function release() {
    const lock = wakeLock;
    wakeLock = null;
    if (lock && !lock.released) {
      try {
        await lock.release();
      } catch {
        // The lock may already have been released by the browser.
      }
    }
  }

  async function setActive(value) {
    active = Boolean(value);
    if (active) return acquire();
    await release();
    return false;
  }

  document.addEventListener("visibilitychange", () => {
    if (active && document.visibilityState === "visible") acquire();
  });

  window.ReflexPlayback = {
    setActive,
    release,
    isActive: () => active,
    isWakeLockSupported: () => "wakeLock" in navigator,
  };
})();
