import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Sparkles, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Vui lòng điền đầy đủ thông tin');
    if (form.password !== form.confirmPassword) return toast.error('Mật khẩu xác nhận không khớp');
    if (form.password.length < 6) return toast.error('Mật khẩu phải ít nhất 6 ký tự');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Đăng ký thành công! 🎉');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #060d1f 0%, #0d1b3e 50%, #060d1f 100%)',
      padding: '1.5rem', position: 'relative', overflow: 'hidden',
      fontFamily: "'Segoe UI', sans-serif",
    }}>

      {/* Background orbs */}
      <div style={{
        position: 'absolute', top: '-20%', right: '-10%',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
        borderRadius: '50%', animation: 'pulse2 10s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', left: '-10%',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)',
        borderRadius: '50%', animation: 'pulse1 8s ease-in-out infinite',
      }} />

      {/* Grid pattern */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(6,182,212,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.03) 1px, transparent 1px)`,
        backgroundSize: '50px 50px', pointerEvents: 'none',
      }} />

      <style>{`
        @keyframes pulse1 { 0%,100%{transform:scale(1) translate(0,0);} 50%{transform:scale(1.1) translate(20px,-20px);} }
        @keyframes pulse2 { 0%,100%{transform:scale(1) translate(0,0);} 50%{transform:scale(1.15) translate(-20px,20px);} }
        @keyframes floatLogo { 0%,100%{transform:translateY(0px);} 50%{transform:translateY(-8px);} }
        @keyframes spinIcon { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
        .reg-input:focus-within { border-color: rgba(139,92,246,0.6) !important; box-shadow: 0 0 0 3px rgba(139,92,246,0.1) !important; }
        .reg-btn:hover { opacity: 0.92; transform: translateY(-1px); box-shadow: 0 8px 30px rgba(139,92,246,0.4) !important; }
        .reg-btn:active { transform: scale(0.98); }
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
          style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.75rem', justifyContent: 'center' }}
        >
          <div style={{
            width: 52, height: 52, borderRadius: '16px',
            background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px rgba(139,92,246,0.4), 0 0 60px rgba(6,182,212,0.2)',
            animation: 'floatLogo 4s ease-in-out infinite',
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
              background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)',
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
            background: 'rgba(15,23,42,0.85)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Top glow line */}
          <div style={{
            position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.7), rgba(6,182,212,0.7), transparent)',
          }} />

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
            <h2 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.2rem', margin: '0 0 0.25rem' }}>
              Tạo tài khoản ✨
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '0 0 1.5rem' }}>
              Bắt đầu quản lý công việc thông minh ngay hôm nay
            </p>
          </motion.div>

          <form onSubmit={handleSubmit}>
            {/* Họ tên */}
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.38 }} style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                HỌ VÀ TÊN
              </label>
              <div className="reg-input" style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '0.75rem', padding: '0.75rem 1rem', transition: 'all 0.2s ease',
              }}>
                <User size={15} color="#475569" style={{ flexShrink: 0 }} />
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Nguyễn Văn A"
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#e2e8f0', fontSize: '0.875rem' }} />
              </div>
            </motion.div>

            {/* Email */}
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.42 }} style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                EMAIL
              </label>
              <div className="reg-input" style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '0.75rem', padding: '0.75rem 1rem', transition: 'all 0.2s ease',
              }}>
                <Mail size={15} color="#475569" style={{ flexShrink: 0 }} />
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="your@email.com"
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#e2e8f0', fontSize: '0.875rem' }} />
              </div>
            </motion.div>

            {/* Mật khẩu */}
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.46 }} style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                MẬT KHẨU
              </label>
              <div className="reg-input" style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '0.75rem', padding: '0.75rem 1rem', transition: 'all 0.2s ease',
              }}>
                <Lock size={15} color="#475569" style={{ flexShrink: 0 }} />
                <input type={showPass ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#e2e8f0', fontSize: '0.875rem' }} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 0, display: 'flex' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </motion.div>

            {/* Xác nhận mật khẩu */}
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                XÁC NHẬN MẬT KHẨU
              </label>
              <div className="reg-input" style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '0.75rem', padding: '0.75rem 1rem', transition: 'all 0.2s ease',
              }}>
                <Lock size={15} color="#475569" style={{ flexShrink: 0 }} />
                <input type={showPass ? 'text' : 'password'} value={form.confirmPassword}
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#e2e8f0', fontSize: '0.875rem' }} />
              </div>
            </motion.div>

            {/* Button */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.54 }}>
              <button type="submit" disabled={loading} className="reg-btn" style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '0.5rem', padding: '0.85rem',
                background: loading ? 'rgba(139,92,246,0.4)' : 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
                border: 'none', borderRadius: '0.75rem',
                color: 'white', fontWeight: 700, fontSize: '0.9rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.25s ease',
                boxShadow: '0 4px 20px rgba(139,92,246,0.3)',
              }}>
                {loading
                  ? <><Loader2 size={16} style={{ animation: 'spinIcon 1s linear infinite' }} /> Đang đăng ký...</>
                  : <>Đăng ký <ArrowRight size={16} /></>}
              </button>
            </motion.div>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
            <span style={{ color: '#334155', fontSize: '0.72rem', fontWeight: 500 }}>HOẶC</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
          </div>

          <p style={{ textAlign: 'center', color: '#475569', fontSize: '0.83rem', margin: 0 }}>
            Đã có tài khoản?{' '}
            <Link to="/login" style={{
              background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              fontWeight: 700, textDecoration: 'none',
            }}>Đăng nhập →</Link>
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          style={{ textAlign: 'center', color: '#1e293b', fontSize: '0.72rem', marginTop: '1.5rem', letterSpacing: '0.05em' }}
        >
          🔒 Bảo mật SSL · Dữ liệu được mã hóa
        </motion.p>
      </motion.div>
    </div>
  );
}