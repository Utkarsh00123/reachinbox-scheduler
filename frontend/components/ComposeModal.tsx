'use client';

import React, { useState } from 'react';
import { emailApi } from '../services/api';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScheduledSuccess: () => void;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({ isOpen, onClose, onScheduledSuccess }) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [senderEmail, setSenderEmail] = useState('alex@reachinbox.ai');
  const [recipientsText, setRecipientsText] = useState('');
  const [parsedEmails, setParsedEmails] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<string>(
    new Date(Date.now() + 60 * 1000).toISOString().slice(0, 16)
  );
  const [delayBetweenEmailsSec, setDelayBetweenEmailsSec] = useState<number>(2);
  const [hourlyLimit, setHourlyLimit] = useState<number>(120);

  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setFileName(file.name);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await emailApi.parseLeads(formData);
      setParsedEmails(res.emails);
      if (res.emails.length === 0) {
        setErrorMsg('No valid email addresses detected in file.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to parse leads file');
    } finally {
      setUploadingFile(false);
    }
  };

  const getAllRecipients = (): string[] => {
    const manualEmails = recipientsText
      .split(/[\n,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0 && e.includes('@'));

    const combined = Array.from(new Set([...manualEmails, ...parsedEmails]));
    return combined;
  };

  const insertVariable = (variable: string) => {
    setBody((prev) => prev + ` {{${variable}}}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const recipients = getAllRecipients();
    if (recipients.length === 0) {
      setErrorMsg('Please enter at least one recipient email address or upload a leads file.');
      return;
    }

    if (!subject.trim()) {
      setErrorMsg('Subject is required.');
      return;
    }

    if (!body.trim()) {
      setErrorMsg('Email body is required.');
      return;
    }

    setSubmitting(true);

    try {
      await emailApi.scheduleEmails({
        subject,
        body,
        recipients,
        senderEmail,
        startTime: new Date(startTime).toISOString(),
        delayBetweenEmailsMs: delayBetweenEmailsSec * 1000,
        hourlyLimit,
      });

      onScheduledSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to schedule emails.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalRecipients = getAllRecipients().length;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#2B2118]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface-container-lowest w-full max-w-3xl rounded-xl border border-[#D8CEBE] shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E5DDD0] flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">edit_note</span>
            <h2 className="font-headline font-bold text-lg text-on-surface">Compose &amp; Schedule Outreach</h2>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body (Scrollable Form) */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3 bg-error-container text-on-error-container rounded-lg text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Sender Email */}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5 font-body">Sender Email Address</label>
            <select
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              className="w-full px-3 py-2 bg-surface-container-lowest border border-[#E5DDD0] rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
            >
              <option value="alex@reachinbox.ai">alex@reachinbox.ai (Primary SMTP)</option>
              <option value="outreach@reachinbox.ai">outreach@reachinbox.ai (Warmup Pool B)</option>
              <option value="sales@reachinbox.ai">sales@reachinbox.ai (Dedicated IP)</option>
              <option value="founders@reachinbox.ai">founders@reachinbox.ai (Executive Channel)</option>
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5 font-body">Email Subject Line</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Scaling outbound infrastructure with ReachInbox"
              required
              className="w-full px-3 py-2 bg-surface-container-lowest border border-[#E5DDD0] rounded-lg text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Body & Variables */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-on-surface font-body">Email Body &amp; Variables</label>
              <div className="flex items-center gap-1 bg-surface-container-low border border-[#E5DDD0] rounded px-2 py-1 text-xs text-on-surface-variant">
                <button
                  type="button"
                  onClick={() => setBody((prev) => prev + ' **bold**')}
                  className="hover:text-on-surface px-1 font-bold cursor-pointer"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => setBody((prev) => prev + ' *italic*')}
                  className="hover:text-on-surface px-1 italic cursor-pointer"
                >
                  I
                </button>
                <span className="text-outline">|</span>
                <button
                  type="button"
                  onClick={() => insertVariable('firstName')}
                  className="hover:text-on-surface px-1 font-mono text-primary cursor-pointer"
                >
                  {'{firstName}'}
                </button>
                <button
                  type="button"
                  onClick={() => insertVariable('company')}
                  className="hover:text-on-surface px-1 font-mono text-primary cursor-pointer"
                >
                  {'{company}'}
                </button>
              </div>
            </div>
            <textarea
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Hi {{firstName}}, I noticed you're scaling outreach at {{company}}..."
              required
              className="w-full p-3 bg-surface-container-lowest border border-[#E5DDD0] rounded-lg text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-colors font-body"
            ></textarea>
          </div>

          {/* 2D Lead Upload Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-on-surface font-body">Recipients &amp; Lead Source</label>
              {totalRecipients > 0 && (
                <span className="text-xs bg-[#FDF0EA] text-[#C9684D] px-2 py-0.5 rounded-full font-medium border border-[#C9684D]/20">
                  Parsed {totalRecipients} lead{totalRecipients > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <label className="border-2 border-dashed border-[#D8CEBE] rounded-xl p-5 text-center bg-surface-container-low/50 hover:bg-surface-container-low transition-colors cursor-pointer mb-3 flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[28px] mb-1">upload_file</span>
              <div className="text-sm font-medium text-on-surface">
                {uploadingFile ? 'Parsing file...' : fileName ? fileName : 'Click to upload CSV or TXT lead list'}
              </div>
              <div className="text-xs text-on-surface-variant mt-0.5">Supports name, email, company columns (Max 5,000 rows)</div>
              <input
                type="file"
                accept=".csv,.txt,.json"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploadingFile}
              />
            </label>

            <textarea
              rows={2}
              value={recipientsText}
              onChange={(e) => setRecipientsText(e.target.value)}
              placeholder="Or paste comma/newline separated emails here..."
              className="w-full p-3 bg-surface-container-lowest border border-[#E5DDD0] rounded-lg text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary font-mono"
            ></textarea>
          </div>

          {/* Throttling & BullMQ Rate Limit Settings Box */}
          <div className="bg-surface-container-low p-4 rounded-xl border border-[#E5DDD0]">
            <div className="text-sm font-medium text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">tune</span>
              Throttling &amp; BullMQ Rate Limit Settings
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-on-surface-variant mb-1">Start Time</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-1.5 bg-surface-container-lowest border border-[#E5DDD0] rounded-lg text-xs text-on-surface focus:outline-none focus:border-primary font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-on-surface-variant mb-1">Inter-email Delay (sec)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={delayBetweenEmailsSec}
                  onChange={(e) => setDelayBetweenEmailsSec(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-surface-container-lowest border border-[#E5DDD0] rounded-lg text-xs text-on-surface focus:outline-none focus:border-primary font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-on-surface-variant mb-1">Hourly Limit (emails/hr)</label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={hourlyLimit}
                  onChange={(e) => setHourlyLimit(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-surface-container-lowest border border-[#E5DDD0] rounded-lg text-xs text-on-surface focus:outline-none focus:border-primary font-mono"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary hover:bg-[#D46A4E] text-on-primary px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
              <span>{submitting ? 'Scheduling Jobs...' : `Schedule ${totalRecipients > 0 ? `(${totalRecipients})` : ''} Emails`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
