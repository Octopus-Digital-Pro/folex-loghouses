import config from ".astro/config.generated.json" with {type: "json"};
import type {APIRoute} from "astro";
import {sanity} from "@/lib/sanityClient";

const {enable, disallow} = config.seo.robotsTxt;

type RobotsTxtCms = {
  disallowAll?: boolean;
  sitemaps?: string[] | null;
  disallow?: string[] | null;
} | null;

function buildRobotsTxt(options: {
  disallowAll: boolean;
  disallowPaths: string[];
  sitemapUrls: string[];
}): string {
  const {disallowAll, disallowPaths, sitemapUrls} = options;
  const lines = [
    "# Robots.txt file for controlling web crawler access",
    "",
    "User-agent: *",
    "",
  ];
  if (disallowAll) {
    lines.push("# Disallow all", "Disallow: /", "");
  } else {
    lines.push("# Allowed pages", "Allow: /", "");
    if (disallowPaths.length > 0) {
      lines.push(
        "# Disallowed pages",
        ...disallowPaths.map((p) => `Disallow: ${p}`),
        ""
      );
    }
  }
  if (sitemapUrls.length > 0) {
    lines.push(
      "# Sitemap location",
      ...sitemapUrls.map((url) => `Sitemap: ${url}`)
    );
  }
  return lines.join("\n");
}

export const GET: APIRoute = async ({site}) => {
  const defaultSitemapURL = site ? new URL("sitemap-index.xml", site).href : "";

  let cms: RobotsTxtCms = null;
  try {
    cms = await sanity.fetch<RobotsTxtCms>(
      `*[_id == "robotsTxt"][0]{ disallowAll, sitemaps, disallow }`
    );
  } catch {
    // Fall back to config if CMS fetch fails
  }

  if (cms != null) {
    const disallowAll = cms.disallowAll === true;
    const sitemapUrls = Array.isArray(cms.sitemaps)
      ? cms.sitemaps.filter(
          (u): u is string => typeof u === "string" && u.length > 0
        )
      : defaultSitemapURL
        ? [defaultSitemapURL]
        : [];
    const disallowPaths = disallowAll
      ? []
      : Array.isArray(cms.disallow)
        ? cms.disallow.filter(
            (p): p is string => typeof p === "string" && p.length > 0
          )
        : disallow;
    const body = buildRobotsTxt({
      disallowAll,
      disallowPaths,
      sitemapUrls,
    });
    return new Response(body, {
      headers: {"Content-Type": "text/plain; charset=utf-8"},
    });
  }

  // Fallback: config-based robots.txt (respect enable flag)
  if (!enable) {
    return new Response(null, {status: 404});
  }
  const sitemapUrls = defaultSitemapURL ? [defaultSitemapURL] : [];
  const body = buildRobotsTxt({
    disallowAll: false,
    disallowPaths: disallow.map((item: string) => item),
    sitemapUrls,
  });
  return new Response(body, {
    headers: {"Content-Type": "text/plain; charset=utf-8"},
  });
};
