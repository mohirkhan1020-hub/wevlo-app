// ======================================================
// Pro Mobile Code Editor & Exact Android Studio GitHub IDE
// ======================================================

function ensureProjectFiles(proj) {
  if (!proj.files || !Array.isArray(proj.files) || proj.files.length === 0) {
    proj.files = [
      {
        name: "index.html",
        lang: "HTML",
        content:
          proj.html ||
          `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>${proj.name}</title>\n  <style>\n    * { box-sizing: border-box; margin: 0; padding: 0; }\n    body { font-family: sans-serif; background: #f8fafc; color: #0f172a; padding: 20px; }\n    h1 { font-size: 2rem; color: #2563eb; margin-bottom: 10px; }\n  </style>\n</head>\n<body>\n  <h1>${proj.name}</h1>\n  <p>Edit this page and press Play to preview.</p>\n</body>\n</html>`
      },
      {
        name: "styles.css",
        lang: "CSS",
        content: proj.css || `body {\n  font-family: sans-serif;\n  background: #f8fafc;\n}`
      },
      {
        name: "script.js",
        lang: "JS",
        content: proj.js || `console.log("App ready!");`
      }
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

function getFileBadge(path) {
  if (path.endsWith(".java"))
    return `<span class="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-extrabold inline-flex items-center justify-center shrink-0">J</span>`;
  if (path.endsWith(".kt"))
    return `<span class="w-5 h-5 rounded-md bg-purple-500/20 text-purple-400 text-[10px] font-extrabold inline-flex items-center justify-center shrink-0">K</span>`;
  if (path.endsWith(".gradle"))
    return `<span class="w-5 h-5 rounded-md bg-teal-500/20 text-teal-300 text-[10px] font-extrabold inline-flex items-center justify-center shrink-0">G</span>`;
  if (path.endsWith(".xml"))
    return `<span class="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 text-[9px] font-extrabold inline-flex items-center justify-center shrink-0">&lt;&gt;</span>`;
  if (path.endsWith(".properties"))
    return `<span class="w-5 h-5 rounded-md bg-slate-500/25 text-slate-300 text-[10px] font-extrabold inline-flex items-center justify-center shrink-0">P</span>`;
  if (path.endsWith(".md"))
    return `<span class="w-5 h-5 rounded-md bg-sky-500/20 text-sky-400 text-[10px] font-extrabold inline-flex items-center justify-center shrink-0">M</span>`;
  return `<span class="w-5 h-5 rounded-md bg-slate-500/20 text-slate-400 text-[10px] font-extrabold inline-flex items-center justify-center shrink-0">•</span>`;
}

// ======================================================
// ১. Full-Screen Mobile Pro Code Editor
// ======================================================
export function renderProCodeEditor(ctx) {
  const { state, saveProjects, navigate, showToast, render, openNewProjectModal } = ctx;
  const proj = state.projects.find((p) => p.id === state.activeProjectId) || state.projects[0];

  if (!proj) {
    return `
      <div class="max-w-5xl mx-auto px-4 py-6">
        <div class="wevlo-card p-6">
          <div class="flex items-center justify-between mb-8">
            <div class="flex items-center gap-2"><i data-lucide="folder" class="w-5 h-5 text-purple-600"></i><h2 class="font-extrabold text-base">Choose a project</h2></div>
            <button onclick="openNewProjectModal()" class="btn-purple px-4 py-2 rounded-full text-xs font-bold">+ New project</button>
          </div>
          <div class="py-10 text-center space-y-2">
            <i data-lucide="folder" class="w-10 h-10 mx-auto text-muted"></i>
            <p class="font-bold">No projects yet</p>
            <p class="text-xs text-muted">Create a project first, then come back to edit.</p>
          </div>
        </div>
      </div>`;
  }

  const files = ensureProjectFiles(proj);
  if (!state.edActiveFile || !files.some((f) => f.name === state.edActiveFile)) {
    state.edActiveFile = files[0].name;
  }
  const activeFile = files.find((f) => f.name === state.edActiveFile) || files[0];
  const fontSize = state.edFontSize || 15;
  const wordWrap = state.edWrap !== false;
  const indentSize = state.edIndent || 2;
  const content = activeFile.content || "";
  const linesCount = Math.max(content.split("\n").length, 20);
  const gutterHtml = Array.from({ length: linesCount }, (_, i) => `<div>${i + 1}</div>`).join("");

  if (!state.edUndoStack) state.edUndoStack = {};
  if (!state.edUndoStack[activeFile.name]) state.edUndoStack[activeFile.name] = { list: [content], idx: 0 };

  window.toggleEdDrawer = (open) => { state.edDrawerOpen = open; render(); };
  window.selectEdFile = (name) => { state.edActiveFile = name; state.edDrawerOpen = false; render(); };
  window.createEdNewFile = () => {
    const name = prompt("New file name (e.g. about.html or app.js):");
    if (!name || !name.trim()) return;
    const clean = name.trim();
    if (files.some((f) => f.name === clean)) return showToast("File already exists!", "error");
    files.push({ name: clean, lang: clean.split(".").pop().toUpperCase(), content: "" });
    state.edActiveFile = clean;
    state.edDrawerOpen = false;
    saveProjects();
    render();
  };
  window.importEdFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      files.push({ name: file.name, lang: file.name.split(".").pop().toUpperCase(), content: r.result });
      state.edActiveFile = file.name;
      state.edDrawerOpen = false;
      syncProjectPreviewData(proj);
      saveProjects();
      render();
    };
    r.readAsText(file);
  };
  window.exportEdProject = () => {
    syncProjectPreviewData(proj);
    const full = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${proj.css}</style></head><body>${proj.html}<script>${proj.js}<\/script></body></html>`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([full], { type: "text/html" }));
    a.download = `${proj.name.replace(/\s+/g, "-").toLowerCase()}.html`;
    a.click();
    showToast("Downloaded project!", "success");
  };
  window.deleteEdFile = (name) => {
    if (files.length <= 1) return showToast("কমপক্ষে ১টি ফাইল থাকতে হবে!", "error");
    proj.files = files.filter((f) => f.name !== name);
    state.edActiveFile = proj.files[0].name;
    syncProjectPreviewData(proj);
    saveProjects();
    render();
  };
  window.onEdInput = (el, pushUndo = true) => {
    activeFile.content = el.value;
    syncProjectPreviewData(proj);
    saveProjects();
    if (pushUndo) {
      const st = state.edUndoStack[activeFile.name];
      if (st.list[st.idx] !== el.value) {
        st.list = st.list.slice(0, st.idx + 1);
        st.list.push(el.value);
        if (st.list.length > 40) st.list.shift();
        st.idx = st.list.length - 1;
      }
    }
    const g = document.getElementById("proGutter");
    if (g) g.innerHTML = Array.from({ length: Math.max(el.value.split("\n").length, 20) }, (_, i) => `<div>${i + 1}</div>`).join("");
    window.updateEdCursor(el);
  };
  window.edUndo = () => {
    const st = state.edUndoStack[activeFile.name];
    const ta = document.getElementById("proCodeArea");
    if (st && st.idx > 0 && ta) { st.idx -= 1; ta.value = st.list[st.idx]; window.onEdInput(ta, false); }
  };
  window.edRedo = () => {
    const st = state.edUndoStack[activeFile.name];
    const ta = document.getElementById("proCodeArea");
    if (st && st.idx < st.list.length - 1 && ta) { st.idx += 1; ta.value = st.list[st.idx]; window.onEdInput(ta, false); }
  };
  window.updateEdCursor = (el) => {
    const pos = el.selectionStart || 0;
    const before = el.value.slice(0, pos).split("\n");
    const info = document.getElementById("edCursorPos");
    if (info) info.textContent = `${activeFile.lang}   Ln ${before.length}, Col ${before[before.length - 1].length + 1}`;
  };
  window.insertEdSymbol = (sym) => {
    const ta = document.getElementById("proCodeArea");
    if (!ta) return;
    const txt = sym === "TAB" ? " ".repeat(indentSize) : sym;
    const s = ta.selectionStart, e = ta.selectionEnd;
    ta.value = ta.value.slice(0, s) + txt + ta.value.slice(e);
    ta.selectionStart = ta.selectionEnd = s + (txt.length === 2 && txt !== "  " ? 1 : txt.length);
    ta.focus();
    window.onEdInput(ta);
  };
  window.edAction = (type) => {
    const ta = document.getElementById("proCodeArea");
    if (!ta) return;
    const lines = ta.value.split("\n");
    const idx = ta.value.slice(0, ta.selectionStart || 0).split("\n").length - 1;
    if (type === "dup") lines.splice(idx + 1, 0, lines[idx]);
    if (type === "del" && lines.length > 1) lines.splice(idx, 1);
    if (type === "up" && idx > 0) [lines[idx - 1], lines[idx]] = [lines[idx], lines[idx - 1]];
    if (type === "down" && idx < lines.length - 1) [lines[idx + 1], lines[idx]] = [lines[idx], lines[idx + 1]];
    if (type === "comment") lines[idx] = lines[idx].startsWith("// ") ? lines[idx].slice(3) : "// " + lines[idx];
    ta.value = type === "indent" ? lines.map((l) => l.trimEnd()).join("\n") : lines.join("\n");
    window.onEdInput(ta);
    state.edActionsOpen = false;
    render();
  };
  window.runEdPreviewTab = () => {
    syncProjectPreviewData(proj);
    const full = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${proj.css}</style></head><body>${proj.html}<script>${proj.js}<\/script></body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.open(); w.document.write(full); w.document.close(); }
  };

  syncProjectPreviewData(proj);
  const quickPreviewDoc = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${proj.css}</style></head><body>${proj.html}<script>${proj.js}<\/script></body></html>`;

  return `
    <div class="h-[100dvh] w-full flex flex-col bg-[#1b1929] text-slate-100 relative overflow-hidden">
      <div class="bg-white text-slate-900 px-3 h-14 flex items-center justify-between border-b border-slate-200 shrink-0">
        <div class="flex items-center gap-2 min-w-0">
          <button onclick="navigate('#/projects')" class="p-1.5 rounded-full hover:bg-slate-100"><i data-lucide="arrow-left" class="w-5 h-5"></i></button>
          <button onclick="toggleEdDrawer(true)" class="p-2 rounded-xl bg-slate-100"><i data-lucide="menu" class="w-4 h-4"></i></button>
          <span class="font-extrabold text-base truncate">${proj.name}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <button onclick="state.edFindOpen=!state.edFindOpen; render()" class="p-2 rounded-xl hover:bg-slate-100"><i data-lucide="search" class="w-4 h-4"></i></button>
          <button onclick="state.edActionsOpen=true; render()" class="p-2 rounded-xl hover:bg-slate-100"><i data-lucide="more-horizontal" class="w-4 h-4"></i></button>
          <button onclick="saveProjects(); showToast('Saved!','success')" class="btn-purple p-2 rounded-xl"><i data-lucide="save" class="w-4 h-4"></i></button>
          <button onclick="state.edQuickPreview=true; render()" class="p-2 rounded-xl border border-slate-200 bg-white"><i data-lucide="play" class="w-4 h-4"></i></button>
          <button onclick="navigate('#/build')" class="p-2 rounded-xl border border-slate-200 bg-white text-purple-600"><i data-lucide="rocket" class="w-4 h-4"></i></button>
        </div>
      </div>

      <div class="bg-[#242136] px-2 pt-1.5 flex items-center gap-1 overflow-x-auto border-b border-[#322e4a] shrink-0">
        ${files.map((f) => `<button onclick="selectEdFile('${f.name}')" class="px-3.5 py-2 rounded-t-xl text-xs font-semibold flex items-center gap-2 shrink-0 ${f.name === activeFile.name ? "bg-[#1b1929] text-white" : "text-slate-400"}"><span class="w-2.5 h-2.5 rounded-sm ${f.name.endsWith(".html") ? "bg-orange-500" : f.name.endsWith(".css") ? "bg-sky-400" : "bg-amber-400"}"></span>${f.name}</button>`).join("")}
      </div>

      <div class="bg-[#1f1c2e] px-3 py-2 flex items-center justify-between gap-2 border-b border-[#322e4a] text-slate-300 text-xs shrink-0">
        <div class="flex items-center gap-2">
          <button onclick="edUndo()" class="p-1.5 rounded hover:bg-white/10"><i data-lucide="undo-2" class="w-4 h-4"></i></button>
          <button onclick="edRedo()" class="p-1.5 rounded hover:bg-white/10"><i data-lucide="redo-2" class="w-4 h-4"></i></button>
          <button onclick="edAction('comment')" class="px-2 py-1 rounded hover:bg-white/10 font-mono">//</button>
          <button onclick="state.edWrap=!${wordWrap}; render()" class="px-2.5 py-1 rounded-lg ${wordWrap ? "bg-purple-600 text-white" : "hover:bg-white/10"}">Wrap</button>
        </div>
        <div class="flex items-center gap-2.5">
          <button onclick="state.edFontSize=Math.max(11,${fontSize}-1); render()" class="font-bold">A-</button>
          <span class="font-bold text-white">${fontSize}</span>
          <button onclick="state.edFontSize=Math.min(22,${fontSize}+1); render()" class="font-bold">A+</button>
        </div>
      </div>

      ${state.edFindOpen ? `<div class="bg-[#242136] px-3 py-2 flex items-center gap-2 border-b border-[#322e4a] shrink-0"><input id="edFindInput" placeholder="Find text..." class="flex-1 bg-[#1b1929] border border-[#3d385c] rounded-lg px-2.5 py-1.5 text-xs text-white" /><button onclick="const q=document.getElementById('edFindInput').value; const ta=document.getElementById('proCodeArea'); const i=ta.value.indexOf(q); if(i>=0){ta.focus();ta.setSelectionRange(i,i+q.length);}else{showToast('Not found','error')}" class="btn-purple px-3 py-1.5 rounded-lg text-xs font-bold">Find</button></div>` : ""}

      <div class="flex-1 flex min-h-0 bg-[#1b1929]">
        <div id="proGutter" class="code-gutter font-mono bg-[#181625] border-r border-[#2d2945]" style="font-size:${fontSize}px">${gutterHtml}</div>
        <textarea id="proCodeArea" oninput="onEdInput(this)" onclick="updateEdCursor(this)" onkeyup="updateEdCursor(this)" onscroll="document.getElementById('proGutter').scrollTop=this.scrollTop" wrap="${wordWrap ? "soft" : "off"}" style="font-size:${fontSize}px" class="code-input flex-1 bg-[#1b1929] text-slate-100 font-mono p-3.5 focus:outline-none ${wordWrap ? "" : "whitespace-pre overflow-x-auto"}">${content.replace(/</g, "&lt;")}</textarea>
      </div>

      <div class="bg-[#242136] px-2 py-2 flex items-center gap-1.5 overflow-x-auto border-t border-[#322e4a] shrink-0">
        ${[["Tab", "TAB"], ["{ }", "{}"], ["( )", "()"], ["[ ]", "[]"], ['" "', '""'], ["< >", "<>"], [";", ";"], ["=", "="]]
          .map(([lbl, val]) => `<button onclick='insertEdSymbol(${JSON.stringify(val)})' class="px-3 h-9 rounded-xl bg-[#2f2b47] hover:bg-purple-600 text-white font-mono text-xs font-bold shrink-0">${lbl}</button>`)
          .join("")}
      </div>

      <div class="bg-[#13111d] px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
        <span id="edCursorPos">${activeFile.lang} &nbsp; Ln 1, Col 1</span>
        <span class="flex items-center gap-1.5 text-emerald-400 font-semibold"><span class="w-2 h-2 rounded-full bg-emerald-400"></span> Saved</span>
      </div>

      ${state.edDrawerOpen ? `<div class="absolute inset-0 z-40 flex"><div class="w-72 bg-white text-slate-900 h-full flex flex-col justify-between p-4 shadow-2xl"><div class="space-y-4 overflow-y-auto"><div class="flex items-center justify-between"><div class="flex items-center gap-2.5"><span class="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center"><i data-lucide="folder" class="w-5 h-5"></i></span><div><p class="font-extrabold text-sm">${proj.name}</p><p class="text-[11px] text-slate-500">${files.length} files</p></div></div><button onclick="toggleEdDrawer(false)" class="p-1.5 rounded-xl bg-slate-100"><i data-lucide="x" class="w-4 h-4"></i></button></div><div class="grid grid-cols-4 gap-1.5 text-center text-[10px] font-bold"><button onclick="createEdNewFile()" class="p-2 rounded-xl border flex flex-col items-center gap-1"><i data-lucide="file-plus" class="w-4 h-4 text-purple-600"></i>New file</button><button onclick="createEdNewFile()" class="p-2 rounded-xl border flex flex-col items-center gap-1"><i data-lucide="folder-plus" class="w-4 h-4 text-purple-600"></i>Folder</button><label class="p-2 rounded-xl border flex flex-col items-center gap-1 cursor-pointer"><i data-lucide="upload" class="w-4 h-4 text-purple-600"></i>Import<input type="file" class="hidden" onchange="importEdFile(event)" /></label><button onclick="exportEdProject()" class="p-2 rounded-xl border flex flex-col items-center gap-1"><i data-lucide="download" class="w-4 h-4 text-purple-600"></i>Export</button></div><div class="space-y-1.5">${files.map((f) => `<div class="flex items-center justify-between px-3 py-2.5 rounded-xl ${f.name === activeFile.name ? "bg-purple-50 border-l-4 border-purple-600 text-purple-800 font-bold" : ""}"><button onclick="selectEdFile('${f.name}')" class="flex items-center gap-2 text-xs flex-1 text-left">&lt;/&gt; ${f.name}</button><button onclick="deleteEdFile('${f.name}')" class="text-slate-400 hover:text-rose-500 p-1"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button></div>`).join("")}</div></div><p class="text-[11px] text-slate-400 pt-2 border-t">${files.length} files</p></div><div onclick="toggleEdDrawer(false)" class="flex-1 bg-black/40"></div></div>` : ""}

      ${state.edActionsOpen ? `<div class="fixed inset-0 z-50 bg-slate-900/50 flex items-end sm:items-center justify-center"><div class="bg-white text-slate-900 w-full sm:max-w-md rounded-t-[28px] sm:rounded-[28px] p-5 space-y-2.5 animate-slide-up"><div class="flex justify-between items-center"><div><h3 class="font-extrabold text-base">Editor actions</h3><p class="text-xs text-slate-500">${activeFile.name} • ${linesCount} lines</p></div><button onclick="state.edActionsOpen=false; render()" class="p-1.5 rounded-full bg-slate-100"><i data-lucide="x" class="w-4 h-4"></i></button></div><div class="grid grid-cols-2 gap-2 text-xs font-bold"><button onclick="edAction('dup')" class="p-3 rounded-2xl border">Duplicate line</button><button onclick="edAction('del')" class="p-3 rounded-2xl border">Delete line</button><button onclick="edAction('up')" class="p-3 rounded-2xl border">↑ Move up</button><button onclick="edAction('down')" class="p-3 rounded-2xl border">↓ Move down</button></div><button onclick="edAction('indent')" class="w-full text-left p-3 rounded-2xl border text-xs font-bold">Auto-indent file</button><button onclick="navigator.clipboard?.writeText(document.getElementById('proCodeArea').value); state.edActionsOpen=false; render(); showToast('Copied!','success')" class="w-full text-left p-3 rounded-2xl border text-xs font-bold">Copy whole file</button><button onclick="state.edActionsOpen=false; runEdPreviewTab()" class="w-full text-left p-3 rounded-2xl border text-xs font-bold">Open preview in new tab</button><button onclick="state.edActionsOpen=false; exportEdProject()" class="w-full text-left p-3 rounded-2xl border text-xs font-bold">Download project HTML</button></div></div>` : ""}

      ${state.edQuickPreview ? `<div class="fixed inset-0 z-50 bg-white text-slate-900 flex flex-col"><div class="h-14 px-4 border-b flex items-center justify-between"><button onclick="state.edQuickPreview=false; render()" class="flex items-center gap-2 font-bold text-sm"><i data-lucide="arrow-left" class="w-4 h-4"></i> Back to Code</button><span class="font-bold text-xs text-purple-700">${proj.name}</span><button onclick="runEdPreviewTab()" class="text-xs font-bold text-slate-600">New Tab ↗</button></div><iframe class="flex-1 w-full bg-white" srcdoc="${quickPreviewDoc.replace(/"/g, "&quot;")}"></iframe></div>` : ""}
    </div>`;
}

// ======================================================
// ২. GitHub Build + Mobile Android Studio IDE (Matches Your 8 New Screenshots)
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
    cur.files.push({ name: parts[parts.length - 1], path: item.path });
  }
  return root;
}

function renderFolderTreeHtml(node, prefix, expandedMap, activePath) {
  let html = "";
  const folderNames = Object.keys(node.folders).sort();
  for (const fname of folderNames) {
    const fullFolder = prefix ? `${prefix}/${fname}` : fname;
    const isOpen = !!expandedMap[fullFolder];
    const folderColor = fname === "res" ? "text-amber-500" : "text-sky-400";
    html += `
      <div>
        <button onclick="toggleGhFolder('${fullFolder}')" class="w-full flex items-center justify-between py-2 px-2 rounded-xl hover:bg-white/5 text-left">
          <span class="flex items-center gap-2 min-w-0">
            <span class="text-slate-400 text-[10px] w-3">${isOpen ? "▾" : "▸"}</span>
            <i data-lucide="folder" class="w-4 h-4 ${folderColor} shrink-0"></i>
            <span class="text-sm font-medium text-slate-100 truncate">${fname}</span>
          </span>
          <span onclick="event.stopPropagation(); openGhNewFileModal('${fullFolder}/')" class="text-slate-400 hover:text-white px-1.5 font-bold">+</span>
        </button>
        ${isOpen ? `<div class="pl-4 border-l border-[#2c2750] ml-3">${renderFolderTreeHtml(node.folders[fname], fullFolder, expandedMap, activePath)}</div>` : ""}
      </div>`;
  }
  for (const file of node.files.sort((a, b) => a.name.localeCompare(b.name))) {
    const active = file.path === activePath;
    html += `
      <button onclick="openGhIdeFile('${file.path}')" class="w-full flex items-center justify-between py-2 px-2.5 rounded-xl text-left ${active ? "bg-purple-600/30 text-white font-bold" : "hover:bg-white/5 text-slate-200"}">
        <span class="flex items-center gap-2.5 min-w-0">${getFileBadge(file.name)}<span class="text-sm truncate">${file.name}</span></span>
      </button>`;
  }
  return html;
}

export function renderProGithubBuild(ctx) {
  const { state, ghFetch, runGithubApkPipeline, showToast, render, navigate, confirmLogout, loginWithGithub, importExistingKey, loadGithubRepos } = ctx;

  if (!state.ghExpandedFolders) {
    state.ghExpandedFolders = { app: true, "app/src": true, "app/src/main": true, "app/src/main/java": true };
  }
  if (!state.ghOpenTabs) state.ghOpenTabs = [];
  if (!state.ghBuildVariant) state.ghBuildVariant = "debug";
  if (!state.ghGradleTask) state.ghGradleTask = "assembleDebug";
  if (!state.ghOutputSubTab) state.ghOutputSubTab = "terminal";

  window.toggleGhFolder = (path) => {
    state.ghExpandedFolders[path] = !state.ghExpandedFolders[path];
    render();
  };

  window.openGhNewFileModal = (folderPrefix = "app/") => {
    state.ghNewFilePrefix = folderPrefix;
    state.ghNewFileModalOpen = true;
    render();
  };

  window.createGhNewFileConfirm = async () => {
    const path = document.getElementById("ghNewFilePathInput")?.value.trim();
    if (!path || path.endsWith("/")) return showToast("সঠিক ফাইল নাম লিখুন (যেমন app/Test.java)", "error");
    try {
      let bin = "";
      new TextEncoder().encode("// Created with Wevlo IDE\n").forEach((b) => (bin += String.fromCharCode(b)));
      await ghFetch(`/repos/${state.selectedGhRepo}/contents/${path}`, {
        method: "PUT",
        body: JSON.stringify({ message: `Create ${path}`, content: btoa(bin), branch: state.ghBranch || "main" })
      });
      state.ghNewFileModalOpen = false;
      showToast(`Created ${path}!`, "success");
      await window.refreshGhTree();
      await window.openGhIdeFile(path);
    } catch (e) {
      showToast("Error: " + e.message, "error");
    }
  };

  window.refreshGhTree = async () => {
    state.ghTreeLoading = true;
    render();
    try {
      const branch = state.ghBranch || "main";
      const treeData = await ghFetch(`/repos/${state.selectedGhRepo}/git/trees/${branch}?recursive=1`);
      state.ghTreeFiles = (treeData.tree || []).filter((t) => t.type === "blob").slice(0, 100);
    } catch (e) {
      showToast("Tree error: " + e.message, "error");
    }
    state.ghTreeLoading = false;
    render();
  };

  window.openGhVsCodeIde = async () => {
    if (!state.githubToken) return showToast("আগে GitHub কানেক্ট করুন!", "error");
    const repo = document.getElementById("ghRepoSelect")?.value || state.selectedGhRepo;
    if (!repo) {
      const newName = prompt("New GitHub Android Repository Name:");
      if (!newName || !newName.trim()) return;
      try {
        showToast("Creating Gradle Android repo...", "info");
        await runGithubApkPipeline({
          repoName: newName.trim(),
          appName: newName.trim(),
          pkgName: "com.wevlo." + newName.trim().toLowerCase().replace(/[^a-z0-9]/g, ""),
          javaSource: state.ghJavaCode,
          logElId: "ghStep2Log"
        });
        await loadGithubRepos();
        state.selectedGhRepo = `${state.githubUser.login}/${newName.trim()}`;
      } catch (e) {
        return showToast(e.message, "error");
      }
    } else {
      state.selectedGhRepo = repo;
    }

    state.ghIdeOpen = true;
    state.ghMobileTab = "files";
    await window.refreshGhTree();
    const def =
      (state.ghTreeFiles || []).find((f) => f.path.endsWith("MainActivity.java")) ||
      (state.ghTreeFiles || []).find((f) => f.path.endsWith(".java") || f.path.endsWith(".kt")) ||
      (state.ghTreeFiles || [])[0];
    if (def) await window.openGhIdeFile(def.path, false);
  };

  window.openGhIdeFile = async (path, switchToEditor = true) => {
    state.ghIdeActivePath = path;
    if (!state.ghOpenTabs.includes(path)) state.ghOpenTabs.push(path);
    state.ghIdeFileLoading = true;
    if (switchToEditor) state.ghMobileTab = "editor";
    render();
    try {
      const data = await ghFetch(`/repos/${state.selectedGhRepo}/contents/${path}?ref=${state.ghBranch || "main"}`);
      state.ghIdeFileSha = data.sha;
      state.ghIdeContent = decodeURIComponent(escape(atob((data.content || "").replace(/\n/g, ""))));
    } catch (e) {
      state.ghIdeContent = "// Could not load file: " + e.message;
    }
    state.ghIdeFileLoading = false;
    render();
  };

  window.closeGhTab = (path) => {
    state.ghOpenTabs = state.ghOpenTabs.filter((t) => t !== path);
    if (state.ghIdeActivePath === path) {
      state.ghIdeActivePath = state.ghOpenTabs[state.ghOpenTabs.length - 1] || "";
      if (state.ghIdeActivePath) window.openGhIdeFile(state.ghIdeActivePath, false);
    }
    render();
  };

  window.saveGhIdeFile = async () => {
    if (!state.selectedGhRepo || !state.ghIdeActivePath) return;
    try {
      const content = document.getElementById("ghIdeTextArea")?.value ?? state.ghIdeContent;
      let bin = "";
      new TextEncoder().encode(content).forEach((b) => (bin += String.fromCharCode(b)));
      const res = await ghFetch(`/repos/${state.selectedGhRepo}/contents/${state.ghIdeActivePath}`, {
        method: "PUT",
        body: JSON.stringify({
          message: `Update ${state.ghIdeActivePath} via Wevlo IDE`,
          content: btoa(bin),
          branch: state.ghBranch || "main",
          ...(state.ghIdeFileSha ? { sha: state.ghIdeFileSha } : {})
        })
      });
      state.ghIdeFileSha = res.content?.sha;
      state.ghIdeContent = content;
      showToast(`Saved ${state.ghIdeActivePath.split("/").pop()}!`, "success");
    } catch (e) {
      showToast("Save error: " + e.message, "error");
    }
  };

  window.insertGhSymbol = (sym) => {
    const ta = document.getElementById("ghIdeTextArea");
    if (!ta) return;
    const txt = sym === "TAB" ? "    " : sym;
    const s = ta.selectionStart, e = ta.selectionEnd;
    ta.value = ta.value.slice(0, s) + txt + ta.value.slice(e);
    ta.selectionStart = ta.selectionEnd = s + (txt.length === 2 && txt !== "  " ? 1 : txt.length);
    state.ghIdeContent = ta.value;
    ta.focus();
  };

  window.triggerGhIdeBuild = async () => {
    if (document.getElementById("ghIdeTextArea") && state.ghIdeActivePath) await window.saveGhIdeFile();
    state.ghMobileTab = "output";
    state.ghOutputSubTab = "output";
    render();
    runGithubApkPipeline({
      repoName: state.selectedGhRepo.split("/")[1],
      existingFullRepo: state.selectedGhRepo,
      appName: state.selectedGhRepo.split("/")[1],
      pkgName: "com.wevlo.androidapp",
      javaSource: state.ghJavaCode,
      logElId: "ghIdeBuildOutput",
      preserveExistingFiles: true
    });
  };

  // ======================================================
  // STEP 3: Exact Mobile Android Studio IDE (Your 8 Screenshots)
  // ======================================================
  if (state.ghIdeOpen && state.selectedGhRepo) {
    const files = state.ghTreeFiles || [];
    const repoName = state.selectedGhRepo.split("/")[1];
    const activePath = state.ghIdeActivePath || "";
    const activeName = activePath ? activePath.split("/").pop() : "No file";
    const fileCode = state.ghIdeContent || "";
    const lines = Array.from({ length: Math.max(fileCode.split("\n").length, 22) }, (_, i) => `<div>${i + 1}</div>`).join("");
    const tab = state.ghMobileTab || "files";
    const treeRoot = buildNestedTree(files);

    const gradleTasks = [
      ["assembleDebug", "APK • Debug (installable)"],
      ["assembleRelease", "APK • Release"],
      ["bundleRelease", "AAB • Release (Play Store)"],
      ["assembleRelease + bundleRelease", "APK + AAB • Release"],
      ["assembleDebug + bundleDebug", "APK + AAB • Debug"]
    ];
    const curTaskDesc = (gradleTasks.find(([t]) => t === state.ghGradleTask) || gradleTasks[0])[1];

    return `
      <div class="h-[100dvh] w-full flex flex-col bg-[#121024] text-slate-100 overflow-hidden relative">
        <!-- Exact Top Mobile IDE Header -->
        <div class="bg-[#191632] px-3 h-14 flex items-center justify-between border-b border-[#2b264e] shrink-0">
          <div class="flex items-center gap-2.5 min-w-0">
            <button onclick="state.ghIdeOpen=false; render()" class="p-1.5 rounded-full hover:bg-white/10"><i data-lucide="arrow-left" class="w-5 h-5"></i></button>
            <div class="min-w-0">
              <p class="font-extrabold text-sm truncate max-w-[110px]">${repoName}</p>
              <p class="text-[11px] text-slate-400 flex items-center gap-1"><i data-lucide="git-branch" class="w-3 h-3"></i> ${state.ghBranch || "main"}</p>
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            <button onclick="state.ghMobileTab='files'; render()" class="p-2 rounded-xl hover:bg-white/10"><i data-lucide="search" class="w-4 h-4 text-slate-300"></i></button>
            <button onclick="saveGhIdeFile()" class="p-2 rounded-xl hover:bg-white/10"><i data-lucide="save" class="w-4 h-4 text-slate-300"></i></button>
            <button onclick="triggerGhIdeBuild()" class="btn-purple p-2.5 rounded-xl"><i data-lucide="play" class="w-4 h-4"></i></button>
            <button onclick="state.ghMobileTab='build'; render()" class="p-2 rounded-xl hover:bg-white/10"><i data-lucide="more-vertical" class="w-4 h-4 text-slate-300"></i></button>
          </div>
        </div>

        <!-- Body Area (4 Clean Mobile Views / Responsive) -->
        <div class="flex-1 min-h-0 overflow-hidden flex flex-col">
          <!-- TAB 1: FILES (Project Explorer - Screenshot 7) -->
          ${
            tab === "files"
              ? `<div class="flex-1 overflow-y-auto p-3.5 space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="font-extrabold text-base">Project Explorer</span>
                    <div class="flex items-center gap-2 text-slate-300">
                      <button onclick="openGhNewFileModal('app/')" class="p-1.5 rounded-lg hover:bg-white/10"><i data-lucide="file-plus" class="w-4 h-4"></i></button>
                      <button onclick="refreshGhTree()" class="p-1.5 rounded-lg hover:bg-white/10"><i data-lucide="refresh-cw" class="w-4 h-4"></i></button>
                    </div>
                  </div>

                  <div class="bg-[#1b1836] border border-[#2d2854] rounded-2xl p-3 flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <span class="w-8 h-8 rounded-full bg-purple-600/30 text-purple-400 flex items-center justify-center shrink-0"><i data-lucide="github" class="w-4 h-4"></i></span>
                      <span class="font-extrabold text-sm truncate">${repoName}</span>
                    </div>
                    <a href="https://github.com/${state.selectedGhRepo}" target="_blank" class="border border-[#3a3469] bg-[#242047] px-3 py-1.5 rounded-xl text-xs font-bold shrink-0">Open in GitHub ↗</a>
                  </div>

                  ${state.ghTreeLoading ? `<div class="py-12 text-center"><span class="spinner"></span></div>` : `<div class="space-y-0.5">${renderFolderTreeHtml(treeRoot, "", state.ghExpandedFolders, activePath)}</div>`}
                </div>`
              : ""
          }

          <!-- TAB 2: EDITOR (Multi-Tab Code Editor + Symbol Bar - Screenshot 6) -->
          ${
            tab === "editor"
              ? `<div class="flex-1 flex flex-col min-h-0">
                  <div class="bg-[#191632] px-2 pt-1.5 flex items-center gap-1 overflow-x-auto border-b border-[#2b264e] shrink-0">
                    ${(state.ghOpenTabs.length ? state.ghOpenTabs : [activePath].filter(Boolean))
                      .map((tp) => {
                        const tname = tp.split("/").pop();
                        const act = tp === activePath;
                        return `<div class="flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-xs shrink-0 ${act ? "bg-[#121024] text-white font-bold border-t-2 border-purple-500" : "text-slate-400"}">
                          <button onclick="openGhIdeFile('${tp}')" class="flex items-center gap-1.5">&lt;/&gt; ${tname}</button>
                          <button onclick="closeGhTab('${tp}')" class="text-slate-500 hover:text-white ml-1">×</button>
                        </div>`;
                      })
                      .join("")}
                  </div>
                  <div class="flex-1 flex min-h-0 bg-[#121024]">
                    <div id="ghIdeGutter" class="code-gutter font-mono bg-[#121024] border-r border-[#242042]">${lines}</div>
                    <textarea id="ghIdeTextArea" oninput="state.ghIdeContent=this.value; document.getElementById('ghIdeGutter').innerHTML=Array.from({length:Math.max(this.value.split('\\n').length,22)},(_,i)=>'<div>'+(i+1)+'</div>').join('')" onscroll="document.getElementById('ghIdeGutter').scrollTop=this.scrollTop" wrap="off" class="code-input flex-1 bg-[#121024] text-emerald-300 font-mono p-3 focus:outline-none whitespace-pre overflow-x-auto">${state.ghIdeFileLoading ? "// Loading..." : fileCode.replace(/</g, "&lt;")}</textarea>
                  </div>
                  <div class="bg-[#1b1836] px-2 py-2 flex items-center gap-1.5 overflow-x-auto border-t border-[#2b264e] shrink-0">
                    ${[["Tab", "TAB"], ["{ }", "{}"], ["( )", "()"], ["[ ]", "[]"], ['" "', '""'], ["< >", "<>"], [";", ";"]]
                      .map(([lbl, val]) => `<button onclick='insertGhSymbol(${JSON.stringify(val)})' class="px-3.5 h-9 rounded-xl bg-[#27234a] hover:bg-purple-600 text-white font-mono text-xs font-bold shrink-0">${lbl}</button>`)
                      .join("")}
                  </div>
                </div>`
              : ""
          }

          <!-- TAB 3: BUILD (Run/Build/Clean + Variant + Task + Start Build + Project Info - Screenshots 1, 8) -->
          ${
            tab === "build"
              ? `<div class="flex-1 overflow-y-auto p-4 space-y-4">
                  <div class="grid grid-cols-3 gap-2">
                    <button onclick="triggerGhIdeBuild()" class="btn-purple py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5"><i data-lucide="play" class="w-4 h-4"></i> Run</button>
                    <button onclick="triggerGhIdeBuild()" class="bg-[#231f42] border border-[#322d5c] py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5"><i data-lucide="hammer" class="w-4 h-4"></i> Build</button>
                    <button onclick="showToast('Gradle cache clean queued','info')" class="bg-[#231f42] border border-[#322d5c] py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5"><i data-lucide="trash-2" class="w-4 h-4"></i> Clean</button>
                  </div>

                  <div>
                    <label class="text-xs font-bold text-slate-300">Build Variant</label>
                    <select onchange="state.ghBuildVariant=this.value" class="w-full mt-1.5 bg-[#1b1836] border border-[#2f2a57] rounded-2xl px-4 py-3 text-sm font-semibold">
                      <option value="debug" ${state.ghBuildVariant === "debug" ? "selected" : ""}>📱 debug</option>
                      <option value="release" ${state.ghBuildVariant === "release" ? "selected" : ""}>📱 release</option>
                    </select>
                  </div>

                  <div>
                    <label class="text-xs font-bold text-slate-300">Gradle Task</label>
                    <button onclick="state.ghTaskPickerOpen=true; render()" class="w-full mt-1.5 bg-[#1b1836] border border-[#2f2a57] rounded-2xl px-4 py-3 text-sm font-semibold flex items-center justify-between">
                      <span class="flex items-center gap-2"><i data-lucide="hammer" class="w-4 h-4 text-emerald-400"></i> ${state.ghGradleTask}</span>
                      <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400"></i>
                    </button>
                    <p class="text-[11px] text-slate-400 mt-1.5">${curTaskDesc}</p>
                  </div>

                  <button onclick="triggerGhIdeBuild()" class="w-full btn-purple py-3.5 rounded-2xl text-sm font-extrabold flex items-center justify-center gap-2">
                    <i data-lucide="rocket" class="w-4 h-4"></i> Start Build
                  </button>

                  <div class="bg-[#191632] border border-[#2c2754] rounded-2xl p-4 space-y-2 text-xs">
                    <p class="font-extrabold text-sm flex items-center gap-2"><i data-lucide="info" class="w-4 h-4 text-purple-400"></i> Project Info</p>
                    <div class="flex justify-between"><span class="text-slate-400">Project Name</span><b>: ${repoName}</b></div>
                    <div class="flex justify-between"><span class="text-slate-400">Gradle Version</span><b>: 8.7</b></div>
                    <div class="flex justify-between"><span class="text-slate-400">Android Plugin</span><b>: 8.5.2</b></div>
                    <div class="flex justify-between"><span class="text-slate-400">Min SDK</span><b>: 24</b></div>
                  </div>
                </div>`
              : ""
          }

          <!-- TAB 4: OUTPUT (Terminal / Build Output / Logcat - Screenshot 4) -->
          ${
            tab === "output"
              ? `<div class="flex-1 flex flex-col min-h-0">
                  <div class="bg-[#191632] px-3 flex items-center gap-4 border-b border-[#2b264e] text-xs font-bold shrink-0">
                    <button onclick="state.ghOutputSubTab='terminal'; render()" class="py-2.5 ${state.ghOutputSubTab === "terminal" ? "text-white border-b-2 border-purple-500" : "text-slate-400"}">&gt;_ Terminal</button>
                    <button onclick="state.ghOutputSubTab='output'; render()" class="py-2.5 ${state.ghOutputSubTab === "output" ? "text-white border-b-2 border-purple-500" : "text-slate-400"}">≡ Build Output</button>
                    <button onclick="state.ghOutputSubTab='logcat'; render()" class="py-2.5 ${state.ghOutputSubTab === "logcat" ? "text-white border-b-2 border-purple-500" : "text-slate-400"}">📱 Logcat</button>
                  </div>
                  <div class="flex-1 p-4 font-mono text-xs text-slate-300 overflow-y-auto space-y-3">
                    <p>$ Ready — press Start Build to run Gradle on GitHub Actions.</p>
                    <div id="ghIdeBuildOutput" class="border border-[#2e2954] bg-[#191632] rounded-2xl p-4 hidden"></div>
                  </div>
                </div>`
              : ""
          }
        </div>

        <!-- Exact 4-Tab Bottom Navigation Bar -->
        <div class="bg-[#17142e] border-t border-[#2b264e] grid grid-cols-4 text-[11px] font-bold shrink-0">
          ${[
            ["files", "folder", "Files"],
            ["editor", "code-2", "Editor"],
            ["build", "rocket", "Build"],
            ["output", "terminal", "Output"]
          ]
            .map(
              ([id, ic, lbl]) => `
            <button onclick="state.ghMobileTab='${id}'; render()" class="py-2.5 flex flex-col items-center gap-1 ${tab === id ? "text-purple-400 border-t-2 border-purple-500" : "text-slate-400"}">
              <i data-lucide="${ic}" class="w-4 h-4"></i>
              <span>${lbl}</span>
            </button>`
            )
            .join("")}
        </div>

        <!-- Gradle Task Picker Modal (Screenshot 8) -->
        ${
          state.ghTaskPickerOpen
            ? `<div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
                <div class="bg-[#1c1936] border border-[#342f61] w-full max-w-md rounded-3xl p-4 space-y-2 animate-slide-up">
                  ${gradleTasks
                    .map(
                      ([t, d]) => `
                    <button onclick="state.ghGradleTask='${t}'; state.ghTaskPickerOpen=false; render()" class="w-full text-left p-3.5 rounded-2xl ${state.ghGradleTask === t ? "bg-purple-600/30 border border-purple-500" : "hover:bg-white/5"}">
                      <p class="font-extrabold text-sm text-white">${t}</p>
                      <p class="text-xs text-slate-400">${d}</p>
                    </button>`
                    )
                    .join("")}
                </div>
              </div>`
            : ""
        }

        <!-- New File Modal (Screenshot 5) -->
        ${
          state.ghNewFileModalOpen
            ? `<div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
                <div class="bg-[#1b1833] border border-[#342f61] w-full max-w-md rounded-[26px] p-5 space-y-4 animate-slide-up">
                  <div class="flex justify-between items-center">
                    <h3 class="font-extrabold text-lg text-white">New file</h3>
                    <button onclick="state.ghNewFileModalOpen=false; render()" class="w-8 h-8 rounded-full bg-[#2a254d] flex items-center justify-center"><i data-lucide="x" class="w-4 h-4"></i></button>
                  </div>
                  <div>
                    <label class="text-xs text-slate-400">File path (folders separated by /)</label>
                    <input id="ghNewFilePathInput" value="${state.ghNewFilePrefix || "app/"}" class="w-full mt-1.5 bg-[#121024] border border-[#3b3569] rounded-2xl px-4 py-3 text-sm text-white focus:outline-none" />
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <button onclick="state.ghNewFileModalOpen=false; render()" class="py-3 rounded-2xl bg-[#2a254d] font-bold text-sm">Cancel</button>
                    <button onclick="createGhNewFileConfirm()" class="py-3 rounded-2xl btn-purple font-bold text-sm">Create</button>
                  </div>
                </div>
              </div>`
            : ""
        }
      </div>`;
  }

  // ======================================================
  // STEP 1 & 2: Project Selector
  // ======================================================
  const repos = (state.githubRepos || []).filter((r) =>
    r.full_name.toLowerCase().includes((state.repoFilter || "").toLowerCase())
  );

  return `
    <div class="max-w-5xl mx-auto px-4 py-5 space-y-5">
      <div class="wevlo-card p-4 flex items-center justify-between text-xs font-bold">
        <div class="flex items-center gap-1.5 text-purple-700"><span class="w-6 h-6 rounded-full btn-purple flex items-center justify-center">${state.githubToken ? "✓" : "1"}</span><span>Connect GitHub</span></div>
        <div class="flex-1 h-0.5 bg-purple-200 mx-2"></div>
        <div class="flex items-center gap-1.5 ${state.githubToken ? "text-purple-700" : "text-muted"}"><span class="w-6 h-6 rounded-full ${state.githubToken ? "btn-purple" : "bg-slate-200 text-slate-600"} flex items-center justify-center">2</span><span>Select Project</span></div>
        <div class="flex-1 h-0.5 bg-slate-200 mx-2"></div>
        <div class="flex items-center gap-1.5 text-muted"><span class="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">3</span><span>Code &amp; Build</span></div>
      </div>

      <div class="wevlo-card p-5 space-y-3 text-xs">
        <span class="text-[10px] font-bold bg-purple-600 text-white px-2.5 py-0.5 rounded-full">Step 1 of 3</span>
        <div class="flex items-start gap-3">
          <i data-lucide="github" class="w-8 h-8 text-purple-700 shrink-0"></i>
          <div><h3 class="font-extrabold text-base">Connect Your GitHub Account</h3><p class="text-muted mt-0.5">Sign in with GitHub to access repositories &amp; run Gradle builds on GitHub Actions.</p></div>
        </div>
        ${state.githubToken ? `<div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex justify-between items-center text-slate-900"><div class="flex items-center gap-2.5"><span class="w-9 h-9 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center">${(state.githubUser?.login || "G")[0].toUpperCase()}</span><div><p class="font-bold text-xs">${state.githubUser?.login}</p><p class="text-[11px] text-emerald-700 font-semibold">Connected</p></div></div><button onclick="confirmLogout()" class="bg-white border px-3.5 py-1.5 rounded-full text-xs font-bold">Disconnect</button></div>` : `<button onclick="loginWithGithub()" class="btn-purple px-5 py-2.5 rounded-full text-xs font-bold">Connect GitHub Account</button>`}
      </div>

      <div class="wevlo-card p-5 space-y-3.5 text-xs">
        <span class="text-[10px] font-bold bg-purple-600 text-white px-2.5 py-0.5 rounded-full">Step 2 of 3</span>
        <h3 class="font-extrabold text-base">Select or Create a Project</h3>
        <select id="ghRepoSelect" onchange="state.selectedGhRepo=this.value" class="w-full border border-soft rounded-xl px-3 py-2.5 font-semibold bg-transparent">
          <option value="">-- Create New Gradle Project --</option>
          ${repos.map((r) => `<option value="${r.full_name}" ${state.selectedGhRepo === r.full_name ? "selected" : ""}>${r.full_name}</option>`).join("")}
        </select>
        <div class="flex flex-wrap gap-2">
          <button onclick="loadGithubRepos().then(()=>render())" class="border border-soft px-3.5 py-2 rounded-full font-bold">↻ Refresh</button>
          <button onclick="state.selectedGhRepo=''; openGhVsCodeIde()" class="btn-purple px-4 py-2 rounded-full font-bold">+ New</button>
          <button onclick="importExistingKey()" class="border border-soft px-3.5 py-2 rounded-full font-bold">🔒 Create signing keystore</button>
        </div>
        <input value="${state.repoFilter || ""}" oninput="state.repoFilter=this.value; render()" placeholder="Filter repositories..." class="w-full border border-soft rounded-xl px-3 py-2.5 bg-transparent" />
        <div><label class="font-bold text-muted">Branch</label><input value="${state.ghBranch || "main"}" oninput="state.ghBranch=this.value" class="w-full mt-1 border border-soft rounded-xl px-3 py-2.5 bg-transparent" /></div>
        <button onclick="openGhVsCodeIde()" class="w-full btn-purple py-3.5 rounded-2xl text-sm font-bold">&lt;/&gt; Open in Editor →</button>
        <div id="ghStep2Log" class="hidden border border-soft rounded-2xl p-3"></div>
      </div>

      <div class="wevlo-card p-5 space-y-2.5 text-xs">
        <h4 class="font-extrabold text-sm">Your Projects (${repos.length})</h4>
        ${repos.slice(0, 4).map((r) => `<div class="flex justify-between items-center p-3 border border-soft rounded-2xl"><div><p class="font-bold">${r.name}</p><p class="text-[11px] text-muted">${r.default_branch}</p></div><button onclick="state.selectedGhRepo='${r.full_name}'; openGhVsCodeIde()" class="text-purple-600 font-bold">Open IDE →</button></div>`).join("") || `<p class="text-muted">Connect GitHub to see your repositories.</p>`}
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div class="wevlo-card p-5 space-y-1.5"><h4 class="font-extrabold text-sm">⚡ Build with Confidence</h4><p>✓ Connect GitHub Repository</p><p>✓ Edit code in the built-in IDE</p><p>✓ Build with Gradle on GitHub Actions</p><p>✓ Download AAB &amp; APK</p></div>
        <div class="wevlo-card p-5 space-y-2"><h4 class="font-extrabold text-sm">🔨 What is Gradle?</h4><p class="text-muted">Gradle builds Android projects on GitHub Actions in your repository, just like Android Studio.</p><button onclick="navigate('#/docs')" class="border border-soft px-4 py-1.5 rounded-full font-bold">Learn More →</button></div>
      </div>
      <div class="btn-purple rounded-[22px] p-5 text-center space-y-1"><p class="font-extrabold text-sm">Fast • Secure • Reliable</p><p class="text-xs opacity-90">Build your Android app in minutes with Wevlo.</p></div>
    </div>`;
}
