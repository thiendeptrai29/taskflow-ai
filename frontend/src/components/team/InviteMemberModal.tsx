import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Loader2, UserPlus, Clock, XCircle } from 'lucide-react';
import { useTeamStore, TeamInvite } from '../../store/teamStore';
import toast from 'react-hot-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  teamId: string;
  invites: TeamInvite[];
  canManage: boolean;
}

export default function InviteMemberModal({ open, onClose, teamId, invites, canManage }: Props) {
  const { inviteMember, cancelInvite } = useTeamStore();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [loading, setLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return toast.error('Vui lòng nhập email');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error('Email không hợp lệ');
    setLoading(true);
    try {
      await inviteMember(teamId, email.trim(), role);
      toast.success(`Đã gửi lời mời đến ${email}`);
      setEmail('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gửi lời mời thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (inviteId: string) => {
    setCancellingId(inviteId);
    try {
      await cancelInvite(teamId, inviteId);
      toast.success('Đã hủy lời mời');
    } catch {
      toast.error('Hủy lời mời thất bại');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative w-full max-w-md glass rounded-2xl p-6 z-10 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                  <UserPlus size={17} className="text-cyan-400" />
                </div>
                <h2 className="text-lg font-bold text-white">Mời thành viên</h2>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                <X size={18} />
              </button>
            </div>

            {/* Invite form */}
            <form onSubmit={handleInvite} className="space-y-3 mb-6">
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5">Email</label>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 focus-within:border-cyan-500/50 transition-all">
                  <Mail size={14} className="text-slate-500 flex-shrink-0" />
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 text-sm outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5">Vai trò</label>
                <div className="flex gap-2">
                  {(['member', 'admin'] as const).map(r => (
                    <button key={r} type="button" onClick={() => setRole(r)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all capitalize
                        ${role === r
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'}`}>
                      {r === 'member' ? 'Thành viên' : 'Admin'}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {loading && <Loader2 size={14} className="animate-spin" />}
                Gửi lời mời
              </button>
            </form>

            {/* Pending invites */}
            {invites.length > 0 && (
              <div>
                <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock size={12} /> Lời mời đang chờ ({invites.length})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {invites.map(invite => (
                    <div key={invite.id}
                      className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2.5 border border-white/5">
                      <div>
                        <p className="text-slate-200 text-sm">{invite.email}</p>
                        <p className="text-slate-500 text-xs capitalize">
                          {invite.role === 'admin' ? 'Admin' : 'Thành viên'} •{' '}
                          {new Date(invite.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      {canManage && (
                        <button onClick={() => handleCancel(invite.id)}
                          disabled={cancellingId === invite.id}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                          {cancellingId === invite.id
                            ? <Loader2 size={14} className="animate-spin" />
                            : <XCircle size={14} />}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}