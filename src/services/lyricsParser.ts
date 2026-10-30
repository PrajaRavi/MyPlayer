import { LyricsLine } from '@/types/media';

export function parseLrcLyrics(lrcText: string): LyricsLine[] {
  if (!lrcText) return [];
  const lines = lrcText.split('\n');
  const result: LyricsLine[] = [];

  const timeRegex = /\[(\d{2}):(\d{2})\.?(\d{0,3})?\]/g;

  for (const rawLine of lines) {
    const text = rawLine.replace(/\[\d{2}:\d{2}\.?\d{0,3}?\]/g, '').trim();
    if (!text) continue;

    let match;
    timeRegex.lastIndex = 0;
    while ((match = timeRegex.exec(rawLine)) !== null) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const ms = match[3] ? parseFloat(`0.${match[3]}`) : 0;
      const totalSeconds = min * 60 + sec + ms;
      result.push({ time: totalSeconds, text });
    }
  }

  // Sort chronologically
  return result.sort((a, b) => a.time - b.time);
}

export function getCurrentLyricsIndex(lyrics: LyricsLine[], currentTime: number): number {
  if (!lyrics || lyrics.length === 0) return -1;
  let activeIndex = -1;
  for (let i = 0; i < lyrics.length; i++) {
    if (currentTime >= lyrics[i].time) {
      activeIndex = i;
    } else {
      break;
    }
  }
  return activeIndex;
}
