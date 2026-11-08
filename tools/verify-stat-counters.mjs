import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";

const source = await readFile("src/scripts/stat-counters.ts", "utf8");
const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
let checks = 0;
const equal = (actual, expected, label) => { assert.deepEqual(actual, expected, label); checks++; };

function fixture({ reduced = false, observerAvailable = true, rafAvailable = true, targets = [10,100,10] } = {}) {
  const elements = targets.map(target => {
    const output = { textContent: String(target) };
    return { dataset: { countTarget: String(target) }, querySelector: () => output, output };
  });
  const frames = new Map();
  const observers = [];
  let frameId = 0;
  const motion = { matches: reduced, listener: null, addEventListener(_event, fn) { this.listener = fn; }, removeEventListener() { this.listener = null; } };
  class Observer {
    constructor(callback, options) { this.callback = callback; this.options = options; this.observed = new Set(); observers.push(this); }
    observe(element) { this.observed.add(element); }
    unobserve(element) { this.observed.delete(element); }
    disconnect() { this.observed.clear(); }
  }
  const exports = {};
  vm.runInNewContext(js, {
    exports,
    window: { matchMedia: () => motion },
    IntersectionObserver: observerAvailable ? Observer : undefined,
    requestAnimationFrame: rafAvailable ? fn => { frames.set(++frameId, fn); return frameId; } : undefined,
    cancelAnimationFrame: id => frames.delete(id),
  });
  const root = { querySelectorAll: () => elements };
  const cleanup = exports.initStatCounters(root);
  return {
    elements, frames, observers, motion, cleanup,
    values: () => elements.map(el => el.output.textContent),
    enter(indices, ratio = 0.5, isIntersecting = true) { observers[0].callback(indices.map(index => ({ target: elements[index], intersectionRatio: ratio, isIntersecting }))); },
    tick(time) { const active = [...frames.values()]; frames.clear(); active.forEach(fn => fn(time)); },
    reinit: () => exports.initStatCounters(root),
  };
}

const normal = fixture();
equal(normal.values(), ["0","0","0"], "Enhancement starts at zero");
equal(normal.frames.size, 0, "No animation work before visibility");
equal(normal.observers[0].options.threshold, 0.35, "Visibility threshold");
normal.enter([0,1], 0.1);
equal(normal.frames.size, 0, "Partial visibility below threshold does not start");
normal.enter([0,1], 0.8, false);
equal(normal.frames.size, 0, "Outside viewport does not start");
normal.enter([0,1]);
equal(normal.frames.size, 2, "Only visible counters start");
normal.enter([0,1]);
equal(normal.frames.size, 2, "Repeated intersection does not restart animation");
normal.tick(0);
equal(normal.values(), ["0","0","0"], "First animation frame is zero");
normal.tick(700);
equal(normal.values(), ["8","87","0"], "Visible figures grow; offscreen badge waits");
normal.tick(1400);
equal(normal.values(), ["10","100","0"], "Exact final values");
equal(normal.frames.size, 0, "No continuing animation loop");
normal.enter([0,1]);
equal(normal.frames.size, 0, "Finished counters do not replay on scroll");
normal.enter([2]); normal.tick(2000); normal.tick(3400);
equal(normal.values(), ["10","100","10"], "Badge has its own entry-triggered animation");
normal.reinit();
equal(normal.values(), ["10","100","10"], "Repeated initialization preserves completed figures");
for (const options of [{ reduced: true }, { observerAvailable: false }, { rafAvailable: false }]) {
  const test = fixture(options);
  equal(test.values(), ["10","100","10"], `Accessible/static fallback ${JSON.stringify(options)}`);
  equal(test.frames.size, 0, "Fallback has no animated frames");
  equal(test.observers.length, 0, "Fallback has no observer");
}
const changed = fixture(); changed.enter([0,1]); changed.tick(0); changed.tick(300);
changed.motion.matches = true; changed.motion.listener();
equal(changed.values(), ["10","100","10"], "Motion preference change immediately finishes all counters");
equal(changed.frames.size, 0, "Motion preference change cancels frames");
equal(changed.observers[0].observed.size, 0, "Motion preference change disconnects observer");
const cleaned = fixture(); cleaned.enter([0]); cleaned.tick(0); cleaned.cleanup();
equal(cleaned.values(), ["10","100","10"], "Cleanup leaves final values");
equal(cleaned.frames.size, 0, "Cleanup cancels animation");
equal(cleaned.motion.listener, null, "Cleanup removes motion listener");
const invalid = fixture({ targets: [0,-5,NaN,Infinity,1000001] });
equal(invalid.frames.size, 0, "Invalid targets never animate");
equal(invalid.observers.length, 0, "Invalid targets have no observer");
console.log(JSON.stringify({ checks, result: "PASS", scope: "Count-up visibility, timing, one-shot, reduced motion, fallbacks and cleanup" }));
