import { Account } from "node-appwrite";
import { TwoFactorMethod, UserTwoFactorPrefs } from "./types";

/**
 * Enables 2FA for a user
 */
export async function enableTwoFactor(
    account: Account,
    method: TwoFactorMethod,
    totpSecret?: string
): Promise<void> {
    const user = await account.get();
    const currentPrefs = user.prefs || {};

    let newMethod = method;
    const currentMethod = currentPrefs.twoFactorMethod as TwoFactorMethod;

    if (currentPrefs.twoFactorEnabled) {
        if (currentMethod !== method && currentMethod !== TwoFactorMethod.BOTH) {
            newMethod = TwoFactorMethod.BOTH;
        } else if (currentMethod === TwoFactorMethod.BOTH) {
            newMethod = TwoFactorMethod.BOTH;
        }
    }

    const updatedPrefs: UserTwoFactorPrefs & Record<string, unknown> = {
        ...currentPrefs,
        twoFactorEnabled: true,
        twoFactorMethod: newMethod,
        twoFactorEnabledAt: new Date().toISOString(),
    };

    if (totpSecret) {
        updatedPrefs.totpSecret = totpSecret;
    }

    await account.updatePrefs(updatedPrefs);
}

/**
 * Disables 2FA for a user
 */
export async function disableTwoFactor(account: Account, method?: TwoFactorMethod): Promise<void> {
    const user = await account.get();
    const currentPrefs = user.prefs || {};

    const updatedPrefs = { ...currentPrefs };
    const currentMethod = currentPrefs.twoFactorMethod as TwoFactorMethod;

    if (!method || currentMethod === method) {
        // Disable all
        delete updatedPrefs.twoFactorEnabled;
        delete updatedPrefs.twoFactorMethod;
        delete updatedPrefs.totpSecret;
        delete updatedPrefs.twoFactorEnabledAt;
    } else if (currentMethod === TwoFactorMethod.BOTH) {
        // Disable one, keep the other
        if (method === TwoFactorMethod.TOTP) {
            updatedPrefs.twoFactorMethod = TwoFactorMethod.EMAIL;
            delete updatedPrefs.totpSecret;
        } else if (method === TwoFactorMethod.EMAIL) {
            updatedPrefs.twoFactorMethod = TwoFactorMethod.TOTP;
        }
    }

    await account.updatePrefs(updatedPrefs);
}
