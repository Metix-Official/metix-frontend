'use me';
'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { fetchUserProfile, UserProfile } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { Sliders, Bell, Globe, Sparkles, CheckCircle2, Building2, Save } from 'lucide-react';

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isUpgradeSubmitted, setIsUpgradeSubmitted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      const data = await fetchUserProfile();
      setProfile(data);
      setIsLoading(false);
    }
    loadProfile();
  }, []);

  const isMitraOrOwner = profile?.email === 'lutfifahri175@gmail.com' || profile?.email === 'admin@metix.com';

  const handleUpgradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpgradeSubmitted(true);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <DashboardLayout pageTitle="Account Settings" activeNav="Pengaturan">
      <div className="w-full space-y-6">
        {/* Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-700 text-white p-6 sm:p-8 shadow-xl shadow-blue-700/15 border border-blue-600/30">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-white" /> Preferences & Partner Upgrade
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Account & Notification Settings
            </h2>
            <p className="text-xs text-blue-100 font-medium">
              Configure system alerts, default locale preferences, and Event Organizer partner upgrade.
            </p>
          </div>
        </div>

        {/* Upgrade to Mitra EO Card (If Customer) */}
        {!isMitraOrOwner && (
          <div className="rounded-3xl bg-amber-500/10 border border-amber-500/30 p-6 sm:p-8 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20 shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Upgrade Account to Event Organizer (EO)
                </h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Want to publish your own music concerts, webinars, or festival tickets? Upgrade your account to Mitra EO to gain access to ticket creation and offline POS cashiers.
                </p>
              </div>
            </div>

            {isUpgradeSubmitted ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Application Submitted! Super Admin Platform will review your request shortly.</span>
              </div>
            ) : (
              <form onSubmit={handleUpgradeSubmit} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700">Organization Name</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. LiveNation Indonesia"
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700">Bank Account & Name</label>
                    <input
                      type="text"
                      required
                      placeholder="BCA - 849021021 a/n PT Event Live"
                      className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md shadow-amber-600/20 transition-all cursor-pointer"
                >
                  Submit EO Partner Application
                </button>
              </form>
            )}
          </div>
        )}

        {/* System Preferences Form */}
        {isLoading ? (
          <Skeleton className="h-80 w-full rounded-3xl" />
        ) : (
          <form onSubmit={handleSaveSettings} className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Notification & Regional Settings
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Manage email digests, ticket receipts, and language options
                </p>
              </div>

              {isSaved && (
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Preferences saved
                </span>
              )}
            </div>

            <div className="space-y-4">
              {/* Notification Toggle 1 */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-extrabold text-slate-900">Email Ticket Confirmation</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Send PDF E-Ticket receipt immediately after payment succeeds.
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-blue-600 rounded cursor-pointer" />
              </div>

              {/* Notification Toggle 2 */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-extrabold text-slate-900">Platform Digest & Event Recommendations</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Receive weekly email notifications about upcoming concerts and ticket deals.
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-blue-600 rounded cursor-pointer" />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Preferences
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
