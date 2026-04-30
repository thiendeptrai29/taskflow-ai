import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Users, CheckCircle, Clock, AlertTriangle,
  Activity, Settings, Crown, Shield, User, UserPlus,
  Trash2, ChevronDown, Loader2, BarChart2, RefreshCw
} from 'lucide-react';
import { useTeamStore, TeamMember } from '../../store/teamStore';
import { useAuthStore } from '../../store/authStore';
import InviteMemberModal from './InviteMemberModal';
import TeamModal from './TeamModal';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart2 },
  { id: 'members', label: 'Thành viên', icon: Users },
  { id: 'tasks', label: 'Tasks', icon: CheckCircle },
  { id: 'activity', label: 'Hoạt động', icon: Activity },
  { id: 'settings', label: 'Cài đặt', icon: Settings },
];

const roleConfig = {
  owner: { icon: Crown, label: 'Owner', color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/30' },
  admin: { icon: Shield, label: 'Admin', color: 'text-violet-400', bg: 'bg-violet-500/20 border-violet-500/30' },
  member: { icon: User, label: 'Member', color: 'text-cyan-400', bg: 'bg-cyan-500/20 border-cyan-500/30' },
};

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentTeam, loading, error, fetchTeamDetail, updateMemberRole, removeMember, deleteTeam } = useTeamStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [showInvite, setShowInvite] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [roleDropdown, setRoleDropdown] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchTeamDetail(id).catch(() => {});
    }
  }, [id]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="glass rounded-2xl p-5 h-32 flex items-center gap-4">
          <button onClick={() => navigate('/teams')}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all flex-shrink-0">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 space-y-2">
            <div className="h-5 w-48 skeleton rounded-lg" />
            <div className="h-3 w-32 skeleton rounded-lg" />
          </div>
        </div>
        <div className="glass rounded-2xl p-5 h-64 skeleton" />
      </div>
    );
  }

  // Error state
  if (error || !currentTeam) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('/teams')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-all text-sm">
          <ArrowLeft size={16} /> Quay lại Teams
        </button>
        <div className="glass rounded-2xl p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} className="text-rose-400" />
          </div>
          <h3 className="text-white font-semibold mb-2">Không thể tải team</h3>
          <p className="text-slate-500 text-sm mb-5">{error || 'Team không tồn tại hoặc bạn không có quyền truy cập'}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => id && fetchTeamDetail(id).catch(() => {})}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-300 text-sm hover:bg-white/10 transition-all">
              <RefreshCw size={14} /> Thử lại
            </button>
            <button onClick={() => navigate('/teams')}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-violet-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all">
              Về danh sách
            </button>
          </div>
        </div>
      </div>
    );
  }

  const myRole = currentTeam.myRole;
  const isOwner = myRole === 'owner';
  const isAdmin = myRole === 'admin' || isOwner;
  const canManage = isAdmin;

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      await updateMemberRole(id!, memberId, newRole);
      toast.success('Đã cập nhật vai trò');
      setRoleDropdown(null);
    } catch {
      toast.error('Cập nhật thất bại');
    }
  };

  const handleRemove = async (member: TeamMember) => {
    if (!confirm(`Xóa ${member.name} khỏi team?`)) return;
    setRemovingId(member.id);
    try {
      await removeMember(id!, member.id);
      toast.success(`Đã xóa ${member.name}`);
    } catch {
      toast.error('Xóa thành viên thất bại');
    } finally {
      setRemovingId(null);
    }
  };

  const handleDeleteTeam = async () => {
    if (!confirm(`Xóa team "${currentTeam.name}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await deleteTeam(id!);
      toast.success('Đã xóa team');
      navigate('/teams');
    } catch {
      toast.error('Xóa team thất bại');
    }
  };

  const stats = currentTeam.stats;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="glass rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
          style={{ background: currentTeam.color }} />
        <div className="flex items-start justify-between mt-1">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/teams')}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all">
              <ArrowLeft size={18} />
            </button>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-xl flex-shrink-0"
              style={{ background: currentTeam.color }}>
              {currentTeam.avatar
                ? <img src={currentTeam.avatar} className="w-full h-full object-cover rounded-2xl" alt="" />
                : currentTeam.name[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{currentTeam.name}</h1>
              {currentTeam.description && (
                <p className="text-slate-400 text-sm mt-0.5">{currentTeam.description}</p>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                {(() => {
                  const r = roleConfig[myRole];
                  const I = r.icon;
                  return (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${r.bg} ${r.color}`}>
                      <I size={10} /> {r.label}
                    </span>
                  );
                })()}
                <span className="text-slate-600 text-xs">{currentTeam.memberCount} thành viên</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => id && fetchTeamDetail(id).catch(() => {})}
              className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all">
              <RefreshCw size={15} />
            </button>
            {canManage && (
              <button onClick={() => setShowInvite(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-xl text-xs font-medium hover:bg-cyan-500/30 transition-all">
                <UserPlus size={14} /> Mời
              </button>
            )}
            {isOwner && (
              <button onClick={() => setShowEdit(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 text-slate-400 rounded-xl text-xs font-medium hover:text-white hover:bg-white/10 transition-all">
                <Settings size={14} /> Sửa
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap
                ${activeTab === tab.id ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
              <Icon size={13} /> {tab.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {stats ? (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Thành viên', value: stats.totalMembers, icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                      { label: 'Tổng tasks', value: stats.totalTasks, icon: CheckCircle, color: 'text-violet-400', bg: 'bg-violet-500/10' },
                      { label: 'Hoàn thành', value: stats.completedTasks, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                      { label: 'Quá hạn', value: stats.overdueTasks, icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
                    ].map(s => {
                      const Icon = s.icon;
                      return (
                        <div key={s.label} className="glass rounded-2xl p-4">
                          <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                            <Icon size={16} className={s.color} />
                          </div>
                          <p className="text-2xl font-bold text-white">{s.value}</p>
                          <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="glass rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-semibold text-sm">Tiến độ team</h3>
                      <span className="text-cyan-400 font-bold">{stats.progress}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.progress}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"
                      />
                    </div>
                    <p className="text-slate-500 text-xs mt-2">
                      {stats.completedTasks} / {stats.totalTasks} tasks hoàn thành
                    </p>
                  </div>
                </>
              ) : (
                <div className="glass rounded-2xl p-8 text-center">
                  <p className="text-slate-500 text-sm">Chưa có dữ liệu thống kê</p>
                </div>
              )}
            </div>
          )}

          {/* MEMBERS */}
          {activeTab === 'members' && (
            <div className="glass rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                  <Users size={15} className="text-cyan-400" />
                  Thành viên ({currentTeam.members?.length || 0})
                </h3>
                {canManage && (
                  <button onClick={() => setShowInvite(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg text-xs font-medium hover:bg-cyan-500/30 transition-all">
                    <UserPlus size={12} /> Mời thêm
                  </button>
                )}
              </div>
              <div className="divide-y divide-white/5">
                {(currentTeam.members || []).map((member, i) => {
                  const r = roleConfig[member.role];
                  const RoleIcon = r.icon;
                  const isSelf = member.id === user?.id;
                  return (
                    <motion.div key={member.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-white/3 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold overflow-hidden flex-shrink-0">
                          {member.avatar
                            ? <img src={member.avatar} className="w-full h-full object-cover" alt="" />
                            : member.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-slate-200 text-sm font-medium">{member.name}</p>
                            {isSelf && <span className="text-xs text-slate-500">(bạn)</span>}
                          </div>
                          <p className="text-slate-500 text-xs">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${r.bg} ${r.color}`}>
                          <RoleIcon size={10} /> {r.label}
                        </span>
                        {isOwner && !isSelf && member.role !== 'owner' && (
                          <div className="relative">
                            <button onClick={() => setRoleDropdown(roleDropdown === member.id ? null : member.id)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                              <ChevronDown size={12} />
                            </button>
                            {roleDropdown === member.id && (
                              <div className="absolute right-0 top-8 glass rounded-xl p-1 z-20 min-w-32 shadow-xl border border-white/10">
                                {(['admin', 'member'] as const).map(r => (
                                  <button key={r} onClick={() => handleRoleChange(member.id, r)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-white/10 transition-all
                                      ${member.role === r ? 'text-cyan-400' : 'text-slate-300'}`}>
                                    {r === 'admin' ? 'Admin' : 'Thành viên'}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {canManage && !isSelf && member.role !== 'owner' && (
                          <button onClick={() => handleRemove(member)}
                            disabled={removingId === member.id}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                            {removingId === member.id
                              ? <Loader2 size={13} className="animate-spin" />
                              : <Trash2 size={13} />}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                {(!currentTeam.members || currentTeam.members.length === 0) && (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    Chưa có thành viên nào
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TASKS */}
          {activeTab === 'tasks' && (
            <div className="glass rounded-2xl p-8 text-center">
              <CheckCircle size={32} className="mx-auto mb-3 text-slate-600" />
              <p className="text-slate-400 text-sm">Tasks của team sẽ hiển thị ở đây</p>
              <p className="text-slate-600 text-xs mt-1">Tạo task và gán vào team để theo dõi</p>
            </div>
          )}

          {/* ACTIVITY */}
          {activeTab === 'activity' && (
            <div className="glass rounded-2xl p-8 text-center">
              <Activity size={32} className="mx-auto mb-3 text-slate-600" />
              <p className="text-slate-400 text-sm">Lịch sử hoạt động của team</p>
              <p className="text-slate-600 text-xs mt-1">Sắp ra mắt</p>
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === 'settings' && (
            <>
              {isOwner ? (
                <div className="space-y-4">
                  <div className="glass rounded-2xl p-5">
                    <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                      <Settings size={15} className="text-slate-400" /> Cài đặt team
                    </h3>
                    <button onClick={() => setShowEdit(true)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                      <div className="text-left">
                        <p className="text-slate-200 text-sm font-medium">Chỉnh sửa thông tin</p>
                        <p className="text-slate-500 text-xs">Tên, mô tả, màu sắc team</p>
                      </div>
                      <Settings size={15} className="text-slate-500" />
                    </button>
                  </div>
                  <div className="glass rounded-2xl p-5 border border-rose-500/20">
                    <h3 className="text-rose-400 font-semibold text-sm mb-3 flex items-center gap-2">
                      <AlertTriangle size={15} /> Vùng nguy hiểm
                    </h3>
                    <button onClick={handleDeleteTeam}
                      className="w-full flex items-center justify-between px-4 py-3 bg-rose-500/10 rounded-xl border border-rose-500/20 hover:bg-rose-500/20 transition-all">
                      <div className="text-left">
                        <p className="text-rose-400 text-sm font-medium">Xóa team</p>
                        <p className="text-rose-400/60 text-xs">Hành động này không thể hoàn tác</p>
                      </div>
                      <Trash2 size={15} className="text-rose-400" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="glass rounded-2xl p-8 text-center">
                  <Shield size={32} className="mx-auto mb-3 text-slate-600" />
                  <p className="text-slate-400 text-sm">Chỉ Owner mới có quyền truy cập cài đặt</p>
                </div>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <InviteMemberModal
        open={showInvite}
        onClose={() => setShowInvite(false)}
        teamId={id!}
        invites={currentTeam.invites || []}
        canManage={canManage}
      />

      <TeamModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        team={currentTeam}
      />
    </div>
  );
}