import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Resolves the active tenant for white-label routing and passes it to the app
// via the `x-tenant-slug` request header. Resolution priority:
//   1. subdomain  <slug>.<PLATFORM_ROOT_DOMAIN>   (production white-label)
//   2. path        /t/<slug>/...                  (rewritten away; sets a cookie)
//   3. cookie      vb_tenant                       (sticky after a /t/ visit)
//   4. default     "vaultbets"
export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const host = (request.headers.get("host") || "").split(":")[0];
  const root = process.env.PLATFORM_ROOT_DOMAIN;

  let slug: string | undefined;
  let stripPath: string | null = null;

  // 1) subdomain (only when a real root domain is configured)
  if (root && host.endsWith(`.${root}`)) {
    const label = host.slice(0, -(root.length + 1));
    if (label && !["www", "app", "admin", "platform"].includes(label)) slug = label;
  }

  // 2) /t/<slug>/...  → remember + rewrite to the bare path
  const m = url.pathname.match(/^\/t\/([^/]+)(\/.*)?$/);
  if (!slug && m) {
    slug = m[1];
    stripPath = m[2] || "/";
  }

  // 3) sticky cookie, 4) default
  if (!slug) slug = request.cookies.get("vb_tenant")?.value || "vaultbets";

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-slug", slug);

  const response =
    stripPath !== null
      ? NextResponse.rewrite(new URL(stripPath + url.search, request.url), {
          request: { headers: requestHeaders },
        })
      : NextResponse.next({ request: { headers: requestHeaders } });

  response.cookies.set("vb_tenant", slug, { path: "/", sameSite: "lax" });
  return response;
}

export const config = {
  // Run on pages only — skip API, Next internals and static files.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
