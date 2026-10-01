'use client';

import React, { useState, useEffect } from 'react';
import { EmailScheduleItem } from '../services/api';

interface BullMQMonitorProps {
  scheduledEmails: EmailScheduleItem[];
  sentEmails: EmailScheduleItem[];
  onRefresh?: () => void;
}

interface LogEntry {
  id: string;
  worker: number;
  text: string;
  type: 'sent' | 'queued' | 'rate_limited' | 'failed' | 'info';
  timestamp: string;
}

export const BullMQMonitor: React.FC<BullMQMonitorProps> = ({ scheduledEmails, sentEmails, onRefresh }) => {
  const [failedCount, setFailedCount] = useState<number>(0);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: '1',
      worker: 2,
      text: '[Worker #2] SENT email to alex@stripe.com via smtp.reachinbox.ai (200 OK)',
      type: 'sent',
      timestamp: '15:08:12',
    },
    {
      id: '2',
      worker: 1,
      text: '[Worker #1] QUEUED job #8491 (outreach-main)',
      type: 'queued',
      timestamp: '15:08:14',
    },
    {
      id: '3',
      worker: 4,
      text: '[Worker #4] RATE_LIMITED smtp.gmail.com. Backoff 1500ms',
      type: 'rate_limited',
      timestamp: '15:08:15',
    },
    {
      id: '4',
      worker: 3,
      text: '[Worker #3] SENT email to sarah@acme.co via smtp.reachinbox.ai (200 OK)',
      type: 'sent',
      timestamp: '15:08:18',
    },
    {
      id: '5',
      worker: 5,
      text: '[Worker #5] FAILED job #8488: SMTP 550 Mailbox unavailable',
      type: 'failed',
      timestamp: '15:08:20',
    },
    {
      id: '6',
      worker: 2,
      text: '[Worker #2] COMPLETED drip step 2 for lead #9921',
      type: 'sent',
      timestamp: '15:08:22',
    },
  ]);

  // Simulate real-time worker logs
  useEffect(() => {
    const sampleEmails = [
      'dev@github.com',
      'founders@linear.app',
      'lead@vercel.com',
      'cto@supabase.io',
      'alex@stripe.com',
      'sophia@intercom.io',
    ];

    const interval = setInterval(() => {
      const randomWorker = Math.floor(Math.random() * 5) + 1;
      const randomEmail = sampleEmails[Math.floor(Math.random() * sampleEmails.length)];
      const types: ('sent' | 'queued' | 'rate_limited')[] = ['sent', 'sent', 'queued', 'rate_limited'];
      const chosenType = types[Math.floor(Math.random() * types.length)];

      let text = '';
      if (chosenType === 'sent') {
        text = `[Worker #${randomWorker}] SENT email to ${randomEmail} via smtp.reachinbox.ai (200 OK)`;
      } else if (chosenType === 'queued') {
        text = `[Worker #${randomWorker}] QUEUED job #${Math.floor(Math.random() * 9000 + 1000)} (outreach-main)`;
      } else {
        text = `[Worker #${randomWorker}] RATE_LIMITED ${randomEmail.split('@')[1]}. Sliding window deferred`;
      }

      setLogs((prev) => {
        const next = [...prev, {
          id: Math.random().toString(),
          worker: randomWorker,
          text,
          type: chosenType,
          timestamp: new Date().toLocaleTimeString(),
        }];
        return next.slice(-25);
      });
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const handleRetryAll = () => {
    setFailedCount(0);
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        worker: 0,
        text: '[System] Successfully re-queued failed dead-letter jobs into BullMQ.',
        type: 'info',
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const handleClearLogs = () => {
    setLogs([
      {
        id: Math.random().toString(),
        worker: 0,
        text: '[System] Log stream cleared.',
        type: 'info',
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const handleRefresh = () => {
    if (onRefresh) onRefresh();
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        worker: 0,
        text: '[System] Telemetry data manually refreshed from Redis cluster.',
        type: 'info',
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  return (
    <div className="flex flex-col w-full bg-surface text-on-surface px-margin py-space-md">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md pb-space-lg border-b border-[#E5DDD0]">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-md">
            <h1 className="font-headline text-3xl font-bold text-on-surface">BullMQ Worker Monitor</h1>
            <span className="px-space-sm py-space-xs bg-surface-container-high text-on-surface rounded-full text-xs font-medium flex items-center gap-space-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span> Cluster Healthy
            </span>
          </div>
          <p className="font-body text-sm text-on-surface-variant">
            Real-time Redis queue telemetry, worker concurrency threads, and SMTP throughput
          </p>
        </div>
        <div className="flex items-center gap-space-md">
          <button
            onClick={handleRefresh}
            className="px-space-md py-space-sm bg-surface-container-lowest text-on-surface border border-[#E5DDD0] rounded-lg text-sm font-medium hover:bg-surface-container-high transition-colors flex items-center gap-space-sm cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span> Refresh Telemetry
          </button>
          <a
            href="http://localhost:5001/admin/queues"
            target="_blank"
            rel="noreferrer"
            className="px-space-md py-space-sm bg-primary hover:bg-[#D46A4E] text-on-primary rounded-lg text-sm font-medium transition-colors flex items-center gap-space-sm shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">bolt</span> Bull-Board UI
          </a>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter my-space-lg">
        {/* Active Workers */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl border border-[#E5DDD0] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-xs font-medium uppercase tracking-wider">Active Workers</span>
            <span className="material-symbols-outlined text-[20px] text-primary">engineering</span>
          </div>
          <div className="my-space-md">
            <div className="text-3xl font-headline font-bold text-on-surface">5 / 5</div>
            <div className="text-xs text-emerald-600 mt-space-xs font-medium">Concurrency maxed</div>
          </div>
          <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
            <div className="bg-primary h-full w-full"></div>
          </div>
        </div>

        {/* Redis Memory */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl border border-[#E5DDD0] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-xs font-medium uppercase tracking-wider">Redis Memory</span>
            <span className="material-symbols-outlined text-[20px] text-primary">database</span>
          </div>
          <div className="my-space-md">
            <div className="text-3xl font-headline font-bold text-on-surface">42.8 MB</div>
            <div className="text-xs text-on-surface-variant mt-space-xs">TTL active (24h sweep)</div>
          </div>
          <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
            <div className="bg-secondary h-full w-[42%]"></div>
          </div>
        </div>

        {/* Failed Jobs */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl border border-[#E5DDD0] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-xs font-medium uppercase tracking-wider">Failed Jobs (Dead Letter)</span>
            <span className="material-symbols-outlined text-[20px] text-error">error</span>
          </div>
          <div className="my-space-md flex items-baseline justify-between">
            <div>
              <div className="text-3xl font-headline font-bold text-error">{failedCount}</div>
              <div className="text-xs text-error/80 mt-space-xs font-medium">SMTP 550 Mailbox unavailable</div>
            </div>
            {failedCount > 0 && (
              <button
                onClick={handleRetryAll}
                className="px-2.5 py-1 bg-error-container text-on-error-container rounded text-xs font-medium hover:opacity-80 transition-opacity"
              >
                Retry All
              </button>
            )}
          </div>
          <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
            <div className="bg-error h-full" style={{ width: `${Math.min(failedCount * 15, 100)}%` }}></div>
          </div>
        </div>

        {/* Throughput */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl border border-[#E5DDD0] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-xs font-medium uppercase tracking-wider">Throughput</span>
            <span className="material-symbols-outlined text-[20px] text-primary">speed</span>
          </div>
          <div className="my-space-md">
            <div className="text-3xl font-headline font-bold text-on-surface">14.2 req/sec</div>
            <div className="text-xs text-emerald-600 mt-space-xs font-medium">+2.4% vs last hour</div>
          </div>
          <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
            <div className="bg-primary h-full w-[70%]"></div>
          </div>
        </div>
      </div>

      {/* Active Queues Table & Live Stream Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter mt-space-md">
        {/* Active Queues Table (Span 2) */}
        <div className="lg:col-span-2 bg-surface-container-lowest p-space-lg rounded-xl border border-[#E5DDD0] flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-space-md">
            <h2 className="font-headline text-lg font-bold text-on-surface">Active Queues &amp; Workers</h2>
            <div className="flex items-center gap-space-sm">
              <span className="text-xs font-medium text-on-surface-variant">Auto-poll: 2s</span>
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5DDD0] text-on-surface-variant text-xs font-medium uppercase tracking-wider">
                  <th className="py-space-md px-space-sm">Queue Name</th>
                  <th className="py-space-md px-space-sm">Status</th>
                  <th className="py-space-md px-space-sm text-right">Active</th>
                  <th className="py-space-md px-space-sm text-right">Completed</th>
                  <th className="py-space-md px-space-sm text-right">Failed</th>
                  <th className="py-space-md px-space-sm text-right">Latency</th>
                </tr>
              </thead>
              <tbody className="text-sm text-on-surface divide-y divide-[#E5DDD0]">
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="py-space-md px-space-sm font-mono text-xs text-primary font-medium">email-scheduler-queue</td>
                  <td className="py-space-md px-space-sm">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs font-medium">Active</span>
                  </td>
                  <td className="py-space-md px-space-sm text-right font-mono">{scheduledEmails.length}</td>
                  <td className="py-space-md px-space-sm text-right font-mono">{sentEmails.length}</td>
                  <td className="py-space-md px-space-sm text-right font-mono">{failedCount}</td>
                  <td className="py-space-md px-space-sm text-right font-mono text-on-surface-variant">45ms</td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="py-space-md px-space-sm font-mono text-xs text-primary font-medium">followup-drip</td>
                  <td className="py-space-md px-space-sm">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs font-medium">Active</span>
                  </td>
                  <td className="py-space-md px-space-sm text-right font-mono">8</td>
                  <td className="py-space-md px-space-sm text-right font-mono">1,280</td>
                  <td className="py-space-md px-space-sm text-right font-mono">0</td>
                  <td className="py-space-md px-space-sm text-right font-mono text-on-surface-variant">32ms</td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="py-space-md px-space-sm font-mono text-xs text-primary font-medium">smtp-dispatch</td>
                  <td className="py-space-md px-space-sm">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs font-medium">Active</span>
                  </td>
                  <td className="py-space-md px-space-sm text-right font-mono">5</td>
                  <td className="py-space-md px-space-sm text-right font-mono">8,912</td>
                  <td className="py-space-md px-space-sm text-right font-mono">2</td>
                  <td className="py-space-md px-space-sm text-right font-mono text-on-surface-variant">120ms</td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="py-space-md px-space-sm font-mono text-xs text-tertiary font-medium">bounce-handler</td>
                  <td className="py-space-md px-space-sm">
                    <span className="px-2 py-0.5 bg-surface-container-high text-on-surface-variant rounded text-xs font-medium">Paused</span>
                  </td>
                  <td className="py-space-md px-space-sm text-right font-mono">0</td>
                  <td className="py-space-md px-space-sm text-right font-mono">340</td>
                  <td className="py-space-md px-space-sm text-right font-mono">0</td>
                  <td className="py-space-md px-space-sm text-right font-mono text-on-surface-variant">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Job Stream / Terminal log */}
        <div className="bg-[#2B2118] text-[#FBF8F3] p-space-lg rounded-xl border border-[#4d4541] flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between pb-space-md border-b border-[#4d4541]">
            <div className="flex items-center gap-space-sm">
              <span className="w-3 h-3 rounded-full bg-error inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              <span className="font-mono text-xs text-tertiary-fixed-dim ml-space-xs">bullmq-worker.log</span>
            </div>
            <button
              onClick={handleClearLogs}
              className="text-xs text-tertiary-fixed-dim hover:text-[#FBF8F3] transition-colors font-mono cursor-pointer"
            >
              clear
            </button>
          </div>

          <div className="font-mono text-xs space-y-2 my-space-md overflow-y-auto max-h-[260px] pr-space-xs scrollbar-thin">
            {logs.map((log) => {
              let colorClass = 'text-emerald-400';
              if (log.type === 'queued') colorClass = 'text-surface-container-highest';
              if (log.type === 'rate_limited') colorClass = 'text-amber-300';
              if (log.type === 'failed') colorClass = 'text-red-400';
              if (log.type === 'info') colorClass = 'text-primary-fixed';

              return (
                <div key={log.id} className={colorClass}>
                  {log.text}
                </div>
              );
            })}
          </div>

          <div className="pt-space-md border-t border-[#4d4541] flex items-center justify-between text-xs font-mono text-tertiary-fixed-dim">
            <span>Listening for Redis worker events...</span>
            <span className="animate-pulse font-bold text-white">_</span>
          </div>
        </div>
      </div>
    </div>
  );
};
