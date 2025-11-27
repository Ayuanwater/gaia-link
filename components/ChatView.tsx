
import React, { useState, useRef, useEffect } from 'react';
import { 
  Trees, 
  Sparkles, 
  Send, 
  Heart,
  Wifi,
  Bluetooth
} from 'lucide-react';
import { Message, BrainwaveState, Persona, Language } from '../types';
import { EEGVisualizer } from './EEGVisualizer';

interface ChatViewProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isAiThinking: boolean;
  eegState: BrainwaveState;
  onResetEEG: () => void;
  isRealDevice: boolean;
  persona: Persona;
  language: Language;
}

const UI_TEXT = {
  en: {
    father: "SKY FATHER (LOGIC CORE)",
    mother: "EARTH MOTHER (INTELLECT CORE)",
    sysLogic: "SYSTEM LOGIC",
    sysInsight: "SYSTEM INSIGHT",
    linkActive: "BIO-LINK ACTIVE",
    deviceLinked: "EEG DEVICE LINKED",
    inputPlaceholder: "Input query parameters...",
    realStream: "Real EEG Data Stream Active",
    interfaceActive: "Neural Interface Active",
    processing: "Processing Data...",
    ready: "System Ready"
  },
  zh: {
    father: "天父 (逻辑核心)",
    mother: "地母 (知性核心)",
    sysLogic: "系统逻辑",
    sysInsight: "系统洞察",
    linkActive: "生物链接激活",
    deviceLinked: "脑电设备已连接",
    inputPlaceholder: "输入查询参数...",
    realStream: "实时脑电数据流激活",
    interfaceActive: "神经接口激活",
    processing: "数据处理中...",
    ready: "系统就绪"
  }
};

export const ChatView: React.FC<ChatViewProps> = ({ 
  messages, 
  onSendMessage, 
  isAiThinking, 
  eegState, 
  onResetEEG,
  isRealDevice,
  persona,
  language
}) => {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const t = UI_TEXT[language];

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAiThinking]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue("");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-nature-dark animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-nature-earth/30 flex items-center justify-between bg-nature-deep/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="relative">
               <Trees className="text-nature-moss" />
               <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse border border-nature-dark"></div>
          </div>
          <div>
            <h3 className="font-display text-nature-light text-sm md:text-base">
              {persona === 'FATHER' ? t.father : t.mother}
            </h3>
            <span className="text-[10px] md:text-xs text-nature-earth flex items-center gap-1 uppercase tracking-widest">
              {isRealDevice ? <Bluetooth size={10} className="text-blue-400"/> : <Wifi size={10}/>}
              {isRealDevice ? t.deviceLinked : t.linkActive}
            </span>
          </div>
        </div>
        <div className="w-24 md:w-40 h-10 block">
           <EEGVisualizer state={eegState} height={40} showStatus={false} isRealDevice={isRealDevice} />
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] md:max-w-2xl p-5 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-nature-earth/30 border border-nature-earth/50 rounded-tr-none' 
                : 'bg-nature-deep/80 border border-nature-moss/30 rounded-tl-none shadow-[0_0_30px_-10px_rgba(22,101,52,0.3)]'
            }`}>
              {msg.role === 'model' && (
                <div className="flex items-center gap-2 mb-3 text-nature-moss/80">
                  <Sparkles size={14} />
                  <span className="text-xs font-display uppercase tracking-wider">
                    {persona === 'FATHER' ? t.sysLogic : t.sysInsight}
                  </span>
                </div>
              )}
              <p className={`font-serif text-lg leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'text-nature-light' : 'text-nature-mist'}`}>
                {msg.text}
                {msg.isStreaming && <span className="inline-block w-1 h-4 ml-1 bg-nature-moss animate-pulse align-middle"></span>}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-nature-earth/30 bg-nature-dark">
        <div className="max-w-4xl mx-auto flex gap-4">
          <button 
            className="p-3 text-nature-earth hover:text-nature-moss transition-colors hidden md:block"
            title="Reset Connection"
            onClick={onResetEEG}
          >
            <Heart size={24} />
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t.inputPlaceholder}
              className="w-full bg-nature-deep border border-nature-earth rounded-full px-6 py-4 text-nature-light focus:outline-none focus:border-nature-moss pr-12 font-serif"
            />
            <button 
              onClick={handleSend}
              disabled={!inputValue.trim() || isAiThinking}
              className="absolute right-2 top-2 p-2 bg-nature-moss text-white rounded-full hover:bg-nature-leaf disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
        <p className="text-center text-nature-earth text-[10px] mt-4 font-serif italic opacity-60">
          {isRealDevice ? t.realStream : t.interfaceActive} • {isAiThinking ? t.processing : t.ready}
        </p>
      </div>
    </div>
  );
};
