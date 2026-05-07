export function formatTimeSeconds(seconds: number | string): string {
  const num = typeof seconds === 'string' ? parseFloat(seconds) : seconds;
  if (isNaN(num)) return typeof seconds === 'string' ? seconds : '';
  
  if (num >= 60) {
    const mins = Math.floor(num / 60);
    const secs = (num % 60).toFixed(2);
    // Pad with zero if seconds < 10
    const formattedSecs = parseFloat(secs) < 10 ? `0${secs}` : secs;
    return `${mins}:${formattedSecs}`;
  }
  return num.toFixed(2);
}

export function parseTimeInput(timeStr: string): string {
  if (!timeStr) return '';
  if (timeStr.includes(':')) {
    const [mins, secs] = timeStr.split(':');
    const totalSeconds = parseInt(mins || '0') * 60 + parseFloat(secs || '0');
    if (isNaN(totalSeconds)) return timeStr;
    return totalSeconds.toString();
  }
  return timeStr;
}
