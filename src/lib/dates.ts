export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// `<time datetime="...">` wants a machine-readable ISO date.
export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
