import React from 'react';

interface LoadingProps {
  title?: string;
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'minimal' | 'elegant' | 'modern' | 'spinner';
  fullScreen?: boolean;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({
  title,
  message,
  size = 'md',
  variant = 'default',
  fullScreen = false,
  className = '',
}) => {
  const sizeConfig = {
    sm: {
      spinner: 'w-6 h-6',
      title: 'text-sm',
      message: 'text-xs',
      container: 'p-4',
      gap: 'gap-2',
    },
    md: {
      spinner: 'w-8 h-8',
      title: 'text-base',
      message: 'text-sm',
      container: 'p-6',
      gap: 'gap-3',
    },
    lg: {
      spinner: 'w-12 h-12',
      title: 'text-lg',
      message: 'text-base',
      container: 'p-8',
      gap: 'gap-4',
    },
    xl: {
      spinner: 'w-16 h-16',
      title: 'text-xl',
      message: 'text-lg',
      container: 'p-10',
      gap: 'gap-6',
    },
  };

  const config = sizeConfig[size];

  const PremiumSpinner = () => {
    switch (variant) {
      case 'minimal':
        return (
          <div className={`${config.spinner} relative`}>
            <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-2 border-black border-t-transparent animate-spin"></div>
          </div>
        );

      case 'elegant':
        return (
          <div className={`${config.spinner} relative`}>
            <div className="absolute inset-0 rounded-full border-2 border-gray-100"></div>
            <div className="absolute inset-0 rounded-full border-2 border-gray-400 border-t-black animate-spin"></div>
            <div
              className="absolute inset-2 rounded-full border border-gray-200 border-b-transparent animate-spin"
              style={{ animationDelay: '150ms', animationDirection: 'reverse' }}
            ></div>
          </div>
        );

      case 'modern':
        return (
          <div className={`${config.spinner} relative`}>
            <div className="absolute inset-0 rounded-full bg-gray-100 animate-pulse"></div>
            <div className="absolute inset-1 rounded-full bg-white"></div>
            <div className="absolute inset-2 rounded-full border-2 border-gray-300 border-t-black animate-spin"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-black rounded-full animate-ping"></div>
          </div>
        );

      default:
        return (
          <div className={`${config.spinner} relative`}>
            <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-2 border-black border-t-transparent animate-spin"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
            </div>
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-1 h-1 bg-gray-400 rounded-full"></div>
            </div>
          </div>
        );
    }
  };

  const LoadingContent = () => (
    <div
      className={`flex flex-col items-center justify-center text-center ${config.container} ${config.gap}`}
    >
      <PremiumSpinner />

      {title && (
        <h3 className={`font-semibold text-gray-900 ${config.title} tracking-tight`}>{title}</h3>
      )}

      {message && (
        <p className={`text-gray-600 ${config.message} max-w-sm leading-relaxed`}>{message}</p>
      )}

      <div className="flex space-x-1 mt-2">
        <div
          className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: '0ms' }}
        ></div>
        <div
          className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: '150ms' }}
        ></div>
        <div
          className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: '300ms' }}
        ></div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className={`min-h-screen bg-white flex items-center justify-center ${className}`}>
        <div className="bg-white">
          <LoadingContent />
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full flex items-center justify-center bg-white ${className}`}>
      <LoadingContent />
    </div>
  );
};

export default Loading;
