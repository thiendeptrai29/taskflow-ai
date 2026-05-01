import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Moon, Globe, Clock, Bell, Volume2,
  Monitor, Shield, ChevronRight, ChevronDown,
  Check, User, Mail, Lock, Camera,
  Save, Loader2
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
    onClick={onChange}
    className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none ${
      value ? 'bg-gradient-to-r from-cyan-500 to-violet-500' : 'bg-slate-300 dark:bg-white/10'
    }`}
  >
    <motion.div
      animate={{ x: value ? 24 : 2 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
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
    <div ref={wrapperRef} className="w-[280px] max-w-full">
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen(current => !current)}
        className={`h-12 w-full flex items-center justify-between gap-3 rounded-xl px-4 border transition-all duration-200 outline-none ${
          dark
            ? 'bg-white/[0.04] border-white/[0.08] hover:border-cyan-400/40 hover:shadow-[0_0_18px_rgba(34,211,238,0.12)]'
            : 'bg-white/80 border-slate-200 hover:border-cyan-400/50 hover:shadow-[0_0_18px_rgba(14,165,233,0.12)]'
        } ${open ? 'ring-2 ring-cyan-500/20 border-cyan-400/50' : ''}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center border flex-shrink-0 ${
              dark
                ? 'bg-white/[0.05] border-white/[0.08]'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <Icon size={15} className="text-cyan-400" />
          </div>

          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold truncate border bg-gradient-to-r ${
              dark
                ? 'from-cyan-500/15 to-violet-500/15 border-cyan-400/20 text-slate-100'
                : 'from-cyan-500/10 to-violet-500/10 border-cyan-500/20 text-slate-900'
            }`}
          >
            {selected?.label}
          </span>
        </div>

        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={15} className={dark ? 'text-slate-400' : 'text-slate-500'} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            transition={{ duration: 0.2 }}
            className={`mt-2 max-h-48 overflow-y-auto rounded-xl border p-1.5 shadow-2xl backdrop-blur-xl ${
              dark
                ? 'bg-[#111827]/95 border-white/[0.08] shadow-black/30'
                : 'bg-white/95 border-slate-200 shadow-slate-300/30'
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
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
                    active
                      ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/15 text-cyan-300'
                      : dark
                        ? 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
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
  children: React.ReactNode;
  color?: string;
  dark: boolean;
}) => (
  <motion.div
    whileHover={{ x: 2 }}
    className={`flex items-start justify-between gap-4 px-4 py-3.5 rounded-xl transition-all group ${
      dark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-100/70'
    }`}
  >
    <div className="flex items-center gap-3 min-w-0 pt-1.5">
      <div
        className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all flex-shrink-0 ${
          dark
            ? 'bg-white/[0.04] border-white/[0.08] group-hover:border-white/20'
            : 'bg-white border-slate-200 group-hover:border-slate-300'
        }`}
      >
        <Icon size={16} className={color} />
      </div>
      <div className="min-w-0">
        <p className={`text-sm font-semibold ${dark ? 'text-slate-200' : 'text-slate-900'}`}>
          {label}
        </p>
        <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
          {desc}
        </p>
      </div>
    </div>
    <div className="flex-shrink-0">{children}</div>
  </motion.div>
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
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
      active
        ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/10 text-cyan-400 border border-cyan-500/20'
        : dark
          ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
    }`}
  >
    <Icon size={16} />
    <span>{label}</span>
    {active && <ChevronRight size={14} className="ml-auto" />}
  </button>
);

const InputRow = ({
  icon: Icon,
  children,
  dark
}: {
  icon: any;
  children: React.ReactNode;
  dark: boolean;
}) => (
  <div
    className={`flex items-center gap-3 border rounded-lg px-4 py-2.5 transition-all focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/20 ${
      dark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-300'
    }`}
  >
    <Icon size={15} className="text-slate-500 flex-shrink-0" />
    {children}
  </div>
);

export default function SettingsPage() {
  const { dark, setDark } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { user, updateUser } = useAuthStore();

  const [timezone, setTimezone] = useState('UTC+7');
  const [pushNotif, setPushNotif] = useState(true);
  const [soundEffects, setSoundEffects] = useState(false);
  const [emailNotif, setEmailNotif] = useState(true);
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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleProfile = async (e: React.FormEvent) => {
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

      if (avatarFile) {
        fd.append('avatar', avatarFile);
      }

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

  const handlePassword = async (e: React.FormEvent) => {
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
    { id: 'notifications', icon: Bell, label: t('settings.notifications') },
    { id: 'security', icon: Shield, label: t('settings.security') },
    { id: 'profile', icon: User, label: t('settings.profile') },
  ];

  const timezoneOptions = [
  { value: 'UTC', label: 'UTC' },
  { value: 'UTC+7', label: 'GMT+7 (Hà Nội)' },
  { value: 'UTC+8', label: 'GMT+8 (Bắc Kinh)' },
];

const selectedTimezoneLabel =
  timezoneOptions.find(option => option.value === timezone)?.label || timezone;


  const langOptions = [
    { value: 'vi', label: 'Tiếng Việt' },
    { value: 'en', label: 'English' },
  ];

  return (
    <div className="animate-fade-in space-y-1">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-bold flex items-center gap-2 ${titleText}`}>
            ⚙️ {t('settings.title')}
          </h1>
          <p className={`text-xs mt-0.5 ${mutedText}`}>
            {t('settings.subtitle')}
          </p>
        </div>

        {activeSection !== 'profile' && activeSection !== 'security' && (
          <motion.button
            onClick={handleSave}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              saved
                ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                : 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white hover:opacity-90'
            }`}
          >
            {saved ? (
              <>
                <Check size={15} /> {t('settings.saved')}
              </>
            ) : (
              t('settings.save')
            )}
          </motion.button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-5">
        <div className={`col-span-1 ${cardClass} p-3 space-y-1 h-fit`}>
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

        <div className="col-span-3 space-y-4">
          {activeSection === 'general' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${cardClass} p-5`}
            >
              <div className={`flex items-center gap-2 mb-4 pb-3 border-b ${dividerClass}`}>
                <Monitor size={16} className="text-cyan-400" />
                <h2 className={`font-semibold text-sm ${headingText}`}>
                  {t('settings.general')}
                </h2>
              </div>

              <div className="space-y-2">
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

          {activeSection === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${cardClass} p-5`}
            >
              <div className={`flex items-center gap-2 mb-4 pb-3 border-b ${dividerClass}`}>
                <Bell size={16} className="text-rose-400" />
                <h2 className={`font-semibold text-sm ${headingText}`}>
                  {t('settings.notifications')}
                </h2>
              </div>

              <div className="space-y-2">
                <SettingRow
                  icon={Bell}
                  label={t('settings.pushNotif')}
                  desc={t('settings.pushNotifDesc')}
                  color="text-rose-400"
                  dark={dark}
                >
                  <Toggle value={pushNotif} onChange={() => setPushNotif(!pushNotif)} />
                </SettingRow>

                <SettingRow
                  icon={Volume2}
                  label={t('settings.soundEffects')}
                  desc={t('settings.soundEffectsDesc')}
                  color="text-emerald-400"
                  dark={dark}
                >
                  <Toggle
                    value={soundEffects}
                    onChange={() => setSoundEffects(!soundEffects)}
                  />
                </SettingRow>

                <SettingRow
                  icon={Globe}
                  label={t('settings.emailNotif')}
                  desc={t('settings.emailNotifDesc')}
                  color="text-blue-400"
                  dark={dark}
                >
                  <Toggle value={emailNotif} onChange={() => setEmailNotif(!emailNotif)} />
                </SettingRow>
              </div>
            </motion.div>
          )}

          {activeSection === 'security' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${cardClass} p-5`}
            >
              <div className={`flex items-center gap-2 mb-4 pb-3 border-b ${dividerClass}`}>
                <Shield size={16} className="text-emerald-400" />
                <h2 className={`font-semibold text-sm ${headingText}`}>
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
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-rose-500 text-white font-medium rounded-lg text-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
                >
                  {pwLoading ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
                  {pwLoading ? t('settings.changing') : t('settings.changePassword')}
                </button>
              </form>
            </motion.div>
          )}

          {activeSection === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${cardClass} p-5`}
            >
              <div className={`flex items-center gap-2 mb-4 pb-3 border-b ${dividerClass}`}>
                <User size={16} className="text-cyan-400" />
                <h2 className={`font-semibold text-sm ${headingText}`}>
                  {t('settings.profile')}
                </h2>
              </div>

              <div className="flex items-center gap-5 mb-6">
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white text-2xl font-bold shadow-xl overflow-hidden">
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

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`absolute -bottom-2 -right-2 w-7 h-7 border rounded-lg flex items-center justify-center transition-all ${
                      dark
                        ? 'bg-[#1a2236] border-white/10 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40'
                        : 'bg-white border-slate-300 text-slate-600 hover:text-cyan-600 hover:border-cyan-500/50'
                    }`}
                  >
                    <Camera size={12} />
                  </button>
                </div>

                <div>
                  <h3 className={`text-lg font-bold ${headingText}`}>{user?.name}</h3>

                  <p className={`text-sm flex items-center gap-1.5 mt-0.5 ${mutedText}`}>
                    <Mail size={13} /> {user?.email}
                  </p>

                  <span
                    className={`inline-block mt-1.5 px-2 py-0.5 text-xs rounded-full font-medium ${
                      user?.role === 'admin'
                        ? 'bg-violet-500/20 text-violet-500 border border-violet-500/30'
                        : 'bg-cyan-500/20 text-cyan-500 border border-cyan-500/30'
                    }`}
                  >
                    {user?.role === 'admin' ? `👑 ${t('settings.admin')}` : `👤 ${t('settings.user')}`}
                  </span>

                  {avatarFile && (
                    <p className="text-cyan-500 text-xs mt-1">📎 {avatarFile.name}</p>
                  )}
                </div>
              </div>

              <form onSubmit={handleProfile} className="space-y-4">
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${mutedText}`}>
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
                  <label className={`block text-xs font-medium mb-1.5 flex items-center gap-1.5 ${mutedText}`}>
                    <Clock size={13} /> {t('settings.workingHours')}
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className={`text-xs mb-1 ${faintText}`}>{t('settings.start')}</p>
                      <div
                        className={`flex items-center border rounded-lg px-4 py-2.5 ${
                          dark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-300'
                        }`}
                      >
                        <input
                          type="time"
                          value={workStart}
                          onChange={e => setWorkStart(e.target.value)}
                          className={`flex-1 bg-transparent text-sm outline-none ${inputText}`}
                        />
                      </div>
                    </div>

                    <div>
                      <p className={`text-xs mb-1 ${faintText}`}>{t('settings.end')}</p>
                      <div
                        className={`flex items-center border rounded-lg px-4 py-2.5 ${
                          dark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-300'
                        }`}
                      >
                        <input
                          type="time"
                          value={workEnd}
                          onChange={e => setWorkEnd(e.target.value)}
                          className={`flex-1 bg-transparent text-sm outline-none ${inputText}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={profileLoading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-medium rounded-lg text-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
                >
                  {profileLoading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {profileLoading ? t('settings.saving') : t('settings.saveProfile')}
                </button>
              </form>
            </motion.div>
          )}

          {activeSection !== 'profile' && activeSection !== 'security' && (
            <div className={`${cardClass} p-4 flex items-center gap-3 border-l-2 border-cyan-500`}>
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <Globe size={15} className="text-cyan-400" />
              </div>

              <div>
                <p className={`text-xs font-medium ${bodyText}`}>
                  {t('settings.currentTimezone')}: {selectedTimezoneLabel}
                </p>

                <p className={`text-xs ${softText}`}>
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
