// Utility: Convert spoken numbers and dates to numeric and DD/MM/YYYY format
function preprocessSpokenText(text: string) {
  // Map for numbers
  const numberWords: Record<string, string> = {
    'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
    'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10',
    'eleven': '11', 'twelve': '12', 'thirteen': '13', 'fourteen': '14', 'fifteen': '15',
    'sixteen': '16', 'seventeen': '17', 'eighteen': '18', 'nineteen': '19', 'twenty': '20'
  };
  // Map for months
  const monthWords: Record<string, string> = {
    'january': '01', 'february': '02', 'march': '03', 'april': '04', 'may': '05', 'june': '06',
    'july': '07', 'august': '08', 'september': '09', 'october': '10', 'november': '11', 'december': '12'
  };
  let out = text;
  // Replace single number words with digits (only if not part of a date phrase)
  out = out.replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\b/gi, (m) => numberWords[m.toLowerCase()] ?? m);
  // Replace date phrases like 'one january 2024' with '01/01/2024'
  out = out.replace(/\b(\d{1,2}|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})\b/gi,
    (match, d, m, y) => {
      // Convert day to number if word
      let day = d;
      if (numberWords[day.toLowerCase()]) day = numberWords[day.toLowerCase()];
      day = day.padStart(2, '0');
      const month = monthWords[m.toLowerCase()] ?? m;
      return `${day}/${month}/${y}`;
    }
  );
  return out;
}
// Utility: Convert HTML to plain text for speech (pauses for <br>, etc.)
function htmlToSpeechText(html: string) {
  // Replace <br> and <br/> with a pause (use ". " for natural break)
  let text = html.replace(/<br\s*\/?>/gi, '. ');
  // Remove all other HTML tags
  text = text.replace(/<[^>]+>/g, '');
  // Replace multiple dots with a single dot and space
  text = text.replace(/\.{2,}/g, '. ');
  // Remove extra spaces
  text = text.replace(/\s+([.,!?])/g, '$1').replace(/\s+/g, ' ').trim();
  // Fix: join split Hindi words/letters (remove spaces between Devanagari chars)
  text = text.replace(/([\u0900-\u097F])\s+([\u0900-\u097F])/g, '$1$2');
  return text;
}

// Utility: Convert HTML to formatted text for display (replace <br> with \n)
function htmlToDisplayText(html: string) {
  return html.replace(/<br\s*\/?>/gi, '\n');
}
import { useState, useRef, useEffect } from "react";
// Ref to track if chatbot is open (prevents async callbacks after close)
const isChatbotActiveRef = { current: true };
// Modern floating welcome popup for chatbot
function ChatbotWelcomePopup({ visible, onClose }) {
  return (
    <div
      className={`fixed bottom-24 right-6 z-[999] transition-all duration-500 ${visible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}
      style={{ minWidth: 270, maxWidth: 360 }}
    >
      <div className="relative flex items-center gap-3 px-6 py-4 rounded-3xl shadow-2xl border border-gray-200 bg-gradient-to-br from-gray-50 via-gray-200 to-gray-100 animate-fade-in" style={{ boxShadow: '0 8px 32px 0 #a3a3a355, 0 1.5px 8px #6b728055' }}>
        {/* Sparkle animation */}
        <span className="absolute right-4 top-2 pointer-events-none">
          <svg width="28" height="18" viewBox="0 0 28 18" fill="none"><g><circle cx="6" cy="6" r="2.5" fill="#fbbf24"><animate attributeName="r" values="2.5;4;2.5" dur="1.8s" repeatCount="indefinite"/></circle><circle cx="18" cy="10" r="1.5" fill="#818cf8"><animate attributeName="r" values="1.5;3;1.5" dur="2.2s" repeatCount="indefinite"/></circle><circle cx="24" cy="4" r="1.2" fill="#38bdf8"><animate attributeName="r" values="1.2;2.2;1.2" dur="1.5s" repeatCount="indefinite"/></circle></g></svg>
        </span>
        <span className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 via-gray-400 to-gray-600 border border-gray-300 shadow-md">
          <ChatBotIcon className="w-8 h-8" animated={false} />
        </span>
        <div className="flex-1">
          <div className="font-bold text-gray-800 text-lg leading-tight tracking-wide">Need help?</div>
          <div className="text-xs text-gray-500 mt-1">I'm Digi, your AI assistant.<br/>Click to chat or ask anything!</div>
        </div>
        <button className="ml-2 text-gray-400 hover:text-gray-700 text-xl font-bold" onClick={onClose} aria-label="Close welcome popup">×</button>
      </div>
      <style>{`
        .animate-fade-in { animation: fadeInPop .7s; }
        @keyframes fadeInPop { from { opacity: 0; transform: translateY(24px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  );
}

// For language detection and translation
// npm install franc-min google-translate-api-browser

import { franc } from 'franc-min';
// import translate from 'google-translate-api-browser'; // Removed due to missing module
// Inject Siri animation CSS if not present
function injectSiriWaveCSS() {
  if (typeof document !== 'undefined' && !document.getElementById('siri-wave-style')) {
    const style = document.createElement('style');
    style.id = 'siri-wave-style';
    style.innerHTML = `@keyframes siri-wave { 0%,100%{height:0.5rem;} 50%{height:2rem;} }\n.animate-siri-wave { animation: siri-wave 1.2s infinite ease-in-out; }`;
    document.head.appendChild(style);
  }
}

import { API_BASE_URL } from "@/config/api";

// Modern AI-themed female robot SVG avatar
// Floating Chatbot Icon (outside modal) - AI animated, vibrant, rotating circles
function ChatBotIcon({ className = "", animated = false }) {
  if (!animated) {
    // Simple, non-animated robot icon for card, etc. Use className and sizing as provided.
    return (
      <span className={className} style={{ display: 'inline-block' }}>
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ width: '100%', height: '100%' }}>
          <defs>
            <radialGradient id="faceGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f3f4f6" />
              <stop offset="100%" stopColor="#d1d5db" />
            </radialGradient>
            <linearGradient id="bodyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e5e7eb" />
              <stop offset="100%" stopColor="#9ca3af" />
            </linearGradient>
          </defs>
          <g>
            <g>
              <ellipse cx="32" cy="28" rx="18" ry="16" fill="url(#faceGradient)" stroke="#6b7280" strokeWidth="2.5" />
              <ellipse cx="23" cy="32" rx="2.5" ry="1.5" fill="#d1d5db" />
              <ellipse cx="41" cy="32" rx="2.5" ry="1.5" fill="#d1d5db" />
              <ellipse cx="25.5" cy="28" rx="2" ry="2.5" fill="#374151" />
              <ellipse cx="38.5" cy="28" rx="2" ry="2.5" fill="#374151" />
              <path d="M27 36 Q32 39 37 36" stroke="#6b7280" strokeWidth="1.7" fill="none" strokeLinecap="round" />
              <rect x="30.5" y="10" width="3" height="10" rx="1.5" fill="#9ca3af" />
              <circle cx="32" cy="10" r="3" fill="#9ca3af" stroke="#6b7280" strokeWidth="1.2" />
            </g>
            <ellipse cx="14" cy="30" rx="3" ry="7" fill="#9ca3af" opacity="0.7" />
            <ellipse cx="50" cy="30" rx="3" ry="7" fill="#9ca3af" opacity="0.7" />
            <g>
              <ellipse cx="32" cy="54" rx="14" ry="8" fill="url(#bodyGradient)" stroke="#6b7280" strokeWidth="2.5" />
              <ellipse cx="32" cy="44" rx="7" ry="2.5" fill="#a3a3a3" opacity="0.7" />
            </g>
          </g>
        </svg>
      </span>
    );
  }
  // Animated version (floating/chat window)
  return (
    <span className={className} style={{ display: 'inline-block', width: 52, height: 48, position: 'relative' }}>
      {/* Animated orbiting rings around the robot */}
      {/* ...existing code for animated version... */}
      {animated && (
        <>
          <span style={{
            position: 'absolute', left: '-8px', top: '-8px', width: 68, height: 68, zIndex: 1,
            pointerEvents: 'none',
          }}>
            <svg width="68" height="68" viewBox="0 0 68 68" style={{ position: 'absolute', left: 0, top: 0 }}>
              <circle cx="34" cy="34" r="30" fill="none" stroke="white" strokeWidth="3" strokeDasharray="18 12" strokeLinecap="round">
                <animateTransform attributeName="transform" type="rotate" from="0 34 34" to="360 34 34" dur="2.2s" repeatCount="indefinite" />
              </circle>
            </svg>
          </span>
          <span style={{
            position: 'absolute', left: '-16px', top: '-16px', width: 84, height: 84, zIndex: 1,
            pointerEvents: 'none',
          }}>
            {/* <svg width="84" height="84" viewBox="0 0 84 84" style={{ position: 'absolute', left: 0, top: 0 }}>
              <circle cx="42" cy="42" r="38" fill="none" stroke="#b0b3b8" strokeWidth="2" strokeDasharray="10 14" strokeLinecap="round">
                <animateTransform attributeName="transform" type="rotate" from="0 42 42" to="360 42 42" dur="3.1s" repeatCount="indefinite" />
              </circle>
            </svg> */}
          </span>
          {/* Optional: glowing pulse at center */}
          <span style={{
            position: 'absolute', left: 8, top: 8, width: 32, height: 32, borderRadius: '50%',
            background: 'radial-gradient(circle at 60% 40%, #e5e7eb 0%, #9ca3af 60%, #fff0 100%)',
            filter: 'blur(2.5px)', opacity: 0.7, zIndex: 2,
            animation: 'ai-pulse 1.8s infinite cubic-bezier(.4,0,.2,1)'
          }} />
          <style>{`
            @keyframes ai-pulse {
              0%,100% { opacity: 0.7; transform: scale(1); }
              50% { opacity: 0.3; transform: scale(1.13); }
            }
          `}</style>
        </>
      )}
      {/* Main avatar (above animation) */}
      <span style={{ position: 'absolute', left: 0, top: 0, zIndex: 3, display: 'inline-block', width: 52, height: 48 }}>
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 52, height: 48 }}>
          <defs>
            <radialGradient id="faceGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f3f4f6" />
              <stop offset="100%" stopColor="#d1d5db" />
            </radialGradient>
            <linearGradient id="bodyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e5e7eb" />
              <stop offset="100%" stopColor="#9ca3af" />
            </linearGradient>
          </defs>
          {/* Animated head group */}
          <g>
            <g className={animated ? 'chatbot-head-tilt' : ''} style={{ transformOrigin: '32px 28px' }}>
              {/* Head */}
              <ellipse cx="32" cy="28" rx="18" ry="16" fill="url(#faceGradient)" stroke="#6b7280" strokeWidth="2.5" />
              {/* Cheeks */}
              <ellipse cx="23" cy="32" rx="2.5" ry="1.5" fill="#d1d5db" />
              <ellipse cx="41" cy="32" rx="2.5" ry="1.5" fill="#d1d5db" />
              {/* Eyes (animated blink) */}
              <ellipse cx="25.5" cy="28" rx="2" ry="2.5" fill="#374151" className={animated ? 'chatbot-eye-blink' : ''} />
              <ellipse cx="38.5" cy="28" rx="2" ry="2.5" fill="#374151" className={animated ? 'chatbot-eye-blink' : ''} />
              {/* Smile (subtle movement) */}
              <path d="M27 36 Q32 39 37 36" stroke="#6b7280" strokeWidth="1.7" fill="none" strokeLinecap="round" className={animated ? 'chatbot-smile-move' : ''} />
              {/* Antenna */}
              <rect x="30.5" y="10" width="3" height="10" rx="1.5" fill="#9ca3af" />
              <circle cx="32" cy="10" r="3" fill="#9ca3af" stroke="#6b7280" strokeWidth="1.2" />
            </g>
            {/* Headset */}
            <ellipse cx="14" cy="30" rx="3" ry="7" fill="#9ca3af" opacity="0.7" />
            <ellipse cx="50" cy="30" rx="3" ry="7" fill="#9ca3af" opacity="0.7" />
            {/* Body (animated subtle up/down) */}
            <g className={animated ? 'chatbot-body-bounce' : ''} style={{ transformOrigin: '32px 54px' }}>
              <ellipse cx="32" cy="54" rx="14" ry="8" fill="url(#bodyGradient)" stroke="#6b7280" strokeWidth="2.5" />
              {/* Collar */}
              <ellipse cx="32" cy="44" rx="7" ry="2.5" fill="#a3a3a3" opacity="0.7" />
            </g>
          </g>
        </svg>
        {/* Animations for head tilt, eye blink, smile, and body bounce */}
        {animated && (
          <style>{`
            @keyframes chatbot-head-tilt {
              0%, 100% { transform: rotate(-7deg); }
              20% { transform: rotate(7deg); }
              40% { transform: rotate(-5deg); }
              60% { transform: rotate(5deg); }
              80% { transform: rotate(-7deg); }
            }
            .chatbot-head-tilt {
              animation: chatbot-head-tilt 3.2s cubic-bezier(.4,0,.2,1) infinite;
            }
            @keyframes chatbot-eye-blink {
              0%, 92%, 100% { ry: 2.5; }
              94%, 98% { ry: 0.3; }
            }
            .chatbot-eye-blink {
              animation: chatbot-eye-blink 3.2s cubic-bezier(.4,0,.2,1) infinite;
            }
            @keyframes chatbot-smile-move {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(1.5px); }
            }
            .chatbot-smile-move {
              animation: chatbot-smile-move 3.2s cubic-bezier(.4,0,.2,1) infinite;
            }
            @keyframes chatbot-body-bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(2.5px); }
            }
            .chatbot-body-bounce {
              animation: chatbot-body-bounce 3.2s cubic-bezier(.4,0,.2,1) infinite;
            }
          `}</style>
        )}
      </span>
    </span>
  );
}

// Send icon
function SendIcon({ className = "" }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
}

// Typing indicator
function TypingIndicator() {
  return (
    <div className="flex items-center space-x-1 px-3 py-2 bg-gray-200 rounded-lg max-w-[80%]">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
      <span className="text-xs text-gray-500 ml-2">Assistant is typing...</span>
    </div>
  );
}

type Message = {
  from: string;
  text: string;
  timestamp: Date;
  isHtml?: boolean;
  isDeviceButtons?: boolean;
};

import { useNavigate } from "react-router-dom";

function ChatBot() {
  // Welcome popup state
  const [showWelcome, setShowWelcome] = useState(false);
  // For remounting the chatbot for a fresh state
  const [instanceKey, setInstanceKey] = useState(0);
  useEffect(() => { injectSiriWaveCSS(); }, []); // inject Siri CSS on mount
  // Show welcome popup on window load
  useEffect(() => {
    setShowWelcome(true);
    const timer = setTimeout(() => setShowWelcome(false), 4000);
    return () => clearTimeout(timer);
  }, []);
  const navigate = useNavigate();
  // Map spoken commands to sidebar routes
  const commandRouteMap: Record<string, string> = {
    // Dashboard routes
    "open dashboard": "/dashboard",
    "open employee master": "/dashboard/employeeMasterScreen",
    "open site master": "/dashboard/branchMaster",
    "open role master": "/dashboard/menuAccessScreen",
    "open device master": "/dashboard/deviceMaster",
    "open group master": "/dashboard/groupMasterScreen",
    "open alerts dashboard": "/dashboard/inputStatusDetails",
    "open all alerts report": "/dashboard/AllAlertsReport",
    "open email log": "/dashboard/emailLog",
    "open sms log": "/dashboard/smsLog",
    "open email scheduler": "/dashboard/EmailScheduler",
    "open social media report": "/dashboard/SocialMediaReport",
    "open help center": "/dashboard/helpCenter",
    "open manual sync": "/dashboard/manualSync",
    "open uptime report": "/dashboard/upTimeReport",
    "open branch report": "/dashboard/SystemWiseBranchReport",
    "open whatsapp log": "/dashboard/WhatsAppLog",
    "open call log": "/dashboard/CallLog",
    "open all reports": "/dashboard/AllReports",
    // Main routes
    "open login": "/",
    "open make and model": "/makeandmodel",
    "open system integrator": "/systemIntegrator",
    "open quality check details": "/qualitycheckdetails",
    "open quality check table": "/qualitychecktable"
  };

  // Helper to check and navigate if user command matches
  const tryNavigateByCommand = (text: string) => {
    const normalized = text.trim().toLowerCase();
    for (const cmd in commandRouteMap) {
      if (normalized.includes(cmd)) {
        navigate(commandRouteMap[cmd]);
        return true;
      }
    }
    return false;
  };
  const [open, setOpen] = useState(false);
  // Track open/close in ref
  useEffect(() => { isChatbotActiveRef.current = open; }, [open]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loadingDevice, setLoadingDevice] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  // Modes: 'chat' or 'voice'
  const [mode, setMode] = useState<'chat' | 'voice'>('chat');
  // Separate histories for chat and voice
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      from: "bot",
      text: "Hi there! I'm Digi, your HMS assistant. How can I help you today?",
      timestamp: new Date()
    },
    {
      from: "system",
      text: "device-buttons",
      timestamp: new Date(),
      isDeviceButtons: true
    }
  ]);
  const [voiceMessages, setVoiceMessages] = useState<Message[]>([]);
  // Voice assistant states
  const [voiceState, setVoiceState] = useState<'idle' | 'greeting' | 'listening' | 'processing' | 'speaking' | 'followup' | 'stopped'>('idle');
  const [isListening, setIsListening] = useState(false); // for input field mic
  const [siriInterim, setSiriInterim] = useState("");
  const [lastBotText, setLastBotText] = useState("");
  const recognitionRef = useRef<any>(null);
  // For live spoken caption
  // For live spoken caption (line by line)
  const [liveCaption, setLiveCaption] = useState("");
  const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const followupTimeout = useRef<any>(null);

  // Animated avatar for listening (waveform) and speaking (speaker/person)
  function ListeningAvatar({ label, interim, liveCaption, listening, speaking, greeting, processing }: {
    label: string,
    interim?: string,
    liveCaption?: string,
    listening?: boolean,
    speaking?: boolean,
    greeting?: boolean,
    processing?: boolean
  }) {
    // Waveform bars for listening
    const bars = Array.from({ length: 7 });
    return (
      <div className="flex flex-col items-center justify-center w-full py-8 transition-all duration-500">
        {/* Greeting orb (wave-in) */}
        {greeting && (
          <div className="flex items-center justify-center mb-2 animate-greet-orb">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 via-cyan-300 to-purple-400 shadow-2xl animate-greet-orb-inner" />
            <style>{`
              @keyframes greet-orb {
                0% { opacity: 0; transform: scale(0.7); }
                60% { opacity: 1; transform: scale(1.1); }
                100% { opacity: 1; transform: scale(1); }
              }
              @keyframes greet-orb-inner {
                0% { box-shadow: 0 0 0 0 #fff0; }
                60% { box-shadow: 0 0 40px 10px #a5b4fc44; }
                100% { box-shadow: 0 0 24px 4px #a5b4fc33; }
              }
              .animate-greet-orb { animation: greet-orb 1s cubic-bezier(.4,0,.2,1); }
              .animate-greet-orb-inner { animation: greet-orb-inner 1.2s cubic-bezier(.4,0,.2,1); }
            `}</style>
          </div>
        )}
        {/* Processing spinner ring */}
        {processing && (
          <div className="flex items-center justify-center mb-2">
            <span className="relative flex h-16 w-16">
              <span className="absolute inset-0 rounded-full border-4 border-t-4 border-blue-400 border-t-purple-400 animate-spin-orb" style={{ boxShadow: '0 0 32px 4px #a5b4fc33' }} />
              <span className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-100 via-cyan-100 to-purple-100 opacity-80" />
            </span>
            <style>{`
              @keyframes spin-orb {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              .animate-spin-orb { animation: spin-orb 1.2s linear infinite; }
            `}</style>
          </div>
        )}
        {/* Listening waveform */}
        {listening && (
          <div className="flex items-end gap-1 mb-2 h-10 animate-fade-in">
            {bars.map((_, i) => (
              <div
                key={i}
                className="w-2 rounded bg-blue-500 animate-wave"
                style={{
                  height: `${8 + Math.abs(Math.sin(Date.now() / 200 + i) * 24)}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '1s',
                }}
              />
            ))}
            <style>{`
              @keyframes wave {
                0%, 100% { height: 10px; }
                50% { height: 40px; }
              }
              .animate-wave { animation: wave 1s infinite ease-in-out; }
              .animate-fade-in { animation: fadeIn 0.5s; }
              @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
          </div>
        )}
        {/* Speaking glowing orb with rotation and pulse */}
        {speaking && (
          <div className="flex flex-col items-center mb-2 animate-fade-in">
            <div className="relative flex items-center justify-center">
              <div className="absolute animate-orb-pulse w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 via-cyan-300 to-purple-400 opacity-60 blur-lg" />
              <div className="absolute animate-orb-pulse2 w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 via-blue-400 to-cyan-300 opacity-70 blur-md" />
              <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 via-cyan-400 to-purple-500 shadow-xl border-4 border-white animate-orb-zoom" />
              {/* Shimmer effect */}
              <div className="absolute w-14 h-14 rounded-full pointer-events-none overflow-hidden">
                <div className="absolute left-0 top-0 w-full h-full bg-gradient-to-r from-white/0 via-white/40 to-white/0 animate-shimmer" style={{filter:'blur(2px)'}} />
              </div>
              <style>{`
                @keyframes orb-pulse {
                  0%,100% { transform: scale(1); opacity: 0.6; }
                  50% { transform: scale(1.15); opacity: 0.3; }
                }
                @keyframes orb-pulse2 {
                  0%,100% { transform: scale(1); opacity: 0.7; }
                  50% { transform: scale(1.25); opacity: 0.2; }
                }
                @keyframes orb-zoom {
                  0%,100% { transform: scale(1); box-shadow: 0 0 32px 8px #a5b4fc55; }
                  50% { transform: scale(1.12); box-shadow: 0 0 48px 16px #60a5fa88; }
                }
                @keyframes shimmer {
                  0% { transform: translateX(-100%); opacity: 0.2; }
                  50% { transform: translateX(100%); opacity: 0.7; }
                  100% { transform: translateX(200%); opacity: 0.2; }
                }
                .animate-orb-pulse { animation: orb-pulse 1.2s infinite; }
                .animate-orb-pulse2 { animation: orb-pulse2 1.2s infinite 0.3s; }
                .animate-orb-zoom { animation: orb-zoom 1.3s infinite cubic-bezier(.4,0,.2,1); }
                .animate-shimmer { animation: shimmer 2.2s linear infinite; }
                .animate-fade-in { animation: fadeIn 0.5s; }
              `}</style>
            </div>
            {/* Modern chat bubble for live caption */}
            {liveCaption && (
              <div
                className="mt-6 px-4 py-2 rounded-2xl bg-white text-gray-800 border border-gray-200 shadow-sm text-sm text-left overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 animate-fade-in transition-all duration-300"
                style={{ letterSpacing: 0.2, maxHeight: '200px',maxWidth:'350px', minHeight: '2.2em' }}
              >
                {liveCaption}
              </div>
            )}
          </div>
        )}
        {/* Default/idle state */}
        {!greeting && !processing && !listening && !speaking && (
          <div className="w-8 h-8 mb-2 rounded-full bg-gray-300" />
        )}
        {/* Only show label if not speaking (to avoid duplicate 'Speaking...' text) */}
        {!speaking && <div className="mt-2 text-base text-gray-700 font-semibold animate-pulse">{label}</div>}
        {interim && <div className="mt-2 text-sm text-gray-500 italic">{interim}</div>}
      </div>
    );
  }

  // Add Siri wave animation to tailwind (add this to your global CSS if not present)
  // @keyframes siri-wave { 0%,100%{height:0.5rem;} 50%{height:2rem;} }
  // .animate-siri-wave { animation: siri-wave 1.2s infinite ease-in-out; }

  // Standard mic button (input field)
  const handleMicClick = () => {
    if (!SpeechRecognitionClass) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognitionClass();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-IN';
    }
    const recognition = recognitionRef.current;
    setIsListening(true);
    let finalTranscript = '';
    recognition.start();
    recognition.onresult = (event: any) => {
      if (!isChatbotActiveRef.current) return;
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      setInput(finalTranscript + interimTranscript);
    };
    recognition.onerror = () => {
      if (!isChatbotActiveRef.current) return;
      setIsListening(false);
    };
    recognition.onend = () => {
      if (!isChatbotActiveRef.current) return;
      setIsListening(false);
      // When closed, force remount for fresh state and clear all chat/voice/input state
      if (!open) {
        setTimeout(() => {
          setInstanceKey((k) => k + 1);
          setChatMessages([
            {
              from: "bot",
              text: "Hi there! I'm Digi, your HMS assistant. How can I help you today?",
              timestamp: new Date()
            },
            {
              from: "system",
              text: "device-buttons",
              timestamp: new Date(),
              isDeviceButtons: true
            }
          ]);
          setVoiceMessages([]);
          setInput("");
          setLiveCaption("");
          setLastBotText("");
          setVoiceState('idle');
          setSiriInterim("");
        }, 300);
      }
    };
  };

  // Stop all voice/speech/recognition on close or mode switch
  useEffect(() => {
    if ((mode === 'voice' && isListening) || !open) {
      setIsListening(false);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setVoiceState('idle');
      setSiriInterim("");
      setVoiceMessages([]);
    }
    // When closed, force remount for fresh state
    if (!open) {
      setTimeout(() => setInstanceKey((k) => k + 1), 300);
    }
  }, [mode, open]);

  // Siri-style voice input handler
  // Voice assistant full conversational loop
  // Helper to get Indian female voice
  // Always use the same Digi voice for all bot speech
  let cachedDigiVoice = null;
  function getDigiVoice() {
    if (cachedDigiVoice) return cachedDigiVoice;
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    let voice = voices.find(v => v.lang === 'en-IN' && v.name.toLowerCase().includes('female'))
      || voices.find(v => v.lang === 'en-IN' && v.name.toLowerCase().includes('girl'))
      || voices.find(v => v.lang === 'en-IN' && v.name.toLowerCase().includes('woman'))
      || voices.find(v => v.lang === 'en-IN' && v.name.toLowerCase().includes('indian'))
      || voices.find(v => v.lang === 'en-IN');
    cachedDigiVoice = voice || null;
    return cachedDigiVoice;
  }

  const startVoiceGreeting = () => {
    setMode('voice');
    setVoiceState('greeting');
    setSiriInterim("");
    setLiveCaption("");
    // Speak greeting
    const greeting = "Hey, I'm Digi, your personal assistant. How can I help you?";
    if ('speechSynthesis' in window) {
      const utter = new window.SpeechSynthesisUtterance(greeting);
      const digiVoice = getDigiVoice();
      if (digiVoice) utter.voice = digiVoice;
      utter.lang = 'en-IN';
      utter.rate = 0.97;
      utter.pitch = 0.98;
      utter.volume = 0.5;
      utter.onstart = () => { if (isChatbotActiveRef.current) setLiveCaption(greeting); };
      utter.onend = () => {
        if (!isChatbotActiveRef.current) return;
        setLiveCaption("");
        setVoiceState('listening');
        startVoiceListening();
      };
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          if (!isChatbotActiveRef.current) return;
          const digiVoice2 = getDigiVoice();
          if (digiVoice2) utter.voice = digiVoice2;
          window.speechSynthesis.speak(utter);
        };
      } else {
        window.speechSynthesis.speak(utter);
      }
    } else {
      setTimeout(() => {
        if (!isChatbotActiveRef.current) return;
        setVoiceState('listening');
        startVoiceListening();
      }, 1200);
    }
  };

  // Helper: Remove HTML tags and emojis for voice display
  function stripHtmlAndEmojis(text: string) {
    // Remove HTML tags
    let plain = text.replace(/<[^>]+>/g, '');
    // Remove emojis (basic unicode emoji range)
    plain = plain.replace(/[\u{1F600}-\u{1F6FF}\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
    // Remove extra spaces
    plain = plain.replace(/\s+/g, ' ').trim();
    return plain;
  }
  // Voice listening loop: always listen after speaking, no auto-stop
  // Parallel recognition for 'skip this' during speaking
  const skipRecognitionRef = useRef<any>(null);

  const startSkipRecognition = () => {
    if (!SpeechRecognitionClass) return;
    if (skipRecognitionRef.current) {
      try { skipRecognitionRef.current.stop(); } catch {}
    }
    skipRecognitionRef.current = new SpeechRecognitionClass();
    skipRecognitionRef.current.continuous = true;
    skipRecognitionRef.current.interimResults = true;
    skipRecognitionRef.current.lang = 'en-IN';
    skipRecognitionRef.current.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (transcript.trim().toLowerCase().includes('skip this')) {
          if ('speechSynthesis' in window) window.speechSynthesis.cancel();
          setVoiceState('listening');

          if (skipRecognitionRef.current) {
            try { skipRecognitionRef.current.stop(); } catch {}
          }
          setTimeout(() => startVoiceListening(), 200);
          return;
        }
      }
    };
    skipRecognitionRef.current.onerror = () => {
      try { skipRecognitionRef.current.stop(); } catch {}
    };
    skipRecognitionRef.current.onend = () => {};
    skipRecognitionRef.current.start();
  };

  const stopSkipRecognition = () => {
    if (skipRecognitionRef.current) {
      try { skipRecognitionRef.current.stop(); } catch {}
      skipRecognitionRef.current = null;
    }
  };

  const startVoiceListening = () => {
    if (!isChatbotActiveRef.current) return;
    stopSkipRecognition();
    if (!SpeechRecognitionClass) {
      alert('Speech recognition is not supported in this browser.');
      setVoiceState('stopped');
      return;
    }
    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognitionClass();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-IN';
    }
    setSiriInterim("");
    let finalTranscript = '';
    const recognition = recognitionRef.current;
    recognition.start();
    recognition.onresult = (event: any) => {
      if (!isChatbotActiveRef.current) return;
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      setSiriInterim(finalTranscript + interimTranscript);
    };
    recognition.onerror = () => {
      if (!isChatbotActiveRef.current) return;
      setVoiceState('stopped');
      setSiriInterim("");
    };
    recognition.onend = async () => {
      if (!isChatbotActiveRef.current) return;
      const userText = (finalTranscript + siriInterim).trim();
      setSiriInterim("");
      // --- Voice close/exit commands ---
      const closeCommands = [
        'close chat bot', 'exit', 'stop assistant', 'close assistant', 'exit chatbot', 'quit', 'band ho ja', 'band kar', 'band karo', 'band ho jao', 'ok thank you', 'thank you', 'thanks'
      ];
      if (userText) {
        // Preprocess for numbers and dates
        const processedText = preprocessSpokenText(userText);
        // Check for navigation command in voice mode
        if (tryNavigateByCommand(processedText)) {
          setVoiceState('stopped');
          setMessages((msgs) => [
            ...msgs,
            { from: "user", text: processedText, timestamp: new Date() },
            { from: "bot", text: "Opening as requested!", timestamp: new Date() }
          ]);
          return;
        }
        // Check for close/exit commands
        if (closeCommands.some(cmd => processedText.toLowerCase().includes(cmd))) {
          setOpen(false);
          setTimeout(() => setInstanceKey((k) => k + 1), 300); // force remount for fresh state
          return;
        }
        // --- Fix: Always process even short/1-word input ---
        setVoiceState('processing');
        setMessages((msgs) => [
          ...msgs,
          { from: "user", text: processedText, timestamp: new Date() }
        ]);
        try {
          const botResponse = await getBotResponse(processedText);
          // For voice: speak plain text, show only plain text (no HTML, no emoji)
          const speechText = (botResponse);
          // const speechText = stripHtmlAndEmojis(botResponse);
          setLastBotText(speechText);
          setMessages((msgs) => [
            ...msgs,
            { from: "bot", text: speechText, timestamp: new Date(), isHtml: false }
          ]);

          setVoiceState('speaking');
          if ('speechSynthesis' in window) {
            // Clean and split response by <br>, ignore special chars, speak line by line
            let lines = (speechText || "").split(/<br\s*\/?/i).map(l => l.trim()).filter(Boolean);
            // Remove special chars from each line
            lines = lines.map(l => l.replace(/[.,!@#$%^&*()_+=\[\]{}|;:'"<>/?`~\\-]/g, "").replace(/\s+/g, " ").trim()).filter(Boolean);
            const speakLines = (idx) => {
              if (!isChatbotActiveRef.current) return;
              if (idx >= lines.length) {
                setLiveCaption("");
                setVoiceState('listening');
                startVoiceListening();
                return;
              }
              const line = lines[idx];
              setLiveCaption(line);
              const utter = new window.SpeechSynthesisUtterance(line);
              const digiVoice = getDigiVoice();
              if (digiVoice) utter.voice = digiVoice;
              utter.lang = 'en-IN';
              utter.rate = 0.97;
              utter.pitch = 0.98;
              utter.volume = 0.3;
              utter.onend = () => {
                if (!isChatbotActiveRef.current) return;
                setTimeout(() => speakLines(idx + 1), 20);
              };
              window.speechSynthesis.cancel();
              window.speechSynthesis.speak(utter);
            };
            // Start skip recognition in parallel
            startSkipRecognition();
            if (window.speechSynthesis.getVoices().length === 0) {
              window.speechSynthesis.onvoiceschanged = () => { if (isChatbotActiveRef.current) speakLines(0); };
            } else {
              speakLines(0);
            }
          } else {
            setTimeout(() => {
              if (!isChatbotActiveRef.current) return;
              setLiveCaption("");
              setVoiceState('listening');
              startVoiceListening();
            }, 1200);
          }
        } catch (error) {

          setVoiceState('stopped');
          setMessages((msgs) => [
            ...msgs,
            { from: "bot", text: "I apologize, but I'm experiencing technical difficulties. Please try again later.", timestamp: new Date() }
          ]);
        }
      } else {
        // If userText is empty, still return to listening (no-op)
        setVoiceState('listening');
        startVoiceListening();
      }
    };
  };

  // Remove followup/timeout logic: always listen after speaking, no auto-stop
  useEffect(() => {
    return () => {

      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      stopSkipRecognition();
    };
  }, [open]);

  // Device buttons configuration
  const deviceButtons = [
    { key: "CCTV", label: "CCTV" },
    { key: "BACS", label: "BACS" },
    { key: "FAS", label: "Fire Alarm" },
    { key: "ETL", label: "ETL" },
    { key: "SAS", label: "Security Alarm" },
  ];

  const [messages, setMessages] = useState<Message[]>([
    {
      from: "bot",
      text: "Hi there! I'm Digi, your HMS assistant. How can I help you today?",
      timestamp: new Date()
    },
    {
      from: "system",
      text: "device-buttons",
      timestamp: new Date(),
      isDeviceButtons: true
    }
  ]);

  useEffect(() => {
    if (open && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [open, isTyping, chatMessages, voiceMessages, mode]);

  // Stop speechSynthesis and recognition when chat closes or mode changes
  useEffect(() => {
    if (!open || mode !== 'voice') {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      stopSkipRecognition();
      setVoiceState('idle');
      setSiriInterim("");

      setVoiceMessages([]);
    }
  }, [open, mode]);

  // Replace getBotResponse with your provided function
  // Language detection and translation logic
  const getBotResponse = async (userMessage: string) => {
    const branchCode = localStorage.getItem("branch");
    const apiUrl = `${API_BASE_URL}/proxy/ask`;
    // Detect language
    let lang = franc(userMessage);
    if (lang === 'und') lang = 'en';
    const requestBody = {
      query: userMessage,
      branchCode: branchCode,
      lang: lang
    };
    let data;
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      if (!response.ok) {
        throw new Error('API request failed');
      }
      const responseText = await response.text();
      try {
        data = JSON.parse(responseText);
      } catch (error) {
        data = { response: responseText.replace(/^Result:\s*/, '') };
      }
      if (!data || !data.response) {
        throw new Error('Invalid response structure');
      }
      // If user asked in Hindi, return response as is (translation module not available)
      if (lang === 'hin' && data.response) {
        return data.response;
      }
      return data.response.replace(/^Result:\s*/, '');
    } catch (error) {
      console.error('Bot API error:', error);
      if (typeof data !== "undefined" && data?.response) {
        return data.response.replace(/^Result:\s*/, '');
      }
      return "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again in a moment.";
    }
  };

  const handleSend = async () => {
    if (input.trim() === "") return;
    const userMessage = { from: "user", text: input, timestamp: new Date() };
    setChatMessages((msgs) => [...msgs, userMessage]);
    const currentInput = input;
    setInput("");

    // Check for navigation command
    if (tryNavigateByCommand(currentInput)) {
      setIsTyping(false);
      setChatMessages((msgs) => [
        ...msgs,
        { from: "bot", text: "Opening as requested!", timestamp: new Date() }
      ]);
      return;
    }

    setIsTyping(true);
    try {
      const botResponse = await getBotResponse(currentInput);
      setIsTyping(false);
      // Check if response contains HTML tags (like <br>)
      const htmlTagRegex = /<[^>]+>/;
      const isHtml = htmlTagRegex.test(botResponse);
      setChatMessages((msgs) => [
        ...msgs,
        { from: "bot", text: botResponse, timestamp: new Date(), ...(isHtml ? { isHtml: true } : {}) }
      ]);
    } catch (error) {
      setIsTyping(false);
      setChatMessages((msgs) => [
        ...msgs,
        { from: "bot", text: "I apologize, but I'm experiencing technical difficulties. Please try again later.", timestamp: new Date() }
      ]);
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Device API fetch and response formatting
  const fetchDeviceDetails = async (deviceKey: string, displayName: string) => {
    setIsTyping(true);
    setLoadingDevice(deviceKey);

    const branchCode = localStorage.getItem("branch") || "";

    try {
      const res = await fetch(`${API_BASE_URL}/getCountsByZoneStatus?branchCode=` + branchCode, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      const payload = data.payload || {};

      // Map device keys to API response keys
      const deviceMap: Record<string, string> = {
        CCTV: "CCTV",
        FAS: "Fire Alarm",
        SAS: "Security Alarm",
        ETL: "ETL",
        BACS: "BACS",
      };

      const deviceData = payload[deviceMap[deviceKey]];
      let responseText = "";

      if (deviceData) {
        responseText = `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.5;">
          <div style="color: #1e293b; font-size: 15px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
            <div style="width: 8px; height: 8px; background: #3b82f6; border-radius: 50%;"></div>
            ${displayName} SYSTEM STATUS
          </div>
          <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 12px; height: 12px; background: #10b981; border-radius: 50%; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);"></div>
                <span style="color: #374151; font-weight: 600; font-size: 14px;">Working</span>
              </div>
              <span style="color: #10b981; font-weight: 700; font-size: 16px; background: rgba(16, 185, 129, 0.1); padding: 4px 12px; border-radius: 20px;">${deviceData["Working"]}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 12px; height: 12px; background: #ef4444; border-radius: 50%; box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);"></div>
                <span style="color: #374151; font-weight: 600; font-size: 14px;">Not Working</span>
              </div>
              <span style="color: #ef4444; font-weight: 700; font-size: 16px; background: rgba(239, 68, 68, 0.1); padding: 4px 12px; border-radius: 20px;">${deviceData["Not Working"]}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 12px; height: 12px; background: #f59e0b; border-radius: 50%; box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);"></div>
                <span style="color: #374151; font-weight: 600; font-size: 14px;">Partially Working &nbsp;</span>
              </div>
              <span style="color: #f59e0b; font-weight: 700; font-size: 16px; background: rgba(245, 158, 11, 0.1); padding: 4px 15px; border-radius: 20px;">${deviceData["Partially Working"]}</span>
            </div>
          </div>
          <div style="margin-top: 12px; padding: 8px; background: rgba(59, 130, 246, 0.05); border-radius: 8px; border-left: 3px solid #3b82f6;">
            <div style="color: #1e40af; font-size: 12px; font-weight: 600;">
              Total Devices: ${deviceData["Working"] + deviceData["Not Working"] + deviceData["Partially Working"]}
            </div>
          </div>
        </div>`;
      } else {
        responseText = `<div style="padding: 16px; background: rgba(239, 68, 68, 0.05); border-radius: 12px; border: 1px solid rgba(239, 68, 68, 0.2);">
          <div style="color: #dc2626; font-weight: 600; display: flex; align-items: center; gap: 8px;">
            <div style="width: 12px; height: 12px; background: #dc2626; border-radius: 50%;"></div>
            Sorry, I couldn't find details for ${displayName}.
          </div>
        </div>`;
      }

      // Add the response to the chat messages so it shows in the chatbot
      setChatMessages((msgs) => [
        ...msgs,
        {
          from: "bot",
          text: responseText,
          timestamp: new Date(),
          isHtml: true
        }
      ]);

      setTimeout(() => {
        setIsTyping(false);
        setLoadingDevice(null);
      }, 500);
    } catch (error) {
      setIsTyping(false);
      setLoadingDevice(null);
      setChatMessages((msgs) => [
        ...msgs,
        {
          from: "bot",
          text: "Sorry, I couldn't fetch the device details right now. Please try again later.",
          timestamp: new Date(),
          isHtml: false
        }
      ]);
    }
  };

  // Remove outside click to close: Only close via close button or floating icon
  // (No-op: do not add any outside click handler)

  // Render device buttons component
  const renderDeviceButtons = () => (
    <div className="mt-3 p-3 sm:p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <span className="text-white text-xs">🔧</span>
        </div>
        <div className="text-sm text-slate-700 font-semibold">Device Monitoring</div>
      </div>
      <div className="space-y-2">
        {deviceButtons.map((dev, index) => (
          <button
            key={dev.key}
            className={`w-full p-2 sm:p-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-between
              ${loadingDevice === dev.key
                ? `bg-gradient-to-r from-blue-500 to-blue-600 text-white cursor-wait shadow-md`
                : `bg-white text-slate-700 border border-slate-200 shadow-sm hover:shadow-md hover:bg-slate-50`}
            `}
            disabled={!!loadingDevice}
            onClick={() => {
              setMessages((msgs) => [
                ...msgs,
                {
                  from: "user",
                  text: `Show me ${dev.label} details`,
                  timestamp: new Date(),
                },
              ]);
              fetchDeviceDetails(dev.key, dev.label);
            }}
            style={{
              animationDelay: `${index * 100}ms`,
            }}
          >
            <div className="flex items-center gap-1">
              <div className="flex flex-col items-start">
                <span className="font-semibold text-left">{dev.label}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {loadingDevice === dev.key ? (
                <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-200 flex items-center justify-center transition-all">
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-600 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-slate-200">
        <div className="text-xs text-slate-500 text-center">
          Click any device to view real-time status
        </div>
      </div>
    </div>
  );

  // Floating chatbot icon opens the chatbot and resets to chat mode
  const handleFabClick = () => {
    setOpen((v) => !v);
    setMode('chat');
    setShowWelcome(false);
  };

  // Header buttons for switching between chat and voice
  const handleTalkWithAIClick = () => {
    startVoiceGreeting();
  };
  const handleBackToChatClick = () => {
    setMode('chat');
    setVoiceState('idle');
    setSiriInterim("");
  };

  // Header rendering
  const renderHeader = () => (
    <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-gray-600 to-gray-900 text-white">
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 shadow bg-gradient-to-br from-gray-200 via-gray-400 to-gray-700">
          <ChatBotIcon className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>
        <div>
          <span className="font-semibold text-sm sm:text-base">DIGI : HMS Assistant</span>
          <div className="flex items-center space-x-1 text-xs opacity-90">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Online</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {mode === 'chat' ? (
          <button
            className={`px-3 py-1 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-xs font-semibold border border-white border-opacity-30 shadow transition-all flex items-center gap-1 text-blue-900`}
            onClick={handleTalkWithAIClick}
            aria-label="Talk with AI"
            style={{ minWidth: 90, color: '#1e293b' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-1"><ellipse cx="12" cy="12" rx="7" ry="11" stroke="currentColor" /><circle cx="12" cy="12" r="3" fill="currentColor" /></svg>
            <span>Talk with AI</span>
          </button>
        ) : (
          <button
            className="px-3 py-1 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-xs font-semibold border border-white border-opacity-30 shadow transition-all flex items-center gap-1 text-blue-900"
            onClick={handleBackToChatClick}
            aria-label="Back to Chat"
            style={{ minWidth: 90, color: '#1e293b', marginLeft: '15px' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-1"><path d="M15 18l-6-6 6-6" /></svg>
            <span>Back to Chat</span>
          </button>
        )}
        <button
          className="text-white text-xl w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white hover:bg-opacity-20"
          onClick={() => setOpen(false)}
          aria-label="Close Chatbot"
        >
          ×
        </button>
      </div>
    </div>
  );

  // Main area rendering
  const renderMainArea = () => (
    mode === 'chat' ? (
      <div
        className="flex-1 overflow-y-auto px-3 sm:px-4 py-2 sm:py-3 space-y-2 sm:space-y-3 bg-gray-50 relative"
        style={{ maxHeight: "calc(100vh - 12rem)", minHeight: "300px" }}
      >
        {chatMessages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.from === "user" ? "justify-end" :
              msg.from === "system" ? "justify-start" : "justify-start"}`}
          >
            {msg.isDeviceButtons ? (
              <div className="w-full">
                {renderDeviceButtons()}
              </div>
            ) : (
              <div className={`max-w-[85%] sm:max-w-[80%] ${msg.from === "user" ? "order-2" : "order-1"}`}>
                <div
                  className={`px-3 sm:px-4 py-2 rounded-2xl text-sm ${msg.from === "user"
                    ? "bg-gradient-to-r from-gray-600 to-gray-800 text-white rounded-br-md"
                    : "bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm"
                  }`}
                >
                  {msg.isHtml ? (
                    <div
                      style={{ maxHeight: 180, overflowY: 'auto', paddingRight: 4 }}
                      dangerouslySetInnerHTML={{ __html: msg.text }}
                      className="[&_div]:text-xs [&_div]:sm:text-sm [&_span]:text-xs [&_span]:sm:text-sm scrollbar-thin scrollbar-thumb-slate-200"
                    />
                  ) : (
                    <span className="text-xs sm:text-sm">{msg.text}</span>
                  )}
                </div>
                <div className={`text-xs text-gray-500 mt-1 ${msg.from === "user" ? "text-right" : "text-left"}`}>
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <TypingIndicator />
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
    ) : (
      <div className="flex-1 flex flex-col items-center justify-center  w-full">
        <div className="w-full max-w-lg mx-auto px-2">
          {voiceMessages.length > 0 && (
            <div className="mb-4 space-y-2">
              {voiceMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] sm:max-w-[80%] ${msg.from === "user" ? "order-2" : "order-1"}`}>
                    <div className={`px-3 sm:px-4 py-2 rounded-2xl text-sm ${msg.from === "user"
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md"
                      : "bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm"
                    }`}>
                      <span className="text-xs sm:text-sm">{msg.text}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {voiceState === 'greeting' && <ListeningAvatar label="Hi, I'm Digi. How can I help you?" greeting={true} />}
        {voiceState === 'listening' && <ListeningAvatar label="Listening... Speak now" interim={siriInterim} listening={true} />}
        {voiceState === 'processing' && <ListeningAvatar label="Processing..." processing={true} />}
        {voiceState === 'speaking' && (
          <div className="flex flex-col items-center w-full">
            <ListeningAvatar label="" liveCaption={liveCaption} speaking={true} />
            <button
              className="m-3 px-3 py-2 rounded-full bg-red-500 text-white font-semibold shadow hover:bg-red-600 transition-all text-base"
              onClick={() => {
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                setLiveCaption("");
                setVoiceState('listening');
                setTimeout(() => startVoiceListening(), 200);
              }}
              style={{ minWidth: 140 }}
            >
              ⏭️ Skip Speaking
            </button>
          </div>
        )}
        {voiceState === 'followup' && <ListeningAvatar label="If you need anything else, please let me know." />}
        {voiceState === 'stopped' && (
          <div className="flex flex-col items-center justify-center w-full py-10">
            <div className="mb-4 text-base text-gray-700 font-semibold">Voice assistant stopped listening.</div>
            <button
              className="px-4 py-2 rounded-full bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition-all"
              onClick={startVoiceGreeting}
            >
              Start Listening Again
            </button>
          </div>
        )}
      </div>
    )
  );

  // Input area for chat mode
  const renderInputArea = () => (
    <div className="flex items-center border-t px-3 sm:px-3 py-2 sm:py-3 bg-gradient-to-r from-gray-100 to-gray-200">
      <input
        type="text"
        className={`flex-1 border rounded-full px-3 sm:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isListening ? 'border-gray-500 ring-2 ring-gray-400 animate-pulse' : 'border-gray-300'}`}
        placeholder={isListening ? "Speak now..." : "Type your message..."}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSend();
        }}
        style={{ marginRight: '0.5rem' }}
        autoFocus={isListening}
      />
      <button
        type="button"
        className={`p-2 rounded-full border border-gray-300 bg-white hover:bg-gray-100 mr-2 ${isListening ? 'bg-gray-200 border-gray-400' : ''}`}
        aria-label="Start voice input"
        onClick={handleMicClick}
        disabled={isListening}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e293b' }}
      >
        {/* Mic SVG icon */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 ${isListening ? 'text-blue-600 animate-pulse' : 'text-gray-600'}`}> <path d="M12 1v14a4 4 0 0 0 4-4V5a4 4 0 0 0-8 0v6a4 4 0 0 0 4 4z"></path><line x1="19" y1="11" x2="19" y2="11"></line><line x1="5" y1="11" x2="5" y2="11"></line><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
      </button>
      <button
        className={`ml-2 p-2 rounded-full transition-all ${input.trim()
            ? "bg-gradient-to-r from-gray-700 to-gray-900 text-white hover:from-gray-800 hover:to-gray-900"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        onClick={handleSend}
        disabled={!input.trim()}
        type="button"
        style={{ color: input.trim() ? '#fff' : '#6b7280' }}
      >
        <SendIcon className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
    </div>
  );

   return (
    <>
      {/* Floating Chatbot Icon - responsive positioning */}
      {/* Welcome popup above chatbot icon */}
      <ChatbotWelcomePopup visible={showWelcome && !open} onClose={() => setShowWelcome(false)} />
      <div className="flex flex-col items-center">
        <button
          id="chatbot-fab"
          className="fixed bottom-3 right-3 sm:bottom-4 sm:right-6 z-50 bg-gradient-to-br from-gray-400 via-gray-600 to-gray-800 text-white rounded-full shadow-lg p-2 sm:p-3 border-2 border-gray-400 hover:scale-105 transition-all"
          style={{ boxShadow: "0 4px 24px 4px #9ca3af55, 0 2px 8px #6b7280aa" }}
          onClick={() => {
            setOpen((v) => !v);
            setMode('chat');
            setShowWelcome(false);
          }}
          aria-label="Open Chatbot"
        >
          <ChatBotIcon className="w-10 h-10 sm:w-12 sm:h-12" animated={true} />
        </button>
        {/* Modern label below icon */}
        {/* <div className="fixed bottom-1.5 right-3 sm:bottom-2.5 sm:right-6 z-50 text-xs sm:text-sm font-bold tracking-wide text-gray-700 bg-white bg-opacity-80 rounded-full px-3 py-1 shadow border border-gray-200 select-none pointer-events-none" style={{letterSpacing:1.2}}>DIGI – AI Assistant</div> */}
      </div>

      {/* Chatbot Card - fully responsive */}
      {open && (
        <div
          key={instanceKey}
          id="chatbot-card"
          className="fixed inset-x-2 bottom-16 sm:bottom-20 sm:right-6 sm:left-auto z-50 
            sm:w-[420px] md:w-[460px] lg:w-[500px] 
            max-w-none sm:max-w-[75vw] 
            h-[calc(100vh-5rem)] sm:h-auto sm:min-h-[60vh] sm:max-h-[80vh]
            bg-white rounded-xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden
            transition-all duration-500 ease-out"
          style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}
        >
          {/* Header - responsive */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-gray-600 to-gray-900 text-white">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 shadow bg-gradient-to-br from-gray-200 via-gray-400 to-gray-700">
                <ChatBotIcon className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <div>
                <span className="font-semibold text-sm sm:text-base">DIGI : HMS Assistant</span>
                <div className="flex items-center space-x-1 text-xs opacity-90">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {mode === 'chat' ? (
                <button
                  className={`px-3 py-1 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-xs font-semibold border border-white border-opacity-30 shadow transition-all flex items-center gap-1 text-blue-900`}
                  onClick={startVoiceGreeting}
                  aria-label="Talk with AI"
                  style={{ minWidth: 90, color: '#1e293b' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-1"><ellipse cx="12" cy="12" rx="7" ry="11" stroke="currentColor" /><circle cx="12" cy="12" r="3" fill="currentColor" /></svg>
                  <span>Talk with AI</span>
                </button>
              ) : (
                <button
                  className="px-3 py-1 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-xs font-semibold border border-white border-opacity-30 shadow transition-all flex items-center gap-1 text-blue-900"
                  onClick={() => { setMode('chat'); setVoiceState('idle'); setSiriInterim(""); }}
                  aria-label="Back to Chat"
                  style={{ minWidth: 90, color: '#1e293b',marginLeft: '15px' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-1"><path d="M15 18l-6-6 6-6" /></svg>
                  <span>Back to Chat</span>
                </button>
              )}
              <button
                className="text-white text-xl w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white hover:bg-opacity-20"
                onClick={() => setOpen(false)}
                aria-label="Close Chatbot"
              >
                ×
              </button>
            </div>
          </div>

          {/* Main area: show chat or voice mode */}
          {mode === 'chat' ? (
            <div
              className="flex-1 overflow-y-auto px-3 sm:px-4 py-2 sm:py-3 space-y-2 sm:space-y-3 bg-gray-50 relative"
              style={{
                maxHeight: "calc(100vh - 12rem)",
                minHeight: "300px"
              }}
            >
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.from === "user" ? "justify-end" :
                    msg.from === "system" ? "justify-start" : "justify-start"}`}
                >
                  {msg.isDeviceButtons ? (
                    <div className="w-full">
                      {renderDeviceButtons()}
                    </div>
                  ) : (
                    <div className={`max-w-[85%] sm:max-w-[80%] ${msg.from === "user" ? "order-2" : "order-1"}`}>
                      <div
                        className={`px-3 sm:px-4 py-2 rounded-2xl text-sm ${msg.from === "user"
                            ? "bg-gradient-to-r from-gray-600 to-gray-800 text-white rounded-br-md"
                            : "bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm"
                          }`}
                      >
                        {msg.isHtml ? (
                          <div
                          // maxHeight: 180, overflowY: 'auto',
                            style={{  paddingRight: 4 }}
                            dangerouslySetInnerHTML={{ __html: msg.text }}
                            className="[&_div]:text-xs [&_div]:sm:text-sm [&_span]:text-xs [&_span]:sm:text-sm scrollbar-thin scrollbar-thumb-slate-200"
                          />
                        ) : (
                          <span className="text-xs sm:text-sm">{msg.text}</span>
                        )}
                      </div>
                      <div className={`text-xs text-gray-500 mt-1 ${msg.from === "user" ? "text-right" : "text-left"}`}>
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Listening UI only in voice mode, not in chat mode */}

              {isTyping && (
                <div className="flex justify-start">
                  <TypingIndicator />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center w-full">
              <div className="w-full max-w-lg mx-auto px-2">
                {voiceMessages.length > 0 && (
                  <div className="mb-4 space-y-2 max-h-44 sm:max-h-56 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                    {voiceMessages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] sm:max-w-[80%] ${msg.from === "user" ? "order-2" : "order-1"}`}>
                          <div className={`px-3 sm:px-4 py-2 rounded-2xl text-sm ${msg.from === "user"
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md"
                            : "bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm"
                          }`}>
                            <span className="text-xs sm:text-sm">{msg.text}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {voiceState === 'greeting' && <ListeningAvatar label="Hi, I'm Digi. How can I help you?" greeting={true} />}
              {voiceState === 'listening' && <ListeningAvatar label="Listening... Speak now" interim={siriInterim} listening={true} />}
              {voiceState === 'processing' && <ListeningAvatar label="Processing..." processing={true} />}
              {voiceState === 'speaking' && (
                <div className="flex flex-col items-center w-full">
                  <ListeningAvatar label="" liveCaption={liveCaption} speaking={true} />
                  <button
                    className="m-3 px-3 py-2 rounded-full bg-red-500 text-white font-semibold shadow hover:bg-red-600 transition-all text-base"
                    onClick={() => {
                      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                      setLiveCaption("");
                      setVoiceState('listening');
                      setTimeout(() => startVoiceListening(), 200);
                    }}
                    style={{ minWidth: 140 }}
                  >
                    ⏭️ Skip Speaking
                  </button>
                </div>
              )}
              {voiceState === 'followup' && <ListeningAvatar label="If you need anything else, please let me know." />}
              {voiceState === 'stopped' && (
                <div className="flex flex-col items-center justify-center w-full py-10">
                  <div className="mb-4 text-base text-gray-700 font-semibold">Voice assistant stopped listening.</div>
                  <button
                    className="px-4 py-2 rounded-full bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition-all"
                    onClick={startVoiceGreeting}
                  >
                    Start Listening Again
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Input - responsive */}
          {mode === 'chat' && (
            <div className="flex items-center border-t px-3 sm:px-3 py-2 sm:py-3 bg-gradient-to-r from-gray-100 to-gray-200">
              <input
                type="text"
                className={`flex-1 border rounded-full px-3 sm:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${isListening ? 'border-gray-500 ring-2 ring-gray-400 animate-pulse' : 'border-gray-300'}`}
                placeholder={isListening ? "Speak now..." : "Type your message..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                style={{ marginRight: '0.5rem' }}
                autoFocus={isListening}
              />
              <button
                type="button"
                className={`p-2 rounded-full border border-gray-300 bg-white hover:bg-gray-100 mr-2 ${isListening ? 'bg-gray-200 border-gray-400' : ''}`}
                aria-label="Start voice input"
                onClick={handleMicClick}
                disabled={isListening}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e293b' }}
              >
                {/* Mic SVG icon */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 ${isListening ? 'text-blue-600 animate-pulse' : 'text-gray-600'}`}> <path d="M12 1v14a4 4 0 0 0 4-4V5a4 4 0 0 0-8 0v6a4 4 0 0 0 4 4z"></path><line x1="19" y1="11" x2="19" y2="11"></line><line x1="5" y1="11" x2="5" y2="11"></line><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
              </button>
              <button
                className={`ml-2 p-2 rounded-full transition-all ${input.trim()
                    ? "bg-gradient-to-r from-gray-700 to-gray-900 text-white hover:from-gray-800 hover:to-gray-900"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                onClick={handleSend}
                disabled={!input.trim()}
                type="button"
                style={{ color: input.trim() ? '#fff' : '#6b7280' }}
              >
                <SendIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          )}
        </div>
      )}

    </>
  );
}
export default ChatBot;