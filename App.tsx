
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dashboard } from './components/Dashboard';
import { EmojiOverlay } from './components/EmojiOverlay';
import { SessionStats } from './types';
import { PRICE_PER_LAUGH, MAX_BILL, LAUGH_THRESHOLD, COOLDOWN_MS, MODELS_URL } from './constants';

const App: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [stats, setStats] = useState<SessionStats>({
    totalLaughs: 0,
    currentBill: 0,
    isMaxed: false,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastLaughTime = useRef<number>(0);
  const detectionInterval = useRef<number | null>(null);

  const registerLaugh = useCallback(() => {
    const now = Date.now();
    if (now - lastLaughTime.current < COOLDOWN_MS) return;

    lastLaughTime.current = now;
    setShowEmoji(true);
    setTimeout(() => setShowEmoji(false), 1500);

    setStats(prev => {
      const nextLaughs = prev.totalLaughs + 1;
      const nextBill = Math.min(MAX_BILL, prev.currentBill + PRICE_PER_LAUGH);
      return {
        totalLaughs: nextLaughs,
        currentBill: nextBill,
        isMaxed: nextBill >= MAX_BILL
      };
    });
  }, []);

  // Step 1: Load Models and Request Camera
  useEffect(() => {
    const initApp = async () => {
      try {
        const faceapi = (window as any).faceapi;
        if (!faceapi) throw new Error("Face API CDN failed to load.");

        console.log("Loading models...");
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODELS_URL)
        ]);
        console.log("Models loaded.");

        const userStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 }
          } 
        });
        setStream(userStream);
        setIsLoaded(true);
      } catch (err: any) {
        console.error("Initialization error:", err);
        setError(err.name === 'NotAllowedError' 
          ? "Camera access denied. Please allow camera permissions and refresh." 
          : err.message || "Failed to initialize camera or AI models.");
      }
    };

    initApp();
  }, []);

  // Step 2: Attach stream to video element when ready
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleVideoPlay = () => {
    const faceapi = (window as any).faceapi;
    if (!videoRef.current || !canvasRef.current) return;

    const displaySize = {
      width: videoRef.current.videoWidth || 640,
      height: videoRef.current.videoHeight || 480
    };

    faceapi.matchDimensions(canvasRef.current, displaySize);

    detectionInterval.current = window.setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;
      
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      ctx.clearRect(0, 0, displaySize.width, displaySize.height);
      
      resizedDetections.forEach((detection: any) => {
        const { x, y, width, height } = detection.detection.box;
        const isHappy = detection.expressions.happy > LAUGH_THRESHOLD;

        if (isHappy) {
          registerLaugh();
        }

        // Draw custom stylized box
        ctx.strokeStyle = isHappy ? '#22c55e' : '#dc2626';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.strokeRect(x, y, width, height);
        
        // Draw expression label
        ctx.fillStyle = isHappy ? '#22c55e' : '#dc2626';
        ctx.font = '700 16px Inter';
        ctx.fillText(
          `${isHappy ? 'LAUGH DETECTED!' : 'STATUS: NEUTRAL'} (${Math.round(detection.expressions.happy * 100)}%)`,
          x, y - 10
        );
      });
    }, 150); // Slightly slower interval for better performance
  };

  useEffect(() => {
    return () => {
      if (detectionInterval.current) clearInterval(detectionInterval.current);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-black">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="theater-font text-6xl text-red-600 drop-shadow-lg tracking-widest">PAY PER LAUGH</h1>
        <p className="text-zinc-400 max-w-md mx-auto mt-2 italic">
          "The first comedy club that charges you for your happiness."
        </p>
      </div>

      <div className="w-full flex flex-col items-center">
        <Dashboard stats={stats} />

        {/* Camera Container */}
        <div className="relative group max-w-full">
          <div className={`relative rounded-3xl overflow-hidden border-4 transition-all duration-300 ${showEmoji ? 'border-green-500 red-glow shadow-[0_0_50px_rgba(34,197,94,0.4)]' : 'border-red-900/50'} bg-zinc-950`}>
            
            {/* Initializing State Overlay */}
            {!isLoaded && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-sm p-8 text-center">
                {!error ? (
                  <>
                    <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-zinc-400 theater-font text-xl animate-pulse">Initializing Biometric Billing Hardware...</p>
                  </>
                ) : (
                  <div className="bg-red-900/20 p-6 rounded-xl border border-red-800/50">
                    <p className="text-red-500 font-bold mb-2">SYSTEM ERROR</p>
                    <p className="text-red-400 text-sm">{error}</p>
                    <button 
                      onClick={() => window.location.reload()}
                      className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-full text-xs font-bold transition-colors"
                    >
                      Retry System Link
                    </button>
                  </div>
                )}
              </div>
            )}

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              width="640"
              height="480"
              className="bg-black scale-x-[-1] block"
              onPlay={handleVideoPlay}
            />
            
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none scale-x-[-1]"
            />
            
            {showEmoji && <EmojiOverlay />}
            
            {/* UI Accents - Always visible once loaded */}
            {isLoaded && (
              <>
                <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-white/30"></div>
                <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-white/30"></div>
                <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-white/30"></div>
                <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-white/30"></div>
                <div className="absolute inset-x-0 top-0 h-0.5 bg-red-500/20 shadow-[0_0_10px_red] animate-[scan_3s_linear_infinite] pointer-events-none"></div>
              </>
            )}
          </div>
          
          <div className="mt-4 flex items-center justify-between w-full text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
            <span className={isLoaded ? "text-green-500" : ""}>System: {isLoaded ? 'Active' : 'Offline'}</span>
            <span>Rate: €0.30 / Laugh</span>
            <span>Sensitivity: {Math.round(LAUGH_THRESHOLD * 100)}%</span>
          </div>
        </div>

        <div className="mt-12 text-zinc-600 text-xs text-center max-w-sm">
          <p>By using this experimental prototype, you acknowledge that our neural engine will monitor your zygomaticus major muscle activity for billing purposes.</p>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
};

export default App;
