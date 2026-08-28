import { NextRequest } from "next/server";

const DEFAULT_BASE_URL = "https://developers.freefirecommunity.com/api/v1";

export async function GET(request: NextRequest) {
  const itemID = request.nextUrl.searchParams.get("itemID")?.trim() || "";

  if (!/^\d{1,20}$/.test(itemID)) {
    return new Response("Invalid item", { status: 400 });
  }

  const apiKey = process.env.FREE_FIRE_API_KEY;
  if (!apiKey) {
    return new Response("Free Fire API is not configured", { status: 503 });
  }

  const baseUrl = (process.env.FREE_FIRE_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const upstream = await fetch(`${baseUrl}/image?itemID=${encodeURIComponent(itemID)}`, {
      headers: {
        "x-api-key": apiKey,
        accept: "image/png,image/jpeg,image/webp,*/*",
      },
      signal: controller.signal,
      cache: "force-cache",
    });

    if (!upstream.ok) {
      return new Response("Image not found", { status: upstream.status === 404 ? 404 : 502 });
    }

    const buffer = await upstream.arrayBuffer();
    const contentType = upstream.headers.get("content-type") || "image/png";

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch {
    return new Response("Image unavailable", { status: 504 });
  } finally {
    clearTimeout(timeout);
  }
}
