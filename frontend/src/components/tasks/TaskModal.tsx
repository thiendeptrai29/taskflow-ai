import { useState, useEffect, useLayoutEffect, useRef, type CSSProperties, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Loader2,
  Clock,
  AlignLeft,
  ListTodo,
  Sparkles,
  ChevronDown,
  Check,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Task } from '../../types';
import { useTaskStore } from '../../store/taskStore';
import { aiAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  task?: Task | null;
  onClose: () => void;
}

type DropdownOption = {
  value: string;
  label: string;
};

const defaultForm = {
  title: '',
  description: '',
  priority: 'medium',
  status: 'pending',
  category: '',
};

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

let sharedAudioContext: AudioContext | null = null;
let lastTickAt = 0;

const playWheelTick = () => {
  const now = performance.now();
  if (now - lastTickAt < 55) return;
  lastTickAt = now;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    sharedAudioContext ||= new AudioContextClass();

    if (sharedAudioContext.state === 'suspended') {
      sharedAudioContext.resume();
    }

    const oscillator = sharedAudioContext.createOscillator();
    const gain = sharedAudioContext.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(820, sharedAudioContext.currentTime);
    gain.gain.setValueAtTime(0.018, sharedAudioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, sharedAudioContext.currentTime + 0.028);

    oscillator.connect(gain);
    gain.connect(sharedAudioContext.destination);
    oscillator.start();
    oscillator.stop(sharedAudioContext.currentTime + 0.028);
  } catch {
    // Some browsers/devices block Web Audio in emulation or without user gesture.
  }
};

function FormDropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
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
    const maxHeight = 192;
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
      zIndex: 9999,
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
    <div ref={wrapperRef} className="relative">
      <motion.button
        ref={buttonRef}
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen(current => !current)}
        className={`h-10 md:h-11 w-full flex items-center justify-between gap-3 rounded-xl px-3 md:px-4 border outline-none transition-all duration-200 text-xs md:text-sm bg-white/[0.04] hover:border-cyan-400/40 ${
          open
            ? 'border-cyan-400/50 ring-2 ring-cyan-500/20 shadow-[0_0_18px_rgba(34,211,238,0.12)]'
            : 'border-white/10'
        }`}
      >
        <span className="truncate font-semibold text-slate-100">{selected.label}</span>
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
  const rafRef = useRef<number | null>(null);
  const settleRef = useRef<number | null>(null);
  const activeRef = useRef(Math.max(0, items.indexOf(value)));
  const [activeIndex, setActiveIndex] = useState(activeRef.current);

  const scrollToIndex = (index: number, behavior: ScrollBehavior = 'auto') => {
    ref.current?.scrollTo({ top: index * itemHeight, behavior });
  };

  useLayoutEffect(() => {
    const index = Math.max(0, items.indexOf(value));
    activeRef.current = index;
    setActiveIndex(index);
    scrollToIndex(index);
  }, [value, items]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (settleRef.current) window.clearTimeout(settleRef.current);
    };
  }, []);

  const nearestIndex = () => {
    const el = ref.current;
    if (!el) return 0;

    return Math.max(
      0,
      Math.min(items.length - 1, Math.round(el.scrollTop / itemHeight))
    );
  };

  const updateVisualSelection = () => {
    const index = nearestIndex();

    if (index !== activeRef.current) {
      activeRef.current = index;
      setActiveIndex(index);
      playWheelTick();

      if ('vibrate' in navigator) {
        navigator.vibrate(2);
      }
    }
  };

  const settle = () => {
    const index = nearestIndex();
    const next = items[index];

    activeRef.current = index;
    setActiveIndex(index);
    scrollToIndex(index, 'smooth');

    if (next && next !== value) {
      onChange(next);
    }
  };

  const handleScroll = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(updateVisualSelection);

    if (settleRef.current) window.clearTimeout(settleRef.current);
    settleRef.current = window.setTimeout(settle, 140);
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
        <div style={{ height: spacerHeight, flexShrink: 0 }} />

        {items.map((item, index) => {
          const active = index === activeIndex;

          return (
            <button
              key={item}
              type="button"
              onClick={() => {
                activeRef.current = index;
                setActiveIndex(index);
                scrollToIndex(index, 'smooth');
                onChange(item);
                playWheelTick();
              }}
              className={`h-[44px] w-full flex items-center justify-center gap-1.5 transition-colors duration-100 ${
                active
                  ? 'text-white font-extrabold'
                  : 'text-slate-500 font-bold'
              }`}
              style={{
                scrollSnapAlign: 'center',
                fontSize: active ? 20 : 15,
                lineHeight: '44px',
              }}
            >
              <span className="tabular-nums">{item}</span>
              <span
                className={`text-[11px] font-bold ${
                  active ? 'text-cyan-200 opacity-100' : 'opacity-0'
                }`}
              >
                {suffix}
              </span>
            </button>
          );
        })}

        <div style={{ height: spacerHeight, flexShrink: 0 }} />
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
  const [draftHour, setDraftHour] = useState(() =>
    String((value || new Date()).getHours()).padStart(2, '0')
  );
  const [draftMinute, setDraftMinute] = useState(() =>
    String((value || new Date()).getMinutes()).padStart(2, '0')
  );

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

  const selectDate = (date: Date) => {
    setDraftDate(date);
    setViewDate(date);
  };

  const selectQuickDate = (daysToAdd: number) => {
    const next = new Date();
    next.setDate(next.getDate() + daysToAdd);
    setDraftDate(next);
    setViewDate(next);
  };

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
              className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center px-3 py-3 bg-black/75 backdrop-blur-[4px] overflow-y-auto"
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
                className="w-full max-w-[400px] max-h-[calc(100dvh-32px)] overflow-y-auto rounded-3xl border border-slate-600/80 bg-slate-900 shadow-2xl shadow-black/70"
              >
                <div className="px-4 pt-4 pb-3 border-b border-slate-700/80">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-extrabold text-white">Chọn deadline</p>
                      <p className="text-[12px] font-medium text-slate-300">
                        {formatDeadline(draftValue)}
                      </p>
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
                        onClick={() => selectQuickDate(item.days)}
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
                        {new Intl.DateTimeFormat('vi-VN', {
                          month: 'long',
                          year: 'numeric',
                        }).format(viewDate)}
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
                            onClick={() => date && selectDate(date)}
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
                      <p className="text-[12px] font-medium text-slate-300">
                        Lướt để chọn giờ nhắc
                      </p>
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
                      <WheelColumn
                        items={hours}
                        value={draftHour}
                        suffix="giờ"
                        onChange={setDraftHour}
                      />
                      <WheelColumn
                        items={minutes}
                        value={draftMinute}
                        suffix="phút"
                        onChange={setDraftMinute}
                      />
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

export default function TaskModal({ task, onClose }: Props) {
  const { createTask, updateTask } = useTaskStore();
  const { t } = useLanguage();
  const [form, setForm] = useState(defaultForm);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiText, setAiText] = useState('');
  const [showAI, setShowAI] = useState(false);

  const priorityOptions = [
    { value: 'low', label: `🟢 ${t('tasks.priorityLow')}` },
    { value: 'medium', label: `🟡 ${t('tasks.priorityMedium')}` },
    { value: 'high', label: `🔴 ${t('tasks.priorityHigh')}` },
  ];

  const statusOptions = [
    { value: 'pending', label: t('tasks.statusPending') },
    { value: 'in-progress', label: t('tasks.statusInProgress') },
    { value: 'completed', label: t('tasks.statusCompleted') },
    { value: 'cancelled', label: t('tasks.statusCancelled') },
  ];

  useEffect(() => {
    if (!task) return;

    setForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      category: task.category || '',
    });

    setDeadline(task.deadline ? new Date(task.deadline) : null);
  }, [task]);

  const set = (key: string, val: any) => setForm(current => ({ ...current, [key]: val }));

  const handleAICreate = async () => {
    if (!aiText.trim()) {
      toast.error(t('tasks.aiDescriptionRequired'));
      return;
    }

    setAiLoading(true);

    try {
      const res = await aiAPI.createTask(aiText);
      const generatedTask = res.data.task;

      await useTaskStore.getState().fetchTasks();
      window.dispatchEvent(new Event('task-created'));
      toast.success(`✅ AI đã tạo task "${generatedTask.title}"!`);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || t('tasks.aiUnavailable'));
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error(t('tasks.titleRequired'));
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...form,
        tags: [],
        notes: '',
        deadline: deadline?.toISOString(),
      };

      if (task) {
        await updateTask(task._id, payload);
      } else {
        await createTask(payload);
        window.dispatchEvent(new Event('task-created'));
      }

      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('tasks.genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
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
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <ListTodo size={16} className="md:size-5 text-cyan-400 flex-shrink-0" />
            <h2 className="font-bold text-white text-sm md:text-base truncate">
              {task ? t('tasks.editTask') : t('tasks.createTask')}
            </h2>

            {!task && (
              <button
                type="button"
                onClick={() => setShowAI(current => !current)}
                className="h-8 inline-flex items-center justify-center gap-1.5 px-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] md:text-xs font-semibold hover:bg-cyan-500/20 transition-all whitespace-nowrap flex-shrink-0"
              >
                <Sparkles size={12} />
                <span>AI tạo task</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all flex-shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <AnimatePresence>
          {showAI && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden flex-shrink-0"
            >
              <div className="px-4 md:px-6 py-3 md:py-4 bg-cyan-500/5 border-b border-cyan-500/10">
                <p className="text-xs text-cyan-400 font-medium mb-1">
                  {t('tasks.aiNaturalPrompt')}
                </p>
                <textarea
                  value={aiText}
                  onChange={e => setAiText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && e.ctrlKey && handleAICreate()}
                  className="input-dark text-xs resize-none w-full"
                  rows={3}
                  placeholder={t('tasks.aiPlaceholder')}
                />
                <button
                  type="button"
                  onClick={handleAICreate}
                  disabled={aiLoading || !aiText.trim()}
                  className="btn-primary mt-2 text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 w-full"
                >
                  {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  {aiLoading ? 'Đang tạo task...' : t('tasks.createWithAI')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-3 md:space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-slate-400 text-xs font-medium mb-1.5">
              {t('tasks.title')} *
            </label>
            <input
              value={form.title}
              onChange={e => set('title', e.target.value)}
              className="input-dark text-xs md:text-sm w-full"
              placeholder={t('tasks.titlePlaceholder')}
            />
          </div>

          <div>
            <label className="flex text-slate-400 text-xs font-medium mb-1.5 items-center gap-1">
              <AlignLeft size={10} className="md:size-3" /> {t('tasks.description')}
            </label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className="input-dark resize-none text-xs md:text-sm w-full"
              rows={2}
              placeholder={t('tasks.descriptionPlaceholder')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
            <div>
              <label className="block text-slate-400 text-xs font-medium mb-1.5">
                {t('tasks.priority')}
              </label>
              <FormDropdown
                value={form.priority}
                options={priorityOptions}
                onChange={value => set('priority', value)}
              />
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-medium mb-1.5">
                {t('tasks.status')}
              </label>
              <FormDropdown
                value={form.status}
                options={statusOptions}
                onChange={value => set('status', value)}
              />
            </div>
          </div>

          <div>
            <label className="flex text-slate-400 text-xs font-medium mb-1.5 items-center gap-1">
              <Clock size={10} className="md:size-3" /> {t('tasks.deadline')}
            </label>
            <DeadlinePicker
              value={deadline}
              onChange={setDeadline}
              placeholder={t('tasks.deadlinePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs font-medium mb-1.5">
              {t('tasks.category')}
            </label>
            <input
              value={form.category}
              onChange={e => set('category', e.target.value)}
              className="input-dark text-xs md:text-sm w-full"
              placeholder={t('tasks.categoryPlaceholder')}
            />
          </div>

          <div className="flex gap-2 md:gap-3 pt-2 sticky bottom-0 bg-transparent pb-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 text-xs md:text-sm">
              {t('tasks.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2 text-xs md:text-sm"
            >
              {loading && <Loader2 size={12} className="md:size-4 animate-spin" />}
              {task ? t('tasks.update') : t('tasks.createTaskSubmit')}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
