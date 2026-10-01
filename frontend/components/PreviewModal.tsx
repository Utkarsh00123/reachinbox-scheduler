'use client';

import React from 'react';
import { EmailScheduleItem } from '../services/api';

interface PreviewModalProps {
  email: EmailScheduleItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ email, isOpen, onClose }) => {
  if (!isOpen || !email) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#2B2118]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface-container-lowest w-full max-w-2xl rounded-xl border border-[#D8CEBE] shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Preview Header */}
        <div className="px-6 py-4 border-b border-[#E5DDD0] flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-700 text-[20px]">mark_email_read</span>
            <h3 className="font-headline font-bold text-lg text-on-surface">Live SMTP Email Preview</h3>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Preview Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="bg-surface-container-low p-4 rounded-lg border border-[#E5DDD0] space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-outline">To:</span>
              <span className="font-medium text-on-surface">{email.recipient}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-outline">From:</span>
              <span className="font-mono text-on-surface-variant bg-[#F4EFE6] px-2 py-0.5 rounded">{email.senderEmail}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-outline">Dispatched:</span>
              <span className="text-on-surface-variant">
                {email.sentAt ? new Date(email.sentAt).toLocaleString() : 'Just now'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-outline">SMTP Status:</span>
              <span className="text-emerald-700 font-medium">Delivered (250 OK - Message accepted for delivery)</span>
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-outline uppercase tracking-wider mb-1 font-body">Rendered Subject</div>
            <div className="font-headline font-bold text-lg text-on-surface">{email.subject}</div>
          </div>

          <div>
            <div className="text-xs font-medium text-outline uppercase tracking-wider mb-1 font-body">Rendered Body</div>
            <div className="bg-surface-container-lowest border border-[#E5DDD0] p-4 rounded-lg text-sm text-on-surface font-body whitespace-pre-wrap leading-relaxed space-y-2">
              {email.body}
            </div>
          </div>

          {email.etherealMessageUrl && (
            <div className="p-3 bg-primary-container/10 border border-primary-container/30 rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-primary font-medium">
                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                <span>Live Ethereal Fake SMTP Message Stream</span>
              </div>
              <a
                href={email.etherealMessageUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-primary hover:bg-[#D46A4E] text-on-primary px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              >
                Open in Ethereal
              </a>
            </div>
          )}
        </div>

        {/* Preview Footer */}
        <div className="px-6 py-3 border-t border-[#E5DDD0] flex items-center justify-end bg-surface-container-low">
          <button
            onClick={onClose}
            className="bg-surface-container-high hover:bg-surface-variant text-on-surface px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
