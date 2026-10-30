import { MediaItem, StreamBookmark, EqualizerPreset } from '@/types/media';

export const DEMO_VIDEOS: MediaItem[] = [
  {
    id: 'demo_video_1',
    title: 'Big Buck Bunny (60 FPS)',
    filename: 'big_buck_bunny_1080p.mp4',
    uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration: 596, // ~9 min 56s
    size: 158000000, // ~158 MB
    modificationTime: Date.now() - 1000 * 60 * 60 * 24 * 3,
    mediaType: 'video',
    width: 1920,
    height: 1080,
    thumbnailUri: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
    folderName: 'Movies',
    qualityTag: '1080p',
    audioTracks: [
      { id: 'a1', label: 'English 5.1 Surround', language: 'en', index: 0 },
      { id: 'a2', label: 'Director Commentary', language: 'en', index: 1 },
      { id: 'a3', label: 'Spanish Dub', language: 'es', index: 2 },
    ],
    subtitleTracks: [
      { id: 'sub_en', label: 'English (Full)', language: 'en', uri: 'sample_en' },
      { id: 'sub_es', label: 'Español (CC)', language: 'es', uri: 'sample_es' },
      { id: 'sub_fr', label: 'Français', language: 'fr', uri: 'sample_fr' },
    ],
  },
  {
    id: 'demo_video_2',
    title: 'Tears of Steel (Sci-Fi VFX)',
    filename: 'tears_of_steel_4k.mp4',
    uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    duration: 734, // ~12 min 14s
    size: 294000000, // ~294 MB
    modificationTime: Date.now() - 1000 * 60 * 60 * 24 * 7,
    mediaType: 'video',
    width: 3840,
    height: 2160,
    thumbnailUri: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    folderName: 'Downloads',
    qualityTag: '4K',
    audioTracks: [
      { id: 'tos_1', label: 'Original English Dolby', language: 'en', index: 0 },
      { id: 'tos_2', label: 'Isolated Sci-Fi Score', language: 'instrumental', index: 1 },
    ],
    subtitleTracks: [
      { id: 'tos_sub_en', label: 'English SDH', language: 'en', uri: 'sample_en' },
    ],
  },
  {
    id: 'demo_video_3',
    title: 'Sintel (Fantasy Open Movie)',
    filename: 'sintel_trailer_hd.mp4',
    uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    duration: 888, // ~14 min 48s
    size: 210000000, // ~210 MB
    modificationTime: Date.now() - 1000 * 60 * 60 * 24 * 12,
    mediaType: 'video',
    width: 1920,
    height: 1080,
    thumbnailUri: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
    folderName: 'WhatsApp Video',
    qualityTag: '1080p',
    audioTracks: [
      { id: 'sin_1', label: 'Original Stereo', language: 'en', index: 0 },
    ],
    subtitleTracks: [
      { id: 'sin_sub_en', label: 'English Subtitles', language: 'en', uri: 'sample_en' },
      { id: 'sin_sub_de', label: 'Deutsch', language: 'de', uri: 'sample_de' },
    ],
  },
  {
    id: 'demo_video_4',
    title: 'Elephants Dream (CGI Animation)',
    filename: 'elephants_dream_720p.mp4',
    uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    duration: 653,
    size: 110000000,
    modificationTime: Date.now() - 1000 * 60 * 60 * 24 * 18,
    mediaType: 'video',
    width: 1280,
    height: 720,
    thumbnailUri: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    folderName: 'Camera',
    qualityTag: '720p',
  },
  {
    id: 'demo_video_5',
    title: 'For Bigger Blazes (Action Demo)',
    filename: 'for_bigger_blazes.mp4',
    uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    duration: 15,
    size: 18000000,
    modificationTime: Date.now() - 1000 * 60 * 60 * 2,
    mediaType: 'video',
    width: 1920,
    height: 1080,
    thumbnailUri: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&auto=format&fit=crop&q=80',
    folderName: 'Camera',
    qualityTag: '1080p',
  },
];

export const DEMO_AUDIOS: MediaItem[] = [
  {
    id: 'demo_audio_1',
    title: 'Midnight Synthwave Journey',
    filename: 'midnight_synthwave.mp3',
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: 372, // 6:12
    size: 8900000,
    modificationTime: Date.now() - 1000 * 60 * 60 * 24 * 2,
    mediaType: 'audio',
    artist: 'Neon Cyber Crew',
    albumTitle: 'Retrowave Dreams',
    folderName: 'Soundtracks',
    thumbnailUri: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    qualityTag: '320kbps',
    sampleLyrics: `[00:05.00]Cruising down the highway in the neon rain
[00:15.00]City lights reflect upon the glass again
[00:25.00]Synthesizers pumping through the midnight air
[00:35.00]Driving till the morning without a single care
[00:50.00]Bassline dropping deep into the purple haze
[01:05.00]Living in the echoes of electronic days
[01:20.00]Feel the frequency taking control tonight
[01:35.00]Speeding toward the horizon, out of sight!`,
  },
  {
    id: 'demo_audio_2',
    title: 'Acoustic Morning Breeze',
    filename: 'acoustic_breeze.mp3',
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    duration: 423, // 7:03
    size: 10100000,
    modificationTime: Date.now() - 1000 * 60 * 60 * 24 * 5,
    mediaType: 'audio',
    artist: 'Luna Acoustic',
    albumTitle: 'Golden Hour Reflections',
    folderName: 'Favorites',
    thumbnailUri: 'https://images.unsplash.com/photo-1445985543469-221e57446377?w=800&auto=format&fit=crop&q=80',
    qualityTag: 'Lossless',
    sampleLyrics: `[00:08.00]The sunrise paints the sky in shades of gold
[00:20.00]A quiet melody of stories left untold
[00:34.00]Gentle strings vibrating with the morning dew
[00:48.00]Every single morning waking up brand new
[01:02.00]Let the acoustic harmony wash away the noise
[01:18.00]Finding pure tranquility in simple joys`,
  },
  {
    id: 'demo_audio_3',
    title: 'Urban Chillhop Beats',
    filename: 'urban_chillhop.mp3',
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    duration: 345, // 5:45
    size: 7800000,
    modificationTime: Date.now() - 1000 * 60 * 60 * 24 * 10,
    mediaType: 'audio',
    artist: 'Lo-Fi Cafe',
    albumTitle: 'Coffee & Rainy Windows',
    folderName: 'Music',
    thumbnailUri: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    qualityTag: '320kbps',
    sampleLyrics: `[00:04.00]Raindrops tapping softly on the window pane
[00:16.00]Vinyl crackles warmly playing once again
[00:28.00]Sip the warm espresso, let the rhythm flow
[00:42.00]Nowhere else to rush, take it easy and slow
[01:00.00]Lo-fi piano chords soothing every soul
[01:15.00]Melodies that gently make the spirit whole`,
  },
  {
    id: 'demo_audio_4',
    title: 'Future Bass Energy',
    filename: 'future_bass_anthem.mp3',
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    duration: 302, // 5:02
    size: 6900000,
    modificationTime: Date.now() - 1000 * 60 * 60 * 24 * 1,
    mediaType: 'audio',
    artist: 'Cyber Pulse',
    albumTitle: 'Apex Wave',
    folderName: 'Soundtracks',
    thumbnailUri: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    qualityTag: '320kbps',
  },
];

export const DEMO_STREAM_BOOKMARKS: StreamBookmark[] = [
  {
    id: 'stream_1',
    title: 'HLS Live Stream Demo (M3U8)',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    type: 'hls',
    addedAt: Date.now() - 1000 * 60 * 60 * 5,
  },
  {
    id: 'stream_2',
    title: 'Apple Advanced HLS Stream (Multi-Audio)',
    url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8',
    type: 'hls',
    addedAt: Date.now() - 1000 * 60 * 60 * 24,
  },
  {
    id: 'stream_3',
    title: '4K Nature Reel Stream (MP4)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    type: 'mp4',
    addedAt: Date.now() - 1000 * 60 * 60 * 48,
  },
  {
    id: 'stream_4',
    title: 'Lofi Chill Stream Audio (MP3)',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    type: 'mp3',
    addedAt: Date.now() - 1000 * 60 * 60 * 72,
  },
];

export const SAMPLE_SUBTITLES: Record<string, { startTime: number; endTime: number; text: string }[]> = {
  sample_en: [
    { startTime: 1, endTime: 5, text: "Welcome to OwnPlayer — High Performance Media Player" },
    { startTime: 6, endTime: 11, text: "Swipe left for Brightness • Swipe right for Volume" },
    { startTime: 12, endTime: 18, text: "Drag horizontally to scrub quickly with live time pill" },
    { startTime: 19, endTime: 24, text: "Double tap sides to skip 10 seconds back or forward" },
    { startTime: 25, endTime: 32, text: "Enjoy multi-audio selection, aspect ratios, and speed up to 3x!" },
    { startTime: 33, endTime: 45, text: "Open Private Vault to lock sensitive movies and clips" },
    { startTime: 46, endTime: 60, text: "Seamless background playback keeps your audio rolling" },
    { startTime: 65, endTime: 85, text: "Picture-in-Picture lets you multitask effortlessly" },
  ],
  sample_es: [
    { startTime: 1, endTime: 5, text: "Bienvenido a OwnPlayer — Reproductor de Medios Avanzado" },
    { startTime: 6, endTime: 11, text: "Desliza a la izquierda para el Brillo • A la derecha para el Volumen" },
    { startTime: 12, endTime: 18, text: "Arrastra horizontalmente para avanzar rápidamente" },
    { startTime: 19, endTime: 24, text: "Doble toque en los lados para saltar 10 segundos" },
  ],
  sample_fr: [
    { startTime: 1, endTime: 5, text: "Bienvenue sur OwnPlayer — Lecteur Multimédia Avancé" },
    { startTime: 6, endTime: 11, text: "Glissez à gauche pour la Luminosité • À droite pour le Volume" },
    { startTime: 12, endTime: 18, text: "Glissement horizontal pour rechercher rapidement" },
  ],
};

export const EQUALIZER_PRESETS: EqualizerPreset[] = [
  { id: 'normal', name: 'Normal (Balanced)', description: 'Flat response for studio fidelity', gainBass: 0, gainMid: 0, gainTreble: 0 },
  { id: 'bass', name: 'Bass Boost (+6dB)', description: 'Deep low frequencies for EDM & Hip-Hop', gainBass: 6, gainMid: 1, gainTreble: -1 },
  { id: 'rock', name: 'Rock & Metal', description: 'Punchy kick drum and crisp electric guitars', gainBass: 4, gainMid: -1, gainTreble: 4 },
  { id: 'pop', name: 'Pop & Vocal', description: 'Clarity for vocals and bright synths', gainBass: 2, gainMid: 4, gainTreble: 3 },
  { id: 'electronic', name: 'Electronic & Dance', description: 'Sizzling highs and thumping sub-bass', gainBass: 5, gainMid: 2, gainTreble: 5 },
  { id: 'classical', name: 'Classical Concert', description: 'Wide dynamic range and transparent acoustic sound', gainBass: 1, gainMid: 2, gainTreble: 3 },
  { id: 'movie', name: 'Cinematic Movie (Dialogue Boost)', description: 'Elevates voices above background explosions', gainBass: 2, gainMid: 5, gainTreble: 1 },
];
