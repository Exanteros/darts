import { NextRequest, NextResponse } from "next/server";

type IpApiResponse = {
  city?: string;
  region?: string;
  country_name?: string;
};

function getClientIp(request: NextRequest): string {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  const xRealIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  const candidate =
    cfConnectingIp ||
    xRealIp ||
    xForwardedFor?.split(",")[0]?.trim() ||
    "";

  return candidate;
}

function isPublicIp(ip: string): boolean {
  if (!ip) return false;

  // Basic private/local IPv4 checks.
  if (ip.startsWith("10.") || ip.startsWith("127.") || ip.startsWith("192.168.")) return false;
  if (ip.startsWith("172.")) {
    const secondOctet = Number(ip.split(".")[1]);
    if (secondOctet >= 16 && secondOctet <= 31) return false;
  }

  // Local/unspecified IPv6 checks.
  if (ip === "::1" || ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80")) return false;

  return true;
}

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    if (!isPublicIp(ip)) {
      return NextResponse.json({ city: null, region: null, country: null, source: "none" });
    }

    const response = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ city: null, region: null, country: null, source: "none" });
    }

    const data = (await response.json()) as IpApiResponse;

    return NextResponse.json({
      city: data.city || null,
      region: data.region || null,
      country: data.country_name || null,
      source: "ip",
    });
  } catch {
    return NextResponse.json({ city: null, region: null, country: null, source: "none" });
  }
}
