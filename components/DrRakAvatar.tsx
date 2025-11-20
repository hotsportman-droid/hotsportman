import React, { useState, useEffect, useRef } from 'react';
import { MicIcon } from './icons';

// --- 3D AVATAR MOCKUP ---
const Avatar = ({ isSpeaking, isListening }: { isSpeaking: boolean, isListening: boolean }) => {
    const borderColor = isSpeaking ? 'border-indigo-400' : isListening ? 'border-green-400' : 'border-slate-200';
    const shadow = isSpeaking ? 'shadow-[0_0_15px_rgba(99,102,241,0.5)]' : isListening ? 'shadow-[0_0_15px_rgba(52,211,153,0.5)]' : '';
    const statusBg = isSpeaking || isListening ? 'bg-green-500' : 'bg-slate-400';

    return (
      <div className="relative w-32 h-32 mx-auto">
          <div className={`w-full h-full rounded-full overflow-hidden border-4 ${borderColor} ${shadow} bg-indigo-50 relative transition-all duration-300`}>
              <img 
                  src="https://img2.pic.in.th/pic/DrRukDolaAvatar.jpg" 
                  alt="Dr. Ruk Avatar" 
                  className={`w-full h-full object-cover ${isSpeaking || isListening ? 'scale-110' : 'scale-100'} transition-transform duration-500`}
              />
          </div>
          <div className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${statusBg}`}>
              {(isSpeaking || isListening) && <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>}
              {!(isSpeaking || isListening) && <div className="w-2 h-2 bg-white rounded-full"></div>}
          </div>
      </div>
    );
};

export const DrRakAvatar: React.FC = () => {
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [statusText, setStatusText] = useState('แตะปุ่มไมค์เพื่อเปิดระบบรอฟัง');
    const [error, setError] = useState<string | null>(null);
    
    const recognitionRef = useRef<any>(null);
    const shouldSpeakRef = useRef(false);
    const wakeWordCooldownRef = useRef(false);

    const stopSpeaking = () => {
        shouldSpeakRef.current = false;
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
    };

    const speak = (text: string) => {
        if (!('speechSynthesis' in window)) return;
        stopSpeaking();
        shouldSpeakRef.current = true;
        setIsSpeaking(true);
        setStatusText("กำลังพูด...");

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'th-TH';
        utterance.rate = 0.8;
        utterance.volume = 1;

        const allVoices = window.speechSynthesis.getVoices();
        const thaiVoice = allVoices.find(v => v.lang === 'th-TH');
        if (thaiVoice) utterance.voice = thaiVoice;

        utterance.onend = () => {
            setIsSpeaking(false);
            shouldSpeakRef.current = false;
            if(isMonitoring) setStatusText('กำลังรอฟังคำว่า "สวัสดีหมอรักษ์"');
            else setStatusText('แตะปุ่มไมค์เพื่อเปิดระบบรอฟัง');
        };
        utterance.onerror = (e) => {
            setIsSpeaking(false);
            shouldSpeakRef.current = false;
        };
        window.speechSynthesis.speak(utterance);
    };

    const triggerWakeWordResponse = () => {
        if (wakeWordCooldownRef.current) return;
        
        wakeWordCooldownRef.current = true;
        
        const weathers = [
            { type: 'ร้อนจัด', temp: '38 องศา', pm: '150 (เริ่มมีผลกระทบ)', advice: 'อากาศร้อนและฝุ่นเยอะแบบนี้ เพื่อนหมอรักษ์งดทำกิจกรรมกลางแจ้งและดื่มน้ำเยอะๆ นะครับ อย่าลืมสวมหน้ากาก N95 ด้วยครับ' },
            { type: 'ฝนตก', temp: '28 องศา', pm: '45 (ปานกลาง)', advice: 'ช่วงนี้มีฝนตก ระวังเปียกฝนและรักษาสุขภาพด้วยนะครับ ถ้าโดนละอองฝนรีบอาบน้ำสระผมทันทีนะครับ' },
            { type: 'อากาศดี', temp: '26 องศา', pm: '25 (ดีมาก)', advice: 'วันนี้อากาศดีมากครับ ค่าฝุ่นน้อย เหมาะกับการออกกำลังกายเบาๆ หรือสูดอากาศบริสุทธิ์ครับ' }
        ];
        const env = weathers[Math.floor(Math.random() * weathers.length)];
        const response = `สวัสดีค่ะ เพื่อนหมอรักษ์ วันนี้อากาศ${env.type} อุณหภูมิประมาณ ${env.temp} ค่าฝุ่น PM 2.5 อยู่ที่ ${env.pm} ครับ ${env.advice}`;
        
        speak(response);
        setTimeout(() => wakeWordCooldownRef.current = false, 8000);
    };

    const toggleMonitoring = () => {
        if (isMonitoring) {
            if (recognitionRef.current) recognitionRef.current.stop();
            setIsMonitoring(false);
            speak("ปิดระบบรับฟังอัตโนมัติแล้วครับ");
            setStatusText('แตะปุ่มไมค์เพื่อเปิดระบบรอฟัง');
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            speak('เครื่องของคุณไม่รองรับการสั่งงานด้วยเสียงครับ');
            return;
        }
        
        setError(null);
        speak("เปิดระบบรับฟังแล้วครับ เรียก สวัสดีหมอรักษ์ ได้เลยครับ");
        setIsMonitoring(true);
        setStatusText('กำลังรอฟังคำว่า "สวัสดีหมอรักษ์"');
    };

    useEffect(() => {
        if (!isMonitoring) return;

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.lang = 'th-TH';
        recognition.interimResults = false;
        recognition.continuous = true;

        recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results).map((result: any) => result[0].transcript).join('').trim().toLowerCase();
            if (transcript.includes("สวัสดีหมอรักษ์") || transcript.includes("สวัสดีหมอรัก") || transcript.includes("หวัดดีหมอรักษ์")) {
                triggerWakeWordResponse();
            }
        };

        recognition.onerror = (event: any) => {
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                setIsMonitoring(false);
                setError("ไม่ได้รับอนุญาตให้ใช้ไมค์ ระบบรับฟังอัตโนมัติถูกปิด");
                setStatusText('โปรดอนุญาตการใช้ไมโครโฟน');
            }
        };

        recognition.onend = () => {
            if (isMonitoring) {
                setTimeout(() => {
                    if (isMonitoring && recognitionRef.current) recognitionRef.current.start();
                }, 200);
            }
        };

        recognitionRef.current = recognition;
        try { recognition.start(); } catch (e) { console.error("Could not start recognition", e); }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.onend = null;
                recognitionRef.current.stop();
            }
        };
    }, [isMonitoring]);

    useEffect(() => {
        return () => { // Cleanup on unmount
           stopSpeaking();
           if(recognitionRef.current) {
               recognitionRef.current.onend = null;
               recognitionRef.current.stop();
           }
        }
    }, []);

    return (
        <div className="bg-white rounded-2xl shadow-lg border-2 border-indigo-50 p-6 flex flex-col items-center text-center">
            <Avatar isSpeaking={isSpeaking} isListening={isMonitoring} />
            <h3 className="text-xl font-bold text-slate-800 mt-4">หมอรักษ์ชวนคุย</h3>
            <p className="text-sm text-slate-500 min-h-[40px] mt-1 mb-4 flex items-center justify-center">
                {error || statusText}
            </p>
            <button
                onClick={toggleMonitoring}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isMonitoring 
                    ? 'bg-green-500 text-white ring-4 ring-green-200 animate-pulse' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-2 border-slate-200'
                }`}
                aria-label={isMonitoring ? "ปิดระบบรับฟังอัตโนมัติ" : "เปิดระบบรับฟังอัตโนมัติ"}
            >
                <MicIcon className="w-8 h-8" />
            </button>
        </div>
    );
};
