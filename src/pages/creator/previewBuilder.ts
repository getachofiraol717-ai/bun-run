export interface ProjectFile {
  path: string;
  content: string;
  language?: string;
}

/**
 * Normalizes a file path to its base name and relative path variants for matching.
 */
function getPathVariants(path: string): string[] {
  const clean = path.replace(/^\/+/, '');
  const base = clean.split('/').pop() || clean;
  return [
    clean,
    `./${clean}`,
    `/${clean}`,
    base,
    `./${base}`,
    `/${base}`,
  ];
}

/**
 * Escapes regex special characters.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generates an all-in-one standalone HTML srcdoc string for previewing any Creator Workspace project.
 */
export function buildProjectSrcDoc(files: ProjectFile[]): string {
  if (!files || files.length === 0) {
    return `<!doctype html>
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
</html>`;
  }

  // 1. Identify primary files
  const htmlFile = files.find(f => /(^|\/)index\.html?$/i.test(f.path)) 
                || files.find(f => /\.html?$/i.test(f.path));
  const cssFiles = files.filter(f => /\.css$/i.test(f.path));
  const jsFiles = files.filter(f => /\.(js|mjs)$/i.test(f.path));
  const tsOrReactFiles = files.filter(f => /\.(tsx|jsx|ts)$/i.test(f.path) && !/\.d\.ts$/i.test(f.path));
  const pythonFiles = files.filter(f => /\.py$/i.test(f.path));
  const markdownFiles = files.filter(f => /\.md$/i.test(f.path));

  // Determine if it's a React/JSX project
  const isReact = tsOrReactFiles.some(f => 
    /import.*react/i.test(f.content) || 
    /createRoot/i.test(f.content) || 
    /<[A-Z][A-Za-z0-9]*/.test(f.content) || 
    /export\s+default\s+function/i.test(f.content)
  ) || files.some(f => /package\.json/i.test(f.path) && /"react"/i.test(f.content));

  // Bootstrap bridge script for parent communication and error catching
  const bridgeScript = `
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
    </script>
  `;

  // ─────────────────────────────────────────────────────────────────
  // CASE A: REACT / TYPESCRIPT APP
  // ─────────────────────────────────────────────────────────────────
  if (isReact && tsOrReactFiles.length > 0) {
    const combinedCSS = cssFiles.map(c => `/* ${c.path} */\n${c.content}`).join('\n\n');
    
    // Package up all TS/React/JS files as virtual modules for in-browser Babel execution
    const filesJSON = JSON.stringify(
      [...tsOrReactFiles, ...jsFiles].map(f => ({ path: f.path, content: f.content }))
    );

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React Live Preview</title>
  ${bridgeScript}
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    ${combinedCSS}
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

      const projectFiles = ${filesJSON};

      function resolveModule(reqPath, currentPath) {
        if (window.__modules[reqPath]) return window.__modules[reqPath];
        const cleanReq = reqPath.replace(/^(\.\/|\/)/, '').replace(/\.(tsx|jsx|ts|js)$/, '');
        for (const k in window.__modules) {
          const cleanK = k.replace(/^(\.\/|\/)/, '').replace(/\.(tsx|jsx|ts|js)$/, '');
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
  </script>
</body>
</html>`;
  }

  // ─────────────────────────────────────────────────────────────────
  // CASE B: VANILLA HTML / CSS / JS
  // ─────────────────────────────────────────────────────────────────
  if (htmlFile) {
    let html = htmlFile.content;

    // Ensure responsive viewport meta tag is present for all devices (phones, tablets, laptops, desktops)
    const viewportMeta = `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">`;
    if (!/<meta[^>]*name=["']viewport["']/i.test(html)) {
      if (/<head[^>]*>/i.test(html)) {
        html = html.replace(/<head[^>]*>/i, `$&<meta charset="utf-8">\n  ${viewportMeta}`);
      } else {
        html = `<head>${viewportMeta}</head>` + html;
      }
    }

    // Inject bridge script in <head> if present, or at the start
    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/<head[^>]*>/i, `$&${bridgeScript}`);
    } else {
      html = bridgeScript + html;
    }

    // Inline all CSS files matching link tags
    cssFiles.forEach(css => {
      const variants = getPathVariants(css.path);
      let matched = false;
      for (const v of variants) {
        const linkRegex = new RegExp(`<link[^>]*href=["']${escapeRegex(v)}["'][^>]*>`, 'gi');
        if (linkRegex.test(html)) {
          html = html.replace(linkRegex, `<style data-file="${css.path}">${css.content}</style>`);
          matched = true;
          break;
        }
      }
      // If not explicitly linked, append style block
      if (!matched && !html.includes(css.content.slice(0, 40))) {
        const styleTag = `<style data-file="${css.path}">${css.content}</style>`;
        if (/<\/head>/i.test(html)) {
          html = html.replace(/<\/head>/i, `${styleTag}</head>`);
        } else {
          html = styleTag + html;
        }
      }
    });

    // Inline all JS files matching script tags
    jsFiles.forEach(js => {
      const variants = getPathVariants(js.path);
      let matched = false;
      for (const v of variants) {
        const scriptRegex = new RegExp(`<script[^>]*src=["']${escapeRegex(v)}["'][^>]*>\\s*<\\/script>`, 'gi');
        if (scriptRegex.test(html)) {
          html = html.replace(
            scriptRegex,
            `<script data-file="${js.path}">\ntry {\n${js.content}\n} catch(e) { console.error('Error in ${js.path}:', e); }\n</script>`
          );
          matched = true;
          break;
        }
      }
      // If not explicitly referenced, append before </body> or at the end
      if (!matched) {
        const scriptTag = `<script data-file="${js.path}">\ntry {\n${js.content}\n} catch(e) { console.error('Error in ${js.path}:', e); }\n</script>`;
        if (/<\/body>/i.test(html)) {
          html = html.replace(/<\/body>/i, `${scriptTag}</body>`);
        } else {
          html += scriptTag;
        }
      }
    });

    return html;
  }

  // ─────────────────────────────────────────────────────────────────
  // CASE C: PYTHON SCRIPT PREVIEW
  // ─────────────────────────────────────────────────────────────────
  if (pythonFiles.length > 0) {
    const mainPy = pythonFiles.find(f => /main\.py$/i.test(f.path)) || pythonFiles[0];
    const codeEscaped = mainPy.content.replace(/`/g, '\\`').replace(/\\/g, '\\\\');

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Python Console Runner</title>
  ${bridgeScript}
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
    <div class="title">🐍 Python Runner &middot; ${mainPy.path}</div>
    <button class="run-btn" id="run">Run Script ▶</button>
  </div>
  <div id="out">Loading interactive Python environment...</div>

  <script src="https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js"></script>
  <script>
    const out = document.getElementById('out');
    const runBtn = document.getElementById('run');
    const pyCode = \`${codeEscaped}\`;
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
      out.innerHTML += '<div class="py-line">=== Running ' + '${mainPy.path}' + ' ===</div>';
      try {
        await pyodideInstance.runPythonAsync(pyCode);
        out.innerHTML += '<div class="success">=== Finished (exit code 0) ===</div>\\n';
      } catch(err) {
        out.innerHTML += '<div style="color:#ef4444;">Error: ' + err.message + '</div>';
      }
    }

    runBtn.onclick = runScript;
    initPy();
  </script>
</body>
</html>`;
  }

  // ─────────────────────────────────────────────────────────────────
  // CASE D: JAVASCRIPT / TYPESCRIPT RUNNER
  // ─────────────────────────────────────────────────────────────────
  if (jsFiles.length > 0 || tsOrReactFiles.length > 0) {
    const codeFiles = [...jsFiles, ...tsOrReactFiles];
    const combinedCode = codeFiles.map(c => `// ${c.path}\n${c.content}`).join('\n\n');
    const combinedCSS = cssFiles.map(c => `/* ${c.path} */\n${c.content}`).join('\n\n');

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Live Code Preview</title>
  ${bridgeScript}
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: system-ui, sans-serif; background:#0b0f19; color:#fff; min-height:100vh; padding:1.5rem; }
    #console-out { background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 1rem; font-family: monospace; font-size: 0.85rem; color: #34d399; margin-top: 1rem; white-space: pre-wrap; min-height: 120px; }
    ${combinedCSS}
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
      ${combinedCode}
    } catch(err) {
      console.error(err);
      addLog('Error: ' + err.message, '#ef4444');
    }
  </script>
</body>
</html>`;
  }

  // ─────────────────────────────────────────────────────────────────
  // CASE E: MARKDOWN DOCUMENT
  // ─────────────────────────────────────────────────────────────────
  if (markdownFiles.length > 0) {
    const md = markdownFiles[0];
    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${md.path}</title>
  ${bridgeScript}
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f19; color: #e2e8f0; padding: 2rem; line-height: 1.6; max-width: 800px; margin: auto; }
    h1, h2, h3 { color: #a78bfa; margin-top: 1.5rem; }
    pre { background: #1e1e2e; padding: 1rem; border-radius: 8px; overflow: auto; border: 1px solid rgba(255,255,255,0.1); }
    code { font-family: monospace; color: #38bdf8; }
  </style>
</head>
<body>
  <pre>${md.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</body>
</html>`;
  }

  return `<!doctype html><html><body style="font-family:sans-serif;color:#888;padding:2rem;">No preview available for these files.</body></html>`;
}
