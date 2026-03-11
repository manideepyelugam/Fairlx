/**
 * BYOB Welcome Page
 * 
 * Re-exports the Cloud welcome page component.
 * sessionMiddleware handles routing all data operations to customer Appwrite,
 * so the same welcome dashboard works for both Cloud and BYOB users.
 */
export { default } from "@/app/(dashboard)/welcome/page";
