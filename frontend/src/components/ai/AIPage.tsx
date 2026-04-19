import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, Loader2, Bot, User, RefreshCw,
  Calendar, TrendingUp, Bell, Lightbulb, Mic, MicOff
} from 'lucide-react';
import { aiAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface Message { role: 'user' | 'assistant'; content: string; time: Date; }

type AITab = 'chat' | 'suggest' | 'schedule' | 'analysis' | 'reminders';

const TABS: { id: AITab; icon: any; label: string }[] = [
  { id: 'chat', icon: Bot, label: 'Chat' },
  { id: 'suggest', icon: Lightbulb, label: 'Gợi ý' },
  { id: 'schedule', icon: Calendar, label: 'Lịch thông minh' },
  { id: 'analysis', icon: TrendingUp, label: 'Phân tích' },
  { id: 'reminders', icon: Bell, label: 'Nhắc nhở' },
];

export default function AIPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AITab>('chat');
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: `Xin chào ${user?.name}! 👋 Tôi là TaskFlow AI Assistant. Tôi có thể giúp bạn:\n• 💡 Gợi ý ưu tiên công việc\n• 📅 Lên lịch làm việc tối ưu\n• 📊 Phân tích năng suất\n• 🔔 Nhắc nhở thông minh\n\nHãy hỏi tôi bất cứ điều gì!`,
    time: new Date()
  }]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [tabData, setTabData] = useState<any>(null);
  const [tabLoading, setTabLoading] = useState(false);
  const [analysisDay, setAnalysisDay] = useState(7);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || chatLoading) return;
    const userMsg: Message = { role: 'user', content: input, time: new Date() };
    const history = messages.slice(-8).map(m => ({ role: m.role, content: m.content }));
    setMessages(m => [...m, userMsg]);
    setInput('');
    setChatLoading(true);
    try {
      const res = await aiAPI.chat({ message: input, history });
      setMessages(m => [...m, { role: 'assistant', content: res.data.reply, time: new Date() }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại!', time: new Date() }]);
    } finally {
      setChatLoading(false);
    }
  };

  const loadTabData = async () => {
    setTabLoading(true);
    setTabData(null);
    try {
      let res;
      if (activeTab === 'suggest') res = await aiAPI.suggestPriority();
      else if (activeTab === 'schedule') res = await aiAPI.autoSchedule({
        date: scheduleDate,
        workingHours: user?.workingHours
      });
      else if (activeTab === 'analysis') res = await aiAPI.productivityAnalysis(analysisDay);
      else if (activeTab === 'reminders') res = await aiAPI.smartReminders();
      setTabData(res?.data);
    } catch {
      toast.error('AI service không khả dụng. Hãy kiểm tra API key!');
    } finally {
      setTabLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'chat') { setTabData(null); }
  }, [activeTab]);

  const toggleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error('Trình duyệt không hỗ trợ nhận giọng nói'); return; }
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      const recognition = new SR();
      recognition.lang = 'vi-VN';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onresult = (e: any) => {
        setInput(e.results[0][0].transcript);
        setIsRecording(false);
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
    }
  };

  const QUICK_PROMPTS = [
    'Hôm nay tôi nên làm gì trước?',
    'Phân tích năng suất tuần này',
    'Tôi có task nào quá hạn không?',
    'Gợi ý cách tăng hiệu suất làm việc'
  ];

  return (
    <div className="space-y-5 animate-fade-in h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg animate-float">
          <Sparkles size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">AI Assistant</h1>
          <p className="text-slate-400 text-xs">Powered by OpenAI GPT</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-600 p-1 rounded-xl flex-shrink-0 overflow-x-auto">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0
              ${activeTab === id ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Chat tab */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col glass rounded-2xl overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${msg.role === 'assistant' ? 'bg-gradient-to-br from-cyan-500 to-violet-500' : 'bg-dark-400 border border-white/10'}`}>
                  {msg.role === 'assistant' ? <Bot size={16} className="text-white" /> : <User size={16} className="text-slate-300" />}
                </div>
                <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line
                  ${msg.role === 'assistant' ? 'bg-dark-500 border border-white/5 text-slate-200' : 'bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/20 text-white'}`}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
            {chatLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="bg-dark-500 border border-white/5 px-4 py-3 rounded-2xl">
                  <div className="flex gap-1.5 items-center h-5">
                    {[0, 0.2, 0.4].map(d => <span key={d} className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />)}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {QUICK_PROMPTS.map(p => (
                <button key={p} onClick={() => setInput(p)}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-slate-400 hover:text-white hover:border-cyan-500/30 transition-all">
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-white/5">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  className="input-dark pr-10 w-full" placeholder="Nhắn tin với AI..." />
                <button onClick={toggleVoice}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isRecording ? 'text-rose-400 animate-pulse' : 'text-slate-500 hover:text-cyan-400'}`}>
                  {isRecording ? <MicOff size={15} /> : <Mic size={15} />}
                </button>
              </div>
              <button onClick={sendMessage} disabled={chatLoading || !input.trim()}
                className="btn-primary px-4 flex-shrink-0 flex items-center justify-center">
                {chatLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Other tabs */}
      {activeTab !== 'chat' && (
        <div className="flex-1 glass rounded-2xl p-5 overflow-y-auto min-h-0">
          {/* Tab controls */}
          <div className="flex items-center justify-between mb-5">
            <div>
              {activeTab === 'analysis' && (
                <select value={analysisDay} onChange={e => setAnalysisDay(+e.target.value)} className="input-dark text-xs">
                  <option value={7}>7 ngày qua</option>
                  <option value={14}>14 ngày qua</option>
                  <option value={30}>30 ngày qua</option>
                </select>
              )}
              {activeTab === 'schedule' && (
                <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="input-dark text-xs" />
              )}
            </div>
            <button onClick={loadTabData} disabled={tabLoading} className="btn-primary flex items-center gap-2 text-sm">
              {tabLoading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
              {tabLoading ? 'Đang phân tích...' : 'Phân tích với AI'}
            </button>
          </div>

          {!tabData && !tabLoading && (
            <div className="text-center py-16">
              <Sparkles size={48} className="mx-auto text-slate-700 mb-4" />
              <p className="text-slate-400 font-medium">Nhấn "Phân tích với AI" để bắt đầu</p>
              <p className="text-slate-600 text-sm mt-1">AI sẽ phân tích dữ liệu công việc của bạn</p>
            </div>
          )}

          {tabLoading && (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-20 skeleton rounded-xl" />)}
            </div>
          )}

          {/* Suggest priority */}
          {activeTab === 'suggest' && tabData && (
            <div className="space-y-4">
              {tabData.summary && (
                <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                  <p className="text-cyan-300 text-sm leading-relaxed">{tabData.summary}</p>
                </div>
              )}
              <div className="space-y-3">
                {(tabData.suggestions || []).map((s: any, i: number) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                    className="p-4 rounded-xl bg-white/3 border border-white/5 hover:border-white/10 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-semibold text-white text-sm">{s.task?.title || s.title}</p>
                        <p className="text-slate-400 text-xs mt-1 leading-relaxed">{s.reason}</p>
                        {s.urgencyScore !== undefined && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-slate-500">Độ khẩn:</span>
                            <div className="flex-1 h-1.5 bg-dark-400 rounded-full">
                              <div className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full" style={{ width: `${s.urgencyScore}%` }} />
                            </div>
                            <span className="text-xs font-semibold text-cyan-400">{s.urgencyScore}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Schedule */}
          {activeTab === 'schedule' && tabData && (
            <div className="space-y-4">
              {(tabData.schedule || []).map((slot: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="flex gap-4 p-4 rounded-xl bg-white/3 border border-white/5"
                >
                  <div className="text-right flex-shrink-0 w-24">
                    <p className="text-cyan-400 font-mono text-xs font-semibold">{slot.startTime}</p>
                    <p className="text-slate-600 font-mono text-xs">{slot.endTime}</p>
                  </div>
                  <div className="w-px bg-white/10 self-stretch" />
                  <div>
                    <p className="font-semibold text-white text-sm">{slot.title}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{slot.reason}</p>
                  </div>
                </motion.div>
              ))}
              {tabData.tips && tabData.tips.length > 0 && (
                <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 mt-4">
                  <p className="text-violet-300 text-xs font-semibold mb-2">💡 Tips từ AI:</p>
                  {tabData.tips.map((tip: string, i: number) => (
                    <p key={i} className="text-slate-300 text-xs leading-relaxed mt-1">• {tip}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Analysis */}
          {activeTab === 'analysis' && tabData && (
            <div className="space-y-4">
              {/* Score */}
              {tabData.analysis?.score !== undefined && (
                <div className="p-5 rounded-xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-white/10 text-center">
                  <p className="text-slate-400 text-sm mb-2">Điểm năng suất</p>
                  <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">
                    {tabData.analysis.score}
                    <span className="text-2xl text-slate-500">/100</span>
                  </p>
                </div>
              )}
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Tổng task', val: tabData.stats?.total, color: 'text-cyan-400' },
                  { label: 'Hoàn thành', val: tabData.stats?.completed, color: 'text-emerald-400' },
                  { label: 'Hoàn thành %', val: `${tabData.stats?.completionRate}%`, color: 'text-violet-400' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="p-3 rounded-xl bg-white/3 border border-white/5 text-center">
                    <p className={`text-xl font-bold ${color}`}>{val}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              {/* Analysis text */}
              {tabData.analysis?.analysis && (
                <div className="p-4 rounded-xl bg-white/3 border border-white/5">
                  <p className="text-slate-300 text-sm leading-relaxed">{tabData.analysis.analysis}</p>
                </div>
              )}
              {/* Strengths & improvements */}
              <div className="grid grid-cols-2 gap-3">
                {tabData.analysis?.strengths?.length > 0 && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-emerald-400 text-xs font-semibold mb-2">✅ Điểm mạnh</p>
                    {tabData.analysis.strengths.map((s: string, i: number) => <p key={i} className="text-slate-300 text-xs mt-1">• {s}</p>)}
                  </div>
                )}
                {tabData.analysis?.improvements?.length > 0 && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-amber-400 text-xs font-semibold mb-2">🎯 Cải thiện</p>
                    {tabData.analysis.improvements.map((s: string, i: number) => <p key={i} className="text-slate-300 text-xs mt-1">• {s}</p>)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reminders */}
          {activeTab === 'reminders' && tabData && (
            <div className="space-y-3">
              {(tabData.reminders || []).length === 0 ? (
                <p className="text-center text-slate-500 py-8">Không có task nào sắp đến hạn trong 72 giờ tới 🎉</p>
              ) : (tabData.reminders || []).map((r: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  className={`p-4 rounded-xl border ${r.urgency === 'high' ? 'bg-rose-500/10 border-rose-500/20' : r.urgency === 'medium' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}
                >
                  <div className="flex items-start gap-3">
                    <Bell size={16} className={r.urgency === 'high' ? 'text-rose-400' : r.urgency === 'medium' ? 'text-amber-400' : 'text-blue-400'} />
                    <div>
                      <p className="font-semibold text-white text-sm">{r.title}</p>
                      <p className="text-slate-300 text-xs mt-1 leading-relaxed">{r.message}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
