import { useState, useEffect, useRef } from 'react';
import { Mic, X, Phone, Lock, CheckCircle2, Languages } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

interface VoiceLoginProps {
  onFill: (mobile: string, pass: string) => void;
  onClose: () => void;
}

export default function VoiceLoginAssistant({ onFill, onClose }: VoiceLoginProps) {
  const { t, language, setLanguage } = useTranslation();
  const [step, setStep] = useState<'start' | 'idle' | 'phone' | 'password' | 'done'>('start');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');

  const recognitionRef = useRef<any>(null);

  const speak = (text: string, langOverride?: 'en' | 'te', onEnd?: () => void) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const targetLang = langOverride || language;
    utterance.lang = targetLang === 'te' ? 'te-IN' : 'en-IN';
    
    let handled = false;
    let fallbackTimer: NodeJS.Timeout;

    const finalize = () => {
      if (!handled && onEnd) {
        handled = true;
        // 500ms delay to prevent mic from picking up the text-to-speech engine
        setTimeout(onEnd, 500);
      }
    };

    utterance.onstart = () => clearTimeout(fallbackTimer);
    utterance.onend = finalize;
    utterance.onerror = (e) => {
        console.error("Speech error", e);
        finalize();
    };

    window.speechSynthesis.speak(utterance);
    // Increased fallback to 10s for longer Telugu strings
    fallbackTimer = setTimeout(finalize, 10000);
  };

  const startListening = (type: 'phone' | 'password') => {
    if (!('webkitSpeechRecognition' in window)) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }
    
    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language === 'te' ? 'te-IN' : 'en-IN';

    recognition.onresult = (event: any) => {
      const current = event.results[event.results.length - 1][0].transcript;
      setTranscript(current);
      if (event.results[0].isFinal) {
        processFinalTranscript(current, type);
      }
    };

    recognition.onerror = (e: any) => {
      console.error("Speech Recognition Error:", e);
      if (e.error === 'no-speech') {
        setError(language === 'te' ? 'వాయిస్ వినపడలేదు, దయచేసి మళ్ళీ చెప్పండి.' : "I didn't hear you, please try again.");
        setTimeout(() => startListening(type), 2000);
        return;
      }
      if (e.error === 'aborted' || e.error === 'network') {
        return; // Safely ignore manual aborts or temporary drops
      }
      setError(`Error: ${e.error}`);
      setTimeout(() => setStep('start'), 3000);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const processFinalTranscript = (text: string, type: 'phone' | 'password') => {
    const numMap: Record<string, string> = {
      '౦': '0', '౧': '1', '౨': '2', '౩': '3', '౪': '4', '౫': '5', '౬': '6', '౭': '7', '౮': '8', '౯': '9',
      'సున్నా': '0', 'ఒకటి': '1', 'రెండు': '2', 'మూడు': '3', 'నాలుగు': '4',
      'ఐదు': '5', 'ఆరు': '6', 'ఏడు': '7', 'ఎనిమిది': '8', 'తొమ్మిది': '9',
      'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
      'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9'
    };

    let normalizedText = text.toLowerCase();

    if (type === 'phone') {
      for (const [word, digit] of Object.entries(numMap)) {
        normalizedText = normalizedText.split(word).join(digit);
      }
      
      // Parse potential spoken emails
      const possibleEmail = normalizedText.replace(/\s+at\s+|\s+at the rate\s+/g, '@').replace(/\s+dot\s+/g, '.').replace(/\s+/g, '').replace('gmail', 'gmail.com');
      const numbersOnly = normalizedText.replace(/[^0-9]/g, '');

      if (possibleEmail.includes('@') && possibleEmail.includes('.')) {
        setMobile(possibleEmail);
        setStep('password');
        setTranscript('');
        if (recognitionRef.current) recognitionRef.current.abort();
        speak(language === 'te' ? 'బాగుంది. ఇప్పుడు మీ పాస్వర్డ్ చెప్పండి.' : 'Great. Now, please say your password clearly.', undefined, () => startListening('password'));
      } else if (numbersOnly.length >= 10) {
        const parsedMobile = numbersOnly.slice(-10);
        setMobile(parsedMobile);
        setStep('password');
        setTranscript('');
        if (recognitionRef.current) recognitionRef.current.abort();
        speak(language === 'te' ? 'బాగుంది. ఇప్పుడు మీ పాస్వర్డ్ చెప్పండి.' : 'Great. Now, please say your password clearly.', undefined, () => startListening('password'));
      } else {
        speak(language === 'te' ? 'క్షమించండి, నాకు సరైన ఈమెయిల్ లేదా నంబర్ వినపడలేదు. మళ్ళీ చెప్పగలరా?' : "Sorry, I couldn't hear a valid email or 10-digit number. Can you say it again?", undefined, () => startListening('phone'));
      }
    } else if (type === 'password') {
       for (const [word, digit] of Object.entries(numMap)) {
         normalizedText = normalizedText.split(word).join(digit);
       }
       const parsedPass = normalizedText.replace(/\s+/g, '').trim();
       if (parsedPass.length >= 3) {
         setPassword(parsedPass);
         setStep('done');
         if (recognitionRef.current) recognitionRef.current.abort();
         speak(language === 'te' ? 'ధన్యవాదాలు. మిమ్మల్ని లోపలికి పంపిస్తున్నాను.' : 'Thank you. Logging you in now.');
         setTimeout(() => {
           onFill(mobile, parsedPass);
           onClose();
         }, 2500);
       } else {
         speak(language === 'te' ? 'క్షమించండి అర్థం కాలేదు. మళ్ళీ చెప్పండి.' : 'I didn\'t catch that. Please say your password again.', undefined, () => startListening('password'));
       }
    }
  };

  const handleLanguageChoice = (lang: 'en' | 'te') => {
    setLanguage(lang);
    setStep('idle');
  };

  useEffect(() => {
    if (step === 'start') {
        speak("Please choose your language. దయచేసి మీ భాషను ఎంచుకోండి.", 'en');
    } else if (step === 'idle') {
      setStep('phone');
      speak(language === 'te' 
        ? 'నమస్కారం రైతు సోదరా, నమోదు చేసుకున్న మీ మొబైల్ నంబర్ లేదా ఈమెయిల్ చెప్పండి.' 
        : 'Hello Farmer, please speak your registered email address or 10 digit mobile number.', 
        undefined, 
        () => startListening('phone')
      );
    }
    return () => {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, [step]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#051f1c]/90 backdrop-blur-xl animate-fade-in">
      <div className="w-full max-w-lg bg-[#0a2f2a] border border-green-500/20 rounded-[3rem] p-10 relative mx-4 text-center shadow-2xl overflow-hidden">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors">
          <X className="w-8 h-8" />
        </button>
        
        {step === 'start' ? (
          <div className="space-y-10 animate-scale-in">
             <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Languages className="w-12 h-12 text-green-400" />
             </div>
             <div>
                <h2 className="text-3xl font-black text-white mb-2">Select Language</h2>
                <p className="text-green-400 font-bold">భాషను ఎంచుకోండి</p>
             </div>
             <div className="grid grid-cols-2 gap-6">
                <button 
                    onClick={() => handleLanguageChoice('te')}
                    className="p-8 rounded-[2rem] bg-green-600 hover:bg-green-500 transition-all flex flex-col items-center gap-4 group"
                >
                    <span className="text-4xl">తెలుగు</span>
                    <span className="text-xs font-black uppercase tracking-widest text-green-100 group-hover:scale-110 transition-transform">Telugu</span>
                </button>
                <button 
                    onClick={() => handleLanguageChoice('en')}
                    className="p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex flex-col items-center gap-4 group"
                >
                    <span className="text-4xl text-white">English</span>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:scale-110 transition-transform">English</span>
                </button>
             </div>
          </div>
        ) : (
          <>
            <div className="relative mb-10 overflow-visible">
              <div className="absolute inset-x-0 -top-10 flex justify-center">
                 <div className="w-40 h-40 bg-green-500/20 rounded-full blur-[60px] animate-pulse" />
              </div>
              <div className={`w-32 h-32 mx-auto rounded-full p-1 shadow-[0_0_50px_rgba(34,197,94,0.4)] transition-all duration-500 ${step !== 'done' ? 'animate-float' : 'scale-110'}`}
                style={{ background: 'linear-gradient(to bottom right, #4ade80, #16a34a)' }}>
                <div className="w-full h-full rounded-full bg-[#051f1c] flex items-center justify-center relative overflow-hidden">
                  <div className={`absolute inset-0 bg-green-400/20 ${step !== 'done' ? 'animate-ping' : ''}`} />
                  <Mic className={`w-16 h-16 transition-all duration-300 ${step !== 'done' ? 'text-green-400 scale-110' : 'text-white scale-90 opacity-50'}`} />
                  {step !== 'done' && (
                    <div className="absolute bottom-4 flex gap-1">
                      <div className="w-1 h-3 bg-green-400 rounded-full animate-wave" style={{ animationDelay: '0s' }} />
                      <div className="w-1 h-3 bg-green-400 rounded-full animate-wave" style={{ animationDelay: '0.2s' }} />
                      <div className="w-1 h-3 bg-green-400 rounded-full animate-wave" style={{ animationDelay: '0.4s' }} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-black text-white mb-4">
              {step === 'phone' && (language === 'te' ? 'మీ నంబర్ లేదా ఈమెయిల్ కోసం ఎదురుచూస్తున్నాను...' : 'Listening for Email or Mobile Number...')}
              {step === 'password' && (language === 'te' ? 'మీ పాస్వర్డ్ చెప్పండి...' : 'Listening for Password...')}
              {step === 'done' && (language === 'te' ? 'వివరాలు లభించాయి!' : 'Login details captured!')}
            </h3>
            
            <div className="py-4 px-6 rounded-2xl bg-black/30 border border-white/5 mb-8 min-h-[60px] flex items-center justify-center">
              <p className="text-xl font-bold text-green-400 italic">
                {error ? <span className="text-red-400">{error}</span> : transcript ? `“${transcript}”` : '...'}
              </p>
            </div>

            <div className="space-y-4 text-left max-w-xs mx-auto">
              <div className={`flex items-center gap-4 p-5 rounded-[1.5rem] transition-all duration-500 border-2 ${mobile ? 'bg-green-500/10 border-green-500' : 'bg-white/5 border-transparent opacity-40'}`}>
                <Phone className={`w-6 h-6 ${mobile ? 'text-green-400' : 'text-slate-400'}`} />
                <div className="flex-1 font-mono text-xl font-black text-white tracking-widest">{mobile || '----------'}</div>
                {mobile && <CheckCircle2 className="w-6 h-6 text-green-400" />}
              </div>
              <div className={`flex items-center gap-4 p-5 rounded-[1.5rem] transition-all duration-500 border-2 ${password ? 'bg-green-500/10 border-green-500' : 'bg-white/5 border-transparent opacity-40'}`}>
                <Lock className={`w-6 h-6 ${password ? 'text-green-400' : 'text-slate-400'}`} />
                <div className="flex-1 font-mono text-slate-400 text-xl tracking-widest">{password ? '••••••••' : '--------'}</div>
                {password && <CheckCircle2 className="w-6 h-6 text-green-400" />}
              </div>
            </div>
            
            <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
               {language === 'te' ? 'మీ స్వరం మాకు సహాయం చేస్తుంది' : 'Your voice powers your farm'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
