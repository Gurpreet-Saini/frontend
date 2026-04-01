'use client';

import { useState } from 'react';
import { X, MessageSquare, Send, Loader2 } from 'lucide-react';
import { submitFeedback } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;

    setLoading(true);
    try {
      await submitFeedback({ subject, message });
      toast.success('Feedback submitted successfully!');
      setSubject('');
      setMessage('');
      onClose();
    } catch (error) {
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-[#7a0000] p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white/20 rounded-xl">
                 <MessageSquare size={20} />
             </div>
             <div>
               <p className="text-[10px] font-black text-red-200 uppercase tracking-widest leading-none mb-1">Feedback</p>
               <h3 className="text-xl font-black uppercase tracking-tight leading-none">Send Feedback</h3>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What is this about?"
              required
              className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-[#7a0000] focus:bg-white rounded-2xl transition-all outline-none text-sm font-bold text-gray-900 placeholder:text-gray-300"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what's on your mind..."
              required
              rows={4}
              className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-[#7a0000] focus:bg-white rounded-2xl transition-all outline-none text-sm font-bold text-gray-900 placeholder:text-gray-300 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#7a0000] text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-red-900/20 hover:shadow-red-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            <span>{loading ? 'Sending...' : 'Submit Feedback'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
