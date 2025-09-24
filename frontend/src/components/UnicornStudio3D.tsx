import React, { useEffect, useState } from 'react';

interface UnicornStudio3DProps {
  projectId: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  opacity?: number;
  scale?: number;
  dpi?: number;
  lazyLoad?: boolean;
  production?: boolean;
}

const UnicornStudio3D: React.FC<UnicornStudio3DProps> = ({ 
  projectId, 
  width = '100%', 
  height = '100%',
  className = '',
  opacity = 0.8,
  scale = 1,
  dpi = 1.5,
  lazyLoad = false,
  production = false
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create the project ID with query parameters if needed
  const finalProjectId = production ? `${projectId}?production=true` : projectId;

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 50;

    const checkUnicornStudio = async () => {
      try {
        // Wait for UnicornStudio to be available
        while (!window.UnicornStudio && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        if (window.UnicornStudio) {
          console.log('UnicornStudio available, initializing...');
          // Trigger initialization
          if (!window.UnicornStudio.isInitialized) {
            await window.UnicornStudio.init();
            window.UnicornStudio.isInitialized = true;
          }
          setIsLoaded(true);
          console.log('UnicornStudio 3D model should now be visible');
        } else {
          throw new Error('UnicornStudio script not loaded after 5 seconds');
        }
      } catch (err) {
        console.error('UnicornStudio initialization failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    checkUnicornStudio();
  }, []);

  return (
    <div 
      className={className}
      style={{ 
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 2,
        pointerEvents: 'none',
        opacity: opacity
      }}
    >
      {/* UnicornStudio 3D Model Container */}
      <div 
        data-us-project={finalProjectId}
        data-us-scale={scale.toString()}
        data-us-dpi={dpi.toString()}
        data-us-lazyload={lazyLoad ? "true" : "false"}
        data-us-production={production ? "true" : "false"}
        data-us-disablemobile="false"
        data-us-alttext="3D background animation"
        data-us-arialabel="Interactive 3D background scene"
        style={{
          width: '100%',
          height: '100%',
          minHeight: '400px' // Ensure minimum height for visibility
        }}
      />
      
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs p-2 rounded">
          3D Model: {isLoaded ? '✅ Loaded' : '⏳ Loading...'}
          {error && <div className="text-red-300">❌ {error}</div>}
        </div>
      )}
    </div>
  );
};

// Using existing UnicornStudio interface from AnimatedBackground.tsx

export default UnicornStudio3D;