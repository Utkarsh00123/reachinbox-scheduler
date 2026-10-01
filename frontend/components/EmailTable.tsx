'use client';

import React from 'react';
import { format } from 'date-fns';
import { EmailScheduleItem } from '../services/api';

interface EmailTableProps {
  type: 'scheduled' | 'sent';
  emails: EmailScheduleItem[];
  loading: boolean;
  onComposeClick: () => void;
  onPreviewClick: (email: EmailScheduleItem) => void;
}

const AVATAR_PALETTES = [
  'bg-primary-container text-on-primary-container',
  'bg-secondary-container text-on-secondary-container',
  'bg-tertiary-container text-on-tertiary-container',
  'bg-surface-container-high text-on-surface-variant',
  'bg-[#EFF5EE] text-[#4A7C59]',
];

export const EmailTable: React.FC<EmailTableProps> = ({
  type,
  emails,
  loading,
  onComposeClick,
  onPreviewClick,
}) => {
  if (loading) {
    return (
      <div className="bg-surface-container-lowest rounded-xl border border-[#E5DDD0] p-12 text-center shadow-sm">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium text-on-surface-variant">Fetching {type} emails from Redis queue...</p>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="bg-surface-container-lowest rounded-xl border border-[#E5DDD0] p-14 text-center shadow-sm">
        <div className="w-14 h-14 bg-surface-container-high rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
          <span className="material-symbols-outlined text-[28px]">
            {type === 'scheduled' ? 'calendar_clock' : 'mark_email_read'}
          </span>
        </div>
        <h3 className="font-headline font-bold text-lg text-on-surface mb-1">
          {type === 'scheduled' ? 'No Scheduled Emails in Queue' : 'No Emails Sent Yet'}
        </h3>
        <p className="text-sm text-on-surface-variant max-w-sm mx-auto mb-6">
          {type === 'scheduled'
            ? 'Schedule cold outreach campaigns with customizable delays, rate limits, and lead CSV files.'
            : 'Sent emails and their live SMTP delivery records will appear here.'}
        </p>
        <button
          onClick={onComposeClick}
          className="bg-primary hover:bg-[#D46A4E] text-on-primary px-5 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Compose New Email
        </button>
      </div>
    );
  }

  const getInitials = (emailStr: string) => {
    const namePart = emailStr.split('@')[0];
    const parts = namePart.split(/[._-]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return emailStr.slice(0, 2).toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return (
          <span className="bg-[#EFF5EE] text-[#4A7C59] px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5 border border-[#4A7C59]/10">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4A7C59]"></span>
            Sent
          </span>
        );
      case 'RATE_LIMITED':
        return (
          <span className="bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
            Rate Limited
          </span>
        );
      case 'FAILED':
        return (
          <span className="bg-error-container text-on-error-container px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
            Failed
          </span>
        );
      case 'QUEUED':
        return (
          <span className="bg-surface-container-high text-on-surface px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            Queued
          </span>
        );
      case 'SCHEDULED':
      default:
        return (
          <span className="bg-[#FDF0EA] text-[#C9684D] px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5 border border-[#C9684D]/10">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9684D]"></span>
            Scheduled
          </span>
        );
    }
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-[#E5DDD0] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-[#E5DDD0] text-xs uppercase tracking-wider text-on-surface-variant font-medium">
              <th className="py-3 px-4">Recipient</th>
              <th className="py-3 px-4">Subject</th>
              <th className="py-3 px-4">Sender Email</th>
              <th className="py-3 px-4">{type === 'scheduled' ? 'Scheduled Time' : 'Sent Time'}</th>
              <th className="py-3 px-4">Status</th>
              {type === 'sent' && <th className="py-3 px-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5DDD0] text-sm text-on-surface">
            {emails.map((email, idx) => {
              const initials = getInitials(email.recipient);
              const paletteClass = AVATAR_PALETTES[idx % AVATAR_PALETTES.length];
              const dateVal = type === 'scheduled' ? email.scheduledAt : email.sentAt;
              let dateFormatted = '-';
              if (dateVal) {
                try {
                  dateFormatted = format(new Date(dateVal), 'MMM d, h:mm a');
                } catch {
                  dateFormatted = String(dateVal);
                }
              }

              return (
                <tr key={email.id} className="hover:bg-surface-container-low/50 transition-colors">
                  {/* Recipient */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${paletteClass} flex items-center justify-center font-bold text-xs`}>
                        {initials}
                      </div>
                      <div>
                        <div className="font-medium text-on-surface">{email.recipient.split('@')[0]}</div>
                        <div className="text-xs text-on-surface-variant font-mono">{email.recipient}</div>
                      </div>
                    </div>
                  </td>

                  {/* Subject */}
                  <td className="py-3.5 px-4 font-medium text-on-surface max-w-[280px] truncate" title={email.subject}>
                    {email.subject}
                  </td>

                  {/* Sender */}
                  <td className="py-3.5 px-4">
                    <span className="bg-[#F4EFE6] px-2 py-1 rounded text-xs font-mono text-on-surface-variant border border-[#E5DDD0]/50">
                      {email.senderEmail}
                    </span>
                  </td>

                  {/* Time */}
                  <td className="py-3.5 px-4 text-on-surface-variant text-xs">
                    {dateFormatted}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    {getStatusBadge(email.status)}
                  </td>

                  {/* Actions for sent */}
                  {type === 'sent' && (
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onPreviewClick(email)}
                        className="text-xs bg-surface-container-high hover:bg-surface-variant text-on-surface px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <span className="material-symbols-outlined text-[14px]">visibility</span>
                        View Preview
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
