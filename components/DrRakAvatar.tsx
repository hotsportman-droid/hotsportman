import React, { useState, useEffect, useRef } from 'react';
import { MicIcon } from './icons';
import { getSafeApiKey } from './SymptomAnalyzer';
import { GoogleGenAI } from '@google/genai';

// --- TYPES ---
interface WeatherData {
    temperature: number;
    weather: string;
    pm25: number;
}

// --- CONSTANTS ---
// The avatar image is embedded as a Base64 string to prevent any external loading issues.
// FIX: Corrected component export to be a named export `DrRakAvatar` to resolve module import errors. The invalid duplicated content at the end of the file has also been removed, which was causing a syntax error.
const AVATAR_IMAGE_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA/wD/AP+gvaeTAACAAElEQVR42uzdd5xlV3X/8dfVd+/Ue+/MvDN7s5udiZ1ENBgTRBQhghZ5lEVBkUW+lUVERZZlkUUUkAwiGAQNEYOMyUwnO7sz77y9V/fU7ap/+sc91d3d6YEMQh4gn5/16n17qrpV1ffr29fnOlVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";

const PREDEFINED_GREETINGS = [
    "สวัสดีค่ะ หมอรักษ์พร้อมให้คำปรึกษาค่ะ มีอะไรให้ช่วยไหมคะ",
    "สวัสดีค่ะ มีอาการอะไรไม่สบายใจ บอกหมอได้เลยนะคะ",
    "สวัสดีค่ะ วันนี้รู้สึกเป็นอย่างไรบ้างคะ ให้หมอช่วยดูอะไรให้ไหม",
];

const PREDEFINED_GOODBYES = [
    "ดูแลสุขภาพด้วยนะคะ",
    "ขอให้สุขภาพแข็งแรงนะคะ",
    "หากมีอะไรผิดปกติอีก ปรึกษาหมอได้ตลอดเวลานะคะ",
];

const PREDEFINED_RESPONSES: { [key: string]: string } = {
    'ขอบคุณ': 'ยินดีค่ะ มีอะไรให้ช่วยอีกไหมคะ',
    'สบายดี': 'ดีแล้วค่ะ รักษาสุขภาพให้แข็งแรงเสมอนะคะ',
    'หมอชื่ออะไร': 'หมอชื่อรักษ์ค่ะ เป็นผู้ช่วย AI ด้านสุขภาพ ยินดีที่ได้รู้จักค่ะ',
    'ทำอะไรได้บ้าง': 'หมอสามารถรับฟังอาการเบื้องต้นของคุณ แล้วให้คำแนะนำในการดูแลตัวเองได้ค่ะ แต่หมอไม่สามารถวินิจฉัยโรคหรือจ่ายยาได้นะคะ'
};

// --- HELPER FUNCTIONS ---
const getDynamicGreeting = (weather: WeatherData | null): string => {
    if (!weather) return getRandom(PREDEFINED_GREETINGS);

    const hour = new Date().getHours();
    let timeOfDayGreeting = '';
    if (hour < 12) {
        timeOfDayGreeting = 'สวัสดีตอนเช้าค่ะ';
    } else if (hour < 18) {
        timeOfDayGreeting = 'สวัสดีตอนบ่ายค่ะ';
    } else {
        timeOfDayGreeting = 'สวัสดีตอนเย็นค่ะ';
    }

    let weatherAdvice = '';
    if (weather.pm25 > 50) {
        weatherAdvice = `วันนี้ค่าฝุ่น PM2.5 ค่อนข้างสูง อย่าลืมใส่หน้ากากอนามัยเมื่อออกไปข้างนอกนะคะ`;
    } else if (weather.weather.includes('ฝน')) {
        weatherAdvice = `ดูเหมือนวันนี้อาจจะมีฝนตก อย่าลืมพกร่มและระวังเป็นหวัดด้วยนะคะ`;
    } else if (weather.temperature > 32) {
        weatherAdvice = `อากาศค่อนข้างร้อน ดื่มน้ำเยอะๆ และหลีกเลี่ยงการอยู่กลางแดดนานๆ นะคะ`;
    }

    return `${timeOfDayGreeting} ${weatherAdvice || 'วันนี้มีอะไรให้หมอช่วยไหมคะ'}`;
};


export const DrRakAvatar: React.FC = () => {
    const [currentMessage, setCurrentMessage] = useState('');
    const [isTalking, setIsTalking] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const recognitionRef = useRef<any>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const thinkingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Function to get a random item from an array
    const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    
    // Stop all audio and recognition
    const stopConversation = () => {
        if (thinkingTimeoutRef.current) clearTimeout(thinkingTimeoutRef.current);
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsThinking(false);
        setIsTalking(false);
        setIsListening(false);
    };

    const speak = (text: string) => {
        stopConversation();
        if (!('speechSynthesis' in window)) {
            setCurrentMessage(text);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'th-TH';
        utterance.rate = 0.9;
        utterance.pitch = 1.1;

        const allVoices = window.speechSynthesis.getVoices();
        const thaiVoice = allVoices.find(v => v.lang === 'th-TH' && v.name.includes('Kanya'));
        if (thaiVoice) {
            utterance.voice = thaiVoice;
        }

        utteranceRef.current = utterance;
        
        utterance.onstart = () => {
            setCurrentMessage(text);
            setIsTalking(true);
        };
        utterance.onend = () => {
            setIsTalking(false);
        };
        utterance.onerror = () => {
            setIsTalking(false);
        };
        
        window.speechSynthesis.speak(utterance);
    };
    
    // Function to analyze user's speech and generate a response
    const analyzeAndRespond = async (text: string) => {
        setIsListening(false);
        setIsThinking(true);
        setCurrentMessage("หมอกำลังคิดสักครู่นะคะ...");

        thinkingTimeoutRef.current = setTimeout(() => setIsThinking(false), 5000); // Max thinking time

        const lowerCaseText = text.toLowerCase();
        
        // Check for simple, predefined responses first
        for (const keyword in PREDEFINED_RESPONSES) {
            if (lowerCaseText.includes(keyword.toLowerCase())) {
                speak(PREDEFINED_RESPONSES[keyword]);
                return;
            }
        }

        // Check for goodbye phrases
        if (lowerCaseText.includes('ลาก่อน') || lowerCaseText.includes('ไปแล้วนะ') || lowerCaseText.includes('แค่นี้')) {
            speak(getRandom(PREDEFINED_GOODBYES));
            return;
        }

        // If no simple match, use the Gemini API
        const apiKey = getSafeApiKey();
        if (!apiKey || !navigator.onLine) {
            speak("ขออภัยค่ะ หมอไม่สามารถเชื่อมต่อระบบวิเคราะห์ได้ในขณะนี้ กรุณาลองใหม่ภายหลังนะคะ");
            return;
        }

        try {
            const ai = new GoogleGenAI({apiKey});
            const result = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `User says: "${text}". As a friendly female AI doctor named "Rak" in Thailand, give a short, conversational, and empathetic response. Don't give medical advice. Keep it under 20 words.`,
                config: { temperature: 0.7 }
            });
            
            speak(result.text || "ขอโทษค่ะ หมอไม่เข้าใจ ช่วยพูดอีกครั้งได้ไหมคะ");

        } catch (error) {
            console.error("Gemini API error:", error);
            speak("ขออภัยค่ะ เกิดข้อผิดพลาดในการสื่อสารกับระบบค่ะ");
        } finally {
             setIsThinking(false);
             if (thinkingTimeoutRef.current) clearTimeout(thinkingTimeoutRef.current);
        }
    };

    // Handle microphone click to start/stop listening
    const handleMicClick = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }
        
        stopConversation();

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            speak('ขออภัยค่ะ อุปกรณ์ของคุณไม่รองรับการสั่งงานด้วยเสียงค่ะ');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'th-TH';
        recognition.interimResults = false;
        recognition.continuous = false;
        recognitionRef.current = recognition;

        recognition.onstart = () => {
            setIsListening(true);
            setCurrentMessage("หมอฟังอยู่ค่ะ...");
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            analyzeAndRespond(transcript);
        };
        
        recognition.onerror = (event: any) => {
            if (event.error !== 'no-speech') {
                 console.error("Speech recognition error:", event.error);
                 speak('ขออภัยค่ะ เกิดข้อผิดพลาดในการรับเสียงค่ะ');
            }
            setIsListening(false);
        };
        
        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    // Initial greeting and weather fetch
    useEffect(() => {
        // Fetch weather data for dynamic greeting (example coordinates for Bangkok)
        const fetchWeather = async () => {
            try {
                // This is a free, no-key API, but in a real app, use a proper service with an API key.
                const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=13.75&longitude=100.52&current=temperature_2m,weather_code&hourly=pm2_5&timezone=Asia/Bangkok');
                const data = await response.json();
                
                // A very simplified mapping of weather codes to descriptions
                const weatherCodeMap: { [key: number]: string } = {
                    0: 'ท้องฟ้าแจ่มใส',
                    1: 'มีเมฆเล็กน้อย', 2: 'มีเมฆเป็นส่วนมาก', 3: 'มีเมฆครึ้ม',
                    61: 'มีฝนตกปรอยๆ', 63: 'มีฝนตก', 65: 'มีฝนตกหนัก',
                    80: 'มีฝนโปรยปราย', 81: 'มีฝนตก', 82: 'มีฝนตกหนัก'
                };

                const currentWeatherData: WeatherData = {
                    temperature: data.current.temperature_2m,
                    weather: weatherCodeMap[data.current.weather_code] || 'สภาพอากาศทั่วไป',
                    pm25: data.hourly.pm2_5[new Date().getHours()] || 0
                };
                setWeatherData(currentWeatherData);
                speak(getDynamicGreeting(currentWeatherData));
            } catch (error) {
                console.error("Failed to fetch weather data:", error);
                speak(getRandom(PREDEFINED_GREETINGS));
            }
        };

        // Delay initial greeting slightly for better UX
        const timer = setTimeout(fetchWeather, 1500);

        return () => {
            clearTimeout(timer);
            stopConversation();
        };
    }, []);

    const avatarClasses = `transition-transform duration-500 ${isTalking ? 'scale-105' : 'scale-100'}`;

    return (
        <div className="flex flex-col items-center p-4 bg-white rounded-2xl shadow-lg border border-slate-200/80">
            <div className="relative w-40 h-40 md:w-48 md:h-48">
                {/* Static background circle */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-blue-200 rounded-full"></div>
                
                {/* Pulsing rings for listening/thinking states */}
                {(isListening || isThinking) && (
                    <>
                        <div className="absolute inset-0 bg-indigo-400 rounded-full animate-ping-slow opacity-50"></div>
                        <div className="absolute inset-0 bg-indigo-300 rounded-full animate-ping-slower opacity-60"></div>
                    </>
                )}

                {/* The main avatar image */}
                <img 
                    src={AVATAR_IMAGE_BASE64}
                    alt="Dr. Rak AI Avatar" 
                    className={`absolute inset-0 w-full h-full object-cover rounded-full shadow-lg ${avatarClasses}`}
                />
            </div>
            
            {/* Message Bubble */}
            <div className="relative mt-5 w-full text-center bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[70px] flex items-center justify-center">
                <p className="text-slate-700 font-medium text-sm md:text-base transition-opacity duration-300">
                    {currentMessage || 'สวัสดีค่ะ มีอะไรให้หมอช่วยไหมคะ?'}
                </p>
            </div>

            {/* Microphone Button */}
            <button
                onClick={handleMicClick}
                className={`mt-4 rounded-full flex items-center justify-center w-16 h-16 transition-all shadow-lg focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-white ${
                    isListening 
                      ? 'bg-red-500 text-white focus:ring-red-300' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-300'
                  }`}
                aria-label={isListening ? "หยุดพูด" : "พูดกับหมอรักษ์"}
            >
                <MicIcon className="w-8 h-8" />
            </button>
        </div>
    );
};
