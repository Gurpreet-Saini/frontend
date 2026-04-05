import { useEffect, useRef } from 'react';

/**
 * Custom hook to listen for hardware barcode scanner input.
 *
 * Hardware scanners act as keyboards – they type each character very rapidly
 * (typically < 50 ms apart) and finish with an 'Enter' keystroke.
 *
 * Key difference from human typing:
 * - A human rarely types faster than one character every 100–150 ms.
 * - A scanner fires all characters within a total burst of < 100 ms.
 *
 * This hook works even when focus is inside an <input> or <textarea> by
 * monitoring inter-keystroke timing. When a scan is detected it calls onScan
 * and suppresses the raw characters so they don't pollute the focused field.
 */
export function useHardwareScanner(onScan: (scannedData: string) => void) {
  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef<number>(0);
  // Track whether we are currently accumulating what looks like a scan
  const isScanningRef = useRef(false);
  // Keep latest onScan in a ref so the effect never needs to re-register
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    const SCAN_SPEED_THRESHOLD_MS = 50; // scanners are faster than this per char
    const MIN_BARCODE_LENGTH = 3;

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      const elapsed = currentTime - lastKeyTime.current;

      // Decide if this keystroke is part of an ongoing scan burst
      const target = e.target as HTMLElement;
      const isInInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if (e.key === 'Enter') {
        // Enter key – if our buffer has enough chars & we were in scanner mode, fire
        if (isScanningRef.current && barcodeBuffer.current.length >= MIN_BARCODE_LENGTH) {
          e.preventDefault(); // Don't submit any form
          onScanRef.current(barcodeBuffer.current.trim());
        }
        // Always reset after Enter
        barcodeBuffer.current = '';
        isScanningRef.current = false;
        lastKeyTime.current = currentTime;
        return;
      }

      if (e.key.length !== 1) {
        // Non-printable key (Shift, Ctrl, etc.) – ignore but don't reset
        return;
      }

      // If too slow between chars → human typing; reset scanner accumulation
      if (elapsed > SCAN_SPEED_THRESHOLD_MS) {
        barcodeBuffer.current = '';
        isScanningRef.current = false;
      }

      // Mark as potentially scanning once we see rapid consecutive characters
      if (!isScanningRef.current && elapsed <= SCAN_SPEED_THRESHOLD_MS && barcodeBuffer.current.length > 0) {
        isScanningRef.current = true;
      }

      barcodeBuffer.current += e.key;

      // If we believe a scan is in progress inside an input, suppress the keystroke
      // so raw barcode chars don't appear in the search field.
      if (isScanningRef.current && isInInput) {
        e.preventDefault();
      }

      lastKeyTime.current = currentTime;
    };

    window.addEventListener('keydown', handleKeyDown, true); // capture phase
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []); // stable – uses refs, no deps needed
}
