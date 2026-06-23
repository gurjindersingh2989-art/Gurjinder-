import { CinematicPreset, AudioTrack, LUTFilter } from "./types";

export const CINEMATIC_PRESETS: CinematicPreset[] = [
  {
    id: "scifi-tokyo",
    name: "Cyberpunk Tokyo Rain",
    prompt: "Massive holographic billboard of a blooming virtual sakura flower, hovering vehicles reflecting cyan neon lights, rainy street, shallow focus.",
    visualStyle: "Cyber Neon",
    aspectRatio: "2.39:1",
    cameraMovement: "Slow Zoom In",
    thumbnail: "https://images.unsplash.com/photo-1545239351-ef35f43d514b?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: "space-neon",
    name: "Cosmic Nebula Explorer",
    prompt: "An astronaut floating near a massive glowing blue gas giant nebula, vibrant indigo starlight, majestic space cinematic backdrop, anamorphic flare.",
    visualStyle: "Sci-Fi Space",
    aspectRatio: "16:9",
    cameraMovement: "Slow Orbit Right",
    thumbnail: "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: "retro-warm",
    name: "Lost Desert Wanderer",
    prompt: "Vintage buggy driving into a massive golden sand dune canyon, retro 1970s warm solar glare style, Kodak Portra film grain, dusty atmosphere.",
    visualStyle: "Vintage 35mm",
    aspectRatio: "16:9",
    cameraMovement: "Dolly Track In",
    thumbnail: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: "noir-detective",
    name: "1940s Monochrome Mystery",
    prompt: "A moody detective standing beneath a flickering old brass streetlamp in heavy night fog, wet cobble pavement, intense chiascuro shadow contrast.",
    visualStyle: "Noir Monochromatic",
    aspectRatio: "4:3",
    cameraMovement: "Crane Push Up",
    thumbnail: "https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: "fantasy-temple",
    name: "Ethereal Pagoda Dawn",
    prompt: "Ancient temple pagoda atop mist-covered green emerald peaks, majestic golden rays filtering through giant ancient pine branches, serene waterfalls.",
    visualStyle: "Golden Hour Cinematic",
    aspectRatio: "16:9",
    cameraMovement: "Slow Tilt Down",
    thumbnail: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=600&auto=format&fit=crop"
  }
];

export const AUDIO_TRACKS: AudioTrack[] = [
  {
    id: "space-drone",
    name: "Cosmic Silence (Deep Space Drone)",
    genre: "Ambient Sci-fi",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // Standard safe testing tracks
    duration: 372
  },
  {
    id: "cyber-synth",
    name: "Neon Velocity (Cyberpunk Synthwave)",
    genre: "Synthwave Beat",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    duration: 302
  },
  {
    id: "epic-orchestral",
    name: "Horizon's Call (Cinematic Strings)",
    genre: "Epic Orchestral",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    duration: 318
  },
  {
    id: "ambient-rain",
    name: "Midnight Echo (Mood Rain & Piano)",
    genre: "Lo-Fi Cinematic",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
    duration: 345
  }
];

export const COLOR_GRADE_LUTS: LUTFilter[] = [
  {
    id: "none",
    name: "Source LUT (Neutral)",
    class: "",
    description: "Standard raw camera color log profile."
  },
  {
    id: "teal_and_orange",
    name: "Teal & Orange (Hollywood Standard)",
    class: "contrast-[108%] saturate-[118%] hue-rotate-[-3deg] brightness-[98%]",
    description: "Deep oceanic blues contrasted with warm glowing skin tones."
  },
  {
    id: "bleach_bypass",
    name: "Bleach Bypass (Gritty Thriller)",
    class: "contrast-[135%] saturate-[45%] brightness-[92%] sepia-[15%]",
    description: "High-contrast, low saturation look common in epic war & gritty action features."
  },
  {
    id: "monochrome_noir",
    name: "Classic Noir (Tri-X Monochrome)",
    class: "grayscale contrast-[145%] brightness-[90%]",
    description: "High chiascuro silver halide black and white cinematography."
  },
  {
    id: "vintage_warm",
    name: "70's Kodak Warm (Post-Portra)",
    class: "sepia-[18%] contrast-[105%] saturate-[92%] brightness-[102%]",
    description: "Sun-drenched golden warmth with rich pastel skies."
  },
  {
    id: "cyber_neon",
    name: "Glitch Cyber Neon (Veo Special)",
    class: "saturate-[160%] contrast-[115%] hue-rotate-[15deg] brightness-[95%]",
    description: "Vibrant hyper-stimulated magenta and electric blue cast."
  },
  {
    id: "emerald_depth",
    name: "Deep Emerald (Nordic Forest Mood)",
    class: "hue-rotate-[-12deg] saturate-[85%] contrast-[110%] brightness-[94%]",
    description: "Cool moss-green undertones with moody, dark shadows."
  }
];
