import { SubtitleCue } from '@/types/media';

/**
 * Parses time string like "00:01:23,456" or "01:23.456" into seconds.
 */
function parseSubtitleTime(timeStr: string): number {
  if (!timeStr) return 0;
  const normalized = timeStr.trim().replace(',', '.');
  const parts = normalized.split(':');
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]);
    const minutes = parseFloat(parts[1]);
    const seconds = parseFloat(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    const minutes = parseFloat(parts[0]);
    const seconds = parseFloat(parts[1]);
    return minutes * 60 + seconds;
  }
  return parseFloat(normalized) || 0;
}

export function parseSubtitles(content: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  if (!content) return cues;

  // Normalize line endings
  const cleanContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = cleanContent.split(/\n\s*\n/);

  let idCounter = 1;
  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    let timeLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('-->')) {
        timeLineIndex = i;
        break;
      }
    }

    if (timeLineIndex === -1) continue;

    const timeLine = lines[timeLineIndex];
    const [startStr, endStr] = timeLine.split('-->').map(s => s.trim());
    if (!startStr || !endStr) continue;

    const startTime = parseSubtitleTime(startStr);
    const endTime = parseSubtitleTime(endStr);

    const textLines = lines.slice(timeLineIndex + 1);
    const rawText = textLines.join('\n');
    // Strip simple HTML formatting tags
    const text = rawText.replace(/<\/?[^>]+(>|$)/g, '').trim();

    if (text) {
      cues.push({
        id: `cue_${idCounter++}`,
        startTime,
        endTime,
        text,
      });
    }
  }

  return cues;
}

export function getCurrentSubtitleCue(
  cues: SubtitleCue[],
  currentPosition: number,
  delaySeconds: number = 0
): SubtitleCue | null {
  if (!cues || cues.length === 0) return null;
  const adjustedTime = currentPosition - delaySeconds;
  return cues.find(c => adjustedTime >= c.startTime && adjustedTime <= c.endTime) || null;
}
