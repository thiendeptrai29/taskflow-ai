import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  RefreshCw,
  Calendar,
  TrendingUp,
  Bell,
  Lightbulb,
  Mic,
  MicOff,
  Plus,
  Trash2,
  MessageSquare,
  ChevronLeft,
} from 'lucide-react';
import { aiAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  time: Date;
}

interface Session {
  sessionId: string;
  title: string;
  messageCount: number;
  preview: string;
  lastMessage: string;
}

type AITab = 'chat' | 'suggest' | 'schedule' | 'analysis' | 'reminders';

export default function AIPage() {
  const { user } = useAuthStore();
  const { language, t } = useLanguage();

  const [activeTab, setActiveTab] = useState<AITab>('chat');

  const welcomeMessage: Message = {
    role: 'assistant',
    content: t('ai.welcomeMessage'),
    time: new Date(),
  };

  const tabs: { id: AITab; icon: any; label: string }[] = [
    { id: 'chat', icon: Bot, label: t('ai.tabChat') },
    { id: 'suggest', icon: Lightbulb, label: t('ai.tabSuggest') },
    { id: 'schedule', icon: Calendar, label: t('ai.tabSchedule') },
    { id: 'analysis', icon: TrendingUp, label: t('ai.tabAnalysis') },
    { id: 'reminders', icon: Bell, label: t('ai.tabReminders') },
  ];

  const quickPrompts = [
    t('ai.quickToday'),
    t('ai.quickWeeklyAnalysis'),
    t('ai.quickOverdue'),
    t('ai.quickProductivity'),
  ];

  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showSessions, setShowSessions] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const [tabData, setTabData] = useState<any>(null);
  const [tabLoading, setTabLoading] = useState(false);
  const [analysisDay, setAnalysisDay] = useState(7);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSessions = async () => {
    setSessionsLoading(true);

    try {
      const res = await api.get('/chat/sessions');
      setSessions(res.data.sessions);
    } catch {
      // Ignore empty/unavailable history.
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const createNewSession = async () => {
    try {
      const res = await api.post('/chat/sessions', {
        title: t('ai.newConversation'),
      });

      const sessionId = res.data.session.sessionId;

      setCurrentSessionId(sessionId);
      setMessages([welcomeMessage]);
      setShowSessions(false);
      await loadSessions();
    } catch {
      setCurrentSessionId(null);
      setMessages([welcomeMessage]);
    }
  };

  const loadSession = async (sessionId: string) => {
    try {
      const res = await api.get(`/chat/sessions/${sessionId}`);
      const loadedMessages: Message[] = res.data.session.messages.map((message: any) => ({
        role: message.role,
        content: message.content,
        time: new Date(message.time),
      }));

      setMessages(loadedMessages.length > 0 ? loadedMessages : [welcomeMessage]);
      setCurrentSessionId(sessionId);
      setShowSessions(false);
    } catch {
      toast.error(t('ai.sessionLoadFailed'));
    }
  };

  const deleteSession = async (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    try {
      await api.delete(`/chat/sessions/${sessionId}`);

      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([welcomeMessage]);
      }

      await loadSessions();
      toast.success(t('ai.sessionDeleted'));
    } catch {
      toast.error(t('ai.deleteFailed'));
    }
  };

  const saveToHistory = async (
    sessionId: string,
    newMessages: { role: string; content: string }[],
  ) => {
    try {
      await api.post(`/chat/sessions/${sessionId}/messages`, {
        messages: newMessages,
      });
      await loadSessions();
    } catch {
      // Do not block chat if history saving fails.
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || chatLoading) return;

    const userMsg: Message = {
      role: 'user',
      content: input,
      time: new Date(),
    };

    const history = messages.slice(-8).map(message => ({
      role: message.role,
      content: message.content,
    }));

    const currentInput = input;

    setMessages(current => [...current, userMsg]);
    setInput('');
    setChatLoading(true);

    try {
      let sessionId = currentSessionId;

      if (!sessionId) {
        try {
          const res = await api.post('/chat/sessions', {
            title: currentInput.slice(0, 50),
          });

          sessionId = res.data.session.sessionId;
          setCurrentSessionId(sessionId);
        } catch {
          sessionId = null;
        }
      }

      const res = await aiAPI.chat({
        message: currentInput,
        history,
      });

      const assistantMsg: Message = {
        role: 'assistant',
        content: res.data.reply,
        time: new Date(),
      };

      setMessages(current => [...current, assistantMsg]);

      if (sessionId) {
        await saveToHistory(sessionId, [
          { role: 'user', content: currentInput },
          { role: 'assistant', content: res.data.reply },
        ]);
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t('ai.connectionError');

      setMessages(current => [
        ...current,
        {
          role: 'assistant',
          content: `❌ ${message}`,
          time: new Date(),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const loadTabData = async () => {
    setTabLoading(true);
    setTabData(null);

    try {
      let res;

      if (activeTab === 'suggest') {
        res = await aiAPI.suggestPriority();
      } else if (activeTab === 'schedule') {
        res = await aiAPI.autoSchedule({
          date: scheduleDate,
          workingHours: user?.workingHours,
        });
      } else if (activeTab === 'analysis') {
        res = await aiAPI.productivityAnalysis(analysisDay);
      } else if (activeTab === 'reminders') {
        res = await aiAPI.smartReminders();
      }

      setTabData(res?.data);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        t('ai.unknownError');

      toast.error(message);
    } finally {
      setTabLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'chat') {
      setTabData(null);
    }
  }, [activeTab]);

  const toggleVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error(t('ai.voiceUnsupported'));
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = language === 'vi' ? 'vi-VN' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      setInput(event.results[0][0].transcript);
      setIsRecording(false);
    };
    recognition.onerror = () => setIsRecording(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  return (
    <div className="space-y-5 animate-fade-in h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg animate-float">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">AI Assistant</h1>
            <p className="text-slate-400 text-xs">Powered by Groq • Llama 3.1</p>
          </div>
        </div>

        {activeTab === 'chat' && (
          <div className="flex items-center gap-2">
            <button
              onClick={createNewSession}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white text-xs transition-all"
            >
              <Plus size={13} /> {t('ai.new')}
            </button>

            <button
              onClick={() => {
                setShowSessions(!showSessions);
                loadSessions();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white text-xs transition-all"
            >
              <MessageSquare size={13} /> {t('ai.history')} ({sessions.length})
            </button>
          </div>
        )}
      </div>

      {/* Session history panel */}
      <AnimatePresence>
        {showSessions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="glass rounded-2xl overflow-hidden flex-shrink-0"
          >
            <div className="p-3 border-b border-white/5 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                {t('ai.chatHistory')}
              </span>
              <button
                onClick={() => setShowSessions(false)}
                className="text-slate-500 hover:text-white"
              >
                <ChevronLeft size={14} />
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto">
              {sessionsLoading ? (
                <div className="p-4 text-center text-slate-500 text-xs">
                  {t('ai.loading')}
                </div>
              ) : sessions.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-xs">
                  {t('ai.noChatHistory')}
                </div>
              ) : (
                sessions.map(session => (
                  <div
                    key={session.sessionId}
                    onClick={() => loadSession(session.sessionId)}
                    className={`flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 cursor-pointer transition-all group ${
                      currentSessionId === session.sessionId
                        ? 'bg-cyan-500/10 border-l-2 border-cyan-500'
                        : ''
                    }`}
                  >
                    <MessageSquare size={14} className="text-slate-500 flex-shrink-0" />

                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 text-xs font-medium truncate">
                        {session.title}
                      </p>
                      <p className="text-slate-600 text-xs truncate">
                        {session.preview}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-slate-600 text-xs">
                        {session.messageCount} {t('ai.messages')}
                      </span>

                      <button
                        onClick={event => deleteSession(session.sessionId, event)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-all"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-600 p-1 rounded-xl flex-shrink-0 overflow-x-auto">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              activeTab === id
                ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-400 border border-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Chat tab */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col glass rounded-2xl overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    message.role === 'assistant'
                      ? 'bg-gradient-to-br from-cyan-500 to-violet-500'
                      : 'bg-dark-400 border border-white/10'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <Bot size={16} className="text-white" />
                  ) : (
                    <User size={16} className="text-slate-300" />
                  )}
                </div>

                <div
                  className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                    message.role === 'assistant'
                      ? 'bg-dark-500 border border-white/5 text-slate-200'
                      : 'bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/20 text-white'
                  }`}
                >
                  {message.content}
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
                    {[0, 0.2, 0.4].map(delay => (
                      <span
                        key={delay}
                        className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"
                        style={{ animationDelay: `${delay}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {quickPrompts.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-slate-400 hover:text-white hover:border-cyan-500/30 transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <div className="p-4 border-t border-white/5">
            {currentSessionId && (
              <p className="text-slate-600 text-xs mb-2 flex items-center gap-1">
                <MessageSquare size={10} /> {t('ai.savingHistory')}
              </p>
            )}

            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  value={input}
                  onChange={event => setInput(event.target.value)}
                  onKeyDown={event =>
                    event.key === 'Enter' && !event.shiftKey && sendMessage()
                  }
                  className="input-dark pr-10 w-full"
                  placeholder={t('ai.messagePlaceholder')}
                />

                <button
                  onClick={toggleVoice}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
                    isRecording
                      ? 'text-rose-400 animate-pulse'
                      : 'text-slate-500 hover:text-cyan-400'
                  }`}
                >
                  {isRecording ? <MicOff size={15} /> : <Mic size={15} />}
                </button>
              </div>

              <button
                onClick={sendMessage}
                disabled={chatLoading || !input.trim()}
                className="btn-primary px-4 flex-shrink-0 flex items-center justify-center"
              >
                {chatLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Other tabs */}
      {activeTab !== 'chat' && (
        <div className="flex-1 glass rounded-2xl p-5 overflow-y-auto min-h-0">
          <div className="flex items-center justify-between mb-5">
            <div>
              {activeTab === 'analysis' && (
                <select
                  value={analysisDay}
                  onChange={event => setAnalysisDay(+event.target.value)}
                  className="input-dark text-xs"
                >
                  <option value={7}>{t('ai.last7Days')}</option>
                  <option value={14}>{t('ai.last14Days')}</option>
                  <option value={30}>{t('ai.last30Days')}</option>
                </select>
              )}

              {activeTab === 'schedule' && (
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={event => setScheduleDate(event.target.value)}
                  className="input-dark text-xs"
                />
              )}
            </div>

            <button
              onClick={loadTabData}
              disabled={tabLoading}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              {tabLoading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
              {tabLoading ? t('ai.analyzing') : t('ai.analyzeWithAI')}
            </button>
          </div>

          {!tabData && !tabLoading && (
            <div className="text-center py-16">
              <Sparkles size={48} className="mx-auto text-slate-700 mb-4" />
              <p className="text-slate-400 font-medium">
                {t('ai.startAnalyzeHint')}
              </p>
            </div>
          )}

          {tabLoading && (
            <div className="space-y-3">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="h-20 skeleton rounded-xl" />
              ))}
            </div>
          )}

          {activeTab === 'suggest' && tabData && (
            <div className="space-y-4">
              {tabData.summary && (
                <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                  <p className="text-cyan-300 text-sm leading-relaxed">{tabData.summary}</p>
                </div>
              )}

              <div className="space-y-3">
                {(tabData.suggestions || []).map((suggestion: any, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-xl bg-white/3 border border-white/5 hover:border-white/10 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {index + 1}
                      </span>

                      <div className="flex-1">
                        <p className="font-semibold text-white text-sm">
                          {suggestion.task?.title || suggestion.title}
                        </p>
                        <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                          {suggestion.reason}
                        </p>

                        {suggestion.urgencyScore !== undefined && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-slate-500">
                              {t('ai.urgency')}:
                            </span>
                            <div className="flex-1 h-1.5 bg-dark-400 rounded-full">
                              <div
                                className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full"
                                style={{ width: `${suggestion.urgencyScore}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-cyan-400">
                              {suggestion.urgencyScore}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'schedule' && tabData && (
            <div className="space-y-4">
              {(tabData.schedule || []).map((slot: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-4 p-4 rounded-xl bg-white/3 border border-white/5"
                >
                  <div className="text-right flex-shrink-0 w-24">
                    <p className="text-cyan-400 font-mono text-xs font-semibold">
                      {slot.startTime}
                    </p>
                    <p className="text-slate-600 font-mono text-xs">
                      {slot.endTime}
                    </p>
                  </div>

                  <div className="w-px bg-white/10 self-stretch" />

                  <div>
                    <p className="font-semibold text-white text-sm">{slot.title}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{slot.reason}</p>
                  </div>
                </motion.div>
              ))}

              {tabData.tips?.length > 0 && (
                <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 mt-4">
                  <p className="text-violet-300 text-xs font-semibold mb-2">
                    💡 {t('ai.tipsFromAI')}:
                  </p>
                  {tabData.tips.map((tip: string, index: number) => (
                    <p key={index} className="text-slate-300 text-xs mt-1">
                      • {tip}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'analysis' && tabData && (
            <div className="space-y-4">
              {tabData.analysis?.score !== undefined && (
                <div className="p-5 rounded-xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-white/10 text-center">
                  <p className="text-slate-400 text-sm mb-2">
                    {t('ai.productivityScore')}
                  </p>
                  <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">
                    {tabData.analysis.score}
                    <span className="text-2xl text-slate-500">/100</span>
                  </p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: t('ai.totalTasks'), val: tabData.stats?.total, color: 'text-cyan-400' },
                  { label: t('ai.completed'), val: tabData.stats?.completed, color: 'text-emerald-400' },
                  { label: t('ai.rate'), val: `${tabData.stats?.completionRate}%`, color: 'text-violet-400' },
                ].map(({ label, val, color }) => (
                  <div
                    key={label}
                    className="p-3 rounded-xl bg-white/3 border border-white/5 text-center"
                  >
                    <p className={`text-xl font-bold ${color}`}>{val}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {tabData.analysis?.analysis && (
                <div className="p-4 rounded-xl bg-white/3 border border-white/5">
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {tabData.analysis.analysis}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {tabData.analysis?.strengths?.length > 0 && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-emerald-400 text-xs font-semibold mb-2">
                      ✅ {t('ai.strengths')}
                    </p>
                    {tabData.analysis.strengths.map((strength: string, index: number) => (
                      <p key={index} className="text-slate-300 text-xs mt-1">
                        • {strength}
                      </p>
                    ))}
                  </div>
                )}

                {tabData.analysis?.improvements?.length > 0 && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-amber-400 text-xs font-semibold mb-2">
                      🎯 {t('ai.improvements')}
                    </p>
                    {tabData.analysis.improvements.map((item: string, index: number) => (
                      <p key={index} className="text-slate-300 text-xs mt-1">
                        • {item}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'reminders' && tabData && (
            <div className="space-y-3">
              {(tabData.reminders || []).length === 0 ? (
                <p className="text-center text-slate-500 py-8">
                  {t('ai.noUpcomingReminders')}
                </p>
              ) : (
                (tabData.reminders || []).map((reminder: any, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-xl border ${
                      reminder.urgency === 'high'
                        ? 'bg-rose-500/10 border-rose-500/20'
                        : reminder.urgency === 'medium'
                          ? 'bg-amber-500/10 border-amber-500/20'
                          : 'bg-blue-500/10 border-blue-500/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Bell
                        size={16}
                        className={
                          reminder.urgency === 'high'
                            ? 'text-rose-400'
                            : reminder.urgency === 'medium'
                              ? 'text-amber-400'
                              : 'text-blue-400'
                        }
                      />
                      <div>
                        <p className="font-semibold text-white text-sm">
                          {reminder.title}
                        </p>
                        <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                          {reminder.message}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
