/**
 * Generate alternative slug suggestions when a slug is already taken.
 *
 * Strategies:
 * 1. Append common suffixes: -app, -team, -hq, -dev, -io
 * 2. Append 2-digit random numbers
 * 3. Append current year
 */
export function generateSlugSuggestions(
    baseSlug: string,
    count: number = 5
): string[] {
    const suffixes = ["-app", "-team", "-hq", "-dev", "-io"];
    const year = new Date().getFullYear().toString().slice(-2);
    const suggestions: string[] = [];

    // Strategy 1: Named suffixes
    for (const suffix of suffixes) {
        const candidate = `${baseSlug}${suffix}`;
        if (candidate.length <= 48) {
            suggestions.push(candidate);
        }
        if (suggestions.length >= count) break;
    }

    // Strategy 2: Year suffix
    if (suggestions.length < count) {
        const yearCandidate = `${baseSlug}-${year}`;
        if (yearCandidate.length <= 48) {
            suggestions.push(yearCandidate);
        }
    }

    // Strategy 3: Random 2-digit numbers
    const usedNumbers = new Set<number>();
    while (suggestions.length < count + 2) {
        const num = Math.floor(Math.random() * 90) + 10; // 10–99
        if (usedNumbers.has(num)) continue;
        usedNumbers.add(num);

        const candidate = `${baseSlug}-${num}`;
        if (candidate.length <= 48) {
            suggestions.push(candidate);
        }
    }

    return suggestions.slice(0, count);
}
