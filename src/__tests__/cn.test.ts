import { cn } from "../utils/cn";

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("p-2", "m-4")).toBe("p-2 m-4");
  });

  it("drops falsy values", () => {
    expect(cn("text-sm", false && "hidden", undefined, "font-bold")).toBe(
      "text-sm font-bold",
    );
  });

  it("merges conflicting Tailwind utilities", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
