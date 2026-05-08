import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
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
  ChevronLeft,
  ChevronRight,
  Loader2,
  BarChart2,
  RefreshCw,
  Check,
  Circle,
  Clock,
  Plus,
  Pencil,
  Search,
  ListTodo,
  AlignLeft,
  CalendarDays,
  X,
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

const statusOptions: DropdownOption[] = [
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'in-progress', label: 'Đang làm' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
];

const priorityOptions: DropdownOption[] = [
  { value: 'low', label: '🟢 Ưu tiên thấp' },
  { value: 'medium', label: '🟡 Ưu tiên vừa' },
  { value: 'high', label: '🔴 Ưu tiên cao' },
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
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selected = options.find(option => option.value === value) || options[0];

  const updateMenuPosition = () => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const gap = 8;
    const maxHeight = 208;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const openUp = spaceBelow < 150 && spaceAbove > spaceBelow;

    setMenuStyle({
      position: 'fixed',
      left: rect.left,
      top: openUp ? undefined : rect.bottom + gap,
      bottom: openUp ? window.innerHeight - rect.top + gap : undefined,
      width: rect.width,
      maxHeight: Math.max(120, Math.min(maxHeight, openUp ? spaceAbove : spaceBelow)),
      zIndex: 10000,
    });
  };

  useLayoutEffect(() => {
    if (open) updateMenuPosition();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (wrapperRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className={className}>
      <motion.button
        ref={buttonRef}
        type="button"
        whileTap={!disabled ? { scale: 0.98 } : undefined}
        disabled={disabled}
        onClick={() => !disabled && setOpen(current => !current)}
        className={`h-10 md:h-11 w-full flex items-center justify-between gap-3 rounded-xl px-3 md:px-4 border outline-none transition-all duration-200 text-xs md:text-sm bg-white/[0.04] hover:border-cyan-400/40 disabled:opacity-60 disabled:cursor-not-allowed ${
          open
            ? 'border-cyan-400/50 ring-2 ring-cyan-500/20 shadow-[0_0_18px_rgba(34,211,238,0.12)]'
            : 'border-white/10'
        }`}
      >
        <span className="truncate font-semibold text-slate-100">{selected?.label}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} className="text-slate-400 flex-shrink-0" />
        </motion.div>
      </motion.button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, y: -6, scaleY: 0.96 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -6, scaleY: 0.96 }}
              transition={{ duration: 0.15 }}
              style={menuStyle}
              className="origin-top overflow-y-auto rounded-xl border border-white/[0.08] bg-[#111827]/95 p-1.5 shadow-2xl shadow-black/40 backdrop-blur-xl"
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
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-left text-xs md:text-sm transition-all ${
                      active
                        ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/15 text-cyan-300'
                        : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {active && <Check size={13} className="text-cyan-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
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
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
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
const sameDay = (a: Date | null, b: Date) =>
  !!a &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const formatDeadline = (date: Date | null) => {
  if (!date) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

function WheelColumn({
  items,
  value,
  onChange,
  suffix,
}: {
  items: string[];
  value: string;
  onChange: (value: string) => void;
  suffix: string;
}) {
  const itemHeight = 44;
  const wheelHeight = 220;
  const spacerHeight = (wheelHeight - itemHeight) / 2;
  const ref = useRef<HTMLDivElement>(null);
  const settleRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, items.indexOf(value)));

  const scrollToIndex = (index: number, behavior: ScrollBehavior = 'auto') => {
    ref.current?.scrollTo({ top: index * itemHeight, behavior });
  };

  useLayoutEffect(() => {
    const index = Math.max(0, items.indexOf(value));
    setActiveIndex(index);
    scrollToIndex(index);
  }, [value, items]);

  const nearestIndex = () => {
    const el = ref.current;
    if (!el) return 0;
    return Math.max(0, Math.min(items.length - 1, Math.round(el.scrollTop / itemHeight)));
  };

  const handleScroll = () => {
    const index = nearestIndex();
    setActiveIndex(index);

    if (settleRef.current) window.clearTimeout(settleRef.current);
    settleRef.current = window.setTimeout(() => {
      const nextIndex = nearestIndex();
      scrollToIndex(nextIndex, 'smooth');
      onChange(items[nextIndex]);
    }, 140);
  };

  return (
    <div className="relative flex-1 overflow-hidden rounded-2xl border border-slate-600/80 bg-[#050b18]">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-16 bg-gradient-to-b from-[#050b18] via-[#050b18]/95 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-16 bg-gradient-to-t from-[#050b18] via-[#050b18]/95 to-transparent" />
      <div className="pointer-events-none absolute left-2 right-2 top-1/2 z-10 h-11 -translate-y-1/2 rounded-xl border border-cyan-300/60 bg-cyan-400/18 shadow-[0_0_24px_rgba(34,211,238,0.22)]" />

      <div
        ref={ref}
        onScroll={handleScroll}
        className="overflow-y-auto overscroll-contain touch-pan-y [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          height: wheelHeight,
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'y mandatory',
          willChange: 'scroll-position',
        }}
      >
        <div style={{ height: spacerHeight }} />

        {items.map((item, index) => {
          const active = index === activeIndex;

          return (
            <button
              key={item}
              type="button"
              onClick={() => {
                setActiveIndex(index);
                scrollToIndex(index, 'smooth');
                onChange(item);
              }}
              className={`h-[44px] w-full flex items-center justify-center gap-1.5 transition-colors duration-100 ${
                active ? 'text-white font-extrabold' : 'text-slate-500 font-bold'
              }`}
              style={{
                scrollSnapAlign: 'center',
                fontSize: active ? 20 : 15,
                lineHeight: '44px',
              }}
            >
              <span className="tabular-nums">{item}</span>
              <span className={`text-[11px] font-bold ${active ? 'text-cyan-200 opacity-100' : 'opacity-0'}`}>
                {suffix}
              </span>
            </button>
          );
        })}

        <div style={{ height: spacerHeight }} />
      </div>
    </div>
  );
}

function DeadlinePicker({
  value,
  onChange,
  placeholder,
}: {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [draftDate, setDraftDate] = useState<Date>(() => value || new Date());
  const [viewDate, setViewDate] = useState<Date>(() => value || new Date());
  const [draftHour, setDraftHour] = useState(() => String((value || new Date()).getHours()).padStart(2, '0'));
  const [draftMinute, setDraftMinute] = useState(() => String((value || new Date()).getMinutes()).padStart(2, '0'));
  const panelRef = useRef<HTMLDivElement>(null);

  const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));

  const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const offset = start.getDay();
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();

  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - offset + 1;
    return day > 0 && day <= daysInMonth
      ? new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
      : null;
  });

  const draftValue = new Date(draftDate);
  draftValue.setHours(Number(draftHour), Number(draftMinute), 0, 0);

  useEffect(() => {
    if (!open) return;

    const base = value || new Date();
    setDraftDate(base);
    setViewDate(base);
    setDraftHour(String(base.getHours()).padStart(2, '0'));
    setDraftMinute(String(base.getMinutes()).padStart(2, '0'));
  }, [open, value]);

  useEffect(() => {
    if (!open) return;

    const handleDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target)) setOpen(false);
    };

    document.addEventListener('mousedown', handleDown);
    return () => document.removeEventListener('mousedown', handleDown);
  }, [open]);

  const applyDeadline = () => {
    const next = new Date(draftDate);
    next.setHours(Number(draftHour), Number(draftMinute), 0, 0);
    onChange(next);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`h-10 md:h-11 w-full flex items-center justify-between gap-3 rounded-xl px-3 md:px-4 border bg-white/[0.04] text-left text-xs md:text-sm transition-all ${
          open
            ? 'border-cyan-400/50 ring-2 ring-cyan-500/20 shadow-[0_0_18px_rgba(34,211,238,0.12)]'
            : 'border-white/10 hover:border-cyan-400/40'
        }`}
      >
        <span className={value ? 'font-semibold text-slate-100' : 'text-slate-500'}>
          {value ? formatDeadline(value) : placeholder}
        </span>
        <CalendarDays size={15} className="text-slate-400 flex-shrink-0" />
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center px-3 py-3 bg-black/75 backdrop-blur-[4px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                ref={panelRef}
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="w-full max-w-[400px] max-h-[calc(100dvh-24px)] overflow-hidden rounded-3xl border border-slate-600/80 bg-slate-900 shadow-2xl shadow-black/70"
              >
                <div className="px-4 pt-4 pb-3 border-b border-slate-700/80">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-extrabold text-white">Chọn deadline</p>
                      <p className="text-[12px] font-medium text-slate-300">{formatDeadline(draftValue)}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { label: 'Hôm nay', days: 0 },
                      { label: 'Ngày mai', days: 1 },
                      { label: 'Tuần sau', days: 7 },
                    ].map(item => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => {
                          const next = new Date();
                          next.setDate(next.getDate() + item.days);
                          setDraftDate(next);
                          setViewDate(next);
                        }}
                        className="h-10 rounded-xl border border-slate-600 bg-slate-800 text-[12px] font-extrabold text-slate-100 hover:border-cyan-300/60 hover:bg-cyan-400/12 hover:text-cyan-100 transition-all"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-slate-600/80 bg-[#050b18] p-3 shadow-inner shadow-black/30">
                    <div className="flex items-center justify-between mb-3">
                      <button
                        type="button"
                        onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                        className="p-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-white/10"
                      >
                        <ChevronLeft size={18} />
                      </button>

                      <p className="text-sm font-extrabold text-white capitalize">
                        {new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(viewDate)}
                      </p>

                      <button
                        type="button"
                        onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                        className="p-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-white/10"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-extrabold text-slate-300 mb-2">
                      {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
                        <span key={day}>{day}</span>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1.5">
                      {cells.map((date, index) => {
                        const active = date && sameDay(draftDate, date);
                        const today = date && sameDay(new Date(), date);

                        return (
                          <button
                            key={index}
                            type="button"
                            disabled={!date}
                            onClick={() => date && (setDraftDate(date), setViewDate(date))}
                            className={`h-9 rounded-xl text-sm font-extrabold transition-all disabled:opacity-0 ${
                              active
                                ? 'bg-gradient-to-r from-cyan-400 to-violet-500 text-white shadow-lg shadow-cyan-500/25'
                                : today
                                  ? 'bg-cyan-400/15 text-cyan-100 ring-1 ring-cyan-300/40'
                                  : 'text-slate-100 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {date?.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="px-4 pt-3 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-extrabold text-white">Chọn giờ</p>
                      <p className="text-[12px] font-medium text-slate-300">Lướt để chọn giờ nhắc</p>
                    </div>

                    {value && (
                      <button
                        type="button"
                        onClick={() => {
                          onChange(null);
                          setOpen(false);
                        }}
                        className="text-xs font-extrabold text-slate-300 hover:text-rose-300"
                      >
                        Xóa
                      </button>
                    )}
                  </div>

                  <div className="rounded-3xl bg-[#07101f] p-3 border border-slate-600/80">
                    <div className="flex gap-2">
                      <WheelColumn items={hours} value={draftHour} suffix="giờ" onChange={setDraftHour} />
                      <WheelColumn items={minutes} value={draftMinute} suffix="phút" onChange={setDraftMinute} />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={applyDeadline}
                    className="mt-3 h-11 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white text-xs font-extrabold hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-cyan-500/15"
                  >
                    Áp dụng deadline
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

function TeamTaskModal({
  members,
  loading,
  onClose,
  onSubmit,
}: {
  members: TeamMember[];
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    title: string;
    description?: string;
    priority: TaskPriority;
    status: TaskStatus;
    deadline?: string;
    assignee?: string | null;
  }) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [assignee, setAssignee] = useState('');
  const [deadline, setDeadline] = useState<Date | null>(null);

  const assigneeOptions: DropdownOption[] = [
    { value: '', label: 'Chưa giao' },
    ...members.map(member => ({
      value: member.id,
      label: member.name,
    })),
  ];

  const submit = (event: FormEvent) => {
    event.preventDefault();

    onSubmit({
      title,
      description,
      priority,
      status,
      deadline: deadline?.toISOString(),
      assignee: assignee || null,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-black/60 backdrop-blur-sm"
      onClick={event => event.target === event.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full md:max-w-lg glass rounded-t-2xl md:rounded-2xl flex flex-col max-h-[92vh] md:max-h-[90vh]"
      >
        <div className="flex justify-center pt-2.5 pb-1 md:hidden flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        <div className="flex items-center justify-between gap-2 px-4 md:px-6 py-3 md:py-4 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <ListTodo size={16} className="md:size-5 text-cyan-400 flex-shrink-0" />
            <h2 className="font-bold text-white text-sm md:text-base truncate">Tạo task team</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="p-4 md:p-6 space-y-3 md:space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-slate-400 text-xs font-medium mb-1.5">Tiêu đề *</label>
            <input
              value={title}
              onChange={event => setTitle(event.target.value)}
              className="input-dark text-xs md:text-sm w-full"
              placeholder="Tiêu đề task..."
            />
          </div>

          <div>
            <label className="flex text-slate-400 text-xs font-medium mb-1.5 items-center gap-1">
              <AlignLeft size={10} className="md:size-3" /> Mô tả
            </label>
            <textarea
              value={description}
              onChange={event => setDescription(event.target.value)}
              className="input-dark resize-none text-xs md:text-sm w-full"
              rows={2}
              placeholder="Mô tả chi tiết..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
            <div>
              <label className="block text-slate-400 text-xs font-medium mb-1.5">Mức độ ưu tiên</label>
              <TaskDropdown
                value={priority}
                onChange={value => setPriority(value as TaskPriority)}
                options={priorityOptions}
              />
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-medium mb-1.5">Trạng thái</label>
              <TaskDropdown
                value={status}
                onChange={value => setStatus(value as TaskStatus)}
                options={statusOptions}
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-xs font-medium mb-1.5">
              Giao cho thành viên
            </label>
            <TaskDropdown
              value={assignee}
              onChange={setAssignee}
              options={assigneeOptions}
            />
          </div>

          <div>
            <label className="flex text-slate-400 text-xs font-medium mb-1.5 items-center gap-1">
              <Clock size={10} className="md:size-3" /> Deadline
            </label>
            <DeadlinePicker
              value={deadline}
              onChange={setDeadline}
              placeholder="Chọn ngày giờ deadline..."
            />
          </div>

          <div className="flex gap-2 md:gap-3 pt-2 sticky bottom-0 bg-transparent pb-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 text-xs md:text-sm">
              Hủy
            </button>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2 text-xs md:text-sm"
            >
              {loading && <Loader2 size={12} className="md:size-4 animate-spin" />}
              Tạo task
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}


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

  const [taskSearch, setTaskSearch] = useState('');
  const [showTeamTaskModal, setShowTeamTaskModal] = useState(false);

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

  const filteredTeamTasks = teamTasks.filter(task => {
    const keyword = taskSearch.trim().toLowerCase();
    if (!keyword) return true;

    return (
      task.title.toLowerCase().includes(keyword) ||
      task.description?.toLowerCase().includes(keyword) ||
      task.assignee?.name.toLowerCase().includes(keyword)
    );
  });

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

  const handleCreateTeamTask = async (payload: {
    title: string;
    description?: string;
    priority: TaskPriority;
    status: TaskStatus;
    deadline?: string;
    assignee?: string | null;
  }) => {
    if (!canManage) {
      toast.error('Chỉ Owner hoặc Admin mới được thêm task');
      return;
    }

    if (!payload.title.trim()) {
      toast.error('Nhập tiêu đề task');
      return;
    }

    setCreatingTask(true);

    try {
      await teamAPI.createTask(id!, {
        title: payload.title.trim(),
        description: payload.description?.trim() || '',
        priority: payload.priority,
        status: payload.status,
        deadline: payload.deadline,
        assignee: payload.assignee || null,
      });

      toast.success('Đã tạo task');
      setShowTeamTaskModal(false);
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
      <div className="glass rounded-2xl overflow-hidden border border-white/[0.06]">
  <div className="h-1.5 w-full" style={{ background: currentTeam.color }} />

  <div className="p-3 md:p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <button
          type="button"
          onClick={() => navigate('/teams')}
          className="h-9 w-9 rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] active:scale-95 transition-all flex items-center justify-center flex-shrink-0"
          aria-label="Quay lại"
        >
          <ArrowLeft size={16} />
        </button>

        <div
          className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-lg md:text-2xl font-extrabold text-white shadow-xl flex-shrink-0 overflow-hidden"
          style={{ background: currentTeam.color }}
        >
          {currentTeam.avatar ? (
            <img src={currentTeam.avatar} className="w-full h-full object-cover" alt="" />
          ) : (
            currentTeam.name[0].toUpperCase()
          )}
        </div>

        <div className="min-w-0 pt-0.5">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-base md:text-xl font-extrabold text-white truncate">
              {currentTeam.name}
            </h1>

            {(() => {
              const currentRole = roleConfig[myRole as keyof typeof roleConfig];
              const Icon = currentRole.icon;

              return (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold border whitespace-nowrap ${currentRole.bg} ${currentRole.color}`}>
                  <Icon size={10} /> {currentRole.label}
                </span>
              );
            })()}
          </div>

          {currentTeam.description ? (
            <p className="text-slate-400 text-xs md:text-sm mt-1 line-clamp-2">
              {currentTeam.description}
            </p>
          ) : (
            <p className="text-slate-500 text-xs md:text-sm mt-1">
              {currentTeam.memberCount} {t('team.memberCount')}
            </p>
          )}

          {currentTeam.description && (
            <p className="text-slate-600 text-xs mt-1">
              {currentTeam.memberCount} {t('team.memberCount')}
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => id && fetchTeamDetail(id).catch(() => {})}
        className="h-9 w-9 rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] active:scale-95 transition-all flex items-center justify-center flex-shrink-0"
        aria-label={t('team.retry')}
      >
        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
      </button>
    </div>

    {(canManage || isOwner) && (
      <div className="grid grid-cols-2 gap-2 mt-4">
        {canManage && (
          <button
            type="button"
            onClick={() => setShowInvite(true)}
            className="h-10 inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-500/15 text-cyan-300 text-xs font-bold hover:bg-cyan-500/25 active:scale-[0.98] transition-all"
          >
            <UserPlus size={14} />
            {t('team.invite')}
          </button>
        )}

        {isOwner && (
          <button
            type="button"
            onClick={() => setShowEdit(true)}
            className="h-10 inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] text-slate-300 text-xs font-bold hover:text-white hover:bg-white/[0.08] active:scale-[0.98] transition-all"
          >
            <Settings size={14} />
            {t('team.edit')}
          </button>
        )}
      </div>
    )}
  </div>
</div>


      <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
  <div className="inline-flex min-w-full gap-1 rounded-2xl border border-white/[0.06] bg-white/[0.04] p-1">
    {tabs.map(tab => {
      const Icon = tab.icon;
      const active = activeTab === tab.id;

      return (
        <button
          key={tab.id}
          type="button"
          onClick={() => setActiveTab(tab.id)}
          className={`h-9 flex items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-all whitespace-nowrap ${
            active
              ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-white border border-cyan-400/20 shadow-[0_0_18px_rgba(34,211,238,0.08)]'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Icon size={13} className={active ? 'text-cyan-300' : ''} />
          {tab.label}
        </button>
      );
    })}
  </div>
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
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">

                    {[
                      { label: t('team.totalMembers'), value: stats.totalMembers, icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                      { label: t('team.totalTasks'), value: stats.totalTasks, icon: CheckCircle, color: 'text-violet-400', bg: 'bg-violet-500/10' },
                      { label: t('team.completed'), value: stats.completedTasks, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                      { label: t('team.overdue'), value: stats.overdueTasks, icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
                    ].map(item => {
                      const Icon = item.icon;

                      return (
                        <div
  key={item.label}
  className="glass rounded-2xl p-3 md:p-4 border border-white/[0.05]"
>
  <div className="flex items-center gap-3">
    <div className={`w-8 h-8 md:w-9 md:h-9 rounded-xl ${item.bg} flex items-center justify-center border border-white/[0.04] flex-shrink-0`}>
      <Icon size={15} className={item.color} />
    </div>

    <div className="min-w-0">
      <p className="text-xl md:text-2xl font-extrabold text-white leading-none">
        {item.value}
      </p>
      <p className="text-slate-500 text-[11px] md:text-xs mt-1 truncate">
        {item.label}
      </p>
    </div>
  </div>
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
              <div className="glass rounded-2xl p-3 md:p-5 space-y-3 md:space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-white font-bold text-sm md:text-base flex items-center gap-2">
                      <ListTodo size={17} className="text-cyan-400 flex-shrink-0" />
                      <span>Tasks</span>
                    </h3>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {filteredTeamTasks.length} / {teamTasks.length} task trong team
                    </p>
                  </div>

                  {canManage && (
                    <button
                      type="button"
                      onClick={() => setShowTeamTaskModal(true)}
                      className="h-10 md:h-11 inline-flex items-center justify-center gap-2 px-4 md:px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white text-xs md:text-sm font-semibold shadow-lg shadow-cyan-500/10 hover:opacity-90 active:scale-95 transition-all whitespace-nowrap flex-shrink-0"
                    >
                      <Plus size={14} className="md:size-4 flex-shrink-0" />
                      Tạo task
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Search
                    size={14}
                    className="md:size-4 pointer-events-none absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-500 z-10"
                  />
                  <input
                    value={taskSearch}
                    onChange={event => setTaskSearch(event.target.value)}
                    className="block w-full h-11 md:h-13 rounded-xl border border-white/10 bg-white/[0.04] py-0 pl-10 md:pl-12 pr-3 md:pr-4 text-xs md:text-sm text-slate-200 placeholder-slate-500 outline-none transition-all focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-500/20"
                    placeholder="Tìm task, mô tả hoặc người được giao..."
                  />
                </div>

                {!canManage && (
                  <p className="text-slate-400 text-xs md:text-sm">
                    Thành viên chỉ có thể cập nhật tiến độ task được giao trong team.
                  </p>
                )}
              </div>

              <div className="glass rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                    <CheckCircle size={15} className="text-cyan-400" />
                    Tasks ({filteredTeamTasks.length})
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
                ) : filteredTeamTasks.length === 0 ? (
                  <div className="p-8 text-center">
                    <CheckCircle size={32} className="mx-auto mb-3 text-slate-600" />
                    <p className="text-slate-400 text-sm">
                      {teamTasks.length === 0 ? 'Chưa có task trong team' : 'Không tìm thấy task phù hợp'}
                    </p>
                    <p className="text-slate-600 text-xs mt-1">
                      {teamTasks.length === 0
                        ? canManage
                          ? 'Tạo task mới để giao việc cho thành viên'
                          : 'Owner hoặc Admin sẽ tạo task cho team'
                        : 'Thử tìm bằng từ khóa khác'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {filteredTeamTasks.map(task => {
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

      <AnimatePresence>
        {showTeamTaskModal && (
          <TeamTaskModal
            members={currentTeam.members || []}
            loading={creatingTask}
            onClose={() => setShowTeamTaskModal(false)}
            onSubmit={handleCreateTeamTask}
          />
        )}
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
