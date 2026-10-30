# OwnPlayer — Full-Featured Video & Audio Player (PLAYit / MX Player style)

**OwnPlayer** is an all-in-one, high-performance, gesture-controlled Video and Audio Player built with **Expo React Native**, TypeScript, and modern modular architecture. It delivers the signature features popularized by modern media players like **PLAYit** and **MX Player**.

---

## 🚀 Key Features

### 🎬 1. Gesture-Controlled Cinematic Video Player (`/player/video`)
- **Vertical Swipe (Left Side)**: Real-time Screen Brightness control (0%–100%) with animated Sun HUD.
- **Vertical Swipe (Right Side)**: Real-time Volume & Audio Boost control (up to 200%) with animated Speaker HUD.
- **Horizontal Swipe**: Fast Seeking with interactive time preview pill (`+00:15 [04:32 / 12:45]`).
- **Double Tap Left**: Fast rewind 10 seconds with 3-chevron animated ripple.
- **Double Tap Right**: Fast forward 10 seconds with 3-chevron animated ripple.
- **Screen Lock (Padlock)**: One-tap screen lock that freezes gestures and hides controls so accidental touches don't interrupt your movie; unlocks via floating padlock.
- **Multi-Audio Track Selector**: Switch between dual/multiple audio channels (e.g., English, Commentary, Dubbed).
- **Subtitles & Closed Captions Engine**:
  - Full `.srt` and `.vtt` parser.
  - Subtitle delay adjuster (`-1.0s`, `-0.5s`, `0s`, `+0.5s`, `+1.0s`).
  - Scalable subtitle font sizes (`14px`, `18px`, `22px`, `26px`).
  - External subtitle file picker.
- **Aspect Ratio Switcher**: Seamlessly cycle between `Fit to Screen (Contain)`, `Zoom to Fill (Cover)`, and `Stretch (Fill)`.
- **Playback Speed Selector**: Fine-tuned speeds (`0.25x`, `0.5x`, `0.75x`, `1.0x`, `1.25x`, `1.5x`, `2.0x`, `3.0x`).
- **A-B Repeat Interval Loop**: Set Point A and Point B to loop a specific scene continuously (great for tutorials, dance, language learning).
- **Sleep Timer**: Auto-pause playback after 15, 30, 45, or 60 minutes.
- **Orientation Lock**: Toggle between Portrait, Landscape, and Auto-rotate.
- **Auto-Resume**: Remembers watched progress and prompts "Continue Watching" where you left off.

---

### 🎵 2. Dedicated Music & Audio Player (`/(tabs)/music`)
- **Docked Floating Mini Player Bar**:
  - Sits right above bottom tabs across all screens.
  - Displays album art, track title, artist, live micro-progress bar, play/pause, next, and close button.
  - Single tap smoothly expands into the full-screen player modal.
- **Full-Screen Audio Player Modal**:
  - Rotating vinyl album artwork animation.
  - Animated multi-bar frequency sound visualizer.
  - **Synchronized Lyrics (.lrc)**: Real-time scrolling lyrics that automatically highlight the active line.
  - **Equalizer Presets**: Normal, Bass Boost (+6dB), Rock & Metal, Pop & Vocal, Electronic & Dance, Classical Concert, and Movie Dialogue Boost.
  - **Playback Modes**: Loop All, Loop One, Shuffle, Sequential.
  - **Queue Sheet**: View and re-order upcoming songs.
  - **Sleep Timer**: 15m, 30m, 45m, 60m, or off.
  - **Background Audio**: Stays active when the app is minimized or screen is locked.

---

### 📂 3. Media Library & Storage Browser (`/(tabs)/index`)
- **Device Storage Scanner**: Scans local device videos and audio using `expo-media-library`.
- **Folder Grouping**: Automatically organizes videos into folders (Camera, WhatsApp Video, Movies, Downloads, etc.).
- **Built-in 4K / 1080p Demo Media**: Includes preloaded open-source cinema files (Big Buck Bunny 60FPS, Tears of Steel 4K VFX, Sintel, etc.) and high-fidelity soundtracks so you can experience all player features immediately on any emulator, web, or device.
- **Search & Sort**: Real-time instant search; sort by Date Modified, File Name, File Size, or Duration (Ascending / Descending).
- **3-Dots Action Sheet**: Resume, Play from Beginning, Add to Playlist, Lock in Private Vault, Share, Media Info, and Delete.

---

### 🌐 4. Network Stream Player (`/(tabs)/stream`)
- Stream online media by pasting direct URLs:
  - **M3U8 / HLS Live Streams**
  - **MP4 & WebM Web Videos**
  - **MP3 & AAC Audio Streams**
- Save stream bookmarks with custom titles for one-click access.
- Preloaded with live test streams (MUX HLS, Apple Multi-Audio HLS, 4K Nature Reel, Lo-Fi Radio).

---

### 🔒 5. Private Security Vault & Utilities (`/(tabs)/tools`)
- **Private Vault**:
  - 4-digit PIN security keypad.
  - Completely hides sensitive videos and audios from the general library.
  - Watch videos or listen to songs securely inside the vault, or restore them anytime.
- **Video to MP3 Extractor**: Tool to extract audio from video files.
- **Video Trimmer**: Tool to cut video start and end points without quality loss.
- **Storage Analyzer**: Visual breakdown of disk space consumed by videos and music.

---

## 🛠️ Project Structure

```
OwnPlayer/
├── assets/                       # App icons, splash screens, and images
├── src/
│   ├── app/
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx       # Bottom navigation with persistent Mini Player
│   │   │   ├── index.tsx         # Videos Library & Folder browser
│   │   │   ├── music.tsx         # Music tracks, playlists, artists & albums
│   │   │   ├── stream.tsx        # Online M3U8, HLS & MP4 network streamer
│   │   │   └── tools.tsx         # Private Vault with PIN keypad & utilities
│   │   ├── player/
│   │   │   └── video.tsx         # Full gesture video player (brightness, vol, seek)
│   │   ├── _layout.tsx           # Root navigation stack & providers
│   │   └── index.tsx             # Entry redirect
│   ├── components/
│   │   ├── audio/
│   │   │   ├── MiniPlayerBar.tsx # Docked audio mini player
│   │   │   └── FullAudioPlayerModal.tsx # Vinyl disc, visualizer & synced lyrics
│   │   ├── common/
│   │   │   ├── AudioTrackRow.tsx # Track row with live playing equalizer indicator
│   │   │   ├── FolderCard.tsx    # Folder card with item count and size
│   │   │   ├── Header.tsx        # App top bar with search and actions
│   │   │   ├── MediaActionSheet.tsx # 3-dots action sheet
│   │   │   ├── MediaCard.tsx     # Video card with thumbnail, duration & resume bar
│   │   │   ├── PlaylistModal.tsx # Playlist creator and picker
│   │   │   └── SortFilterModal.tsx # Sort order & criteria modal
│   │   └── video/
│   │       ├── GestureHUD.tsx    # HUD overlays for volume, brightness & seek
│   │       ├── SubtitlesOverlay.tsx # Real-time subtitle cue renderer
│   │       └── VideoSettingsModal.tsx # Audio boost, A-B repeat, delay & sleep
│   ├── constants/
│   │   ├── colors.ts             # Deep Obsidian Dark Theme colors
│   │   └── demoMedia.ts          # Demo 4K/1080p videos, songs, lyrics & streams
│   ├── context/
│   │   ├── AudioPlayerContext.tsx# Global background audio playback state
│   │   └── MediaContext.tsx      # Media library, favorites, playlists & vault
│   ├── services/
│   │   ├── lyricsParser.ts       # Synchronized LRC lyrics parser
│   │   ├── mediaScanner.ts       # Device storage scanner & document picker
│   │   ├── storage.ts            # AsyncStorage persistence for resume, PIN & playlists
│   │   └── subtitleParser.ts     # SRT & WebVTT subtitle engine
│   ├── types/
│   │   └── media.ts              # TypeScript interfaces for media items
│   └── utils/
│       └── formatters.ts         # Duration, file size & date helpers
├── app.json                      # Expo application configuration & permissions
├── package.json
└── tsconfig.json
```

---

## 📱 Android Build & Run Instructions

This project is fully generated and prebuilt for **Android**:

### 1. Run Directly on Connected Android Device or Emulator
```bash
npm run android
# or: npx expo run:android
```

### 2. Generate Standalone Debug APK locally
```bash
npm run build:apk:debug
```
> The generated APK will be placed in: `android/app/build/outputs/apk/debug/app-debug.apk`

### 3. Generate Release APK locally
```bash
npm run build:apk
```
> The generated APK will be placed in: `android/app/build/outputs/apk/release/app-release.apk`

### 4. Build Cloud APK using EAS (Expo Application Services)
```bash
npx eas-cli build -p android --profile preview
```

---

## 🏃 General Development Server
```bash
npx expo start
```
