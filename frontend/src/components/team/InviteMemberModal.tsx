import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Loader2, UserPlus, Clock, XCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { useTeamStore, TeamInvite } from '../../store/teamStore';
import { useLanguage } from '../../context/LanguageContext';
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
  const { t, language } = useLanguage();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [loading, setLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all');

  const STATUS_CONFIG = {
    pending:  {
      label: language === 'vi' ? 'Chờ chấp nhận' : 'Pending',
      color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: Clock,
    },
    accepted: {
      label: language === 'vi' ? 'Đã chấp nhận' : 'Accepted',
      color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle,
    },
    declined: {
      label: language === 'vi' ? 'Đã từ chối' : 'Declined',
      color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', icon: AlertCircle,
    },
  };

  const FILTER_LABELS = {
    all:      language === 'vi' ? 'Tất cả' : 'All',
    pending:  language === 'vi' ? 'Chờ' : 'Pending',
    accepted: language === 'vi' ? 'Đã nhận' : 'Accepted',
    declined: language === 'vi' ? 'Từ chối' : 'Declined',
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return toast.error(t('team.inviteEmailRequired'));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error(t('team.inviteEmailInvalid'));
    setLoading(true);
    try {
      await inviteMember(teamId, email.trim(), role);
      toast.success(`${t('team.inviteSuccess')} ${email}`);
      setEmail('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('team.inviteFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (inviteId: string) => {
    setCancellingId(inviteId);
    try {
      await cancelInvite(teamId, inviteId);
      toast.success(t('team.cancelInviteSuccess'));
    } catch {
      toast.error(t('team.cancelInviteFailed'));
    } finally {
      setCancellingId(null);
    }
  };

  const filteredInvites = invites.filter(inv =>
    filter === 'all' ||
    (inv as any).status === filter ||
    (!(inv as any).status && filter === 'pending')
  );

  const pendingCount = invites.filter(i =>
    (i as any).status === 'pending' || !(i as any).status
  ).length;

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
                  <h2 className="text-base font-bold text-white">{t('team.inviteTitle')}</h2>
                  {pendingCount > 0 && (
                    <p className="text-xs text-amber-400">
                      {pendingCount} {language === 'vi' ? 'lời mời đang chờ phản hồi' : 'invitations pending'}
                    </p>
                  )}
                </div>
              </div>
              <button onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                <X size={18} />
              </button>
            </div>

            {/* Invite form */}
            <form onSubmit={handleInvite} className="space-y-3 mb-5 flex-shrink-0">
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5">{t('team.inviteEmail')}</label>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 focus-within:border-cyan-500/50 transition-all">
                  <Mail size={14} className="text-slate-500 flex-shrink-0" />
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder={t('team.inviteEmailPlaceholder')}
                    className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5">{t('team.inviteRole')}</label>
                <div className="flex gap-2">
                  {(['member', 'admin'] as const).map(r => (
                    <button key={r} type="button" onClick={() => setRole(r)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all
                        ${role === r
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'}`}>
                      {r === 'member' ? t('team.member') : t('team.admin')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Info box */}
              <div className="flex items-start gap-2 px-3 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <AlertCircle size={13} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-blue-300 text-xs leading-relaxed">
                  {language === 'vi'
                    ? <>Người được mời sẽ nhận thông báo và cần <strong>chấp nhận</strong> lời mời trước khi tham gia team.</>
                    : <>The invitee will receive a notification and must <strong>accept</strong> the invitation before joining.</>
                  }
                </p>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {loading && <Loader2 size={14} className="animate-spin" />}
                {loading
                  ? (language === 'vi' ? 'Đang gửi...' : 'Sending...')
                  : t('team.inviteSend')}
              </button>
            </form>

            {/* Invites list */}
            {invites.length > 0 && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-3 flex-shrink-0">
                  <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    {language === 'vi' ? 'Lịch sử lời mời' : 'Invite history'} ({invites.length})
                  </h3>
                  {/* Filter tabs */}
                  <div className="flex gap-1">
                    {(['all', 'pending', 'accepted', 'declined'] as const).map(f => (
                      <button key={f} onClick={() => setFilter(f)}
                        className={`px-2 py-0.5 rounded-md text-xs transition-all
                          ${filter === f ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                        {FILTER_LABELS[f]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 overflow-y-auto flex-1">
                  {filteredInvites.length === 0 ? (
                    <p className="text-center text-slate-600 text-xs py-4">
                      {language === 'vi' ? 'Không có lời mời nào' : 'No invitations found'}
                    </p>
                  ) : filteredInvites.map(invite => {
                    const status = (invite as any).status || 'pending';
                    const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
                    const StatusIcon = cfg.icon;

                    return (
                      <div key={invite.id}
                        className={`flex items-center gap-3 rounded-xl px-3 py-3 border ${cfg.bg} transition-all`}>
                        <StatusIcon size={16} className={`${cfg.color} flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-200 text-sm font-medium truncate">{invite.email}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-slate-500 text-xs">
                              {invite.role === 'admin' ? t('team.admin') : t('team.member')}
                            </span>
                            <span className="text-slate-700 text-xs">•</span>
                            <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                            <span className="text-slate-700 text-xs">•</span>
                            <span className="text-slate-600 text-xs">
                              {new Date(invite.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
                            </span>
                          </div>
                        </div>
                        {canManage && status === 'pending' && (
                          <button onClick={() => handleCancel(invite.id)}
                            disabled={cancellingId === invite.id}
                            title={t('team.cancelInvite')}
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