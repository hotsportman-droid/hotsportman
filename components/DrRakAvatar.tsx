
import React, { useState, useEffect, useRef } from 'react';
import { StethoscopeIcon, CheckCircleIcon, ExclamationIcon, SpeakerWaveIcon, MicIcon, StopIcon, VolumeOffIcon, MapPinIcon, HistoryIcon, ChevronDownIcon, UserIcon } from './icons';
import { GoogleGenAI } from "@google/genai";
import { DrRakSvgAvatar } from './DrRakSvgAvatar';

// --- Types ---
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
type InteractionState = 'idle' | 'listening' | 'analyzing' | 'speaking';

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
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
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

  // Initialize Speech Synthesis Voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };
    
    if (window.speechSynthesis) {
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    return () => {
         if (window.speechSynthesis) {
            window.speechSynthesis.onvoiceschanged = null;
         }
    };
  }, []);

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
      if (stateRef.current !== 'listening') return;

      if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);

      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        setSymptoms(prev => (prev + ' ' + finalTranscript).trim());
      }

      setStatusText(interimTranscript ? 'กำลังฟัง: ' + interimTranscript : 'กำลังฟัง...');

      // Auto-submit after silence
      silenceTimerRef.current = window.setTimeout(() => {
        if (symptomsRef.current.trim().length > 0) {
            handleAnalysis();
        }
      }, 2000);
    };
    
    recognition.onend = () => {
        if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
        const currentState = stateRef.current;
        
        // If recognition stops unexpectedly while listening, check if we have input
        if (currentState === 'listening') {
            if (symptomsRef.current.trim().length > 0) {
                handleAnalysis();
            } else {
                updateStateAndStatus('idle', 'กดปุ่มไมค์เพื่อเริ่มบอกอาการ...');
            }
        }
    };

    recognition.onerror = (event: any) => {
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
            if (stateRef.current === 'listening') {
                 updateStateAndStatus('idle', 'เกิดข้อผิดพลาดในการรับเสียง');
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
    stateRef.current = state;
    setInteractionState(state);
    setStatusText(text);
  };
  
  const speak = (text: string, onEndCallback: () => void = () => {}) => {
    if (isMutedRef.current) {
      console.log("[Muted] Dr. Rak would say:", text);
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
    
    // Robust voice selection
    const thaiVoice = voices.find(v => v.lang.includes('th')) || 
                      voices.find(v => v.lang.includes('TH'));
    
    if (thaiVoice) {
      utterance.voice = thaiVoice;
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    let callbackCalled = false;
    const handleEnd = () => {
        if (!callbackCalled) {
            callbackCalled = true;
            onEndCallback();
        }
    };

    utterance.onend = handleEnd;
    utterance.onerror = (e) => {
        console.error("TTS Error:", e);
        handleEnd();
    };
    
    window.setTimeout(() => window.speechSynthesis.speak(utterance), 50);
  };

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setTimeout(() => {
             updateStateAndStatus('listening', 'กำลังฟัง... เล่าอาการได้เลยค่ะ');
             setSymptoms('');
             setAnalysisResult(null);
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
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  };

  const handleMicClick = async () => {
    if (interactionState === 'idle') {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            startListening();
        } catch (err) {
            console.error('Microphone permission denied:', err);
            setStatusText('กรุณาอนุญาตให้ใช้ไมโครโฟนค่ะ');
        }
    } else {
        stopListening();
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        window.speechSynthesis.cancel();
        updateStateAndStatus('idle', 'กดปุ่มไมค์เพื่อเริ่มบอกอาการ...');
    }
  };

  const constructResponseText = (result: Analysis) => {
      return `จากการวิเคราะห์อาการนะคะ ${result.assessment} หมอขอแนะนำวิธีการดูแลตัวเองเบื้องต้นดังนี้ค่ะ ${result.recommendation} สิ่งที่ต้องระวังเป็นพิเศษคือ ${result.warning} หากอาการไม่ดีขึ้น แนะนำให้ไปพบแพทย์นะคะ`;
  };

  const handleAnalysis = async () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    stopListening();

    if (!symptomsRef.current.trim()) {
        updateStateAndStatus('idle', 'ไม่ได้ระบุอาการ โปรดลองอีกครั้ง');
        return;
    }
    
    updateStateAndStatus('analyzing', 'กำลังวิเคราะห์อาการ... กรุณารอสักครู่ค่ะ');
    setIsLoading(true);

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      updateStateAndStatus('idle', 'เกิดข้อผิดพลาดในการตั้งค่าระบบ');
      setIsLoading(false);
      return;
    }
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      คุณคือ "หมอรักษ์" ผู้ช่วย AI ด้านสุขภาพที่มีความเชี่ยวชาญและเป็นกันเอง
      - ห้ามวินิจฉัยโรคเด็ดขาด ให้ระบุเป็นแนวโน้มหรือสาเหตุที่เป็นไปได้
      - ให้คำแนะนำการดูแลตัวเองที่บ้านอย่างละเอียด เป็นขั้นตอน (Step-by-step) และปฏิบัติได้จริง
      - อธิบายด้วยภาษาที่เข้าใจง่าย อ่อนโยน เหมือนคุยกับคุณหมอใจดี
      - ตอบกลับเป็น JSON object เท่านั้น โดยไม่มี Markdown code block:
      {
        "assessment": "วิเคราะห์สาเหตุที่เป็นไปได้ของอาการอย่างละเอียด",
        "recommendation": "คำแนะนำการดูแลตัวเองอย่างละเอียด เป็นข้อๆ",
        "warning": "สัญญาณเตือนที่ควรไปพบแพทย์ทันที"
      }
      อาการ: "${symptomsRef.current}"
    `;

    try {
      const result = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: 'application/json', safetySettings },
      });
      
      const cleanedJsonString = result.text?.replace(/```json|```/g, '').trim() || '{}';
      const parsedResult: Analysis = JSON.parse(cleanedJsonString);
      setAnalysisResult(parsedResult);
      
      const newHistoryItem: HistoryItem = {
          id: Date.now(),
          date: new Date().toLocaleString('th-TH'),
          symptoms: symptomsRef.current,
          analysis: parsedResult,
      };
      saveHistory(newHistoryItem);

      const responseToSpeak = constructResponseText(parsedResult);
      
      updateStateAndStatus('speaking', 'หมอรักษ์กำลังพูด...');
      // Speak immediately after analysis is ready
      speak(responseToSpeak, () => {
        updateStateAndStatus('idle', 'ปรึกษาอีกครั้ง กดปุ่มไมค์ได้เลยค่ะ');
      });

    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      updateStateAndStatus('idle', 'เกิดข้อผิดพลาดในการวิเคราะห์');
    } finally {
      setIsLoading(false);
    }
  };

  const saveHistory = (newItem: HistoryItem) => {
      setHistory(prev => {
          const newHistory = [newItem, ...prev].slice(0, 20);
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
            <button onClick={() => setIsMuted(m => !m)} className={`text-slate-400 hover:text-indigo-600 transition-colors ${isMuted ? 'text-red-400' : ''}`}>
                {isMuted ? <VolumeOffIcon className="w-6 h-6"/> : <SpeakerWaveIcon className="w-6 h-6"/>}
            </button>
        </div>

        <div className="relative flex flex-col md:flex-row items-center gap-6">
          <div className="relative shrink-0">
            <DrRakSvgAvatar className="w-32 h-32 shadow-lg" />
            <div className={`absolute inset-0 rounded-full border-4 border-indigo-500 transition-all duration-500 pointer-events-none ${interactionState === 'listening' ? 'animate-pulse opacity-100' : 'opacity-0 scale-125'}`}></div>
          </div>

          <div className="w-full">
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="อาการของคุณจะปรากฏที่นี่..."
              className="w-full h-28 p-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              readOnly={interactionState !== 'idle' && interactionState !== 'listening'}
            />
            <div className="flex items-center justify-end gap-2 mt-2">
                <button
                    onClick={handleMicClick}
                    disabled={isLoading || interactionState === 'analyzing' || interactionState === 'speaking'}
                    className={`px-4 py-2 rounded-lg font-bold text-white transition-all flex items-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
                        interactionState === 'idle' 
                        ? 'bg-indigo-600 hover:bg-indigo-700' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                >
                    {interactionState === 'idle' ? <MicIcon className="w-5 h-5"/> : <StopIcon className="w-5 h-5"/>}
                    <span>{interactionState === 'idle' ? 'กดเพื่อพูดอาการ' : 'หยุด / ส่ง'}</span>
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
                 <div className="flex justify-end">
                    <button 
                        onClick={() => speak(constructResponseText(analysisResult))}
                        className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold flex items-center gap-1"
                    >
                        <SpeakerWaveIcon className="w-4 h-4" /> ฟังเสียงอีกครั้ง
                    </button>
                 </div>
                <div>
                    <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-1"><CheckCircleIcon className="w-5 h-5 text-green-500"/> การประเมินเบื้องต้น</h4>
                    <p className="text-slate-600 pl-7 whitespace-pre-line">{analysisResult.assessment}</p>
                </div>
                 <div>
                    <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-1"><StethoscopeIcon className="w-5 h-5 text-blue-500"/> คำแนะนำ</h4>
                    <p className="text-slate-600 pl-7 whitespace-pre-line">{analysisResult.recommendation}</p>
                </div>
                 <div>
                    <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-1"><ExclamationIcon className="w-5 h-5 text-red-500"/> ข้อควรระวัง</h4>
                    <p className="text-slate-600 pl-7 whitespace-pre-line">{analysisResult.warning}</p>
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
