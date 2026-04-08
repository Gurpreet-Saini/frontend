import { useEffect, useRef } from 'react';

/**
 * Robust hardware barcode scanner hook.
 *
 * Hardware scanners inject keystrokes into the focused element, ending with Enter.
 * They type each character in 5–100 ms. This hook detects that pattern.
 *
 * Strategy (timeout-based, NOT speed-threshold-based for mid-scan chars):
 *  1. First char arrives  → start accumulating, start a 1 s watchdog timer.
 *  2. Second char arrives quickly (< 150 ms) → enter "scan mode".
 *  3. While in scan mode, suppress chars from any focused input field.
 *  4. Enter arrives while in scan mode with enough chars → fire onScan().
 *  5. If Enter never arrives within 1 s → reset (it was just typing).
 *
 * Why the old approach broke:
 *  The old code reset the buffer whenever elapsed > 50 ms between ANY two chars.
 *  Many scanners send chars at 60–100 ms intervals, so every character
 *  triggered a reset and the buffer never built up enough to fire.
 *
 * The new approach only resets on the FIRST gap (to distinguish scan start from
 * human typing). Once scan mode is active, we tolerate gaps up to 450 ms
 * (3× the detection threshold) before giving up.
 */
export function useHardwareScanner(onScan: (scannedData: string) => void) {
  const barcodeBuffer  = useRef('');
  const lastKeyTime    = useRef<number>(0);
  const isScanningRef  = useRef(false);
  const watchdogTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep latest callback in a ref – the effect registers only once
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    // --- Tuneable constants ---------------------------------------------------
    // Max ms between the FIRST and SECOND character to enter scan mode.
    // 150 ms covers virtually every scanner model (fast: 5 ms, slow: ~100 ms).
    const SCAN_DETECT_MS = 150;

    // Once in scan mode, tolerate gaps up to this value before giving up.
    // 3× SCAN_DETECT_MS keeps us resilient to occasional scanner hiccups.
    const SCAN_CONTINUE_MS = SCAN_DETECT_MS * 3; // 450 ms

    // If Enter doesn't arrive within this time after the first char, reset.
    const WATCHDOG_MS = 1000; // 1 second

    // Minimum chars to consider a valid barcode (avoids accidental Enter press)
    const MIN_LENGTH = 4;
    // -------------------------------------------------------------------------

    const clearWatchdog = () => {
      if (watchdogTimer.current !== null) {
        clearTimeout(watchdogTimer.current);
        watchdogTimer.current = null;
      }
    };

    const resetBuffer = () => {
      clearWatchdog();
      barcodeBuffer.current  = '';
      isScanningRef.current  = false;
      lastKeyTime.current    = 0;
    };

    const startWatchdog = () => {
      clearWatchdog();
      watchdogTimer.current = setTimeout(resetBuffer, WATCHDOG_MS);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const now     = Date.now();
      const elapsed = now - lastKeyTime.current;
      const target  = e.target as HTMLElement;
      const inInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // ── Enter key ──────────────────────────────────────────────────────────
      if (e.key === 'Enter') {
        clearWatchdog();

        if (isScanningRef.current && barcodeBuffer.current.length >= MIN_LENGTH) {
          // Valid scan – fire the callback
          e.preventDefault();
          e.stopPropagation();

          // Clear any character(s) that leaked into a focused input before
          // scan mode was detected (i.e. the very first character).
          if (inInput) {
            const inp = target as HTMLInputElement;
            if (inp.value) {
              const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype, 'value'
              )?.set;
              if (nativeInputValueSetter) {
                nativeInputValueSetter.call(inp, '');
              } else {
                inp.value = '';
              }
              inp.dispatchEvent(new Event('input', { bubbles: true }));
            }
          }

          onScanRef.current(barcodeBuffer.current.trim());
        }

        resetBuffer();
        return;
      }

      // ── Ignore non-printable keys (Shift, Ctrl, Alt …) ────────────────────
      if (e.key.length !== 1) return;

      // ── First character ever (empty buffer) ───────────────────────────────
      if (barcodeBuffer.current.length === 0) {
        barcodeBuffer.current = e.key;
        lastKeyTime.current   = now;
        startWatchdog();        // give scanner 1 s to complete
        // Don't suppress yet – we can't tell if it's a scan or human keystroke
        return;
      }

      // ── Subsequent characters ─────────────────────────────────────────────
      if (!isScanningRef.current) {
        // Still deciding: is this a scanner or a human?
        if (elapsed <= SCAN_DETECT_MS) {
          // Second char arrived quickly → it's a scanner
          isScanningRef.current = true;
        } else {
          // Too slow → human typed the first char, start fresh with this one
          barcodeBuffer.current = e.key;
          lastKeyTime.current   = now;
          startWatchdog();
          return;
        }
      } else {
        // Already in scan mode – tolerate small gaps (scanner hiccup / USB lag)
        if (elapsed > SCAN_CONTINUE_MS) {
          // Gap too long even for a slow scanner → abandon and start fresh
          barcodeBuffer.current = e.key;
          isScanningRef.current = false;
          lastKeyTime.current   = now;
          startWatchdog();
          return;
        }
      }

      // Accumulate character
      barcodeBuffer.current += e.key;
      lastKeyTime.current    = now;
      startWatchdog(); // refresh the watchdog on every char

      // Suppress keystrokes from the focused input while scanning
      if (isScanningRef.current && inInput) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true); // capture phase
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      clearWatchdog();
    };
  }, []); // stable – all state lives in refs
}
