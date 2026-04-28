import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function SettingsPage() {
  const { dark, setDark } = useTheme();
  const [pushNotif, setPushNotif] = useState(true);
  const [soundEffects, setSoundEffects] = useState(false);
  const [language, setLanguage] = useState('English');
  const [timezone, setTimezone] = useState('UTC');

  return (
    <div style={{ padding: '2rem', fontFamily: "'Segoe UI', sans-serif" }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
        ⚙️ Cài đặt
      </h1>

      <SettingsCard icon="⚙️" title="General Settings" subtitle="Basic system configuration">
        <SettingsRow icon="☀️" label="Dark Mode" description="Use dark theme for the interface">
          <Toggle value={dark} onChange={setDark} />
        </SettingsRow>
        <Divider />
        <SettingsRow icon="🌐" label="Language" description="Select your preferred language">
          <StyledSelect value={language} onChange={e => setLanguage(e.target.value)}>
            <option>English</option>
            <option>Vietnamese</option>
          </StyledSelect>
        </SettingsRow>
        <Divider />
        <SettingsRow icon="🕐" label="Timezone" description="Set your local timezone">
          <StyledSelect value={timezone} onChange={e => setTimezone(e.target.value)}>
            <option>UTC</option>
            <option>GMT+7</option>
            <option>GMT+8</option>
          </StyledSelect>
        </SettingsRow>
      </SettingsCard>

      <SettingsCard icon="🔔" title="Notifications" subtitle="Manage your notification preferences">
        <SettingsRow icon="📳" label="Push Notifications" description="Receive push alerts in real time">
          <Toggle value={pushNotif} onChange={setPushNotif} color="#4fd1c5" />
        </SettingsRow>
        <Divider />
        <SettingsRow icon="🔊" label="Sound Effects" description="Play sounds on actions">
          <Toggle value={soundEffects} onChange={setSoundEffects} color="#4fd1c5" />
        </SettingsRow>
      </SettingsCard>
    </div>
  );
}

function SettingsCard({ icon, title, subtitle, children }: {
  icon: string; title: string; subtitle: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '1rem',
      padding: '1.25rem 1.5rem',
      marginBottom: '1.25rem',
      backdropFilter: 'blur(12px)',
      transition: 'background 0.3s, border 0.3s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '0.6rem',
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
        }}>{icon}</div>
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>{title}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{subtitle}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>{children}</div>
    </div>
  );
}

function SettingsRow({ icon, label, description, children }: {
  icon: string; label: string; description: string; children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: 34, height: 34, borderRadius: '0.5rem',
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem',
        }}>{icon}</div>
        <div>
          <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{label}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{description}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function Toggle({ value, onChange, color = '#63b3ed' }: {
  value: boolean; onChange: (v: boolean) => void; color?: string;
}) {
  return (
    <button onClick={() => onChange(!value)} style={{
      width: 48, height: 26, borderRadius: 999,
      background: value ? color : 'var(--bg-elevated)',
      border: `1px solid ${value ? color : 'var(--border)'}`,
      cursor: 'pointer', position: 'relative',
      transition: 'all 0.3s ease', flexShrink: 0,
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: '50%', background: 'white',
        position: 'absolute', top: 2, left: value ? 24 : 2,
        transition: 'left 0.3s ease', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </button>
  );
}

function StyledSelect({ value, onChange, children }: {
  value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; children: React.ReactNode;
}) {
  return (
    <select value={value} onChange={onChange} style={{
      background: 'var(--bg-elevated)', color: 'var(--text-primary)',
      border: '1px solid var(--border)', borderRadius: '0.5rem',
      padding: '0.35rem 0.75rem', fontSize: '0.85rem', outline: 'none', cursor: 'pointer',
    }}>
      {children}
    </select>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--border)' }} />;
}