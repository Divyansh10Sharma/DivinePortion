// Service-worker registration with a safe update policy (IOS-11).
//
// The PWA plugin runs in `autoUpdate` mode: a new SW installs and activates on its own.
// Instead of reloading the page immediately (the plugin default), we only reload when it
// can't interrupt the owner:
//   - never while a bottom sheet / editor is open (uiLocks), and
//   - only while the app is in the background (document hidden), or during the first few
//     seconds after launch (the update check runs at launch, so that is effectively
//     "apply on next launch").
// The app is a single bundle with no lazy chunks, so running the old page against the new
// SW until that moment is safe.

import { registerSW } from 'virtual:pwa-register';
import { hasOpenUiLocks, onUiLocksChange } from './uiLocks';

const LAUNCH_GRACE_MS = 5000;
const launchedAt = Date.now();
let reloadPending = false;

function tryApplyUpdate(): void {
  if (!reloadPending || hasOpenUiLocks()) return;
  const justLaunched = Date.now() - launchedAt < LAUNCH_GRACE_MS;
  if (document.visibilityState === 'hidden' || justLaunched) {
    reloadPending = false;
    window.location.reload();
  }
}

export function initServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;
  registerSW({
    immediate: true,
    onNeedReload() {
      reloadPending = true;
      tryApplyUpdate();
    },
  });
  document.addEventListener('visibilitychange', tryApplyUpdate);
  onUiLocksChange(tryApplyUpdate);
}
