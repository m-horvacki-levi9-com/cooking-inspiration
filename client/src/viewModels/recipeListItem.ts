export const DESCRIPTION_PREVIEW_CHARS = 120;
export const DESCRIPTION_PREVIEW_FALLBACK = 'Description coming soon.';

export function formatDescriptionPreview(description: string | null): string {
  if (!description) {
    return DESCRIPTION_PREVIEW_FALLBACK;
  }
  if (description.length <= DESCRIPTION_PREVIEW_CHARS) {
    return description;
  }
  return `${description.slice(0, DESCRIPTION_PREVIEW_CHARS).trimEnd()}\u2026`;
}
