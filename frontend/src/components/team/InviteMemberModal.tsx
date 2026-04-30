import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Loader2, UserPlus, Clock, XCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { useTeamStore, TeamInvite } from '../../store/teamStore';
import toast from 'react-hot-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  teamId: string;
  invites: TeamInvite[];
  canManage: boolean;
}

const STATUS_CONFIG = {
  pending:  { label: 'Chờ chấp nhận', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: Clock },
  accepted: { label: 'Đã chấp nhận',  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle },
  declined: { label: 'Đã từ chối',    color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', icon: AlertCircle },
};

export default function InviteMemberModal({ open, onClose, teamId, invites, canManage }: Props) {
  const { inviteMember, cancelInvite } = useTeamStore();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [loading, setLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return toast.error('Vui lòng nhập email');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error('Email không hợp lệ');
    setLoading(true);
    try {
      await inviteMember(teamId, email.trim(), role);
      toast.success(`Đã gửi lời mời đến ${email}. Họ cần chấp nhận để vào team.`);
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

  const filteredInvites = invites.filter(inv =>
    filter === 'all' || (inv as any).status === filter || (!( inv as any).status && filter === 'pending')
  );

  const pendingCount = invites.filter(i => (i as any).status === 'pending' || !(i as any).status).length;

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
            className="relative w-full max-w-lg glass rounded-2xl p-6 z-10 shadow-2xl max-h-[85vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                  <UserPlus size={17} className="text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Mời thành viên</h2>
                  {pendingCount > 0 && (
                    <p className="text-xs text-amber-400">{pendingCount} lời mời đang chờ phản hồi</p>
                  )}
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                <X size={18} />
              </button>
            </div>

            {/* Invite form */}
            <form onSubmit={handleInvite} className="space-y-3 mb-5 flex-shrink-0">
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5">Email người được mời</label>
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
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all
                        ${role === r
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'}`}>
                      {r === 'member' ? 'Thành viên' : 'Admin'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Info box */}
              <div className="flex items-start gap-2 px-3 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <AlertCircle size={13} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-blue-300 text-xs leading-relaxed">
                  Người được mời sẽ nhận thông báo và cần <strong>chấp nhận</strong> lời mời trước khi tham gia team.
                </p>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {loading && <Loader2 size={14} className="animate-spin" />}
                {loading ? 'Đang gửi...' : 'Gửi lời mời'}
              </button>
            </form>

            {/* Invites list */}
            {invites.length > 0 && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-3 flex-shrink-0">
                  <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    Lịch sử lời mời ({invites.length})
                  </h3>
                  {/* Filter tabs */}
                  <div className="flex gap-1">
                    {(['all', 'pending', 'accepted', 'declined'] as const).map(f => (
                      <button key={f} onClick={() => setFilter(f)}
                        className={`px-2 py-0.5 rounded-md text-xs transition-all ${filter === f ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                        {f === 'all' ? 'Tất cả' : f === 'pending' ? 'Chờ' : f === 'accepted' ? 'Đã nhận' : 'Từ chối'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 overflow-y-auto flex-1">
                  {filteredInvites.length === 0 ? (
                    <p className="text-center text-slate-600 text-xs py-4">Không có lời mời nào</p>
                  ) : filteredInvites.map(invite => {
                    const status = (invite as any).status || 'pending';
                    const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
                    const StatusIcon = cfg.icon;

                    return (
                      <div key={invite.id}
                        className={`flex items-center gap-3 rounded-xl px-3 py-3 border ${cfg.bg} transition-all`}>
                        {/* Status icon */}
                        <StatusIcon size={16} className={`${cfg.color} flex-shrink-0`} />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-200 text-sm font-medium truncate">{invite.email}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-slate-500 text-xs">
                              {invite.role === 'admin' ? 'Admin' : 'Thành viên'}
                            </span>
                            <span className="text-slate-700 text-xs">•</span>
                            <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                            <span className="text-slate-700 text-xs">•</span>
                            <span className="text-slate-600 text-xs">
                              {new Date(invite.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </div>

                        {/* Cancel button — chỉ pending mới có */}
                        {canManage && status === 'pending' && (
                          <button onClick={() => handleCancel(invite.id)}
                            disabled={cancellingId === invite.id}
                            title="Hủy lời mời"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all flex-shrink-0">
                            {cancellingId === invite.id
                              ? <Loader2 size={14} className="animate-spin" />
                              : <XCircle size={14} />}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}