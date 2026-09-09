function g(e){try{return typeof e=="string"?e:e===void 0?"undefined":e===null?"null":e instanceof Error?`${e.name}: ${e.message}`:typeof e=="function"?e.toString():JSON.stringify(e)??String(e)}catch{return String(e)}}const m=`
const serializeValue = ${g.toString()};
self.onmessage = async (e) => {
  const logs = [];
  const cap = (level) => (...args) => logs.push({ level, text: args.map(serializeValue).join(" ") });
  self.console = { log: cap("log"), info: cap("info"), warn: cap("warn"), error: cap("error"), debug: cap("debug") };
  try {
    const fn = new Function("return (async () => {" + e.data.code + "\\n})()");
    const result = await fn();
    self.postMessage({ ok: true, logs, result: serializeValue(result) });
  } catch (err) {
    self.postMessage({ ok: false, logs, error: (err && err.message) ? String(err.message) : String(err) });
  }
};
`;function d(e,a={}){const s=Math.max(100,a.timeoutMs??3e3),i=Date.now();return new Promise(f=>{let o=null,c=!1,u;const l=r=>{if(!c){c=!0,u&&clearTimeout(u);try{o==null||o.terminate()}catch{}f(r)}};try{const r=URL.createObjectURL(new Blob([m],{type:"application/javascript"}));o=new Worker(r),URL.revokeObjectURL(r),u=setTimeout(()=>l({ok:!1,status:"timeout",logs:[],error:`Execution exceeded ${s}ms`,duration_ms:Date.now()-i}),s),o.onmessage=n=>{const t=n.data;l({ok:t.ok,status:t.ok?"success":"error",logs:t.logs??[],result:t.result,error:t.error,duration_ms:Date.now()-i})},o.onerror=n=>{var t;(t=n.preventDefault)==null||t.call(n),l({ok:!1,status:"error",logs:[],error:n.message||"worker error",duration_ms:Date.now()-i})},o.postMessage({code:e})}catch(r){l({ok:!1,status:"error",logs:[],error:r instanceof Error?r.message:String(r),duration_ms:Date.now()-i})}})}function p(e){const a=e.logs.map(s=>s.level==="log"?s.text:`[${s.level}] ${s.text}`);return e.result!==void 0&&e.result!=="undefined"&&a.push(`=> ${e.result}`),a.join(`
`)}export{p as f,d as r};
