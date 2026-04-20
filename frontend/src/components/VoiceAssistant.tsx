import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, Volume2, X, CheckCircle2 } from 'lucide-react';
import api from '../api';

interface VoiceAssistantProps {
  onCommand: (command: any) => void;
  contextDistrict?: string;
}

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

export default function VoiceAssistant({ onCommand, contextDistrict }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [matchedIntent, setMatchedIntent] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState('en-IN');
  
  const languages = [
    { code: 'en-IN', label: 'English' },
    { code: 'te-IN', label: 'తెలుగు' },
    { code: 'hi-IN', label: 'हिन्दी' }
  ];
  
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');

  useEffect(() => {
    const SpeechRecognition = window.webkitSpeechRecognition || (window as any).SpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Auto-stop when user pauses
    recognition.interimResults = true;
    recognition.lang = selectedLang;

    recognition.onstart = () => {
      setIsListening(true);
      setShowOverlay(true);
      setTranscript('');
      transcriptRef.current = '';
      setMatchedIntent(null);
    };

    recognition.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
      transcriptRef.current = currentTranscript;
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      if (event.error !== 'no-speech') {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      const finalVal = transcriptRef.current.trim();
      if (finalVal) {
        handleVoiceCommand(finalVal);
      } else {
        setTimeout(() => setShowOverlay(false), 1500);
      }
    };

    recognitionRef.current = recognition;
  }, [onCommand, selectedLang]);

  const startListening = () => {
    if (!isSupported) {
      alert('Voice features are not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    try {
      recognitionRef.current?.start();
    } catch (e) {
      recognitionRef.current?.stop();
      setTimeout(() => recognitionRef.current?.start(), 100);
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const speak = (text: string) => {
    window.speechSynthesis.cancel(); // Stop any current speaking
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedLang;
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const handleVoiceCommand = async (text: string) => {
    setIsProcessing(true);
    try {
      const res = await api.post('/voice-command', { 
        text, 
        context_district: contextDistrict,
        lang: selectedLang
      });
      if (res.data.success) {
        // Map intent to user-friendly labels
        const intentLabels: Record<string, string> = {
          'add_crop': 'Crop Listing Detected! 🌾',
          'get_price': 'Price Analysis Complete! 💰',
          'navigate': 'Navigating... 🚀'
        };
        setMatchedIntent(intentLabels[res.data.intent] || 'Command Processed!');
        
        if (res.data.speech) speak(res.data.speech);
        onCommand(res.data);
        
        // Success feedback delay
        setTimeout(() => {
          setShowOverlay(false);
          setIsProcessing(false);
        }, 2500);
      } else {
        setIsProcessing(false);
        setMatchedIntent('Could not understand command.');
        setTimeout(() => setShowOverlay(false), 2000);
      }
    } catch (err) {
      console.error('Voice command error:', err);
      setIsProcessing(false);
      setShowOverlay(false);
    }
  };

  return (
    <div className="relative flex items-center gap-2">
      {/* Language Selector */}
      <div className="bg-slate-900/90 border border-green-500/20 backdrop-blur-md rounded-2xl p-1.5 flex gap-1 shadow-xl">
        {languages.map(l => (
          <button
            key={l.code}
            onClick={() => setSelectedLang(l.code)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              selectedLang === l.code 
                ? 'bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      <button
        onClick={isListening ? stopListening : startListening}
        className={`p-5 rounded-full shadow-2xl transition-all duration-500 group relative ${
          isListening ? 'bg-red-500 scale-110' : 'bg-green-500 hover:scale-110'
        }`}
        style={{
          boxShadow: isListening 
            ? '0 0 40px rgba(239, 68, 68, 0.6)' 
            : '0 0 30px rgba(34, 197, 94, 0.4)',
        }}
        title="Voice Assistant"
      >
        {isListening ? (
          <MicOff className="w-8 h-8 text-white" />
        ) : (
          <Mic className="w-8 h-8 text-white animate-pulse" />
        )}
        
        {isListening && (
          <div className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-20" />
        )}
      </button>

      {/* Voice Assistant Compact Dropdown popup */}
      {showOverlay && (
        <div className="absolute right-0 top-full mt-4 z-[100] animate-fade-in w-80">
          <div 
            className={`bg-slate-900/95 border ${matchedIntent ? 'border-green-400' : 'border-green-500/30'} p-5 rounded-3xl shadow-2xl relative overflow-hidden transition-all duration-500`}
            style={{ boxShadow: matchedIntent ? '0 0 60px rgba(34, 197, 94, 0.3)' : '0 0 30px rgba(34, 197, 94, 0.2)', backdropFilter: 'blur(20px)' }}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-shimmer" />
            
            <button 
              onClick={() => { setShowOverlay(false); stopListening(); }}
              className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center space-y-4 pt-2">
              <div className={`p-3 rounded-full transition-all duration-500 ${matchedIntent ? 'bg-green-500/30 scale-110' : isListening ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                {isProcessing && !matchedIntent ? (
                  <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
                ) : matchedIntent ? (
                  <CheckCircle2 className="w-8 h-8 text-green-400 animate-bounce" />
                ) : isListening ? (
                  <Mic className="w-8 h-8 text-red-500 animate-pulse" />
                ) : (
                  <Volume2 className="w-8 h-8 text-green-400" />
                )}
              </div>

              <div>
                <h3 className={`text-base font-black mb-1 transition-all duration-300 ${matchedIntent ? 'text-green-400' : 'text-white'}`}>
                  {matchedIntent ? matchedIntent : isProcessing ? 'Analyzing...' : isListening ? 'Listening...' : 'Processing...'}
                </h3>
                <p className="text-slate-400 text-xs min-h-[2rem] italic">
                  {transcript || '"Try saying: add 100 kg Tomato"'}
                </p>
              </div>

              {isListening && (
                <div className="flex gap-1 h-4 items-center justify-center w-full">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div 
                      key={i} 
                      className="w-1 bg-green-500/60 rounded-full animate-wave" 
                      style={{ animationDelay: `${i * 0.1}s`, height: `${30 + Math.random() * 50}%` }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
