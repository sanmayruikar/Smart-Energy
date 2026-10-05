import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  User,
  Send,
  Sparkles,
  Zap,
  TrendingDown,
  BrainCircuit,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import api from '../services/api';

const suggestedPrompts = [
  'How much energy did I use today?',
  'Which appliance consumes the most power?',
  'What was my peak usage?',
  'Why is my consumption high?',
  'How can I reduce my electricity bill?',
  'Predict tomorrow\'s consumption.',
  'Are there any anomalies?',
];

const AIAssistant = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        '👋 Hello! I am your **AI Energy Assistant** integrated with your ESP32 sensors, MongoDB energy datastore, and Machine Learning models.\n\nAsk me any question about your live energy consumption, top consuming appliances, peak demands, bill-saving strategies, or ML forecasts.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (queryText) => {
    const text = queryText || input;
    if (!text.trim() || loading) return;

    const userMsg = {
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: text });
      if (res.success && res.data) {
        const botMsg = {
          role: 'assistant',
          content: res.data.response,
          metadata: res.data.metadata,
          timestamp: new Date(res.data.timestamp || Date.now()),
        };
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Sorry, I encountered an error communicating with the energy intelligence backend: ${err.message}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderFormattedMessage = (content) => {
    // Basic Markdown line-by-line renderer
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Bold replacement
      let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      formattedLine = formattedLine.replace(/\*(.*?)\*/g, '<em>$1</em>');

      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li
            key={idx}
            className="ml-4 list-disc my-1"
            dangerouslySetInnerHTML={{ __html: formattedLine.substring(2) }}
          />
        );
      }
      if (line.match(/^\d+\.\s/)) {
        return (
          <li
            key={idx}
            className="ml-4 list-decimal my-1"
            dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^\d+\.\s/, '') }}
          />
        );
      }
      return (
        <p
          key={idx}
          className="my-1 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formattedLine }}
        />
      );
    });
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-xl overflow-hidden">
      {/* Assistant Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">AI Energy Assistant</h3>
            <p className="text-xs text-indigo-400">Context-Aware Real-Time Energy Intelligence</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Connected to Live Telemetry & Database</span>
        </div>
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="px-4 py-2.5 bg-slate-950/30 border-b border-slate-800/80 flex items-center space-x-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
          Suggestions:
        </span>
        {suggestedPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(p)}
            className="px-3 py-1 rounded-full bg-slate-800/80 hover:bg-indigo-600/30 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-200 border border-slate-700/60 text-xs whitespace-nowrap transition"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat Messages Thread */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={idx}
              className={`flex items-start space-x-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-xl p-4 rounded-2xl text-xs sm:text-sm shadow-md ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-950/70 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                <div>{renderFormattedMessage(m.content)}</div>
                <div className="mt-2 text-[10px] text-right opacity-60 font-mono">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-950/70 border border-slate-800 text-slate-400 p-4 rounded-2xl rounded-tl-none text-xs flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
              <span className="ml-2 font-mono">Analyzing energy metrics & historical records...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Box Footer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center space-x-3"
      >
        <input
          type="text"
          placeholder="Ask a question (e.g. 'How much energy did I use today?')"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition shadow-inner"
        />

        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition flex items-center space-x-2 shadow-lg shadow-indigo-600/20"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline text-xs font-semibold">Send</span>
        </button>
      </form>
    </div>
  );
};

export default AIAssistant;
