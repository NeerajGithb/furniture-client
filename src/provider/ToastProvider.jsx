'use client';

import { Toaster, toast } from 'react-hot-toast';
import { X } from 'lucide-react';

const CustomToast = ({ t, message }) => {
  const getBackgroundColor = () => {
    switch (t.type) {
      case 'success':
        return '#15803d';
      case 'error':
        return '#b91c1c';
      case 'loading':
        return '#1d4ed8';
      default:
        return '#1f1f1f';
    }
  };

  const getIcon = () => {
    switch (t.type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'loading':
        return '⏳';
      default:
        return null;
    }
  };

  return (
    <div
      className={`custom-toast ${t.visible ? 'animate-enter' : 'animate-exit'}`}
      style={{
        background: getBackgroundColor(),
        borderRadius: '6px',
        padding: '10px 14px',
        fontSize: '14px',
        fontWeight: 500,
        color: '#fff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
        minWidth: '200px',
        maxWidth: '360px',
        lineHeight: '1.4',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
      }}
    >
      <button
        onClick={() => toast.dismiss(t.id)}
        style={{
          all: 'unset',
          color: 'rgba(255, 255, 255, 0.7)',
          cursor: 'pointer',
          padding: '2px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          marginTop: '2px',
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.1)';
          e.target.style.color = '#fff';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'transparent';
          e.target.style.color = 'rgba(255, 255, 255, 0.7)';
        }}
      >
        <X size={16} />
      </button>
      {getIcon() && <span style={{ marginTop: '2px' }}>{getIcon()}</span>}
      <span
        style={{
          flex: 1,
          wordBreak: 'break-word',
          whiteSpace: 'normal',
        }}
      >
        {message}
      </span>

      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '1.5px',
          width: '100%',
          background: 'rgba(255, 255, 255, 0.7)',
          transformOrigin: 'left',
          animation: t.visible ? 'toast-progress-bar 4s linear forwards' : 'none',
          borderRadius: '0 0 6px 6px',
        }}
      />
    </div>
  );
};

const ToastProvider = () => {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
        }}
        containerStyle={{
          zIndex: 999999,
          margin: '36px 0 16px 16px',
        }}
      >
        {(t) => <CustomToast t={t} message={t.message} />}
      </Toaster>

      <style jsx global>{`
        @keyframes toast-slide-in {
          0% {
            transform: translateX(100%) scale(0.95);
            opacity: 0;
          }
          100% {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
        }

        @keyframes toast-slide-out {
          0% {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateX(100%) scale(0.9);
            opacity: 0;
          }
        }

        @keyframes toast-progress-bar {
          0% {
            transform: scaleX(1);
          }
          100% {
            transform: scaleX(0);
          }
        }

        .animate-enter {
          animation: toast-slide-in 0.4s ease-out forwards;
          transform-origin: right center;
        }

        .animate-exit {
          animation: toast-slide-out 0.3s ease-in forwards;
        }

        .custom-toast:hover {
          transform: scale(1.02);
          transition: transform 0.2s ease;
        }

        .custom-toast:hover > div:last-child {
          animation-play-state: paused;
        }
      `}</style>
    </>
  );
};

export const showToast = {
  success: (message) => toast.success(message),
  error: (message) => toast.error(message),
  loading: (message) => toast.loading(message),
  default: (message) => toast(message),
};

export default ToastProvider;
