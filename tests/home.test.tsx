import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import nextConfig from "@/next.config";

describe("home page", () => {
  it("renders the register with the seed record, the lifecycle lists and the local-only notice", () => {
    const html = renderToString(<Home />);
    expect(html).toContain("All records");
    expect(html).toContain("search_docs");
    expect(html).toContain('data-tone="green">Active');
    expect(html).toContain("Records are saved in this browser only");
    expect(html).toContain('href="https://bookchaowalit.com/"');
    expect(html.match(/<h1/g)).toHaveLength(1);
  });
});

describe("site config", () => {
  it("redirects /more-projects to the hub and publishes sitemap and robots on its own domain", async () => {
    expect(await nextConfig.redirects!()).toContainEqual({ source: "/more-projects", destination: "https://bookchaowalit.com/", permanent: true });
    expect(sitemap()[0].url).toBe("https://mcpdocs.bookchaowalit.com/");
    expect(robots().sitemap).toBe("https://mcpdocs.bookchaowalit.com/sitemap.xml");
  });
});
