import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [dark, setDark] = useState(
  document.documentElement.classList.contains("dark")
);

useEffect(() => {
  if (dark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }

  localStorage.setItem("darkMode", JSON.stringify(dark));
}, [dark]);

  return (
    <div className="p-6 space-y-6">
      
      {/* TITLE */}
      <h1 className="text-2xl font-bold">⚙️ Settings</h1>

      {/* GENERAL */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <h2 className="text-lg font-semibold">General Settings</h2>

        {/* DARK MODE */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Dark Mode</p>
            <p className="text-sm text-slate-400">
              Use dark theme for the interface
            </p>
          </div>

          <button
            onClick={() => setDark(!dark)}
            className={`w-12 h-6 rounded-full transition ${
              dark ? "bg-green-400" : "bg-gray-500"
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full transition ${
                dark ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* LANGUAGE */}
        <div className="flex items-center justify-between">
          <p>Language</p>
          <select
  className="px-4 py-2 rounded-xl border outline-none"
  style={{
    background: "var(--bg-card)",
    color: "var(--text-primary)",
    borderColor: "var(--border)"
  }}
>
            <option>English</option>
            <option>Vietnamese</option>
          </select>
        </div>

        {/* TIMEZONE */}
        <div className="flex items-center justify-between">
          <p>Timezone</p>
          <select
  className="px-4 py-2 rounded-xl border outline-none"
  style={{
    background: "var(--bg-card)",
    color: "var(--text-primary)",
    borderColor: "var(--border)"
  }}
>
            <option>UTC</option>
            <option>GMT+7</option>
          </select>
        </div>
      </div>

      {/* NOTIFICATIONS */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <h2 className="text-lg font-semibold">Notifications</h2>

        <div className="flex items-center justify-between">
          <p>Push Notifications</p>

          <div className="w-12 h-6 bg-cyan-400 rounded-full relative">
            <div className="w-5 h-5 bg-white rounded-full absolute right-1 top-0.5" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p>Sound Effects</p>

          <div className="w-12 h-6 bg-gray-500 rounded-full relative">
            <div className="w-5 h-5 bg-white rounded-full absolute left-1 top-0.5" />
          </div>
        </div>
      </div>
    </div>
  );
}