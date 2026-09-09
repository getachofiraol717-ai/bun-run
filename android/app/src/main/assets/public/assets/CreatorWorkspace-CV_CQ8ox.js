import{z as te,V as me,u as tr,W as rr,Y as ar,r as p,s as sr,q as A,a as t,x as dt,P as or,E as Te,_ as de,$ as ut,a0 as ft,S as z,a1 as ne,a2 as nr,a3 as ir,a4 as lr,X as ue,a5 as cr,a6 as pr,a7 as mr,a8 as dr,a9 as ur,M as fr,aa as br,ab as je,ac as hr,n as xr,ad as gr,ae as Nr}from"./index-CSNiubHa.js";import{F as vr}from"./index-DI6VHF58.js";import{u as bt,F as yr,a as Le,b as Oe,J as ht,E as kr,c as wr,d as jr}from"./ExecutionOrchestrator-1EhXMEr8.js";import{C as Cr}from"./CreatorLayout-C8pqP1wH.js";import"./react-Duueoazm.js";import"./sandboxRunner-8MuKRt--.js";import"./map-DodFDFSD.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Er=te("CircleDot",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["circle",{cx:"12",cy:"12",r:"1",key:"41hilf"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Dr=te("CloudOff",[["path",{d:"m2 2 20 20",key:"1ooewy"}],["path",{d:"M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-.193",key:"yfwify"}],["path",{d:"M21.532 16.5A4.5 4.5 0 0 0 17.5 10h-1.79A7.008 7.008 0 0 0 10 5.07",key:"jlfiyv"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Wr=te("GitCommitHorizontal",[["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}],["line",{x1:"3",x2:"9",y1:"12",y2:"12",key:"1dyftd"}],["line",{x1:"15",x2:"21",y1:"12",y2:"12",key:"oup4p8"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Vr=te("PanelLeftClose",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"M9 3v18",key:"fh3hqa"}],["path",{d:"m16 15-3-3 3-3",key:"14y99z"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Sr=te("PanelLeftOpen",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"M9 3v18",key:"fh3hqa"}],["path",{d:"m14 9 3 3-3 3",key:"8010ee"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $r=te("RotateCw",[["path",{d:"M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8",key:"1p45f6"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Rr=te("Tablet",[["rect",{width:"16",height:"20",x:"4",y:"2",rx:"2",ry:"2",key:"76otgf"}],["line",{x1:"12",x2:"12.01",y1:"18",y2:"18",key:"1dp563"}]]);var Nt={exports:{}};(function(u,y){(function(j,w){w()})(me,function(){function j(s,d){return typeof d>"u"?d={autoBom:!1}:typeof d!="object"&&(console.warn("Deprecated: Expected third argument to be a object"),d={autoBom:!d}),d.autoBom&&/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(s.type)?new Blob(["\uFEFF",s],{type:s.type}):s}function w(s,d,b){var f=new XMLHttpRequest;f.open("GET",s),f.responseType="blob",f.onload=function(){x(f.response,d,b)},f.onerror=function(){console.error("could not download file")},f.send()}function k(s){var d=new XMLHttpRequest;d.open("HEAD",s,!1);try{d.send()}catch{}return 200<=d.status&&299>=d.status}function i(s){try{s.dispatchEvent(new MouseEvent("click"))}catch{var d=document.createEvent("MouseEvents");d.initMouseEvent("click",!0,!0,window,0,0,0,80,20,!1,!1,!1,!1,0,null),s.dispatchEvent(d)}}var C=typeof window=="object"&&window.window===window?window:typeof self=="object"&&self.self===self?self:typeof me=="object"&&me.global===me?me:void 0,g=C.navigator&&/Macintosh/.test(navigator.userAgent)&&/AppleWebKit/.test(navigator.userAgent)&&!/Safari/.test(navigator.userAgent),x=C.saveAs||(typeof window!="object"||window!==C?function(){}:"download"in HTMLAnchorElement.prototype&&!g?function(s,d,b){var f=C.URL||C.webkitURL,D=document.createElement("a");d=d||s.name||"download",D.download=d,D.rel="noopener",typeof s=="string"?(D.href=s,D.origin===location.origin?i(D):k(D.href)?w(s,d,b):i(D,D.target="_blank")):(D.href=f.createObjectURL(s),setTimeout(function(){f.revokeObjectURL(D.href)},4e4),setTimeout(function(){i(D)},0))}:"msSaveOrOpenBlob"in navigator?function(s,d,b){if(d=d||s.name||"download",typeof s!="string")navigator.msSaveOrOpenBlob(j(s,b),d);else if(k(s))w(s,d,b);else{var f=document.createElement("a");f.href=s,f.target="_blank",setTimeout(function(){i(f)})}}:function(s,d,b,f){if(f=f||open("","_blank"),f&&(f.document.title=f.document.body.innerText="downloading..."),typeof s=="string")return w(s,d,b);var D=s.type==="application/octet-stream",P=/constructor/i.test(C.HTMLElement)||C.safari,M=/CriOS\/[\d]+/.test(navigator.userAgent);if((M||D&&P||g)&&typeof FileReader<"u"){var G=new FileReader;G.onloadend=function(){var _=G.result;_=M?_:_.replace(/^data:[^;]*;/,"data:attachment/file;"),f?f.location.href=_:location=_,f=null},G.readAsDataURL(s)}else{var S=C.URL||C.webkitURL,O=S.createObjectURL(s);f?f.location=O:location.href=O,f=null,setTimeout(function(){S.revokeObjectURL(O)},4e4)}});C.saveAs=x.saveAs=x,u.exports=x})})(Nt);var Ar=Nt.exports;function xt(u){const y=u.replace(/^\/+/,""),j=y.split("/").pop()||y;return[y,`./${y}`,`/${y}`,j,`./${j}`,`/${j}`]}function gt(u){return u.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function Pr(u){if(!u||u.length===0)return`<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: system-ui, -apple-system, sans-serif; background: #0b0f19; color: #94a3b8; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
      .box { padding: 2rem; border: 1px dashed rgba(148,163,184,0.3); border-radius: 12px; }
      h3 { color: #e2e8f0; margin: 0 0 0.5rem 0; font-size: 1.1rem; }
    </style>
  </head>
  <body>
    <div class="box">
      <h3>No Project Files Loaded</h3>
      <p>Add an <code>index.html</code>, JavaScript, or React file to start previewing.</p>
    </div>
  </body>
</html>`;const y=u.find(s=>/(^|\/)index\.html?$/i.test(s.path))||u.find(s=>/\.html?$/i.test(s.path)),j=u.filter(s=>/\.css$/i.test(s.path)),w=u.filter(s=>/\.(js|mjs)$/i.test(s.path)),k=u.filter(s=>/\.(tsx|jsx|ts)$/i.test(s.path)&&!/\.d\.ts$/i.test(s.path)),i=u.filter(s=>/\.py$/i.test(s.path)),C=u.filter(s=>/\.md$/i.test(s.path)),g=k.some(s=>/import.*react/i.test(s.content)||/createRoot/i.test(s.content)||/<[A-Z][A-Za-z0-9]*/.test(s.content)||/export\s+default\s+function/i.test(s.content))||u.some(s=>/package\.json/i.test(s.path)&&/"react"/i.test(s.content)),x=`
    <script>
      (function() {
        const sendMsg = (type, payload) => {
          try {
            window.parent.postMessage({ __ku_preview: true, type, ...payload }, '*');
          } catch(e) {}
        };

        const origLog = console.log, origWarn = console.warn, origErr = console.error, origInfo = console.info;
        console.log = (...args) => {
          origLog(...args);
          sendMsg('log', { level: 'log', text: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') });
        };
        console.warn = (...args) => {
          origWarn(...args);
          sendMsg('log', { level: 'warn', text: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') });
        };
        console.error = (...args) => {
          origErr(...args);
          sendMsg('log', { level: 'error', text: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') });
        };
        console.info = (...args) => {
          origInfo(...args);
          sendMsg('log', { level: 'info', text: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') });
        };

        window.onerror = function(msg, url, line, col, error) {
          sendMsg('error', { level: 'error', text: 'Runtime Error: ' + msg + (line ? ' (line ' + line + ')' : '') });
          return false;
        };

        window.addEventListener('unhandledrejection', function(event) {
          sendMsg('error', { level: 'error', text: 'Unhandled Promise: ' + (event.reason?.message || event.reason) });
        });
      })();
    <\/script>
  `;if(g&&k.length>0){const s=j.map(b=>`/* ${b.path} */
${b.content}`).join(`

`),d=JSON.stringify([...k,...w].map(b=>({path:b.path,content:b.content})));return`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React Live Preview</title>
  ${x}
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin><\/script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <style>
    ${s}
  </style>
</head>
<body>
  <div id="root"></div>
  <div id="app"></div>

  <script>
    (function() {
      window.__modules = {
        'react': window.React,
        'react/jsx-runtime': {
          jsx: (type, props) => window.React.createElement(type, props),
          jsxs: (type, props) => window.React.createElement(type, props),
          Fragment: window.React.Fragment
        },
        'react-dom': window.ReactDOM,
        'react-dom/client': {
          createRoot: function(container) {
            return {
              render: function(element) {
                if (window.ReactDOM.createRoot) {
                  const root = window.ReactDOM.createRoot(container);
                  root.render(element);
                } else if (window.ReactDOM.render) {
                  window.ReactDOM.render(element, container);
                }
              }
            };
          }
        }
      };

      const projectFiles = ${d};

      function resolveModule(reqPath, currentPath) {
        if (window.__modules[reqPath]) return window.__modules[reqPath];
        const cleanReq = reqPath.replace(/^(./|/)/, '').replace(/.(tsx|jsx|ts|js)$/, '');
        for (const k in window.__modules) {
          const cleanK = k.replace(/^(./|/)/, '').replace(/.(tsx|jsx|ts|js)$/, '');
          if (cleanK === cleanReq || cleanK.endsWith('/' + cleanReq)) {
            return window.__modules[k];
          }
        }
        return window.__modules[reqPath] || {};
      }

      function customRequire(reqPath, currentPath) {
        const mod = resolveModule(reqPath, currentPath);
        return mod;
      }

      try {
        // Transpile all project files with Babel in order
        projectFiles.forEach(file => {
          try {
            const transformed = Babel.transform(file.content, {
              presets: [
                ['env', { modules: 'commonjs' }],
                'react',
                'typescript'
              ],
              filename: file.path
            }).code;

            const mod = { exports: {} };
            const runFn = new Function('require', 'module', 'exports', 'React', 'ReactDOM', transformed);
            runFn(
              (req) => customRequire(req, file.path),
              mod,
              mod.exports,
              window.React,
              window.ReactDOM
            );
            window.__modules[file.path] = mod.exports.default || mod.exports;
            const baseName = file.path.split('/').pop() || file.path;
            window.__modules[baseName] = mod.exports.default || mod.exports;
            window.__modules['./' + baseName] = mod.exports.default || mod.exports;
          } catch(err) {
            console.error('Compilation Error in ' + file.path + ': ' + err.message);
          }
        });

        // If root has not been rendered yet, look for default App component
        const rootElem = document.getElementById('root') || document.getElementById('app');
        if (rootElem && (!rootElem.childNodes || rootElem.childNodes.length === 0)) {
          const AppComp = window.__modules['App.tsx'] || window.__modules['App.jsx'] || window.__modules['App'] || window.__modules['src/App.tsx'] || window.__modules['src/App'];
          if (AppComp) {
            const el = typeof AppComp === 'function' ? window.React.createElement(AppComp) : AppComp;
            if (window.ReactDOM.createRoot) {
              window.ReactDOM.createRoot(rootElem).render(el);
            } else if (window.ReactDOM.render) {
              window.ReactDOM.render(el, rootElem);
            }
          }
        }
      } catch(globalErr) {
        console.error('React Runtime Initialization Error: ' + globalErr.message);
        document.body.innerHTML += '<div style="color:#ef4444;background:#18181b;padding:1rem;font-family:monospace;margin:1rem;border-radius:8px;">' + globalErr.message + '</div>';
      }
    })();
  <\/script>
</body>
</html>`}if(y){let s=y.content;const d='<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">';return/<meta[^>]*name=["']viewport["']/i.test(s)||(/<head[^>]*>/i.test(s)?s=s.replace(/<head[^>]*>/i,`$&<meta charset="utf-8">
  ${d}`):s=`<head>${d}</head>`+s),/<head[^>]*>/i.test(s)?s=s.replace(/<head[^>]*>/i,`$&${x}`):s=x+s,j.forEach(b=>{const f=xt(b.path);let D=!1;for(const P of f){const M=new RegExp(`<link[^>]*href=["']${gt(P)}["'][^>]*>`,"gi");if(M.test(s)){s=s.replace(M,`<style data-file="${b.path}">${b.content}</style>`),D=!0;break}}if(!D&&!s.includes(b.content.slice(0,40))){const P=`<style data-file="${b.path}">${b.content}</style>`;/<\/head>/i.test(s)?s=s.replace(/<\/head>/i,`${P}</head>`):s=P+s}}),w.forEach(b=>{const f=xt(b.path);let D=!1;for(const P of f){const M=new RegExp(`<script[^>]*src=["']${gt(P)}["'][^>]*>\\s*<\\/script>`,"gi");if(M.test(s)){s=s.replace(M,`<script data-file="${b.path}">
try {
${b.content}
} catch(e) { console.error('Error in ${b.path}:', e); }
<\/script>`),D=!0;break}}if(!D){const P=`<script data-file="${b.path}">
try {
${b.content}
} catch(e) { console.error('Error in ${b.path}:', e); }
<\/script>`;/<\/body>/i.test(s)?s=s.replace(/<\/body>/i,`${P}</body>`):s+=P}}),s}if(i.length>0){const s=i.find(b=>/main\.py$/i.test(b.path))||i[0],d=s.content.replace(/`/g,"\\`").replace(/\\/g,"\\\\");return`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Python Console Runner</title>
  ${x}
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'JetBrains Mono', monospace, monospace; background:#0a0c14; color:#34d399; padding:1.5rem; height:100vh; display:flex; flex-direction:column; }
    .header { display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(52,211,153,0.2); padding-bottom:0.75rem; margin-bottom:1rem; }
    .title { color:#a78bfa; font-weight:bold; font-size:0.9rem; }
    .run-btn { background:#8b5cf6; color:#fff; border:none; padding:0.4rem 1rem; border-radius:6px; cursor:pointer; font-family:inherit; font-size:0.8rem; }
    .run-btn:hover { background:#7c3aed; }
    #out { flex:1; overflow:auto; white-space:pre-wrap; line-height:1.5; font-size:0.85rem; color:#e2e8f0; }
    .py-line { color:#94a3b8; }
    .success { color:#34d399; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">🐍 Python Runner &middot; ${s.path}</div>
    <button class="run-btn" id="run">Run Script ▶</button>
  </div>
  <div id="out">Loading interactive Python environment...</div>

  <script src="https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js"><\/script>
  <script>
    const out = document.getElementById('out');
    const runBtn = document.getElementById('run');
    const pyCode = \`${d}\`;
    let pyodideInstance = null;

    async function initPy() {
      try {
        pyodideInstance = await loadPyodide({
          stdout: (text) => {
            out.innerHTML += '<div>' + text + '</div>';
            console.log(text);
          },
          stderr: (text) => {
            out.innerHTML += '<div style="color:#ef4444;">' + text + '</div>';
            console.error(text);
          }
        });
        out.innerHTML = '<div class="success">✅ Python 3 environment initialized! Click "Run Script ▶" or inspect outputs below:</div>\\n';
        runScript();
      } catch(e) {
        out.innerHTML = '<div style="color:#ef4444;">Could not load full WebAssembly Pyodide. Simulation mode active:</div>\\n' +
          '<div style="color:#94a3b8;">' + pyCode + '</div>';
      }
    }

    async function runScript() {
      if (!pyodideInstance) return;
      out.innerHTML += '<div class="py-line">=== Running ' + '${s.path}' + ' ===</div>';
      try {
        await pyodideInstance.runPythonAsync(pyCode);
        out.innerHTML += '<div class="success">=== Finished (exit code 0) ===</div>\\n';
      } catch(err) {
        out.innerHTML += '<div style="color:#ef4444;">Error: ' + err.message + '</div>';
      }
    }

    runBtn.onclick = runScript;
    initPy();
  <\/script>
</body>
</html>`}if(w.length>0||k.length>0){const d=[...w,...k].map(f=>`// ${f.path}
${f.content}`).join(`

`),b=j.map(f=>`/* ${f.path} */
${f.content}`).join(`

`);return`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Live Code Preview</title>
  ${x}
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: system-ui, sans-serif; background:#0b0f19; color:#fff; min-height:100vh; padding:1.5rem; }
    #console-out { background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 1rem; font-family: monospace; font-size: 0.85rem; color: #34d399; margin-top: 1rem; white-space: pre-wrap; min-height: 120px; }
    ${b}
  </style>
</head>
<body>
  <div id="root"></div>
  <div id="app"></div>
  <div id="console-out"><div style="color:#94a3b8;">Console Outputs:</div></div>

  <script>
    const cons = document.getElementById('console-out');
    const addLog = (text, color) => {
      const line = document.createElement('div');
      line.style.color = color || '#34d399';
      line.textContent = '> ' + text;
      cons.appendChild(line);
    };

    try {
      ${d}
    } catch(err) {
      console.error(err);
      addLog('Error: ' + err.message, '#ef4444');
    }
  <\/script>
</body>
</html>`}if(C.length>0){const s=C[0];return`<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${s.path}</title>
  ${x}
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f19; color: #e2e8f0; padding: 2rem; line-height: 1.6; max-width: 800px; margin: auto; }
    h1, h2, h3 { color: #a78bfa; margin-top: 1.5rem; }
    pre { background: #1e1e2e; padding: 1rem; border-radius: 8px; overflow: auto; border: 1px solid rgba(255,255,255,0.1); }
    code { font-family: monospace; color: #38bdf8; }
  </style>
</head>
<body>
  <pre>${s.content.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</pre>
</body>
</html>`}return'<!doctype html><html><body style="font-family:sans-serif;color:#888;padding:2rem;">No preview available for these files.</body></html>'}const F=sr,Mr={js:"javascript",mjs:"javascript",cjs:"javascript",ts:"typescript",tsx:"typescript",jsx:"javascript",html:"html",htm:"html",css:"css",scss:"scss",json:"json",md:"markdown",py:"python",sql:"sql",java:"java",cpp:"cpp",cc:"cpp",c:"c",h:"cpp",go:"go",rs:"rust",sh:"shell",yml:"yaml",yaml:"yaml",txt:"plaintext"},q=u=>{var y;return Mr[((y=u.split(".").pop())==null?void 0:y.toLowerCase())??""]??"plaintext"},K={blank:[{path:"README.md",content:`# New Project

Built in Knowledge Universe.
`,language:"markdown"}],web:[{path:"index.html",content:`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>My KU App</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="hero">
    <h1>Hello, Universe 🌌</h1>
    <p>Edit the files on the left and hit ▶ Run.</p>
    <button id="b">Click me</button>
    <p id="msg"></p>
  </div>
  <script src="app.js"><\/script>
</body>
</html>
`,language:"html"},{path:"style.css",content:`* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: system-ui, sans-serif; background:#0a0a1a; color:#fff; min-height:100vh; display:flex; align-items:center; justify-content:center; }
.hero { text-align:center; padding:3rem; background:rgba(255,255,255,0.05); border:1px solid rgba(124,58,237,0.3); border-radius:1rem; backdrop-filter:blur(20px); }
h1 { font-size:2.5rem; color:#a78bfa; margin-bottom:.5rem; }
p { color:#94a3b8; margin:.5rem 0; }
button { background:linear-gradient(135deg,#7c3aed,#6366f1); color:#fff; border:0; padding:.7rem 1.5rem; border-radius:.5rem; cursor:pointer; font-size:1rem; margin-top:1rem; transition:transform .15s; }
button:hover { transform:scale(1.05); }
#msg { font-size:1.1rem; color:#a78bfa; min-height:1.5rem; margin-top:1rem; }
`,language:"css"},{path:"app.js",content:`const msgs = [
  'Hello from your KU project! 👋',
  'Building something amazing! 🚀',
  'The universe is yours! 🌌',
];
let i = 0;
document.getElementById('b').addEventListener('click', () => {
  document.getElementById('msg').textContent = msgs[i++ % msgs.length];
});
console.log('KU App loaded!');
`,language:"javascript"},{path:"README.md",content:`# My Web App

Built on Knowledge Universe Creator.

## Run
Open \`index.html\` or use Live Preview.
`,language:"markdown"}],react:[{path:"src/main.tsx",content:`import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './App.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
)
`,language:"typescript"},{path:"src/App.tsx",content:`import { useState } from 'react'
import './App.css'

export default function App() {
  const [count, setCount] = useState(0)
  return (
    <div className="app">
      <h1>🌌 Knowledge Universe</h1>
      <p className="sub">React + Vite + TypeScript</p>
      <div className="card">
        <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
        <p>Edit <code>src/App.tsx</code> to start building!</p>
      </div>
    </div>
  )
}
`,language:"typescript"},{path:"src/App.css",content:`.app { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; background:linear-gradient(135deg,#0a0612,#1a0a2e); color:#e2e8f0; font-family:'Segoe UI',sans-serif; }
h1 { font-size:2.5rem; color:#a78bfa; }
.sub { color:#94a3b8; margin:.5rem 0 1.5rem; }
.card { background:rgba(255,255,255,0.06); border:1px solid rgba(139,92,246,0.3); padding:2rem; border-radius:1rem; text-align:center; }
button { background:linear-gradient(135deg,#8b5cf6,#6366f1); color:#fff; border:none; padding:.6rem 1.5rem; border-radius:.5rem; font-size:1rem; cursor:pointer; transition:transform .2s; }
button:hover { transform:scale(1.05); }
code { color:#a78bfa; background:rgba(139,92,246,.15); padding:.1rem .4rem; border-radius:.25rem; }
`,language:"css"},{path:"index.html",content:`<!doctype html>
<html lang="en">
  <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>KU React App</title></head>
  <body><div id="root"></div><script type="module" src="/src/main.tsx"><\/script></body>
</html>
`,language:"html"},{path:"package.json",content:`{
  "name": "ku-react-app",
  "version": "0.0.1",
  "scripts": { "dev": "vite", "build": "tsc && vite build", "preview": "vite preview" },
  "dependencies": { "react": "^18.3.1", "react-dom": "^18.3.1" },
  "devDependencies": { "@types/react": "^18.3.1", "@types/react-dom": "^18.3.1", "@vitejs/plugin-react": "^4.3.1", "typescript": "^5.5.3", "vite": "^5.4.1" }
}
`,language:"json"},{path:"vite.config.ts",content:`import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins: [react()] })
`,language:"typescript"},{path:"README.md",content:"# KU React App\n\n```bash\nnpm install\nnpm run dev\n```\n",language:"markdown"}],typescript:[{path:"src/index.ts",content:`// TypeScript starter — Knowledge Universe

interface Student {
  name: string;
  grade: number;
  xp: number;
  subjects: string[];
}

function enroll(s: Student, subject: string): Student {
  if (s.subjects.includes(subject)) return s;
  console.log(\`✅ \${s.name} enrolled in \${subject}! XP: \${s.xp + 10}\`);
  return { ...s, xp: s.xp + 10, subjects: [...s.subjects, subject] };
}

function study(s: Student, subject: string, hours: number): Student {
  const earned = Math.floor(hours * 25);
  console.log(\`📚 \${subject} · \${hours}h → +\${earned} XP (Total: \${s.xp + earned})\`);
  return { ...s, xp: s.xp + earned };
}

let abebe: Student = { name: 'Abebe', grade: 10, xp: 0, subjects: [] };
abebe = enroll(abebe, 'Mathematics');
abebe = enroll(abebe, 'TypeScript');
abebe = study(abebe, 'TypeScript', 2.5);
console.log('🌟 Final:', JSON.stringify(abebe, null, 2));
`,language:"typescript"},{path:"tsconfig.json",content:`{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
`,language:"json"}],python:[{path:"main.py",content:`# Python starter — Knowledge Universe

class Student:
    def __init__(self, name: str, grade: int):
        self.name = name
        self.grade = grade
        self.xp = 0
        self.subjects: list[str] = []

    def enroll(self, subject: str) -> None:
        if subject not in self.subjects:
            self.subjects.append(subject)
            self.xp += 10
            print(f"OK {self.name} enrolled in {subject}! XP: {self.xp}")

    def study(self, subject: str, hours: float) -> int:
        earned = int(hours * 25)
        self.xp += earned
        print(f"Study {subject} x{hours}h -> +{earned} XP (Total: {self.xp})")
        return earned

    def __repr__(self) -> str:
        return f"Student({self.name!r}, grade={self.grade}, xp={self.xp})"


if __name__ == "__main__":
    s = Student("Abebe", 10)
    for sub in ["Mathematics", "Physics", "Python"]:
        s.enroll(sub)
    s.study("Python", 2.5)
    s.study("Mathematics", 1.5)
    print("Result:", s)
`,language:"python"},{path:"requirements.txt",content:`# Add dependencies here
# numpy
# pandas
`,language:"plaintext"},{path:"README.md",content:"# Python Project\n\n```bash\npython main.py\n```\n",language:"markdown"}],js:[{path:"main.js",content:`// JavaScript playground
console.log("Hello from KU");
`,language:"javascript"}],sql:[{path:"schema.sql",content:`-- Knowledge Universe — SQL Starter

CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    grade INTEGER NOT NULL,
    xp INTEGER DEFAULT 0
);

CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    subject TEXT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO students (name, grade, xp) VALUES
  ('Abebe', 10, 0),
  ('Chaltu', 9, 25);

INSERT INTO enrollments (student_id, subject) VALUES
  (1, 'Mathematics'),
  (1, 'Physics'),
  (2, 'Biology');
`,language:"sql"},{path:"queries.sql",content:`-- Example queries

-- Top students by XP
SELECT name, grade, xp
FROM students
ORDER BY xp DESC;

-- Subjects per student
SELECT s.name, e.subject, e.enrolled_at
FROM students s
JOIN enrollments e ON e.student_id = s.id
ORDER BY s.name;

-- Count enrollments per subject
SELECT subject, COUNT(*) AS total
FROM enrollments
GROUP BY subject
ORDER BY total DESC;
`,language:"sql"},{path:"README.md",content:`# SQL Project

Schema + example queries for a student database. Use the AI assistant to explain or extend these queries.
`,language:"markdown"}],java:[{path:"Main.java",content:`// Knowledge Universe — Java Starter

import java.util.*;

public class Main {
    static class Student {
        String name;
        int grade;
        int xp = 0;
        List<String> subjects = new ArrayList<>();

        Student(String name, int grade) {
            this.name = name;
            this.grade = grade;
        }

        void enroll(String subject) {
            if (!subjects.contains(subject)) {
                subjects.add(subject);
                xp += 10;
                System.out.println("Enrolled " + name + " in " + subject + "! XP: " + xp);
            }
        }

        void study(String subject, double hours) {
            int earned = (int) (hours * 25);
            xp += earned;
            System.out.println("Studied " + subject + " for " + hours + "h -> +" + earned + " XP (Total: " + xp + ")");
        }

        public String toString() {
            return "Student{name='" + name + "', grade=" + grade + ", xp=" + xp + "}";
        }
    }

    public static void main(String[] args) {
        Student abebe = new Student("Abebe", 10);
        abebe.enroll("Mathematics");
        abebe.enroll("Physics");
        abebe.enroll("Java");
        abebe.study("Java", 2.5);
        abebe.study("Mathematics", 1.5);
        System.out.println(abebe);
    }
}
`,language:"java"},{path:"README.md",content:"# Java Project\n\n```bash\njavac Main.java\njava Main\n```\n",language:"markdown"}],cpp:[{path:"main.cpp",content:`// Knowledge Universe — C++ Starter
#include <iostream>
#include <string>
#include <vector>

class Student {
public:
    std::string name;
    int grade;
    int xp = 0;
    std::vector<std::string> subjects;

    Student(std::string n, int g) : name(n), grade(g) {}

    void enroll(const std::string& subject) {
        for (auto& s : subjects) if (s == subject) return;
        subjects.push_back(subject);
        xp += 10;
        std::cout << "Enrolled " << name << " in " << subject << "! XP: " << xp << "\\n";
    }

    void study(const std::string& subject, double hours) {
        int earned = static_cast<int>(hours * 25);
        xp += earned;
        std::cout << "Studied " << subject << " for " << hours << "h -> +" << earned << " XP (Total: " << xp << ")\\n";
    }
};

int main() {
    Student abebe("Abebe", 10);
    abebe.enroll("Mathematics");
    abebe.enroll("Physics");
    abebe.enroll("C++");
    abebe.study("C++", 2.5);
    abebe.study("Mathematics", 1.5);
    std::cout << "Final XP: " << abebe.xp << "\\n";
    return 0;
}
`,language:"cpp"},{path:"README.md",content:"# C++ Project\n\n```bash\ng++ -std=c++17 main.cpp -o main\n./main\n```\n",language:"markdown"}],go:[{path:"main.go",content:`// Knowledge Universe — Go Starter
package main

import "fmt"

type Student struct {
	Name     string
	Grade    int
	XP       int
	Subjects []string
}

func (s *Student) Enroll(subject string) {
	for _, sub := range s.Subjects {
		if sub == subject {
			return
		}
	}
	s.Subjects = append(s.Subjects, subject)
	s.XP += 10
	fmt.Printf("Enrolled %s in %s! XP: %d\\n", s.Name, subject, s.XP)
}

func (s *Student) Study(subject string, hours float64) {
	earned := int(hours * 25)
	s.XP += earned
	fmt.Printf("Studied %s for %.1fh -> +%d XP (Total: %d)\\n", subject, hours, earned, s.XP)
}

func main() {
	abebe := &Student{Name: "Abebe", Grade: 10}
	abebe.Enroll("Mathematics")
	abebe.Enroll("Physics")
	abebe.Enroll("Go")
	abebe.Study("Go", 2.5)
	abebe.Study("Mathematics", 1.5)
	fmt.Printf("Final: %+v\\n", abebe)
}
`,language:"go"},{path:"go.mod",content:`module ku-project

go 1.22
`,language:"plaintext"},{path:"README.md",content:"# Go Project\n\n```bash\ngo run main.go\n```\n",language:"markdown"}],rust:[{path:"src/main.rs",content:`// Knowledge Universe — Rust Starter

#[derive(Debug)]
struct Student {
    name: String,
    grade: u8,
    xp: u32,
    subjects: Vec<String>,
}

impl Student {
    fn new(name: &str, grade: u8) -> Self {
        Student { name: name.to_string(), grade, xp: 0, subjects: Vec::new() }
    }

    fn enroll(&mut self, subject: &str) {
        if !self.subjects.iter().any(|s| s == subject) {
            self.subjects.push(subject.to_string());
            self.xp += 10;
            println!("Enrolled {} in {}! XP: {}", self.name, subject, self.xp);
        }
    }

    fn study(&mut self, subject: &str, hours: f64) {
        let earned = (hours * 25.0) as u32;
        self.xp += earned;
        println!("Studied {} for {}h -> +{} XP (Total: {})", subject, hours, earned, self.xp);
    }
}

fn main() {
    let mut abebe = Student::new("Abebe", 10);
    abebe.enroll("Mathematics");
    abebe.enroll("Physics");
    abebe.enroll("Rust");
    abebe.study("Rust", 2.5);
    abebe.study("Mathematics", 1.5);
    println!("Final: {:?}", abebe);
}
`,language:"rust"},{path:"Cargo.toml",content:`[package]
name = "ku-project"
version = "0.1.0"
edition = "2021"

[dependencies]
`,language:"plaintext"},{path:"README.md",content:"# Rust Project\n\n```bash\ncargo run\n```\n",language:"markdown"}]};function _r(u){const y=[];u.forEach(w=>{const k=w.path.split("/").filter(Boolean);let i=y;k.forEach((C,g)=>{const x=g===k.length-1,s=k.slice(0,g+1).join("/");let d=i.find(b=>b.name===C);d||(d={name:C,fullPath:s,isFolder:!x,children:[],file:x?w:void 0},i.push(d)),x||(i=d.children)})});const j=w=>{w.sort((k,i)=>k.isFolder&&!i.isFolder?-1:!k.isFolder&&i.isFolder?1:k.name.localeCompare(i.name)),w.forEach(k=>{k.isFolder&&j(k.children)})};return j(y),y}function Tr(u){var j;const y=((j=u.split(".").pop())==null?void 0:j.toLowerCase())||"";return["ts","tsx","js","jsx"].includes(y)?t.jsxDEV(Le,{className:"h-3.5 w-3.5 text-cyan-400 shrink-0"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:493,columnNumber:12},this):["json","yaml","yml"].includes(y)?t.jsxDEV(jr,{className:"h-3.5 w-3.5 text-amber-400 shrink-0"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:496,columnNumber:12},this):["md","txt","pdf"].includes(y)?t.jsxDEV(Nr,{className:"h-3.5 w-3.5 text-emerald-400 shrink-0"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:499,columnNumber:12},this):t.jsxDEV(Le,{className:"h-3.5 w-3.5 text-indigo-400 shrink-0"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:501,columnNumber:10},this)}function vt({node:u,depth:y=0,activePath:j,openFile:w,deleteFile:k}){const[i,C]=p.useState(!0);if(u.isFolder)return t.jsxDEV("div",{children:[t.jsxDEV("div",{className:"flex items-center gap-1.5 px-2 py-1 text-xs cursor-pointer hover:bg-muted/50 rounded text-foreground/80 font-medium select-none",style:{paddingLeft:`${y*12+6}px`},onClick:()=>C(!i),children:[i?t.jsxDEV(hr,{className:"h-3 w-3 text-muted-foreground shrink-0"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:528,columnNumber:13},this):t.jsxDEV(xr,{className:"h-3 w-3 text-muted-foreground shrink-0"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:530,columnNumber:13},this),i?t.jsxDEV(wr,{className:"h-3.5 w-3.5 text-amber-400 shrink-0"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:533,columnNumber:13},this):t.jsxDEV(Oe,{className:"h-3.5 w-3.5 text-amber-400/80 shrink-0"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:535,columnNumber:13},this),t.jsxDEV("span",{className:"truncate flex-1 font-mono",children:u.name},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:537,columnNumber:11},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:522,columnNumber:9},this),i&&t.jsxDEV("div",{children:u.children.map(x=>t.jsxDEV(vt,{node:x,depth:y+1,activePath:j,openFile:w,deleteFile:k},x.fullPath,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:542,columnNumber:15},this))},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:540,columnNumber:11},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:521,columnNumber:7},this);const g=j===u.fullPath;return t.jsxDEV("div",{className:`group flex items-center gap-1.5 px-2 py-1 text-xs cursor-pointer rounded transition-colors select-none ${g?"bg-primary/20 text-primary font-medium":"text-muted-foreground hover:text-foreground hover:bg-muted/40"}`,style:{paddingLeft:`${y*12+18}px`},onClick:()=>w(u.fullPath),children:[Tr(u.name),t.jsxDEV("span",{className:"truncate flex-1 font-mono",children:u.name},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:570,columnNumber:7},this),t.jsxDEV("button",{onClick:x=>{x.stopPropagation(),k(u.fullPath)},className:"opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity p-0.5",title:"Remove file",children:t.jsxDEV(gr,{className:"h-3 w-3"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:579,columnNumber:9},this)},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:571,columnNumber:7},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:560,columnNumber:5},this)}function Kr(){const{user:u}=tr(),{projectId:y}=rr(),j=ar(),[w,k]=p.useState([]),[i,C]=p.useState(null),[g,x]=p.useState([]),[s,d]=p.useState([]),[b,f]=p.useState(null),[D,P]=p.useState(!0),[M,G]=p.useState(!0),[S,O]=p.useState("responsive"),[_,yt]=p.useState("portrait"),[Lr,kt]=p.useState(!1),[$,T]=p.useState("editor"),[wt,Fe]=p.useState(!1),[Ie,Be]=p.useState([]),[jt,Ue]=p.useState(!1),[Ce,Ct]=p.useState("intermediate"),[H,fe]=p.useState([]),[Ee,ze]=p.useState(""),[be,qe]=p.useState(!1),De=p.useRef(!1),We=p.useRef(null),Ke=p.useRef(null),Ge=p.useRef(H);p.useEffect(()=>{Ge.current=H},[H]),p.useEffect(()=>{var e;(e=Ke.current)==null||e.scrollIntoView({behavior:"smooth"})},[H.length]);const[He,ie]=p.useState(!1),[Je,Xe]=p.useState(""),[Ye,Et]=p.useState("web"),[J,he]=p.useState("idle"),[Dt,Ze]=p.useState(!1),[Qe,xe]=p.useState(["KU Sandbox Terminal v0.1 — type `help` for commands."]),[X,Wt]=p.useState("/"),[ge,Y]=p.useState(""),[re,Vt]=p.useState([]),[Ne,ve]=p.useState(-1),Ve=p.useRef({}),Z=p.useRef(null),[St,Se]=p.useState(!1),[I,$t]=p.useState(!1),[R,le]=p.useState({main:null}),[E,et]=p.useState("main"),[ae,se]=p.useState(new Set),[B,$e]=p.useState({}),[Re,Ae]=p.useState(""),[tt,rt]=p.useState(!1),[Rt,At]=p.useState(null),[Pt,Pe]=p.useState(""),[ye,ke]=p.useState([]),[at,st]=p.useState(!1),ot="ku_creator_projects_local",Me=()=>{try{return JSON.parse(localStorage.getItem(ot)||"[]")}catch{return[]}},Mt=e=>{try{const r=Me().filter(a=>a.id!==e.id);localStorage.setItem(ot,JSON.stringify([e,...r]))}catch{}},_t=e=>{try{return JSON.parse(localStorage.getItem(`ku_creator_files_${e}`)||"[]")}catch{return[]}},U=(e,r)=>{try{localStorage.setItem(`ku_creator_files_${e}`,JSON.stringify(r))}catch{}},W=g.find(e=>e.path===b)||null;p.useEffect(()=>{const e=Me();u?F.from("creator_projects").select("*").eq("user_id",u.id).order("updated_at",{ascending:!1}).then(({data:r})=>{const a=r??[],o=new Set(a.map(n=>n.id)),c=[...a,...e.filter(n=>!o.has(n.id))];k(c)}).catch(()=>k(e)):k(e)},[u]),p.useEffect(()=>{(async()=>{if(y){const e=Me().find(r=>r.id===y);if(e){C(e);return}if(u){const{data:r}=await F.from("creator_projects").select("*").eq("id",y).maybeSingle();if(r){C(r);return}}}w.length?(C(w[0]),j(`/creator/workspace/${w[0].id}`,{replace:!0})):He||ie(!0)})()},[y,w,u]),p.useEffect(()=>{if(!i){x([]),d([]),f(null);return}const e=_t(i.id);if(e.length>0){x(e);const r=e.find(a=>/index\.html|main\.(js|py|ts)|README\.md/i.test(a.path))||e[0];r&&(d([r.path]),f(r.path));return}if(u&&!i.id.startsWith("proj_"))F.from("creator_files").select("*").eq("project_id",i.id).order("path").then(({data:r})=>{if(r&&r.length>0){const n=r.map(h=>({id:h.id,path:h.path,content:h.content??"",language:h.language||q(h.path)}));x(n),U(i.id,n);const m=n.find(h=>/index\.html|main\.(js|py|ts)|README\.md/i.test(h.path))||n[0];m&&(d([m.path]),f(m.path));return}const o=(K[i.template||"blank"]??K.blank).map((n,m)=>({id:`file_${m}`,path:n.path,content:n.content,language:n.language}));x(o),U(i.id,o);const c=o.find(n=>/index\.html|main\.(js|py|ts)|README\.md/i.test(n.path))||o[0];c&&(d([c.path]),f(c.path))}).catch(()=>{const a=(K[i.template||"blank"]??K.blank).map((c,n)=>({id:`file_${n}`,path:c.path,content:c.content,language:c.language}));x(a),U(i.id,a);const o=a.find(c=>/index\.html|main\.(js|py|ts)|README\.md/i.test(c.path))||a[0];o&&(d([o.path]),f(o.path))});else{const a=(K[i.template||"blank"]??K.blank).map((c,n)=>({id:`file_${n}`,path:c.path,content:c.content,language:c.language}));x(a),U(i.id,a);const o=a.find(c=>/index\.html|main\.(js|py|ts)|README\.md/i.test(c.path))||a[0];o&&(d([o.path]),f(o.path))}},[i,u]),p.useEffect(()=>{if(!i)return;const e=bt.getState();e.setCurrentProject(i.id),e.setCurrentWorkspace(i.id);try{const r=yr.getInstance();g.forEach(a=>{r.createFile(i.id,a.path.split("/").pop()||a.path,a.path,a.content)})}catch{}if(s.forEach(r=>{const a=g.find(o=>o.path===r);a&&e.openTab({id:`tab_${i.id}_${a.path}`,fileId:a.id||a.path,fileName:a.path.split("/").pop()||a.path,filePath:a.path,language:a.language||q(a.path),content:a.content})}),b){const r=e.openTabs.find(a=>a.filePath===b);r&&e.setActiveTab(r.id)}},[i,g,s,b]);const nt=async()=>{const e=Je.trim();if(!e){A.error("Please enter a project name");return}const r=Ye||"web",a=K[r]??K.blank;let o=null;if(u)try{const{data:n,error:m}=await F.from("creator_projects").insert({user_id:u.id,name:e,language:r,template:r}).select().single();!m&&n&&(o=n,await F.from("creator_files").insert(a.map(h=>({project_id:n.id,...h}))))}catch(n){console.warn("Supabase project creation fallback to local:",n)}o||(o={id:`proj_${Date.now()}_${Math.random().toString(36).substring(2,6)}`,user_id:(u==null?void 0:u.id)||"guest_user",name:e,language:r,template:r,created_at:new Date().toISOString(),updated_at:new Date().toISOString()}),Mt(o);const c=a.map((n,m)=>({id:`f_${Date.now()}_${m}`,path:n.path,content:n.content,language:n.language||q(n.path)}));U(o.id,c),k(n=>[o,...n.filter(m=>m.id!==o.id)]),C(o),x(c),ie(!1),Xe(""),j(`/creator/workspace/${o.id}`),A.success(`Project "${e}" created!`)},it=e=>{f(e),d(r=>r.includes(e)?r:[...r,e])},Tt=e=>{d(r=>{const a=r.filter(o=>o!==e);return b===e&&f(a[a.length-1]??null),a})},lt=async()=>{if(!i)return;const e=prompt("New file path (e.g. src/utils.js)");if(!e)return;if(g.some(o=>o.path===e))return A.error("Already exists");const r={id:`f_${Date.now()}`,project_id:i.id,path:e,content:"",language:q(e)};if(u&&!i.id.startsWith("proj_"))try{const{data:o}=await F.from("creator_files").insert({project_id:i.id,path:e,content:"",language:r.language}).select().single();o!=null&&o.id&&(r.id=o.id)}catch{}const a=[...g,r];x(a),U(i.id,a),it(e)},Lt=async e=>{if(!i||!confirm(`Delete ${e}?`))return;if(u&&!i.id.startsWith("proj_"))try{await F.from("creator_files").delete().eq("project_id",i.id).eq("path",e)}catch{}const r=g.filter(a=>a.path!==e);x(r),U(i.id,r),d(a=>a.filter(o=>o!==e)),b===e&&f(null)},_e=p.useCallback(async(e,r)=>{if(i){if(he("saving"),x(a=>{const o=a.map(c=>c.path===e?{...c,content:r}:c);return U(i.id,o),o}),u&&!i.id.startsWith("proj_"))try{await F.from("creator_files").update({content:r,updated_at:new Date().toISOString()}).eq("project_id",i.id).eq("path",e)}catch{}he("saved"),setTimeout(()=>he(a=>a==="saved"?"idle":a),1500)}},[i,u]),Ot=e=>{if(!W||!i)return;const r=e??"";x(c=>c.map(n=>n.path===W.path?{...n,content:r}:n)),he("dirty");const a=bt.getState(),o=a.openTabs.find(c=>c.filePath===W.path);o&&a.updateTabContent(o.id,r),clearTimeout(Ve.current[W.path]),Ve.current[W.path]=setTimeout(()=>_e(W.path,r),700)};p.useEffect(()=>{const e=a=>{(a.ctrlKey||a.metaKey)&&a.key.toLowerCase()==="s"&&(a.preventDefault(),W&&(clearTimeout(Ve.current[W.path]),_e(W.path,W.content)))},r=a=>{(J==="dirty"||J==="saving")&&(a.preventDefault(),a.returnValue="")};return window.addEventListener("keydown",e),window.addEventListener("beforeunload",r),()=>{window.removeEventListener("keydown",e),window.removeEventListener("beforeunload",r)}},[W,J,_e]);const Q=p.useCallback(()=>Pr(g),[g]);p.useEffect(()=>{const e=r=>{r.data&&r.data.__ku_preview&&(r.data.type==="log"?Be(a=>[...a.slice(-80),`[${r.data.level||"info"}] ${r.data.text}`]):r.data.type==="error"&&Be(a=>[...a.slice(-80),`[ERROR] ${r.data.text}`]))};return window.addEventListener("message",e),()=>window.removeEventListener("message",e)},[]);const Ft=p.useCallback(()=>{Fe(!0),Z.current&&(Z.current.srcdoc=Q()),setTimeout(()=>Fe(!1),300),A.success("Live preview reloaded")},[Q]),It=p.useCallback(()=>{const e=Q(),r=new Blob([e],{type:"text/html;charset=utf-8"}),a=URL.createObjectURL(r);window.open(a,"_blank")},[Q]),Bt=async()=>{!W&&g.length===0||(Z.current&&(Z.current.srcdoc=Q()),G(!0),A.success("Project executed in Live Preview"))};p.useEffect(()=>{if(!M)return;const e=setTimeout(()=>{Z.current&&(Z.current.srcdoc=Q())},400);return()=>clearTimeout(e)},[g,M,Q]);const Ut=async()=>{if(!i)return;const e=new ht;g.forEach(a=>e.file(a.path,a.content)),e.file("ku-project.json",JSON.stringify({name:i.name,language:i.language,exportedAt:new Date().toISOString()},null,2));const r=await e.generateAsync({type:"blob"});Ar.saveAs(r,`${i.name.replace(/\s+/g,"-").toLowerCase()}.zip`),A.success("Downloaded ZIP")},zt=async e=>{var h;if(!i)return;if(e.size>25*1024*1024){A.error("ZIP too large (max 25MB)");return}let r;try{r=await ht.loadAsync(e)}catch{A.error("Not a valid ZIP file");return}const a=Object.values(r.files).filter(l=>!l.dir);if(a.length===0){A.error("ZIP is empty");return}if(a.length>500){A.error("Too many files (max 500)");return}const o=a[0].name.split("/")[0],c=a.every(l=>l.name.startsWith(o+"/"));let n=0,m=0;for(const l of a){if(l.name==="ku-project.json")continue;let v=c?l.name.slice(o.length+1):l.name;if(!v||v.includes("..")||v.startsWith("/")){m++;continue}if((((h=l._data)==null?void 0:h.uncompressedSize)??0)>1024*1024){m++;continue}const L=await l.async("string");if(/\x00/.test(L.slice(0,4096))){m++;continue}const oe=q(v);if(g.some(ee=>ee.path===v))await F.from("creator_files").update({content:L,updated_at:new Date().toISOString()}).eq("project_id",i.id).eq("path",v),x(ee=>ee.map(pe=>pe.path===v?{...pe,content:L,language:oe}:pe));else{const{data:ee}=await F.from("creator_files").insert({project_id:i.id,path:v,content:L,language:oe}).select().single();x(pe=>[...pe,{id:ee==null?void 0:ee.id,path:v,content:L,language:oe}])}n++}A.success(`Imported ${n} files${m?` (${m} skipped)`:""}`)},ct=async()=>{if(!Ee.trim()||De.current)return;const e=Ee.trim(),r=`ai_${Date.now()}`;fe(l=>[...l,{id:`u_${Date.now()}`,role:"user",content:e},{id:r,role:"assistant",content:""}]),ze(""),De.current=!0,qe(!0);const a=new AbortController;We.current=a;const o=W?`

[FILE: ${W.path}]
\`\`\`${W.language}
${W.content.slice(0,3e3)}
\`\`\``:"",c=i?`[PROJECT: ${i.name} | ${i.language}]`:"",n={beginner:"Explain everything step-by-step as if to someone writing their first program. Avoid jargon, use simple analogies, and define any technical terms you use.",intermediate:"Balance explanation with code. Assume basic programming knowledge — variables, loops, functions.",advanced:"Skip basics. Focus on best practices, design patterns, edge cases, and trade-offs.",expert:"Peer-to-peer technical discussion. Be concise, discuss internals, performance, and architecture trade-offs directly."},m=Ge.current.filter(l=>l.content.trim()).slice(-8).map(l=>({role:l.role,content:l.content}));for(;m.length>0&&m[0].role==="assistant";)m.shift();const h=[];for(const l of m){const v=h[h.length-1];v&&v.role===l.role?v.content+=`

`+l.content:h.push({...l})}h.push({role:"user",content:e+o});try{await je({mode:"coding",messages:[{role:"user",content:`${c}
You are a senior software engineer and coding mentor. Help me with my project.

Teaching mode: ${Ce}. ${n[Ce]}`},{role:"assistant",content:"Understood. I'm your AI Code Assistant — ready to help debug, explain, generate, and refactor your code at the right depth for you."},...h],onToken:l=>fe(v=>v.map(V=>V.id===r?{...V,content:V.content+l}:V)),signal:a.signal})}catch(l){const v=(l==null?void 0:l.name)==="AbortError"?"⚠️ Stopped.":`⚠️ ${l.message||"AI error"}`;fe(V=>V.map(L=>{var oe;return L.id===r?{...L,content:((oe=V.find(mt=>mt.id===r))==null?void 0:oe.content)+`
`+v}:L}))}finally{De.current=!1,qe(!1),We.current=null}},ce=p.useCallback(()=>{const e=R[E];return e?B[e]??null:null},[R,E,B]),we=p.useCallback(()=>{const e=ce(),r=(e==null?void 0:e.snapshot)??{},a=[];for(const o of g)r[o.path]!==o.content&&a.push(o.path);for(const o of Object.keys(r))g.some(c=>c.path===o)||a.push(`${o} (deleted)`);return a},[g,ce]),qt=()=>{if(I){N("Git repository already initialized.");return}$t(!0),le({main:null}),et("main"),se(new Set),$e({}),ke([]),N("Initialized empty Git repository (in-memory sandbox) on branch main ✅","Note: this is a learning sandbox — branches live only for this session.")},Kt=e=>{if(!I){N("fatal: not a git repository (run `git init`)");return}{const r=we().map(a=>a.replace(" (deleted)",""));se(new Set(r)),N(`Staged ${r.length} file(s)`);return}},Gt=e=>{if(!I)return N("fatal: not a git repository (run `git init`)"),null;if(ae.size===0)return N('nothing to commit (use "git add")'),null;if(!e.trim())return N('error: commit message required (use -m "message")'),null;const r=ce(),a={...(r==null?void 0:r.snapshot)??{}};for(const n of ae){const m=g.find(h=>h.path===n);m?a[n]=m.content:delete a[n]}const o=Math.random().toString(36).slice(2,9),c={id:o,message:e.trim(),timestamp:Date.now(),parent:(r==null?void 0:r.id)??null,snapshot:a,branch:E};return $e(n=>({...n,[o]:c})),le(n=>({...n,[E]:o})),se(new Set),N(`[${E} ${o}] ${e.trim()}`),o},Ht=e=>{if(!I){N("fatal: not a git repository (run `git init`)");return}if(!e){N(...Object.keys(R).map(r=>(r===E?"* ":"  ")+r));return}if(R[e]){N(`fatal: branch '${e}' already exists`);return}le(r=>({...r,[e]:r[E]})),N(`Created branch '${e}' from '${E}'`)},Jt=(e,r=!1)=>{var n;if(!I){N("fatal: not a git repository (run `git init`)");return}if(!e){N("usage: git checkout <branch> | git checkout -b <new-branch>");return}if(r){if(R[e]){N(`fatal: branch '${e}' already exists`);return}}else if(!(e in R)){N(`error: pathspec '${e}' did not match any branch`);return}if(we().length>0){N("error: you have uncommitted changes. Commit them or run `git reset --hard` first.");return}r&&le(m=>({...m,[e]:m[E]}));const a=r?R[E]:R[e],o=a?((n=B[a])==null?void 0:n.snapshot)??{}:{},c=Object.entries(o).map(([m,h])=>{const l=g.find(v=>v.path===m);return{id:l==null?void 0:l.id,path:m,content:h,language:(l==null?void 0:l.language)??q(m)}});c.length&&x(c),et(e),d(m=>{const h=m.filter(l=>c.some(v=>v.path===l));return h.length?h:c[0]?[c[0].path]:[]}),f(m=>{var h;return c.some(l=>l.path===m)?m:((h=c[0])==null?void 0:h.path)??null}),N(`Switched to ${r?"a new ":""}branch '${e}'`)},Xt=e=>{if(!I){N("fatal: not a git repository (run `git init`)");return}if(!e){N("usage: git merge <branch>");return}if(!(e in R)){N(`error: branch '${e}' not found`);return}const r=R[E],a=R[e];if(!a){N(`branch '${e}' has no commits`);return}if(r===a){N("Already up to date.");return}const o=r?B[r].snapshot:{},c=B[a].snapshot,n=[],m={...o};for(const[l,v]of Object.entries(c)){if(!(l in o)){m[l]=v;continue}o[l]!==v&&(n.push(l),m[l]=`<<<<<<< ${E}
${o[l]}
=======
${v}
>>>>>>> ${e}
`)}const h=Object.entries(m).map(([l,v])=>{const V=g.find(L=>L.path===l);return{id:V==null?void 0:V.id,path:l,content:v,language:(V==null?void 0:V.language)??q(l)}});if(x(h),n.length)ke(n),Se(!0),N("Auto-merging...",`CONFLICT (content): Merge conflict in ${n.join(", ")}`,'Fix conflicts (or click "Resolve with AI" in the Git panel), then `git add <file>` and `git commit`.');else{const l=Math.random().toString(36).slice(2,9),v={id:l,message:`Merge branch '${e}' into ${E}`,timestamp:Date.now(),parent:r,snapshot:m,branch:E};$e(V=>({...V,[l]:v})),le(V=>({...V,[E]:l})),N(`Merge made (no conflicts). [${E} ${l}] Merge branch '${e}' into ${E}`)}},Yt=()=>{if(!I){N("fatal: not a git repository (run `git init`)");return}const e=ce(),r=(e==null?void 0:e.snapshot)??{},a=Object.entries(r).map(([o,c])=>{const n=g.find(m=>m.path===o);return{id:n==null?void 0:n.id,path:o,content:c,language:(n==null?void 0:n.language)??q(o)}});x(a),se(new Set),ke([]),N(`HEAD is now at ${(e==null?void 0:e.id)??"(no commits)"}. Working tree reset.`)},Zt=async()=>{const e=we();if(e.length===0){A.error("No changes to describe");return}rt(!0);const r=ce(),a=e.map(o=>{const c=o.replace(" (deleted)",""),n=g.find(l=>l.path===c),m=(r==null?void 0:r.snapshot[c])??"",h=(n==null?void 0:n.content)??"";return o.includes("(deleted)")?`Deleted: ${c}`:`${m?"Modified":"Added"}: ${c} (${m.length} → ${h.length} chars)`}).join(`
`);try{const o=await je({mode:"coding",messages:[{role:"user",content:`Generate a concise, conventional-commits style commit message (one short line, max 72 chars, optionally with a 1-2 line body) for these changes:

${a}

Return ONLY the commit message text — no quotes, no markdown, no labels.`}]});Ae(o.trim().replace(/^["'`]|["'`]$/g,""))}catch(o){A.error(o.message)}rt(!1)},Qt=async e=>{var n;const r=B[e];if(!r)return;At(e),Pe("");const a=r.parent?((n=B[r.parent])==null?void 0:n.snapshot)??{}:{},o=Object.keys(r.snapshot).filter(m=>a[m]!==r.snapshot[m]),c=o.map(m=>`--- ${m} ---
${r.snapshot[m].slice(0,800)}`).join(`

`);try{await je({mode:"coding",messages:[{role:"user",content:`Explain this git commit in plain language for a student learning version control.

Commit message: "${r.message}"
Files changed: ${o.join(", ")||"(none detected)"}

${c.slice(0,3e3)}`}],onToken:m=>Pe(h=>h+m)})}catch(m){Pe(`⚠️ ${m.message}`)}},er=async e=>{const r=g.find(a=>a.path===e);if(r){st(!0);try{let a=await je({mode:"coding",messages:[{role:"user",content:`This file has git merge conflict markers (<<<<<<<, =======, >>>>>>>). Resolve the conflict by intelligently combining both sides — keep working functionality from both where sensible. Return ONLY the final resolved file content, no conflict markers, no markdown code fences, no explanation.

File: ${e}

${r.content}`}]});a=a.replace(/^```[\w-]*\n?/,"").replace(/```\s*$/,"").trim(),x(o=>o.map(c=>c.path===e?{...c,content:a}:c)),ke(o=>o.filter(c=>c!==e)),se(o=>new Set(o).add(e)),A.success(`AI resolved conflict in ${e} — review and commit`)}catch(a){A.error(a.message)}st(!1)}},N=(...e)=>xe(r=>[...r,...e]),pt=async e=>{const r=e.trim();if(N(`${X} $ ${e}`),!r)return;if(Vt(n=>(n[n.length-1]===r?n:[...n,r]).slice(-100)),ve(-1),r==="clear"){xe([]);return}const[a,...o]=r.split(/\s+/),c=n=>{if(!n)return X;if(n.startsWith("/"))return n.replace(/\/+$/,"")||"/";const h=((X==="/"?"":X)+"/"+n).split("/").filter(Boolean),l=[];for(const v of h)v!=="."&&(v===".."?l.pop():l.push(v));return"/"+l.join("/")};try{if(a==="help"){N('Commands: help, ls [path], cd <path>, cat <file>, echo <text>, pwd, clear, history, run <file.js>, node -e "<code>", python <file.py>, touch <file>, rm <file>'),N('Git: git init | status | add <file|.> | commit -m "msg" | log | branch [name] | checkout [-b] <branch> | merge <branch> | diff | reset --hard');return}if(a==="history"){N(...re.map((l,v)=>`${v+1}  ${l}`));return}const n=kr.getInstance(),m=g.map(l=>({path:l.path,content:l.content})),h=await n.execute({userId:i!=null&&i.id?`user-${i.id}`:"creator-student",projectId:(i==null?void 0:i.id)||"creator-workspace",workspaceId:(i==null?void 0:i.id)||"creator-workspace",command:r,cwd:X,files:m});if(h.stdout&&N(h.stdout),h.stderr&&N(`[err] ${h.stderr}`),h.error&&N(`[error] ${h.error}`),a==="cd"&&h.status==="completed"){const l=c(o[0]??"/");Wt(l)}}catch(n){N("error: "+(n.message||String(n)))}};return t.jsxDEV(Cr,{fullBleed:!0,children:[t.jsxDEV("div",{className:"min-h-12 py-1.5 px-3 flex items-center gap-2 border-b border-border/50 bg-card/40 backdrop-blur sticky top-16 z-10 overflow-x-auto no-scrollbar",children:[t.jsxDEV("button",{onClick:()=>P(e=>!e),className:"p-1.5 rounded hover:bg-primary/10 text-muted-foreground shrink-0 hidden lg:inline-flex",children:D?t.jsxDEV(Vr,{className:"h-4 w-4"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1445,columnNumber:26},this):t.jsxDEV(Sr,{className:"h-4 w-4"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1445,columnNumber:67},this)},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1444,columnNumber:9},this),t.jsxDEV("select",{value:(i==null?void 0:i.id)??"",onChange:e=>j(`/creator/workspace/${e.target.value}`),className:"bg-muted/50 text-xs sm:text-sm rounded px-2 py-1 border border-border/60 max-w-[140px] sm:max-w-[200px] shrink-0",children:w.map(e=>t.jsxDEV("option",{value:e.id,children:e.name},e.id,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1452,columnNumber:30},this))},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1447,columnNumber:9},this),t.jsxDEV("button",{onClick:()=>ie(!0),className:"text-xs px-2 py-1 rounded border border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-1 shrink-0",children:[t.jsxDEV(dt,{className:"h-3 w-3"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1455,columnNumber:11},this)," New"]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1454,columnNumber:9},this),t.jsxDEV("div",{className:"flex-1 min-w-2"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1457,columnNumber:9},this),t.jsxDEV("button",{onClick:Bt,className:"px-3 py-1.5 rounded bg-primary text-primary-foreground text-xs sm:text-sm font-poppins inline-flex items-center gap-1.5 hover:brightness-110 shrink-0 font-medium",children:[t.jsxDEV(or,{className:"h-3.5 w-3.5"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1459,columnNumber:11},this)," Run"]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1458,columnNumber:9},this),t.jsxDEV("button",{onClick:()=>{G(!0),T("preview")},className:"px-2 py-1.5 rounded border border-border text-muted-foreground hover:text-primary inline-flex items-center gap-1.5 text-xs sm:text-sm shrink-0",children:[t.jsxDEV(Te,{className:"h-3.5 w-3.5"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1462,columnNumber:11},this)," Preview"]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1461,columnNumber:9},this),t.jsxDEV("button",{onClick:()=>{Ze(e=>!e),T("terminal")},className:"px-2 py-1.5 rounded border border-border text-muted-foreground hover:text-primary inline-flex items-center gap-1.5 text-xs sm:text-sm shrink-0",children:[t.jsxDEV(de,{className:"h-3.5 w-3.5"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1465,columnNumber:11},this)," Terminal"]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1464,columnNumber:9},this),t.jsxDEV("button",{onClick:()=>Se(e=>!e),className:`px-2 py-1.5 rounded border inline-flex items-center gap-1.5 text-xs sm:text-sm shrink-0 ${ye.length?"border-destructive/50 text-destructive":"border-border text-muted-foreground hover:text-primary"}`,children:[t.jsxDEV(ut,{className:"h-3.5 w-3.5"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1468,columnNumber:11},this)," Git",I&&t.jsxDEV("span",{className:"text-[10px] opacity-70",children:["(",E,")"]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1468,columnNumber:64},this),ye.length>0&&t.jsxDEV(ft,{className:"h-3 w-3"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1469,columnNumber:41},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1467,columnNumber:9},this),t.jsxDEV("button",{onClick:()=>{Ue(e=>!e),T("ai")},className:"px-2 py-1.5 rounded border border-accent/40 text-accent hover:bg-accent/10 inline-flex items-center gap-1.5 text-xs sm:text-sm shrink-0",children:[t.jsxDEV(z,{className:"h-3.5 w-3.5"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1472,columnNumber:11},this)," AI"]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1471,columnNumber:9},this),t.jsxDEV("span",{className:"ml-1 text-[11px] inline-flex items-center gap-1 text-muted-foreground min-w-[70px] shrink-0",children:[J==="saving"&&t.jsxDEV(t.Fragment,{children:[t.jsxDEV(ne,{className:"h-3 w-3 animate-spin"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1475,columnNumber:40},this)," Saving…"]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1475,columnNumber:38},this),J==="saved"&&t.jsxDEV(t.Fragment,{children:[t.jsxDEV(nr,{className:"h-3 w-3 text-green-400"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1476,columnNumber:39},this)," Saved"]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1476,columnNumber:37},this),J==="dirty"&&t.jsxDEV(t.Fragment,{children:[t.jsxDEV(Er,{className:"h-3 w-3 text-amber-400"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1477,columnNumber:39},this)," Unsaved"]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1477,columnNumber:37},this),J==="error"&&t.jsxDEV(t.Fragment,{children:[t.jsxDEV(Dr,{className:"h-3 w-3 text-destructive"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1478,columnNumber:39},this)," Offline"]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1478,columnNumber:37},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1474,columnNumber:9},this),t.jsxDEV("button",{onClick:Ut,className:"px-2 py-1.5 rounded border border-border text-muted-foreground hover:text-primary inline-flex items-center gap-1.5 text-xs sm:text-sm shrink-0",children:[t.jsxDEV(ir,{className:"h-3.5 w-3.5"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1481,columnNumber:11},this)," ZIP"]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1480,columnNumber:9},this),t.jsxDEV("label",{className:"px-2 py-1.5 rounded border border-border text-muted-foreground hover:text-primary inline-flex items-center gap-1.5 text-xs sm:text-sm cursor-pointer shrink-0",children:[t.jsxDEV(lr,{className:"h-3.5 w-3.5"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1484,columnNumber:11},this)," Import",t.jsxDEV("input",{type:"file",accept:".zip",className:"hidden",onChange:e=>{var r;return((r=e.target.files)==null?void 0:r[0])&&zt(e.target.files[0])}},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1485,columnNumber:11},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1483,columnNumber:9},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1443,columnNumber:7},this),t.jsxDEV("div",{className:"lg:hidden flex items-center bg-card/60 border-b border-border/50 px-2 py-1.5 gap-1 overflow-x-auto text-xs",children:[t.jsxDEV("button",{onClick:()=>T("editor"),className:`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${$==="editor"?"bg-primary text-primary-foreground":"text-muted-foreground hover:text-foreground"}`,children:[t.jsxDEV(Le,{className:"h-3.5 w-3.5"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1497,columnNumber:11},this)," Code"]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1491,columnNumber:9},this),t.jsxDEV("button",{onClick:()=>T("preview"),className:`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${$==="preview"?"bg-primary text-primary-foreground":"text-muted-foreground hover:text-foreground"}`,children:[t.jsxDEV(Te,{className:"h-3.5 w-3.5"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1505,columnNumber:11},this)," Preview"]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1499,columnNumber:9},this),t.jsxDEV("button",{onClick:()=>T("files"),className:`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${$==="files"?"bg-primary text-primary-foreground":"text-muted-foreground hover:text-foreground"}`,children:[t.jsxDEV(Oe,{className:"h-3.5 w-3.5"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1513,columnNumber:11},this)," Files (",g.length,")"]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1507,columnNumber:9},this),t.jsxDEV("button",{onClick:()=>T("terminal"),className:`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${$==="terminal"?"bg-primary text-primary-foreground":"text-muted-foreground hover:text-foreground"}`,children:[t.jsxDEV(de,{className:"h-3.5 w-3.5"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1521,columnNumber:11},this)," Terminal"]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1515,columnNumber:9},this),t.jsxDEV("button",{onClick:()=>T("ai"),className:`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${$==="ai"?"bg-accent text-accent-foreground":"text-muted-foreground hover:text-foreground"}`,children:[t.jsxDEV(z,{className:"h-3.5 w-3.5"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1529,columnNumber:11},this)," AI"]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1523,columnNumber:9},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1490,columnNumber:7},this),t.jsxDEV("div",{className:"flex flex-col lg:flex-row h-[calc(100dvh-7.5rem)] lg:h-[calc(100dvh-7rem)] overflow-hidden",children:[(D||$==="files")&&t.jsxDEV("aside",{className:`${$==="files"?"flex flex-1 w-full lg:w-60":"hidden lg:flex lg:w-60"} shrink-0 border-r border-border/50 bg-card/30 backdrop-blur flex-col`,children:[t.jsxDEV("div",{className:"px-3 py-2 flex items-center justify-between border-b border-border/50",children:[t.jsxDEV("span",{className:"text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1",children:[t.jsxDEV(Oe,{className:"h-3 w-3"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1539,columnNumber:17},this)," Files"]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1538,columnNumber:15},this),t.jsxDEV("button",{onClick:lt,className:"p-1 rounded hover:bg-primary/10 text-primary",children:t.jsxDEV(dt,{className:"h-3.5 w-3.5"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1541,columnNumber:98},this)},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1541,columnNumber:15},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1537,columnNumber:13},this),t.jsxDEV("div",{className:"flex-1 overflow-auto py-2 px-1",children:[g.length===0&&t.jsxDEV("div",{className:"px-3 text-xs text-muted-foreground",children:"No files."},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1544,columnNumber:38},this),_r(g).map(e=>t.jsxDEV(vt,{node:e,activePath:b,openFile:r=>{it(r),T("editor")},deleteFile:Lt},e.fullPath,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1546,columnNumber:17},this))]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1543,columnNumber:13},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1536,columnNumber:11},this),t.jsxDEV("section",{className:`${$==="editor"?"flex":"hidden lg:flex"} flex-1 min-w-0 flex-col`,children:[t.jsxDEV("div",{className:"h-9 flex items-center bg-card/20 border-b border-border/50 overflow-x-auto no-scrollbar",children:s.map(e=>t.jsxDEV("div",{onClick:()=>f(e),className:`group flex items-center gap-1.5 px-3 h-full border-r border-border/50 cursor-pointer text-xs shrink-0 ${b===e?"bg-background text-primary":"text-muted-foreground hover:text-primary"}`,children:[e,t.jsxDEV("button",{onClick:r=>{r.stopPropagation(),Tt(e)},className:"opacity-50 hover:opacity-100",children:t.jsxDEV(ue,{className:"h-3 w-3"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1571,columnNumber:121},this)},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1571,columnNumber:17},this)]},e,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1566,columnNumber:15},this))},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1564,columnNumber:11},this),t.jsxDEV("div",{className:"flex-1 min-h-0",children:W?t.jsxDEV(vr,{height:"100%",theme:"vs-dark",language:W.language,value:W.content,onChange:Ot,options:{fontSize:13,minimap:{enabled:!1},scrollBeyondLastLine:!1,automaticLayout:!0,wordWrap:"on"}},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1579,columnNumber:15},this):t.jsxDEV("div",{className:"h-full flex items-center justify-center text-muted-foreground text-sm p-4 text-center",children:["Select a file from the file tree, or ",t.jsxDEV("button",{onClick:lt,className:"text-primary underline ml-1",children:"create one"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1589,columnNumber:54},this),"."]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1588,columnNumber:15},this)},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1577,columnNumber:11},this),Ie.length>0&&t.jsxDEV("div",{className:"max-h-36 overflow-auto border-t border-border/50 bg-black/60 font-mono text-xs p-3 text-green-300",children:[t.jsxDEV("div",{className:"flex items-center gap-1 text-muted-foreground mb-1",children:[t.jsxDEV(de,{className:"h-3 w-3"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1597,columnNumber:83},this)," console"]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1597,columnNumber:15},this),Ie.map((e,r)=>t.jsxDEV("div",{children:["> ",e]},r,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1598,columnNumber:43},this))]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1596,columnNumber:13},this),Dt&&t.jsxDEV("div",{className:"h-52 flex flex-col border-t border-border/50 bg-black/80 font-mono text-xs",children:[t.jsxDEV("div",{className:"px-3 py-1.5 flex items-center justify-between border-b border-border/40 text-muted-foreground",children:[t.jsxDEV("span",{className:"flex items-center gap-1.5",children:[t.jsxDEV(de,{className:"h-3 w-3"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1606,columnNumber:61},this)," sandbox"]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1606,columnNumber:17},this),t.jsxDEV("button",{onClick:()=>Ze(!1),className:"hover:text-primary",children:t.jsxDEV(ue,{className:"h-3 w-3"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1607,columnNumber:91},this)},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1607,columnNumber:17},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1605,columnNumber:15},this),t.jsxDEV("div",{className:"flex-1 overflow-auto px-3 py-2 text-green-300 whitespace-pre-wrap",children:Qe.map((e,r)=>t.jsxDEV("div",{children:e},r,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1610,columnNumber:42},this))},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1609,columnNumber:15},this),t.jsxDEV("form",{onSubmit:e=>{e.preventDefault(),pt(ge),Y("")},className:"flex items-center gap-2 px-3 py-1.5 border-t border-border/40",children:[t.jsxDEV("span",{className:"text-primary",children:[X," $"]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1616,columnNumber:17},this),t.jsxDEV("input",{value:ge,onChange:e=>Y(e.target.value),onKeyDown:e=>{if(e.key==="ArrowUp"){if(e.preventDefault(),!re.length)return;const r=Ne<0?re.length-1:Math.max(0,Ne-1);ve(r),Y(re[r]??"")}else if(e.key==="ArrowDown"){if(e.preventDefault(),Ne<0)return;const r=Ne+1;r>=re.length?(ve(-1),Y("")):(ve(r),Y(re[r]))}else e.ctrlKey&&e.key.toLowerCase()==="l"&&(e.preventDefault(),xe([]))},placeholder:"help",className:"flex-1 bg-transparent outline-none text-green-200",autoFocus:!0},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1617,columnNumber:17},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1612,columnNumber:15},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1604,columnNumber:13},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1562,columnNumber:9},this),$==="terminal"&&t.jsxDEV("section",{className:"lg:hidden flex flex-1 min-w-0 flex-col bg-black/90 font-mono text-xs",children:[t.jsxDEV("div",{className:"px-3 py-2 flex items-center justify-between border-b border-border/40 text-muted-foreground bg-card/20",children:[t.jsxDEV("span",{className:"flex items-center gap-1.5",children:[t.jsxDEV(de,{className:"h-3.5 w-3.5 text-primary"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1649,columnNumber:59},this)," KU Sandbox Terminal"]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1649,columnNumber:15},this),t.jsxDEV("button",{onClick:()=>xe([]),className:"text-[10px] text-muted-foreground hover:text-foreground",children:"Clear"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1650,columnNumber:15},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1648,columnNumber:13},this),t.jsxDEV("div",{className:"flex-1 overflow-auto p-3 text-green-300 whitespace-pre-wrap",children:Qe.map((e,r)=>t.jsxDEV("div",{children:e},r,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1653,columnNumber:40},this))},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1652,columnNumber:13},this),t.jsxDEV("form",{onSubmit:e=>{e.preventDefault(),pt(ge),Y("")},className:"flex items-center gap-2 p-2 border-t border-border/40 bg-black",children:[t.jsxDEV("span",{className:"text-primary",children:[X," $"]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1659,columnNumber:15},this),t.jsxDEV("input",{value:ge,onChange:e=>Y(e.target.value),placeholder:"type help for commands",className:"flex-1 bg-transparent outline-none text-green-200 text-xs",autoFocus:!0},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1660,columnNumber:15},this),t.jsxDEV("button",{type:"submit",className:"px-2 py-1 bg-primary text-primary-foreground text-[10px] rounded",children:"Run"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1667,columnNumber:15},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1655,columnNumber:13},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1647,columnNumber:11},this),(M||$==="preview")&&t.jsxDEV("aside",{className:`${$==="preview"?"flex flex-1 w-full":"hidden lg:flex lg:w-[46%]"} border-l border-border/50 bg-background/95 flex-col min-w-[300px]`,children:[t.jsxDEV("div",{className:"min-h-9 py-1 px-3 flex items-center justify-between border-b border-border/50 text-xs text-muted-foreground bg-card/40 overflow-x-auto no-scrollbar gap-2",children:[t.jsxDEV("div",{className:"flex items-center gap-1.5 shrink-0",children:[t.jsxDEV("span",{className:"font-poppins font-medium text-foreground text-xs flex items-center gap-1.5 mr-1",children:[t.jsxDEV(Te,{className:"h-3.5 w-3.5 text-primary"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1679,columnNumber:19},this)," Preview"]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1678,columnNumber:17},this),t.jsxDEV("div",{className:"flex items-center gap-0.5 bg-background/80 border border-border/60 rounded p-0.5",children:[t.jsxDEV("button",{onClick:()=>O("responsive"),title:"Responsive (Fit to Screen)",className:`px-1.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${S==="responsive"?"bg-primary/20 text-primary":"text-muted-foreground hover:text-foreground"}`,children:[t.jsxDEV(cr,{className:"h-3 w-3"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1689,columnNumber:21},this),t.jsxDEV("span",{className:"hidden sm:inline",children:"Fit"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1690,columnNumber:21},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1684,columnNumber:19},this),t.jsxDEV("button",{onClick:()=>O("iphone"),title:"iPhone 15/16 Pro (393 × 852)",className:`p-1 rounded transition-colors ${S==="iphone"?"bg-primary/20 text-primary":"text-muted-foreground hover:text-foreground"}`,children:t.jsxDEV(pr,{className:"h-3 w-3"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1697,columnNumber:21},this)},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1692,columnNumber:19},this),t.jsxDEV("button",{onClick:()=>O("android"),title:"Android Galaxy (412 × 915)",className:`px-1.5 py-1 rounded text-[10px] font-mono transition-colors ${S==="android"?"bg-primary/20 text-primary":"text-muted-foreground hover:text-foreground"}`,children:"Android"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1699,columnNumber:19},this),t.jsxDEV("button",{onClick:()=>O("ipad"),title:"iPad / Tablet (820 × 1180)",className:`p-1 rounded transition-colors ${S==="ipad"?"bg-primary/20 text-primary":"text-muted-foreground hover:text-foreground"}`,children:t.jsxDEV(Rr,{className:"h-3 w-3"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1711,columnNumber:21},this)},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1706,columnNumber:19},this),t.jsxDEV("button",{onClick:()=>O("laptop"),title:"Laptop (1024 × 640)",className:`p-1 rounded transition-colors ${S==="laptop"?"bg-primary/20 text-primary":"text-muted-foreground hover:text-foreground"}`,children:t.jsxDEV(mr,{className:"h-3 w-3"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1718,columnNumber:21},this)},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1713,columnNumber:19},this),t.jsxDEV("button",{onClick:()=>O("desktop"),title:"Desktop / Linux (1280 × 720)",className:`px-1.5 py-1 rounded text-[10px] font-mono transition-colors ${S==="desktop"?"bg-primary/20 text-primary":"text-muted-foreground hover:text-foreground"}`,children:"Desktop"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1720,columnNumber:19},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1683,columnNumber:17},this),S!=="responsive"&&t.jsxDEV("button",{onClick:()=>yt(e=>e==="portrait"?"landscape":"portrait"),title:`Rotate to ${_==="portrait"?"Landscape":"Portrait"}`,className:"p-1 rounded border border-border/60 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors text-[10px] flex items-center gap-1",children:[t.jsxDEV(dr,{className:"h-3 w-3"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1736,columnNumber:21},this),t.jsxDEV("span",{className:"hidden xl:inline capitalize",children:_},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1737,columnNumber:21},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1731,columnNumber:19},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1677,columnNumber:15},this),t.jsxDEV("div",{className:"flex items-center gap-1 shrink-0",children:[t.jsxDEV("button",{onClick:Ft,title:"Reload preview",className:"p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors",children:t.jsxDEV($r,{className:`h-3.5 w-3.5 ${wt?"animate-spin text-primary":""}`},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1749,columnNumber:19},this)},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1744,columnNumber:17},this),t.jsxDEV("button",{onClick:It,title:"Open in new window / tab",className:"p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors",children:t.jsxDEV(ur,{className:"h-3.5 w-3.5"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1756,columnNumber:19},this)},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1751,columnNumber:17},this),t.jsxDEV("button",{onClick:()=>kt(!0),title:"True Fullscreen Mode",className:"p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors",children:t.jsxDEV(fr,{className:"h-3.5 w-3.5"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1763,columnNumber:19},this)},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1758,columnNumber:17},this),t.jsxDEV("button",{onClick:()=>{G(!1),$==="preview"&&T("editor")},title:"Close preview",className:"p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors ml-0.5",children:t.jsxDEV(ue,{className:"h-3.5 w-3.5"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1773,columnNumber:19},this)},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1765,columnNumber:17},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1743,columnNumber:15},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1676,columnNumber:13},this),t.jsxDEV("div",{className:"flex-1 bg-neutral-950/80 overflow-auto flex items-center justify-center p-2 sm:p-4",children:t.jsxDEV("div",{className:`bg-white transition-all duration-200 overflow-hidden shadow-2xl relative ${S==="iphone"?_==="portrait"?"w-[393px] h-[780px] max-h-[96%] border-4 border-neutral-800 rounded-[36px] ring-1 ring-neutral-700":"w-[780px] h-[393px] max-w-[96%] border-4 border-neutral-800 rounded-[36px] ring-1 ring-neutral-700":S==="android"?_==="portrait"?"w-[412px] h-[820px] max-h-[96%] border-4 border-neutral-800 rounded-[28px] ring-1 ring-neutral-700":"w-[820px] h-[412px] max-w-[96%] border-4 border-neutral-800 rounded-[28px] ring-1 ring-neutral-700":S==="ipad"?_==="portrait"?"w-[760px] h-[980px] max-h-[96%] max-w-[96%] border-8 border-neutral-800 rounded-[24px]":"w-[980px] h-[700px] max-h-[96%] max-w-[96%] border-8 border-neutral-800 rounded-[24px]":S==="laptop"?"w-[1024px] h-[640px] max-w-[98%] max-h-[96%] border-4 border-neutral-800 rounded-lg shadow-2xl":S==="desktop"?"w-[1280px] h-[720px] max-w-[98%] max-h-[96%] border-4 border-neutral-800 rounded-md shadow-2xl":"w-full h-full rounded-sm"}`,children:[(S==="iphone"||S==="android")&&_==="portrait"&&t.jsxDEV("div",{className:"absolute top-1.5 left-1/2 -translate-x-1/2 h-4 w-28 bg-neutral-900 rounded-full z-20 pointer-events-none flex items-center justify-center",children:[t.jsxDEV("div",{className:"h-2 w-2 rounded-full bg-neutral-950 mr-2"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1804,columnNumber:21},this),t.jsxDEV("div",{className:"h-1.5 w-8 rounded-full bg-neutral-800"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1805,columnNumber:21},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1803,columnNumber:19},this),t.jsxDEV("iframe",{ref:Z,title:"preview",sandbox:"allow-scripts allow-forms allow-modals allow-same-origin allow-popups",className:"w-full h-full border-0 bg-white"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1808,columnNumber:17},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1780,columnNumber:15},this)},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1779,columnNumber:13},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1674,columnNumber:11},this),(jt||$==="ai")&&t.jsxDEV("aside",{className:`${$==="ai"?"flex flex-1 w-full":"hidden lg:flex lg:w-96"} shrink-0 border-l border-border/50 bg-card/40 backdrop-blur flex-col`,children:[t.jsxDEV("div",{className:"h-9 px-3 flex items-center justify-between border-b border-border/50",children:[t.jsxDEV("span",{className:"text-xs uppercase tracking-widest text-accent flex items-center gap-1.5",children:[t.jsxDEV(z,{className:"h-3 w-3"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1823,columnNumber:105},this)," AI Code Assistant"]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1823,columnNumber:15},this),t.jsxDEV("div",{className:"flex items-center gap-1",children:[H.length>0&&t.jsxDEV("button",{onClick:()=>fe([]),className:"text-xs text-muted-foreground hover:text-destructive px-1",children:"Clear"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1826,columnNumber:19},this),t.jsxDEV("button",{onClick:()=>{Ue(!1),$==="ai"&&T("editor")},className:"text-muted-foreground hover:text-primary",children:t.jsxDEV(ue,{className:"h-3.5 w-3.5"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1835,columnNumber:19},this)},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1828,columnNumber:17},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1824,columnNumber:15},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1822,columnNumber:13},this),t.jsxDEV("div",{className:"px-3 py-2 border-b border-border/50 flex items-center gap-1.5 overflow-x-auto no-scrollbar",children:[t.jsxDEV("span",{className:"text-[10px] text-muted-foreground uppercase tracking-widest mr-1",children:"Mode"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1842,columnNumber:15},this),["beginner","intermediate","advanced","expert"].map(e=>t.jsxDEV("button",{onClick:()=>Ct(e),className:`px-2 py-1 rounded-full text-[10px] font-poppins capitalize transition-colors shrink-0 ${Ce===e?"bg-accent/20 border border-accent/50 text-accent":"border border-border/50 text-muted-foreground hover:text-foreground"}`,children:e},e,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1844,columnNumber:17},this))]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1841,columnNumber:13},this),t.jsxDEV("div",{className:"flex-1 overflow-auto p-3 space-y-3",children:[H.length===0&&t.jsxDEV("p",{className:"text-muted-foreground text-sm",children:"Ask me to explain, debug, refactor, or generate code for your current file. I remember the conversation context."},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1855,columnNumber:17},this),H.map(e=>t.jsxDEV("div",{className:`rounded-lg p-3 text-sm whitespace-pre-wrap ${e.role==="user"?"bg-primary/10 border border-primary/20 text-foreground":"bg-card/60 border border-border/50 text-foreground"}`,children:[e.role==="assistant"&&t.jsxDEV("div",{className:"text-[10px] text-accent font-mono mb-1.5",children:"🤖 AI Engineer"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1867,columnNumber:21},this),e.content||t.jsxDEV("span",{className:"flex items-center gap-2 text-muted-foreground",children:[t.jsxDEV(ne,{className:"h-3 w-3 animate-spin"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1871,columnNumber:23},this)," Thinking..."]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1870,columnNumber:21},this)]},e.id,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1861,columnNumber:17},this)),t.jsxDEV("div",{ref:Ke},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1876,columnNumber:15},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1853,columnNumber:13},this),t.jsxDEV("div",{className:"p-3 border-t border-border/50 space-y-2",children:[t.jsxDEV("textarea",{value:Ee,onChange:e=>ze(e.target.value),onKeyDown:e=>{e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),ct())},placeholder:"Ask me anything about your code… (Enter to send)",rows:3,className:"w-full bg-background/60 border border-border rounded p-2 text-sm focus:border-primary outline-none resize-none"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1880,columnNumber:15},this),t.jsxDEV("div",{className:"flex gap-2",children:[t.jsxDEV("button",{disabled:be,onClick:ct,className:"flex-1 inline-flex items-center justify-center gap-2 py-2 rounded bg-accent text-accent-foreground font-poppins hover:brightness-110 disabled:opacity-50",children:[be?t.jsxDEV(ne,{className:"h-4 w-4 animate-spin"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1891,columnNumber:29},this):t.jsxDEV(z,{className:"h-4 w-4"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1891,columnNumber:76},this),be?"Thinking…":"Ask AI"]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1889,columnNumber:17},this),be&&t.jsxDEV("button",{onClick:()=>{var e;return(e=We.current)==null?void 0:e.abort()},className:"px-3 py-2 rounded border border-destructive/50 text-destructive hover:bg-destructive/10 text-sm",children:"Stop"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1895,columnNumber:19},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1888,columnNumber:15},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1879,columnNumber:13},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1821,columnNumber:11},this),St&&t.jsxDEV("aside",{className:"w-96 shrink-0 border-l border-border/50 bg-card/40 backdrop-blur flex flex-col overflow-hidden",children:[t.jsxDEV("div",{className:"h-9 px-3 flex items-center justify-between border-b border-border/50",children:[t.jsxDEV("span",{className:"text-xs uppercase tracking-widest text-primary flex items-center gap-1.5",children:[t.jsxDEV(ut,{className:"h-3 w-3"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1909,columnNumber:106},this)," Git"]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1909,columnNumber:15},this),t.jsxDEV("button",{onClick:()=>Se(!1),className:"text-muted-foreground hover:text-primary",children:t.jsxDEV(ue,{className:"h-3.5 w-3.5"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1910,columnNumber:110},this)},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1910,columnNumber:15},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1908,columnNumber:13},this),I?t.jsxDEV("div",{className:"flex-1 overflow-auto p-3 space-y-4 text-sm",children:[t.jsxDEV("div",{children:[t.jsxDEV("div",{className:"text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5",children:"Branch"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1923,columnNumber:19},this),t.jsxDEV("div",{className:"flex items-center gap-1.5 flex-wrap",children:[Object.keys(R).map(e=>t.jsxDEV("button",{onClick:()=>Jt(e),className:`px-2 py-1 rounded text-xs border ${e===E?"border-primary text-primary bg-primary/10":"border-border text-muted-foreground hover:text-primary"}`,children:e},e,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1926,columnNumber:23},this)),t.jsxDEV("button",{onClick:()=>{const e=prompt(`New branch from '${E}':`);e!=null&&e.trim()&&Ht(e.trim())},className:"px-2 py-1 rounded text-xs border border-dashed border-border text-muted-foreground hover:text-primary",children:"+ branch"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1931,columnNumber:21},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1924,columnNumber:19},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1922,columnNumber:17},this),ye.length>0&&t.jsxDEV("div",{className:"rounded-lg border border-destructive/40 bg-destructive/5 p-2 space-y-1.5",children:[t.jsxDEV("div",{className:"text-[10px] text-destructive uppercase tracking-widest flex items-center gap-1",children:[t.jsxDEV(ft,{className:"h-3 w-3"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1941,columnNumber:117},this)," Merge Conflicts"]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1941,columnNumber:21},this),ye.map(e=>t.jsxDEV("div",{className:"flex items-center justify-between gap-2",children:[t.jsxDEV("button",{onClick:()=>{s.includes(e)||d(r=>[...r,e]),f(e)},className:"text-xs text-primary underline truncate",children:e},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1944,columnNumber:25},this),t.jsxDEV("button",{onClick:()=>er(e),disabled:at,className:"text-[10px] px-1.5 py-0.5 rounded border border-accent/40 text-accent hover:bg-accent/10 disabled:opacity-50 inline-flex items-center gap-1 shrink-0",children:[at?t.jsxDEV(ne,{className:"h-3 w-3 animate-spin"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1947,columnNumber:44},this):t.jsxDEV(z,{className:"h-3 w-3"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1947,columnNumber:91},this)," Resolve with AI"]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1945,columnNumber:25},this)]},e,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1943,columnNumber:23},this))]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1940,columnNumber:19},this),t.jsxDEV("div",{children:[t.jsxDEV("div",{className:"text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5",children:"Changes"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1956,columnNumber:19},this),(()=>{const e=we();return e.length===0?t.jsxDEV("p",{className:"text-xs text-muted-foreground italic",children:"Working tree clean"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1959,columnNumber:55},this):t.jsxDEV("div",{className:"space-y-1",children:[e.map(r=>{const a=r.replace(" (deleted)",""),o=ae.has(a);return t.jsxDEV("label",{className:"flex items-center gap-2 text-xs cursor-pointer",children:[t.jsxDEV("input",{type:"checkbox",checked:o,onChange:()=>se(c=>{const n=new Set(c);return o?n.delete(a):n.add(a),n})},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1967,columnNumber:31},this),t.jsxDEV("span",{className:r.includes("(deleted)")?"text-destructive":"text-foreground",children:r},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1972,columnNumber:31},this)]},r,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1966,columnNumber:29},this)}),t.jsxDEV("button",{onClick:()=>Kt(),className:"text-[10px] text-primary underline mt-1",children:"Stage all"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1976,columnNumber:25},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1961,columnNumber:23},this)})()]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1955,columnNumber:17},this),t.jsxDEV("div",{children:[t.jsxDEV("div",{className:"text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5",children:"Commit"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1984,columnNumber:19},this),t.jsxDEV("textarea",{value:Re,onChange:e=>Ae(e.target.value),rows:2,placeholder:"Commit message…",className:"w-full bg-background/60 border border-border rounded p-2 text-xs focus:border-primary outline-none resize-none mb-1.5"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1985,columnNumber:19},this),t.jsxDEV("div",{className:"flex gap-2",children:[t.jsxDEV("button",{onClick:Zt,disabled:tt,className:"px-2 py-1 rounded border border-accent/40 text-accent text-xs inline-flex items-center gap-1 hover:bg-accent/10 disabled:opacity-50",children:[tt?t.jsxDEV(ne,{className:"h-3 w-3 animate-spin"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1990,columnNumber:39},this):t.jsxDEV(z,{className:"h-3 w-3"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1990,columnNumber:86},this)," AI message"]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1988,columnNumber:21},this),t.jsxDEV("button",{onClick:()=>{Gt(Re)&&Ae("")},disabled:ae.size===0||!Re.trim(),className:"flex-1 px-2 py-1 rounded bg-primary text-primary-foreground text-xs disabled:opacity-40 inline-flex items-center justify-center gap-1.5",children:[t.jsxDEV(Wr,{className:"h-3 w-3"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1994,columnNumber:23},this)," Commit ",ae.size>0?`(${ae.size})`:""]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1992,columnNumber:21},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1987,columnNumber:19},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1983,columnNumber:17},this),Object.keys(R).length>1&&t.jsxDEV("div",{children:[t.jsxDEV("div",{className:"text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5",children:["Merge into ",E]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:2002,columnNumber:21},this),t.jsxDEV("div",{className:"flex items-center gap-1.5 flex-wrap",children:Object.keys(R).filter(e=>e!==E).map(e=>t.jsxDEV("button",{onClick:()=>Xt(e),className:"px-2 py-1 rounded text-xs border border-border text-muted-foreground hover:text-primary hover:border-primary/40",children:["Merge '",e,"'"]},e,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:2005,columnNumber:25},this))},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:2003,columnNumber:21},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:2001,columnNumber:19},this),t.jsxDEV("div",{children:[t.jsxDEV("div",{className:"text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1",children:[t.jsxDEV(br,{className:"h-3 w-3"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:2015,columnNumber:127},this)," History"]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:2015,columnNumber:19},this),(()=>{let e=R[E];const r=[];for(;e;){const a=B[e];if(!a)break;r.push(a),e=a.parent||void 0}return r.length===0?t.jsxDEV("p",{className:"text-xs text-muted-foreground italic",children:"No commits yet"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:2025,columnNumber:51},this):t.jsxDEV("div",{className:"space-y-1.5",children:r.map(a=>t.jsxDEV("div",{className:"rounded border border-border/40 p-2",children:[t.jsxDEV("div",{className:"flex items-center justify-between gap-2",children:[t.jsxDEV("div",{className:"text-xs truncate",children:a.message},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:2031,columnNumber:31},this),t.jsxDEV("button",{onClick:()=>Qt(a.id),className:"text-[10px] text-accent hover:underline shrink-0 inline-flex items-center gap-1",children:[t.jsxDEV(z,{className:"h-3 w-3"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:2033,columnNumber:33},this)," Explain"]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:2032,columnNumber:31},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:2030,columnNumber:29},this),t.jsxDEV("div",{className:"text-[10px] text-muted-foreground mt-0.5 font-mono",children:[a.id," · ",new Date(a.timestamp).toLocaleString()]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:2036,columnNumber:29},this),Rt===a.id&&t.jsxDEV("div",{className:"mt-1.5 text-[11px] text-muted-foreground whitespace-pre-wrap border-t border-border/30 pt-1.5",children:Pt||t.jsxDEV(ne,{className:"h-3 w-3 animate-spin inline"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:2039,columnNumber:51},this)},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:2038,columnNumber:31},this)]},a.id,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:2029,columnNumber:27},this))},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:2027,columnNumber:23},this)})()]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:2014,columnNumber:17},this),t.jsxDEV("div",{className:"pt-2 border-t border-border/30",children:t.jsxDEV("button",{onClick:Yt,className:"text-[10px] text-destructive hover:underline",children:"git reset --hard (discard uncommitted changes)"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:2051,columnNumber:19},this)},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:2050,columnNumber:17},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1919,columnNumber:15},this):t.jsxDEV("div",{className:"p-4 text-sm text-muted-foreground space-y-3",children:[t.jsxDEV("p",{children:"No repository yet. Initialize an in-memory git sandbox to practice commits, branches, and merges — perfect for learning."},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1915,columnNumber:17},this),t.jsxDEV("button",{onClick:qt,className:"px-3 py-1.5 rounded bg-primary text-primary-foreground text-sm font-mono",children:"git init"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1916,columnNumber:17},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1914,columnNumber:15},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1907,columnNumber:11},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1533,columnNumber:7},this),He&&t.jsxDEV("div",{className:"fixed inset-0 z-50 bg-black/70 backdrop-blur flex items-center justify-center p-4",children:t.jsxDEV("div",{className:"w-full max-w-md rounded-2xl border border-primary/30 bg-card p-6",children:[t.jsxDEV("h3",{className:"font-orbitron text-xl text-primary mb-4",children:"New Project"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:2065,columnNumber:13},this),t.jsxDEV("label",{className:"text-xs text-muted-foreground",children:"Name"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:2066,columnNumber:13},this),t.jsxDEV("input",{value:Je,onChange:e=>Xe(e.target.value),onKeyDown:e=>{e.key==="Enter"&&nt()},placeholder:"My cosmic app",autoFocus:!0,className:"w-full mt-1 mb-3 bg-background/60 border border-border rounded p-2 text-sm focus:border-primary outline-none"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:2067,columnNumber:13},this),t.jsxDEV("label",{className:"text-xs text-muted-foreground",children:"Template"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:2075,columnNumber:13},this),t.jsxDEV("div",{className:"grid grid-cols-3 gap-2 mt-1 mb-4 max-h-64 overflow-y-auto pr-1",children:[["web","🌐 HTML/CSS/JS"],["react","⚛️ React Vite"],["typescript","🔷 TypeScript"],["js","🟨 JavaScript"],["python","🐍 Python"],["sql","🗄️ SQL"],["java","☕ Java"],["cpp","⚙️ C++"],["go","🐹 Go"],["rust","🦀 Rust"],["blank","📄 Blank"]].map(([e,r])=>t.jsxDEV("button",{onClick:()=>Et(e),className:`px-2 py-2 rounded border text-xs ${Ye===e?"border-primary text-primary bg-primary/10":"border-border text-muted-foreground hover:text-primary"}`,children:r},e,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:2090,columnNumber:17},this))},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:2076,columnNumber:13},this),t.jsxDEV("div",{className:"flex items-center justify-between gap-2 mt-4 pt-4 border-t border-border/40",children:[t.jsxDEV("button",{onClick:()=>{ie(!1),j("/creator/generator")},className:"px-3 py-1.5 rounded-lg border border-primary/40 bg-primary/10 text-primary text-xs font-poppins flex items-center gap-1.5 hover:bg-primary/20 transition-all",children:[t.jsxDEV(z,{className:"h-3.5 w-3.5"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:2100,columnNumber:17},this)," Generate with AI"]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:2096,columnNumber:15},this),t.jsxDEV("div",{className:"flex items-center gap-2",children:[w.length>0&&t.jsxDEV("button",{onClick:()=>ie(!1),className:"px-3 py-1.5 text-sm text-muted-foreground hover:text-primary",children:"Cancel"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:2103,columnNumber:41},this),t.jsxDEV("button",{onClick:nt,className:"px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-poppins hover:brightness-110",children:"Create"},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:2104,columnNumber:17},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:2102,columnNumber:15},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:2095,columnNumber:13},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:2064,columnNumber:11},this)},void 0,!1,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:2063,columnNumber:9},this)]},void 0,!0,{fileName:"/app/applet/src/pages/creator/CreatorWorkspace.tsx",lineNumber:1441,columnNumber:5},this)}export{Kr as default};
