'use client';

import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
}

export default function ScannerModal({ isOpen, onClose, onScan }: ScannerModalProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Initialize scanner when modal opens
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10 }, // Removed qrbox parameter to allow full frame scanning for 1D barcodes
        /* verbose= */ false
      );

      scannerRef.current.render(
        (decodedText) => {
          // Play a simple beep sound on successful scan
          playBeep();
          onScan(decodedText);
          onClose(); // Auto-close or let parent handle? Let's auto-close for now.
        },
        (error) => {
          // Ignore scanning errors (like "no QR code found in current frame")
        }
      );
    }

    return () => {
      // Cleanup scanner when modal closes
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner. ", error);
        });
        scannerRef.current = null;
      }
    };
  }, [isOpen, onScan, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-indigo-600 p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white/20 rounded-xl">
                 <Camera size={20} />
             </div>
             <div>
               <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest leading-none mb-1">Device Camera</p>
               <h3 className="text-xl font-black uppercase tracking-tight leading-none">Scan Badge</h3>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
           <div id="qr-reader" className="w-full mx-auto border-4 border-gray-100 rounded-3xl overflow-hidden shadow-inner"></div>
           <p className="text-center text-xs font-bold text-gray-400 mt-6 uppercase tracking-widest">
             Position the Barcode or QR Code within the frame to scan.
           </p>
        </div>
      </div>
    </div>
  );
}

// Helper funtion to play a short high-pitched beep
function playBeep() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 1000; // 1000Hz beep

    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.1);
  } catch (err) {
    console.error("Audio beep failed", err);
  }
}
