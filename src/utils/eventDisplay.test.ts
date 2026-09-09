import { formatPrice } from "./eventDisplay";

describe("formatPrice", () => {
  test("formats whole pesos and hides null", () => {
    expect(formatPrice(null)).toBeNull();
    expect(formatPrice(15000)).toMatch(/15/);
    expect(formatPrice(15000)).not.toMatch(/Gratis/i);
  });
});
