import React, { useState, useMemo } from 'react';
import { ScaleIcon, ChevronDownIcon } from './icons';

interface BMICalculatorProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const BMICalculator: React.FC<BMICalculatorProps> = ({ isOpen, onToggle }) => {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmi, setBmi] = useState<number | null>(null);

  const calculateBmi = () => {
    const h = parseFloat(height) / 100;
    const w = parseFloat(weight);
    if (h > 0 && w > 0) {
      const bmiValue = w / (h * h);
      setBmi(bmiValue);
    } else {
        setBmi(null);
    }
  };

  const bmiResult = useMemo(() => {
    if (bmi === null) return null;

    let category = '';
    let color = '';
    let advice = '';

    if (bmi < 18.5) {
      category = 'น้ำหนักน้อย / ผอม';
      color = 'text-blue-500';
      advice = 'ควรรับประทานอาหารที่มีประโยชน์ให้มากขึ้นและออกกำลังกายเพื่อสร้างกล้ามเนื้อ';
    } else if (bmi >= 18.5 && bmi < 23) {
      category = 'ปกติ (สุขภาพดี)';
      color = 'text-green-500';
      advice = 'เยี่ยมมาก! รักษาน้ำหนักและวิถีชีวิตเพื่อสุขภาพที่ดีต่อไป';
    } else if (bmi >= 23 && bmi < 25) {
      category = 'ท้วม / โรคอ้วนระดับ 1';
      color = 'text-yellow-600';
      advice = 'ควรเริ่มควบคุมอาหารและเพิ่มการออกกำลังกายเพื่อลดความเสี่ยงต่อโรค';
    } else if (bmi >= 25 && bmi < 30) {
      category = 'อ้วน / โรคอ้วนระดับ 2';
      color = 'text-orange-500';
      advice = 'มีความเสี่ยงต่อโรคที่มากับความอ้วน ควรปรึกษาผู้เชี่ยวชาญ';
    } else {
      category = 'อ้วนมาก / โรคอ้วนระดับ 3';
      color = 'text-red-500';
      advice = 'มีความเสี่ยงสูงต่อโรคอันตราย ควรปรึกษาแพทย์เพื่อรับการดูแลอย่างเหมาะสม';
    }

    return {
      value: bmi.toFixed(2),
      category,
      color,
      advice,
    };
  }, [bmi]);

  return (
    <div
      className="bg-white rounded-xl shadow-md border border-slate-200/80 overflow-hidden transition-all duration-300 ease-in-out"
    >
      <button
        onClick={onToggle}
        className="w-full p-6 text-left flex items-center justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl"
        aria-expanded={isOpen}
      >
        <div className="flex items-center">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mr-4 shrink-0">
                <ScaleIcon />
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-800">คำนวณดัชนีมวลกาย (BMI)</h3>
            </div>
        </div>
        <ChevronDownIcon className={`w-6 h-6 text-slate-500 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[1000px]' : 'max-h-0'
        }`}
      >
        <div className="px-6 pb-6 pt-0">
          <p className="text-slate-600 mb-5 text-sm">
            ประเมินภาวะอ้วนและผอมในผู้ใหญ่ เพื่อประเมินความเสี่ยงต่อการเกิดโรคต่างๆ
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-slate-700">
                น้ำหนัก (กิโลกรัม)
              </label>
              <input
                type="number"
                id="weight"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="เช่น 60"
              />
            </div>
            <div>
              <label htmlFor="height" className="block text-sm font-medium text-slate-700">
                ส่วนสูง (เซนติเมตร)
              </label>
              <input
                type="number"
                id="height"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="เช่น 175"
              />
            </div>
            <button
              onClick={calculateBmi}
              className="w-full bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              คำนวณ BMI
            </button>
          </div>

          {bmiResult && (
            <div className="mt-6 text-center bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-slate-600 text-sm">ค่า BMI ของคุณคือ</p>
              <p className={`text-4xl font-bold my-1 ${bmiResult.color}`}>{bmiResult.value}</p>
              <p className={`font-semibold ${bmiResult.color}`}>{bmiResult.category}</p>
              <p className="text-xs text-slate-500 mt-2 px-2">{bmiResult.advice}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
