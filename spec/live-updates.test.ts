import { JSDOM, VirtualConsole } from "jsdom";
import { describe, expect, inject, it } from "vitest";

// The board's inline script (src/pages/index.astro) can't be exercised by
// the plain-fetch invariant/booking tests: those never run scripts, and a
// real EventSource's reconnect timing isn't something jsdom models anyway
// (see memory/MEMORY.md for the live-browser checks that found and verified
// the fix this test guards). What jsdom CAN do is run the actual shipped
// script with a fake EventSource standing in for the network, so a future
// edit that drops the reconnect-reload guard fails a test instead of only
// showing up on the next live check.
class FakeEventSource extends EventTarget {
  static instances: FakeEventSource[] = [];
  url: string;
  constructor(url: string) {
    super();
    this.url = url;
    FakeEventSource.instances.push(this);
  }
  close() {}
}

const baseUrl = inject("baseUrl");

describe("the board's live-update script", () => {
  it("reloads on a second SSE 'open' (a reconnect), not the first (the initial connect)", async () => {
    FakeEventSource.instances.length = 0;
    const html = await (await fetch(new URL("/", baseUrl))).text();

    // jsdom has no real navigation to observe reload() through, and its own
    // Location.reload isn't redefinable — but jsdom reports every call to an
    // unimplemented navigation API as a "jsdomError" on the virtual console,
    // which is enough to count how many times the script actually called it.
    let reloadCalls = 0;
    const virtualConsole = new VirtualConsole();
    virtualConsole.on("jsdomError", (error) => {
      if (String(error.message).includes("navigation")) reloadCalls++;
    });

    const dom = new JSDOM(html, {
      url: baseUrl,
      runScripts: "dangerously",
      pretendToBeVisual: true,
      virtualConsole,
      beforeParse(window) {
        (window as unknown as { EventSource: typeof FakeEventSource }).EventSource = FakeEventSource;
      },
    });
    void dom;

    expect(FakeEventSource.instances.length).toBe(1);
    const source = FakeEventSource.instances[0];

    source.dispatchEvent(new Event("open"));
    expect(reloadCalls, "the initial connect must not trigger a reload").toBe(0);

    source.dispatchEvent(new Event("open"));
    expect(reloadCalls, "a reconnect (a second 'open') must trigger a reload").toBe(1);

    source.dispatchEvent(new Event("open"));
    expect(reloadCalls, "every subsequent reconnect reloads too").toBe(2);
  });
});
