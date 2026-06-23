export type AspectRatio = "16:9" | "9:16" | "2.39:1" | "1:1" | "4:3";

export interface CinematicPreset {
  id: string;
  name: string;
  prompt: string;
  visualStyle: string;
  aspectRatio: AspectRatio;
  cameraMovement: string;
  thumbnail: string;
}

export interface GeneratedAsset {
  id: string;
  type: "video" | "image";
  prompt: string;
  visualStyle: string;
  cameraMovement: string;
  aspectRatio: AspectRatio;
  url: string;
  duration: number; // in seconds
  timestamp: string;
  name: string;
}

export interface TimelineClip {
  id: string;
  assetId: string;
  name: string;
  type: "video" | "image";
  url: string;
  startOffset: number; // when does it start on the timeline, in seconds
  endOffset: number; // when does it end on the timeline, in seconds
  startCut: number; // start cut within the source media, in seconds
  endCut: number; // end cut within the source media, in seconds
  duration: number; // active duration (endOffset - startOffset)
  speed: number; // playback speed (e.g., 0.5, 1, 2)
  filter: string; // LUT filter ID
  transition: "none" | "crossfade" | "fade-black" | "blur" | "glitch";
  transitionDuration: number; // in seconds
}

export interface Subtitle {
  id: string;
  text: string;
  startTime: number; // in seconds
  duration: number; // in seconds
  yPosition: number; // % from top (e.g. 80)
  color: string; // hex or tailwind class
  fontSize: "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
  style: "classic" | "neon" | "monobold" | "cinematic";
  animation: "none" | "fade" | "slide-up" | "pop";
}

export interface AudioTrack {
  id: string;
  name: string;
  genre: string;
  url: string;
  duration: number;
}

export interface LUTFilter {
  id: string;
  name: string;
  class: string; // Tailwind backdrop filter or standard style
  description: string;
}

export interface RenderConfig {
  resolution: "1080p" | "4K";
  frameRate: 30 | 60;
  quality: "balanced" | "ultra";
  scaleUpFactor: number;
}
