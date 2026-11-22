// ======================================================
// File 3/4: ide-editors.js (PART 1 of 2)
// ======================================================

import {
  APP_FRAMEWORKS,
  FRAMEWORK_STARTERS,
  buildFrameworkStarter,
  detectFramework,
  ANDROID_LIBRARIES,
  DEFAULT_ANDROID_TEMPLATES,
  analyzeProjectIssues,
  extractCompilerErrors,
  createActivityTemplates,
  runTerminalCommand,
  generateWorkflowYaml,
  sanitizePackageName,
  sanitizeVersionName,
  sanitizeVersionCode,
  extractAppConfigFromFiles,
  applyAppConfigToFiles
} from "./gradle-analyzer.js";
import {
  mountCodeMirror,
  runEditorToolbarAction,
  showAndroidHints,
  renderVisualXmlDesigner,
  encryptGithubSecret
} from "./aide-features.js";

// ======================================================
// Shared Helpers
// ======================================================
async function ensureJSZip() {
  if (window.JSZip) return window.JSZip;
  await new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
    s.onload = res;
    s.onerror = rej;
    document.head.appendChild(s);
  });
  return window.JSZip;
}

function escapeAttr(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function ensureProjectFiles(proj) {
  if (!proj.files || !Array.isArray(proj.files) || proj.files.length === 0) {
    proj.files = [
      {
        name: "index.html",
        lang: "HTML",
        content:
          proj.html ||
          `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>${proj.name}</title>\n</head>\n<body>\n  <h1>${proj.name}</h1>\n  <p>Built with Wevlo Studio</p>\n</body>\n</html>`
      },
      { name: "styles.css", lang: "CSS", content: proj.css || `body { font-family: sans-serif; padding: 20px; }` },
      { name: "script.js", lang: "JS", content: proj.js || `console.log("Ready!");` }
    ];
  }
  return proj.files;
}

function syncProjectPreviewData(proj) {
  const files = ensureProjectFiles(proj);
  const htmlF = files.find((f) => f.name.endsWith(".html"));
  const cssF = files.find((f) => f.name.endsWith(".css"));
  const jsF = files.find((f) => f.name.endsWith(".js"));
  if (htmlF) proj.html = htmlF.content;
  if (cssF) proj.css = cssF.content;
  if (jsF) proj.js = jsF.content;
}

function isImageFile(path = "") {
  return /\.(png|jpe?g|webp|gif)$/i.test(path);
}

function getFileBadge(path) {
  if (path.endsWith(".java")) return `<span class="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-extrabold inline-flex items-center justify-center shrink-0">J</span>`;
  if (path.endsWith(".kt") || path.endsWith(".kts")) return `<span class="w-5 h-5 rounded-md bg-purple-500/20 text-purple-400 text-[10px] font-extrabold inline-flex items-center justify-center shrink-0">K</span>`;
  if (path.endsWith(".dart")) return `<span class="w-5 h-5 rounded-md bg-sky-500/20 text-sky-400 text-[10px] font-extrabold inline-flex items-center justify-center shrink-0">D</span>`;
  if (path.endsWith(".py")) return `<span class="w-5 h-5 rounded-md bg-yellow-500/20 text-yellow-300 text-[10px] font-extrabold inline-flex items-center justify-center shrink-0">Py</span>`;
  if (path.endsWith(".gradle")) return `<span class="w-5 h-5 rounded-md bg-teal-500/20 text-teal-300 text-[10px] font-extrabold inline-flex items-center justify-center shrink-0">G</span>`;
  if (path.endsWith(".xml") || path.endsWith(".html")) return `<span class="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 text-[9px] font-extrabold inline-flex items-center justify-center shrink-0">&lt;&gt;</span>`;
  if (path.endsWith(".css")) return `<span class="w-5 h-5 rounded-md bg-blue-500/20 text-blue-300 text-[9px] font-extrabold inline-flex items-center justify-center shrink-0">#</span>`;
  if (path.endsWith(".js")) return `<span class="w-5 h-5 rounded-md bg-amber-400/20 text-amber-300 text-[9px] font-extrabold inline-flex items-center justify-center shrink-0">JS</span>`;
  if (path.endsWith(".yaml") || path.endsWith(".yml")) return `<span class="w-5 h-5 rounded-md bg-pink-500/20 text-pink-400 text-[10px] font-extrabold inline-flex items-center justify-center shrink-0">Y</span>`;
  if (path.endsWith(".json")) return `<span class="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold inline-flex items-center justify-center shrink-0">{}</span>`;
  if (path.endsWith(".md")) return `<span class="w-5 h-5 rounded-md bg-cyan-500/20 text-cyan-300 text-[9px] font-extrabold inline-flex items-center justify-center shrink-0">MD</span>`;
  if (isImageFile(path) || path.endsWith(".svg")) return `<span class="w-5 h-5 rounded-md bg-rose-500/20 text-rose-300 text-[9px] font-extrabold inline-flex items-center justify-center shrink-0">IMG</span>`;
  if (path.endsWith(".properties") || path.endsWith(".spec")) return `<span class="w-5 h-5 rounded-md bg-slate-500/25 text-slate-300 text-[10px] font-extrabold inline-flex items-center justify-center shrink-0">P</span>`;
  return `<span class="w-5 h-5 rounded-md bg-slate-500/20 text-slate-400 text-[10px] font-extrabold inline-flex items-center justify-center shrink-0">•</span>`;
}

function toBase64Utf8(str) {
  let bin = "";
  new TextEncoder().encode(str || "").forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

function fromBase64Utf8(b64) {
  const clean = (b64 || "").replace(/\s/g, "");
  if (!clean) return "";
  const binStr = atob(clean);
  const bytes = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

function arrayBufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

function sanitizeRepoName(raw) {
  return (
    (raw || "wevlo-app")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/^-+|-+$/g, "") || "wevlo-app"
  );
}

// ======================================================
// 1. Full-Screen Mobile Web Code Editor
// ======================================================
export function renderProCodeEditor(ctx) {
  const { state, saveProjects, navigate, showToast, render } = ctx;
  const proj = state.projects.find((p) => p.id === state.activeProjectId) || state.projects[0];

  if (!proj) {
    return `
      <div class="max-w-5xl mx-auto px-4 py-6">
        <div class="wevlo-card p-6">
          <div class="flex items-center justify-between mb-8">
            <div class="flex items-center gap-2"><i data-lucide="folder" class="w-5 h-5 text-violet-600"></i><h2 class="font-extrabold text-base">Choose a project</h2></div>
            <button onclick="openNewProjectModal()" class="btn-purple px-4 py-2 rounded-full text-xs font-bold">+ New project</button>
          </div>
          <div class="py-10 text-center space-y-2"><i data-lucide="folder" class="w-10 h-10 mx-auto text-muted"></i><p class="font-bold">No projects yet</p></div>
        </div>
      </div>`;
  }

  const files = ensureProjectFiles(proj);
  if (!state.edActiveFile || !files.some((f) => f.name === state.edActiveFile)) state.edActiveFile = files[0].name;
  const activeFile = files.find((f) => f.name === state.edActiveFile) || files[0];

  function flushWebEditorBuffer() {
    if (window.__wevloCM && window.__wevloCMHostId === "proCmHost" && window.__wevloCMPath === activeFile.name) {
      activeFile.content = window.__wevloCM.getValue();
    }
    syncProjectPreviewData(proj);
    saveProjects();
  }

  window.cmToolbarAct = (act) => runEditorToolbarAction(act, showToast);
  window.saveWebEditorNow = () => {
    flushWebEditorBuffer();
    showToast("Saved!", "success");
  };
  window.previewWebEditorNow = () => {
    flushWebEditorBuffer();
    state.edQuickPreview = true;
    render();
  };
  window.buildWebEditorNow = () => {
    flushWebEditorBuffer();
    navigate("#/build");
  };
  window.toggleEdDrawer = (open) => {
    flushWebEditorBuffer();
    state.edDrawerOpen = open;
    render();
  };
  window.selectEdFile = (name) => {
    flushWebEditorBuffer();
    state.edActiveFile = name;
    state.edDrawerOpen = false;
    render();
  };
  window.createEdNewFile = () => {
    const name = prompt("New file name (e.g. about.html):");
    if (!name || !name.trim()) return;
    flushWebEditorBuffer();
    files.push({ name: name.trim(), lang: name.trim().split(".").pop().toUpperCase(), content: "" });
    state.edActiveFile = name.trim();
    state.edDrawerOpen = false;
    saveProjects();
    render();
  };
  window.importEdFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const existing = files.find((x) => x.name === f.name);
      if (existing) existing.content = r.result;
      else files.push({ name: f.name, lang: f.name.split(".").pop().toUpperCase(), content: r.result });
      state.edActiveFile = f.name;
      state.edDrawerOpen = false;
      syncProjectPreviewData(proj);
      saveProjects();
      render();
      showToast(`Imported ${f.name}!`, "success");
    };
    r.readAsText(f);
    e.target.value = "";
  };
  window.exportEdProject = () => {
    flushWebEditorBuffer();
    const full = `<!DOCTYPE html><html><head><style>${proj.css}</style></head><body>${proj.html}<script>${proj.js}<\/script></body></html>`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([full], { type: "text/html" }));
    a.download = `${proj.name.replace(/\s+/g, "-").toLowerCase()}.html`;
    a.click();
  };
  window.deleteEdFile = (name) => {
    if (files.length <= 1) return showToast("At least 1 file is required!", "error");
    proj.files = files.filter((f) => f.name !== name);
    state.edActiveFile = proj.files[0].name;
    syncProjectPreviewData(proj);
    saveProjects();
    render();
  };
  window.insertWebSymbol = (sym) => {
    const cm = window.__wevloCM;
    if (!cm) return;
    cm.replaceSelection(sym === "TAB" ? "  " : sym);
    cm.focus();
  };

  syncProjectPreviewData(proj);
  const quickPreviewDoc = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${proj.css}</style></head><body>${proj.html}<script>${proj.js}<\/script></body></html>`;

  requestAnimationFrame(() => {
    if (!state.edQuickPreview && !state.edDrawerOpen) {
      mountCodeMirror({
        hostId: "proCmHost",
        value: activeFile.content || "",
        filePath: activeFile.name,
        onChange: (val) => {
          activeFile.content = val;
          syncProjectPreviewData(proj);
          saveProjects();
        },
        onCursor: (ln, col) => {
          const el = document.getElementById("webCursorPos");
          if (el) el.textContent = `${activeFile.lang}  Ln ${ln}, Col ${col}`;
        }
      });
    }
  });

  return `
    <div class="h-[100dvh] w-full flex flex-col bg-[#1b1929] text-slate-100 relative overflow-hidden">
      <div class="bg-white text-slate-900 px-3 h-14 flex items-center justify-between border-b shrink-0">
        <div class="flex items-center gap-2 min-w-0">
          <button onclick="navigate('#/projects')" class="p-1.5 rounded-full hover:bg-slate-100"><i data-lucide="arrow-left" class="w-5 h-5"></i></button>
          <button onclick="toggleEdDrawer(true)" class="p-2 rounded-xl bg-slate-100"><i data-lucide="menu" class="w-4 h-4"></i></button>
          <span class="font-extrabold text-base truncate">${escapeAttr(proj.name)}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <button onclick="saveWebEditorNow()" class="btn-purple p-2 rounded-xl"><i data-lucide="save" class="w-4 h-4"></i></button>
          <button onclick="previewWebEditorNow()" class="p-2 rounded-xl border bg-white"><i data-lucide="play" class="w-4 h-4"></i></button>
          <button onclick="buildWebEditorNow()" class="p-2 rounded-xl border bg-white text-violet-600"><i data-lucide="rocket" class="w-4 h-4"></i></button>
        </div>
      </div>

      <div class="bg-[#242136] px-2 pt-1.5 flex items-center justify-between gap-2 border-b border-[#322e4a] shrink-0">
        <div class="flex items-center gap-1 overflow-x-auto">
          ${files.map((f) => `<button data-fname="${escapeAttr(f.name)}" onclick="selectEdFile(this.dataset.fname)" class="px-3.5 py-2 rounded-t-xl text-xs font-semibold shrink-0 ${f.name === activeFile.name ? "bg-[#282a36] text-white border-t-2 border-violet-500" : "text-slate-400"}">${escapeAttr(f.name)}</button>`).join("")}
        </div>
        <div class="flex items-center gap-1 pb-1 shrink-0">
          <button onclick="cmToolbarAct('all')" class="px-2 py-1 rounded-lg bg-[#342f52] text-[10px] font-bold text-slate-200">All</button>
          <button onclick="cmToolbarAct('clear')" class="px-2 py-1 rounded-lg bg-rose-500/20 text-[10px] font-bold text-rose-300">Clear</button>
          <button onclick="cmToolbarAct('paste')" class="px-2 py-1 rounded-lg bg-emerald-500/20 text-[10px] font-bold text-emerald-300">Paste</button>
          <button onclick="cmToolbarAct('copy')" class="px-2 py-1 rounded-lg bg-[#342f52] text-[10px] font-bold text-slate-200">Copy</button>
        </div>
      </div>

      <div id="proCmHost" class="flex-1 min-h-0 overflow-hidden bg-[#282a36]"></div>

      <div class="bg-[#242136] px-2 py-2 flex items-center gap-1.5 overflow-x-auto border-t border-[#322e4a] shrink-0">
        <button onclick="cmToolbarAct('undo')" class="px-2.5 h-9 rounded-xl bg-[#2f2b47] text-amber-300 text-xs font-bold shrink-0">↶</button>
        <button onclick="cmToolbarAct('redo')" class="px-2.5 h-9 rounded-xl bg-[#2f2b47] text-amber-300 text-xs font-bold shrink-0">↷</button>
        ${[["Tab", "TAB"], ["{ }", "{}"], ["( )", "()"], ["[ ]", "[]"], ['" "', '""'], ["< >", "<>"], [";", ";"]].map(([lbl, val]) => `<button onclick='insertWebSymbol(${JSON.stringify(val)})' class="px-3 h-9 rounded-xl bg-[#2f2b47] text-white font-mono text-xs font-bold shrink-0">${lbl}</button>`).join("")}
      </div>
      <div class="bg-[#13111d] px-3 py-1.5 flex justify-between text-[11px] text-slate-400 shrink-0">
        <span id="webCursorPos">${activeFile.lang}  Ln 1, Col 1</span>
        <span class="text-emerald-400 font-semibold">● Ready</span>
      </div>
      ${state.edDrawerOpen ? `<div class="absolute inset-0 z-40 flex"><div class="w-72 bg-white text-slate-900 h-full flex flex-col justify-between p-4 shadow-2xl"><div class="space-y-4 overflow-y-auto"><div class="flex items-center justify-between"><span class="font-extrabold text-sm">${escapeAttr(proj.name)}</span><button onclick="toggleEdDrawer(false)" class="p-1.5 rounded-xl bg-slate-100"><i data-lucide="x" class="w-4 h-4"></i></button></div><div class="grid grid-cols-3 gap-1.5 text-center text-[10px] font-bold"><button onclick="createEdNewFile()" class="p-2 rounded-xl border">New file</button><label class="p-2 rounded-xl border cursor-pointer">Import<input type="file" class="hidden" onchange="importEdFile(event)" /></label><button onclick="exportEdProject()" class="p-2 rounded-xl border">Export</button></div><div class="space-y-1.5">${files.map((f) => `<div class="flex items-center justify-between px-3 py-2 rounded-xl ${f.name === activeFile.name ? "bg-violet-50 text-violet-800 font-bold" : ""}"><button data-fname="${escapeAttr(f.name)}" onclick="selectEdFile(this.dataset.fname)" class="text-xs flex-1 text-left">${escapeAttr(f.name)}</button><button data-fname="${escapeAttr(f.name)}" onclick="deleteEdFile(this.dataset.fname)" class="text-rose-500 text-xs">×</button></div>`).join("")}</div></div></div><div onclick="toggleEdDrawer(false)" class="flex-1 bg-black/40"></div></div>` : ""}
      ${state.edQuickPreview ? `<div class="fixed inset-0 z-50 bg-white text-slate-900 flex flex-col"><div class="h-14 px-4 border-b flex items-center justify-between"><button onclick="state.edQuickPreview=false; render()" class="font-bold text-sm">← Back</button><span class="font-bold text-xs text-violet-700">${escapeAttr(proj.name)}</span><span></span></div><iframe class="flex-1 w-full bg-white" srcdoc="${escapeAttr(quickPreviewDoc)}"></iframe></div>` : ""}
    </div>`;
}

// ======================================================
// 2. Multi-Language GitHub Build + Full AIDE IDE Tree Helpers
// ======================================================
function buildNestedTree(blobs) {
  const root = { folders: {}, files: [] };
  for (const item of blobs) {
    const parts = item.path.split("/");
    let cur = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const f = parts[i];
      if (!cur.folders[f]) cur.folders[f] = { folders: {}, files: [] };
      cur = cur.folders[f];
    }
    cur.files.push({ name: parts[parts.length - 1], path: item.path, sha: item.sha });
  }
  return root;
}

function renderFolderTreeHtml(node, prefix, expandedMap, activePath, dirtyMap = {}, repoFull = "") {
  let html = "";
  for (const fname of Object.keys(node.folders).sort()) {
    const fullFolder = prefix ? `${prefix}/${fname}` : fname;
    const isOpen = !!expandedMap[fullFolder];
    const folderColor = fname === "res" || fname === "assets" ? "text-amber-400" : "text-sky-400";
    html += `
      <div>
        <div class="flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-white/5">
          <button data-folder="${escapeAttr(fullFolder)}" onclick="toggleGhFolder(this.dataset.folder)" class="flex items-center gap-2 min-w-0 flex-1 text-left">
            <span class="text-slate-400 text-[10px] w-3">${isOpen ? "▾" : "▸"}</span>
            <i data-lucide="folder" class="w-4 h-4 ${folderColor} shrink-0"></i>
            <span class="text-sm font-medium text-slate-100 truncate">${escapeAttr(fname)}</span>
          </button>
          <button data-path="${escapeAttr(fullFolder)}" onclick="openGhItemMenu('folder', this.dataset.path)" class="text-slate-400 hover:text-white p-1"><i data-lucide="more-vertical" class="w-4 h-4"></i></button>
        </div>
        ${isOpen ? `<div class="pl-3.5 border-l border-[#2c2750] ml-3">${renderFolderTreeHtml(node.folders[fname], fullFolder, expandedMap, activePath, dirtyMap, repoFull)}</div>` : ""}
      </div>`;
  }
  for (const file of node.files.sort((a, b) => a.name.localeCompare(b.name))) {
    const active = file.path === activePath;
    const isDirty = !!dirtyMap[`${repoFull}::${file.path}`];
    html += `
      <div class="flex items-center justify-between py-1.5 px-2.5 rounded-xl ${active ? "bg-violet-600/35 text-white font-bold shadow-sm" : "hover:bg-white/5 text-slate-200"}">
        <button data-path="${escapeAttr(file.path)}" onclick="openGhIdeFile(this.dataset.path)" class="flex items-center gap-2.5 min-w-0 flex-1 text-left">
          ${getFileBadge(file.name)}
          <span class="text-sm truncate">${escapeAttr(file.name)}</span>
          ${isDirty ? `<span class="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Unsaved changes"></span>` : ""}
        </button>
        <button data-path="${escapeAttr(file.path)}" onclick="openGhItemMenu('file', this.dataset.path)" class="text-slate-400 hover:text-white p-1"><i data-lucide="more-vertical" class="w-4 h-4"></i></button>
      </div>`;
  }
  return html;
}
// ======================================================
// File 3/4: ide-editors.js (PART 2A — paste directly below PART 1)
// ======================================================

export function renderProGithubBuild(ctx) {
  const { state, ghFetch, showToast, render, navigate, confirmLogout, loginWithGithub, loadGithubRepos } = ctx;

  if (!state.ghExpandedFolders) {
    state.ghExpandedFolders = {
      app: true,
      "app/src": true,
      "app/src/main": true,
      "app/src/main/java": true,
      "app/src/main/res": true,
      android: true,
      "android/app": true,
      "android/app/src": true,
      "android/app/src/main": true,
      lib: true,
      www: true,
      ".github": true,
      ".github/workflows": true
    };
  }
  if (!state.ghOpenTabs) state.ghOpenTabs = [];
  if (!state.ghDrafts) state.ghDrafts = {};
  if (!state.ghDirtyMap) state.ghDirtyMap = {};
  if (!state.repoAppConfigs) state.repoAppConfigs = {};
  if (!state.ghBuildVariant) state.ghBuildVariant = "debug";
  if (!state.ghGradleTask) state.ghGradleTask = "assembleDebug";
  if (!state.ghOutputSubTab) state.ghOutputSubTab = "output";
  if (!state.ghTerminalLines) state.ghTerminalLines = ["$ Multi-Language AIDE Terminal Ready — type 'help' or 'gradle check'."];
  if (!state.ghLogcat) state.ghLogcat = JSON.parse(localStorage.getItem("wevlo_logcat") || "[]");
  if (!state.activeBuild) state.activeBuild = JSON.parse(localStorage.getItem("wevlo_active_build") || "null");
  if (state.ghAutoSyncYaml === undefined) state.ghAutoSyncYaml = false;
  if (!state.newRepoPriv) state.newRepoPriv = "private";
  if (!state.newRepoLang) state.newRepoLang = "java";
  if (state.newRepoStarter === undefined) state.newRepoStarter = true;
  if (state.xmlSelIdx === undefined) state.xmlSelIdx = 0;

  function draftKey(path, repoFull = state.selectedGhRepo) {
    return `${repoFull || ""}::${path || ""}`;
  }

  function flushActiveCmDraft() {
    if (
      window.__wevloCM &&
      window.__wevloCMHostId === "ghCmHost" &&
      window.__wevloCMPath &&
      state.ghIdeActivePath === window.__wevloCMPath &&
      !isImageFile(window.__wevloCMPath)
    ) {
      const liveVal = window.__wevloCM.getValue();
      const k = draftKey(window.__wevloCMPath);
      if (state.ghDirtyMap[k] || liveVal !== state.ghIdeContent) {
        state.ghIdeContent = liveVal;
        state.ghDrafts[k] = liveVal;
        if (liveVal !== state.ghLastSavedContent) {
          state.ghDirtyMap[k] = true;
          state.ghIdeDirty = true;
        }
      }
    }
  }

  function getRepoDirtyPaths(repoFull = state.selectedGhRepo) {
    const prefix = `${repoFull || ""}::`;
    return Object.keys(state.ghDirtyMap)
      .filter((k) => k.startsWith(prefix) && state.ghDirtyMap[k])
      .map((k) => k.slice(prefix.length));
  }

  function getRepoAppConfig(repoFull = state.selectedGhRepo) {
    if (!repoFull) return { appName: "", packageName: "", versionName: "1.0.0", versionCode: "1", loaded: false };
    if (!state.repoAppConfigs[repoFull]) {
      const repoSlug = (repoFull.split("/")[1] || "app").toLowerCase().replace(/[^a-z0-9]/g, "") || "app";
      const prefix = sanitizePackageName(state.profile?.pkgPrefix || "com.wevlo", "com.wevlo");
      state.repoAppConfigs[repoFull] = {
        appName: repoFull.split("/")[1] || "MyApp",
        packageName: `${prefix}.${repoSlug}`,
        versionName: "1.0.0",
        versionCode: "1",
        loaded: false
      };
    }
    return state.repoAppConfigs[repoFull];
  }

  function persistGhSession() {
    if (!state.selectedGhRepo) return;
    localStorage.setItem(
      "wevlo_gh_session",
      JSON.stringify({
        repo: state.selectedGhRepo,
        branch: state.ghBranch || "main",
        activePath: state.ghIdeActivePath || "",
        openTabs: state.ghOpenTabs || [],
        manualFw: state.ghManualFw || null
      })
    );
  }

  function addLogcat(level, tag, msg) {
    state.ghLogcat.unshift({ time: new Date().toLocaleTimeString(), level, tag, msg });
    state.ghLogcat = state.ghLogcat.slice(0, 60);
    localStorage.setItem("wevlo_logcat", JSON.stringify(state.ghLogcat));
  }

  function saveActiveBuild() {
    if (state.activeBuild) localStorage.setItem("wevlo_active_build", JSON.stringify(state.activeBuild));
    else localStorage.removeItem("wevlo_active_build");
  }

  function appendBuildLog(msg, isErr = false) {
    if (!state.activeBuild) return;
    state.activeBuild.logs.push({ time: new Date().toLocaleTimeString(), msg, isErr });
    saveActiveBuild();
    addLogcat(isErr ? "E" : "I", "CloudCI", msg);
  }

  async function ghPutFileSafe(repoFull, path, contentStr, commitMsg, branch, isBase64 = false) {
    const cleanPath = (path || "").replace(/^\/+/, "");
    let sha;
    try {
      sha = (await ghFetch(`/repos/${repoFull}/contents/${cleanPath}?ref=${encodeURIComponent(branch)}`)).sha;
    } catch {}
    let encodedContent;
    if (typeof contentStr === "string" && contentStr.startsWith("__BASE64__:")) {
      encodedContent = contentStr.slice("__BASE64__:".length);
    } else {
      encodedContent = isBase64 ? contentStr : toBase64Utf8(contentStr);
    }
    return ghFetch(`/repos/${repoFull}/contents/${cleanPath}`, {
      method: "PUT",
      body: JSON.stringify({
        message: commitMsg || `Update ${cleanPath}`,
        content: encodedContent,
        branch,
        ...(sha ? { sha } : {})
      })
    });
  }

  if (state.activeBuild?.status === "running" && !window.__wevloBuildPolling) {
    window.__wevloBuildPolling = setInterval(async () => {
      if (!state.activeBuild || state.activeBuild.status !== "running" || !state.githubToken) {
        clearInterval(window.__wevloBuildPolling);
        window.__wevloBuildPolling = null;
        return;
      }
      try {
        const repoFull = state.activeBuild.repoFull;
        const latest = (await ghFetch(`/repos/${repoFull}/actions/runs?per_page=1`)).workflow_runs?.[0];
        if (!latest) return;
        const runCreatedMs = new Date(latest.created_at).getTime();
        if (state.activeBuild.createdAtMs && runCreatedMs < state.activeBuild.createdAtMs) {
          return;
        }
        state.activeBuild.runUrl = latest.html_url;
        const job = (await ghFetch(`/repos/${repoFull}/actions/runs/${latest.id}/jobs`)).jobs?.[0];
        if (job) {
          state.activeBuild.steps = (job.steps || []).map((s) => ({
            name: s.name,
            status: s.status,
            conclusion: s.conclusion
          }));
          const done = state.activeBuild.steps.filter((s) => s.status === "completed").length;
          state.activeBuild.progress = Math.min(
            92,
            Math.max(25, Math.round((done / Math.max(state.activeBuild.steps.length, 1)) * 90))
          );
        }
        if (latest.status === "completed") {
          clearInterval(window.__wevloBuildPolling);
          window.__wevloBuildPolling = null;
          state.activeBuild.progress = 100;
          if (latest.conclusion === "success") {
            state.activeBuild.status = "success";
            appendBuildLog("Cloud build succeeded!");
            try {
              const rel = await ghFetch(`/repos/${repoFull}/releases/latest`);
              const asset = rel.assets?.find((a) => a.name.endsWith(".apk") || a.name.endsWith(".aab"));
              if (asset) {
                state.activeBuild.apkApiUrl = asset.url;
                state.activeBuild.apkUrl = asset.browser_download_url;
                state.activeBuild.apkName = asset.name;
                state.activeBuild.apkSize = (asset.size / 1048576).toFixed(2) + " MB";
              }
            } catch {}
            showToast("APK Build succeeded!", "success");
          } else {
            state.activeBuild.status = "failed";
            const failedStep = (state.activeBuild.steps || []).find((s) => s.conclusion === "failure");
            state.activeBuild.errorSummary = failedStep
              ? `Failed at: "${failedStep.name}"`
              : `Build failed (${latest.conclusion})`;
            appendBuildLog(state.activeBuild.errorSummary, true);
            try {
              const logAsset = (await ghFetch(`/repos/${repoFull}/releases/tags/log-latest`)).assets?.find(
                (a) => a.name === "build-output.log"
              );
              if (logAsset) {
                const logText = await (
                  await fetch(logAsset.url, {
                    headers: {
                      Authorization: "Bearer " + state.githubToken,
                      Accept: "application/octet-stream"
                    },
                    cache: "no-store"
                  })
                ).text();
                state.activeBuild.rawLogText = logText;
                state.activeBuild.compilerErrors = extractCompilerErrors(logText);
              }
            } catch {}
            showToast("Build Failed! Check Output / Problems.", "error");
          }
          saveActiveBuild();
          if (state.route === "#/github-build" && state.ghIdeOpen) render();
          return;
        }
        saveActiveBuild();
        if (state.route === "#/github-build" && state.ghIdeOpen) {
          if (state.ghMobileTab === "editor") {
            const bannerTxt = document.getElementById("buildStatusBannerText");
            if (bannerTxt) {
              bannerTxt.textContent = `Building ${(state.activeBuild.framework || "").toUpperCase()} (${state.activeBuild.progress}%)...`;
            }
          } else {
            render();
          }
        }
      } catch {}
    }, 6000);
  }

  window.cmToolbarAct = (act) => runEditorToolbarAction(act, showToast);

  window.downloadBuiltApkAsset = async (apiUrl, fileName, browserUrl) => {
    try {
      showToast("Downloading " + fileName + "...", "info");
      const res = await fetch(apiUrl, {
        headers: { Authorization: "Bearer " + state.githubToken, Accept: "application/octet-stream" }
      });
      if (!res.ok) throw new Error();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(await res.blob());
      a.download = fileName;
      a.click();
    } catch {
      window.open(browserUrl, "_blank");
    }
  };

  window.loadRepoAppConfig = async (silent = false) => {
    if (!state.githubToken || !state.selectedGhRepo) return;
    const repoFull = state.selectedGhRepo;
    const branch = state.ghBranch || "main";
    const files = state.ghTreeFiles || [];
    const activeFw = state.ghManualFw || detectFramework(files);
    const candidatePaths = [
      "app/build.gradle.kts",
      "app/build.gradle",
      "app/src/main/res/values/strings.xml",
      "app/src/main/AndroidManifest.xml",
      "pubspec.yaml",
      "android/app/build.gradle.kts",
      "android/app/build.gradle",
      "android/app/src/main/AndroidManifest.xml",
      "capacitor.config.json",
      "package.json",
      "buildozer.spec"
    ].filter((p) => files.some((f) => f.path === p));

    const filesMap = {};
    for (const p of candidatePaths) {
      const k = draftKey(p, repoFull);
      if (state.ghDirtyMap[k] && state.ghDrafts[k] !== undefined) {
        filesMap[p] = state.ghDrafts[k];
      } else {
        try {
          const data = await ghFetch(`/repos/${repoFull}/contents/${p}?ref=${encodeURIComponent(branch)}`);
          filesMap[p] = fromBase64Utf8(data.content || "");
        } catch {}
      }
    }
    const parsed = extractAppConfigFromFiles(filesMap, activeFw);
    const cur = getRepoAppConfig(repoFull);
    state.repoAppConfigs[repoFull] = {
      appName: parsed.appName || cur.appName || repoFull.split("/")[1],
      packageName: parsed.packageName || cur.packageName,
      versionName: parsed.versionName || cur.versionName || "1.0.0",
      versionCode: parsed.versionCode || cur.versionCode || "1",
      loaded: true
    };
    if (!silent) {
      showToast("Loaded App Name, Package & Version from repo!", "success");
      render();
    }
  };

  window.updateRepoAppConfigField = (field, val) => {
    const cfg = getRepoAppConfig(state.selectedGhRepo);
    cfg[field] = val;
  };

  window.applyRepoAppConfig = async () => {
    if (!state.githubToken || !state.selectedGhRepo) return;
    const repoFull = state.selectedGhRepo;
    const branch = state.ghBranch || "main";
    const files = state.ghTreeFiles || [];
    const activeFw = state.ghManualFw || detectFramework(files);
    const cfg = getRepoAppConfig(repoFull);

    const cleanPkg = sanitizePackageName(cfg.packageName, "");
    if (!cleanPkg) {
      return showToast("Invalid Package Name! Example: com.mycompany.myapp", "error");
    }
    cfg.packageName = cleanPkg;
    cfg.versionName = sanitizeVersionName(cfg.versionName, "1.0.0");
    cfg.versionCode = String(sanitizeVersionCode(cfg.versionCode, 1));

    const candidatePaths = [
      "app/build.gradle.kts",
      "app/build.gradle",
      "app/src/main/res/values/strings.xml",
      "app/src/main/AndroidManifest.xml",
      "pubspec.yaml",
      "android/app/build.gradle.kts",
      "android/app/build.gradle",
      "android/app/src/main/AndroidManifest.xml",
      "capacitor.config.json",
      "package.json",
      "buildozer.spec"
    ].filter((p) => files.some((f) => f.path === p));

    try {
      showToast("Applying App Name, Package & Version...", "info");
      const filesMap = {};
      for (const p of candidatePaths) {
        try {
          const data = await ghFetch(`/repos/${repoFull}/contents/${p}?ref=${encodeURIComponent(branch)}`);
          filesMap[p] = fromBase64Utf8(data.content || "");
        } catch {}
      }
      const updates = applyAppConfigToFiles(filesMap, cfg, activeFw);
      const changedPaths = Object.keys(updates);
      if (changedPaths.length === 0) {
        showToast("Config already matches repo files!", "info");
        return render();
      }
      for (const p of changedPaths) {
        await ghPutFileSafe(repoFull, p, updates[p], `Update app config (${cfg.packageName} v${cfg.versionName})`, branch);
        const k = draftKey(p, repoFull);
        delete state.ghDrafts[k];
        delete state.ghDirtyMap[k];
        if (state.ghIdeActivePath === p) {
          state.ghIdeContent = updates[p];
          state.ghLastSavedContent = updates[p];
          state.ghIdeDirty = false;
        }
      }
      addLogcat("I", "AppConfig", `Updated ${changedPaths.join(", ")} -> ${cfg.packageName} v${cfg.versionName} (${cfg.versionCode})`);
      await window.refreshGhTree();
      showToast(`Updated ${changedPaths.length} file(s) on GitHub!`, "success");
    } catch (e) {
      showToast("Failed to apply config: " + e.message, "error");
    }
  };

  window.resetRepairWorkflowYaml = async () => {
    if (!state.githubToken || !state.selectedGhRepo) return;
    const branch = state.ghBranch || "main";
    const task = state.ghGradleTask || "assembleDebug";
    const activeFw = state.ghManualFw || detectFramework(state.ghTreeFiles || []);
    const useCloudSign = !!localStorage.getItem("wevlo_cloud_signed_" + state.selectedGhRepo);
    const cfg = getRepoAppConfig(state.selectedGhRepo);
    try {
      showToast("Repairing .github/workflows/wevlo-build.yml...", "info");
      const wfContent = generateWorkflowYaml(
        branch,
        task,
        cfg.versionName || "1.0",
        useCloudSign,
        activeFw,
        cfg.packageName || "com.wevlo.app"
      );
      await ghPutFileSafe(state.selectedGhRepo, ".github/workflows/wevlo-build.yml", wfContent, `Reset ${activeFw} workflow`, branch);
      const k = draftKey(".github/workflows/wevlo-build.yml");
      delete state.ghDrafts[k];
      delete state.ghDirtyMap[k];
      if (state.ghIdeActivePath === ".github/workflows/wevlo-build.yml") {
        state.ghIdeContent = wfContent;
        state.ghLastSavedContent = wfContent;
        state.ghIdeDirty = false;
      }
      await window.refreshGhTree();
      showToast("Workflow YAML repaired successfully!", "success");
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  window.saveAllGhDirtyFiles = async () => {
    if (!state.selectedGhRepo) return 0;
    flushActiveCmDraft();
    const repoFull = state.selectedGhRepo;
    const branch = state.ghBranch || "main";
    const dirtyPaths = getRepoDirtyPaths(repoFull);
    if (dirtyPaths.length === 0) return 0;

    let savedCount = 0;
    for (const p of dirtyPaths) {
      if (isImageFile(p)) continue;
      const k = draftKey(p, repoFull);
      const content = state.ghDrafts[k] !== undefined ? state.ghDrafts[k] : p === state.ghIdeActivePath ? state.ghIdeContent : "";
      const res = await ghPutFileSafe(repoFull, p, content, `Update ${p}`, branch);
      delete state.ghDrafts[k];
      delete state.ghDirtyMap[k];
      if (p === state.ghIdeActivePath) {
        state.ghIdeFileSha = res.content?.sha;
        state.ghLastSavedContent = content;
        state.ghIdeDirty = false;
      }
      addLogcat("I", "GitCommit", `Committed ${p}`);
      savedCount++;
    }
    return savedCount;
  };

  window.startPersistentIdeBuild = async () => {
    if (!state.githubToken) return showToast("Please connect GitHub first!", "error");
    const repoFull = state.selectedGhRepo;
    const branch = state.ghBranch || "main";
    const task = state.ghGradleTask || "assembleDebug";
    const activeFw = state.ghManualFw || detectFramework(state.ghTreeFiles || []);
    const cfg = getRepoAppConfig(repoFull);

    let savedBeforeBuild = 0;
    try {
      savedBeforeBuild = await window.saveAllGhDirtyFiles();
    } catch (e) {
      return showToast("Failed to save modified files: " + e.message, "error");
    }

    state.activeBuild = {
      repoFull,
      branch,
      task,
      framework: activeFw,
      status: "running",
      progress: 15,
      createdAtMs: Date.now() - 15000,
      startedAt: new Date().toLocaleTimeString(),
      logs: [
        {
          time: new Date().toLocaleTimeString(),
          msg: `Starting ${activeFw.toUpperCase()} build (${task})...${savedBeforeBuild ? ` Pushed ${savedBeforeBuild} edited file(s).` : ""}`,
          isErr: false
        }
      ],
      steps: [],
      compilerErrors: [],
      apkUrl: "",
      apkApiUrl: "",
      errorSummary: ""
    };
    saveActiveBuild();
    state.ghMobileTab = "output";
    state.ghOutputSubTab = "output";
    render();

    try {
      const wfFiles = (state.ghTreeFiles || []).filter(
        (f) => f.path.startsWith(".github/workflows/") && (f.path.endsWith(".yml") || f.path.endsWith(".yaml"))
      );
      const hasYaml = wfFiles.length > 0;
      if (state.ghAutoSyncYaml || !hasYaml) {
        const useCloudSign = !!localStorage.getItem("wevlo_cloud_signed_" + repoFull);
        const wfContent = generateWorkflowYaml(
          branch,
          task,
          cfg.versionName || "1.0",
          useCloudSign,
          activeFw,
          cfg.packageName || "com.wevlo.app"
        );
        await ghPutFileSafe(repoFull, ".github/workflows/wevlo-build.yml", wfContent, `Run ${activeFw} ${task}`, branch);
        appendBuildLog("Workflow synced & pushed to GitHub Actions. Polling steps...");
      } else {
        const targetWf = wfFiles[0].path.split("/").pop();
        try {
          await ghFetch(`/repos/${repoFull}/actions/workflows/${targetWf}/dispatches`, {
            method: "POST",
            body: JSON.stringify({ ref: branch })
          });
          appendBuildLog(`Triggered custom workflow (${targetWf})...`);
        } catch (dispErr) {
          if (savedBeforeBuild > 0) {
            appendBuildLog(`Push triggered GitHub Actions (${targetWf}). Polling steps...`);
          } else {
            throw new Error(
              `${targetWf} could not be triggered manually (${dispErr.message}). Add 'workflow_dispatch:' under 'on:' in ${targetWf} or edit a file.`
            );
          }
        }
      }
      render();
    } catch (e) {
      state.activeBuild.status = "failed";
      state.activeBuild.errorSummary = e.message;
      appendBuildLog(e.message, true);
      saveActiveBuild();
      render();
    }
  };

  window.setupMissingFilesForLang = async (fw) => {
    if (!state.selectedGhRepo) return;
    const cfg = getRepoAppConfig(state.selectedGhRepo);
    const starter = buildFrameworkStarter(fw, cfg);
    const branch = state.ghBranch || "main";
    const existingPaths = (state.ghTreeFiles || []).map((f) => f.path);
    try {
      showToast(`Setting up ${fw.toUpperCase()} structure...`, "info");
      for (const [p, c] of Object.entries(starter)) {
        if (!existingPaths.includes(p)) await ghPutFileSafe(state.selectedGhRepo, p, c, `Add ${p} for ${fw}`, branch);
      }
      await window.refreshGhTree();
      showToast(`${fw.toUpperCase()} files auto-configured!`, "success");
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  window.downloadBuildReportTxt = () => {
    const b = state.activeBuild;
    if (!b) return;
    const text =
      b.rawLogText ||
      [
        `=== WEVLO REPORT ===`,
        `Repo: ${b.repoFull} | Framework: ${b.framework} | Status: ${b.status}`,
        b.errorSummary || "",
        ...(b.logs || []).map((l) => `[${l.time}] ${l.msg}`)
      ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    a.download = `build-report-${Date.now()}.txt`;
    a.click();
  };

  window.exportLogcatTxt = () => {
    const txt = (state.ghLogcat || []).map((l) => `[${l.time}] ${l.level}/${l.tag}: ${l.msg}`).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([txt], { type: "text/plain" }));
    a.download = "logcat.txt";
    a.click();
  };

  window.jumpToProblemLine = async (filePath, lineNum) => {
    const match = (state.ghTreeFiles || []).find((f) => f.path.endsWith(filePath)) || { path: filePath };
    state.pendingJumpLine = lineNum || 1;
    state.ghEditorView = "code";
    await window.openGhIdeFile(match.path, true);
  };

  window.autoFixProblem = async (idx) => {
    flushActiveCmDraft();
    const activeFw = state.ghManualFw || detectFramework(state.ghTreeFiles || []);
    const issues = analyzeProjectIssues({
      treeFiles: state.ghTreeFiles || [],
      activePath: state.ghIdeActivePath || "",
      activeContent: state.ghIdeContent || "",
      branch: state.ghBranch || "main",
      compilerErrors: state.activeBuild?.compilerErrors || [],
      framework: activeFw
    });
    const prob = issues[idx];
    if (!prob || !prob.fixPath || !prob.fixContent) return;
    try {
      showToast(`Fixing ${prob.fixPath}...`, "info");
      await ghPutFileSafe(state.selectedGhRepo, prob.fixPath, prob.fixContent, `Auto-fix ${prob.fixPath}`, state.ghBranch || "main");
      const k = draftKey(prob.fixPath);
      delete state.ghDrafts[k];
      delete state.ghDirtyMap[k];
      if (state.ghIdeActivePath === prob.fixPath) {
        state.ghIdeContent = prob.fixContent;
        state.ghLastSavedContent = prob.fixContent;
        state.ghIdeDirty = false;
      }
      if (state.activeBuild) {
        state.activeBuild.compilerErrors = [];
        saveActiveBuild();
      }
      showToast(`Fixed ${prob.fixPath}!`, "success");
      await window.refreshGhTree();
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  window.confirmCreateActivityWizard = async () => {
    const rawName = document.getElementById("wizActName")?.value.trim();
    const cfg = getRepoAppConfig(state.selectedGhRepo);
    const pkg = sanitizePackageName(document.getElementById("wizPkgName")?.value.trim(), cfg.packageName || "com.wevlo.app");
    if (!rawName) return showToast("Please enter an Activity name!", "error");
    const { className, layoutName, javaCode, xmlCode } = createActivityTemplates(rawName, pkg);
    const branch = state.ghBranch || "main";
    const pkgPath = pkg.replace(/\./g, "/");
    try {
      showToast(`Creating ${className} + XML + Manifest...`, "info");
      await ghPutFileSafe(state.selectedGhRepo, `app/src/main/java/${pkgPath}/${className}.java`, javaCode, `Add ${className}`, branch);
      await ghPutFileSafe(state.selectedGhRepo, `app/src/main/res/layout/${layoutName}.xml`, xmlCode, `Add ${layoutName}.xml`, branch);
      try {
        const manRes = await ghFetch(`/repos/${state.selectedGhRepo}/contents/app/src/main/AndroidManifest.xml?ref=${encodeURIComponent(branch)}`);
        let manTxt = fromBase64Utf8(manRes.content);
        if (!manTxt.includes(`.${className}`) && manTxt.includes("</application>")) {
          manTxt = manTxt.replace("</application>", `    <activity android:name=".${className}" android:exported="false" />\n    </application>`);
          await ghPutFileSafe(state.selectedGhRepo, "app/src/main/AndroidManifest.xml", manTxt, `Register ${className}`, branch);
        }
      } catch {}
      state.ghWizardOpen = false;
      showToast(`${className} created!`, "success");
      await window.refreshGhTree();
      await window.openGhIdeFile(`app/src/main/java/${pkgPath}/${className}.java`, true);
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  window.openLibraryManager = async () => {
    state.ghLibModalOpen = true;
    state.ghGradleFileText = "";
    const hasKts = (state.ghTreeFiles || []).some((f) => f.path === "app/build.gradle.kts");
    state.ghGradleFilePath = hasKts ? "app/build.gradle.kts" : "app/build.gradle";
    render();
    try {
      const f = await ghFetch(`/repos/${state.selectedGhRepo}/contents/${state.ghGradleFilePath}?ref=${encodeURIComponent(state.ghBranch || "main")}`);
      state.ghGradleFileText = fromBase64Utf8(f.content);
    } catch {
      state.ghGradleFileText = DEFAULT_ANDROID_TEMPLATES["app/build.gradle"];
    }
    render();
  };

  window.addGradleLibrary = async (libId) => {
    const lib = ANDROID_LIBRARIES.find((l) => l.id === libId);
    if (!lib) return;
    const gPath = state.ghGradleFilePath || "app/build.gradle";
    const isKts = gPath.endsWith(".kts");
    const implLine = isKts
      ? lib.impl.replace(/implementation\s+'([^']+)'/g, 'implementation("$1")')
      : lib.impl;
    let txt = state.ghGradleFileText || DEFAULT_ANDROID_TEMPLATES["app/build.gradle"];
    const firstCoord = implLine.split("\n")[0].match(/['"]([^'"]+)['"]/)?.[1] || implLine.split("\n")[0];
    if (txt.includes(firstCoord)) return showToast("Library already added!", "info");
    txt = txt.includes("dependencies {")
      ? txt.replace("dependencies {", `dependencies {\n    ${implLine}`)
      : txt + `\ndependencies {\n    ${implLine}\n}\n`;
    try {
      await ghPutFileSafe(state.selectedGhRepo, gPath, txt, `Add ${lib.name}`, state.ghBranch || "main");
      state.ghGradleFileText = txt;
      const k = draftKey(gPath);
      delete state.ghDrafts[k];
      delete state.ghDirtyMap[k];
      if (state.ghIdeActivePath === gPath) {
        state.ghIdeContent = txt;
        state.ghLastSavedContent = txt;
        state.ghIdeDirty = false;
      }
      showToast(`Added ${lib.name}!`, "success");
      render();
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  window.enableCloudReleaseSigning = async () => {
    const ksRaw = localStorage.getItem("wevlo_signing_key");
    if (!ksRaw) {
      state.ghKeystoreModalOpen = true;
      return render();
    }
    const ks = JSON.parse(ksRaw);
    const pass = prompt("Confirm Keystore Password to encrypt into GitHub Secrets:");
    if (!pass || pass.length < 6) return showToast("Password must be at least 6 characters!", "error");
    try {
      const pk = await ghFetch(`/repos/${state.selectedGhRepo}/actions/secrets/public-key`);
      await ghFetch(`/repos/${state.selectedGhRepo}/actions/secrets/WEVLO_KEY_PASS`, {
        method: "PUT",
        body: JSON.stringify({ encrypted_value: await encryptGithubSecret(pk.key, pass), key_id: pk.key_id })
      });
      await ghFetch(`/repos/${state.selectedGhRepo}/actions/secrets/WEVLO_KEY_ALIAS`, {
        method: "PUT",
        body: JSON.stringify({ encrypted_value: await encryptGithubSecret(pk.key, ks.alias || "key0"), key_id: pk.key_id })
      });
      localStorage.setItem("wevlo_cloud_signed_" + state.selectedGhRepo, "1");
      showToast("Cloud Release Signing enabled!", "success");
      render();
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  function updateXmlDomAndSync(mutator) {
    try {
      const doc = new DOMParser().parseFromString(state.ghIdeContent || "<LinearLayout/>", "text/xml");
      mutator(doc);
      const next = new XMLSerializer().serializeToString(doc);
      state.ghIdeContent = next;
      state.ghIdeDirty = true;
      const k = draftKey(state.ghIdeActivePath);
      state.ghDrafts[k] = next;
      state.ghDirtyMap[k] = true;
      render();
    } catch (e) {
      showToast(e.message, "error");
    }
  }
  window.selectXmlWidget = (idx) => {
    state.xmlSelIdx = idx;
    render();
  };
  window.addXmlWidget = (tag) =>
    updateXmlDomAndSync((doc) => {
      const el = doc.createElement(tag);
      el.setAttribute("android:layout_width", tag === "ImageView" ? "80dp" : "match_parent");
      el.setAttribute("android:layout_height", tag === "ImageView" ? "80dp" : "wrap_content");
      el.setAttribute("android:text", tag === "Button" ? "New Button" : "New " + tag);
      doc.documentElement.appendChild(el);
    });
  window.updateXmlWidgetProp = (idx, prop, val) => {
    const doc = new DOMParser().parseFromString(state.ghIdeContent, "text/xml");
    const widgets = Array.from(doc.querySelectorAll("TextView, Button, EditText, ImageView, Switch, CheckBox"));
    if (widgets[idx]) {
      widgets[idx].setAttribute("android:" + prop, val);
      const next = new XMLSerializer().serializeToString(doc);
      state.ghIdeContent = next;
      state.ghIdeDirty = true;
      const k = draftKey(state.ghIdeActivePath);
      state.ghDrafts[k] = next;
      state.ghDirtyMap[k] = true;
      document.getElementById("saveDirtyDot")?.classList.remove("hidden");
    }
  };
  window.deleteXmlWidget = (idx) =>
    updateXmlDomAndSync((doc) => {
      Array.from(doc.querySelectorAll("TextView, Button, EditText, ImageView, Switch, CheckBox"))[idx]?.remove();
      state.xmlSelIdx = 0;
    });

  window.execTerminalInput = (forcedCmd = null) => {
    flushActiveCmDraft();
    const inp = document.getElementById("ghTermInput");
    const cmd = forcedCmd !== null ? forcedCmd : inp?.value || "";
    if (!cmd.trim()) return;
    if (inp && forcedCmd === null) inp.value = "";
    const activeFw = state.ghManualFw || detectFramework(state.ghTreeFiles || []);
    state.ghTerminalLines.push(`wevlo:~$ ${cmd}`);
    state.ghTerminalLines.push(
      ...runTerminalCommand(cmd, {
        treeFiles: state.ghTreeFiles || [],
        activePath: state.ghIdeActivePath || "",
        activeContent: state.ghIdeContent || "",
        branch: state.ghBranch || "main",
        framework: activeFw,
        triggerBuild: () => window.startPersistentIdeBuild(),
        clearTerminal: () => {
          state.ghTerminalLines = [];
        }
      })
    );
    render();
  };

  window.confirmCreateGhNewProject = async () => {
    const rawName = document.getElementById("ghModalRepoName")?.value.trim();
    if (!rawName) return showToast("Please enter a repository name!", "error");
    if (!state.githubToken) return showToast("Please connect GitHub first!", "error");
    const name = sanitizeRepoName(rawName);
    const lang = state.newRepoLang || "java";
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "") || "app";
    const prefix = sanitizePackageName(state.profile?.pkgPrefix || "com.wevlo", "com.wevlo");

    const appName = document.getElementById("ghModalAppName")?.value.trim() || rawName;
    const rawPkg = document.getElementById("ghModalPkgName")?.value.trim() || `${prefix}.${slug}`;
    const packageName = sanitizePackageName(rawPkg, `${prefix}.${slug}`);
    const versionName = sanitizeVersionName(document.getElementById("ghModalVerName")?.value, "1.0.0");
    const versionCode = sanitizeVersionCode(document.getElementById("ghModalVerCode")?.value, 1);

    try {
      showToast(`Creating ${lang.toUpperCase()} project "${name}"...`, "info");
      const r = await ghFetch("/user/repos", {
        method: "POST",
        body: JSON.stringify({ name, private: state.newRepoPriv === "private", auto_init: true })
      });
      await new Promise((res) => setTimeout(res, 800));
      state.ghBranch = r.default_branch || "main";
      state.selectedGhRepo = r.full_name;
      state._loadedIdeRepo = r.full_name;
      state.ghOpenTabs = [];
      state.ghIdeActivePath = "";
      state.ghManualFw = lang;
      state.ghAutoSyncYaml = false;
      state.repoAppConfigs[r.full_name] = {
        appName,
        packageName,
        versionName,
        versionCode: String(versionCode),
        loaded: true
      };

      if (state.newRepoStarter) {
        const starter = buildFrameworkStarter(lang, { appName, packageName, versionName, versionCode });
        const entries = Object.entries(starter);
        for (let i = 0; i < entries.length; i++) {
          const [p, c] = entries[i];
          showToast(`Creating files (${i + 1}/${entries.length})...`, "info");
          await ghPutFileSafe(r.full_name, p, c, `Init ${lang} ${p}`, state.ghBranch);
        }
        await ghPutFileSafe(
          r.full_name,
          ".github/workflows/wevlo-build.yml",
          generateWorkflowYaml(state.ghBranch, "assembleDebug", versionName, false, lang, packageName),
          `Add ${lang} workflow`,
          state.ghBranch
        );
      }
      state.ghNewProjModalOpen = false;
      persistGhSession();
      await loadGithubRepos();
      await window.openGhVsCodeIde(r.full_name, state.ghBranch);
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  window.uploadFilesToCurrentRepo = async (e, targetPrefix = "") => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    if (!state.githubToken || !state.selectedGhRepo) {
      return showToast("Please select a GitHub repository first!", "error");
    }
    const branch = state.ghBranch || "main";
    const cleanPrefix = targetPrefix ? targetPrefix.replace(/^\/+|\/+$/g, "") + "/" : "";
    state.ghImportMenuOpen = false;
    state.ghItemMenu = null;
    try {
      let lastPath = "";
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const rel = f.webkitRelativePath ? f.webkitRelativePath.split("/").slice(1).join("/") : f.name;
        const destPath = (cleanPrefix + (rel || f.name)).replace(/^\/+/, "");
        if (!destPath || destPath.startsWith(".git/")) continue;
        showToast(`Uploading (${i + 1}/${files.length}): ${f.name}`, "info");
        const b64 = arrayBufferToBase64(await f.arrayBuffer());
        await ghPutFileSafe(state.selectedGhRepo, destPath, b64, `Upload ${destPath}`, branch, true);
        const parts = destPath.split("/");
        for (let d = 1; d < parts.length; d++) {
          state.ghExpandedFolders[parts.slice(0, d).join("/")] = true;
        }
        const k = draftKey(destPath);
        delete state.ghDrafts[k];
        delete state.ghDirtyMap[k];
        lastPath = destPath;
      }
      showToast(`Uploaded ${files.length} file(s) to ${state.selectedGhRepo}!`, "success");
      if (state.ghIdeOpen) {
        await window.refreshGhTree();
        if (lastPath) await window.openGhIdeFile(lastPath, false);
      } else {
        await window.openGhVsCodeIde(state.selectedGhRepo, branch);
      }
    } catch (err) {
      showToast("Upload error: " + err.message, "error");
    }
  };

  window.handleImportFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    if (!state.githubToken) return showToast("Please connect GitHub first!", "error");
    const rawName = prompt("New Repository name for imported files:", "imported-app");
    if (!rawName) return;
    const repoName = sanitizeRepoName(rawName);
    try {
      showToast(`Creating repository "${repoName}"...`, "info");
      const r = await ghFetch("/user/repos", { method: "POST", body: JSON.stringify({ name: repoName, private: true, auto_init: true }) });
      const br = r.default_branch || "main";
      await new Promise((res) => setTimeout(res, 800));
      let uploaded = 0;
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const relPath = f.webkitRelativePath ? f.webkitRelativePath.split("/").slice(1).join("/") : f.name;
        if (!relPath || relPath.startsWith(".git/")) continue;
        showToast(`Uploading (${i + 1}/${files.length}): ${relPath}`, "info");
        const b64 = arrayBufferToBase64(await f.arrayBuffer());
        await ghPutFileSafe(r.full_name, relPath, b64, `Import ${relPath}`, br, true);
        uploaded++;
      }
      state.ghImportMenuOpen = false;
      state.selectedGhRepo = r.full_name;
      state._loadedIdeRepo = r.full_name;
      state.ghBranch = br;
      state.ghOpenTabs = [];
      state.ghIdeActivePath = "";
      persistGhSession();
      await loadGithubRepos();
      showToast(`Imported ${uploaded} file(s)!`, "success");
      await window.openGhVsCodeIde(r.full_name, br);
    } catch (err) {
      showToast("Import failed: " + err.message, "error");
    }
  };

  window.handleImportZip = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!state.githubToken) return showToast("Please connect GitHub first!", "error");
    const rawName = prompt("New Repository name for ZIP:", file.name.replace(/\.zip$/i, ""));
    if (!rawName) return;
    const repoName = sanitizeRepoName(rawName);
    try {
      showToast("Reading ZIP archive...", "info");
      const JSZip = await ensureJSZip();
      const zip = await JSZip.loadAsync(file);
      const r = await ghFetch("/user/repos", { method: "POST", body: JSON.stringify({ name: repoName, private: true, auto_init: true }) });
      const br = r.default_branch || "main";
      await new Promise((res) => setTimeout(res, 800));
      const entries = Object.values(zip.files).filter((z) => !z.dir && !z.name.startsWith("__MACOSX") && !z.name.startsWith(".git/"));
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        showToast(`Uploading (${i + 1}/${entries.length}): ${entry.name}`, "info");
        await ghPutFileSafe(r.full_name, entry.name, await entry.async("base64"), `Import ${entry.name}`, br, true);
      }
      state.ghImportMenuOpen = false;
      state.selectedGhRepo = r.full_name;
      state._loadedIdeRepo = r.full_name;
      state.ghBranch = br;
      state.ghOpenTabs = [];
      state.ghIdeActivePath = "";
      persistGhSession();
      await loadGithubRepos();
      showToast(`ZIP imported (${entries.length} files)!`, "success");
      await window.openGhVsCodeIde(r.full_name, br);
    } catch (err) {
      showToast("ZIP import failed: " + err.message, "error");
    }
  };

  window.generateRandomKeyPass = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#";
    let p = "";
    for (let i = 0; i < 16; i++) p += chars[Math.floor(Math.random() * chars.length)];
    const inp = document.getElementById("ksPassInput");
    if (inp) inp.value = p;
  };
  window.confirmCreateKeystore = async () => {
    const name = document.getElementById("ksName")?.value.trim() || "Wevlo App";
    const org = document.getElementById("ksOrg")?.value.trim() || "";
    const country = document.getElementById("ksCountry")?.value.trim() || "US";
    const years = document.getElementById("ksYears")?.value.trim() || "25";
    const alias = document.getElementById("ksAlias")?.value.trim() || "key0";
    const pass = document.getElementById("ksPassInput")?.value || "";
    if (pass.length < 6) return showToast("Password must be at least 6 characters!", "error");
    const kp = await crypto.subtle.generateKey(
      { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
      true,
      ["sign", "verify"]
    );
    localStorage.setItem(
      "wevlo_signing_key",
      JSON.stringify({ name, org, country, years, alias, createdAt: new Date().toISOString(), jwk: await crypto.subtle.exportKey("jwk", kp.privateKey) })
    );
    state.ghKeystoreModalOpen = false;
    render();
    showToast(`Keystore "${alias}" created!`, "success");
  };

  window.toggleGhFolder = (path) => {
    flushActiveCmDraft();
    state.ghExpandedFolders[path] = !state.ghExpandedFolders[path];
    render();
  };
  window.openGhNewFileModal = (prefix = "app/") => {
    state.ghNewFilePrefix = prefix;
    state.ghNewFileModalOpen = true;
    state.ghItemMenu = null;
    render();
  };
  window.openGhItemMenu = (type, path) => {
    state.ghItemMenu = { type, path };
    render();
  };
  window.deleteGhRepoFile = async (path) => {
    state.ghItemMenu = null;
    if (!confirm(`Delete ${path}?`)) return;
    try {
      const br = state.ghBranch || "main";
      const fData = await ghFetch(`/repos/${state.selectedGhRepo}/contents/${path}?ref=${encodeURIComponent(br)}`);
      await ghFetch(`/repos/${state.selectedGhRepo}/contents/${path}`, {
        method: "DELETE",
        body: JSON.stringify({ message: `Delete ${path}`, sha: fData.sha, branch: br })
      });
      const k = draftKey(path);
      delete state.ghDrafts[k];
      delete state.ghDirtyMap[k];
      state.ghOpenTabs = state.ghOpenTabs.filter((t) => t !== path);
      if (state.ghIdeActivePath === path) state.ghIdeActivePath = state.ghOpenTabs[0] || "";
      await window.refreshGhTree();
      showToast(`Deleted ${path}`, "info");
    } catch (e) {
      showToast(e.message, "error");
    }
  };
  window.createGhNewFileConfirm = async () => {
    const rawPath = document.getElementById("ghNewFilePathInput")?.value.trim() || "";
    const path = rawPath.replace(/^\/+/, "");
    if (!path || path.endsWith("/")) return showToast("Enter a valid file path!", "error");
    try {
      const def = DEFAULT_ANDROID_TEMPLATES[path] || DEFAULT_ANDROID_TEMPLATES[path.split("/").pop()] || "// Created with Wevlo Studio\n";
      await ghPutFileSafe(state.selectedGhRepo, path, def, `Create ${path}`, state.ghBranch || "main");
      state.ghNewFileModalOpen = false;
      const parts = path.split("/");
      for (let d = 1; d < parts.length; d++) {
        state.ghExpandedFolders[parts.slice(0, d).join("/")] = true;
      }
      await window.refreshGhTree();
      await window.openGhIdeFile(path);
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  window.refreshGhTree = async () => {
    if (!state.selectedGhRepo) return;
    state.ghTreeLoading = true;
    state.ghTreeError = "";
    render();
    try {
      let br = state.ghBranch || "main";
      try {
        const res = await ghFetch(`/repos/${state.selectedGhRepo}/git/trees/${encodeURIComponent(br)}?recursive=1`);
        state.ghTreeFiles = (res.tree || []).filter((t) => t.type === "blob").slice(0, 500);
      } catch (firstErr) {
        try {
          const repoInfo = await ghFetch(`/repos/${state.selectedGhRepo}`);
          const realBr = repoInfo.default_branch || "main";
          if (realBr !== br) {
            state.ghBranch = realBr;
            const res2 = await ghFetch(`/repos/${state.selectedGhRepo}/git/trees/${encodeURIComponent(realBr)}?recursive=1`);
            state.ghTreeFiles = (res2.tree || []).filter((t) => t.type === "blob").slice(0, 500);
          } else {
            throw firstErr;
          }
        } catch (err2) {
          state.ghTreeFiles = [];
          state.ghTreeError = err2.message || "Repository may be empty.";
        }
      }
      const hasWf = (state.ghTreeFiles || []).some(
        (f) => f.path.startsWith(".github/workflows/") && (f.path.endsWith(".yml") || f.path.endsWith(".yaml"))
      );
      if (hasWf && state.ghAutoSyncYaml === undefined) state.ghAutoSyncYaml = false;
    } finally {
      state.ghTreeLoading = false;
      render();
    }
  };

  window.selectGhRepo = (fullName, defaultBranch = null) => {
    state.selectedGhRepo = fullName;
    if (defaultBranch) {
      state.ghBranch = defaultBranch;
    } else {
      const found = (state.githubRepos || []).find((r) => r.full_name === fullName);
      if (found?.default_branch) state.ghBranch = found.default_branch;
    }
    if (state._loadedIdeRepo !== fullName) {
      state.ghOpenTabs = [];
      state.ghIdeActivePath = "";
      state.ghManualFw = null;
      state.ghTreeFiles = [];
    }
    persistGhSession();
  };

  window.openGhVsCodeIde = async (forcedRepo = null, forcedBranch = null) => {
    if (!state.githubToken) return showToast("Please connect GitHub first!", "error");
    const repo = forcedRepo || document.getElementById("ghRepoSelect")?.value || state.selectedGhRepo;
    if (!repo) {
      state.ghNewProjModalOpen = true;
      return render();
    }
    if (state._loadedIdeRepo !== repo) {
      state.ghOpenTabs = [];
      state.ghIdeActivePath = "";
      state.ghManualFw = null;
      state.ghTreeFiles = [];
      state._loadedIdeRepo = repo;
    }
    window.selectGhRepo(repo, forcedBranch);
    state.ghIdeOpen = true;
    state.ghNavMenuOpen = false;
    state.ghMobileTab = "files";
    state.ghIdeDirty = false;
    persistGhSession();
    await window.refreshGhTree();
    window.loadRepoAppConfig(true).then(() => {
      if (state.ghMobileTab === "build") render();
    });
    const list = state.ghTreeFiles || [];
    const targetFile =
      (state.ghIdeActivePath && list.find((f) => f.path === state.ghIdeActivePath)) ||
      list.find((f) => f.path === "lib/main.dart" || f.path === "main.py" || f.path === "www/index.html" || f.path.endsWith("MainActivity.kt") || f.path.endsWith("MainActivity.java")) ||
      list[0];
    if (targetFile) await window.openGhIdeFile(targetFile.path, false);
  };

  window.openGhIdeFile = async (path, switchToEditor = true, forceReload = false) => {
    flushActiveCmDraft();
    state.ghIdeActivePath = path;
    if (!state.ghOpenTabs.includes(path)) state.ghOpenTabs.push(path);
    const k = draftKey(path);
    if (switchToEditor) state.ghMobileTab = "editor";
    persistGhSession();

    if (!forceReload && state.ghDirtyMap[k] && state.ghDrafts[k] !== undefined) {
      state.ghIdeContent = state.ghDrafts[k];
      state.ghIdeDirty = true;
      state.ghIdeFileLoading = false;
      render();
      return;
    }

    state.ghIdeFileLoading = true;
    state.ghIdeDirty = false;
    render();
    try {
      const data = await ghFetch(`/repos/${state.selectedGhRepo}/contents/${path}?ref=${encodeURIComponent(state.ghBranch || "main")}`);
      state.ghIdeFileSha = data.sha;
      const cleanB64 = (data.content || "").replace(/\s/g, "");
      if (isImageFile(path)) {
        const ext = path.split(".").pop().toLowerCase();
        const mime = ext === "jpg" ? "jpeg" : ext;
        state.ghIdeContent = `data:image/${mime};base64,${cleanB64}`;
      } else {
        const txt = fromBase64Utf8(cleanB64);
        state.ghIdeContent = txt;
        state.ghLastSavedContent = txt;
        delete state.ghDrafts[k];
        delete state.ghDirtyMap[k];
      }
    } catch (e) {
      state.ghIdeContent = "// Error: " + e.message;
    }
    state.ghIdeFileLoading = false;
    render();
  };

  window.reloadGhIdeFileFromServer = async () => {
    if (!state.ghIdeActivePath) return;
    const k = draftKey(state.ghIdeActivePath);
    delete state.ghDrafts[k];
    delete state.ghDirtyMap[k];
    await window.openGhIdeFile(state.ghIdeActivePath, true, true);
    showToast("Reloaded latest code from GitHub!", "info");
  };

  window.closeGhTab = (path) => {
    flushActiveCmDraft();
    state.ghOpenTabs = state.ghOpenTabs.filter((t) => t !== path);
    if (state.ghIdeActivePath === path) {
      state.ghIdeActivePath = state.ghOpenTabs[state.ghOpenTabs.length - 1] || "";
      if (state.ghIdeActivePath) window.openGhIdeFile(state.ghIdeActivePath, false);
    }
    persistGhSession();
    render();
  };

  window.saveGhIdeFile = async () => {
    flushActiveCmDraft();
    if (!state.selectedGhRepo || !state.ghIdeActivePath || isImageFile(state.ghIdeActivePath)) return;
    try {
      const k = draftKey(state.ghIdeActivePath);
      const contentToSave = state.ghDrafts[k] !== undefined ? state.ghDrafts[k] : state.ghIdeContent;
      const res = await ghPutFileSafe(
        state.selectedGhRepo,
        state.ghIdeActivePath,
        contentToSave,
        `Update ${state.ghIdeActivePath}`,
        state.ghBranch || "main"
      );
      state.ghIdeFileSha = res.content?.sha;
      state.ghIdeContent = contentToSave;
      state.ghLastSavedContent = contentToSave;
      state.ghIdeDirty = false;
      delete state.ghDrafts[k];
      delete state.ghDirtyMap[k];
      if (state.activeBuild) {
        state.activeBuild.compilerErrors = [];
        saveActiveBuild();
      }
      addLogcat("I", "GitCommit", `Committed ${state.ghIdeActivePath}`);
      render();
      showToast(`Saved ${state.ghIdeActivePath.split("/").pop()} to GitHub!`, "success");
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  window.insertGhSymbol = (sym) => {
    const cm = window.__wevloCM;
    if (!cm) return;
    cm.replaceSelection(sym === "TAB" ? "  " : sym);
    cm.focus();
  };

  window.switchGhIdeTab = (nextTab) => {
    flushActiveCmDraft();
    state.ghMobileTab = nextTab;
    render();
  };

  window.switchPageFromIde = (route) => {
    flushActiveCmDraft();
    state.ghNavMenuOpen = false;
    state.ghIdeOpen = false;
    persistGhSession();
    navigate(route);
  };
// ======================================================
// File 3/4: ide-editors.js (PART 2B — paste directly below PART 2A)
// ======================================================

  window.saveGhToolbarBtn = async () => {
    flushActiveCmDraft();
    const dirtyPaths = getRepoDirtyPaths(state.selectedGhRepo);
    if (dirtyPaths.length > 0) {
      try {
        const n = await window.saveAllGhDirtyFiles();
        render();
        showToast(`Saved ${n} file(s) to GitHub!`, "success");
      } catch (e) {
        showToast(e.message, "error");
      }
    } else {
      await window.saveGhIdeFile();
    }
  };

  // ======================================================
  // STEP 3: Full-Screen Multi-Language AIDE IDE
  // ======================================================
  if (state.ghIdeOpen && state.selectedGhRepo) {
    const files = state.ghTreeFiles || [];
    const activeFw = state.ghManualFw || detectFramework(files);
    const fwInfo = APP_FRAMEWORKS.find((f) => f.id === activeFw) || APP_FRAMEWORKS[0];
    const repoName = state.selectedGhRepo.split("/")[1];
    const activePath = state.ghIdeActivePath || "";
    const fileCode = state.ghIdeContent || "";
    const tab = state.ghMobileTab || "files";
    const treeRoot = buildNestedTree(files);
    const activeIsImg = isImageFile(activePath);
    const dirtyPaths = getRepoDirtyPaths(state.selectedGhRepo);
    const dirtyCount = dirtyPaths.length;
    const appCfg = getRepoAppConfig(state.selectedGhRepo);

    const issues = analyzeProjectIssues({
      treeFiles: files,
      activePath: activeIsImg ? "" : activePath,
      activeContent: activeIsImg ? "" : fileCode,
      branch: state.ghBranch || "main",
      compilerErrors: state.activeBuild?.compilerErrors || [],
      framework: activeFw
    });
    const ab = state.activeBuild;
    const isXmlLayout = activePath.endsWith(".xml") && !activePath.endsWith("AndroidManifest.xml");
    const gradleTasks =
      activeFw === "flutter"
        ? [["assembleDebug", "Flutter Debug APK"], ["assembleRelease", "Flutter Release APK"], ["bundleRelease", "Flutter Play Store AAB"]]
        : activeFw === "python"
        ? [["assembleDebug", "Buildozer Python Debug APK"]]
        : [["assembleDebug", "APK • Debug (installable)"], ["assembleRelease", "APK • Release"], ["bundleRelease", "AAB • Release (Play Store)"], ["assembleRelease + bundleRelease", "APK + AAB • Release"]];
    const curTaskDesc = (gradleTasks.find(([t]) => t === state.ghGradleTask) || gradleTasks[0])[1];

    if (tab === "editor" && !activeIsImg && state.ghEditorView !== "visual" && !state.ghIdeFileLoading && !state.ghWizardOpen && !state.ghLibModalOpen) {
      const errLines = issues.filter((i) => i.file === activePath && i.line).map((i) => i.line);
      requestAnimationFrame(() => {
        mountCodeMirror({
          hostId: "ghCmHost",
          value: fileCode,
          filePath: activePath,
          errorLines: errLines,
          onChange: (val) => {
            state.ghIdeContent = val;
            const k = draftKey(activePath);
            state.ghDrafts[k] = val;
            state.ghDirtyMap[k] = true;
            if (!state.ghIdeDirty) {
              state.ghIdeDirty = true;
              document.getElementById("saveDirtyDot")?.classList.remove("hidden");
              document.getElementById("editorTabDot")?.classList.remove("hidden");
            }
          },
          onCursor: (ln, col) => {
            const el = document.getElementById("ghCursorInfo");
            if (el) el.textContent = `Ln ${ln}, Col ${col}`;
          }
        }).then((cm) => {
          if (cm && state.pendingJumpLine) {
            const target = Math.max(0, state.pendingJumpLine - 1);
            cm.setCursor(target, 0);
            cm.scrollIntoView({ line: target, ch: 0 }, 120);
            state.pendingJumpLine = null;
          }
        });
      });
    }

    return `
      <div class="h-[100dvh] w-full flex flex-col bg-[#121024] text-slate-100 overflow-hidden relative">
        <div class="bg-[#191632] px-3 h-14 flex items-center justify-between border-b border-[#2b264e] shrink-0 relative">
          <div class="flex items-center gap-1.5 min-w-0">
            <button onclick="flushActiveCmDraft?.(); state.ghIdeOpen=false; render()" title="Back to Repo List" class="p-1.5 rounded-full hover:bg-white/10"><i data-lucide="arrow-left" class="w-5 h-5"></i></button>
            <button onclick="state.ghNavMenuOpen=!state.ghNavMenuOpen; render()" class="px-2 py-1 rounded-xl bg-[#27234a] text-[11px] font-bold text-purple-200 shrink-0">⇄ Pages</button>
            <div class="min-w-0 pl-1">
              <p class="font-extrabold text-sm truncate max-w-[95px]">${escapeAttr(repoName)}</p>
              <p class="text-[10px] text-purple-300 font-bold">${fwInfo.badge} • ${escapeAttr(state.ghBranch || "main")}</p>
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            ${activeFw === "java" || activeFw === "kotlin" ? `<button onclick="openLibraryManager()" class="px-2 py-1.5 rounded-xl bg-[#27234a] text-[11px] font-bold text-emerald-300">📦 Libs</button><button onclick="state.ghWizardOpen=true; render()" class="px-2 py-1.5 rounded-xl bg-[#27234a] text-[11px] font-bold text-purple-300">+Act</button>` : ""}
            <button onclick="saveGhToolbarBtn()" title="Push Changes to GitHub" class="relative p-2 rounded-xl hover:bg-white/10">
              <i data-lucide="save" class="w-4 h-4 text-slate-200"></i>
              <span id="saveDirtyDot" class="${dirtyCount > 0 || state.ghIdeDirty ? "" : "hidden"} absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-amber-400 text-slate-950 text-[9px] font-extrabold flex items-center justify-center">${dirtyCount > 1 ? dirtyCount : ""}</span>
            </button>
            <button onclick="startPersistentIdeBuild()" class="btn-purple p-2.5 rounded-xl"><i data-lucide="play" class="w-4 h-4"></i></button>
          </div>

          ${state.ghNavMenuOpen ? `<div class="absolute left-3 top-14 z-50 w-56 bg-[#1e1a3a] border border-[#3a3469] rounded-2xl shadow-2xl p-2 space-y-1 text-xs font-bold">
            <button onclick="switchPageFromIde('#/')" class="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10">🏠 Dashboard</button>
            <button onclick="switchPageFromIde('#/projects')" class="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10">📁 My Projects</button>
            <button onclick="switchPageFromIde('#/editor')" class="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10">💻 Web Editor</button>
            <button onclick="switchPageFromIde('#/web2app')" class="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10">🌐 Website to App</button>
            <button onclick="switchPageFromIde('#/docs')" class="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10">📖 Documentation</button>
            <button onclick="state.ghNavMenuOpen=false; state.ghIdeOpen=false; render()" class="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 text-purple-300">⚙ Change Repository</button>
          </div>` : ""}
        </div>

        ${ab && ab.status === "running" ? `<button onclick="switchGhIdeTab('output'); state.ghOutputSubTab='output'; render()" class="bg-purple-900/50 border-b border-purple-500/40 px-3 py-1.5 flex items-center justify-between text-xs shrink-0"><span class="flex items-center gap-2 font-bold text-purple-200"><span class="spinner"></span> <span id="buildStatusBannerText">Building ${(ab.framework || "").toUpperCase()} (${ab.progress}%)...</span></span><span class="text-purple-300 underline font-bold">Output →</span></button>` : ""}

        <div class="flex-1 min-h-0 overflow-hidden flex flex-col">
          ${tab === "files" ? `<div class="flex-1 overflow-y-auto p-3.5 space-y-3">
            <div class="flex items-center justify-between gap-2">
              <span class="font-extrabold text-base">Project Explorer</span>
              <div class="flex items-center gap-1.5">
                <label class="px-2.5 py-1.5 rounded-xl bg-violet-600/25 border border-violet-500/40 text-violet-200 text-xs font-bold cursor-pointer inline-flex items-center gap-1 hover:bg-violet-600/40">
                  <i data-lucide="upload" class="w-3.5 h-3.5"></i> Upload
                  <input type="file" multiple class="hidden" onchange="uploadFilesToCurrentRepo(event, '')" />
                </label>
                <button onclick="openGhNewFileModal('')" title="New File" class="p-1.5 rounded-lg hover:bg-white/10"><i data-lucide="file-plus" class="w-4 h-4"></i></button>
                <button onclick="refreshGhTree()" title="Refresh Files" class="p-1.5 rounded-lg hover:bg-white/10"><i data-lucide="refresh-cw" class="w-4 h-4"></i></button>
              </div>
            </div>
            <div class="bg-[#1b1836] border border-[#2d2854] rounded-2xl p-3 flex items-center justify-between gap-2">
              <div class="flex items-center gap-2.5 min-w-0">
                <span class="w-8 h-8 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center shrink-0"><i data-lucide="github" class="w-4 h-4"></i></span>
                <div class="min-w-0">
                  <p class="font-extrabold text-sm truncate">${escapeAttr(repoName)}</p>
                  <p class="text-[10px] text-purple-300">${fwInfo.name} • ${files.length} files ${dirtyCount ? `• ${dirtyCount} unsaved` : ""}</p>
                </div>
              </div>
              <a href="https://github.com/${escapeAttr(state.selectedGhRepo)}" target="_blank" class="border border-[#3a3469] bg-[#242047] px-3 py-1.5 rounded-xl text-xs font-bold shrink-0">GitHub ↗</a>
            </div>
            ${state.ghTreeLoading ? `<div class="py-12 text-center"><span class="spinner"></span></div>` : files.length === 0 ? `
              <div class="p-6 rounded-2xl border border-dashed border-[#342f61] text-center space-y-3">
                <p class="text-sm font-bold text-slate-200">No files found in "${escapeAttr(state.ghBranch)}"</p>
                <p class="text-xs text-slate-400">${escapeAttr(state.ghTreeError || "This repository is empty. Upload files or create a Hello World starter.")}</p>
                <div class="flex flex-wrap justify-center gap-2">
                  <label class="btn-purple px-4 py-2 rounded-full text-xs font-bold cursor-pointer">↑ Upload Files<input type="file" multiple class="hidden" onchange="uploadFilesToCurrentRepo(event, '')" /></label>
                  <button onclick="openGhNewFileModal('')" class="px-4 py-2 rounded-full bg-[#242047] text-xs font-bold">+ Create File</button>
                  <button onclick="setupMissingFilesForLang('${activeFw}')" class="px-4 py-2 rounded-full bg-emerald-600/30 text-emerald-200 text-xs font-bold">⚡ Add ${fwInfo.name} Starter</button>
                </div>
              </div>` : `<div class="space-y-0.5">${renderFolderTreeHtml(treeRoot, "", state.ghExpandedFolders, activePath, state.ghDirtyMap, state.selectedGhRepo)}</div>`}
          </div>` : ""}

          ${tab === "editor" ? `<div class="flex-1 flex flex-col min-h-0">
            <div class="bg-[#191632] px-2 pt-1.5 flex items-center justify-between border-b border-[#2b264e] shrink-0 gap-2">
              <div class="flex items-center gap-1 overflow-x-auto">${(state.ghOpenTabs.length ? state.ghOpenTabs : [activePath].filter(Boolean)).map((tp) => {
                const isTabDirty = !!state.ghDirtyMap[draftKey(tp)];
                return `<div class="flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-xs shrink-0 ${tp === activePath ? "bg-[#282a36] text-white font-bold border-t-2 border-purple-500" : "text-slate-400"}"><button data-path="${escapeAttr(tp)}" onclick="openGhIdeFile(this.dataset.path)" class="inline-flex items-center gap-1">${isTabDirty ? `<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>` : ""}${escapeAttr(tp.split("/").pop())}</button><button data-path="${escapeAttr(tp)}" onclick="closeGhTab(this.dataset.path)" class="text-slate-500 ml-1">×</button></div>`;
              }).join("")}</div>
              ${activeIsImg ? "" : `<div class="flex items-center gap-1 pb-1 shrink-0">
                <button onclick="reloadGhIdeFileFromServer()" title="Reload fresh from GitHub" class="px-2 py-1 rounded-lg bg-[#27234a] text-[10px] font-bold text-sky-300">↻</button>
                ${isXmlLayout ? `<button onclick="state.ghEditorView=state.ghEditorView==='visual'?'code':'visual'; render()" class="px-2 py-1 rounded-lg text-[10px] font-bold ${state.ghEditorView === "visual" ? "btn-purple" : "bg-[#27234a] text-purple-300"}">${state.ghEditorView === "visual" ? "</>" : "🎨 UI"}</button>` : `<button onclick="showAndroidHints(window.__wevloCM, '${escapeAttr(activePath)}')" class="px-2 py-1 rounded-lg bg-[#27234a] text-[10px] font-bold text-amber-300">💡</button>`}
                <button onclick="cmToolbarAct('all')" class="px-2 py-1 rounded-lg bg-[#27234a] text-[10px] font-bold text-slate-200">All</button>
                <button onclick="cmToolbarAct('clear')" class="px-2 py-1 rounded-lg bg-rose-500/20 text-[10px] font-bold text-rose-300">Clear</button>
                <button onclick="cmToolbarAct('paste')" class="px-2 py-1 rounded-lg bg-emerald-500/20 text-[10px] font-bold text-emerald-300">Paste</button>
                <button onclick="cmToolbarAct('copy')" class="px-2 py-1 rounded-lg bg-[#27234a] text-[10px] font-bold text-slate-200">Copy</button>
              </div>`}
            </div>
            ${!activePath
              ? `<div class="flex-1 flex flex-col items-center justify-center p-6 text-center text-xs text-slate-400 gap-3"><p>No file selected.</p><button onclick="switchGhIdeTab('files')" class="btn-purple px-4 py-2 rounded-full font-bold">Open Files Tab</button></div>`
              : state.ghIdeFileLoading
              ? `<div class="flex-1 flex items-center justify-center"><span class="spinner"></span></div>`
              : activeIsImg
              ? `<div class="flex-1 flex flex-col items-center justify-center p-6 bg-[#18162b] gap-3"><img src="${fileCode}" alt="${escapeAttr(activePath)}" class="max-w-[220px] max-h-[220px] rounded-2xl border border-[#322e4a] bg-white/5 p-3 object-contain" /><p class="text-xs text-slate-300 font-bold">${escapeAttr(activePath)}</p><p class="text-[11px] text-slate-400">Binary image asset preview</p></div>`
              : state.ghEditorView === "visual" && isXmlLayout
              ? renderVisualXmlDesigner(fileCode, state.xmlSelIdx)
              : `<div id="ghCmHost" class="flex-1 min-h-0 overflow-hidden bg-[#282a36]"></div><div class="bg-[#1b1836] px-2 py-2 flex items-center justify-between gap-1.5 overflow-x-auto border-t border-[#2b264e] shrink-0"><div class="flex gap-1.5"><button onclick="cmToolbarAct('undo')" class="px-2.5 h-8 rounded-xl bg-[#27234a] text-amber-300 text-xs font-bold shrink-0">↶</button><button onclick="cmToolbarAct('redo')" class="px-2.5 h-8 rounded-xl bg-[#27234a] text-amber-300 text-xs font-bold shrink-0">↷</button>${[["Tab", "TAB"], ["{ }", "{}"], ["( )", "()"], ["[ ]", "[]"], ['" "', '""'], ["< >", "<>"], [";", ";"]].map(([lbl, val]) => `<button onclick='insertGhSymbol(${JSON.stringify(val)})' class="px-3 h-8 rounded-xl bg-[#27234a] text-white font-mono text-xs font-bold shrink-0">${lbl}</button>`).join("")}</div><span id="ghCursorInfo" class="text-[10px] text-slate-400 px-2 shrink-0">Ln 1, Col 1</span></div>`}
          </div>` : ""}

          ${tab === "build" ? `<div class="flex-1 overflow-y-auto p-4 space-y-4">
            <div class="bg-[#191632] border border-[#2c2754] rounded-2xl p-4 space-y-3 text-xs">
              <div class="flex items-center justify-between gap-2">
                <div>
                  <p class="font-extrabold text-sm text-purple-200">📱 App Identity &amp; Version</p>
                  <p class="text-[10px] text-slate-400">Unique Package Name prevents overwriting your other apps</p>
                </div>
                <button onclick="loadRepoAppConfig(false)" class="px-2.5 py-1.5 rounded-xl bg-[#242047] text-sky-300 font-bold shrink-0">🔄 Load</button>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label class="text-[11px] font-bold text-slate-300">App Name</label>
                  <input value="${escapeAttr(appCfg.appName)}" oninput="updateRepoAppConfigField('appName', this.value)" placeholder="My App" class="w-full mt-1 bg-[#121024] border border-[#342f61] rounded-xl px-3 py-2 text-white font-semibold" />
                </div>
                <div>
                  <label class="text-[11px] font-bold text-slate-300">Package Name (Unique ID)</label>
                  <input value="${escapeAttr(appCfg.packageName)}" oninput="updateRepoAppConfigField('packageName', this.value)" placeholder="com.mycompany.myapp" class="w-full mt-1 bg-[#121024] border border-[#342f61] rounded-xl px-3 py-2 text-white font-mono" />
                </div>
                <div>
                  <label class="text-[11px] font-bold text-slate-300">Version Name</label>
                  <input value="${escapeAttr(appCfg.versionName)}" oninput="updateRepoAppConfigField('versionName', this.value)" placeholder="1.0.0" class="w-full mt-1 bg-[#121024] border border-[#342f61] rounded-xl px-3 py-2 text-white font-mono" />
                </div>
                <div>
                  <label class="text-[11px] font-bold text-slate-300">Version Code</label>
                  <input type="number" min="1" value="${escapeAttr(appCfg.versionCode)}" oninput="updateRepoAppConfigField('versionCode', this.value)" placeholder="1" class="w-full mt-1 bg-[#121024] border border-[#342f61] rounded-xl px-3 py-2 text-white font-mono" />
                </div>
              </div>
              <button onclick="applyRepoAppConfig()" class="w-full py-2.5 rounded-xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 font-bold hover:bg-emerald-600/40">✅ Apply &amp; Push Config to GitHub</button>
            </div>

            <div>
              <label class="text-xs font-bold text-slate-300">Project Language / Framework</label>
              <select onchange="state.ghManualFw=this.value; render()" class="w-full mt-1.5 bg-[#1b1836] border border-[#2f2a57] rounded-2xl px-4 py-3 text-sm font-bold">
                ${APP_FRAMEWORKS.map((fw) => `<option value="${fw.id}" ${activeFw === fw.id ? "selected" : ""}>${fw.badge} — ${fw.desc}</option>`).join("")}
              </select>
            </div>
            ${issues.length ? `<button onclick="setupMissingFilesForLang('${activeFw}')" class="w-full py-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-bold">⚡ Auto-Setup Missing ${fwInfo.name} Files (${issues.length})</button>` : ""}
            <div class="grid grid-cols-3 gap-2">
              <button onclick="startPersistentIdeBuild()" class="btn-purple py-2.5 rounded-2xl text-xs font-bold">▶ Run</button>
              <button onclick="startPersistentIdeBuild()" class="bg-[#231f42] border border-[#322d5c] py-2.5 rounded-2xl text-xs font-bold">🔨 Build</button>
              <button onclick="state.activeBuild=null; localStorage.removeItem('wevlo_active_build'); render()" class="bg-[#231f42] border border-[#322d5c] py-2.5 rounded-2xl text-xs font-bold">🗑 Clean</button>
            </div>
            <div>
              <label class="text-xs font-bold text-slate-300">Build Task</label>
              <button onclick="state.ghTaskPickerOpen=true; render()" class="w-full mt-1.5 bg-[#1b1836] border border-[#2f2a57] rounded-2xl px-4 py-3 text-sm font-semibold flex items-center justify-between"><span>🔨 ${escapeAttr(state.ghGradleTask)}</span><i data-lucide="chevron-down" class="w-4 h-4"></i></button>
              <p class="text-[11px] text-slate-400 mt-1.5">${curTaskDesc}</p>
            </div>
            <label class="flex items-center justify-between p-3.5 rounded-2xl bg-[#191632] border border-[#2c2754] text-xs cursor-pointer">
              <div>
                <b>Overwrite wevlo-build.yml with Wevlo default on build</b>
                <p class="text-[10px] text-slate-400">Keep OFF to preserve your custom .yml edits (only auto-creates if missing)</p>
              </div>
              <input type="checkbox" ${state.ghAutoSyncYaml ? "checked" : ""} onchange="state.ghAutoSyncYaml=this.checked" class="accent-purple-600 w-4 h-4" />
            </label>
            <button onclick="resetRepairWorkflowYaml()" class="w-full py-2.5 rounded-2xl bg-[#231f42] border border-[#322d5c] text-purple-200 text-xs font-bold">🔧 Reset / Repair wevlo-build.yml</button>
            <button onclick="startPersistentIdeBuild()" class="w-full btn-purple py-3.5 rounded-2xl text-sm font-extrabold">🚀 Start ${fwInfo.badge} Build ${dirtyCount ? `(Push ${dirtyCount} Edited File${dirtyCount > 1 ? "s" : ""})` : ""}</button>
            <button onclick="enableCloudReleaseSigning()" class="w-full py-3 rounded-2xl border border-purple-500/40 bg-purple-900/20 text-purple-200 text-xs font-bold">${localStorage.getItem("wevlo_cloud_signed_" + state.selectedGhRepo) ? "✓ Cloud Keystore Signing Active" : "🔐 Setup Play Store Cloud Signing"}</button>
            <div class="bg-[#191632] border border-[#2c2754] rounded-2xl p-4 space-y-2 text-xs">
              <p class="font-extrabold text-sm">ℹ Project Info</p>
              <div class="flex justify-between"><span class="text-slate-400">Framework</span><b>${fwInfo.name}</b></div>
              <div class="flex justify-between"><span class="text-slate-400">Package ID</span><b class="font-mono text-purple-300">${escapeAttr(appCfg.packageName)}</b></div>
              <div class="flex justify-between"><span class="text-slate-400">Problems</span><b class="${issues.length ? "text-amber-400" : "text-emerald-400"}">${issues.length}</b></div>
            </div>
          </div>` : ""}

          ${tab === "output" ? `<div class="flex-1 flex flex-col min-h-0">
            <div class="bg-[#191632] px-3 flex items-center gap-3 overflow-x-auto border-b border-[#2b264e] text-xs font-bold shrink-0">
              <button onclick="state.ghOutputSubTab='terminal'; render()" class="py-2.5 shrink-0 ${state.ghOutputSubTab === "terminal" ? "text-white border-b-2 border-purple-500" : "text-slate-400"}">&gt;_ Terminal</button>
              <button onclick="state.ghOutputSubTab='output'; render()" class="py-2.5 shrink-0 ${state.ghOutputSubTab === "output" ? "text-white border-b-2 border-purple-500" : "text-slate-400"}">≡ Build Output</button>
              <button onclick="state.ghOutputSubTab='logcat'; render()" class="py-2.5 shrink-0 ${state.ghOutputSubTab === "logcat" ? "text-white border-b-2 border-purple-500" : "text-slate-400"}">📱 Logcat</button>
              <button onclick="state.ghOutputSubTab='problems'; render()" class="py-2.5 shrink-0 ${state.ghOutputSubTab === "problems" ? "text-white border-b-2 border-purple-500" : "text-slate-400"}">ⓘ Problems (${issues.length})</button>
            </div>
            ${state.ghOutputSubTab === "terminal" ? `<div class="flex-1 flex flex-col min-h-0 p-3 font-mono text-xs"><div class="flex gap-1.5 overflow-x-auto pb-2 shrink-0">${["gradle check", "ls", "build", "clear", "help"].map((c) => `<button onclick="execTerminalInput('${c}')" class="px-2.5 py-1 rounded-lg bg-[#231f42] text-purple-300 shrink-0">${c}</button>`).join("")}</div><div class="flex-1 overflow-y-auto space-y-1 text-slate-200 bg-[#0d0c18] p-3 rounded-2xl border border-[#252142]">${state.ghTerminalLines.map((l) => `<div class="whitespace-pre-wrap">${l.replace(/</g, "&lt;")}</div>`).join("")}</div><div class="mt-2 flex gap-2 shrink-0"><input id="ghTermInput" onkeydown="if(event.key==='Enter') execTerminalInput()" placeholder="Type command..." class="flex-1 bg-[#1b1836] border border-[#342f61] rounded-xl px-3 py-2 text-xs text-white" /><button onclick="execTerminalInput()" class="btn-purple px-4 rounded-xl font-bold">Run</button></div></div>` : ""}
            ${state.ghOutputSubTab === "output" ? `<div class="flex-1 overflow-y-auto p-4 space-y-3 text-xs">${!ab ? `<p class="text-slate-400 font-mono">$ Ready — press Start Build.</p>` : `<div class="bg-[#191632] border border-[#2f2a57] rounded-2xl p-4 space-y-3"><div class="flex justify-between items-center"><span class="font-extrabold text-sm">${ab.status === "running" ? "⏳ Building..." : ab.status === "success" ? "✓ Build Succeeded" : "✖ Build Failed"}</span><button onclick="downloadBuildReportTxt()" class="bg-[#27234a] px-3 py-1.5 rounded-xl font-bold text-purple-300">⬇ Log (.txt)</button></div><div class="w-full h-2 bg-[#121024] rounded-full overflow-hidden"><div class="h-full bg-purple-600 transition-all" style="width:${ab.progress}%"></div></div>${ab.errorSummary ? `<div class="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 font-bold">${escapeAttr(ab.errorSummary)}</div>` : ""}${ab.apkUrl ? `<button onclick="downloadBuiltApkAsset('${escapeAttr(ab.apkApiUrl)}','${escapeAttr(ab.apkName)}','${escapeAttr(ab.apkUrl)}')" class="w-full btn-purple py-2.5 rounded-full font-bold">⬇ Download ${escapeAttr(ab.apkName)} (${escapeAttr(ab.apkSize)})</button>` : ""}${(ab.compilerErrors || []).length ? `<div class="space-y-1.5 pt-2 border-t border-[#2b264e]"><p class="font-bold text-rose-300">Compiler Errors (Tap to Jump):</p>${ab.compilerErrors.map((e) => `<button data-file="${escapeAttr(e.file)}" data-line="${e.line}" onclick="jumpToProblemLine(this.dataset.file, Number(this.dataset.line))" class="w-full text-left p-2 rounded-xl bg-rose-500/15 text-rose-200 font-mono text-[11px]"><b>${escapeAttr(e.file)}:${e.line}</b> — ${escapeAttr(e.message)}</button>`).join("")}</div>` : ""}${(ab.steps || []).length ? `<div class="space-y-1 pt-2 border-t border-[#2b264e]">${ab.steps.map((s) => `<div class="flex justify-between font-mono text-[11px]"><span>${escapeAttr(s.name)}</span><span class="${s.conclusion === "failure" ? "text-rose-400" : s.conclusion === "success" ? "text-emerald-400" : "text-amber-300"}">${escapeAttr(s.conclusion || s.status)}</span></div>`).join("")}</div>` : ""}${ab.runUrl ? `<a href="${escapeAttr(ab.runUrl)}" target="_blank" class="inline-block text-purple-400 underline">Full GitHub Logs ↗</a>` : ""}</div>`}</div>` : ""}
            ${state.ghOutputSubTab === "logcat" ? `<div class="flex-1 flex flex-col min-h-0 p-3 space-y-2 text-xs"><div class="flex justify-between items-center"><span class="font-bold text-slate-400">Live Logcat</span><div class="flex gap-2"><button onclick="exportLogcatTxt()" class="px-3 py-1 rounded-lg bg-[#231f42] font-bold">Export .txt</button><button onclick="state.ghLogcat=[]; localStorage.removeItem('wevlo_logcat'); render()" class="px-3 py-1 rounded-lg bg-[#231f42] text-rose-400 font-bold">Clear</button></div></div><div class="flex-1 overflow-y-auto bg-[#0d0c18] border border-[#252142] rounded-2xl p-3 font-mono text-[11px] space-y-1">${state.ghLogcat.length === 0 ? `<p class="text-slate-500">No events yet.</p>` : state.ghLogcat.map((l) => `<div class="${l.level === "E" ? "text-rose-400" : l.level === "W" ? "text-amber-300" : "text-emerald-300"}">[${escapeAttr(l.time)}] ${escapeAttr(l.level)}/${escapeAttr(l.tag)}: ${escapeAttr(l.msg)}</div>`).join("")}</div></div>` : ""}
            ${state.ghOutputSubTab === "problems" ? `<div class="flex-1 overflow-y-auto p-4 space-y-2.5 text-xs">${issues.length === 0 ? `<p class="text-emerald-400 font-bold">✓ No problems found for ${fwInfo.name}.</p>` : issues.map((p, idx) => `<div class="p-3.5 rounded-2xl border ${p.severity === "error" ? "bg-rose-500/10 border-rose-500/40" : "bg-amber-500/10 border-amber-500/40"} space-y-2"><div class="flex justify-between items-center"><b class="text-rose-300">${escapeAttr(p.file)}:${p.line || 1}</b><span class="uppercase text-[10px] font-extrabold">${escapeAttr(p.severity)}</span></div><p class="text-slate-200">${escapeAttr(p.message)}</p><div class="flex gap-2">${p.fixPath ? `<button onclick="autoFixProblem(${idx})" class="btn-purple px-3.5 py-1.5 rounded-full text-[11px] font-bold">⚡ Auto-Fix</button>` : `<button data-file="${escapeAttr(p.file)}" data-line="${p.line || 1}" onclick="jumpToProblemLine(this.dataset.file, Number(this.dataset.line))" class="bg-[#27234a] px-3.5 py-1.5 rounded-full text-[11px] font-bold text-purple-200">Go to Line →</button>`}</div></div>`).join("")}</div>` : ""}
          </div>` : ""}
        </div>

        <div class="bg-[#17142e] border-t border-[#2b264e] grid grid-cols-4 text-[11px] font-bold shrink-0">
          ${[["files", "folder", "Files"], ["editor", "code-2", "Editor"], ["build", "rocket", "Build"], ["output", "terminal", "Output"]].map(([id, ic, lbl]) => `<button onclick="switchGhIdeTab('${id}')" class="relative py-2.5 flex flex-col items-center gap-1 ${tab === id ? "text-purple-400 border-t-2 border-purple-500" : "text-slate-400"}"><i data-lucide="${ic}" class="w-4 h-4"></i>${id === "editor" ? `<span id="editorTabDot" class="${dirtyCount > 0 || state.ghIdeDirty ? "" : "hidden"} absolute top-2 right-[34%] w-2 h-2 rounded-full bg-amber-400"></span>` : ""}<span>${lbl}</span></button>`).join("")}
        </div>

        ${state.ghWizardOpen ? `<div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3"><div class="bg-[#1b1833] border border-[#342f61] w-full max-w-md rounded-[26px] p-5 space-y-3.5 animate-slide-up text-xs"><div class="flex justify-between items-center"><h3 class="font-extrabold text-base">⚡ New Activity Wizard</h3><button onclick="state.ghWizardOpen=false; render()" class="p-1.5 rounded-full bg-[#2a254d]"><i data-lucide="x" class="w-4 h-4"></i></button></div><div><label class="font-bold">Activity Name</label><input id="wizActName" placeholder="ProfileActivity" class="w-full mt-1 bg-[#121024] border border-[#3b3569] rounded-xl px-3.5 py-2.5 text-white" /></div><div><label class="font-bold">Package Name</label><input id="wizPkgName" value="${escapeAttr(appCfg.packageName || "com.wevlo.app")}" class="w-full mt-1 bg-[#121024] border border-[#3b3569] rounded-xl px-3.5 py-2.5 text-white" /></div><button onclick="confirmCreateActivityWizard()" class="w-full btn-purple py-3 rounded-full font-bold text-sm">Create Activity + XML</button></div></div>` : ""}
        ${state.ghLibModalOpen ? `<div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3"><div class="bg-[#1b1833] border border-[#342f61] w-full max-w-md max-h-[85vh] overflow-y-auto rounded-[26px] p-5 space-y-3 animate-slide-up text-xs"><div class="flex justify-between items-center"><h3 class="font-extrabold text-base">📦 Gradle Library Manager</h3><button onclick="state.ghLibModalOpen=false; render()" class="p-1.5 rounded-full bg-[#2a254d]"><i data-lucide="x" class="w-4 h-4"></i></button></div>${ANDROID_LIBRARIES.map((lib) => { const coord = lib.impl.split("\n")[0].match(/['"]([^'"]+)['"]/)?.[1] || lib.impl.split("\n")[0]; const added = (state.ghGradleFileText || "").includes(coord); return `<div class="p-3 rounded-2xl bg-[#121024] border border-[#2c2754] flex items-center justify-between gap-2"><div><p class="font-bold text-white">${lib.name}</p><p class="text-[11px] text-slate-400">${lib.desc}</p></div><button onclick="addGradleLibrary('${lib.id}')" class="px-3 py-1.5 rounded-full font-bold shrink-0 ${added ? "bg-emerald-500/20 text-emerald-300" : "btn-purple"}">${added ? "✓ Added" : "+ Add"}</button></div>`; }).join("")}</div></div>` : ""}
        ${state.ghItemMenu ? `<div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3"><div class="bg-[#1b1833] border border-[#342f61] w-full max-w-sm rounded-[26px] p-5 space-y-2.5 animate-slide-up text-xs font-bold"><div class="flex justify-between items-center pb-1"><span class="truncate text-purple-300">${escapeAttr(state.ghItemMenu.path)}</span><button onclick="state.ghItemMenu=null; render()" class="p-1 rounded-full bg-[#2a254d]"><i data-lucide="x" class="w-4 h-4"></i></button></div>${state.ghItemMenu.type === "folder" ? `<button data-path="${escapeAttr(state.ghItemMenu.path)}" onclick="openGhNewFileModal(this.dataset.path + '/')" class="w-full text-left p-3 rounded-2xl bg-[#242047]">+ New file in this folder</button><label class="block w-full text-left p-3 rounded-2xl bg-[#242047] cursor-pointer">↑ Upload files into this folder<input type="file" multiple class="hidden" data-prefix="${escapeAttr(state.ghItemMenu.path)}" onchange="uploadFilesToCurrentRepo(event, this.dataset.prefix)" /></label>` : `<button data-path="${escapeAttr(state.ghItemMenu.path)}" onclick="state.ghItemMenu=null; openGhIdeFile(this.dataset.path)" class="w-full text-left p-3 rounded-2xl bg-[#242047]">Open in Editor</button><button data-path="${escapeAttr(state.ghItemMenu.path)}" onclick="deleteGhRepoFile(this.dataset.path)" class="w-full text-left p-3 rounded-2xl bg-rose-500/20 text-rose-300">Delete from GitHub</button>`}<button data-path="${escapeAttr(state.ghItemMenu.path)}" onclick="navigator.clipboard?.writeText(this.dataset.path); state.ghItemMenu=null; render(); showToast('Copied!','success')" class="w-full text-left p-3 rounded-2xl bg-[#242047]">Copy path</button></div></div>` : ""}
        ${state.ghTaskPickerOpen ? `<div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3"><div class="bg-[#1c1936] border border-[#342f61] w-full max-w-md rounded-3xl p-4 space-y-2 animate-slide-up">${gradleTasks.map(([t, d]) => `<button onclick="state.ghGradleTask='${t}'; state.ghTaskPickerOpen=false; render()" class="w-full text-left p-3.5 rounded-2xl ${state.ghGradleTask === t ? "bg-purple-600/30 border border-purple-500" : "hover:bg-white/5"}"><p class="font-extrabold text-sm text-white">${t}</p><p class="text-xs text-slate-400">${d}</p></button>`).join("")}</div></div>` : ""}
        ${state.ghNewFileModalOpen ? `<div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3"><div class="bg-[#1b1833] border border-[#342f61] w-full max-w-md rounded-[26px] p-5 space-y-4 animate-slide-up"><div class="flex justify-between items-center"><h3 class="font-extrabold text-lg text-white">New file</h3><button onclick="state.ghNewFileModalOpen=false; render()" class="w-8 h-8 rounded-full bg-[#2a254d] flex items-center justify-center"><i data-lucide="x" class="w-4 h-4"></i></button></div><div><label class="text-xs text-slate-400">File path (folders separated by /)</label><input id="ghNewFilePathInput" value="${escapeAttr(state.ghNewFilePrefix || "")}" placeholder="lib/screens/chat_screen.dart" class="w-full mt-1.5 bg-[#121024] border border-[#3b3569] rounded-2xl px-4 py-3 text-sm text-white focus:outline-none" /></div><div class="grid grid-cols-2 gap-3"><button onclick="state.ghNewFileModalOpen=false; render()" class="py-3 rounded-2xl bg-[#2a254d] font-bold text-sm">Cancel</button><button onclick="createGhNewFileConfirm()" class="py-3 rounded-2xl btn-purple font-bold text-sm">Create</button></div></div></div>` : ""}
      </div>`;
  }

  // ======================================================
  // STEP 1 & 2: Clickable Repository List + File Upload + New App Creator
  // ======================================================
  const repos = (state.githubRepos || []).filter((r) => r.full_name.toLowerCase().includes((state.repoFilter || "").toLowerCase()));
  const selectedLang = state.newRepoLang || "java";
  const autoFilesList = Object.keys(FRAMEWORK_STARTERS[selectedLang] || {});
  const defaultPrefix = sanitizePackageName(state.profile?.pkgPrefix || "com.wevlo", "com.wevlo");

  return `
    <div class="max-w-5xl mx-auto px-4 py-5 space-y-5 relative">
      ${state.githubToken && state.selectedGhRepo ? `
      <div class="wevlo-card p-4 bg-violet-600/10 border-violet-500/40 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-[11px] font-bold text-violet-600 uppercase">Active Workspace Ready</p>
          <p class="font-extrabold text-sm">${escapeAttr(state.selectedGhRepo)} <span class="text-xs text-muted">(${escapeAttr(state.ghBranch || "main")})</span></p>
        </div>
        <div class="flex items-center gap-2">
          <label class="px-4 py-2 rounded-full border border-violet-500/40 text-violet-700 text-xs font-bold cursor-pointer hover:bg-violet-500/10">
            ↑ Upload Files
            <input type="file" multiple class="hidden" onchange="uploadFilesToCurrentRepo(event, '')" />
          </label>
          <button data-repo="${escapeAttr(state.selectedGhRepo)}" data-branch="${escapeAttr(state.ghBranch || "main")}" onclick="openGhVsCodeIde(this.dataset.repo, this.dataset.branch)" class="btn-purple px-5 py-2.5 rounded-full text-xs font-bold">⚡ Open IDE →</button>
        </div>
      </div>` : ""}

      <div class="wevlo-card p-4 flex items-center justify-between text-xs font-bold">
        <div class="flex items-center gap-1.5 text-violet-700"><span class="w-6 h-6 rounded-full btn-purple flex items-center justify-center">${state.githubToken ? "✓" : "1"}</span><span>Connect GitHub</span></div>
        <div class="flex-1 h-0.5 bg-violet-200 mx-2"></div>
        <div class="flex items-center gap-1.5 ${state.githubToken ? "text-violet-700" : "text-muted"}"><span class="w-6 h-6 rounded-full ${state.githubToken ? "btn-purple" : "bg-slate-200 text-slate-600"} flex items-center justify-center">2</span><span>Select Project</span></div>
        <div class="flex-1 h-0.5 bg-slate-200 mx-2"></div>
        <div class="flex items-center gap-1.5 text-muted"><span class="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">3</span><span>Code &amp; Build</span></div>
      </div>

      <div class="wevlo-card p-4 space-y-2.5 text-xs">
        <p class="font-extrabold text-sm">🚀 New Hello World App by Language</p>
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
          ${APP_FRAMEWORKS.map((fw) => `<button onclick="state.newRepoLang='${fw.id}'; state.ghNewProjModalOpen=true; render()" class="p-3 rounded-2xl border border-soft hover:border-violet-500 text-left transition wevlo-card-hover"><p class="font-extrabold">${fw.badge}</p><p class="text-[10px] text-muted mt-0.5">${fw.desc}</p></button>`).join("")}
        </div>
      </div>

      <div class="wevlo-card p-5 space-y-3 text-xs">
        <span class="text-[10px] font-bold bg-violet-600 text-white px-2.5 py-0.5 rounded-full">Step 1 of 3</span>
        <h3 class="font-extrabold text-base">Connect Your GitHub Account</h3>
        ${state.githubToken
          ? `<div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex justify-between items-center text-slate-900"><span class="font-bold">✓ @${escapeAttr(state.githubUser?.login || "Connected")}</span><button onclick="confirmLogout()" class="bg-white border px-3 py-1 rounded-full font-bold">Disconnect</button></div>`
          : `<div class="flex flex-wrap gap-2"><button onclick="loginWithGithub()" class="btn-purple px-5 py-2.5 rounded-full font-bold">Connect GitHub Account</button><button onclick="openGhTokenModal()" class="border border-soft px-4 py-2.5 rounded-full font-bold">Connect via Token</button></div>`}
      </div>

      <div class="wevlo-card p-5 space-y-4 text-xs relative">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span class="text-[10px] font-bold bg-violet-600 text-white px-2.5 py-0.5 rounded-full">Step 2 of 3</span>
            <h3 class="font-extrabold text-base mt-1.5">Your GitHub Repositories (${repos.length})</h3>
          </div>
          <div class="flex flex-wrap gap-2 relative">
            <button onclick="loadGithubRepos().then(()=>render())" class="border border-soft px-3.5 py-2 rounded-full font-bold hover:bg-violet-500/5">↻ Refresh</button>
            <button onclick="state.ghNewProjModalOpen=true; render()" class="btn-purple px-4 py-2 rounded-full font-bold">+ New</button>
            <button onclick="state.ghImportMenuOpen=!state.ghImportMenuOpen; render()" class="border border-soft px-3.5 py-2 rounded-full font-bold hover:bg-violet-500/5">↑ Upload / Import</button>

            ${state.ghImportMenuOpen ? `<div class="absolute right-0 top-11 z-40 w-72 surface-card rounded-2xl shadow-2xl p-2.5 space-y-1">
              ${state.selectedGhRepo ? `<label class="flex items-center gap-3 p-3 rounded-xl bg-violet-500/10 hover:bg-violet-500/15 cursor-pointer"><i data-lucide="upload-cloud" class="w-5 h-5 text-violet-600 shrink-0"></i><div><p class="font-bold text-violet-700">Upload to ${escapeAttr(state.selectedGhRepo.split("/")[1])}</p><p class="text-[11px] text-muted">Add files to selected repo</p></div><input type="file" multiple class="hidden" onchange="uploadFilesToCurrentRepo(event, '')" /></label>` : ""}
              <label class="flex items-center gap-3 p-3 rounded-xl hover:bg-violet-500/10 cursor-pointer"><i data-lucide="file-plus" class="w-5 h-5 text-violet-600 shrink-0"></i><div><p class="font-bold">New Repo from Files</p><p class="text-[11px] text-muted">Pick one or more files</p></div><input type="file" multiple class="hidden" onchange="handleImportFiles(event)" /></label>
              <label class="flex items-center gap-3 p-3 rounded-xl hover:bg-violet-500/10 cursor-pointer"><i data-lucide="archive" class="w-5 h-5 text-violet-600 shrink-0"></i><div><p class="font-bold">New Repo from ZIP</p><p class="text-[11px] text-muted">Extracts ZIP into a new repo</p></div><input type="file" accept=".zip" class="hidden" onchange="handleImportZip(event)" /></label>
              <label class="flex items-center gap-3 p-3 rounded-xl hover:bg-violet-500/10 cursor-pointer"><i data-lucide="folder-plus" class="w-5 h-5 text-violet-600 shrink-0"></i><div><p class="font-bold">New Repo from Folder</p><p class="text-[11px] text-muted">Upload an entire project folder</p></div><input type="file" webkitdirectory multiple class="hidden" onchange="handleImportFiles(event)" /></label>
            </div>` : ""}
          </div>
        </div>

        <input value="${escapeAttr(state.repoFilter || "")}" oninput="state.repoFilter=this.value; render()" placeholder="Search repositories..." class="w-full border border-soft rounded-xl px-3.5 py-2.5 bg-transparent focus:outline-none focus:border-violet-500" />

        ${!state.githubToken
          ? `<p class="text-center text-muted py-6">Connect your GitHub account above to load and click your repositories.</p>`
          : repos.length === 0
          ? `<div class="text-center py-8 space-y-2"><p class="text-muted">No matching repositories found.</p><button onclick="state.ghNewProjModalOpen=true; render()" class="btn-purple px-4 py-2 rounded-full font-bold">+ Create First Repository</button></div>`
          : `<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
              ${repos.map((r) => {
                const isSelected = state.selectedGhRepo === r.full_name;
                return `
                  <button type="button" data-repo="${escapeAttr(r.full_name)}" data-branch="${escapeAttr(r.default_branch || "main")}" onclick="openGhVsCodeIde(this.dataset.repo, this.dataset.branch)" class="text-left p-3.5 rounded-2xl border transition flex items-center justify-between gap-2 wevlo-card-hover ${isSelected ? "border-violet-600 bg-violet-500/10" : "border-soft"}">
                    <div class="min-w-0">
                      <p class="font-extrabold text-sm truncate">${escapeAttr(r.name)}</p>
                      <p class="text-[11px] text-muted truncate">${r.private ? "🔒 Private" : "🌐 Public"} • ${escapeAttr(r.default_branch || "main")} ${r.language ? "• " + escapeAttr(r.language) : ""}</p>
                    </div>
                    <span class="px-3 py-1.5 rounded-full text-[11px] font-bold shrink-0 ${isSelected ? "btn-purple" : "bg-violet-500/10 text-violet-600"}">Open →</span>
                  </button>`;
              }).join("")}
            </div>`}

        <div class="pt-2 border-t border-soft flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2 flex-1 min-w-[200px]">
            <span class="text-muted font-bold">Branch:</span>
            <input value="${escapeAttr(state.ghBranch || "main")}" oninput="state.ghBranch=this.value" placeholder="Branch" class="flex-1 border border-soft rounded-xl px-3 py-1.5 bg-transparent" />
          </div>
          <button onclick="state.ghKeystoreModalOpen=true; render()" class="text-violet-600 font-bold px-2 py-1">🔒 Create signing keystore</button>
        </div>
      </div>

      ${state.ghNewProjModalOpen ? `<div class="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
        <div class="surface-card w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[28px] p-6 space-y-3.5 shadow-2xl animate-slide-up text-xs">
          <div class="flex justify-between items-center"><h3 class="text-lg font-extrabold flex items-center gap-2"><i data-lucide="github" class="w-5 h-5 text-violet-600"></i> New Project</h3><button onclick="state.ghNewProjModalOpen=false; render()" class="p-1.5 rounded-full hover:bg-violet-500/10"><i data-lucide="x" class="w-4 h-4"></i></button></div>
          <div><label class="font-bold text-muted">Select Language</label><div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-1.5">${APP_FRAMEWORKS.map((fw) => `<button type="button" onclick="state.newRepoLang='${fw.id}'; render()" class="p-2 rounded-xl border text-left font-bold ${selectedLang === fw.id ? "border-violet-600 bg-violet-50 text-violet-800" : "border-soft"}">${fw.badge}</button>`).join("")}</div></div>
          <div>
            <label class="font-bold text-muted">Repository name</label>
            <input id="ghModalRepoName" placeholder="my-${selectedLang}-app" oninput="const slug=this.value.toLowerCase().replace(/[^a-z0-9]/g,'')||'myapp'; const appI=document.getElementById('ghModalAppName'); const pkgI=document.getElementById('ghModalPkgName'); if(appI && !appI.dataset.edited) appI.value=this.value; if(pkgI && !pkgI.dataset.edited) pkgI.value='${defaultPrefix}.'+slug;" class="w-full mt-1 border border-soft rounded-2xl px-4 py-2.5 text-sm bg-transparent" />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label class="font-bold text-muted">App Name</label>
              <input id="ghModalAppName" placeholder="My App" oninput="this.dataset.edited='1'" class="w-full mt-1 border border-soft rounded-2xl px-3.5 py-2 bg-transparent" />
            </div>
            <div>
              <label class="font-bold text-muted">Package Name (Unique ID)</label>
              <input id="ghModalPkgName" placeholder="${defaultPrefix}.myapp" oninput="this.dataset.edited='1'" class="w-full mt-1 border border-soft rounded-2xl px-3.5 py-2 bg-transparent font-mono" />
            </div>
            <div>
              <label class="font-bold text-muted">Version Name</label>
              <input id="ghModalVerName" value="1.0.0" class="w-full mt-1 border border-soft rounded-2xl px-3.5 py-2 bg-transparent font-mono" />
            </div>
            <div>
              <label class="font-bold text-muted">Version Code</label>
              <input id="ghModalVerCode" type="number" min="1" value="1" class="w-full mt-1 border border-soft rounded-2xl px-3.5 py-2 bg-transparent font-mono" />
            </div>
          </div>
          <div class="p-3 rounded-2xl bg-violet-500/5 border border-soft space-y-1"><p class="font-bold text-violet-700">Optional Demo Starter Files (${autoFilesList.length}):</p><p class="text-[11px] text-muted font-mono break-all">${autoFilesList.join(", ")}, wevlo-build.yml</p></div>
          <div class="flex gap-2">
            <button onclick="state.newRepoPriv='private'; render()" class="flex-1 p-2.5 rounded-2xl border font-bold ${state.newRepoPriv === "private" ? "border-violet-600 bg-violet-50 text-violet-800" : "border-soft"}">● Private</button>
            <button onclick="state.newRepoPriv='public'; render()" class="flex-1 p-2.5 rounded-2xl border font-bold ${state.newRepoPriv === "public" ? "border-violet-600 bg-violet-50 text-violet-800" : "border-soft"}">○ Public</button>
          </div>
          <label class="flex items-start gap-2.5 p-3 rounded-2xl border border-soft cursor-pointer"><input type="checkbox" ${state.newRepoStarter ? "checked" : ""} onchange="state.newRepoStarter=this.checked" class="mt-0.5 accent-violet-600" /><div><b>Auto-setup Demo Hello World &amp; build workflow</b><p class="text-[11px] text-muted">Uncheck if you want an empty repo to upload your own code.</p></div></label>
          <div class="flex justify-end gap-2"><button onclick="state.ghNewProjModalOpen=false; render()" class="px-5 py-2.5 rounded-full border border-soft font-bold">Cancel</button><button onclick="confirmCreateGhNewProject()" class="btn-purple px-5 py-2.5 rounded-full font-bold">+ Create &amp; open</button></div>
        </div>
      </div>` : ""}

      ${state.ghKeystoreModalOpen ? `<div class="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-3"><div class="surface-card w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[28px] p-6 space-y-3 shadow-2xl animate-slide-up text-xs"><div class="flex justify-between items-center"><h3 class="text-lg font-extrabold flex items-center gap-2"><i data-lucide="lock" class="w-5 h-5 text-violet-600"></i> Create signing keystore</h3><button onclick="state.ghKeystoreModalOpen=false; render()" class="p-1.5 rounded-full hover:bg-violet-500/10"><i data-lucide="x" class="w-4 h-4"></i></button></div><p class="text-muted">A keystore signs your release APK / AAB. Created safely in your browser.</p><div><label class="font-bold">Name or app</label><input id="ksName" placeholder="My Android App" class="w-full mt-1 border border-soft rounded-xl px-3.5 py-2.5 bg-transparent" /></div><div><label class="font-bold">Organization</label><input id="ksOrg" class="w-full mt-1 border border-soft rounded-xl px-3.5 py-2.5 bg-transparent" /></div><div class="grid grid-cols-2 gap-2.5"><div><label class="font-bold">Country</label><input id="ksCountry" value="US" class="w-full mt-1 border border-soft rounded-xl px-3.5 py-2.5 bg-transparent" /></div><div><label class="font-bold">Valid (years)</label><input id="ksYears" value="25" class="w-full mt-1 border border-soft rounded-xl px-3.5 py-2.5 bg-transparent" /></div></div><div><label class="font-bold">Key alias</label><input id="ksAlias" value="key0" class="w-full mt-1 border border-soft rounded-xl px-3.5 py-2.5 bg-transparent" /></div><div><label class="font-bold">Password</label><div class="flex gap-1.5 mt-1"><input id="ksPassInput" type="password" placeholder="Min 6 chars" class="flex-1 border border-soft rounded-xl px-3.5 py-2.5 bg-transparent" /><button type="button" onclick="const i=document.getElementById('ksPassInput'); i.type=i.type==='password'?'text':'password'" class="px-3 border border-soft rounded-xl">👁</button><button type="button" onclick="generateRandomKeyPass()" class="px-3 border border-soft rounded-xl">↻</button></div></div><div class="flex justify-end gap-2 pt-2"><button onclick="state.ghKeystoreModalOpen=false; render()" class="px-5 py-2.5 rounded-full border border-soft font-bold">Cancel</button><button onclick="confirmCreateKeystore()" class="btn-purple px-5 py-2.5 rounded-full font-bold">🛡 Create keystore</button></div></div></div>` : ""}
    </div>`;
}

