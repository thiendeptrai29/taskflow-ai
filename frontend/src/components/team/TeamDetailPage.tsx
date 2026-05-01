import { useEffect, useState, useRef, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  CheckCircle,
  AlertTriangle,
  Activity,
  Settings,
  Crown,
  Shield,
  User,
  UserPlus,
  Trash2,
  ChevronDown,
  Loader2,
  BarChart2,
  RefreshCw,
  Check,
  Circle,
  Clock,
  Plus,
  Pencil
} from 'lucide-react';
import { useTeamStore, TeamMember } from '../../store/teamStore';
import { useAuthStore } from '../../store/authStore';
import { useLanguage } from '../../context/LanguageContext';
import { teamAPI } from '../../services/api';
import InviteMemberModal from './InviteMemberModal';
import TeamModal from './TeamModal';
import toast from 'react-hot-toast';

type TeamTab = 'overview' | 'members' | 'tasks' | 'activity' | 'settings';
type EditableRole = 'admin' | 'member';
type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';
type TaskPriority = 'low' | 'medium' | 'high';

type TeamTask = {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline?: string;
  assignee?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  } | null;
};

type TeamActivity = {
  _id: string;
  type: string;
  message: string;
  createdAt: string;
  actor?: {
    _id: string;
    name: string;
    avatar?: string;
  };
};

type DropdownOption = {
  value: string;
  label: string;
};

function TaskDropdown({
  value,
  options,
  onChange,
  className = '',
  disabled = false,
}: {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selected = options.find(option => option.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className={`${className}`}>
      <motion.button
        type="button"
        whileHover={!disabled ? { scale: 1.01 } : undefined}
        whileTap={!disabled ? { scale: 0.98 } : undefined}
        disabled={disabled}
        onClick={() => !disabled && setOpen(current => !current)}
        className={`h-[46px] w-full flex items-center justify-between gap-3 rounded-xl px-4 border outline-none transition-all duration-200 ${
          open
            ? 'border-cyan-400/50 ring-2 ring-cyan-500/20 shadow-[0_0_18px_rgba(34,211,238,0.12)]'
            : 'border-white/10'
        } bg-white/[0.04] hover:border-cyan-400/40 disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        <span className="truncate text-sm font-semibold text-slate-100">
          {selected?.label}
        </span>

        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={15} className="text-slate-400" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-white/[0.08] bg-[#111827]/95 p-1.5 shadow-2xl shadow-black/30 backdrop-blur-xl"
          >
            {options.map(option => {
              const active = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
                    active
                      ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/15 text-cyan-300'
                      : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {active && <Check size={14} className="text-cyan-400 flex-shrink-0" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RoleDropdown({
  value,
  disabled,
  loading,
  labels,
  onChange,
}: {
  value: EditableRole;
  disabled?: boolean;
  loading?: boolean;
  labels: { admin: string; member: string };
  onChange: (role: EditableRole) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const roleOptions: { value: EditableRole; label: string; icon: any; color: string }[] = [
    { value: 'admin', label: labels.admin, icon: Crown, color: 'text-violet-400' },
    { value: 'member', label: labels.member, icon: User, color: 'text-cyan-400' },
  ];

  const selected = roleOptions.find(option => option.value === value) || roleOptions[1];
  const SelectedIcon = selected.icon;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="w-[170px] flex-shrink-0">
      <motion.button
        type="button"
        whileHover={!disabled ? { scale: 1.02 } : undefined}
        whileTap={!disabled ? { scale: 0.98 } : undefined}
        disabled={disabled}
        onClick={() => !disabled && setOpen(current => !current)}
        className={`h-9 w-full flex items-center justify-between gap-2 rounded-xl px-3 border outline-none transition-all duration-200 ${
          open
            ? 'border-cyan-400/50 ring-2 ring-cyan-500/20 shadow-[0_0_18px_rgba(34,211,238,0.12)]'
            : 'border-white/10'
        } bg-white/[0.04] hover:border-cyan-400/40 disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
            {loading ? (
              <Loader2 size={13} className="animate-spin text-cyan-400" />
            ) : (
              <SelectedIcon size={13} className={selected.color} />
            )}
          </div>

          <span className="px-2 py-0.5 rounded-lg text-xs font-semibold truncate border bg-gradient-to-r from-cyan-500/15 to-violet-500/15 border-cyan-400/20 text-slate-100">
            {selected.label}
          </span>
        </div>

        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} className="text-slate-400" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            transition={{ duration: 0.18 }}
            className="mt-2 overflow-hidden rounded-xl border border-white/[0.08] bg-[#111827]/95 p-1.5 shadow-2xl shadow-black/30 backdrop-blur-xl"
          >
            {roleOptions.map(option => {
              const active = option.value === value;
              const Icon = option.icon;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
                    active
                      ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/15 text-cyan-300'
                      : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Icon size={13} className={option.color} />
                    <span className="truncate">{option.label}</span>
                  </span>

                  {active && <Check size={14} className="text-cyan-400 flex-shrink-0" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const statusOptions: DropdownOption[] = [
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'in-progress', label: 'Đang làm' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
];

const priorityOptions: DropdownOption[] = [
  { value: 'low', label: 'Ưu tiên thấp' },
  { value: 'medium', label: 'Ưu tiên vừa' },
  { value: 'high', label: 'Ưu tiên cao' },
];

const statusLabel: Record<TaskStatus, string> = {
  pending: 'Chờ xử lý',
  'in-progress': 'Đang làm',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

const priorityLabel: Record<TaskPriority, string> = {
  low: 'Thấp',
  medium: 'Vừa',
  high: 'Cao',
};

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const {
    currentTeam,
    loading,
    error,
    fetchTeamDetail,
    updateMemberRole,
    removeMember,
    deleteTeam,
  } = useTeamStore();

  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TeamTab>('overview');
  const [showInvite, setShowInvite] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  const [teamTasks, setTeamTasks] = useState<TeamTask[]>([]);
  const [activities, setActivities] = useState<TeamActivity[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');

  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskPriority, setEditTaskPriority] = useState<TaskPriority>('medium');
  const [editTaskAssignee, setEditTaskAssignee] = useState('');

  const tabs: { id: TeamTab; label: string; icon: any }[] = [
    { id: 'overview', label: t('team.tabOverview'), icon: BarChart2 },
    { id: 'members', label: t('team.tabMembers'), icon: Users },
    { id: 'tasks', label: t('team.tabTasks'), icon: CheckCircle },
    { id: 'activity', label: t('team.tabActivity'), icon: Activity },
    { id: 'settings', label: t('team.tabSettings'), icon: Settings },
  ];

  const roleConfig = {
    owner: { icon: Crown, label: t('team.owner'), color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/30' },
    admin: { icon: Shield, label: t('team.admin'), color: 'text-violet-400', bg: 'bg-violet-500/20 border-violet-500/30' },
    member: { icon: User, label: t('team.member'), color: 'text-cyan-400', bg: 'bg-cyan-500/20 border-cyan-500/30' },
  };

  const myRole = currentTeam?.myRole;
  const isOwner = myRole === 'owner';
  const isAdmin = myRole === 'admin' || isOwner;
  const canManage = isAdmin;

  const assigneeOptions: DropdownOption[] = [
    { value: '', label: 'Chưa giao' },
    ...((currentTeam?.members || []).map(member => ({
      value: member.id,
      label: member.name,
    }))),
  ];

  const fetchTeamTasks = async () => {
    if (!id) return;

    setTasksLoading(true);
    try {
      const res = await teamAPI.getTasks(id);
      setTeamTasks(res.data.tasks || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tải task của team');
    } finally {
      setTasksLoading(false);
    }
  };

  const fetchActivities = async () => {
    if (!id) return;

    setActivityLoading(true);
    try {
      const res = await teamAPI.getActivities(id);
      setActivities(res.data.activities || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tải hoạt động');
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchTeamDetail(id).catch(() => {});
  }, [id, fetchTeamDetail]);

  useEffect(() => {
    if (activeTab === 'tasks') fetchTeamTasks();
    if (activeTab === 'activity') fetchActivities();
  }, [activeTab, id]);

  const handleRoleChange = async (memberId: string, newRole: EditableRole) => {
    setUpdatingRoleId(memberId);

    try {
      await updateMemberRole(id!, memberId, newRole);
      toast.success(t('team.roleUpdated'));
    } catch {
      toast.error(t('team.roleUpdateFailed'));
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleRemove = async (member: TeamMember) => {
    if (!confirm(`${t('team.removeConfirm')} ${member.name}?`)) return;

    setRemovingId(member.id);

    try {
      await removeMember(id!, member.id);
      toast.success(`${t('team.removeSuccess')} ${member.name}`);
    } catch {
      toast.error(t('team.removeFailed'));
    } finally {
      setRemovingId(null);
    }
  };

  const handleDeleteTeam = async () => {
    if (!currentTeam) return;
    if (!confirm(`${t('team.deleteConfirm')} "${currentTeam.name}"? ${t('team.deleteTeamDesc')}`)) return;

    try {
      await deleteTeam(id!);
      toast.success(t('team.deleteSuccess'));
      navigate('/teams');
    } catch {
      toast.error(t('team.deleteFailed'));
    }
  };

  const handleCreateTeamTask = async (e: FormEvent) => {
    e.preventDefault();

    if (!canManage) {
      toast.error('Chỉ Owner hoặc Admin mới được thêm task');
      return;
    }

    if (!newTaskTitle.trim()) {
      toast.error('Nhập tiêu đề task');
      return;
    }

    setCreatingTask(true);

    try {
      await teamAPI.createTask(id!, {
        title: newTaskTitle.trim(),
        priority: newTaskPriority,
        assignee: newTaskAssignee || null,
      });

      toast.success('Đã tạo task');
      setNewTaskTitle('');
      setNewTaskPriority('medium');
      setNewTaskAssignee('');
      fetchTeamTasks();
      fetchTeamDetail(id!).catch(() => {});
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tạo task');
    } finally {
      setCreatingTask(false);
    }
  };

  const handleStatusChange = async (task: TeamTask, status: string) => {
    setUpdatingTaskId(task._id);

    try {
      await teamAPI.updateTask(id!, task._id, { status });
      toast.success('Đã cập nhật tiến độ');
      fetchTeamTasks();
      fetchTeamDetail(id!).catch(() => {});
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật tiến độ');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const startEditTask = (task: TeamTask) => {
    setEditingTaskId(task._id);
    setEditTaskTitle(task.title);
    setEditTaskPriority(task.priority);
    setEditTaskAssignee(task.assignee?._id || '');
  };

  const cancelEditTask = () => {
    setEditingTaskId(null);
    setEditTaskTitle('');
    setEditTaskPriority('medium');
    setEditTaskAssignee('');
  };

  const handleUpdateTask = async (task: TeamTask) => {
    if (!canManage) {
      toast.error('Chỉ Owner hoặc Admin mới được sửa task');
      return;
    }

    if (!editTaskTitle.trim()) {
      toast.error('Nhập tiêu đề task');
      return;
    }

    setUpdatingTaskId(task._id);

    try {
      await teamAPI.updateTask(id!, task._id, {
        title: editTaskTitle.trim(),
        priority: editTaskPriority,
        assignee: editTaskAssignee || null,
      });

      toast.success('Đã cập nhật task');
      cancelEditTask();
      fetchTeamTasks();
      fetchTeamDetail(id!).catch(() => {});
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật task');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleDeleteTask = async (task: TeamTask) => {
    if (!canManage) {
      toast.error('Chỉ Owner hoặc Admin mới được xóa task');
      return;
    }

    if (!confirm(`Xóa task "${task.title}"?`)) return;

    setDeletingTaskId(task._id);

    try {
      await teamAPI.deleteTask(id!, task._id);
      toast.success('Đã xóa task');
      fetchTeamTasks();
      fetchTeamDetail(id!).catch(() => {});
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể xóa task');
    } finally {
      setDeletingTaskId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="glass rounded-2xl p-5 h-32 flex items-center gap-4">
          <button
            onClick={() => navigate('/teams')}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all flex-shrink-0"
          >
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

  if (error || !currentTeam) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/teams')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-all text-sm"
        >
          <ArrowLeft size={16} /> {t('team.backToTeams')}
        </button>

        <div className="glass rounded-2xl p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} className="text-rose-400" />
          </div>
          <h3 className="text-white font-semibold mb-2">{t('team.cannotLoad')}</h3>
          <p className="text-slate-500 text-sm mb-5">
            {error || t('team.cannotLoadDesc')}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => id && fetchTeamDetail(id).catch(() => {})}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-300 text-sm hover:bg-white/10 transition-all"
            >
              <RefreshCw size={14} /> {t('team.retry')}
            </button>
            <button
              onClick={() => navigate('/teams')}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-violet-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all"
            >
              {t('team.backToList')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = currentTeam.stats;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="glass rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: currentTeam.color }} />

        <div className="flex items-start justify-between mt-1">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/teams')}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all"
            >
              <ArrowLeft size={18} />
            </button>

            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-xl flex-shrink-0 overflow-hidden"
              style={{ background: currentTeam.color }}
            >
              {currentTeam.avatar ? (
                <img src={currentTeam.avatar} className="w-full h-full object-cover" alt="" />
              ) : (
                currentTeam.name[0].toUpperCase()
              )}
            </div>

            <div>
              <h1 className="text-xl font-bold text-white">{currentTeam.name}</h1>

              {currentTeam.description && (
                <p className="text-slate-400 text-sm mt-0.5">{currentTeam.description}</p>
              )}

              <div className="flex items-center gap-2 mt-1.5">
                {(() => {
                  const currentRole = roleConfig[myRole as keyof typeof roleConfig];
                  const Icon = currentRole.icon;

                  return (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${currentRole.bg} ${currentRole.color}`}>
                      <Icon size={10} /> {currentRole.label}
                    </span>
                  );
                })()}

                <span className="text-slate-600 text-xs">
                  {currentTeam.memberCount} {t('team.memberCount')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => id && fetchTeamDetail(id).catch(() => {})}
              className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <RefreshCw size={15} />
            </button>

            {canManage && (
              <button
                onClick={() => setShowInvite(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-xl text-xs font-medium hover:bg-cyan-500/30 transition-all"
              >
                <UserPlus size={14} /> {t('team.invite')}
              </button>
            )}

            {isOwner && (
              <button
                onClick={() => setShowEdit(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 text-slate-400 rounded-xl text-xs font-medium hover:text-white hover:bg-white/10 transition-all"
              >
                <Settings size={14} /> {t('team.edit')}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon size={13} /> {tab.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {stats ? (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: t('team.totalMembers'), value: stats.totalMembers, icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                      { label: t('team.totalTasks'), value: stats.totalTasks, icon: CheckCircle, color: 'text-violet-400', bg: 'bg-violet-500/10' },
                      { label: t('team.completed'), value: stats.completedTasks, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                      { label: t('team.overdue'), value: stats.overdueTasks, icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
                    ].map(item => {
                      const Icon = item.icon;

                      return (
                        <div key={item.label} className="glass rounded-2xl p-4">
                          <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center mb-3`}>
                            <Icon size={16} className={item.color} />
                          </div>
                          <p className="text-2xl font-bold text-white">{item.value}</p>
                          <p className="text-slate-500 text-xs mt-0.5">{item.label}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="glass rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-semibold text-sm">{t('team.progress')}</h3>
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
                      {stats.completedTasks} / {stats.totalTasks} {t('team.tasksCompleted')}
                    </p>
                  </div>
                </>
              ) : (
                <div className="glass rounded-2xl p-8 text-center">
                  <p className="text-slate-500 text-sm">{t('team.noStats')}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'members' && (
            <div className="glass rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                  <Users size={15} className="text-cyan-400" />
                  {t('team.tabMembers')} ({currentTeam.members?.length || 0})
                </h3>

                {canManage && (
                  <button
                    onClick={() => setShowInvite(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg text-xs font-medium hover:bg-cyan-500/30 transition-all"
                  >
                    <UserPlus size={12} /> {t('team.inviteMore')}
                  </button>
                )}
              </div>

              <div className="divide-y divide-white/5">
                {(currentTeam.members || []).map((member, index) => {
                  const role = roleConfig[member.role as keyof typeof roleConfig];
                  const RoleIcon = role.icon;
                  const isSelf = member.id === user?.id;
                  const editableRole: EditableRole = member.role === 'admin' ? 'admin' : 'member';

                  return (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="flex items-start gap-3 px-5 py-3.5 hover:bg-white/3 transition-all"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold overflow-hidden flex-shrink-0 mt-1">
                        {member.avatar ? (
                          <img src={member.avatar} className="w-full h-full object-cover" alt="" />
                        ) : (
                          member.name[0].toUpperCase()
                        )}
                      </div>

                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center gap-2">
                          <p className="text-slate-200 text-sm font-medium truncate">{member.name}</p>
                          {isSelf && <span className="text-xs text-slate-500 flex-shrink-0">({t('team.you')})</span>}
                        </div>
                        <p className="text-slate-500 text-xs truncate">{member.email}</p>
                      </div>

                      <div className="flex items-start gap-2 flex-shrink-0">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap mt-1 ${role.bg} ${role.color}`}>
                          <RoleIcon size={10} /> {role.label}
                        </span>

                        {isOwner && !isSelf && member.role !== 'owner' && (
                          <RoleDropdown
                            value={editableRole}
                            labels={{ admin: t('team.admin'), member: t('team.member') }}
                            disabled={updatingRoleId === member.id}
                            loading={updatingRoleId === member.id}
                            onChange={newRole => handleRoleChange(member.id, newRole)}
                          />
                        )}

                        {canManage && !isSelf && member.role !== 'owner' && (
                          <button
                            onClick={() => handleRemove(member)}
                            disabled={removingId === member.id}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all mt-1"
                            title={t('team.removeMember')}
                          >
                            {removingId === member.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Trash2 size={13} />
                            )}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}

                {(!currentTeam.members || currentTeam.members.length === 0) && (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    {t('team.noMembers')}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-4">
              {canManage ? (
                <form onSubmit={handleCreateTeamTask} className="glass rounded-2xl p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_170px_220px_auto] gap-3 items-start">
                    <input
                      value={newTaskTitle}
                      onChange={e => setNewTaskTitle(e.target.value)}
                      placeholder="Nhập task mới cho team..."
                      className="h-[46px] w-full bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400/50"
                    />

                    <TaskDropdown
                      value={newTaskPriority}
                      onChange={value => setNewTaskPriority(value as TaskPriority)}
                      className="w-full"
                      options={priorityOptions}
                    />

                    <TaskDropdown
                      value={newTaskAssignee}
                      onChange={setNewTaskAssignee}
                      className="w-full"
                      options={assigneeOptions}
                    />

                    <button
                      type="submit"
                      disabled={creatingTask}
                      className="h-[46px] flex items-center justify-center gap-2 px-5 bg-gradient-to-r from-cyan-500 to-violet-500 text-white rounded-xl text-sm font-medium disabled:opacity-60 whitespace-nowrap"
                    >
                      {creatingTask ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                      Tạo task
                    </button>
                  </div>
                </form>
              ) : (
                <div className="glass rounded-2xl p-4 border border-cyan-500/10">
                  <p className="text-slate-400 text-sm">
                    Thành viên chỉ có thể cập nhật tiến độ task được giao trong team.
                  </p>
                </div>
              )}

              <div className="glass rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                    <CheckCircle size={15} className="text-cyan-400" />
                    Tasks ({teamTasks.length})
                  </h3>

                  <button
                    onClick={fetchTeamTasks}
                    className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <RefreshCw size={14} className={tasksLoading ? 'animate-spin' : ''} />
                  </button>
                </div>

                {tasksLoading ? (
                  <div className="p-8 text-center text-slate-500 text-sm">Đang tải tasks...</div>
                ) : teamTasks.length === 0 ? (
                  <div className="p-8 text-center">
                    <CheckCircle size={32} className="mx-auto mb-3 text-slate-600" />
                    <p className="text-slate-400 text-sm">Chưa có task trong team</p>
                    <p className="text-slate-600 text-xs mt-1">
                      {canManage ? 'Tạo task mới để giao việc cho thành viên' : 'Owner hoặc Admin sẽ tạo task cho team'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {teamTasks.map(task => {
                      const editing = editingTaskId === task._id;
                      const isAssignedToMe = task.assignee?._id === user?.id;
                      const canUpdateProgress = canManage || isAssignedToMe;


                      return (
                        <div key={task._id} className="p-4 hover:bg-white/[0.03] transition-all">
                          {editing ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_170px_220px_auto_auto] gap-3 items-start">
                                <input
                                  value={editTaskTitle}
                                  onChange={e => setEditTaskTitle(e.target.value)}
                                  className="h-[46px] w-full bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400/50"
                                />

                                <TaskDropdown
                                  value={editTaskPriority}
                                  onChange={value => setEditTaskPriority(value as TaskPriority)}
                                  className="w-full"
                                  options={priorityOptions}
                                />

                                <TaskDropdown
                                  value={editTaskAssignee}
                                  onChange={setEditTaskAssignee}
                                  className="w-full"
                                  options={assigneeOptions}
                                />

                                <button
                                  type="button"
                                  onClick={() => handleUpdateTask(task)}
                                  disabled={updatingTaskId === task._id}
                                  className="h-[46px] px-4 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-sm font-medium hover:bg-cyan-500/30 disabled:opacity-60"
                                >
                                  {updatingTaskId === task._id ? 'Đang lưu...' : 'Lưu'}
                                </button>

                                <button
                                  type="button"
                                  onClick={cancelEditTask}
                                  className="h-[46px] px-4 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/10"
                                >
                                  Hủy
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  {task.status === 'completed' ? (
                                    <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
                                  ) : (
                                    <Circle size={16} className="text-slate-500 flex-shrink-0" />
                                  )}

                                  <p className="text-slate-200 text-sm font-medium truncate">{task.title}</p>
                                </div>

                                {task.description && (
                                  <p className="text-slate-500 text-xs mt-1 line-clamp-2">{task.description}</p>
                                )}

                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                  <span className="px-2 py-1 rounded-lg bg-white/5 text-slate-400 text-xs">
                                    {statusLabel[task.status]}
                                  </span>

                                  <span
                                    className={`px-2 py-1 rounded-lg text-xs ${
                                      task.priority === 'high'
                                        ? 'bg-rose-500/10 text-rose-400'
                                        : task.priority === 'medium'
                                          ? 'bg-amber-500/10 text-amber-400'
                                          : 'bg-emerald-500/10 text-emerald-400'
                                    }`}
                                  >
                                    {priorityLabel[task.priority]}
                                  </span>

                                  {task.deadline && (
                                    <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-slate-500 text-xs">
                                      <Clock size={12} />
                                      {new Date(task.deadline).toLocaleDateString('vi-VN')}
                                    </span>
                                  )}

                                  {task.assignee && (
                                    <span className="px-2 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 text-xs">
                                      Giao cho: {task.assignee.name}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-wrap items-start gap-2 shrink-0">
                                {canUpdateProgress && (
                                <TaskDropdown
                                 value={task.status}
                                 onChange={value => handleStatusChange(task, value)}
                                  className="w-[160px]"
                                  options={statusOptions}
                                    disabled={updatingTaskId === task._id}
                                  />
                                )}


                                {canManage && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => startEditTask(task)}
                                      className="h-[46px] w-[46px] rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 hover:text-cyan-300 hover:border-cyan-400/40 transition-all flex items-center justify-center"
                                      title="Sửa task"
                                    >
                                      <Pencil size={15} />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteTask(task)}
                                      disabled={deletingTaskId === task._id}
                                      className="h-[46px] w-[46px] rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-all flex items-center justify-center disabled:opacity-60"
                                      title="Xóa task"
                                    >
                                      {deletingTaskId === task._id ? (
                                        <Loader2 size={15} className="animate-spin" />
                                      ) : (
                                        <Trash2 size={15} />
                                      )}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="glass rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                  <Activity size={15} className="text-cyan-400" />
                  Lịch sử hoạt động
                </h3>

                <button
                  onClick={fetchActivities}
                  className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  <RefreshCw size={14} className={activityLoading ? 'animate-spin' : ''} />
                </button>
              </div>

              {activityLoading ? (
                <div className="p-8 text-center text-slate-500 text-sm">Đang tải hoạt động...</div>
              ) : activities.length === 0 ? (
                <div className="p-8 text-center">
                  <Activity size={32} className="mx-auto mb-3 text-slate-600" />
                  <p className="text-slate-400 text-sm">Chưa có hoạt động</p>
                  <p className="text-slate-600 text-xs mt-1">Các thay đổi của team sẽ hiển thị ở đây</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {activities.map(item => (
                    <div key={item._id} className="p-4 flex gap-3 hover:bg-white/[0.03] transition-all">
                      <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                        <Activity size={15} className="text-cyan-400" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-slate-200 text-sm">{item.message}</p>
                        <p className="text-slate-500 text-xs mt-1">
                          {item.actor?.name || 'Hệ thống'} • {new Date(item.createdAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <>
              {isOwner ? (
                <div className="space-y-4">
                  <div className="glass rounded-2xl p-5">
                    <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                      <Settings size={15} className="text-slate-400" /> {t('team.teamSettings')}
                    </h3>

                    <button
                      onClick={() => setShowEdit(true)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all"
                    >
                      <div className="text-left">
                        <p className="text-slate-200 text-sm font-medium">{t('team.editInfo')}</p>
                        <p className="text-slate-500 text-xs">{t('team.editInfoDesc')}</p>
                      </div>
                      <Settings size={15} className="text-slate-500" />
                    </button>
                  </div>

                  <div className="glass rounded-2xl p-5 border border-rose-500/20">
                    <h3 className="text-rose-400 font-semibold text-sm mb-3 flex items-center gap-2">
                      <AlertTriangle size={15} /> {t('team.dangerZone')}
                    </h3>

                    <button
                      onClick={handleDeleteTeam}
                      className="w-full flex items-center justify-between px-4 py-3 bg-rose-500/10 rounded-xl border border-rose-500/20 hover:bg-rose-500/20 transition-all"
                    >
                      <div className="text-left">
                        <p className="text-rose-400 text-sm font-medium">{t('team.deleteTeam')}</p>
                        <p className="text-rose-400/60 text-xs">{t('team.deleteTeamDesc')}</p>
                      </div>
                      <Trash2 size={15} className="text-rose-400" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="glass rounded-2xl p-8 text-center">
                  <Shield size={32} className="mx-auto mb-3 text-slate-600" />
                  <p className="text-slate-400 text-sm">{t('team.ownerOnly')}</p>
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
