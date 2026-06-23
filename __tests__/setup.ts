// Fix for Node 25: its built-in localStorage stub (a plain {}) overrides jsdom's.
// Re-install jsdom's proper Storage instance as the global.
import { JSDOM } from "jsdom";

const dom = new JSDOM("", { url: "http://localhost" });
const jsdomStorage = dom.window.localStorage;

Object.defineProperty(globalThis, "localStorage", {
  value: jsdomStorage,
  writable: true,
  configurable: true,
});
