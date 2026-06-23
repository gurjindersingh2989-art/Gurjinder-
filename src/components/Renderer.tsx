import React, { useRef, useState, useEffect } from "react";
import { TimelineClip, Subtitle, AudioTrack, RenderConfig } from "../types";
import { COLOR_GRADE_LUTS } from "../data";
import { Film, Play, Square, Loader, Download, Sparkles, CheckCircle, Video, Music } from "lucide-react";

interface RendererProps {
  clips: TimelineClip[];
  subtitles: Subtitle[];
  selectedAudio: AudioTrack | null;
  audioVolume: number;
  onClose: () => void;
}

export default function Renderer({ clips, subtitles, selectedAudio, audioVolume, onClose }: RendererProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioNodeRef = useRef<HTMLAudioElement | null>(null);
  
  const [renderConfig, setRenderConfig] = useState<RenderConfig>({
    resolution: "4K",
    frameRate: 60,
    quality: "balanced",
    scaleUpFactor: 1.5,
  });

  const [renderingState, setRenderingState] = useState<"idle" | "preparing" | "rendering" | "completed" | "error">("idle");
  const [renderProgress, setRenderProgress] = useState(0);
  const [currentFrameNum, setCurrentFrameNum] = useState(0);
  const [totalFramesCount, setTotalFramesCount] = useState(0);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  // Calculate total duration
  const totalDuration = clips.length > 0 ? Math.max(...clips.map(c => c.endOffset)) : 0;

  // Render variables
  const fps = renderConfig.frameRate;
  const resolutionWidth = renderConfig.resolution === "4K" ? 3840 : 1920;
  const resolutionHeight = renderConfig.resolution === "4K" ? 2160 : 1080;

  useEffect(() => {
    return () => {
      // Cleanup URLs
      if (generatedVideoUrl) {
        URL.revokeObjectURL(generatedVideoUrl);
      }
    };
  }, [generatedVideoUrl]);

  // Preload all clip images helper
  const preloadImages = async (): Promise<Record<string, HTMLImageElement>> => {
    setStatusMessage("Preloading cinema clip frames into hardware memory...");
    const imageCache: Record<string, HTMLImageElement> = {};
    const loadPromises = clips.map(clip => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          imageCache[clip.id] = img;
          resolve();
        };
        img.onerror = () => {
          // Carry on even if load errors fallback
          console.warn(`Could not preload ${clip.url}, preparing styled graphics...`);
          resolve();
        };
        img.src = clip.url;
      });
    });
    await Promise.all(loadPromises);
    return imageCache;
  };

  const start4KRender = async () => {
    if (clips.length === 0) {
      alert("Timeline is empty! Generate and add some clips to your sequencer first.");
      return;
    }

    setRenderingState("preparing");
    setRenderProgress(0);
    setGeneratedVideoUrl(null);
    setStatusMessage("Initializing 4K cinematic upscaler and audio synthesizers...");

    try {
      // 1. Preload image caches
      const imageCache = await preloadImages();

      // 2. Setup Canvas context sizes
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Rendering canvas context unavailable.");
      
      canvas.width = resolutionWidth;
      canvas.height = resolutionHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Could not acquire 2D high-fidelity context.");

      // 3. Prepare audio mixing stream if selected
      let audioDestinationNode: MediaStreamAudioDestinationNode | null = null;
      let audioSourceNode: MediaElementAudioSourceNode | null = null;
      let audioEl: HTMLAudioElement | null = null;

      if (selectedAudio) {
        setStatusMessage("Configuring multi-track spatial master soundtrack...");
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;
          
          audioDestinationNode = audioCtx.createMediaStreamDestination();
          audioEl = new Audio();
          audioEl.crossOrigin = "anonymous";
          audioEl.src = selectedAudio.url;
          audioEl.volume = audioVolume;
          audioNodeRef.current = audioEl;

          audioSourceNode = audioCtx.createMediaElementSource(audioEl);
          // Split - route to destination stream AND user's speakers for live preview
          const gainNode = audioCtx.createGain();
          gainNode.gain.value = audioVolume;
          
          audioSourceNode.connect(gainNode);
          gainNode.connect(audioDestinationNode);
          gainNode.connect(audioCtx.destination);
        } catch (e) {
          console.warn("WebAudio context failed to hook, proceeding with silent audio sync: ", e);
        }
      }

      // 4. Capture Canvas stream and merge audio
      setStatusMessage("Opening 4K cinematic frame pipeline recorder...");
      const canvasStream = canvas.captureStream(renderConfig.frameRate);
      
      let mergedStream = canvasStream;
      if (audioDestinationNode) {
        const audioStreamTrack = audioDestinationNode.stream.getAudioTracks()[0];
        if (audioStreamTrack) {
          canvasStream.addTrack(audioStreamTrack);
        }
      }

      // 5. Select Recorder options
      const mimeTypes = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
        "video/mp4"
      ];
      let selectedMimeType = "";
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMimeType = mime;
          break;
        }
      }

      const recorder = new MediaRecorder(mergedStream, {
        mimeType: selectedMimeType || undefined,
        videoBitsPerSecond: renderConfig.resolution === "4K" ? 25000000 : 12000000 // High bitrate cinematic output
      });

      mediaRecorderRef.current = recorder;
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        setStatusMessage("Compiling cinematic bitrates, finalizing video container...");
        const finalBlob = new Blob(chunks, { type: selectedMimeType || "video/webm" });
        const videoURL = URL.createObjectURL(finalBlob);
        setGeneratedVideoUrl(videoURL);
        setRenderingState("completed");
        setStatusMessage("Cinematic video rendered successfully in ultra 4K quality! Free and unlimited.");
      };

      // 6. Begin Rendering frame loop
      setRenderingState("rendering");
      recorder.start();

      if (audioEl) {
        audioEl.currentTime = 0;
        audioEl.play().catch(e => console.warn("Audio element play error:", e));
      }

      const totalFramesNeeded = Math.ceil(totalDuration * fps);
      setTotalFramesCount(totalFramesNeeded);
      let frameIndex = 0;

      const drawFrameLoop = () => {
        if (frameIndex >= totalFramesNeeded) {
          // Done
          recorder.stop();
          if (audioEl) {
            audioEl.pause();
          }
          return;
        }

        const currentTimeStamp = frameIndex / fps;
        setCurrentFrameNum(frameIndex);
        setRenderProgress(Math.floor((frameIndex / totalFramesNeeded) * 100));

        // Find which clip applies to the current playhead
        const activeClip = clips.find(c => currentTimeStamp >= c.startOffset && currentTimeStamp <= c.endOffset);

        // Canvas cleanup
        ctx.fillStyle = "#0c0a09"; // Pure dark slate cinema black
        ctx.fillRect(0, 0, resolutionWidth, resolutionHeight);

        if (activeClip) {
          const img = imageCache[activeClip.id];
          const clipDuration = activeClip.endOffset - activeClip.startOffset;
          const clipProgress = (currentTimeStamp - activeClip.startOffset) / clipDuration;

          // Camera Movement Calculations
          let scale = 1.0;
          let tx = 0;
          let ty = 0;
          let rotation = 0;

          if (activeClip.name.includes("Zoom In") || activeClip.name.includes("Dolly") || activeClip.name.includes("Dolly Track In") || activeClip.name.includes("Slow Zoom In")) {
            scale = 1.0 + (clipProgress * 0.15);
          } else if (activeClip.name.includes("Zoom Out") || activeClip.name.includes("Slow Zoom Out")) {
            scale = 1.15 - (clipProgress * 0.15);
          } else if (activeClip.name.includes("Panning Left") || activeClip.name.includes("Orbit Left") || activeClip.name.includes("Slow Orbit Left")) {
            tx = (1 - clipProgress) * -120;
            scale = 1.12;
          } else if (activeClip.name.includes("Panning Right") || activeClip.name.includes("Orbit Right") || activeClip.name.includes("Slow Orbit Right")) {
            tx = clipProgress * -120;
            scale = 1.12;
          } else if (activeClip.name.includes("Tilt Down") || activeClip.name.includes("Slow Tilt Down")) {
            ty = clipProgress * -120;
            scale = 1.12;
          } else if (activeClip.name.includes("Tilt Up") || activeClip.name.includes("Slow Tilt Up")) {
            ty = (1 - clipProgress) * -120;
            scale = 1.12;
          } else {
            // General mild zoom to mimic slow video flow
            scale = 1.0 + (clipProgress * 0.08);
          }

          // Apply Cinematic Lut Filters
          const activeLUT = COLOR_GRADE_LUTS.find(lut => lut.id === activeClip.filter || lut.name === activeClip.filter);
          let canvasFilter = "none";
          if (activeLUT && activeLUT.id !== "none") {
            if (activeLUT.id === "teal_and_orange") {
              canvasFilter = "contrast(1.08) saturate(1.18) hue-rotate(-3deg) brightness(0.98)";
            } else if (activeLUT.id === "bleach_bypass") {
              canvasFilter = "contrast(1.35) saturate(0.45) brightness(0.92) sepia(0.15)";
            } else if (activeLUT.id === "monochrome_noir") {
              canvasFilter = "grayscale(1) contrast(1.45) brightness(0.9)";
            } else if (activeLUT.id === "vintage_warm") {
              canvasFilter = "sepia(0.18) contrast(1.05) saturate(0.92) brightness(1.02)";
            } else if (activeLUT.id === "cyber_neon") {
              canvasFilter = "saturate(1.60) contrast(1.15) hue-rotate(15deg) brightness(0.95)";
            } else if (activeLUT.id === "emerald_depth") {
              canvasFilter = "hue-rotate(-12deg) saturate(0.85) contrast(1.1) brightness(0.94)";
            }
          }
          ctx.filter = canvasFilter;

          // Draw the photo layer
          if (img) {
            ctx.save();
            ctx.translate(resolutionWidth / 2 + tx, resolutionHeight / 2 + ty);
            ctx.scale(scale, scale);
            ctx.rotate(rotation);
            // Centered draw
            ctx.drawImage(img, -resolutionWidth / 2, -resolutionHeight / 2, resolutionWidth, resolutionHeight);
            ctx.restore();
          } else {
            // Procedural Generator fallback to keep rendering beautifully
            ctx.save();
            ctx.translate(resolutionWidth / 2, resolutionHeight / 2);
            ctx.scale(scale, scale);
            
            // Draw colorful majestic backdrop
            const grad = ctx.createRadialGradient(0, 0, 50, 0, 0, resolutionWidth * 0.7);
            grad.addColorStop(0, "#1c1917");
            grad.addColorStop(0.5, "#44403c");
            grad.addColorStop(1, "#0c0a09");
            ctx.fillStyle = grad;
            ctx.fillRect(-resolutionWidth / 2, -resolutionHeight / 2, resolutionWidth, resolutionHeight);

            // Center abstract artwork
            ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
            ctx.beginPath();
            ctx.arc(0, 0, 300, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
          }

          // Reset filters before overlaying watermark & subtitles
          ctx.filter = "none";

          // Core film overlays (Simulate cinematic letterboxes if 2.39:1 selected in presets)
          const isWideAspect = clips[0]?.name.toLowerCase().includes("2.39:1") || activeClip.name.toLowerCase().includes("2.39:1");
          if (isWideAspect) {
            const barHeight = resolutionHeight * 0.12;
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, resolutionWidth, barHeight);
            ctx.fillRect(0, resolutionHeight - barHeight, resolutionWidth, barHeight);
          }

          // Draw Subtitles Overlay
          const activeSubtitle = subtitles.find(sub => currentTimeStamp >= sub.startTime && currentTimeStamp <= (sub.startTime + sub.duration));
          if (activeSubtitle) {
            ctx.save();
            const textY = (activeSubtitle.yPosition / 100) * resolutionHeight;
            
            // Set styles based on profile
            let fontSizeNum = resolutionHeight * 0.045; // Responsive subtitle sizing
            if (activeSubtitle.fontSize === "sm") fontSizeNum = resolutionHeight * 0.03;
            else if (activeSubtitle.fontSize === "lg") fontSizeNum = resolutionHeight * 0.055;
            else if (activeSubtitle.fontSize === "xl") fontSizeNum = resolutionHeight * 0.065;
            else if (activeSubtitle.fontSize === "2xl") fontSizeNum = resolutionHeight * 0.075;
            else if (activeSubtitle.fontSize === "3xl") fontSizeNum = resolutionHeight * 0.085;

            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            if (activeSubtitle.style === "neon") {
              ctx.font = `600 ${fontSizeNum}px "Inter", sans-serif`;
              ctx.shadowColor = "#e11d48";
              ctx.shadowBlur = 30;
              ctx.fillStyle = "#fff";
              ctx.fillText(activeSubtitle.text, resolutionWidth / 2, textY);
            } else if (activeSubtitle.style === "cinematic") {
              ctx.font = `italic 500 ${fontSizeNum}px "Playfair Display", Georgia, serif`;
              ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
              ctx.shadowBlur = 15;
              ctx.fillStyle = "#ffedd5"; // elegant warm cream
              ctx.fillText(activeSubtitle.text, resolutionWidth / 2, textY);
            } else if (activeSubtitle.style === "monobold") {
              ctx.font = `700 ${fontSizeNum}px "JetBrains Mono", monospace`;
              ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
              ctx.shadowBlur = 10;
              ctx.fillStyle = "#e2e8f0";
              ctx.fillText(activeSubtitle.text, resolutionWidth / 2, textY);
            } else { // Classic standard cinematic with custom transparent backdrop bar
              ctx.font = `500 ${fontSizeNum}px "Inter", sans-serif`;
              
              const txtMetrics = ctx.measureText(activeSubtitle.text);
              const paddingX = 40;
              const paddingY = 20;
              ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
              ctx.fillRect(
                resolutionWidth / 2 - txtMetrics.width / 2 - paddingX,
                textY - fontSizeNum / 2 - paddingY,
                txtMetrics.width + paddingX * 2,
                fontSizeNum + paddingY * 2
              );

              ctx.fillStyle = "#ffffff";
              ctx.fillText(activeSubtitle.text, resolutionWidth / 2, textY);
            }
            ctx.restore();
          }

          // Render transition states (e.g. at junction points)
          const nextClipIndex = clips.findIndex(c => c.startOffset > currentTimeStamp);
          if (nextClipIndex > 0) {
            const currentClip = clips[nextClipIndex - 1];
            const timeToTransition = currentClip.endOffset - currentTimeStamp;
            if (timeToTransition < 0.6) { // inside fade bracket
              const opacity = 1 - (timeToTransition / 0.6); // 0 to 1
              ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
              ctx.fillRect(0, 0, resolutionWidth, resolutionHeight);
            }
          }
        } else {
          // If outer bounding area drawn
          ctx.fillStyle = "#0c0a09";
          ctx.fillRect(0, 0, resolutionWidth, resolutionHeight);
          ctx.fillStyle = "#44403c";
          ctx.font = '500 48px sans-serif';
          ctx.textAlign = "center";
          ctx.fillText("AI Cinematic Sequence Void (Awaiting Clips)", resolutionWidth / 2, resolutionHeight / 2);
        }

        // Add upscale watermarking subtables
        ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
        ctx.font = "400 24px monospace";
        ctx.textAlign = "right";
        ctx.fillText("Veo 4K Master • Pixel Flow Renderer • Totally Free", resolutionWidth - 60, 60);

        // Frame update
        frameIndex++;
        
        // Let event loop breathe
        setTimeout(drawFrameLoop, 1000 / fps);
      };

      // Start loop
      drawFrameLoop();

    } catch (e: any) {
      console.error(e);
      setRenderingState("error");
      setStatusMessage(`Render Error: ${e.message || "An error occurred inside WebAudio stream mixers."}`);
    }
  };

  const cancelActiveRender = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (audioNodeRef.current) {
      audioNodeRef.current.pause();
    }
    setRenderingState("idle");
    setRenderProgress(0);
    setStatusMessage("Cinematic export interrupted by user command.");
  };

  return (
    <div id="renderer-overlay" className="fixed inset-0 z-50 bg-stone-950/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-4xl p-6 md:p-8 text-stone-200 shadow-2xl relative">
        <button 
          onClick={onClose}
          disabled={renderingState === "preparing" || renderingState === "rendering"}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-200 text-2xl font-bold bg-stone-800 hover:bg-stone-700 w-10 h-10 rounded-full flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          &times;
        </button>

        <div className="flex items-center gap-3 mb-6 border-b border-stone-800 pb-4">
          <Film className="w-8 h-8 text-rose-500 animate-pulse" />
          <div>
            <h2 className="text-2xl font-bold font-sans">4K Master Cinematic Render Station</h2>
            <p className="text-zinc-400 text-sm">Convert your multi-scene timeline into a native, high-bitrate video file completely free.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Settings Column */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b border-stone-800 pb-2">Cinematic Export Profiles</h3>
            
            <div className="bg-stone-950/50 p-4 rounded-xl space-y-4 border border-stone-800/30">
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-stone-400 block mb-1">Render Resolution</label>
                <div id="select-resolution" className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setRenderConfig(prev => ({ ...prev, resolution: "4K" }))}
                    className={`p-3 rounded-lg border text-sm font-bold flex flex-col items-center justify-center transition-all ${
                      renderConfig.resolution === "4K"
                        ? "border-rose-500 bg-rose-950/20 text-rose-400 font-bold"
                        : "border-stone-800 bg-stone-900 text-stone-300 hover:bg-stone-800"
                    }`}
                  >
                    <span>Ultra HD 4K</span>
                    <span className="text-[10px] font-mono font-normal text-stone-500">3840 &times; 2160 • High Fidelity</span>
                  </button>
                  <button
                    onClick={() => setRenderConfig(prev => ({ ...prev, resolution: "1080p" }))}
                    className={`p-3 rounded-lg border text-sm font-bold flex flex-col items-center justify-center transition-all ${
                      renderConfig.resolution === "1080p"
                        ? "border-rose-500 bg-rose-950/20 text-rose-400 font-bold"
                        : "border-stone-800 bg-stone-900 text-stone-300 hover:bg-stone-800"
                    }`}
                  >
                    <span>Full HD 1080p</span>
                    <span className="text-[10px] font-mono font-normal text-stone-500">1920 &times; 1080 • Standard Fast</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-stone-400 block mb-1">FPS Target</label>
                <div id="select-fps" className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setRenderConfig(prev => ({ ...prev, frameRate: 60 }))}
                    className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                      renderConfig.frameRate === 60
                        ? "border-rose-500 bg-rose-950/10 text-rose-400 font-semibold"
                        : "border-stone-800 bg-stone-900 text-stone-400"
                    }`}
                  >
                    60 FPS (Ultra Fluid Cinema)
                  </button>
                  <button
                    onClick={() => setRenderConfig(prev => ({ ...prev, frameRate: 30 }))}
                    className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                      renderConfig.frameRate === 30
                        ? "border-rose-500 bg-rose-950/10 text-rose-400 font-semibold"
                        : "border-stone-800 bg-stone-900 text-stone-400"
                    }`}
                  >
                    30 FPS (Standard Narrative)
                  </button>
                </div>
              </div>

              <div className="text-stone-400 text-xs leading-relaxed space-y-2 font-mono">
                <div className="flex gap-2">
                  <Video className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>Sequence Length: <strong>{totalDuration.toFixed(1)} seconds</strong></span>
                </div>
                <div className="flex gap-2">
                  <Music className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Soundtrack: <strong>{selectedAudio ? selectedAudio.name : "Silent Mode"}</strong></span>
                </div>
              </div>
            </div>

            {renderingState === "idle" && (
              <button
                id="btn-trigger-render"
                onClick={start4KRender}
                className="w-full bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform hover:-translate-y-0.5 transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5 animate-pulse" />
                Render Free 4K Cinematic Master
              </button>
            )}

            {(renderingState === "preparing" || renderingState === "rendering") && (
              <button
                id="btn-cancel-render"
                onClick={cancelActiveRender}
                className="w-full bg-stone-800 hover:bg-stone-700 text-rose-400 font-semibold py-3 px-6 rounded-xl border border-stone-700 transition flex items-center justify-center gap-2"
              >
                <Square className="w-4 h-4" />
                Abort Active Render Session
              </button>
            )}
          </div>

          {/* Monitor Screen Column */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b border-stone-800 pb-2">Live Upscaler Monitor</h3>
            
            <div className="relative aspect-video rounded-xl bg-stone-950 border border-stone-800 flex flex-col items-center justify-center overflow-hidden">
              {/* Virtual Active Canvas Canvas element - Hidden from direct view but rendering frames */}
              <canvas 
                ref={canvasRef} 
                className={`max-w-full max-h-full aspect-video scale-[0.35] lg:scale-[0.5] hidden`}
                style={{ width: "100%", height: "100%" }}
              />

              {renderingState === "idle" && (
                <div className="text-center p-6 space-y-2">
                  <div className="w-16 h-16 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center mx-auto mb-3 text-stone-600 animate-pulse">
                    <Video className="w-8 h-8" />
                  </div>
                  <p className="font-bold text-stone-300">Renderer Standby</p>
                  <p className="text-stone-500 text-xs">Ready to synthesize 4K frames. Click render to begin production cycle.</p>
                </div>
              )}

              {renderingState === "preparing" && (
                <div className="text-center p-6 space-y-4 animate-pulse">
                  <Loader className="w-10 h-10 text-amber-400 animate-spin mx-auto" />
                  <div className="space-y-1">
                    <p className="font-bold text-stone-300">GPU Preconditioning...</p>
                    <p className="text-stone-500 text-xs">Pre-caching and loading source visual frame banks into RAM.</p>
                  </div>
                </div>
              )}

              {renderingState === "rendering" && (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-stone-950/80 relative">
                  <div className="absolute inset-0 bg-radial-gradient from-rose-950/10 to-transparent pointer-events-none" />
                  <Loader className="w-12 h-12 text-rose-500 animate-spin mb-4" />
                  <p className="text-rose-400 font-mono font-bold tracking-wider text-xs animate-pulse uppercase mb-1">GPU Frame Generation Phase</p>
                  
                  <div className="w-full max-w-xs bg-stone-900 rounded-full h-2 overflow-hidden mb-3">
                    <div 
                      className="bg-gradient-to-r from-rose-500 to-amber-500 h-full transition-all duration-300"
                      style={{ width: `${renderProgress}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between w-full max-w-xs text-[10px] font-mono text-stone-400">
                    <span>Frame: {currentFrameNum} / {totalFramesCount}</span>
                    <span>{renderProgress}%</span>
                  </div>
                </div>
              )}

              {renderingState === "completed" && generatedVideoUrl && (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 relative bg-stone-950">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mb-3 animate-bounce" />
                  <p className="font-bold text-emerald-400 text-sm mb-1">4K Compilation Finished</p>
                  <p className="text-stone-400 text-xs text-center mb-4 max-w-xs">Your cinematic masterpiece is bundled and ready for delivery.</p>

                  <div className="flex gap-2">
                    <a
                      id="btn-download-video"
                      href={generatedVideoUrl}
                      download={`veo-cinematic-${Date.now()}.webm`}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-5 rounded-lg text-xs transition flex items-center gap-1.5 shadow-md"
                    >
                      <Download className="w-4 h-4" />
                      Save Video File
                    </a>
                    <button
                      onClick={() => setRenderingState("idle")}
                      className="bg-stone-800 hover:bg-stone-700 text-stone-300 py-2 px-4 rounded-lg text-xs transition border border-stone-700"
                    >
                      Modify Sequence
                    </button>
                  </div>
                </div>
              )}

              {renderingState === "error" && (
                <div className="text-center p-6 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-rose-950/20 border border-rose-800/30 flex items-center justify-center mx-auto mb-2 text-rose-500">
                    &times;
                  </div>
                  <p className="font-bold text-rose-400 text-sm">GPU Pipeline Collapsed</p>
                  <p className="text-stone-500 text-xs max-w-xs">{statusMessage}</p>
                  <button
                    onClick={() => setRenderingState("idle")}
                    className="mt-3 bg-stone-800 hover:bg-stone-700 text-stone-300 py-1.5 px-4 rounded-lg text-xs transition border border-stone-700"
                  >
                    Reinitialize
                  </button>
                </div>
              )}
            </div>

            {/* Status logs bar */}
            <div className="bg-stone-950 p-2.5 rounded-lg border border-stone-800/60 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
              <p className="font-mono text-[10px] text-stone-400 truncate">
                <strong className="text-stone-300 uppercase mr-1">Status:</strong> 
                {statusMessage || "Renderer system standing by."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
