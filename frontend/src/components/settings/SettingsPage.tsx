import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Moon, Globe, Clock,
  Monitor, Shield, ChevronRight, ChevronDown,
  Check, User, Mail, Lock, Camera,
  Save, Loader2,X
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import type { Language } from '../../i18n/translations';
import { useAuthStore } from '../../store/authStore';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

type Option = {
  value: string;
  label: string;
};

const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
  <button
    type="button"
    onClick={onChange}
    aria-pressed={value}
    className={`relative h-9 w-[76px] rounded-[18px] border p-[3px] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 flex-shrink-0 overflow-hidden shadow-inner ${
      value
        ? 'bg-gradient-to-r from-cyan-500 to-violet-500 border-cyan-300/40'
        : 'bg-slate-700 border-white/10'
    }`}
  >
    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10">
      {value ? (
        <Moon size={13} className="text-cyan-100/80" />
      ) : (
        <Sun size={13} className="text-amber-300/90" />
      )}
    </span>

    <motion.span
      animate={{ x: value ? 38 : 0 }}
      transition={{ type: 'spring', stiffness: 520, damping: 34 }}
      className="relative z-20 block h-[28px] w-[31px] rounded-[14px] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.28)]"
    />
  </button>
);



const CustomDropdown = ({
  value,
  onChange,
  options,
  icon: Icon,
  dark,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  icon: any;
  dark: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selected = options.find(option => option.value === value) || options[0];

  const updateMenuPosition = () => {
    const trigger = wrapperRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const menuWidth = Math.max(rect.width, 190);
    const gap = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const left = Math.min(
      Math.max(12, rect.right - menuWidth),
      viewportWidth - menuWidth - 12
    );

    const estimatedHeight = Math.min(options.length * 42 + 12, 220);
    const shouldOpenUp = rect.bottom + gap + estimatedHeight > viewportHeight;

    setMenuStyle({
      position: 'fixed',
      top: shouldOpenUp ? rect.top - estimatedHeight - gap : rect.bottom + gap,
      left,
      width: menuWidth,
      zIndex: 99999,
    });
  };

  useEffect(() => {
    if (!open) return;

    updateMenuPosition();

    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        wrapperRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }

      setOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, options.length]);

  const menu = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={menuRef}
          style={menuStyle}
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.15 }}
          className={`max-h-56 overflow-y-auto rounded-xl border p-1.5 shadow-2xl ${
            dark
              ? 'bg-[#0f172a] border-cyan-400/25 shadow-black/60'
              : 'bg-white border-slate-200 shadow-slate-300/50'
          }`}
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
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left text-xs font-semibold transition-all ${
                  active
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/20'
                    : dark
                      ? 'text-slate-200 hover:bg-white/10 hover:text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                <span className="truncate">{option.label}</span>
                {active && <Check size={12} className="text-cyan-300 flex-shrink-0" />}
              </button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <div ref={wrapperRef} className="relative w-[130px] sm:w-[180px] md:w-[220px]">
        <button
          type="button"
          onClick={() => {
            updateMenuPosition();
            setOpen(current => !current);
          }}
          className={`h-9 w-full flex items-center justify-between gap-2 rounded-lg px-2.5 border transition-all duration-200 outline-none ${
            dark
              ? 'bg-[#1b2435] border-white/10 hover:border-cyan-400/50'
              : 'bg-white border-slate-200 hover:border-cyan-400/50'
          } ${open ? 'ring-2 ring-cyan-500/25 border-cyan-400/60' : ''}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`w-5 h-5 rounded-md flex items-center justify-center border flex-shrink-0 ${
                dark ? 'bg-cyan-500/10 border-cyan-400/20' : 'bg-cyan-50 border-cyan-100'
              }`}
            >
              <Icon size={11} className="text-cyan-400" />
            </span>

            <span className={`text-[11px] sm:text-xs font-bold truncate ${dark ? 'text-white' : 'text-slate-900'}`}>
              {selected?.label}
            </span>
          </div>

          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0"
          >
            <ChevronDown size={13} className={dark ? 'text-slate-300' : 'text-slate-500'} />
          </motion.span>
        </button>
      </div>

      {createPortal(menu, document.body)}
    </>
  );
};

const SettingRow = ({
  icon: Icon,
  label,
  desc,
  children,
  color = 'text-cyan-400',
  dark
}: {
  icon: any;
  label: string;
  desc: string;
  children: ReactNode;
  color?: string;
  dark: boolean;
}) => (
  <div
    className={`relative flex items-center justify-between gap-3 px-3 py-3.5 rounded-xl transition-all group overflow-visible ${
      dark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-100/70'
    }`}
  >
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <div
        className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${
          dark
            ? 'bg-white/[0.04] border-white/[0.08] group-hover:border-white/20'
            : 'bg-white border-slate-200 group-hover:border-slate-300'
        }`}
      >
        <Icon size={15} className={color} />
      </div>

      <div className="min-w-0">
        <p className={`text-xs sm:text-sm font-bold leading-tight ${dark ? 'text-slate-200' : 'text-slate-900'}`}>
          {label}
        </p>
        <p className={`text-xs mt-0.5 leading-tight ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
          {desc}
        </p>
      </div>
    </div>

    <div className="relative z-20 flex-shrink-0">
      {children}
    </div>
  </div>
);

const NavItem = ({
  icon: Icon,
  label,
  active,
  onClick,
  dark
}: {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
  dark: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-shrink-0 md:w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
      active
        ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/10 text-cyan-400 border border-cyan-500/20'
        : dark
          ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
    }`}
  >
    <Icon size={14} className="flex-shrink-0" />
    <span>{label}</span>
    {active && <ChevronRight size={12} className="ml-auto hidden md:block" />}
  </button>
);

const InputRow = ({
  icon: Icon,
  children,
  dark
}: {
  icon: any;
  children: ReactNode;
  dark: boolean;
}) => (
  <div
    className={`flex items-center gap-3 border rounded-lg px-4 py-2.5 transition-all focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/20 ${
      dark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-300'
    }`}
  >
    <Icon size={14} className="text-slate-500 flex-shrink-0" />
    {children}
  </div>
);
const formatTimeLabel = (value: string) => {
  if (!value) return '--:--';
  const [hour, minute] = value.split(':');
  return `${hour}:${minute}`;
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
    // Browser can block Web Audio without user interaction.
  }
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

        <div style={{ height: spacerHeight, flexShrink: 0 }} />
      </div>
    </div>
  );
}

const TimePicker = ({
  value,
  onChange,
  label,
  dark,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  dark: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [draftHour, setDraftHour] = useState(value.split(':')[0] || '08');
  const [draftMinute, setDraftMinute] = useState(value.split(':')[1] || '00');
  const panelRef = useRef<HTMLDivElement>(null);

  const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));

  useEffect(() => {
    if (!open) return;

    const [hour, minute] = value.split(':');
    setDraftHour(hour || '08');
    setDraftMinute(minute || '00');

    const handleDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target)) setOpen(false);
    };

    document.addEventListener('mousedown', handleDown);
    return () => document.removeEventListener('mousedown', handleDown);
  }, [open, value]);

  const applyTime = () => {
    onChange(`${draftHour}:${draftMinute}`);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`h-12 w-full flex items-center justify-between gap-3 rounded-2xl px-4 border text-left transition-all ${
          dark
            ? 'bg-white/[0.04] border-white/10 hover:border-cyan-400/40'
            : 'bg-white border-slate-200 hover:border-cyan-400/40'
        }`}
      >
        <div className="min-w-0 flex-1 flex items-center gap-2">
          <span className={`text-[11px] font-semibold ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
            {label}
          </span>

          <span
            className={`px-2 py-0.5 rounded-md text-xs font-extrabold ${
              dark ? 'bg-cyan-500/10 text-cyan-200' : 'bg-cyan-50 text-cyan-700'
            }`}
          >
            {formatTimeLabel(value)}
          </span>
        </div>

        <Clock size={15} className="text-cyan-400 flex-shrink-0" />
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
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-extrabold text-white">{label}</p>
                      <p className="text-[12px] font-medium text-slate-300">
                        {draftHour}:{draftMinute}
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
                </div>

                <div className="px-4 pt-3 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-extrabold text-white">Chọn giờ</p>
                      <p className="text-[12px] font-medium text-slate-300">
                        Lướt để chọn giờ làm việc
                      </p>
                    </div>
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
                    onClick={applyTime}
                    className="mt-3 h-11 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white text-xs font-extrabold hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-cyan-500/15"
                  >
                    Áp dụng
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
};


export default function SettingsPage() {
  const { dark, setDark } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { user, updateUser } = useAuthStore();

  const [timezone, setTimezone] = useState('UTC+7');
  const [activeSection, setActiveSection] = useState('general');
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [workStart, setWorkStart] = useState(user?.workingHours?.start || '08:00');
  const [workEnd, setWorkEnd] = useState(user?.workingHours?.end || '17:00');
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const titleText = dark ? 'text-white' : 'text-slate-950';
  const headingText = dark ? 'text-white' : 'text-slate-900';
  const bodyText = dark ? 'text-slate-200' : 'text-slate-900';
  const mutedText = dark ? 'text-slate-400' : 'text-slate-600';
  const softText = dark ? 'text-slate-500' : 'text-slate-500';
  const faintText = dark ? 'text-slate-600' : 'text-slate-500';
  const inputText = dark
    ? 'text-slate-200 placeholder-slate-500'
    : 'text-slate-900 placeholder-slate-400';

  const cardClass = dark
    ? 'glass rounded-2xl'
    : 'bg-white/80 border border-slate-200 shadow-sm rounded-2xl';

  const dividerClass = dark ? 'border-white/5' : 'border-slate-200';

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('settings.imageMax'));
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error(t('settings.imageOnly'));
      return;
    }

    setAvatarFile(file);

    const reader = new FileReader();
    reader.onload = ev => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleProfile = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error(t('settings.nameRequired'));
      return;
    }

    setProfileLoading(true);

    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('workingHours', JSON.stringify({ start: workStart, end: workEnd }));
      if (avatarFile) fd.append('avatar', avatarFile);

      const res = await authAPI.updateProfile(fd);
      updateUser(res.data.user);
      setAvatarFile(null);
      toast.success(t('settings.profileUpdated'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('settings.profileUpdateFailed'));
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePassword = async (e: FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword) {
      toast.error(t('settings.fillAll'));
      return;
    }

    if (newPassword.length < 6) {
      toast.error(t('settings.passwordMin'));
      return;
    }

    setPwLoading(true);

    try {
      await authAPI.changePassword({ currentPassword, newPassword });
      toast.success(t('settings.passwordChanged'));
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('settings.passwordChangeFailed'));
    } finally {
      setPwLoading(false);
    }
  };

  const navItems = [
    { id: 'general', icon: Monitor, label: t('settings.general') },
    { id: 'security', icon: Shield, label: t('settings.security') },
    { id: 'profile', icon: User, label: t('settings.profile') },
  ];

  const timezoneOptions = [
    { value: 'UTC', label: 'UTC' },
    { value: 'UTC+7', label: 'GMT+7 (Hà Nội)' },
    { value: 'UTC+8', label: 'GMT+8 (Bắc Kinh)' },
  ];

  const langOptions = [
    { value: 'vi', label: 'Tiếng Việt' },
    { value: 'en', label: 'English' },
  ];

  const selectedTimezoneLabel =
    timezoneOptions.find(option => option.value === timezone)?.label || timezone;

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className={`text-xl font-bold flex items-center gap-2 ${titleText}`}>
            ⚙️ {t('settings.title')}
          </h1>
          <p className={`text-xs mt-0.5 ${mutedText}`}>
            {t('settings.subtitle')}
          </p>
        </div>

        {activeSection !== 'profile' && activeSection !== 'security' && (
          <motion.button
            type="button"
            onClick={handleSave}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all flex-shrink-0 ${
              saved
                ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                : 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white hover:opacity-90'
            }`}
          >
            {saved ? (
              <>
                <Check size={13} /> {t('settings.saved')}
              </>
            ) : (
              t('settings.save')
            )}
          </motion.button>
        )}
      </div>

      <div className="flex flex-col md:grid md:grid-cols-4 gap-4 overflow-visible">
        <div className={`md:col-span-1 ${cardClass} p-2 md:p-3 self-start`}>
          <div
            className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-0.5 md:pb-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {navItems.map(item => (
              <NavItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={activeSection === item.id}
                onClick={() => setActiveSection(item.id)}
                dark={dark}
              />
            ))}
          </div>
        </div>

        <div className="md:col-span-3 space-y-4 overflow-visible">
          {activeSection === 'general' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${cardClass} relative z-30 p-4 overflow-visible`}
            >
              <div className={`flex items-center gap-2 mb-3 pb-3 border-b ${dividerClass}`}>
                <Monitor size={14} className="text-cyan-400" />
                <h2 className={`font-semibold text-xs ${headingText}`}>
                  {t('settings.general')}
                </h2>
              </div>

              <div className="space-y-1 overflow-visible">
                <SettingRow
                  icon={dark ? Moon : Sun}
                  label={t('settings.darkMode')}
                  desc={t('settings.darkModeDesc')}
                  color="text-violet-400"
                  dark={dark}
                >
                  <Toggle value={dark} onChange={() => setDark(!dark)} />
                </SettingRow>

                <SettingRow
                  icon={Globe}
                  label={t('settings.language')}
                  desc={t('settings.languageDesc')}
                  color="text-cyan-400"
                  dark={dark}
                >
                  <CustomDropdown
                    value={language}
                    onChange={value => setLanguage(value as Language)}
                    options={langOptions}
                    icon={Globe}
                    dark={dark}
                  />
                </SettingRow>

                <SettingRow
                  icon={Clock}
                  label={t('settings.timezone')}
                  desc={t('settings.timezoneDesc')}
                  color="text-amber-400"
                  dark={dark}
                >
                  <CustomDropdown
                    value={timezone}
                    onChange={setTimezone}
                    options={timezoneOptions}
                    icon={Clock}
                    dark={dark}
                  />
                </SettingRow>
              </div>
            </motion.div>
          )}

          {activeSection === 'security' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${cardClass} p-4`}
            >
              <div className={`flex items-center gap-2 mb-3 pb-3 border-b ${dividerClass}`}>
                <Shield size={14} className="text-emerald-400" />
                <h2 className={`font-semibold text-xs ${headingText}`}>
                  {t('settings.security')}
                </h2>
              </div>

              <form onSubmit={handlePassword} className="space-y-4">
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${mutedText}`}>
                    {t('settings.currentPassword')}
                  </label>
                  <InputRow icon={Lock} dark={dark}>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className={`flex-1 bg-transparent text-sm outline-none ${inputText}`}
                      placeholder="••••••••"
                    />
                  </InputRow>
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${mutedText}`}>
                    {t('settings.newPassword')}
                  </label>
                  <InputRow icon={Lock} dark={dark}>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className={`flex-1 bg-transparent text-sm outline-none ${inputText}`}
                      placeholder="••••••••"
                    />
                  </InputRow>
                </div>

                <button
                  type="submit"
                  disabled={pwLoading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-rose-500 text-white font-medium rounded-lg text-xs hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
                >
                  {pwLoading ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                  {pwLoading ? t('settings.changing') : t('settings.changePassword')}
                </button>
              </form>
            </motion.div>
          )}

       {activeSection === 'profile' && (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className={`${cardClass} overflow-hidden`}
  >
    <div className="relative p-4 border-b border-white/5 bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-transparent">
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white text-2xl font-bold shadow-xl overflow-hidden ring-4 ring-white/5">
    {avatarPreview ? (
      <img src={avatarPreview} className="w-full h-full object-cover" alt="avatar" />
    ) : (
      <span>{user?.name?.[0]?.toUpperCase()}</span>
    )}
  </div>

  <input
    ref={fileInputRef}
    type="file"
    accept="image/*"
    className="hidden"
    onChange={handleAvatarChange}
  />

</div>

<div className="min-w-0 flex-1">
  <h2 className={`text-base font-bold truncate ${headingText}`}>
    {user?.name}
  </h2>

  <p className={`text-xs flex items-center gap-1.5 mt-1 ${mutedText}`}>
    <Mail size={12} className="flex-shrink-0" />
    <span className="truncate">{user?.email}</span>
  </p>

  <div className="flex items-center gap-2 mt-2">
    <span
      className={`inline-flex items-center px-2 py-1 text-xs rounded-lg font-semibold ${
        user?.role === 'admin'
          ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
      }`}
    >
      {user?.role === 'admin' ? t('settings.admin') : t('settings.user')}
    </span>

    <button
  type="button"
  onClick={() => fileInputRef.current?.click()}
  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-semibold border transition-all ${
    dark
      ? 'bg-white/5 border-white/10 text-slate-200 hover:text-cyan-300 hover:border-cyan-400/30'
      : 'bg-white border-slate-200 text-slate-700 hover:text-cyan-600 hover:border-cyan-300'
  }`}
>
  <Camera size={10} className="sm:w-3 sm:h-3" />
  Đổi ảnh
</button>

  </div>

  {avatarFile && (
    <p className="text-xs text-cyan-400 mt-2 truncate">
      Đã chọn: {avatarFile.name}
    </p>
  )}
</div>


        
      </div>
    </div>

    <form onSubmit={handleProfile} className="p-4 space-y-4">
      <div>
        <label className={`block text-xs font-semibold mb-1.5 ${mutedText}`}>
          {t('settings.fullName')}
        </label>
        <InputRow icon={User} dark={dark}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className={`flex-1 bg-transparent text-sm outline-none ${inputText}`}
            placeholder={t('settings.yourName')}
          />
        </InputRow>
      </div>

     <div>
  <label className={`block text-xs font-semibold mb-2 ${mutedText}`}>
    {t('settings.workingHours')}
  </label>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <TimePicker
      value={workStart}
      onChange={setWorkStart}
      label={t('settings.start')}
      dark={dark}
    />

    <TimePicker
      value={workEnd}
      onChange={setWorkEnd}
      label={t('settings.end')}
      dark={dark}
    />
  </div>
</div>
      <button
        type="submit"
        disabled={profileLoading}
        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold rounded-xl text-xs hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
      >
        {profileLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        {profileLoading ? t('settings.saving') : t('settings.saveProfile')}
      </button>
    </form>
  </motion.div>
)}

          {activeSection !== 'profile' && activeSection !== 'security' && (
            <div className={`${cardClass} relative z-10 p-3 flex items-center gap-3 border-l-2 border-cyan-500`}>
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <Globe size={13} className="text-cyan-400" />
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-medium truncate ${bodyText}`}>
                  {t('settings.currentTimezone')}: {selectedTimezoneLabel}
                </p>
                <p className={`text-xs truncate ${softText}`}>
                  {`${t('settings.languageLabel')}: ${
                    language === 'vi' ? t('settings.vi') : t('settings.en')
                  } • ${t('settings.theme')}: ${dark ? t('settings.dark') : t('settings.light')}`}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
