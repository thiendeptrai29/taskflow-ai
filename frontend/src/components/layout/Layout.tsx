import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, CheckSquare, Calendar, Sparkles,
  Settings, LogOut, Shield, Bell, ChevronLeft, ChevronRight, Users
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useLanguage } from '../../context/LanguageContext';
import NotificationPanel from './NotificationPanel';
import InviteNotificationBanner from '../team/InviteNotificationBanner'; // ✅ Thêm

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout } = useAuthStore();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('layout.dashboard') },
    { path: '/tasks', icon: CheckSquare, label: t('layout.tasks') },
    { path: '/calendar', icon: Calendar, label: t('layout.calendar') },
    { path: '/ai', icon: Sparkles, label: t('layout.ai') },
    { path: '/teams', icon: Users, label: 'Teams' },
    { path: '/settings', icon: Settings, label: t('layout.settings') },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const saved = localStorage.getItem('settings');
    if (saved) {
      const data = JSON.parse(saved);
      document.documentElement.classList.toggle('dark', data.darkMode);
      if (data.color) {
        document.documentElement.style.setProperty('--primary', data.color);
      }
    }
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ✅ Banner lời mời team — hiển thị toàn app */}
      <InviteNotificationBanner />

      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="sidebar relative flex flex-col bg-dark-800 border-r border-white/10 z-20 flex-shrink-0"
      >
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            <Sparkles size={18} className="!text-white" />
          </div>

          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="!text-[#f8fafc] font-bold text-sm leading-tight">TaskFlow</p>
                <p className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                  {t('layout.aiPowered')}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1 overflow-hidden">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group ${
                  isActive
                    ? '!text-white border border-white/30 font-semibold shadow-sm'
                    : '!text-[#cbd5e1] hover:!text-white hover:bg-white/10 font-medium'
                }`
              }
              style={({ isActive }) =>
                isActive ? { backgroundColor: 'var(--primary)' } : {}
              }
            >
              <Icon size={18} className="flex-shrink-0 !text-current" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="whitespace-nowrap !text-current"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-violet-500/25 !text-violet-100 border border-violet-400/30 font-semibold'
                    : '!text-[#cbd5e1] hover:!text-white hover:bg-white/10 font-medium'
                }`
              }
            >
              <Shield size={18} className="flex-shrink-0 !text-current" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="!text-current">
                    {t('layout.admin')}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          )}
        </nav>

        <div className="p-3 border-t border-white/10">
  <button
    type="button"
    onClick={() => navigate('/settings')}
    className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/10 transition-all mb-1 ${
      collapsed ? 'justify-center' : ''
    }`}
    title="Cài đặt"
  >
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
      style={{ backgroundColor: 'var(--primary)' }}
    >
      {user?.avatar ? (
        <img src={user.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
      ) : (
        <span className="!text-white text-xs font-bold">
          {user?.name?.[0]?.toUpperCase()}
        </span>
      )}
    </div>

    <AnimatePresence>
      {!collapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex-1 min-w-0 text-left"
        >
          <p className="!text-[#f8fafc] text-xs font-semibold truncate">{user?.name}</p>
          <p className="!text-[#cbd5e1] text-xs truncate">{user?.email}</p>
        </motion.div>
      )}
    </AnimatePresence>
  </button>


          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-2 w-full rounded-xl !text-[#cbd5e1] hover:!text-rose-300 hover:bg-rose-500/10 transition-all text-sm font-medium ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={16} className="flex-shrink-0 !text-current" />
            {!collapsed && <span className="!text-current">{t('layout.logout')}</span>}
          </button>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-8 w-6 h-6 rounded-full bg-dark-600 border border-white/20 flex items-center justify-center !text-slate-200 hover:!text-white hover:bg-dark-500 transition-colors"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </motion.aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 flex items-center justify-end px-6 border-b border-white/10 bg-dark-800/50 backdrop-blur-sm flex-shrink-0">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl !text-slate-300 hover:!text-white hover:bg-white/10 transition-all"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-grid-pattern">
          <Outlet />
        </main>
      </div>

      <AnimatePresence>
        {showNotifications && (
          <NotificationPanel onClose={() => setShowNotifications(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}