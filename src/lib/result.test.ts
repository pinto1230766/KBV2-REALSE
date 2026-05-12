import { describe, it, expect } from "vitest";
import { ok, err, tryAsync, trySync } from "./result";

describe("Result helpers", () => {
  it("ok crée un Result succès", () => {
    const r = ok(42);
    expect(r).toEqual({ ok: true, value: 42 });
  });

  it("err crée un Result d'échec", () => {
    const e = new Error("boom");
    const r = err(e);
    expect(r).toEqual({ ok: false, error: e });
  });

  it("trySync capture les erreurs synchrones", () => {
    const r = trySync(() => {
      throw new Error("sync fail");
    });
    expect(r.ok).toBe(false);
    expect((r as { ok: false; error: Error }).error.message).toBe("sync fail");
  });

  it("trySync renvoie la valeur en cas de succès", () => {
    const r = trySync(() => "hello");
    expect(r).toEqual({ ok: true, value: "hello" });
  });

  it("tryAsync capture les erreurs async (string → Error)", async () => {
    const r = await tryAsync(async () => {
      throw "string error";
    });
    expect(r.ok).toBe(false);
    expect((r as { ok: false; error: Error }).error).toBeInstanceOf(Error);
  });

  it("tryAsync renvoie la valeur en cas de succès", async () => {
    const r = await tryAsync(async () => 99);
    expect(r).toEqual({ ok: true, value: 99 });
  });
});
