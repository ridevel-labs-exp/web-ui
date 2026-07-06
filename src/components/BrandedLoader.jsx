import React from 'react';

export default function BrandedLoader({ text = 'Connecting your ride...' }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      <div style={{ position: 'relative', width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        
        {/* Outer Rotating Blue Ring */}
        <div style={{
          position: 'absolute',
          width: '90px',
          height: '90px',
          borderRadius: '50%',
          border: '4px solid rgba(37, 99, 235, 0.2)',
          borderTopColor: '#2563EB',
          borderRightColor: '#2563EB',
          animation: 'ridevel-spin 1s linear infinite'
        }} />

        {/* Center Glowing "R" Logo Avatar */}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#0F172A',
          border: '2px solid #FACC15',
          boxShadow: '0 0 20px rgba(250, 204, 21, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FACC15',
          fontSize: '26px',
          fontWeight: '900',
          letterSpacing: '-1px',
          position: 'relative',
          zIndex: 2
        }}>
          R
        </div>
      </div>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', fontWeight: '900', color: '#FFFFFF', letterSpacing: '-0.3px' }}>Ridevel</div>
        <div style={{ fontSize: '13px', color: '#94A3B8', marginTop: '4px', fontWeight: '600' }}>{text}</div>
      </div>

      <style>{`
        @keyframes ridevel-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
