import { formatPrice } from "./eventDisplay";

describe("formatPrice", () => {
  test("formats whole pesos and does not invent Gratis", () => {
    expect(formatPrice(15000)).toMatch(/15/);
    expect(formatPrice(15000)).not.toMatch(/Gratis/i);
  });
});
