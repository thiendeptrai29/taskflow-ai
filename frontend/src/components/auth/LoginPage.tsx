import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Sparkles, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Vui lòng điền đầy đủ thông tin');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Đăng nhập thành công! 🎉');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #060d1f 0%, #0d1b3e 50%, #060d1f 100%)',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Segoe UI', sans-serif",
    }}>

      {/* Animated background orbs */}
      <div style={{
        position: 'absolute', top: '-20%', left: '-10%',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)',
        borderRadius: '50%', animation: 'pulse1 8s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', right: '-10%',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
        borderRadius: '50%', animation: 'pulse2 10s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', top: '40%', left: '50%',
        width: '300px', height: '300px',
        background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)',
        borderRadius: '50%', animation: 'pulse1 6s ease-in-out infinite reverse',
      }} />

      {/* Grid pattern overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(6,182,212,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(6,182,212,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        pointerEvents: 'none',
      }} />

      <style>{`
        @keyframes pulse1 {
          0%, 100% { transform: scale(1) translate(0,0); opacity: 0.8; }
          50% { transform: scale(1.1) translate(20px, -20px); opacity: 1; }
        }
        @keyframes pulse2 {
          0%, 100% { transform: scale(1) translate(0,0); opacity: 0.6; }
          50% { transform: scale(1.15) translate(-20px, 20px); opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(3deg); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .login-input:focus-within {
          border-color: rgba(6,182,212,0.6) !important;
          box-shadow: 0 0 0 3px rgba(6,182,212,0.1), 0 0 20px rgba(6,182,212,0.1) !important;
        }
        .login-btn:hover {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 8px 30px rgba(6,182,212,0.4) !important;
        }
        .login-btn:active { transform: translateY(0px) scale(0.98); }
        .logo-icon { animation: float 4s ease-in-out infinite; }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 10 }}
      >

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '2rem', justifyContent: 'center' }}
        >
          <div className="logo-icon" style={{
            width: 52, height: 52, borderRadius: '16px',
            background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px rgba(6,182,212,0.4), 0 0 60px rgba(139,92,246,0.2)',
          }}>
            <Sparkles size={26} color="white" />
          </div>
          <div>
            <h1 style={{
              fontSize: '1.6rem', fontWeight: 800, margin: 0, lineHeight: 1.1,
              background: 'linear-gradient(135deg, #e2e8f0, #94a3b8)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>TaskFlow AI</h1>
            <p style={{
              margin: 0, fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em',
              background: 'linear-gradient(90deg, #06b6d4, #8b5cf6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>QUẢN LÝ THÔNG MINH</p>
          </div>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{
            background: 'rgba(15,23,42,0.8)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Card top glow line */}
          <div style={{
            position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.6), rgba(139,92,246,0.6), transparent)',
          }} />

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
            <h2 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.2rem', margin: '0 0 0.25rem' }}>
              Chào mừng trở lại 👋
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '0 0 1.75rem' }}>
              Đăng nhập để tiếp tục quản lý công việc
            </p>
          </motion.div>

          <form onSubmit={handleSubmit}>

            {/* Email */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              style={{ marginBottom: '1rem' }}
            >
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                EMAIL
              </label>
              <div className="login-input" style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '0.75rem', padding: '0.75rem 1rem',
                transition: 'all 0.2s ease',
              }}>
                <Mail size={15} color="#475569" style={{ flexShrink: 0 }} />
                <input
                  type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    color: '#e2e8f0', fontSize: '0.875rem',
                  }}
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 }}
              style={{ marginBottom: '1.5rem' }}
            >
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                MẬT KHẨU
              </label>
              <div className="login-input" style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '0.75rem', padding: '0.75rem 1rem',
                transition: 'all 0.2s ease',
              }}>
                <Lock size={15} color="#475569" style={{ flexShrink: 0 }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    color: '#e2e8f0', fontSize: '0.875rem',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 0, display: 'flex', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <button
                type="submit"
                disabled={loading}
                className="login-btn"
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '0.5rem', padding: '0.85rem',
                  background: loading
                    ? 'rgba(6,182,212,0.4)'
                    : 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)',
                  border: 'none', borderRadius: '0.75rem',
                  color: 'white', fontWeight: 700, fontSize: '0.9rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.25s ease',
                  boxShadow: '0 4px 20px rgba(6,182,212,0.3)',
                  letterSpacing: '0.02em',
                }}
              >
                {loading ? (
                  <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Đang đăng nhập...</>
                ) : (
                  <>Đăng nhập <ArrowRight size={16} /></>
                )}
              </button>
            </motion.div>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.5rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
            <span style={{ color: '#334155', fontSize: '0.72rem', fontWeight: 500 }}>HOẶC</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
          </div>

          <p style={{ textAlign: 'center', color: '#475569', fontSize: '0.83rem', margin: 0 }}>
            Chưa có tài khoản?{' '}
            <Link to="/register" style={{
              background: 'linear-gradient(90deg, #06b6d4, #8b5cf6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              fontWeight: 700, textDecoration: 'none',
            }}>
              Đăng ký ngay →
            </Link>
          </p>
        </motion.div>

        {/* Bottom tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          style={{ textAlign: 'center', color: '#1e293b', fontSize: '0.72rem', marginTop: '1.5rem', letterSpacing: '0.05em' }}
        >
        </motion.p>
      </motion.div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}