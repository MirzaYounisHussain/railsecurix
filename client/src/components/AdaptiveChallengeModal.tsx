import React, { useState } from 'react';
import { useTelemetry } from '@/contexts/TelemetryContext';
import { ShieldCheck, AlertTriangle, Train, Car, Plane, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export const AdaptiveChallengeModal: React.FC = () => {
  const { isChallengeOpen, setChallengeOpen, riskScore, verifyAdaptiveChallenge } = useTelemetry();
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const options = [
    { id: 'CAR', label: 'Automobile', icon: Car },
    { id: 'TRAIN', label: 'Railway Locomotive', icon: Train },
    { id: 'PLANE', label: 'Airplane', icon: Plane },
  ];

  const handleSubmit = async () => {
    if (!selected) {
      setError('Please select an icon.');
      return;
    }

    setLoading(true);
    setError(null);
    const passed = await verifyAdaptiveChallenge(selected);
    setLoading(false);

    if (!passed) {
      setError('Incorrect pattern selected. Please choose the Railway Locomotive.');
    }
  };

  return (
    <Dialog open={isChallengeOpen} onOpenChange={setChallengeOpen}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-2 border-amber-500 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
                Adaptive Security Verification
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
                Temporary Elevated Interaction Velocity (Anomaly Score: {riskScore}/100)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
            <p className="font-semibold flex items-center gap-1 mb-1">
              <AlertTriangle className="w-4 h-4" /> Cognitive Human Verification
            </p>
            Please confirm your interaction by selecting the <strong>Railway Locomotive</strong> below to resume your reservation.
          </div>

          <div className="grid grid-cols-3 gap-3">
            {options.map(opt => {
              const Icon = opt.icon;
              const isSel = selected === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => { setSelected(opt.id); setError(null); }}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                    isSel
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:border-blue-400 dark:text-blue-300 ring-2 ring-blue-500/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Icon className="w-8 h-8" />
                  <span className="text-xs font-semibold">{opt.label}</span>
                </button>
              );
            })}
          </div>

          {error && (
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button
            onClick={handleSubmit}
            disabled={!selected || loading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold flex items-center justify-center gap-2"
          >
            {loading ? 'Verifying...' : (
              <>
                <CheckCircle2 className="w-4 h-4" /> Verify & Continue Reservation
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
