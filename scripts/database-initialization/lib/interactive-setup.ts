import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { logger } from './logger';

const ENV_FILE_PATH = path.resolve(process.cwd(), '.env.local');

// ─── Required Core Variables ─────────────────────────────────

const CORE_VARS = [
    {
        key: 'NEXT_PUBLIC_APP_URL',
        label: 'App URL',
        default: 'http://localhost:3000',
        guide: null, // Has a default, no guide needed
    },
    {
        key: 'NEXT_PUBLIC_APPWRITE_ENDPOINT',
        label: 'Appwrite API Endpoint',
        default: '',
        guide: `
    ┌─────────────────────────────────────────────────────────┐
    │  HOW TO GET YOUR APPWRITE ENDPOINT                      │
    ├─────────────────────────────────────────────────────────┤
    │                                                         │
    │  Appwrite Cloud:                                        │
    │    → Use: https://cloud.appwrite.io/                    │
    │                                                         │
    │  Self-Hosted Appwrite:                                  │
    │    → Use: https://your-domain.com/                      │
    │    → Or:  http://localhost/  (local Docker)             │
    │                                                         │
    └─────────────────────────────────────────────────────────┘`,
    },
    {
        key: 'NEXT_PUBLIC_APPWRITE_PROJECT',
        label: 'Appwrite Project ID',
        default: '',
        guide: `
    ┌─────────────────────────────────────────────────────────┐
    │  HOW TO GET YOUR APPWRITE PROJECT ID                    │
    ├─────────────────────────────────────────────────────────┤
    │                                                         │
    │  1. Go to https://cloud.appwrite.io/console             │
    │     (or your self-hosted Appwrite console)              │
    │                                                         │
    │  2. Create a new project:                               │
    │     → Click "Create Project"                            │
    │     → Enter project name (e.g., "Fairlx")               │
    │     → Click "Create"                                    │
    │                                                         │
    │  3. Copy the Project ID:                                │
    │     → Go to Project Settings (gear icon)                │
    │     → The Project ID is shown at the top                │
    │     → It looks like: 64a1b2c3d4e5f6789012               │
    │                                                         │
    └─────────────────────────────────────────────────────────┘`,
    },
    {
        key: 'NEXT_APPWRITE_KEY',
        label: 'Appwrite API Key (Server-side)',
        default: '',
        guide: `
    ┌─────────────────────────────────────────────────────────┐
    │  HOW TO CREATE AN APPWRITE API KEY                      │
    ├─────────────────────────────────────────────────────────┤
    │                                                         │
    │  1. Go to your Appwrite Console                         │
    │     → Select your project                               │
    │                                                         │
    │  2. Navigate to API Keys:                               │
    │     → Click "Overview" in left sidebar                  │
    │     → Scroll to "Integrations" section                  │
    │     → Click "API Keys" tab                              │
    │                                                         │
    │  3. Create a new key:                                   │
    │     → Click "Create API Key"                            │
    │     → Name: "Fairlx Server Key"                         │
    │     → Expiry: "Never"                                   │
    │                                                         │
    │  4. Set Scopes — enable ALL of these:                   │
    │     ✅ databases.read    ✅ databases.write             │
    │     ✅ collections.read  ✅ collections.write           │
    │     ✅ attributes.read   ✅ attributes.write            │
    │     ✅ indexes.read      ✅ indexes.write               │
    │     ✅ documents.read    ✅ documents.write             │
    │     ✅ files.read        ✅ files.write                 │
    │     ✅ buckets.read      ✅ buckets.write               │
    │     ✅ users.read        ✅ users.write                 │
    │                                                         │
    │  5. Click "Create" and copy the key immediately         │
    │     ⚠️  The key is shown only ONCE!                     │
    │                                                         │
    │  The key looks like:                                    │
    │  standard_abc123...xyz789 (very long string)            │
    │                                                         │
    └─────────────────────────────────────────────────────────┘`,
    },
] as const;

// ─── Interactive Prompt ──────────────────────────────────────

function createPrompt(): readline.Interface {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
}

function ask(rl: readline.Interface, question: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

/**
 * Runs the interactive setup flow:
 * 1. Creates .env.local if it doesn't exist
 * 2. Checks if core variables are present
 * 3. Prompts user for missing values with step-by-step guides
 * 4. Writes values to .env.local and process.env
 *
 * Returns true if all core vars are now set, false if user aborted.
 */
export async function runInteractiveSetup(): Promise<boolean> {
    // Step 1: Check if .env.local exists
    if (!fs.existsSync(ENV_FILE_PATH)) {
        logger.info('No .env.local file found. Creating one...');
        fs.writeFileSync(ENV_FILE_PATH, '', 'utf-8');
        logger.info('✅ Created .env.local');
        console.log('');
    }

    // Step 2: Reload env from the file
    const dotenv = await import('dotenv');
    dotenv.config({ path: ENV_FILE_PATH });

    // Step 3: Check which core vars are missing
    const missingVars = CORE_VARS.filter((v) => {
        const val = process.env[v.key];
        return !val || val.trim() === '';
    });

    if (missingVars.length === 0) {
        return true; // All core vars already set
    }

    // Step 4: Show welcome and prompt for missing values
    console.log('');
    logger.separator();
    console.log('\x1b[1m\x1b[36m🔧 INITIAL SETUP — Appwrite Configuration Required\x1b[0m');
    logger.separator();
    console.log('');
    console.log('\x1b[33mBefore provisioning the database, we need your Appwrite credentials.\x1b[0m');
    console.log('\x1b[33mFollow the guides below to get each value.\x1b[0m');
    console.log('');
    console.log(`\x1b[90m  Missing ${missingVars.length} required variable(s):\x1b[0m`);
    for (const v of missingVars) {
        console.log(`\x1b[90m    • ${v.key}\x1b[0m`);
    }
    console.log('');

    const rl = createPrompt();
    const collectedValues: Record<string, string> = {};

    try {
        for (const varDef of missingVars) {
            // Show the guide if available
            if (varDef.guide) {
                console.log(`\x1b[36m${varDef.guide}\x1b[0m`);
                console.log('');
            }

            let value = '';

            if (varDef.default) {
                // Has a default — offer it
                value = await ask(
                    rl,
                    `  \x1b[1m${varDef.label}\x1b[0m (${varDef.key})\n  \x1b[90mDefault: ${varDef.default}\x1b[0m\n  \x1b[33m→ Press Enter for default, or type your value: \x1b[0m`
                );
                if (!value) value = varDef.default;
            } else {
                // Required — must enter
                while (!value) {
                    value = await ask(
                        rl,
                        `  \x1b[1m${varDef.label}\x1b[0m (${varDef.key})\n  \x1b[33m→ Paste your value here: \x1b[0m`
                    );
                    if (!value) {
                        console.log('\x1b[31m  ❌ This value is required. Please enter it.\x1b[0m');
                        console.log('');
                    }
                }
            }

            collectedValues[varDef.key] = value;
            process.env[varDef.key] = value; // Set in current process immediately
            console.log(`  \x1b[32m✅ ${varDef.key} set\x1b[0m`);
            console.log('');
        }

        rl.close();
    } catch (err) {
        rl.close();
        console.log('\n\x1b[31m❌ Setup cancelled.\x1b[0m');
        return false;
    }

    // Step 5: Write collected values to .env.local
    let envContent = '';
    if (fs.existsSync(ENV_FILE_PATH)) {
        envContent = fs.readFileSync(ENV_FILE_PATH, 'utf-8');
    }

    const linesToAppend: string[] = [];

    for (const [key, value] of Object.entries(collectedValues)) {
        // Check if key already exists in file (even if empty)
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (regex.test(envContent)) {
            // Replace existing line
            envContent = envContent.replace(regex, `${key}=${value}`);
        } else {
            linesToAppend.push(`${key}=${value}`);
        }
    }

    if (linesToAppend.length > 0) {
        if (envContent && !envContent.endsWith('\n')) {
            envContent += '\n';
        }
        envContent += linesToAppend.join('\n') + '\n';
    }

    fs.writeFileSync(ENV_FILE_PATH, envContent, 'utf-8');

    console.log('');
    logger.separator();
    console.log('\x1b[32m✅ Core configuration saved to .env.local\x1b[0m');
    logger.separator();
    console.log('');

    return true;
}
