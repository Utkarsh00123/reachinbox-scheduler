'use client';

import React from 'react';
import { UserProfile, slackApi } from '../services/api';

interface NavbarProps {
  user: UserProfile;
  currentView: 'campaigns' | 'bullmq';
  onViewChange: (view: 'campaigns' | 'bullmq') => void;
  onLogout: () => void;
  onSlackStatusChange?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentView,
  onViewChange,
  onLogout,
  onSlackStatusChange,
}) => {
  const [connectingSlack, setConnectingSlack] = React.useState(false);
  const [testingSlack, setTestingSlack] = React.useState(false);
  const [slackMsg, setSlackMsg] = React.useState<string | null>(null);

  const handleConnectSlack = async () => {
    try {
      setConnectingSlack(true);
      const { url } = await slackApi.getAuthUrl();
      if (url) {
        window.location.href = url;
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to initiate Slack connection');
    } finally {
      setConnectingSlack(false);
    }
  };

  const handleDisconnectSlack = async () => {
    if (confirm('Are you sure you want to disconnect Slack notifications?')) {
      try {
        await slackApi.disconnect();
        if (onSlackStatusChange) onSlackStatusChange();
      } catch (err: any) {
        alert('Failed to disconnect Slack');
      }
    }
  };

  const handleTestSlackAlert = async () => {
    try {
      setTestingSlack(true);
      await slackApi.testAlert();
      setSlackMsg('✅ Live test alert triggered! Check your Slack channel.');
      setTimeout(() => setSlackMsg(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to send test alert');
    } finally {
      setTestingSlack(false);
    }
  };

  return (
    <header className="sticky top-0 left-0 right-0 h-16 bg-surface-container-low z-40 flex items-center justify-between px-gutter border-b border-[#E5DDD0]">
      {/* Brand & Logo */}
      <div className="flex items-center gap-space-md">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary font-headline font-black text-lg shadow-xs">
          R
        </div>
        <span className="font-headline font-bold text-xl text-on-surface tracking-tight">ReachInbox</span>
        <span className="text-xs bg-primary-container text-on-primary-container px-space-sm py-0.5 rounded-full font-medium">
          Scheduler v2.0
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="hidden md:flex items-center gap-space-sm">
        <button
          onClick={() => onViewChange('campaigns')}
          className={`px-space-md py-space-sm text-sm font-medium rounded-xl transition-all cursor-pointer ${
            currentView === 'campaigns'
              ? 'bg-primary-container text-on-primary-container font-bold shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
          }`}
        >
          Campaigns &amp; Scheduler
        </button>
        <button
          onClick={() => onViewChange('bullmq')}
          className={`px-space-md py-space-sm text-sm font-medium rounded-xl transition-all cursor-pointer ${
            currentView === 'bullmq'
              ? 'bg-primary-container text-on-primary-container font-bold shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
          }`}
        >
          BullMQ Dashboard
        </button>
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-space-md sm:gap-space-lg">
        {/* Slack Connection */}
        {user.slackConnected ? (
          <div className="flex items-center gap-space-sm bg-surface-container-high px-space-md py-space-xs rounded-full text-xs text-on-surface border border-[#E5DDD0]">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span className="font-medium">Slack Connected</span>
            <button
              onClick={handleTestSlackAlert}
              disabled={testingSlack}
              className="text-primary hover:underline font-semibold ml-1 cursor-pointer"
            >
              {testingSlack ? 'Testing...' : 'Test Alert'}
            </button>
            <button
              onClick={handleDisconnectSlack}
              className="text-on-surface-variant hover:text-error ml-0.5"
              title="Disconnect Slack"
            >
              ×
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnectSlack}
            disabled={connectingSlack}
            className="flex items-center gap-space-xs bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-space-md py-space-xs rounded-full text-xs font-medium border border-[#E5DDD0] transition-colors cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Connect Slack</span>
          </button>
        )}

        {/* User profile */}
        <div className="flex items-center gap-space-sm pl-2 border-l border-[#E5DDD0]">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-medium text-xs">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              user.name ? user.name.slice(0, 2).toUpperCase() : 'AM'
            )}
          </div>
          <span className="text-sm font-medium text-on-surface hidden sm:inline">{user.name}</span>
          <button
            onClick={onLogout}
            className="text-on-surface-variant hover:text-error p-1 rounded transition-colors cursor-pointer"
            title="Logout"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </div>

      {slackMsg && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 mt-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-300 px-4 py-1.5 rounded-full shadow-sm">
          {slackMsg}
        </div>
      )}
    </header>
  );
};
