
/**
 * Hybrid Audio Engine for "Weeping Rain".
 * 
 * 1. Procedural Layer: Rain & City Hum (Web Audio API) - For dynamic weather intensity.
 * 2. Sample Layer: Music Tracks (HTML5 Audio) - For specific songs loaded from /public/music/ folder.
 * 
 * DEPLOYMENT INSTRUCTION:
 * Make sure you create a folder named 'music' inside your 'public' directory.
 * Place your .mp3 files there with the names below.
 */

import { MusicMode } from "../types";

// --- Web Audio API (Noise/Rain) ---
let audioContext: AudioContext | null = null;
let rainGain: GainNode | null = null;
let cityGain: GainNode | null = null;
let masterGain: GainNode | null = null;
let noiseNodes: AudioScheduledSourceNode[] = [];

// --- HTML5 Audio (Music Tracks) ---
let currentTrack: HTMLAudioElement | null = null;
let currentTrackMode: MusicMode | 'reconciliation' | null = null;
const FADE_DURATION = 2000; // 2 seconds crossfade

// Track Mapping - Points to files in public/music/
const TRACK_FILES: Record<string, string> = {
    piano: '/music/night.mp3',      // "夜" (Night)
    lofi: '/music/cafe.mp3',        // Cafe/Lofi
    machinery: '/music/subway.mp3', // Industrial/Subway
    drone: '/music/error.mp3',      // Glitch/System Failure
    reconciliation: '/music/words.mp3' // "Words Left in the Snow"
};

// --- Utility: Noise Buffer Generation ---
const createBuffer = (ctx: AudioContext, type: 'pink' | 'brown') => {
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);

  if (type === 'pink') {
    let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11; 
        b6 = white * 0.115926;
    }
  } else {
      // Brown
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5; 
      }
  }
  
  const node = ctx.createBufferSource();
  node.buffer = buffer;
  node.loop = true;
  return node;
};

// --- Public API ---

export const initAudio = async () => {
  if (audioContext) return;
  
  // 1. Initialize Web Audio (Rain/City)
  audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  masterGain = audioContext.createGain();
  masterGain.connect(audioContext.destination);

  // Rain Layer
  rainGain = audioContext.createGain();
  rainGain.gain.value = 0;
  rainGain.connect(masterGain);
  
  const rainSource = createBuffer(audioContext, 'pink');
  const rainFilter = audioContext.createBiquadFilter();
  rainFilter.type = 'lowpass';
  rainFilter.frequency.value = 400; 
  rainSource.connect(rainFilter);
  rainFilter.connect(rainGain);
  rainSource.start();
  noiseNodes.push(rainSource);

  // City Layer
  cityGain = audioContext.createGain();
  cityGain.gain.value = 0;
  cityGain.connect(masterGain);

  const citySource = createBuffer(audioContext, 'brown');
  const cityFilter = audioContext.createBiquadFilter();
  cityFilter.type = 'lowpass';
  cityFilter.frequency.value = 80; 
  citySource.connect(cityFilter);
  cityFilter.connect(cityGain);
  citySource.start();
  noiseNodes.push(citySource);

  // 2. Start Default Music
  switchMusicMode('piano');
};

export const switchMusicMode = (mode: MusicMode | 'reconciliation') => {
    // If we are already playing this mode, do nothing
    if (currentTrackMode === mode) return;

    const fileUrl = TRACK_FILES[mode];
    
    // 1. Fade out current track
    if (currentTrack) {
        const oldTrack = currentTrack;
        const fadeOutInterval = setInterval(() => {
            if (oldTrack.volume > 0.05) {
                oldTrack.volume -= 0.05;
            } else {
                oldTrack.volume = 0;
                oldTrack.pause();
                clearInterval(fadeOutInterval);
            }
        }, FADE_DURATION / 20); // 20 steps
    }

    // 2. Stop if silence
    if (mode === 'silence' || !fileUrl) {
        currentTrack = null;
        currentTrackMode = 'silence';
        return;
    }

    // 3. Create and fade in new track
    const newTrack = new Audio(fileUrl);
    newTrack.loop = true;
    newTrack.volume = 0;
    
    // Attempt to play (browser might block if no interaction, but initAudio handles that usually)
    newTrack.play().catch(e => console.warn("Could not play track:", fileUrl, e));

    const fadeInInterval = setInterval(() => {
        if (newTrack.volume < 0.45) { // Max volume 0.5 to not overpower text
            newTrack.volume = Math.min(0.5, newTrack.volume + 0.02);
        } else {
            clearInterval(fadeInInterval);
        }
    }, FADE_DURATION / 25);

    currentTrack = newTrack;
    currentTrackMode = mode;
};

export const setIntensity = (level: 'high' | 'low') => {
  if (!audioContext || !rainGain || !cityGain) return;
  const t = audioContext.currentTime;

  // Rain/City intensity logic stays procedural
  if (level === 'high') {
    rainGain.gain.linearRampToValueAtTime(0.6, t + 2);
    cityGain.gain.linearRampToValueAtTime(0.15, t + 2);
  } else {
    rainGain.gain.linearRampToValueAtTime(0.25, t + 2);
    cityGain.gain.linearRampToValueAtTime(0.08, t + 2);
  }
};

export const fadeInAudio = () => {
  if (!audioContext || !rainGain || !cityGain) return;
  const t = audioContext.currentTime;
  rainGain.gain.linearRampToValueAtTime(0.25, t + 3);
  cityGain.gain.linearRampToValueAtTime(0.08, t + 4);
  
  if (currentTrack) {
      currentTrack.play();
      currentTrack.volume = 0.5;
  }
};

export const fadeOutAudio = () => {
  if (!audioContext || !rainGain || !cityGain) return;
  const t = audioContext.currentTime;
  rainGain.gain.linearRampToValueAtTime(0, t + 1);
  cityGain.gain.linearRampToValueAtTime(0, t + 1);
  
  if (currentTrack) {
      const fadeInterval = setInterval(() => {
          if (currentTrack && currentTrack.volume > 0.05) {
              currentTrack.volume -= 0.1;
          } else if (currentTrack) {
              currentTrack.pause();
              clearInterval(fadeInterval);
          }
      }, 100);
  }
};
