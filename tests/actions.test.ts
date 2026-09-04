import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }) }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("next/navigation", () => ({ redirect: (to: string) => { throw new Error(`REDIRECT:${to}`); } }));

import { formToObject } from "@/lib/actions/define";

describe("formToObject", () => {
  it("collects repeated keys into arrays", () => {
    const fd = new FormData();
    fd.append("title", "A");
    fd.append("focus[]", "One");
    fd.append("focus[]", "Two");
    fd.append("times", "Mornings");
    fd.append("times", "Evenings");
    expect(formToObject(fd)).toEqual({ title: "A", focus: ["One", "Two"], times: ["Mornings", "Evenings"] });
  });
});
