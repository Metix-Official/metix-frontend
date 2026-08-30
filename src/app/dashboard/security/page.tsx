'use me';
'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { getStoredToken, fetchUserProfile, UserProfile } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { ShieldCheck, Key, Lock, Copy, Check, Terminal, Laptop, CheckCircle2 } from 'lucide-react';

export default function SecurityPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [isPasswordSaved, setIsPasswordSaved] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const data = await fetchUserProfile();
      setProfile(data);
      const tkn = getStoredToken() || 'sanctum_token_not_found';
      setToken(tkn);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleCopyToken = () => {
    if (token && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(token);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPasswordSaved(true);
    setTimeout(() => setIsPasswordSaved(false), 3000);
  };

  return (
    <DashboardLayout pageTitle="Security & API" activeNav="Security & API">
      <div className="w-full space-y-6">
        {/* Security Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-700 text-white p-6 sm:p-8 shadow-xl shadow-blue-700/15 border border-blue-600/30">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-white" /> Sanctum Authentication & API Tokens
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Security Credentials & API Tokens
            </h2>
            <p className="text-xs text-blue-100 font-medium">
              Inspect active Sanctum Bearer tokens, update password, and manage connected devices.
            </p>
          </div>
        </div>

        {/* Sanctum API Token Inspector Card */}
        {isLoading ? (
          <Skeleton className="h-48 w-full rounded-3xl" />
        ) : (
          <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
                  <Key className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Sanctum Bearer API Token
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Used for authenticating requests to <code className="text-blue-600 font-bold bg-blue-50 px-1 py-0.5 rounded">https://metix-backend.lufexa.id/api</code>
                  </p>
                </div>
              </div>

              <button
                onClick={handleCopyToken}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-white" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-white" /> Copy Token
                  </>
                )}
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto flex items-center gap-3 border border-slate-800">
              <Terminal className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="truncate select-all flex-1 text-slate-300">
                Bearer {token}
              </span>
            </div>
          </div>
        )}

        {/* Change Password Card */}
        {isLoading ? (
          <Skeleton className="h-72 w-full rounded-3xl" />
        ) : (
          <form onSubmit={handlePasswordSubmit} className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Update Account Password
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Ensure your account is using a strong password with letters and symbols
                </p>
              </div>

              {isPasswordSaved && (
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Password updated
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-extrabold text-slate-700">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 hover:shadow-lg transition-all cursor-pointer"
              >
                Update Password
              </button>
            </div>
          </form>
        )}

        {/* Active Sessions List */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-extrabold text-slate-900">
              Active Browser Sessions
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Manage and logout active devices currently logged into your account
            </p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                <Laptop className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-extrabold text-slate-900">
                  Macintosh — Chrome (Current Session)
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  IP Address: 195.35.62.143 • Active Now
                </p>
              </div>
            </div>

            <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Active
            </span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
