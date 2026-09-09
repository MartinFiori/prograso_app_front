import { validateCategoryImageFile } from "./categoryImage";

describe("validateCategoryImageFile", () => {
  test("accepts a jpeg under 5 MiB", () => {
    const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], "ok.jpg", {
      type: "image/jpeg",
    });

    expect(validateCategoryImageFile(file)).toBeNull();
  });

  test("rejects an empty file", () => {
    const file = new File([], "empty.jpg", { type: "image/jpeg" });

    expect(validateCategoryImageFile(file)).toBe("La imagen está vacía.");
  });

  test("rejects a disallowed MIME type", () => {
    const file = new File([new Uint8Array([1, 2, 3])], "x.bmp", {
      type: "image/bmp",
    });

    expect(validateCategoryImageFile(file)).toBe(
      "Formato no permitido. Usá JPEG, PNG, WebP o GIF.",
    );
  });
});
