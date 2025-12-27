import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseXmlGateway } from "../src/parsers/xmlParser.js";

const readSample = (name: string) =>
  readFileSync(new URL(`../src/parsers/sample/${name}`, import.meta.url)).toString();

describe("parseXmlGateway", () => {
  it("parses a shift report", () => {
    const xml = readSample("shift-report-sample.xml");
    const parsed = parseXmlGateway(xml);
    expect(parsed).not.toBeNull();
    expect(parsed?.totalSales).toBeGreaterThan(0);
    expect(parsed?.fuelSales).toBeGreaterThan(0);
  });

  it("parses a store summary", () => {
    const xml = readSample("store-summary-sample.xml");
    const parsed = parseXmlGateway(xml);
    expect(parsed).not.toBeNull();
    expect(parsed?.voidCount).toBeGreaterThan(0);
  });
});
