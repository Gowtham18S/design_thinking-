import React, { useState } from 'react';
import { Shield, Lock, QrCode, Radio, Save, CheckCircle2, ShieldAlert } from 'lucide-react';
import type { EmergencyProfile, LanguageCode, PrivacyShareSettings } from '../types';
import { LocalDB } from '../database/local_db';
import { SUPPORTED_LANGUAGES } from '../models/language';
import { QRModal } from '../widgets/qr_modal';
import { NearbyShareModal } from '../widgets/nearby_share_modal';

export const EmergencyCardScreen: React.FC = () => {
  const [profile, setProfile] = useState<EmergencyProfile>(LocalDB.getEmergencyProfile());
  const [isSaved, setIsSaved] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isNearbyShareOpen, setIsNearbyShareOpen] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...profile,
      updatedAt: new Date().toISOString()
    };
    LocalDB.saveEmergencyProfile(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const updatePrivacyShareSettings = (newSettings: PrivacyShareSettings) => {
    const updated = { ...profile, privacyShareSettings: newSettings };
    setProfile(updated);
    LocalDB.saveEmergencyProfile(updated);
  };

  return (
    <div className="space-y-5 pb-6">
      <div className="p-4 rounded-3xl bg-gradient-to-r from-red-950 via-slate-900 to-red-950 border border-red-800/60 shadow-xl space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-red-600 text-white shadow-lg">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-wide flex items-center gap-2">
              My Emergency Card
              <Lock className="w-4 h-4 text-emerald-400" />
            </h1>
            <p className="text-xs text-red-200">
              AES-256 Encrypted local emergency medical card.
            </p>
          </div>
        </div>
      </div>

      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200 space-y-0.5">
          <strong className="block font-bold text-amber-300">Privacy & Security Guarantee:</strong>
          <span>All emergency card information is encrypted locally on your device. It is NEVER uploaded to the cloud or shared automatically.</span>
        </div>
      </div>

      <form onSubmit={handleSave} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Full Name:
          </label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            placeholder="e.g. Abishek Kumar"
            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-red-500 font-medium"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Preferred Language:
          </label>
          <select
            value={profile.preferredLanguage}
            onChange={(e) => setProfile({ ...profile, preferredLanguage: e.target.value as LanguageCode })}
            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-red-500 font-medium cursor-pointer"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name} ({lang.nativeName})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Emergency Contact Phone / Name:
          </label>
          <input
            type="text"
            value={profile.emergencyContact}
            onChange={(e) => setProfile({ ...profile, emergencyContact: e.target.value })}
            placeholder="e.g. +91 9876543210 (Spouse / Parent)"
            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-red-500 font-medium"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Blood Group (Optional):
          </label>
          <select
            value={profile.bloodGroup}
            onChange={(e) => setProfile({ ...profile, bloodGroup: e.target.value })}
            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-red-500 font-medium cursor-pointer"
          >
            <option value="">Select Blood Group</option>
            <option value="O+">O positive (O+)</option>
            <option value="O-">O negative (O-)</option>
            <option value="A+">A positive (A+)</option>
            <option value="A-">A negative (A-)</option>
            <option value="B+">B positive (B+)</option>
            <option value="B-">B negative (B-)</option>
            <option value="AB+">AB positive (AB+)</option>
            <option value="AB-">AB negative (AB-)</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Allergies (Optional):
          </label>
          <input
            type="text"
            value={profile.allergies}
            onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
            placeholder="e.g. Penicillin, Peanuts, Latex"
            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-red-500 font-medium"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Important Medical Conditions (Optional):
          </label>
          <textarea
            value={profile.medicalInfo}
            onChange={(e) => setProfile({ ...profile, medicalInfo: e.target.value })}
            placeholder="e.g. Diabetic, Asthma, Pacemaker"
            rows={2}
            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-red-500 font-medium resize-none"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-extrabold text-sm shadow-xl active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          {isSaved ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Card Saved & Encrypted</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Save Encrypted Card</span>
            </>
          )}
        </button>
      </form>

      <div className="space-y-2 pt-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          Share Card Offline (No Internet Required)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => setIsQRModalOpen(true)}
            className="p-4 rounded-2xl bg-slate-900 border border-slate-700 hover:border-red-500 transition-all flex items-center justify-between text-left group shadow-lg active:scale-95"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-red-500/20 text-red-400 group-hover:scale-105 transition-transform">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Generate QR Code</h3>
                <p className="text-[11px] text-slate-400">Offline camera scan pass</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setIsNearbyShareOpen(true)}
            className="p-4 rounded-2xl bg-slate-900 border border-slate-700 hover:border-blue-500 transition-all flex items-center justify-between text-left group shadow-lg active:scale-95"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400 group-hover:scale-105 transition-transform">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Nearby Share</h3>
                <p className="text-[11px] text-slate-400">Bluetooth & Wi-Fi Direct</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      <QRModal
        profile={profile}
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        onUpdatePrivacy={updatePrivacyShareSettings}
      />

      <NearbyShareModal
        profile={profile}
        isOpen={isNearbyShareOpen}
        onClose={() => setIsNearbyShareOpen(false)}
      />
    </div>
  );
};
