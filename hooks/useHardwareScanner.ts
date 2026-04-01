import { useEffect, useRef } from 'react';

/**
 * Custom hook to listen for hardware barcode scanner input.
 * Hardware scanners act as keyboards, typing characters rapidly and ending with an 'Enter' key.
 */
export function useHardwareScanner(onScan: (scannedData: string) => void) {
  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      const currentTime = Date.now();
      
      // If the time between keystrokes is too long (e.g. > 150ms), it's a human typing, not a scanner.
      // Reset the buffer. Hardware scanners typically type each character within 10-50ms.
      if (currentTime - lastKeyTime.current > 150) {
        barcodeBuffer.current = '';
      }

      // If the key is 'Enter', it means the scanner finished scanning.
      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length > 2) { // Ensure it's not just a random enter press
          onScan(barcodeBuffer.current);
          barcodeBuffer.current = ''; // Reset after successful scan
        }
      } else if (e.key.length === 1) { // Only capture single characters
        barcodeBuffer.current += e.key;
      }

      lastKeyTime.current = currentTime;
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onScan]);
}
