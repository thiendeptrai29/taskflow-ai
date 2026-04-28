import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, CheckSquare, Calendar, Sparkles,
  Settings, LogOut, Shield, Bell, ChevronLeft, ChevronRight, User
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import NotificationPanel from './NotificationPanel';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/tasks', icon: CheckSquare, label: 'Công việc' },
  { path: '/calendar', icon: Calendar, label: 'Lịch' },
  { path: '/ai', icon: Sparkles, label: 'AI Assistant' },
  { path: '/profile', icon: User, label: 'Hồ sơ' },
  { path: '/settings', icon: Settings, label: 'Cài đặt' }, // ✅ đã có
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 🔥 LOAD THEME GLOBAL (QUAN TRỌNG)
  useEffect(() => {
    const saved = localStorage.getItem("settings");
    if (saved) {
      const data = JSON.parse(saved);

      // Dark mode
      document.documentElement.classList.toggle("dark", data.darkMode);

      // Primary color
      if (data.color) {
        document.documentElement.style.setProperty("--primary", data.color);
      }
    }
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="relative flex flex-col bg-dark-800 border-r border-white/5 z-20 flex-shrink-0"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <div
  className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
  style={{ backgroundColor: "var(--primary)" }}
>
  <Sparkles size={18} className="text-white" />
</div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="font-bold text-white text-sm leading-tight">TaskFlow</p>
               <p
  className="text-xs font-medium"
  style={{ color: "var(--primary)" }}
>
  AI Powered
</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-hidden">
          {navItems.map(({ path, icon: Icon, label }) => (
        <NavLink
  key={path}
  to={path}
  className={({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
    ${isActive
      ? 'text-white border'
      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`
  }
  style={({ isActive }) =>
    isActive ? { backgroundColor: "var(--primary)" } : {}
  }
>
            
              <Icon size={18} className="flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="whitespace-nowrap"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}

          {/* Admin */}
          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`
              }
            >
              <Shield size={18} className="flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    Admin
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          )}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-white/5">
          <div className={`flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-all mb-1 ${collapsed ? 'justify-center' : ''}`}>
          <div
  className="w-8 h-8 rounded-full flex items-center justify-center"
  style={{ backgroundColor: "var(--primary)" }}
>
  {user?.avatar ? (
    <img
      src={user.avatar}
      className="w-8 h-8 rounded-full object-cover"
      alt=""
    />
  ) : (
    <span className="text-white text-xs font-bold">
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
                  className="flex-1 min-w-0"
                >
                  <p className="text-slate-200 text-xs font-semibold truncate">{user?.name}</p>
                  <p className="text-slate-500 text-xs truncate">{user?.email}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-2 w-full rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all text-sm ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={16} className="flex-shrink-0" />
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>

        {/* Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-8 w-6 h-6 rounded-full bg-dark-600 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </motion.aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 flex items-center justify-end px-6 border-b border-white/5 bg-dark-800/50 backdrop-blur-sm flex-shrink-0">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-grid-pattern">
          <Outlet />
        </main>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {showNotifications && (
          <NotificationPanel onClose={() => setShowNotifications(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}