import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Bell, CheckCheck, Trash2, Clock, Sparkles, AlertCircle } from 'lucide-react';
import { notificationAPI } from '../../services/api';
import { Notification } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const typeIcons: Record<string, React.ReactNode> = {
  deadline: <Clock size={14} className="text-amber-400" />,
  'ai-suggestion': <Sparkles size={14} className="text-cyan-400" />,
  system: <AlertCircle size={14} className="text-blue-400" />,
  achievement: <Bell size={14} className="text-emerald-400" />,
  reminder: <Bell size={14} className="text-violet-400" />,
};

export default function NotificationPanel({ onClose }: { onClose: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getAll();
      setNotifications(res.data.notifications);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    await notificationAPI.markRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = async (id: string) => {
    await notificationAPI.delete(id);
    setNotifications(prev => prev.filter(n => n._id !== id));
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-30" />
      <motion.div
        initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }}
        transition={{ type: 'spring', damping: 25 }}
        className="fixed right-0 top-0 bottom-0 w-96 bg-dark-800 border-l border-white/5 z-40 flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-cyan-400" />
            <h3 className="font-semibold text-slate-200 text-sm">Thông báo</h3>
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="px-1.5 py-0.5 bg-rose-500 text-white text-xs rounded-full font-medium">
                {notifications.filter(n => !n.isRead).length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={markAllRead} className="text-slate-500 hover:text-slate-300 text-xs flex items-center gap-1 transition-colors">
              <CheckCheck size={14} /> Đọc tất cả
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-all">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-3 p-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 skeleton rounded-xl" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
              <Bell size={40} className="opacity-30" />
              <p className="text-sm">Không có thông báo nào</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {notifications.map(n => (
                <div key={n._id} className={`glass rounded-xl p-4 relative group transition-all ${!n.isRead ? 'border-l-2 border-l-cyan-500' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{typeIcons[n.type] || <Bell size={14} />}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 text-xs font-semibold">{n.title}</p>
                      <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-slate-600 text-xs mt-1.5">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: vi })}
                      </p>
                    </div>
                    <button onClick={() => deleteNotification(n._id)} className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-all">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
