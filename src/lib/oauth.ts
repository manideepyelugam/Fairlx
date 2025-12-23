// src/lib/server/oauth.js
// Reference: https://appwrite.io/docs/tutorials/nextjs-ssr-auth/step-7
"use server";

import { createAdminClient } from "@/lib/appwrite";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { OAuthProvider } from "node-appwrite";

export async function signUpWithGithub(returnUrl?: string) {
  const { account } = await createAdminClient();

  const origin = (await headers()).get("origin");

  // Encode returnUrl in the failure redirect URL so it can be preserved
  const failureUrl = returnUrl 
    ? `${origin}/sign-up?returnUrl=${encodeURIComponent(returnUrl)}`
    : `${origin}/sign-up`;
  
  // Encode returnUrl in the success redirect URL
  const successUrl = returnUrl
    ? `${origin}/oauth?returnUrl=${encodeURIComponent(returnUrl)}`
    : `${origin}/oauth`;

  const redirectUrl = await account.createOAuth2Token(
    OAuthProvider.Github,
    successUrl,
    failureUrl
  );

  return redirect(redirectUrl);
}

export async function signUpWithGoogle(returnUrl?: string) {
  const { account } = await createAdminClient();

  const origin = (await headers()).get("origin");

  // Encode returnUrl in the failure redirect URL so it can be preserved
  const failureUrl = returnUrl 
    ? `${origin}/sign-up?returnUrl=${encodeURIComponent(returnUrl)}`
    : `${origin}/sign-up`;
  
  // Encode returnUrl in the success redirect URL
  const successUrl = returnUrl
    ? `${origin}/oauth?returnUrl=${encodeURIComponent(returnUrl)}`
    : `${origin}/oauth`;

  const redirectUrl = await account.createOAuth2Token(
    OAuthProvider.Google,
    successUrl,
    failureUrl
  );

  return redirect(redirectUrl);
}
