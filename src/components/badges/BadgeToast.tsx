'use client';

// v2.2 Phase 8: BadgeToast — shown when a new badge is earned.

import { useEffect } from 'react';

interface BadgeToastProps {
  badgeName: string;
  icon: string;
  onClose: () => void;
}

export function BadgeToast({ badgeName, icon, onClose }: BadgeToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '88px',
        right: '16px',
        background: '#FFFFFF',
        border: '1.5px solid #BA7517',
        borderRadius: '12px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        zIndex: 10000,
      }}
    >
      <div style={{ fontSize: '28px' }}>{icon}</div>
      <div>
        <p
          style={{
            fontSize: '11px',
            color: '#555555',
            margin: 0,
            letterSpacing: '0.5px',
          }}
        >
          NEW BADGE EARNED
        </p>
        <p style={{ fontSize: '15px', fontWeight: 500, margin: 0, color: '#1B1B1B' }}>
          {badgeName}
        </p>
      </div>
    </div>
  );
}
