import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile('wordpress/groomerhouse-checkout/groomerhouse-checkout.php', 'utf8');
const script = source.match(/<script id="gh-checkout-layout">([\s\S]*?)<\/script>/)[1];
let checks = 0;
function fixture({embedded = true, contentPresent = true, initialHeight = 800, readyState = 'complete'} = {}) {
  let height = initialHeight;
  let observed;
  const callbacks = new Map();
  const frames = [];
  const messages = [];
  const content = {getBoundingClientRect:() => ({height}), addEventListener(){}};
  const parent = {postMessage:(data, origin) => messages.push({data, origin})};
  const window = {parent, addEventListener(){}};
  if (!embedded) window.parent = window;
  const document = {readyState, querySelector:() => contentPresent ? content : null, addEventListener:(event, fn) => callbacks.set(event, fn)};
  vm.runInNewContext(script, {window, document, requestAnimationFrame:fn => frames.push(fn), ResizeObserver:class {constructor(fn){observed = fn;} observe(){}}});
  return {messages, callbacks, setHeight:value => {height=value;observed?.();}, flush:() => {while(frames.length) frames.shift()();}};
}
const test = fixture();
test.flush();
assert.equal(test.messages[0].data.height, 832); checks++;
assert.equal(test.messages[0].data.type, 'groomerhouse:booking-height'); checks++;
assert.equal(test.messages[0].origin, 'https://groomerhouse.pl'); checks++;
test.setHeight(800); test.flush();
assert.equal(test.messages.length, 1); checks++;
test.setHeight(2500); test.flush();
assert.equal(test.messages.at(-1).data.height, 2532); checks++;
test.setHeight(650.2); test.flush();
assert.equal(test.messages.at(-1).data.height, 683); checks++;
for (const value of [NaN, Infinity, -100, 4000]) {
  const count = test.messages.length;
  test.setHeight(value); test.flush();
  assert.equal(test.messages.length, count); checks++;
}
for (const options of [{embedded:false}, {contentPresent:false}]) {
  const other = fixture(options); other.flush();
  assert.equal(other.messages.length, 0); checks++;
}
const loading = fixture({readyState:'loading'});
assert.equal(loading.messages.length, 0); checks++;
loading.callbacks.get('DOMContentLoaded')(); loading.flush();
assert.equal(loading.messages.length, 1); checks++;
assert.ok(source.includes('#wpadminbar') && source.includes('display:none!important')); checks++;
assert.ok(source.includes('if (!gh_is_course_checkout()) return;')); checks++;
console.log(JSON.stringify({checks, status:'passed', scope:'Checkout height messages, deduplication, responsive resize and lifecycle; no CMS writes or orders'}));
