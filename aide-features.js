// ======================================================
// AIDE Advanced Engine (Java, Kotlin, Dart/Flutter, Python, JS, XML)
// ======================================================

let cmLoadingPromise = null;
export async function ensureCodeMirror() {
  if (window.CodeMirror && window.CodeMirror.modes?.clike) return window.CodeMirror;
  if (cmLoadingPromise) return cmLoadingPromise;

  const base = "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.20";
  const addCss = (href) => {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = href;
    document.head.appendChild(l);
  };
  const addJs = (src, optional = false) =>
    new Promise((res, rej) => {
      if (document.querySelector(`script[src="${src}"]`)) return res();
      const s = document.createElement("script");
      s.src = src;
      s.onload = res;
      s.onerror = optional ? res : rej;
      document.head.appendChild(s);
    });

  cmLoadingPromise = (async () => {
    addCss(`${base}/codemirror.min.css`);
    addCss(`${base}/theme/dracula.min.css`);
    addCss(`${base}/addon/hint/show-hint.min.css`);
    await addJs(`${base}/codemirror.min.js`);
    await addJs(`${base}/mode/clike/clike.min.js`);
    await addJs(`${base}/mode/xml/xml.min.js`);
    await addJs(`${base}/mode/groovy/groovy.min.js`);
    await addJs(`${base}/mode/javascript/javascript.min.js`);
    await addJs(`${base}/mode/css/css.min.js`);
    await addJs(`${base}/mode/htmlmixed/htmlmixed.min.js`);
    await addJs(`${base}/mode/dart/dart.min.js`, true);
    await addJs(`${base}/mode/python/python.min.js`, true);
    await addJs(`${base}/mode/yaml/yaml.min.js`, true);
    await addJs(`${base}/addon/edit/closebrackets.min.js`);
    await addJs(`${base}/addon/edit/matchbrackets.min.js`);
    await addJs(`${base}/addon/hint/show-hint.min.js`);
    return window.CodeMirror;
  })();

  return cmLoadingPromise;
}

const HINTS_BY_TYPE = {
  java: ["Activity", "onCreate(Bundle savedInstanceState)", "setContentView(R.layout.activity_main);", "Toast.makeText(this, \"\", Toast.LENGTH_SHORT).show();", "Intent", "WebView", "LinearLayout", "TextView", "Button"],
  kt: ["override fun onCreate(savedInstanceState: Bundle?)", "setContentView(R.layout.activity_main)", "Toast.makeText(this, \"\", Toast.LENGTH_SHORT).show()", "val layout = LinearLayout(this)", "Button(this).apply { }"],
  dart: ["StatelessWidget", "StatefulWidget", "Scaffold(", "AppBar(title: const Text(''))", "Center(child: )", "ElevatedButton(onPressed: () {}, child: const Text(''))", "setState(() {})", "Column(children: [])"],
  py: ["from kivy.app import App", "from kivy.uix.button import Button", "from kivy.uix.label import Label", "from kivy.uix.boxlayout import BoxLayout", "def build(self):"],
  xml: ["android:layout_width=\"match_parent\"", "android:layout_height=\"wrap_content\"", "android:orientation=\"vertical\"", "android:text=\"\"", "android:background=\"#6D28D9\"", "<TextView", "<Button", "<EditText"]
};

export async function mountCodeMirror({ hostId, value, filePath, errorLines = [], onChange, onCursor }) {
  const host = document.getElementById(hostId);
  if (!host) return;
  const CM = await ensureCodeMirror();
  if (!document.getElementById(hostId)) return;

  const mode = filePath.endsWith(".java")
    ? "text/x-java"
    : filePath.endsWith(".kt")
    ? "text/x-kotlin"
    : filePath.endsWith(".dart")
    ? "application/dart"
    : filePath.endsWith(".py")
    ? "text/x-python"
    : filePath.endsWith(".yaml") || filePath.endsWith(".yml")
    ? "text/x-yaml"
    : filePath.endsWith(".json")
    ? "application/json"
    : filePath.endsWith(".xml")
    ? "application/xml"
    : filePath.endsWith(".gradle")
    ? "text/x-groovy"
    : filePath.endsWith(".css")
    ? "text/css"
    : filePath.endsWith(".js")
    ? "text/javascript"
    : "htmlmixed";

  host.innerHTML = "";
  const cm = CM(host, {
    value: value || "",
    mode,
    theme: "dracula",
    lineNumbers: true,
    autoCloseBrackets: true,
    matchBrackets: true,
    tabSize: 4,
    indentUnit: 4,
    extraKeys: { "Ctrl-Space": (editor) => showAndroidHints(editor, filePath) }
  });

  cm.setSize("100%", "100%");
  cm.on("change", () => onChange(cm.getValue()));
  cm.on("cursorActivity", () => {
    const cur = cm.getCursor();
    if (onCursor) onCursor(cur.line + 1, cur.ch + 1);
  });

  errorLines.forEach((ln) => {
    if (ln > 0 && ln <= cm.lineCount()) cm.addLineClass(ln - 1, "background", "bg-rose-500/20");
  });

  window.__wevloCM = cm;
  return cm;
}

export function showAndroidHints(cm, filePath) {
  const CM = window.CodeMirror;
  if (!CM || !cm) return;
  const cur = cm.getCursor(), token = cm.getTokenAt(cur), word = token.string.trim();
  const ext = filePath.split(".").pop();
  const pool = HINTS_BY_TYPE[ext] || HINTS_BY_TYPE.java;
  const matches = word ? pool.filter((h) => h.toLowerCase().includes(word.toLowerCase())) : pool;
  CM.showHint(cm, () => ({ list: matches.length ? matches : pool, from: CM.Pos(cur.line, token.start), to: CM.Pos(cur.line, token.end) }), { completeSingle: false });
}

export function renderVisualXmlDesigner(xmlStr, selectedIdx = 0) {
  let doc;
  try {
    doc = new DOMParser().parseFromString(xmlStr || "<LinearLayout/>", "text/xml");
    if (doc.querySelector("parsererror")) throw new Error();
  } catch {
    return `<div class="p-6 text-center text-rose-400 text-xs font-bold">Invalid XML syntax — fix tags in Code view first.</div>`;
  }
  const widgets = Array.from(doc.querySelectorAll("TextView, Button, EditText, ImageView, Switch, CheckBox"));
  const attr = (el, name, def = "") => el.getAttribute("android:" + name) || def;
  const sel = widgets[selectedIdx] || null;
  const previewHtml = widgets.length
    ? widgets.map((w, idx) => {
        const tag = w.tagName, txt = attr(w, "text", tag), color = attr(w, "textColor", tag === "Button" ? "#FFFFFF" : "#0F172A"), bg = attr(w, "background", tag === "Button" ? "#6D28D9" : "transparent"), ring = idx === selectedIdx ? "ring-2 ring-amber-400" : "";
        if (tag === "Button") return `<button onclick="selectXmlWidget(${idx})" style="background:${bg};color:${color}" class="w-full py-2.5 px-4 rounded-xl font-bold text-xs shadow ${ring}">${txt}</button>`;
        if (tag === "EditText") return `<div onclick="selectXmlWidget(${idx})" class="w-full border border-slate-300 bg-white rounded-xl px-3 py-2 text-xs text-slate-400 text-left ${ring}">${txt || "Input..."}</div>`;
        if (tag === "ImageView") return `<div onclick="selectXmlWidget(${idx})" class="w-20 h-20 mx-auto rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold ${ring}">IMG</div>`;
        return `<p onclick="selectXmlWidget(${idx})" style="color:${color}" class="text-sm font-bold py-1 px-2 rounded ${ring}">${txt}</p>`;
      }).join("")
    : `<p class="text-xs text-slate-400">No widgets yet — tap "+ Add" above!</p>`;

  return `
    <div class="flex-1 overflow-y-auto p-3 space-y-3 bg-[#121024]">
      <div class="flex gap-1.5 overflow-x-auto pb-1">${["TextView", "Button", "EditText", "ImageView", "Switch"].map((t) => `<button onclick="addXmlWidget('${t}')" class="px-3 py-1.5 rounded-xl bg-[#242047] hover:bg-purple-600 text-xs font-bold text-purple-200 shrink-0">+ ${t}</button>`).join("")}</div>
      <div class="bg-[#1b1836] rounded-3xl p-4 flex justify-center border border-[#2d2854]">
        <div class="w-[240px] min-h-[320px] bg-[#f8f7fc] text-slate-900 rounded-[28px] border-[6px] border-slate-950 shadow-2xl overflow-hidden flex flex-col">
          <div class="bg-purple-700 text-white text-[11px] font-bold px-4 py-2">Android Layout Preview</div>
          <div class="flex-1 p-4 flex flex-col justify-center items-center gap-3">${previewHtml}</div>
        </div>
      </div>
      ${sel ? `<div class="bg-[#191632] border border-[#2f2a57] rounded-2xl p-3.5 space-y-2.5 text-xs"><div class="flex justify-between items-center"><b class="text-purple-300">&lt;${sel.tagName}&gt;</b><button onclick="deleteXmlWidget(${selectedIdx})" class="text-rose-400 font-bold">Remove</button></div><div class="grid grid-cols-2 gap-2"><div><label class="text-slate-400">Text</label><input value="${attr(sel, "text")}" oninput="updateXmlWidgetProp(${selectedIdx},'text',this.value)" class="w-full mt-1 bg-[#121024] border border-[#342f61] rounded-lg px-2.5 py-1.5 text-white" /></div><div><label class="text-slate-400">Color</label><input value="${attr(sel, "textColor", "#0F172A")}" oninput="updateXmlWidgetProp(${selectedIdx},'textColor',this.value)" class="w-full mt-1 bg-[#121024] border border-[#342f61] rounded-lg px-2.5 py-1.5 text-white" /></div></div></div>` : ""}
    </div>`;
}

export async function encryptGithubSecret(publicKeyB64, secretValue) {
  if (!window.sodium) {
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/libsodium-wrappers@0.7.15/dist/browsers/sodium.min.js";
      s.onload = res;
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  await window.sodium.ready;
  const binKey = window.sodium.from_base64(publicKeyB64, window.sodium.base64_variants.ORIGINAL);
  const binSec = window.sodium.from_string(secretValue);
  return window.sodium.to_base64(window.sodium.crypto_box_seal(binSec, binKey), window.sodium.base64_variants.ORIGINAL);
}
