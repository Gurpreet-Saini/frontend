'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getFeedbacks, markFeedbackAsRead, deleteFeedback } from '@/lib/api';
import { Feedback } from '@/lib/types';
import { 
  MessageSquare, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  User, 
  Calendar,
  Loader2,
  RefreshCcw,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import DashboardLayout from '@/components/DashboardLayout';

export default function FeedbackPage() {
  const { isSuperAdmin } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedbacks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getFeedbacks();
      setFeedbacks(res.data);
    } catch (err) {
      console.error('Failed to fetch feedback:', err);
      setError('Failed to load feedback messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchFeedbacks();
    }
  }, [isSuperAdmin]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await markFeedbackAsRead(id);
      setFeedbacks(prev => 
        prev.map(f => f.id === id ? { ...f, is_read: true } : f)
      );
      toast.success('Marked as read');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;
    try {
      await deleteFeedback(id);
      setFeedbacks(prev => prev.filter(f => f.id !== id));
      toast.success('Feedback deleted');
    } catch (err) {
      toast.error('Failed to delete feedback');
    }
  };

  if (!isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
          <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-6">
            <AlertCircle size={40} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Access Denied</h1>
          <p className="text-gray-500 font-medium max-w-md mt-2">
            Only SuperAdmins have permission to view and manage feedback messages.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#7a0000] text-white rounded-2xl shadow-lg shadow-red-900/20">
                <MessageSquare size={24} />
              </div>
              <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight leading-none pt-1">Feedback</h1>
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest ml-1">
              User submissions and suggestions
            </p>
          </div>
          
          <button 
            onClick={fetchFeedbacks}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3.5 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-800 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {error ? (
          <div className="p-8 bg-red-50 border-2 border-red-100 rounded-[2rem] flex flex-col items-center text-center">
            <AlertCircle size={48} className="text-red-500 mb-4" />
            <p className="text-red-900 font-bold mb-4">{error}</p>
            <button 
              onClick={fetchFeedbacks}
              className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-red-700 transition-all"
            >
              Try Again
            </button>
          </div>
        ) : loading && feedbacks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 bg-gray-50/50 border-2 border-dashed border-gray-100 rounded-[3rem]">
            <Loader2 size={48} className="text-[#7a0000] animate-spin mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Loading Messages...</p>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 bg-gray-50/50 border-2 border-dashed border-gray-100 rounded-[3rem] text-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-gray-300 shadow-sm border border-gray-100 mb-4">
              <MessageSquare size={32} />
            </div>
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">No Feedback Yet</h3>
            <p className="text-sm text-gray-400 font-medium mt-1">When users send feedback, they will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {feedbacks.map((f) => (
              <div 
                key={f.id}
                className={cn(
                  "group bg-white p-8 rounded-[2.5rem] border-2 transition-all duration-300",
                  f.is_read ? "border-gray-50 opacity-80" : "border-white shadow-xl shadow-gray-200/50"
                )}
              >
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-4 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      {!f.is_read && (
                        <span className="px-2.5 py-1 bg-red-100 text-[#7a0000] text-[10px] font-black uppercase tracking-widest rounded-lg">New</span>
                      )}
                      <h4 className="text-xl font-black text-gray-900 tracking-tight">{f.subject}</h4>
                    </div>
                    
                    <p className="text-gray-600 font-medium leading-relaxed whitespace-pre-wrap">
                      {f.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-6 pt-2">
                      <div className="flex items-center gap-2 text-gray-400">
                        <User size={14} className="text-[#7a0000]" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          {f.user?.username || 'Anonymous'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar size={14} className="text-[#7a0000]" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          {format(new Date(f.created_at), 'PPPp')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col gap-3 justify-end">
                    {!f.is_read && (
                      <button 
                        onClick={() => handleMarkAsRead(f.id)}
                        className="p-4 bg-green-50 text-green-600 rounded-2xl hover:bg-green-600 hover:text-white transition-all transform hover:scale-105"
                        title="Mark as read"
                      >
                        <CheckCircle2 size={24} />
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(f.id)}
                      className="p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all transform hover:scale-105"
                      title="Delete"
                    >
                      <Trash2 size={24} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
