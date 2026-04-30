import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Check, X, Loader2, Bell } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface PendingInvite {
  inviteId: string;
  teamId: string;
  teamName: string;
  teamColor: string;
  role: string;
  invitedBy: { name: string; email: string } | null;
  createdAt: string;
}

export default function InviteNotificationBanner() {
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  const fetchInvites = async () => {
    try {
      const res = await api.get('/teams/me/invites');
      setInvites(res.data.invites || []);
      if ((res.data.invites || []).length > 0) setShow(true);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchInvites();
    // Poll mỗi 30 giây
    const interval = setInterval(fetchInvites, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAccept = async (invite: PendingInvite) => {
    setProcessing(invite.inviteId);
    try {
      await api.post(`/teams/${invite.teamId}/invites/${invite.inviteId}/accept`);
      toast.success(`🎉 Bạn đã tham gia team "${invite.teamName}"!`);
      setInvites(prev => prev.filter(i => i.inviteId !== invite.inviteId));
      // Dispatch event để reload teams list nếu đang ở trang teams
      window.dispatchEvent(new Event('team-joined'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setProcessing(null);
    }
  };

  const handleDecline = async (invite: PendingInvite) => {
    setProcessing(invite.inviteId);
    try {
      await api.post(`/teams/${invite.teamId}/invites/${invite.inviteId}/decline`);
      toast.success(`Đã từ chối lời mời vào team "${invite.teamName}"`);
      setInvites(prev => prev.filter(i => i.inviteId !== invite.inviteId));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setProcessing(null);
    }
  };

  if (invites.length === 0) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full"
        >
          {invites.map(invite => (
            <motion.div
              key={invite.inviteId}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className="glass rounded-2xl p-4 border border-cyan-500/20 shadow-xl"
              style={{ borderLeftColor: invite.teamColor, borderLeftWidth: 3 }}
            >
              <div className="flex items-start gap-3">
                {/* Team avatar */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg"
                  style={{ background: invite.teamColor }}>
                  {invite.teamName[0].toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Bell size={12} className="text-cyan-400" />
                    <p className="text-cyan-400 text-xs font-semibold">Lời mời tham gia team</p>
                  </div>
                  <p className="text-white text-sm font-semibold truncate">{invite.teamName}</p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Vai trò: <span className="text-slate-200 font-medium">
                      {invite.role === 'admin' ? 'Admin' : 'Thành viên'}
                    </span>
                    {invite.invitedBy && (
                      <> • Từ <span className="text-slate-300">{invite.invitedBy.name}</span></>
                    )}
                  </p>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleAccept(invite)}
                      disabled={processing === invite.inviteId}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition-all disabled:opacity-60"
                    >
                      {processing === invite.inviteId
                        ? <Loader2 size={12} className="animate-spin" />
                        : <Check size={12} />}
                      Chấp nhận
                    </button>
                    <button
                      onClick={() => handleDecline(invite)}
                      disabled={processing === invite.inviteId}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs font-medium hover:bg-rose-500/20 transition-all disabled:opacity-60"
                    >
                      <X size={12} />
                      Từ chối
                    </button>
                  </div>
                </div>

                {/* Dismiss */}
                <button onClick={() => setInvites(prev => prev.filter(i => i.inviteId !== invite.inviteId))}
                  className="p-1 rounded-lg text-slate-600 hover:text-slate-400 transition-colors flex-shrink-0">
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}