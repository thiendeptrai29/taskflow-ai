import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, CheckSquare, Calendar, Sparkles,
  Settings, LogOut, Shield, Bell, ChevronLeft, ChevronRight, Users, Menu, X
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useLanguage } from '../../context/LanguageContext';
import { notificationAPI } from '../../services/api';
import NotificationPanel from './NotificationPanel';
import InviteNotificationBanner from '../team/InviteNotificationBanner';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [unreadCount, setUnreadCount] = useState(0); // ✅ Fix: thêm state đếm unread
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

  // ✅ Fix: fetch số thông báo chưa đọc khi mount
  const fetchUnreadCount = async () => {
    try {
      const res = await notificationAPI.getAll();
      const count =
        res.data.notifications?.filter((n: { isRead: boolean }) => !n.isRead).length ?? 0;
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
  }, []);

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

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setShowMobileSidebar(false);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const closeMobileSidebar = () => {
    setShowMobileSidebar(false);
  };

  return (
    <div className="flex h-screen overflow-hidden">

      {/* Banner lời mời team */}
      <InviteNotificationBanner />

      {/* Sidebar - Desktop */}
      <motion.aside
        animate={{ width: collapsed ? 80 : 256 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="sidebar hidden md:flex relative flex-col bg-dark-800/90 backdrop-blur-sm border-r border-white/10 z-20 flex-shrink-0"
      >
        <div className="flex items-center gap-3 px-4 py-6 border-b border-white/10">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            <Sparkles size={20} className="!text-white" />
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

        <nav className="flex-1 py-5 px-3 space-y-1.5 overflow-hidden">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-200 group relative ${
                  isActive
                    ? '!text-white font-semibold'
                    : '!text-slate-400 hover:!text-white hover:bg-white/10 font-medium'
                }`
              }
              style={({ isActive }) =>
                isActive ? { backgroundColor: 'var(--primary)', boxShadow: '0 0 16px rgba(var(--primary-rgb), 0.2)' } : {}
              }
            >
              <Icon size={20} className="flex-shrink-0 !text-current" />
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

        <div className="p-4 border-t border-white/10 space-y-2">
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/10 active:scale-95 transition-all ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Settings"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              {user?.avatar ? (
                <img src={user.avatar} className="w-9 h-9 rounded-lg object-cover" alt="" />
              ) : (
                <span className="!text-white text-sm font-bold">
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
                  <p className="!text-white text-xs font-semibold truncate">{user?.name}</p>
                  <p className="!text-slate-400 text-xs truncate">{user?.email}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-3 w-full rounded-xl !text-slate-400 hover:!text-rose-400 hover:bg-rose-500/10 active:scale-95 transition-all text-sm font-medium ${collapsed ? 'justify-center' : ''}`}
            title="Logout"
          >
            <LogOut size={18} className="flex-shrink-0 !text-current" />
            {!collapsed && <span className="!text-current">{t('layout.logout')}</span>}
          </button>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-4 top-10 w-7 h-7 rounded-full bg-dark-600 border border-white/20 flex items-center justify-center !text-slate-300 hover:!text-white hover:bg-dark-500 hover:scale-110 active:scale-95 transition-all shadow-lg"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </motion.aside>

      {/* Mobile Sidebar - Overlay */}
      <AnimatePresence>
        {showMobileSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileSidebar}
              className="fixed inset-0 md:hidden bg-black/50 z-30"
            />

            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="md:hidden fixed left-0 top-0 h-full w-72 flex flex-col bg-dark-800/95 backdrop-blur-sm border-r border-white/10 z-40"
            >
              <div className="flex items-center justify-between px-5 py-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
                    style={{ backgroundColor: 'var(--primary)' }}
                  >
                    <Sparkles size={20} className="!text-white" />
                  </div>
                  <div>
                    <p className="!text-white font-bold text-base leading-tight">TaskFlow</p>
                    <p className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                      {t('layout.aiPowered')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeMobileSidebar}
                  className="p-2 hover:bg-white/10 rounded-lg active:scale-95 transition-all"
                  title="Close"
                >
                  <X size={22} className="text-slate-400" />
                </button>
              </div>

              <nav className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto">
                {navItems.map(({ path, icon: Icon, label }) => (
                  <NavLink
                    key={path}
                    to={path}
                    onClick={closeMobileSidebar}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-200 ${
                        isActive
                          ? '!text-white font-semibold'
                          : '!text-slate-400 hover:!text-white hover:bg-white/10 font-medium'
                      }`
                    }
                    style={({ isActive }) =>
                      isActive ? { backgroundColor: 'var(--primary)' } : {}
                    }
                  >
                    <Icon size={20} className="flex-shrink-0 !text-current" />
                    <span className="!text-current">{label}</span>
                  </NavLink>
                ))}

                {user?.role === 'admin' && (
                  <NavLink
                    to="/admin"
                    onClick={closeMobileSidebar}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-violet-500/30 !text-violet-200 font-semibold'
                          : '!text-slate-400 hover:!text-white hover:bg-white/10 font-medium'
                      }`
                    }
                  >
                    <Shield size={20} className="flex-shrink-0 !text-current" />
                    <span className="!text-current">{t('layout.admin')}</span>
                  </NavLink>
                )}
              </nav>

              <div className="p-4 border-t border-white/10 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    navigate('/settings');
                    closeMobileSidebar();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/10 active:scale-95 transition-all"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md"
                    style={{ backgroundColor: 'var(--primary)' }}
                  >
                    {user?.avatar ? (
                      <img src={user.avatar} className="w-9 h-9 rounded-lg object-cover" alt="" />
                    ) : (
                      <span className="!text-white text-sm font-bold">
                        {user?.name?.[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="!text-white text-xs font-semibold truncate">{user?.name}</p>
                    <p className="!text-slate-400 text-xs truncate">{user?.email}</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    handleLogout();
                    closeMobileSidebar();
                  }}
                  className="flex items-center gap-3 px-3 py-3 w-full rounded-xl !text-slate-400 hover:!text-rose-400 hover:bg-rose-500/10 active:scale-95 transition-all text-sm font-medium"
                  title="Logout"
                >
                  <LogOut size={18} className="flex-shrink-0 !text-current" />
                  <span className="!text-current">{t('layout.logout')}</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden w-full md:w-auto">
        <header className="h-14 md:h-16 flex items-center justify-between px-4 md:px-6 border-b border-white/10 bg-dark-800/80 backdrop-blur-xl flex-shrink-0 gap-2">
          <button
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            className="md:hidden p-2.5 rounded-lg !text-slate-300 hover:!text-white hover:bg-white/15 active:scale-95 transition-all"
            title="Menu"
          >
            <Menu size={22} />
          </button>

          <div className="hidden md:block"></div>

          {/* Notification Bell with Badge */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-lg !text-slate-300 hover:!text-white hover:bg-white/15 active:scale-95 transition-all"
            title="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full shadow-lg shadow-rose-500/50"
              />
            )}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      <AnimatePresence>
        {showNotifications && (
          <NotificationPanel
            onClose={() => setShowNotifications(false)}
            onRead={() => setUnreadCount(0)} // ✅ Fix: reset badge khi đọc hết
          />
        )}
      </AnimatePresence>
    </div>
  );
}