import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, ShieldAlert, CheckSquare, Square } from 'lucide-react';
import type { EmergencyProfile, PrivacyShareSettings } from '../types';
import { QRService } from '../services/qr_service';

interface QRModalProps {
  profile: EmergencyProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdatePrivacy: (newSettings: PrivacyShareSettings) => void;
}

export const QRModal: React.FC<QRModalProps> = ({
  profile,
  isOpen,
  onClose,
  onUpdatePrivacy
}) => {
  const [settings, setSettings] = useState<PrivacyShareSettings>(
    profile.privacyShareSettings
  );

  if (!isOpen) return null;

  const qrData = QRService.encodeProfileForQR(profile, settings);

  const toggleSetting = (key: keyof PrivacyShareSettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    onUpdatePrivacy(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-red-500/20 text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Offline Emergency QR
              </h2>
              <p className="text-[11px] text-slate-400">
                Scan with any mobile camera (No Internet Required)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200 font-medium">
            <strong>Privacy Warning:</strong> Only select information you are comfortable sharing publicly in emergencies.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white shadow-inner">
          <QRCodeSVG
            value={qrData}
            size={200}
            level="M"
            includeMargin={true}
          />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800 mt-3 font-mono">
            LinguaGo Offline Emergency Pass
          </span>
        </div>

        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Select Information Included in QR:
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => toggleSetting('includeName')}
              className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                settings.includeName
                  ? 'bg-red-950/60 border-red-500/50 text-red-200'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400'
              }`}
            >
              {settings.includeName ? <CheckSquare className="w-4 h-4 text-red-400" /> : <Square className="w-4 h-4" />}
              <span>Name</span>
            </button>

            <button
              onClick={() => toggleSetting('includeLanguage')}
              className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                settings.includeLanguage
                  ? 'bg-red-950/60 border-red-500/50 text-red-200'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400'
              }`}
            >
              {settings.includeLanguage ? <CheckSquare className="w-4 h-4 text-red-400" /> : <Square className="w-4 h-4" />}
              <span>Language</span>
            </button>

            <button
              onClick={() => toggleSetting('includeContact')}
              className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                settings.includeContact
                  ? 'bg-red-950/60 border-red-500/50 text-red-200'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400'
              }`}
            >
              {settings.includeContact ? <CheckSquare className="w-4 h-4 text-red-400" /> : <Square className="w-4 h-4" />}
              <span>Emergency Contact</span>
            </button>

            <button
              onClick={() => toggleSetting('includeBloodGroup')}
              className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                settings.includeBloodGroup
                  ? 'bg-red-950/60 border-red-500/50 text-red-200'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400'
              }`}
            >
              {settings.includeBloodGroup ? <CheckSquare className="w-4 h-4 text-red-400" /> : <Square className="w-4 h-4" />}
              <span>Blood Group</span>
            </button>

            <button
              onClick={() => toggleSetting('includeAllergies')}
              className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                settings.includeAllergies
                  ? 'bg-red-950/60 border-red-500/50 text-red-200'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400'
              }`}
            >
              {settings.includeAllergies ? <CheckSquare className="w-4 h-4 text-red-400" /> : <Square className="w-4 h-4" />}
              <span>Allergies</span>
            </button>

            <button
              onClick={() => toggleSetting('includeMedicalInfo')}
              className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                settings.includeMedicalInfo
                  ? 'bg-red-950/60 border-red-500/50 text-red-200'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400'
              }`}
            >
              {settings.includeMedicalInfo ? <CheckSquare className="w-4 h-4 text-red-400" /> : <Square className="w-4 h-4" />}
              <span>Medical Info</span>
            </button>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-sm shadow-lg active:scale-95 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
