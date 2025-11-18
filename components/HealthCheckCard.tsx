import React from 'react';
import { ChevronDownIcon } from './icons';

interface HealthCheckCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  steps: string[];
  isOpen: boolean;
  onToggle: () => void;
}

export const HealthCheckCard: React.FC<HealthCheckCardProps> = ({ icon, title, description, steps, isOpen, onToggle }) => {
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
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
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
          <p className="text-slate-600 mb-5 text-sm">{description}</p>
          <div>
            <h4 className="font-semibold text-slate-700 mb-2 text-sm">ขั้นตอนการตรวจ:</h4>
            <ul className="space-y-2 text-slate-600 text-sm">
              {steps.map((step, index) => (
                <li key={index} className="flex items-start">
                  <svg
                    className="w-4 h-4 text-indigo-500 mr-2 mt-0.5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
