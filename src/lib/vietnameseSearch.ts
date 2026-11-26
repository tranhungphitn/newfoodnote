/**
 * Strips Vietnamese diacritics for accent-insensitive matching while preserving
 * exact NFC Unicode comparisons when the user explicitly types accented tokens.
 */
export function stripVietnameseDiacritics(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export function matchesVietnameseQuery(target: string, rawQuery: string): boolean {
  const queryNfc = rawQuery.normalize('NFC').trim().toLowerCase();
  if (!queryNfc) return true;

  const targetNfc = target.normalize('NFC').toLowerCase();
  if (targetNfc.includes(queryNfc)) {
    return true;
  }

  const targetFolded = stripVietnameseDiacritics(targetNfc);
  const tokens = queryNfc.split(/\s+/).filter(Boolean);

  return tokens.every((token) => {
    const foldedToken = stripVietnameseDiacritics(token);
    const hasDiacritics = foldedToken !== token;
    if (hasDiacritics) {
      return targetNfc.includes(token);
    }
    return targetFolded.includes(foldedToken);
  });
}
