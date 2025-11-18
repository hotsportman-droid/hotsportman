import React, { useState } from 'react';
import { Modal } from './Modal';
import { FacebookIcon, LineIcon, LinkIcon } from './icons';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const [copyStatus, setCopyStatus] = useState('คัดลอกลิงก์');

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopyStatus('คัดลอกแล้ว!');
      setTimeout(() => setCopyStatus('คัดลอกลิงก์'), 2000);
    }, () => {
      setCopyStatus('เกิดข้อผิดพลาด');
    });
  };

  const shareUrl = encodeURIComponent(window.location.href);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center">
        <h3 id="modal-title" className="text-xl font-bold text-slate-800">
          แบ่งปันให้เพื่อน
        </h3>
        <p className="text-sm text-slate-600 mt-2">
          แชร์คู่มือตรวจสุขภาพที่เป็นประโยชน์นี้ให้คนที่คุณห่วงใย
        </p>
        <div className="mt-6 space-y-3">
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center px-4 py-3 bg-[#1877F2] text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
          >
            <FacebookIcon className="w-6 h-6 mr-3" />
            แชร์บน Facebook
          </a>
          <a
            href={`https://social-plugins.line.me/lineit/share?url=${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center px-4 py-3 bg-[#00C300] text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
          >
            <LineIcon className="w-6 h-6 mr-3" />
            แชร์บน LINE
          </a>
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center px-4 py-3 bg-slate-200 text-slate-800 font-bold rounded-lg hover:bg-slate-300 transition-colors"
          >
            <LinkIcon className="w-5 h-5 mr-3" />
            {copyStatus}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-4">
          สำหรับการแชร์บน Instagram, TikTok หรืออื่นๆ กรุณาคัดลอกลิงก์
        </p>
      </div>
    </Modal>
  );
};