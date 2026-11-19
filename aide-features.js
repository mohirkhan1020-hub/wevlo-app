// ======================================================
// AIDE Advanced Engine:
// 1. CodeMirror 5 Syntax Highlight + Auto-Complete + Error Markers
// 2. Visual XML Layout Designer (Live Android Screen + Add Widgets)
// 3. GitHub Secrets Cloud Keystore Encryption (libsodium)
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
  const addJs = (src) =>
    new Promise((res, rej) => {
      if (document.querySelector(`script[src="${src}"]`)) return res();
      const s = document.createElement("script");
      s.src = src;
      s.onload = res;
      s.onerror = rej;
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
    await addJs(`${base}/addon/edit/closebrackets.min.js`);
    await addJs(`${base}/addon/edit/matchbrackets.min.js`);
    await addJs(`${base}/addon/hint/show-hint.min.js`);
    return window.CodeMirror;
  })();

  return cmLoadingPromise;
}

const ANDROID_JAVA_HINTS = [
  "Activity", "AppCompatActivity", "Bundle", "onCreate(Bundle savedInstanceState)",
  "setContentView(R.layout.activity_main);", "findViewById(R.id.)", "Intent",
  "startActivity(new Intent(this, NextActivity.class));", "Toast.makeText(this, \"\", Toast.LENGTH_SHORT).show();",
  "WebView", "WebSettings", "WebViewClient", "LinearLayout", "TextView", "Button",
  "EditText", "ImageView", "RecyclerView", "SharedPreferences", "setOnClickListener(v -> {",
  "getText().toString()", "setText(\"\")", "Log.d(\"TAG\", \"\");", "override", "public", "private"
];

const ANDROID_XML_HINTS = [
  "android:layout_width=\"match_parent\"", "android:layout_width=\"wrap_content\"",
  "android:layout_height=\"match_parent\"", "android:layout_height=\"wrap_content\"",
  "android:orientation=\"vertical\"", "android:text=\"\"", "android:textSize=\"18sp\"",
  "android:textColor=\"#0F172A\"", "android:background=\"#6D28D9\"", "android:padding=\"16dp\"",
  "android:layout_margin=\"8dp\"", "android:gravity=\"center\"", "android:id=\"@+id/\"",
  "<TextView", "<Button", "<EditText", "<LinearLayout", "<ImageView", "<ScrollView"
];

export async function mountCodeMirror({ hostId, value, filePath, errorLines = [], onChange, onCursor }) {
  const host = document.getElementById(hostId);
  if (!host) return;
  const CM = await ensureCodeMirror();
  if (!document.getElementById(hostId)) return;

  const mode = filePath.endsWith(".java")
    ? "text/x-java"
    : filePath.endsWith(".kt")
    ? "text/x-kotlin"
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
    extraKeys: {
      "Ctrl-Space": (editor) => showAndroidHints(editor, filePath)
    }
  });

  cm.setSize("100%", "100%");
  cm.on("change", () => onChange(cm.getValue()));
  cm.on("cursorActivity", () => {
    const cur = cm.getCursor();
    if (onCursor) onCursor(cur.line + 1, cur.ch + 1);
  });

  // Highlight error lines in red
  errorLines.forEach((ln) => {
    if (ln > 0 && ln <= cm.lineCount()) {
      cm.addLineClass(ln - 1, "background", "bg-rose-500/20");
    }
  });

  window.__wevloCM = cm;
  return cm;
}

export function showAndroidHints(cm, filePath) {
  const CM = window.CodeMirror;
  if (!CM || !cm) return;
  const cur = cm.getCursor();
  const token = cm.getTokenAt(cur);
  const word = token.string.trim();
  const pool = filePath.endsWith(".xml") ? ANDROID_XML_HINTS : ANDROID_JAVA_HINTS;
  const matches = word ? pool.filter((h) => h.toLowerCase().includes(word.toLowerCase())) : pool;
  CM.showHint(cm, () => ({
    list: matches.length ? matches : pool,
    from: CM.Pos(cur.line, token.start),
    to: CM.Pos(cur.line, token.end)
  }), { completeSingle: false });
}

// ======================================================
// ২. Visual XML Layout Designer (AIDE Style)
// ======================================================
export function renderVisualXmlDesigner(xmlStr, selectedIdx = 0) {
  let doc;
  try {
    doc = new DOMParser().parseFromString(xmlStr || "<LinearLayout/>", "text/xml");
    if (doc.querySelector("parsererror")) throw new Error("Invalid XML");
  } catch {
    return `<div class="p-6 text-center text-rose-400 text-xs font-bold">Invalid XML syntax — fix XML tags in Code view first.</div>`;
  }

  const widgets = Array.from(doc.querySelectorAll("TextView, Button, EditText, ImageView, Switch, CheckBox, ProgressBar"));
  const attr = (el, name, def = "") => el.getAttribute("android:" + name) || def;
  const sel = widgets[selectedIdx] || null;

  const previewHtml = widgets.length
    ? widgets
        .map((w, idx) => {
          const tag = w.tagName;
          const txt = attr(w, "text", tag);
          const color = attr(w, "textColor", tag === "Button" ? "#FFFFFF" : "#0F172A");
          const bg = attr(w, "background", tag === "Button" ? "#6D28D9" : "transparent");
          const activeRing = idx === selectedIdx ? "ring-2 ring-amber-400" : "";
          if (tag === "Button") {
            return `<button onclick="selectXmlWidget(${idx})" style="background:${bg};color:${color}" class="w-full py-2.5 px-4 rounded-xl font-bold text-xs shadow ${activeRing}">${txt}</button>`;
          }
          if (tag === "EditText") {
            return `<div onclick="selectXmlWidget(${idx})" class="w-full border border-slate-300 bg-white rounded-xl px-3 py-2 text-xs text-slate-400 text-left ${activeRing}">${attr(w, "hint", txt || "Enter text...")}</div>`;
          }
          if (tag === "ImageView") {
            return `<div onclick="selectXmlWidget(${idx})" class="w-20 h-20 mx-auto rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold ${activeRing}">IMG</div>`;
          }
          if (tag === "Switch" || tag === "CheckBox") {
            return `<label onclick="selectXmlWidget(${idx})" class="flex items-center justify-between w-full px-2 py-1 text-xs font-semibold text-slate-800 ${activeRing}"><span>${txt}</span><input type="checkbox" checked onclick="return false"/></label>`;
          }
          return `<p onclick="selectXmlWidget(${idx})" style="color:${color};background:${bg}" class="text-sm font-bold py-1 px-2 rounded ${activeRing}">${txt}</p>`;
        })
        .join("")
    : `<p class="text-xs text-slate-400">No widgets yet — tap "+ Add Widget" below!</p>`;

  return `
    <div class="flex-1 overflow-y-auto p-3 space-y-3 bg-[#121024]">
      <!-- Add Widget Palette -->
      <div class="flex gap-1.5 overflow-x-auto pb-1">
        ${["TextView", "Button", "EditText", "ImageView", "Switch"]
          .map((t) => `<button onclick="addXmlWidget('${t}')" class="px-3 py-1.5 rounded-xl bg-[#242047] hover:bg-purple-600 text-xs font-bold text-purple-200 shrink-0">+ ${t}</button>`)
          .join("")}
      </div>

      <!-- Android Phone Preview Canvas -->
      <div class="bg-[#1b1836] rounded-3xl p-4 flex justify-center border border-[#2d2854]">
        <div class="w-[240px] min-h-[340px] bg-[#f8f7fc] text-slate-900 rounded-[28px] border-[6px] border-slate-950 shadow-2xl overflow-hidden flex flex-col">
          <div class="bg-purple-700 text-white text-[11px] font-bold px-4 py-2">Android Layout Preview</div>
          <div class="flex-1 p-4 flex flex-col justify-center items-center gap-3">${previewHtml}</div>
        </div>
      </div>

      <!-- Selected Widget Property Editor -->
      ${
        sel
          ? `<div class="bg-[#191632] border border-[#2f2a57] rounded-2xl p-3.5 space-y-2.5 text-xs">
              <div class="flex justify-between items-center"><b class="text-purple-300">Selected: &lt;${sel.tagName}&gt;</b><button onclick="deleteXmlWidget(${selectedIdx})" class="text-rose-400 font-bold">Remove</button></div>
              <div class="grid grid-cols-2 gap-2">
                <div><label class="text-slate-400">Text</label><input value="${attr(sel, "text")}" oninput="updateXmlWidgetProp(${selectedIdx},'text',this.value)" class="w-full mt-1 bg-[#121024] border border-[#342f61] rounded-lg px-2.5 py-1.5 text-white" /></div>
                <div><label class="text-slate-400">Text Color</label><input value="${attr(sel, "textColor", "#0F172A")}" oninput="updateXmlWidgetProp(${selectedIdx},'textColor',this.value)" class="w-full mt-1 bg-[#121024] border border-[#342f61] rounded-lg px-2.5 py-1.5 text-white" /></div>
              </div>
            </div>`
          : ""
      }
    </div>`;
}

// ======================================================
// ৩. GitHub Actions Encrypted Secrets (libsodium)
// ======================================================
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
  const encBytes = window.sodium.crypto_box_seal(binSec, binKey);
  return window.sodium.to_base64(encBytes, window.sodium.base64_variants.ORIGINAL);
}
