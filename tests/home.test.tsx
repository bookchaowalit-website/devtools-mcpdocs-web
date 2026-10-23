import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("home page", () => {
  it("renders the register with the seed record and the local-only notice", () => {
    const html = renderToString(<Home />);
    expect(html).toContain("Make the contract");
    expect(html).toContain("search_docs");
    expect(html).toContain("record-status active\">Active");
    expect(html).toContain("STATE STAYS IN THIS BROWSER");
    expect(html).toContain("NO HOSTED REGISTRY");
  });
});
