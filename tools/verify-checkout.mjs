import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

const source = await readFile('wordpress/booknetic-page.html', 'utf8');
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1];
let checks = 0;
for (const [state, blocked] of [
  [undefined, true],
  [{configured:false,mode:'sandbox'}, true],
  [{configured:true,mode:'sandbox'}, false],
  [{configured:true,mode:'production'}, false],
  [{configured:'true',mode:'production'}, true],
]) {
  const classes = new Set();
  const button = {dataset:{},textContent:'DALEJ',disabled:false,removeAttribute(){}};
  const notice = {hidden:true,textContent:''};
  const filters = new Map();
  const panel = {
    classList:{contains:v=>classes.has(v),toggle:(v,on)=>on?classes.add(v):classes.delete(v)},
    querySelector:s=>s.includes('booknetic_active_step')?{}:null,
    querySelectorAll:s=>s.includes('container_footer')?[button]:[],
    addEventListener(){},
  };
  const window = {groomerhouseCheckout:state,bookneticHooks:{addFilter:(name,fn)=>filters.set(name,fn)}};
  window.parent = window;
  const document = {readyState:'complete',querySelector:s=>s==='#gh-payment-notice'?notice:panel};
  vm.runInNewContext(script, {window,document,MutationObserver:class{observe(){}}});
  assert.equal(button.disabled, blocked); checks++;
  assert.equal(filters.get('step_validation_confirm_details')({status:true}).status, !blocked); checks++;
}
const parentSource = await readFile('src/pages/rezerwacja/index.astro', 'utf8');
const parentScript = parentSource.match(/<script>([\s\S]*?)<\/script>/)[1];
const parentJs = ts.transpileModule(parentScript, {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
for (const [url, origin, validSource, allowed] of [
  ['https://sandbox.przelewy24.pl/trnRequest/example','https://wp.groomerhouse.pl',true,true],
  ['https://secure.przelewy24.pl/trnRequest/example','https://wp.groomerhouse.pl',true,true],
  ['https://sandbox.przelewy24.pl/trnRequest/example','https://evil.example',true,false],
  ['https://sandbox.przelewy24.pl/trnRequest/example','https://wp.groomerhouse.pl',false,false],
  ['https://sandbox.przelewy24.pl.evil.example/pay','https://wp.groomerhouse.pl',true,false],
  ['http://sandbox.przelewy24.pl/pay','https://wp.groomerhouse.pl',true,false],
  ['https://user:pass@sandbox.przelewy24.pl/pay','https://wp.groomerhouse.pl',true,false],
  ['https://sandbox.przelewy24.pl:444/pay','https://wp.groomerhouse.pl',true,false],
]) {
  const frame = {src:'https://wp.groomerhouse.pl/index.php/rezerwacja/',contentWindow:{},style:{}};
  const handlers = new Map();
  const navigations = [];
  vm.runInNewContext(parentJs, {
    URL,
    document:{querySelector:s=>s==='#booknetic-booking-frame'?frame:null},
    window:{addEventListener:(name,handler)=>handlers.set(name,handler),location:{assign:u=>navigations.push(u)}},
  });
  handlers.get('message')({source:validSource?frame.contentWindow:{},origin,data:{type:'groomerhouse:payment-redirect',url}});
  assert.equal(navigations.length, allowed?1:0); checks++;
}
console.log(JSON.stringify({checks,status:'passed',scope:'Booknetic UI state and iframe payment redirect allowlist; no CMS writes or payments'}));
