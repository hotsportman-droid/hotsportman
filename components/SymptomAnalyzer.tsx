import React, { useState } from 'react';
import { BrainIcon } from './icons';
import { Modal } from './Modal';
import { AdBanner } from './AdBanner';

export const SymptomAnalyzer: React.FC = () => {
  const [symptoms, setSymptoms] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAnalyze = async () => {
    if (!symptoms.trim()) {
      setError('กรุณาป้อนอาการของคุณ');
      setIsModalOpen(false);
      return;
    }
    
    setIsModalOpen(false);
    setIsLoading(true);
    setError(null);
    setResult('');

    try {
      // Call our new secure backend function
      const response = await fetch('/api/analyze-symptoms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symptoms }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการสื่อสารกับเซิร์ฟเวอร์');
      }
      
      setResult(data.analysis);

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการวิเคราะห์ โปรดลองอีกครั้ง';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const openConfirmationModal = () => {
    if (!symptoms.trim()) {
      setError('กรุณาป้อนอาการของคุณก่อน');
      return;
    }
    setError(null);
    setIsModalOpen(true);
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-slate-200/80 overflow-hidden flex flex-col h-full">
        <div className="p-6 flex-grow flex flex-col">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mr-4 shrink-0">
              <BrainIcon />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">วิเคราะห์อาการป่วยเบื้องต้น (SHC)</h3>
            </div>
          </div>
          <p className="text-slate-600 mb-5 text-sm">
            ป้อนอาการของคุณเพื่อรับการวิเคราะห์เบื้องต้นเกี่ยวกับสาเหตุที่เป็นไปได้
            <strong className="text-red-600 block mt-1">
              เครื่องมือนี้ไม่ใช่การวินิจฉัยทางการแพทย์ โปรดปรึกษาแพทย์
            </strong>
          </p>

          <div className="space-y-4 flex-grow flex flex-col">
            <div className="flex-grow">
              <label htmlFor="symptoms" className="block text-sm font-medium text-slate-700 mb-2">
                อาการของคุณ (เช่น ปวดหัว, มีไข้, ไอ)
              </label>
              <div className="mb-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-800">
                <p className="font-semibold mb-2">ข้อแนะนำในการบอกอาการ:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li><span className="font-semibold">อาการหลัก:</span> เป็นอะไร, ตรงไหน, รุนแรงแค่ไหน</li>
                  <li><span className="font-semibold">ระยะเวลา:</span> เริ่มเป็นเมื่อไหร่, เป็นมานานเท่าไหร่</li>
                  <li><span className="font-semibold">อาการร่วม:</span> มีอาการอื่นร่วมด้วยหรือไม่</li>
                </ul>
              </div>
              <textarea
                id="symptoms"
                rows={5}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="ตัวอย่าง: ปวดหัวข้างขวาแบบตุบๆ มา 2 วันแล้ว มีอาการคลื่นไส้ร่วมด้วย..."
                aria-label="Symptom input"
              />
            </div>
            <button
              onClick={openConfirmationModal}
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'กำลังวิเคราะห์...' : 'วิเคราะห์อาการ'}
            </button>
          </div>

          {error && (
            <div className="mt-6 text-center bg-red-50 text-red-700 p-4 rounded-lg">
              <p>{error}</p>
            </div>
          )}

          {isLoading && (
              <div className="mt-6 text-center" aria-live="polite">
                  <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                      <p className="ml-3 text-slate-600">กำลังประมวลผลข้อมูล...</p>
                  </div>
              </div>
          )}

          {result && !isLoading && (
            <div className="mt-6 bg-slate-50 p-4 rounded-lg border border-slate-200" aria-live="polite">
              <h4 className="font-bold text-slate-800 mb-2">ผลการวิเคราะห์เบื้องต้น:</h4>
              <div className="prose prose-sm max-w-none text-slate-700 pr-2" dangerouslySetInnerHTML={{ __html: result.replace(/###/g, '<h3>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></div>
              <div className="mt-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 text-sm">
                <p className="font-bold">ข้อควรจำที่สำคัญ:</p>
                <p>ผลลัพธ์นี้เป็นเพียงข้อมูลเบื้องต้นเท่านั้น ไม่สามารถใช้แทนการวินิจฉัยจากแพทย์ได้</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        adSlot={<AdBanner />}
      >
        <div className="text-center">
            <h3 className="text-lg font-bold text-slate-800">ยืนยันการวิเคราะห์อาการ</h3>
            <p className="text-sm text-slate-600 mt-2">
                ผลลัพธ์จากการวิเคราะห์โดย SHC เป็นเพียงข้อมูลเบื้องต้นเพื่อการศึกษาเท่านั้น
                และไม่สามารถใช้แทนการวินิจฉัยจากแพทย์ได้
            </p>
            <div className="mt-6 flex justify-center gap-4">
                <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2 rounded-lg bg-slate-200 text-slate-800 font-semibold hover:bg-slate-300 transition-colors"
                >
                    ยกเลิก
                </button>
                <button
                    onClick={handleAnalyze}
                    className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors"
                >
                    ยืนยันและวิเคราะห์
                </button>
            </div>
        </div>
      </Modal>
    </>
  );
};
