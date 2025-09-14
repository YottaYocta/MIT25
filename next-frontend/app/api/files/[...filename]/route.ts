import { NextResponse } from "next/server";

// Proxy files served by the external generator so clients can call /files/<nested/path>
const GENERATOR_URL =
  process.env.GENERATOR_URL?.replace(/\/$/, "") ||
  "https://cb7943f2c7d6.ngrok-free.app";

type Params = { params: Promise<{ filename: string[] }> };

export async function GET(_req: Request, ctx: Params) {
  const { filename } = await ctx.params;
  const segments = Array.isArray(filename) ? filename : [filename];
  if (!segments.length) {
    return NextResponse.json({ error: "Missing filename" }, { status: 400 });
  }

  const path = segments.map(encodeURIComponent).join("/");

  try {
    const upstream = await fetch(`${GENERATOR_URL}/files/${path}`);
    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream error ${upstream.status}` },
        { status: upstream.status },
      );
    }

    const arrayBuffer = await upstream.arrayBuffer();
    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    const contentDisposition = upstream.headers.get("content-disposition") || `attachment; filename="${segments[segments.length - 1]}"`;
    const cacheControl = upstream.headers.get("cache-control") || "public, max-age=31536000";

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
        "Cache-Control": cacheControl,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Failed to fetch file" },
      { status: 502 },
    );
  }
}


