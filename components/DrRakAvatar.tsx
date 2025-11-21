
import React, { useState, useEffect, useRef } from 'react';
import { StethoscopeIcon, CheckCircleIcon, ExclamationIcon, SpeakerWaveIcon, MicIcon, StopIcon, VolumeOffIcon, MapPinIcon, HistoryIcon, ChevronDownIcon, UserIcon } from './icons';
import { GoogleGenAI } from "@google/genai";
import { DrRakSvgAvatar } from './DrRakSvgAvatar';

// --- Types ---
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
type InteractionState = 'idle' | 'waitingForWakeWord' | 'listeningPrimary' | 'askingConfirmation' | 'listeningConfirmation' | 'analyzing' | 'speaking';

interface Analysis {
  assessment: string;
  recommendation: string;
  warning: string;
}

interface HistoryItem {
    id: number;
    date: string;
    symptoms: string;
    analysis: Analysis;
}

const model = 'gemini-2.5-flash';
const safetySettings = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
];

export const DrRakAvatar: React.FC = () => {
  const [interactionState, setInteractionState] = useState<InteractionState>('idle');
  const [symptoms, setSymptoms] = useState('');
  const [analysisResult, setAnalysisResult] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [statusText, setStatusText] = useState('กดปุ่มไมค์เพื่อเริ่มบอกอาการ...');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<number | null>(null);
  
  // Use ref to track state synchronously for event handlers
  const stateRef = useRef(interactionState);
  const symptomsRef = useRef(symptoms);
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    stateRef.current = interactionState;
    symptomsRef.current = symptoms;
    isMutedRef.current = isMuted;
  }, [interactionState, symptoms, isMuted]);

  useEffect(() => {
    try {
        const savedHistory = localStorage.getItem('dr_rak_history');
        if (savedHistory) {
            setHistory(JSON.parse(savedHistory));
        }
    } catch (e) { console.error("Failed to load history:", e)}

    if (!SpeechRecognition) {
      setStatusText('ขออภัยค่ะ เบราว์เซอร์ของคุณไม่รองรับการสั่งการด้วยเสียง');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'th-TH';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);

      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const currentState = stateRef.current;
      
      // Combine checks to be more responsive
      const textToCheck = finalTranscript + interimTranscript;

      if (currentState === 'waitingForWakeWord') {
        // Check for "หมอ" in either final or interim results to be snappy
        if (textToCheck.includes('หมอ')) {
          // CRITICAL: Update state ref immediately to prevent onend loop from restarting recognition
          stateRef.current = 'speaking'; 
          setInteractionState('speaking');
          
          stopListening();
          speak("สวัสดีค่ะ ได้ยินแล้วค่ะ เล่าอาการให้หมอฟังได้เลยนะคะ", () => {
            setSymptoms('');
            setAnalysisResult(null);
            updateStateAndStatus('listeningPrimary', 'กำลังฟัง... เล่าอาการได้เลยค่ะ');
            startListening('listeningPrimary');
          });
        }
      } else if (currentState === 'listeningPrimary' || currentState === 'listeningConfirmation') {
        // Only append final transcripts to symptoms to avoid duplication
        if (finalTranscript) {
            setSymptoms(prev => (prev + ' ' + finalTranscript).trim());
        }
        setStatusText('กำลังฟัง...');

        silenceTimerRef.current = window.setTimeout(() => {
          stopListening();
        }, 2500); // 2.5 seconds of silence
      }
    };
    
    recognition.onend = () => {
        if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
        const currentState = stateRef.current;
        
        console.log("Recognition ended. Current state:", currentState);

        if (currentState === 'waitingForWakeWord') {
            // Restart immediately if we are still waiting for wake word (keep alive)
            try {
                recognition.start();
            } catch (e) {
                // Ignore already started errors
            }
        } else if (currentState === 'listeningPrimary') {
            if(symptomsRef.current.trim().length > 0) {
              updateStateAndStatus('askingConfirmation', 'มีอาการอื่นเพิ่มเติมอีกไหมคะ...');
              speak("มีอาการอื่นเพิ่มเติมอีกไหมคะ", () => {
                updateStateAndStatus('listeningConfirmation', 'กำลังฟังคำตอบ...');
                startListening('listeningConfirmation');
              });
            } else {
               updateStateAndStatus('idle', 'กดปุ่มไมค์เพื่อเริ่มบอกอาการ...');
            }
        } else if (currentState === 'listeningConfirmation') {
            handleAnalysis();
        }
        // If state is 'speaking' or 'analyzing', do nothing (let them finish)
    };

    recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
            // Only reset to idle on genuine errors
            if (stateRef.current !== 'waitingForWakeWord') {
                 updateStateAndStatus('idle', 'เกิดข้อผิดพลาดในการรับเสียง');
                 speak("ขออภัยค่ะ มีปัญหาในการรับสัญญาณเสียง กรุณาลองอีกครั้งนะคะ");
            }
        }
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if(silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
    };
  }, []);

  const updateStateAndStatus = (state: InteractionState, text: string) => {
    stateRef.current = state; // Update ref immediately for sync checks
    setInteractionState(state);
    setStatusText(text);
  };
  
  const speak = (text: string, onEndCallback: () => void = () => {}) => {
    if (isMutedRef.current) {
      console.log("[Muted] Dr. Rak would say:", text);
      // Small delay to simulate speaking time
      setTimeout(onEndCallback, 1500);
      return;
    }

    if (!window.speechSynthesis) {
        onEndCallback();
        return;
    }
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'th-TH';
    
    const voices = window.speechSynthesis.getVoices();
    const thaiVoice = voices.find(v => v.lang === 'th-TH' && v.name.includes('Kanya'));
    if (thaiVoice) {
      utterance.voice = thaiVoice;
    }
    
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // Robust callback handling
    let callbackCalled = false;
    const handleEnd = () => {
        if (!callbackCalled) {
            callbackCalled = true;
            onEndCallback();
        }
    };

    utterance.onend = handleEnd;
    utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        handleEnd();
    };
    
    // Small timeout to ensure previous speech is cancelled and state is settled
    window.setTimeout(() => window.speechSynthesis.speak(utterance), 50);
  };

  const startListening = (mode: InteractionState) => {
    if (recognitionRef.current) {
      try {
        // Stop any existing instance first to be clean
        recognitionRef.current.stop(); 
        
        // Small delay to allow stop to process
        setTimeout(() => {
             updateStateAndStatus(mode, mode === 'waitingForWakeWord' ? "พร้อมรับฟัง... กรุณาเรียก 'หมอ' เพื่อเริ่มสนทนาค่ะ" : statusText);
             try {
                recognitionRef.current.start();
             } catch(e) {
                console.error("Error starting recognition:", e);
             }
        }, 100);
      } catch(e) {
        console.error("Could not restart recognition:", e);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleMicClick = async () => {
    if (interactionState !== 'idle') {
      stopListening();
      window.speechSynthesis.cancel();
      updateStateAndStatus('idle', 'กดปุ่มไมค์เพื่อเริ่มบอกอาการ...');
      return;
    }
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setAnalysisResult(null);
        setSymptoms('');
        // Explicitly start in waiting mode
        updateStateAndStatus('waitingForWakeWord', "พร้อมรับฟัง... กรุณาเรียก 'หมอ' เพื่อเริ่มสนทนาค่ะ");
        
        if (recognitionRef.current) {
            try {
                 recognitionRef.current.start();
            } catch(e) {
                // If already started, just let it be
                console.log("Recognition likely already active");
            }
        }
    } catch (err) {
        console.error('Microphone permission denied:', err);
        setStatusText('กรุณาอนุญาตให้ใช้ไมโครโฟนค่ะ');
    }
  };

  const handleAnalysis = async () => {
    if (!symptomsRef.current.trim()) {
        updateStateAndStatus('idle', 'ไม่ได้ระบุอาการ โปรดลองอีกครั้ง');
        return;
    }
    updateStateAndStatus('analyzing', 'กำลังวิเคราะห์อาการ... กรุณารอสักครู่ค่ะ');
    setIsLoading(true);

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("Gemini API key is not configured.");
      updateStateAndStatus('idle', 'เกิดข้อผิดพลาดในการตั้งค่าระบบ');
      speak("ขออภัยค่ะ ไม่สามารถเชื่อมต่อระบบวิเคราะห์ได้ในขณะนี้");
      setIsLoading(false);
      return;
    }
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      คุณคือ "หมอรักษ์" ผู้ช่วย AI ด้านสุขภาพที่เป็นมิตรและห่วงใย
      - ห้ามวินิจฉัยโรคเด็ดขาด ย้ำว่าห้ามเด็ดขาด
      - ให้คำแนะนำเบื้องต้นตามอาการที่ผู้ใช้เล่ามาเท่านั้น
      - เน้นย้ำเสมอว่านี่เป็นเพียงคำแนะนำเบื้องต้นและควรปรึกษาแพทย์เพื่อการวินิจฉัยที่ถูกต้อง
      - ตอบกลับเป็น JSON object เท่านั้น ตามโครงสร้างนี้:
      {
        "assessment": "สรุปความเป็นไปได้ของอาการตามที่ผู้ใช้เล่ามา สรุปสั้นๆ แต่ให้ครอบคลุม",
        "recommendation": "คำแนะนำในการดูแลตัวเองเบื้องต้นที่สามารถทำได้ และควรทำอะไรต่อไป",
        "warning": "คำเตือนที่สำคัญ หรือสัญญาณอันตรายที่ควรไปพบแพทย์ทันที หากไม่มี ให้ระบุว่า 'ไม่มีสัญญาณอันตรายร้ายแรง แต่ควรสังเกตอาการอย่างใกล้ชิด'"
      }

      อาการที่ผู้ใช้แจ้ง: "${symptomsRef.current}"
    `;

    try {
      const result = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          safetySettings,
        },
      });
      const responseText = result.text;
      
      if (!responseText) {
        throw new Error('API returned an empty response.');
      }
      
      const cleanedJsonString = responseText.replace(/```json|```/g, '').trim();
      const parsedResult: Analysis = JSON.parse(cleanedJsonString);
      setAnalysisResult(parsedResult);
      
      const newHistoryItem: HistoryItem = {
          id: Date.now(),
          date: new Date().toLocaleString('th-TH'),
          symptoms: symptomsRef.current,
          analysis: parsedResult,
      };
      saveHistory(newHistoryItem);

      const responseToSpeak = `
        จากอาการที่เล่ามานะคะ ${parsedResult.assessment} 
        เบื้องต้นขอแนะนำให้ ${parsedResult.recommendation} 
        ${parsedResult.warning !== 'ไม่มีสัญญาณอันตรายร้ายแรง แต่ควรสังเกตอาการอย่างใกล้ชิด' ? `ข้อควรระวังคือ ${parsedResult.warning}` : ''}
        อย่างไรก็ตาม นี่เป็นเพียงคำแนะนำเบื้องต้น ควรปรึกษาแพทย์เพื่อรับการวินิจฉัยที่ถูกต้องนะคะ
      `;
      updateStateAndStatus('speaking', 'กำลังแจ้งผลการวิเคราะห์...');
      speak(responseToSpeak, () => {
        updateStateAndStatus('idle', 'ปรึกษาอีกครั้ง กดปุ่มไมค์ได้เลยค่ะ');
      });

    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      updateStateAndStatus('idle', 'เกิดข้อผิดพลาดในการวิเคราะห์');
      speak("ขออภัยค่ะ เกิดข้อผิดพลาดในการวิเคราะห์อาการ กรุณาลองใหม่อีกครั้งนะคะ");
    } finally {
      setIsLoading(false);
    }
  };

  const saveHistory = (newItem: HistoryItem) => {
      setHistory(prev => {
          const newHistory = [newItem, ...prev].slice(0, 20); // Keep last 20 consultations
          localStorage.setItem('dr_rak_history', JSON.stringify(newHistory));
          return newHistory;
      });
  };

  const clearHistory = () => {
      if (window.confirm('คุณต้องการลบประวัติการปรึกษาทั้งหมดหรือไม่?')) {
          setHistory([]);
          localStorage.removeItem('dr_rak_history');
      }
  }

  const showHospitalButton = analysisResult?.recommendation.includes('โรงพยาบาล') || analysisResult?.recommendation.includes('คลินิก') || analysisResult?.warning.includes('แพทย์');

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden w-full max-w-2xl mx-auto flex flex-col">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mr-4 shrink-0">
                    <StethoscopeIcon />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-800">ปรึกษาหมอรักษ์</h3>
                    <p className="text-slate-500 text-sm">{statusText}</p>
                </div>
            </div>
            <button onClick={() => setIsMuted(m => !m)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                {isMuted ? <VolumeOffIcon className="w-6 h-6"/> : <SpeakerWaveIcon className="w-6 h-6"/>}
            </button>
        </div>

        <div className="relative flex flex-col md:flex-row items-center gap-6">
          <div className="relative shrink-0">
            <DrRakSvgAvatar className="w-32 h-32 shadow-lg" />
            <div className={`absolute inset-0 rounded-full border-4 border-indigo-500 transition-all duration-500 pointer-events-none ${interactionState.startsWith('listening') ? 'animate-pulse opacity-100' : 'opacity-0 scale-125'}`}></div>
          </div>

          <div className="w-full">
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="อาการของคุณจะปรากฏที่นี่..."
              className="w-full h-28 p-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              readOnly={interactionState !== 'idle' && interactionState !== 'waitingForWakeWord'}
            />
            <div className="flex items-center justify-end gap-2 mt-2">
                <button
                    onClick={handleMicClick}
                    disabled={isLoading}
                    className={`px-4 py-2 rounded-lg font-bold text-white transition-all flex items-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
                        interactionState === 'idle' 
                        ? 'bg-indigo-600 hover:bg-indigo-700' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                >
                    {interactionState === 'idle' ? <MicIcon className="w-5 h-5"/> : <StopIcon className="w-5 h-5"/>}
                    <span>{interactionState === 'idle' ? 'เริ่มปรึกษา' : 'หยุด'}</span>
                </button>
            </div>
          </div>
        </div>
      </div>

      {(isLoading || analysisResult) && (
        <div className="bg-slate-50/70 p-6 border-t border-slate-200 animate-fade-in">
          {isLoading && <div className="text-center text-slate-600">กำลังวิเคราะห์...</div>}
          {analysisResult && !isLoading && (
            <div className="space-y-4 text-sm">
                <div>
                    <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-1"><CheckCircleIcon className="w-5 h-5 text-green-500"/> การประเมินเบื้องต้น</h4>
                    <p className="text-slate-600 pl-7">{analysisResult.assessment}</p>
                </div>
                 <div>
                    <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-1"><StethoscopeIcon className="w-5 h-5 text-blue-500"/> คำแนะนำ</h4>
                    <p className="text-slate-600 pl-7">{analysisResult.recommendation}</p>
                </div>
                 <div>
                    <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-1"><ExclamationIcon className="w-5 h-5 text-red-500"/> ข้อควรระวัง</h4>
                    <p className="text-slate-600 pl-7">{analysisResult.warning}</p>
                </div>
                {showHospitalButton && (
                    <div className="pt-4 text-center">
                        <button 
                         onClick={() => {
                            const query = encodeURIComponent("โรงพยาบาล คลินิก และร้านขายยา ใกล้ฉัน");
                            window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                         }}
                         className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                            <MapPinIcon className="w-5 h-5" />
                            ค้นหาสถานพยาบาลใกล้เคียง
                        </button>
                    </div>
                )}
            </div>
          )}
        </div>
      )}
      
      {/* History Section */}
      <div className="bg-white border-t border-slate-200">
         <button
            onClick={() => setIsHistoryOpen(o => !o)}
            className="w-full p-4 text-left flex items-center justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-expanded={isHistoryOpen}
          >
            <div className="flex items-center">
              <HistoryIcon className="w-5 h-5 text-slate-500 mr-3"/>
              <h4 className="font-bold text-slate-700 text-sm">ประวัติการปรึกษา ({history.length})</h4>
            </div>
            <ChevronDownIcon className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${isHistoryOpen ? 'rotate-180' : ''}`} />
        </button>
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isHistoryOpen ? 'max-h-[500px] overflow-y-auto' : 'max-h-0'}`}>
            <div className="p-4 pt-0">
                {history.length > 0 ? (
                    <div className="space-y-4">
                        {history.map(item => (
                            <div key={item.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm">
                                <p className="font-semibold text-slate-700 text-xs mb-3 pb-2 border-b border-slate-200">{item.date}</p>
                                <div className="space-y-3">
                                    <div>
                                        <h5 className="font-bold text-slate-800 flex items-center gap-2 mb-1 text-xs">
                                            <UserIcon className="w-4 h-4 text-gray-500"/> อาการที่คุณแจ้ง
                                        </h5>
                                        <p className="text-slate-600 pl-6 text-xs">{item.symptoms}</p>
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-slate-800 flex items-center gap-2 mb-1 text-xs">
                                            <CheckCircleIcon className="w-4 h-4 text-green-500"/> การประเมินเบื้องต้น
                                        </h5>
                                        <p className="text-slate-600 pl-6 text-xs">{item.analysis.assessment}</p>
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-slate-800 flex items-center gap-2 mb-1 text-xs">
                                            <StethoscopeIcon className="w-4 h-4 text-blue-500"/> คำแนะนำ
                                        </h5>
                                        <p className="text-slate-600 pl-6 text-xs">{item.analysis.recommendation}</p>
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-slate-800 flex items-center gap-2 mb-1 text-xs">
                                            <ExclamationIcon className="w-4 h-4 text-red-500"/> ข้อควรระวัง
                                        </h5>
                                        <p className="text-slate-600 pl-6 text-xs">{item.analysis.warning}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div className="text-center pt-2">
                           <button onClick={clearHistory} className="text-xs text-red-500 hover:text-red-700">ล้างประวัติทั้งหมด</button>
                        </div>
                    </div>
                ) : (
                    <p className="text-center text-sm text-slate-500 py-4">ยังไม่มีประวัติการปรึกษา</p>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
