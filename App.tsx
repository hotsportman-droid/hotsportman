import React, { useState, useEffect } from 'react';
import { HealthCheckCard } from './components/HealthCheckCard';
import { BMICalculator } from './components/BMICalculator';
import { SymptomAnalyzer } from './components/SymptomAnalyzer';
import { NearbyHospitals } from './components/NearbyHospitals';
import { HEALTH_CHECKS } from './constants';
import { StethoscopeIcon, DownloadIcon, ShareIcon } from './components/icons';
import { ShareModal } from './components/ShareModal';
import { Modal } from './components/Modal';

const App: React.FC = () => {
  const [openAccordion, setOpenAccordion] = React.useState<string | null>('pulse-check');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallModalOpen(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      setDeferredPrompt(null);
      setIsInstallModalOpen(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Self Health Check Guide',
      text: 'คู่มือตรวจสุขภาพด้วยตนเอง ลองเข้าไปดูสิ มีประโยชน์มากๆ เลย!',
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback for desktop browsers
      setIsShareModalOpen(true);
    }
  };

  const handleToggle = (key: string) => {
    setOpenAccordion(prevKey => (prevKey === key ? null : key));
  };

  const pulseCheck = HEALTH_CHECKS.find(
    (check) => check.title === 'การวัดชีพจร (Pulse Rate)'
  );
  const respirationCheck = HEALTH_CHECKS.find(
    (check) => check.title === 'การสังเกตการหายใจ (Respiration)'
  );

  const otherChecks = HEALTH_CHECKS.filter(
    (check) =>
      check.title !== 'การวัดชีพจร (Pulse Rate)' &&
      check.title !== 'การสังเกตการหายใจ (Respiration)'
  );

  return (
    <>
      <div className="min-h-screen bg-slate-50 text-slate-800">
        <header className="bg-slate-50/80 backdrop-blur-lg shadow-sm sticky top-0 z-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center space-x-3">
                <StethoscopeIcon className="h-8 w-8 text-indigo-500" />
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                  Self Health Check
                </h1>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleShare}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-200 text-slate-800 text-sm font-semibold rounded-lg shadow-sm hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"
                  aria-label="Share app"
                >
                  <ShareIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">แชร์</span>
                </button>
                {deferredPrompt && (
                  <button
                    onClick={handleInstallClick}
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"
                    aria-label="Install app"
                  >
                    <DownloadIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">ติดตั้งแอป</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
          
          {/* Hero Section */}
          <section className="text-center py-12">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-800 tracking-tighter">
                  คู่มือตรวจสุขภาพด้วยตนเอง
              </h2>
              <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
                  เครื่องมือและคำแนะนำเบื้องต้นสำหรับการสังเกตและตรวจสอบสุขภาพร่างกายของคุณง่ายๆ ที่บ้าน
              </p>
          </section>

          {/* Primary Tools Section */}
          <section className="mb-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  <SymptomAnalyzer />
                  <NearbyHospitals />
              </div>
          </section>

          {/* Self-Check Guides Section */}
          <section>
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-slate-700">คู่มือการตรวจเช็คเบื้องต้น</h3>
              <p className="text-slate-500 mt-1">ขั้นตอนการสังเกตสุขภาพด้านต่างๆ ด้วยตนเอง</p>
            </div>
            <div className="max-w-3xl mx-auto space-y-4">
              {pulseCheck && (
                <HealthCheckCard
                  key="pulse-check"
                  icon={<StethoscopeIcon />}
                  title={pulseCheck.title}
                  description={pulseCheck.description}
                  steps={pulseCheck.steps}
                  isOpen={openAccordion === 'pulse-check'}
                  onToggle={() => handleToggle('pulse-check')}
                />
              )}
              {respirationCheck && (
                <HealthCheckCard
                  key="respiration-check"
                  icon={<StethoscopeIcon />}
                  title={respirationCheck.title}
                  description={respirationCheck.description}
                  steps={respirationCheck.steps}
                  isOpen={openAccordion === 'respiration-check'}
                  onToggle={() => handleToggle('respiration-check')}
                />
              )}
              {otherChecks.map((check) => (
                <HealthCheckCard
                  key={check.title}
                  icon={check.icon}
                  title={check.title}
                  description={check.description}
                  steps={check.steps}
                  isOpen={openAccordion === check.title}
                  onToggle={() => handleToggle(check.title)}
                />
              ))}
              <BMICalculator 
                isOpen={openAccordion === 'bmi-calculator'}
                onToggle={() => handleToggle('bmi-calculator')}
              />
            </div>
          </section>

        </main>

        <footer className="bg-white mt-16 py-8 border-t border-slate-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500 text-sm">
            <p className="font-semibold text-red-600 mb-2">ข้อควรระวัง</p>
            <p className="max-w-2xl mx-auto">
              ข้อมูลในแอปพลิเคชันนี้เป็นเพียงคำแนะนำเบื้องต้น
              ไม่สามารถใช้แทนการวินิจฉัยหรือการรักษาจากแพทย์ผู้เชี่ยวชาญได้
              หากมีความกังวลเกี่ยวกับสุขภาพ ควรปรึกษาแพทย์เสมอ
            </p>
          </div>
        </footer>
      </div>
      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} />
      
      <Modal isOpen={isInstallModalOpen} onClose={() => setIsInstallModalOpen(false)}>
        <div className="text-center">
          <h3 className="text-xl font-bold text-slate-800">ติดตั้งแอปพลิเคชัน</h3>
          <div className="mt-4 mb-4 flex justify-center">
             <div className="p-4 bg-indigo-50 rounded-full ring-4 ring-indigo-50">
                <DownloadIcon className="w-8 h-8 text-indigo-600" />
             </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            เพิ่ม <strong>"Self Health Check"</strong> ไว้ที่หน้าจอหลัก<br/>
            เพื่อการเข้าถึงที่สะดวกรวดเร็วและใช้งานได้ดียิ่งขึ้น
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => setIsInstallModalOpen(false)}
              className="px-5 py-2.5 rounded-lg bg-slate-100 text-slate-600 font-semibold hover:bg-slate-200 transition-colors text-sm"
            >
              ไว้ทีหลัง
            </button>
            <button
              onClick={handleInstallClick}
              className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all text-sm shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transform hover:-translate-y-0.5"
            >
              ติดตั้งเลย
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default App;