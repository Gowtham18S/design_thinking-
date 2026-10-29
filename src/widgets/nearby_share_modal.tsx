import React, { useState, useEffect } from 'react';
import { X, Bluetooth, Wifi, Radio, Smartphone, CheckCircle2 } from 'lucide-react';
import type { EmergencyProfile } from '../types';

interface NearbyShareModalProps {
  profile: EmergencyProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const NearbyShareModal: React.FC<NearbyShareModalProps> = ({
  isOpen,
  onClose
}) => {
  const [scanning, setScanning] = useState(true);
  const [nearbyDevices, setNearbyDevices] = useState<{ id: string; name: string; signal: string }[]>([]);
  const [sentDevice, setSentDevice] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setScanning(true);
    setNearbyDevices([]);
    setSentDevice(null);

    const timer = setTimeout(() => {
      setNearbyDevices([
        { id: 'dev_1', name: 'Responder Phone (Emergency Services)', signal: '98%' },
        { id: 'dev_2', name: 'Dr. Kumar\'s Tablet (Nearby Doctor)', signal: '85%' },
        { id: 'dev_3', name: 'Local Helpdesk Device', signal: '72%' }
      ]);
      setScanning(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendToDevice = (deviceName: string) => {
    setSentDevice(deviceName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Nearby Device Sharing
              </h2>
              <p className="text-[11px] text-slate-400">
                Bluetooth & Wi-Fi Direct (No Internet Needed)
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

        <div className="p-3 rounded-2xl bg-blue-950/60 border border-blue-500/30 flex items-center justify-between text-xs text-blue-200">
          <div className="flex items-center gap-2">
            <Bluetooth className="w-4 h-4 text-blue-400" />
            <Wifi className="w-4 h-4 text-blue-400" />
            <span>Local Peer Broadcast Active</span>
          </div>
          <span className="font-mono text-[10px] bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-400/30">
            Offline P2P
          </span>
        </div>

        <div className="space-y-3 py-2">
          {scanning ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <div className="relative flex items-center justify-center">
                <span className="w-12 h-12 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
                <Radio className="w-5 h-5 text-blue-400 absolute" />
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Scanning for nearby offline Bluetooth & Wi-Fi Direct receivers...
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Discovered Local Devices ({nearbyDevices.length}):
              </span>
              {nearbyDevices.map((dev) => (
                <div
                  key={dev.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-blue-500/50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-700 text-slate-200">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{dev.name}</h4>
                      <p className="text-[10px] text-emerald-400 font-mono">Signal strength: {dev.signal}</p>
                    </div>
                  </div>

                  {sentDevice === dev.name ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                      <CheckCircle2 className="w-4 h-4" /> Sent
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSendToDevice(dev.name)}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow active:scale-95 transition-all"
                    >
                      Send Card
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
