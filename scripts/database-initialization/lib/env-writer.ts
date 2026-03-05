import * as fs from 'fs';
import * as path from 'path';
import { logger } from './logger';

const ENV_FILE_PATH = path.resolve(process.cwd(), '.env.local');

/**
 * Reads the current .env.local file and returns its content as a Map of key→value.
 * Preserves comments and blank lines by storing them separately.
 */
function readEnvFile(): { lines: string[]; vars: Map<string, string> } {
    const vars = new Map<string, string>();
    let lines: string[] = [];

    if (fs.existsSync(ENV_FILE_PATH)) {
        const content = fs.readFileSync(ENV_FILE_PATH, 'utf-8');
        lines = content.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const eqIdx = trimmed.indexOf('=');
                if (eqIdx > 0) {
                    const key = trimmed.substring(0, eqIdx).trim();
                    const value = trimmed.substring(eqIdx + 1).trim();
                    vars.set(key, value);
                }
            }
        }
    }

    return { lines, vars };
}

/**
 * Writes env variables to .env.local.
 * - Updates existing keys in-place (preserving their position)
 * - Appends new keys at the end, grouped under a header comment
 */
export function writeEnvVars(newVars: Record<string, string>): void {
    const { lines, vars: existingVars } = readEnvFile();

    const updatedKeys = new Set<string>();
    const newLines: string[] = [];

    // Pass 1: Update existing lines in place
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx > 0) {
                const key = trimmed.substring(0, eqIdx).trim();
                if (key in newVars) {
                    // Update the value of this key
                    newLines.push(`${key}=${newVars[key]}`);
                    updatedKeys.add(key);
                    continue;
                }
            }
        }
        newLines.push(line);
    }

    // Pass 2: Append any new keys that weren't already in the file
    const keysToAppend = Object.entries(newVars).filter(([key]) => !updatedKeys.has(key));

    if (keysToAppend.length > 0) {
        // Ensure there's a blank line before the new section
        const lastLine = newLines[newLines.length - 1];
        if (lastLine && lastLine.trim() !== '') {
            newLines.push('');
        }
        newLines.push('# ─── Database & Collection IDs (auto-generated) ───');

        // Group by category
        const dbKeys = keysToAppend.filter(([k]) => k.includes('DATABASE'));
        const collectionKeys = keysToAppend.filter(([k]) => !k.includes('DATABASE'));

        for (const [key, value] of dbKeys) {
            newLines.push(`${key}=${value}`);
        }

        if (dbKeys.length > 0 && collectionKeys.length > 0) {
            newLines.push('');
        }

        for (const [key, value] of collectionKeys) {
            newLines.push(`${key}=${value}`);
        }

        newLines.push('');
    }

    // Write the file
    const finalContent = newLines.join('\n');
    fs.writeFileSync(ENV_FILE_PATH, finalContent, 'utf-8');

    const totalWritten = updatedKeys.size + keysToAppend.length;
    logger.info(`📝 Wrote ${totalWritten} env variables to .env.local (${updatedKeys.size} updated, ${keysToAppend.length} added)`);
}
