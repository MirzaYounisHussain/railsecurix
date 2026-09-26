import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { api } from '@/services/api';

interface BiometricSummary {
  keystrokeCount: number;
  mouseMoveCount: number;
  clickCount: number;
  formDwells: Record<string, number>;
}

interface TelemetryContextType {
  biometrics: BiometricSummary;
  riskScore: number;
  securityAction: string;
  isChallengeOpen: boolean;
  setChallengeOpen: (open: boolean) => void;
  recordFormDwell: (formName: string, dwellMs: number) => void;
  verifyAdaptiveChallenge: (answer: string) => Promise<boolean>;
  refreshRiskScore: () => Promise<void>;
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [riskScore, setRiskScore] = useState(14);
  const [securityAction, setSecurityAction] = useState('ALLOW (Normal Access)');
  const [isChallengeOpen, setChallengeOpen] = useState(false);

  const [biometrics, setBiometrics] = useState<BiometricSummary>({
    keystrokeCount: 0,
    mouseMoveCount: 0,
    clickCount: 0,
    formDwells: {},
  });

  // In-memory buffers to avoid React re-render overhead on every event
  const keyEventsBuffer = useRef<any[]>([]);
  const mouseEventsBuffer = useRef<any[]>([]);
  const lastKeyTime = useRef<number>(Date.now());
  const lastMouseMoveTime = useRef<number>(0);

  useEffect(() => {
    // ------------------------------------------------------------------------
    // 1. Keystroke Dynamics Listener
    // ------------------------------------------------------------------------
    const handleKeyDown = (e: KeyboardEvent) => {
      const now = performance.now();
      const target = e.target as HTMLElement;
      const isPassword = target && target.getAttribute('type') === 'password';

      // Privacy: Never record raw characters for password fields
      const flightTime = now - lastKeyTime.current;
      lastKeyTime.current = now;

      keyEventsBuffer.current.push({
        type: 'keydown',
        t: Math.round(now),
        flightTime: Math.round(flightTime),
        isPassword,
      });

      setBiometrics(prev => ({ ...prev, keystrokeCount: prev.keystrokeCount + 1 }));
    };

    // ------------------------------------------------------------------------
    // 2. Mouse Kinematics Listener (Throttled 50ms)
    // ------------------------------------------------------------------------
    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastMouseMoveTime.current < 50) return;
      lastMouseMoveTime.current = now;

      mouseEventsBuffer.current.push({
        x: Math.round(e.clientX),
        y: Math.round(e.clientY),
        t: Math.round(now),
      });

      setBiometrics(prev => ({ ...prev, mouseMoveCount: prev.mouseMoveCount + 1 }));
    };

    // ------------------------------------------------------------------------
    // 3. Click Listener
    // ------------------------------------------------------------------------
    const handleClick = (e: MouseEvent) => {
      const now = performance.now();
      const target = (e.target as HTMLElement)?.tagName || 'UNKNOWN';

      mouseEventsBuffer.current.push({
        type: 'click',
        target,
        x: Math.round(e.clientX),
        y: Math.round(e.clientY),
        t: Math.round(now),
      });

      setBiometrics(prev => ({ ...prev, clickCount: prev.clickCount + 1 }));
    };

    window.addEventListener('keydown', handleKeyDown, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('click', handleClick, { passive: true });

    // ------------------------------------------------------------------------
    // 4. Batch Telemetry Streaming to Flask Backend
    // ------------------------------------------------------------------------
    const flushInterval = setInterval(() => {
      if (keyEventsBuffer.current.length > 0 || mouseEventsBuffer.current.length > 0) {
        const payload = {
          keystrokes: keyEventsBuffer.current.splice(0, 50),
          mouse: mouseEventsBuffer.current.splice(0, 50),
        };
        api.sendTelemetry(payload).catch(() => {});
      }
    }, 3500);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      clearInterval(flushInterval);
    };
  }, []);

  const recordFormDwell = (formName: string, dwellMs: number) => {
    setBiometrics(prev => ({
      ...prev,
      formDwells: { ...prev.formDwells, [formName]: dwellMs },
    }));
    api.sendTelemetry({ dwell: { form: formName, duration: dwellMs } }).catch(() => {});
  };

  const refreshRiskScore = async () => {
    try {
      const res = await api.getRiskScore();
      setRiskScore(res.riskScore);
      setSecurityAction(res.securityAction);
      if (res.riskScore >= 40 && res.riskScore <= 70) {
        setChallengeOpen(true);
      }
    } catch {
      // Graceful fallback
    }
  };

  const verifyAdaptiveChallenge = async (answer: string): Promise<boolean> => {
    try {
      const res = await api.verifyChallenge(answer);
      if (res.success) {
        setRiskScore(res.riskScore);
        setSecurityAction('CHALLENGE_PASSED (Low Risk)');
        setChallengeOpen(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <TelemetryContext.Provider
      value={{
        biometrics,
        riskScore,
        securityAction,
        isChallengeOpen,
        setChallengeOpen,
        recordFormDwell,
        verifyAdaptiveChallenge,
        refreshRiskScore,
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
};
