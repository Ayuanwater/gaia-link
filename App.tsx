
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GenerateContentResponse, Chat } from "@google/genai";
import { 
  Fingerprint, 
  ArrowRight,
  Bluetooth,
  CloudLightning,
  Mountain,
  Usb,
  Settings,
  StopCircle,
  Globe
} from 'lucide-react';

// Types & Services
import { 
  AppState, 
  RitualStep, 
  Message, 
  Persona, 
  BrainwaveState, 
  BluetoothDevice,
  SerialPort,
  Language
} from './types';
import { initAI } from './services/geminiService';
import { ChatView } from './components/ChatView';
import { EEGVisualizer } from './components/EEGVisualizer';

// ----------------------------------------------------------------------
// TRANSLATION DICTIONARY
// ----------------------------------------------------------------------
const TRANSLATIONS = {
  en: {
    introTitle: "Gaia Link",
    introSubtitle: "Neural Interface",
    introBtn: "Connect Consciousness",
    intentionTitle: "Establish Intention",
    intentionPlaceholder: "Input query or subject of analysis...",
    proceedBtn: "Proceed",
    selectTitle: "Select Analysis Core",
    fatherName: "Sky Father (Logical/Rational)",
    fatherDesc: "Pattern Recognition: DIRECT",
    motherName: "Earth Mother (Intellectual/Gentle)",
    motherDesc: "Pattern Recognition: HOLISTIC",
    step1Title: "Stabilize Alpha Waves (Sync)",
    step1Desc: "Calm your mind. The system is calibrating baseline.",
    step2Title: "Engage Beta Waves (Focus)",
    step2Desc: "Concentrate on the objective. Locking active signal.",
    linkStabilized: "Neural Link Stabilized",
    awaitingInput: "Awaiting input stream...",
    signalOptimal: "Signal: Optimal",
    signalAdjust: "Signal: Adjust Sensor",
    neuralStream: "Neural Stream",
    endSession: "End Session & Process Data",
    analyzing: "Analyzing Neural Patterns...",
    synthesizing: "Synthesizing Archetypal Data..."
  },
  zh: {
    introTitle: "天地链接",
    introSubtitle: "自然接口",
    introBtn: "连接意识",
    intentionTitle: "与我们分享",
    intentionPlaceholder: "今天想聊些什么...",
    proceedBtn: "继续",
    selectTitle: "选择分析核心",
    fatherName: "天父 (逻辑/理性)",
    fatherDesc: "模式识别：直接",
    motherName: "地母 (知性/温柔)",
    motherDesc: "模式识别：整体",
    step1Title: "稳定 Alpha 波 (同步)",
    step1Desc: "平静思绪。系统正在校准基线。",
    step2Title: "激活 Beta 波 (聚焦)",
    step2Desc: "专注于目标。锁定活跃信号。",
    linkStabilized: "链接已稳定",
    awaitingInput: "等待回应...",
    signalOptimal: "信号：最佳",
    signalAdjust: "信号：调整传感器",
    neuralStream: "脑电数据流",
    endSession: "结束会话并处理数据",
    analyzing: "正在分析脑电模式...",
    synthesizing: "正在综合原型数据..."
  }
};

// ----------------------------------------------------------------------
// ANCIENT COIN COMPONENT (Visual Only)
// ----------------------------------------------------------------------
const AncientCoin = ({ 
    side, 
    isGlowing, 
    isLocked,
    size = 'normal'
}: { 
    side: 'front' | 'back'; 
    isGlowing: boolean;
    isLocked: boolean; 
    size?: 'small' | 'normal';
}) => {
    const sizeClasses = size === 'small' ? 'w-16 h-16 md:w-20 md:h-20' : 'w-32 h-32';
    
    return (
        <div className={`relative ${sizeClasses} transition-all duration-1000 transform ${isLocked ? 'scale-110 drop-shadow-[0_0_30px_rgba(251,191,36,0.6)]' : 'scale-100'}`}>
            {/* Outer Glow */}
            <div className={`absolute inset-0 rounded-full bg-amber-500/20 blur-xl transition-opacity duration-500 ${isGlowing ? 'opacity-100' : 'opacity-20'}`}></div>
            
            {/* The Coin Body */}
            <div className={`w-full h-full rounded-full border-[6px] md:border-[8px] flex items-center justify-center relative shadow-2xl transition-colors duration-500
                ${isLocked ? 'border-amber-400 bg-amber-900/80' : isGlowing ? 'border-amber-600 bg-nature-deep' : 'border-stone-700 bg-stone-900'}
            `}>
                {/* Square Hole */}
                <div className="w-1/4 h-1/4 border-2 border-amber-700/50 bg-nature-dark transform rotate-45 absolute z-10 shadow-inner"></div>
                
                {/* Content */}
                {side === 'front' ? (
                    <div className={`absolute inset-0 flex items-center justify-center font-serif font-bold text-amber-500/80 select-none pointer-events-none transition-opacity duration-1000 ${isGlowing ? 'opacity-100 text-amber-300' : 'opacity-50'}`}>
                        {/* Tian Ren He Yi Layout */}
                        <span className="absolute top-1 md:top-2 text-[10px] md:text-xs">天</span>
                        <span className="absolute bottom-1 md:bottom-2 text-[10px] md:text-xs">人</span>
                        <span className="absolute right-1 md:right-2 text-[10px] md:text-xs">合</span>
                        <span className="absolute left-1 md:left-2 text-[10px] md:text-xs">一</span>
                    </div>
                ) : (
                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${isGlowing ? 'opacity-100' : 'opacity-30'}`}>
                        {/* Simple decorative lines */}
                        <div className="w-2/3 h-2/3 border border-amber-600/30 rounded-full"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------
// CONFIGURATION FOR NEUROSKY TGAM (ThinkGear)
// ----------------------------------------------------------------------
const EEG_CONFIG = {
  OPTIONAL_SERVICES: [
      '0000ffe0-0000-1000-8000-00805f9b34fb', 
      '0000fe39-0000-1000-8000-00805f9b34fb'
  ]
};

// ThinkGear Protocol Constants
const TG_SYNC = 0xAA;
const CODE_SIGNAL_QUALITY = 0x02;
const CODE_ATTENTION = 0x04;
const CODE_MEDITATION = 0x05;

const GaiaLinkApp = () => {
  // App Flow State
  const [appState, setAppState] = useState<AppState>(AppState.LANGUAGE_SELECT);
  const [language, setLanguage] = useState<Language>('en');
  const [intention, setIntention] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<Persona>('FATHER');
  const [ritualStep, setRitualStep] = useState<RitualStep>(RitualStep.CONNECT);
  
  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const [communionWhisper, setCommunionWhisper] = useState<string>("");
  
  // Device/EEG State
  const [eegState, setEegState] = useState<BrainwaveState>('IDLE');
  const [eegConnected, setEegConnected] = useState(false);
  const [bluetoothDevice, setBluetoothDevice] = useState<BluetoothDevice | null>(null);
  const [serialPort, setSerialPort] = useState<SerialPort | null>(null);
  
  // NeuroSky Data
  const [signalQuality, setSignalQuality] = useState<number>(200); 
  const [attention, setAttention] = useState<number>(0);
  const [meditation, setMeditation] = useState<number>(0);

  // Hidden Divination Data Capture
  const [capturedAlpha, setCapturedAlpha] = useState<number | null>(null);
  const [capturedBeta, setCapturedBeta] = useState<number | null>(null);

  // Connection settings
  const [baudRate, setBaudRate] = useState<number>(57600);
  const parserBufferRef = useRef<number[]>([]);

  // Refs for capture logic
  const captureTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const whisperIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const meditationRef = useRef(0);
  const attentionRef = useRef(0);

  // Translation Helper
  const t = TRANSLATIONS[language];

  useEffect(() => { meditationRef.current = meditation; }, [meditation]);
  useEffect(() => { attentionRef.current = attention; }, [attention]);

  const selectLanguage = (lang: Language) => {
    setLanguage(lang);
    setAppState(AppState.INTRO);
  };

  const startJourney = () => {
    setAppState(AppState.INTENTION);
    setEegState('IDLE');
  };

  const submitIntention = () => {
    if (!intention.trim()) return;
    setAppState(AppState.PERSONA_SELECT);
  };

  const selectPersona = (p: Persona) => {
    setSelectedPersona(p);
    setAppState(AppState.RITUAL);
    setRitualStep(RitualStep.CONNECT);
  };

  /**
   * ----------------------------------------------------------------
   * NEUROSKY PARSING
   * ----------------------------------------------------------------
   */
  const parsePacketPayload = (payload: number[]) => {
      let i = 0;
      while (i < payload.length) {
          const code = payload[i];
          if (code >= 0x80) {
              const len = payload[i + 1]; 
              i += 2 + len;
          } else {
              const val = payload[i + 1];
              if (code === CODE_SIGNAL_QUALITY) setSignalQuality(val);
              else if (code === CODE_ATTENTION) setAttention(val);
              else if (code === CODE_MEDITATION) setMeditation(val);
              i += 2;
          }
      }
  };

  const parseThinkGearData = () => {
      const buffer = parserBufferRef.current;
      let processed = 0;
      while (buffer.length >= 4) {
          if (buffer[0] !== TG_SYNC || buffer[1] !== TG_SYNC) {
              buffer.shift();
              processed++;
              if (processed > 500) break;
              continue;
          }
          const payloadLength = buffer[2];
          if (payloadLength > 169) {
             buffer.shift(); buffer.shift(); buffer.shift();
             continue;
          }
          const packetSize = 3 + payloadLength + 1;
          if (buffer.length < packetSize) break;

          let checksumAccumulator = 0;
          for (let i = 0; i < payloadLength; i++) checksumAccumulator += buffer[3 + i];
          const calculatedChecksum = (~checksumAccumulator) & 0xFF;
          
          if (calculatedChecksum === buffer[3 + payloadLength]) {
              const payload = buffer.slice(3, 3 + payloadLength);
              parsePacketPayload(payload);
          }
          for(let k=0; k<packetSize; k++) buffer.shift();
      }
  };

  const ingestBytes = useCallback((newBytes: number[]) => {
     if (parserBufferRef.current.length > 2048) parserBufferRef.current = []; 
     parserBufferRef.current.push(...newBytes);
     parseThinkGearData();
  }, []);

  /**
   * ----------------------------------------------------------------
   * CONNECTION HANDLERS
   * ----------------------------------------------------------------
   */
  const connectBluetooth = async () => {
    if (!navigator.bluetooth) return alert("Web Bluetooth not supported");
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: EEG_CONFIG.OPTIONAL_SERVICES
      });
      const server = await device.gatt?.connect();
      if (!server) return;
      
      let service;
      try { service = await server.getPrimaryService('0000ffe0-0000-1000-8000-00805f9b34fb'); } catch {}
      if (!service) return alert("Service not found");
      
      const characteristic = await service.getCharacteristic('0000ffe1-0000-1000-8000-00805f9b34fb');
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (e: any) => {
          const value: DataView = e.target.value;
          const bytes = [];
          for (let i = 0; i < value.byteLength; i++) bytes.push(value.getUint8(i));
          ingestBytes(bytes);
      });

      setBluetoothDevice(device);
      setEegConnected(true);
      setRitualStep(RitualStep.SYNC);
      setEegState('CALM');
    } catch (e) { console.error(e); }
  };

  const connectSerial = async () => {
      if (!navigator.serial) return alert("Web Serial not supported");
      try {
          const port = await navigator.serial.requestPort();
          await port.open({ baudRate: baudRate });
          setSerialPort(port);
          setEegConnected(true);
          setRitualStep(RitualStep.SYNC);
          setEegState('CALM');
          readSerialLoop(port);
      } catch (e) { console.error(e); }
  };

  const readSerialLoop = async (port: SerialPort) => {
      if (!port.readable) return;
      const reader = port.readable.getReader();
      try {
          while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              if (value) ingestBytes(Array.from(value));
          }
      } finally { reader.releaseLock(); setEegConnected(false); setEegState('IDLE'); }
  };

  const simulateData = () => {
      // For testing without device
      setEegConnected(true);
      setRitualStep(RitualStep.SYNC);
      setEegState('CALM');
      const interval = setInterval(() => {
          setMeditation(Math.floor(Math.random() * 40) + 40); // 40-80
          setAttention(Math.floor(Math.random() * 40) + 40); // 40-80
          setSignalQuality(0);
      }, 1000);
      return () => clearInterval(interval);
  };

  /**
   * ----------------------------------------------------------------
   * RITUAL LOGIC
   * ----------------------------------------------------------------
   */
  // Initialization of Chat session for Whispers
  useEffect(() => {
     if (eegConnected && !chatSessionRef.current) {
        const chat = initAI(selectedPersona, language);
        if (chat) chatSessionRef.current = chat;
     }
  }, [eegConnected, selectedPersona, language]);

  useEffect(() => {
      if (!eegConnected) return;

      // Visualizer State Logic
      if (ritualStep === RitualStep.SYNC || ritualStep === RitualStep.COMMUNION) {
          if (meditation > 40) setEegState('CALM');
          else setEegState('IDLE');
      } else if (ritualStep === RitualStep.FOCUS) {
          if (attention > 40) setEegState('FOCUS');
          else setEegState('STRESSED');
      }

      // Signal Quality Check
      if (signalQuality > 50 && !(!bluetoothDevice && !serialPort)) { 
          if (captureTimeoutRef.current) clearTimeout(captureTimeoutRef.current);
          return;
      }

      // --- STEP 1: SYNC (Capture Alpha) ---
      if (ritualStep === RitualStep.SYNC) {
          if (meditation > 35) {
             if (!captureTimeoutRef.current) {
                 captureTimeoutRef.current = setTimeout(() => {
                     setCapturedAlpha(meditationRef.current);
                     setRitualStep(RitualStep.FOCUS);
                     setEegState('FOCUS');
                     captureTimeoutRef.current = null;
                 }, 2500); 
             }
          } else {
              if (captureTimeoutRef.current) {
                  clearTimeout(captureTimeoutRef.current);
                  captureTimeoutRef.current = null;
              }
          }
      } 
      // --- STEP 2: FOCUS (Capture Beta) ---
      else if (ritualStep === RitualStep.FOCUS) {
          if (attention > 35) {
              if (!captureTimeoutRef.current) {
                  captureTimeoutRef.current = setTimeout(() => {
                      setCapturedBeta(attentionRef.current);
                      // Move to Communion instead of straight to Chat
                      setRitualStep(RitualStep.COMMUNION);
                      setEegState('CALM'); 
                      captureTimeoutRef.current = null;
                  }, 2500);
              }
          } else {
               if (captureTimeoutRef.current) {
                  clearTimeout(captureTimeoutRef.current);
                  captureTimeoutRef.current = null;
              }
          }
      }
  }, [ritualStep, attention, meditation, signalQuality, eegConnected]);

  // --- WHISPER LOGIC (COMMUNION STEP) ---
  useEffect(() => {
      if (ritualStep === RitualStep.COMMUNION) {
          const fetchWhisper = async () => {
              if (!chatSessionRef.current) return;
              try {
                  const stateDesc = meditationRef.current > 50 ? "Relaxed/Stable" : attentionRef.current > 50 ? "Focused/Active" : "Unstable";
                  const prompt = `[MODE: WHISPER] Current State: ${stateDesc}. Give me one short, factual sentence observing my mental state. No metaphors. Professional tone. e.g. "Neural stability is increasing." or "Focus levels are fluctuating."`;
                  
                  const result = await chatSessionRef.current.sendMessage({ message: prompt });
                  if (result.text) {
                      setCommunionWhisper(result.text);
                  }
              } catch (e) {
                  console.log("Whisper error", e);
              }
          };

          // Fetch immediately then every 8 seconds
          fetchWhisper();
          whisperIntervalRef.current = setInterval(fetchWhisper, 8000);

          return () => {
              if (whisperIntervalRef.current) clearInterval(whisperIntervalRef.current);
          };
      }
  }, [ritualStep]);


  /**
   * ----------------------------------------------------------------
   * FINAL ANALYSIS
   * ----------------------------------------------------------------
   */
  const finishRitualAndChat = async () => {
    if (whisperIntervalRef.current) clearInterval(whisperIntervalRef.current);
    setAppState(AppState.ANALYSIS);
    await performInitialAnalysis();
  };

  const performInitialAnalysis = async () => {
    try {
      if (!chatSessionRef.current) {
          const chat = initAI(selectedPersona, language);
          if (chat) chatSessionRef.current = chat;
          else throw new Error("No AI");
      }
      
      // --- MEIHUA ALGORITHM ---
      const num1 = capturedAlpha || 8; 
      const num2 = capturedBeta || 8;
      let upper = num1 % 8; if (upper === 0) upper = 8;
      let lower = num2 % 8; if (lower === 0) lower = 8;
      let moving = (num1 + num2) % 6; if (moving === 0) moving = 6;

      const prompt = `
        [MODE: PARENTAL_CONNECTION]
        [INPUT_ENERGY: Upper=${upper}, Lower=${lower}]
        [INTENTION: "${intention}"]
        INSTRUCTION: Act as my ${selectedPersona}. Read my energy state from the inputs (do not mention numbers). 
        1. Start with warm, parental comfort about my current state (e.g. if I seem tired/stressed/happy).
        2. Then, only if I asked a question in my intention, guide me gently.
      `;

      const result = await chatSessionRef.current.sendMessageStream({ message: prompt });
      setAppState(AppState.CHAT);
      
      const msgId = Date.now();
      setMessages([{ role: 'user', text: intention, timestamp: Date.now() - 1000 }, { role: 'model', text: '', timestamp: msgId, isStreaming: true }]);

      let fullText = "";
      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
           fullText += c.text;
           setMessages(prev => prev.map(m => m.timestamp === msgId ? { ...m, text: fullText } : m));
        }
      }
       setMessages(prev => prev.map(m => m.timestamp === msgId ? { ...m, isStreaming: false } : m));
    } catch (error) {
      console.error(error);
      setAppState(AppState.CHAT);
    }
  };

  const sendChatMessage = async (text: string) => {
    if (!text.trim() || !chatSessionRef.current) return;
    const userMsg: Message = { role: 'user', text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsAiThinking(true);
    const modelMsgId = Date.now() + 1;
    setMessages(prev => [...prev, { role: 'model', text: '', timestamp: modelMsgId, isStreaming: true }]);
    try {
      const result = await chatSessionRef.current.sendMessageStream({ message: text });
      let fullText = "";
      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
            fullText += c.text;
            setMessages(prev => prev.map(m => m.timestamp === modelMsgId ? { ...m, text: fullText } : m));
        }
      }
      setMessages(prev => prev.map(m => m.timestamp === modelMsgId ? { ...m, isStreaming: false } : m));
    } catch (e) {
      setMessages(prev => prev.map(m => m.timestamp === modelMsgId ? { ...m, text: "Data stream interrupted...", isStreaming: false } : m));
    } finally { setIsAiThinking(false); }
  };

  // --- RENDER HELPERS ---
  const renderLanguageSelect = () => (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center space-y-12 animate-fade-in">
       <div className="flex items-center gap-3">
         <Globe className="text-nature-moss w-8 h-8" />
         <h1 className="text-2xl font-display text-nature-light tracking-wider">LANGUAGE SELECT</h1>
       </div>
       <div className="flex flex-col md:flex-row gap-6">
         <button onClick={() => selectLanguage('en')} className="px-12 py-6 bg-nature-deep border border-nature-earth hover:border-nature-moss hover:bg-nature-deep/80 transition-all rounded-xl group">
            <h2 className="text-xl font-display text-nature-light group-hover:text-nature-moss mb-2">English</h2>
            <p className="text-nature-earth text-sm font-mono">System Interface</p>
         </button>
         <button onClick={() => selectLanguage('zh')} className="px-12 py-6 bg-nature-deep border border-nature-earth hover:border-nature-moss hover:bg-nature-deep/80 transition-all rounded-xl group">
            <h2 className="text-xl font-serif text-nature-light group-hover:text-nature-moss mb-2">中文</h2>
            <p className="text-nature-earth text-sm font-mono">系统界面</p>
         </button>
       </div>
    </div>
  );

  const renderIntro = () => (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center space-y-8 animate-float">
      <Fingerprint className="w-24 h-24 text-nature-moss opacity-50" />
      <h1 className="text-5xl md:text-7xl font-display text-nature-light tracking-wider">
        {t.introTitle} <br/> <span className="text-xl md:text-2xl mt-2 block text-nature-earth uppercase tracking-[0.5em]">{t.introSubtitle}</span>
      </h1>
      <button onClick={startJourney} className="px-8 py-4 bg-nature-deep border border-nature-earth hover:bg-nature-moss hover:text-nature-dark transition-all rounded-full font-display uppercase tracking-widest text-sm">
        {t.introBtn}
      </button>
    </div>
  );

  const renderIntention = () => (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 max-w-3xl mx-auto w-full animate-fade-in">
      <h2 className="text-3xl font-display text-nature-light mb-8">{t.intentionTitle}</h2>
      <textarea
        value={intention}
        onChange={(e) => setIntention(e.target.value)}
        placeholder={t.intentionPlaceholder}
        className="w-full h-48 bg-nature-deep/50 border border-nature-earth rounded-xl p-6 text-lg text-nature-light focus:outline-none focus:border-nature-moss transition-colors font-serif resize-none mb-8"
      />
      <button onClick={submitIntention} disabled={!intention.trim()} className="flex items-center gap-3 px-8 py-3 bg-nature-moss text-white rounded-full font-display transition-all hover:bg-nature-leaf disabled:opacity-50">
        {t.proceedBtn} <ArrowRight size={18} />
      </button>
    </div>
  );

  const renderPersonaSelect = () => (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 max-w-4xl mx-auto w-full animate-fade-in">
      <h2 className="text-3xl font-display text-nature-light mb-12">{t.selectTitle}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        <button onClick={() => selectPersona('FATHER')} className="p-12 rounded-2xl bg-nature-deep/30 border border-nature-earth hover:border-sky-500 hover:bg-sky-900/10 transition-all flex flex-col items-center gap-4 group">
          <CloudLightning size={64} className="text-nature-mist group-hover:text-sky-400" />
          <h3 className="text-2xl font-display text-nature-light">{t.fatherName}</h3>
          <span className="text-xs text-nature-earth font-mono">{t.fatherDesc}</span>
        </button>
        <button onClick={() => selectPersona('MOTHER')} className="p-12 rounded-2xl bg-nature-deep/30 border border-nature-earth hover:border-emerald-500 hover:bg-emerald-900/10 transition-all flex flex-col items-center gap-4 group">
          <Mountain size={64} className="text-nature-mist group-hover:text-emerald-400" />
          <h3 className="text-2xl font-display text-nature-light">{t.motherName}</h3>
           <span className="text-xs text-nature-earth font-mono">{t.motherDesc}</span>
        </button>
      </div>
    </div>
  );

  const renderRitual = () => {
    // Current Coin State
    const isStep1 = ritualStep === RitualStep.SYNC;
    const isStep2 = ritualStep === RitualStep.FOCUS;
    const isCommunion = ritualStep === RitualStep.COMMUNION;
    
    // Coin Glow Logic
    const isGlowing = (isStep1 && meditation > 35) || (isStep2 && attention > 35) || isCommunion;
    const isLocked = (isStep1 && capturedAlpha !== null) || (isStep2 && capturedBeta !== null) || isCommunion;

    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 max-w-2xl mx-auto w-full animate-fade-in relative">
        
        {/* Connection Setup (Only visible at start) */}
        {ritualStep === RitualStep.CONNECT && (
           <div className="flex flex-col items-center gap-6 mb-12 animate-fade-in">
             <div className="flex items-center gap-2 bg-nature-deep px-4 py-2 rounded-lg border border-nature-earth/50">
                 <Settings size={14} className="text-nature-mist"/>
                 <select value={baudRate} onChange={(e) => setBaudRate(Number(e.target.value))} className="bg-transparent text-nature-moss text-sm font-mono focus:outline-none">
                     <option value="9600">9600</option>
                     <option value="57600">57600</option>
                     <option value="115200">115200</option>
                 </select>
             </div>
             <div className="flex gap-4">
                 <button onClick={connectSerial} className="px-8 py-4 bg-stone-800 border border-stone-600 hover:bg-stone-700 text-white rounded-full font-display uppercase flex items-center gap-2 transition-all">
                   <Usb size={20} /> USB
                 </button>
                 <button onClick={connectBluetooth} className="px-8 py-4 bg-blue-900/30 border border-blue-800 hover:bg-blue-900/50 text-white rounded-full font-display uppercase flex items-center gap-2 transition-all">
                   <Bluetooth size={20} /> Bluetooth
                 </button>
             </div>
             <button onClick={() => { simulateData(); }} className="text-xs text-nature-earth hover:text-nature-light underline mt-4">Dev: Simulate</button>
           </div>
        )}

        {/* RITUAL STEPS */}
        {(isStep1 || isStep2 || isCommunion) && (
            <div className="flex flex-col items-center w-full justify-center gap-8 animate-fade-in">
                
                {/* 1. COIN AT TOP */}
                <div className="mb-2">
                     <AncientCoin 
                        side={isStep1 ? 'front' : 'back'} 
                        isGlowing={isGlowing} 
                        isLocked={isLocked}
                        size="small"
                     />
                </div>

                {/* 2. INSTRUCTIONS / WHISPERS */}
                <div className="text-center space-y-2 h-24 flex flex-col justify-center">
                    {!isCommunion ? (
                      <>
                        <h2 className="text-2xl font-display text-nature-light">
                            {isStep1 ? t.step1Title : t.step2Title}
                        </h2>
                        <p className="text-nature-mist font-serif text-sm opacity-80 max-w-md mx-auto">
                            {isStep1 ? t.step1Desc : t.step2Desc}
                        </p>
                      </>
                    ) : (
                      <>
                        <h2 className="text-xl font-display text-nature-moss animate-pulse">
                           {t.linkStabilized}
                        </h2>
                        <p className="text-nature-light/90 font-serif text-lg italic max-w-lg mx-auto leading-relaxed animate-fade-in">
                           "{communionWhisper || t.awaitingInput}"
                        </p>
                      </>
                    )}
                </div>

                {/* 3. EEG VISUALIZER */}
                <div className="w-full max-w-lg bg-nature-deep/40 p-6 rounded-2xl border border-nature-earth/10 mt-4 backdrop-blur-sm relative overflow-hidden">
                    <div className="flex justify-between items-center mb-2 px-1 relative z-10">
                        <span className="text-[10px] text-nature-earth uppercase tracking-widest font-mono">{t.neuralStream}</span>
                        {signalQuality < 50 && <span className="text-[10px] text-nature-moss animate-pulse font-mono">{t.signalOptimal}</span>}
                        {signalQuality >= 50 && <span className="text-[10px] text-amber-500 animate-pulse font-mono">{t.signalAdjust}</span>}
                    </div>
                    <EEGVisualizer 
                        state={eegState} 
                        height={120} 
                        showStatus={false} 
                        isRealDevice={eegConnected} 
                    />
                </div>

                {/* 4. DISCONNECT BUTTON (COMMUNION ONLY) */}
                {isCommunion && (
                    <button 
                      onClick={finishRitualAndChat}
                      className="group flex items-center gap-3 px-8 py-3 bg-red-900/20 border border-red-800/50 hover:bg-red-900/40 transition-all rounded-full text-red-100 font-display tracking-widest uppercase text-xs mt-4 animate-fade-in"
                    >
                      <StopCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      {t.endSession}
                    </button>
                )}
            </div>
        )}
      </div>
    );
  };

  const renderAnalysis = () => (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-24 h-24 border-4 border-nature-earth border-t-nature-moss rounded-full animate-spin mb-8"></div>
      <h3 className="text-2xl font-display text-nature-light animate-pulse">
        {t.analyzing}
      </h3>
      <p className="text-nature-earth mt-4 font-mono text-sm">{t.synthesizing}</p>
    </div>
  );

  return (
    <div className="bg-nature-dark min-h-screen text-nature-light selection:bg-nature-moss selection:text-white">
      {appState === AppState.LANGUAGE_SELECT && renderLanguageSelect()}
      {appState === AppState.INTRO && renderIntro()}
      {appState === AppState.INTENTION && renderIntention()}
      {appState === AppState.PERSONA_SELECT && renderPersonaSelect()}
      {appState === AppState.RITUAL && renderRitual()}
      {appState === AppState.ANALYSIS && renderAnalysis()}
      {appState === AppState.CHAT && (
        <ChatView 
          messages={messages}
          onSendMessage={sendChatMessage}
          isAiThinking={isAiThinking}
          eegState={eegState}
          onResetEEG={() => setEegState('CALM')}
          isRealDevice={eegConnected}
          persona={selectedPersona}
          language={language}
        />
      )}
    </div>
  );
};

export default GaiaLinkApp;
