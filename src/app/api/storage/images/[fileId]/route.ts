/**
 * Image Serving Proxy
 * 
 * Serves images from the active storage provider (R2 or Appwrite).
 * Used for profile images, workspace/project/space logos.
 * 
 * URL format: /api/storage/images/{fileId}
 * 
 * The images bucket is hardcoded to IMAGES_BUCKET_ID since all
 * profile/logo images go there. For attachments, use the
 * attachments API route instead.
 */
import { NextRequest, NextResponse } from "next/server";
import { IMAGES_BUCKET_ID } from "@/config";
import { getAdminStorageProvider } from "@/lib/storage";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params;

  if (!fileId) {
    return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
  }

  try {
    const provider = await getAdminStorageProvider();
    const buffer = await provider.getFileView(IMAGES_BUCKET_ID, fileId);

    // Detect content type from first bytes (magic numbers)
    const contentType = detectImageType(buffer) || "image/png";

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "CDN-Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (error) {
    console.error(`[ImageProxy] Failed to serve image ${fileId}:`, error);
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }
}

/**
 * Detect image MIME type from buffer magic bytes.
 */
function detectImageType(buffer: Buffer): string | null {
  if (buffer.length < 4) return null;

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "image/png";
  }
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  // GIF: 47 49 46
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return "image/gif";
  }
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer.length > 11 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return "image/webp";
  }
  // SVG (starts with < or whitespace then <)
  const start = buffer.toString("utf-8", 0, Math.min(buffer.length, 256)).trimStart();
  if (start.startsWith("<svg") || start.startsWith("<?xml")) {
    return "image/svg+xml";
  }
  // AVIF / HEIF: check for 'ftyp' box
  if (buffer.length > 11 && buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) {
    const brand = buffer.toString("ascii", 8, 12);
    if (brand === "avif" || brand === "avis") return "image/avif";
    if (brand === "heic" || brand === "heix") return "image/heic";
  }

  return null;
}
