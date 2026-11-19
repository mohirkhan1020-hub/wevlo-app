// ======================================================
// Full-Screen Pro Code Editor & VS Code GitHub Android IDE
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
  if (path.endsWith(".java")) return `<span class="text-[10px] font-extrabold text-amber-400 w-4 text-center">J</span>`;
  if (path.endsWith(".kt")) return `<span class="text-[10px] font-extrabold text-purple-400 w-4 text-center">K</span>`;
  if (path.endsWith(".gradle")) return `<span class="text-[10px] font-extrabold text-sky-400 w-4 text-center">G</span>`;
  if (path.endsWith(".xml")) return `<span class="text-[10px] font-extrabold text-orange-400 w-4 text-center">&lt;&gt;</span>`;
  if (path.endsWith(".properties")) return `<span class="text-[10px] font-extrabold text-emerald-400 w-4 text-center">P</span>`;
  if (path.endsWith(".md")) return `<span class="text-[10px] font-extrabold text-blue-400 w-4 text-center">M</span>`;
  return `<span class="text-[10px] font-extrabold text-slate-400 w-4 text-center">•</span>`;
}

// ======================================================
// ১. Full-Screen Mobile Pro Code Editor (Screenshots 1, 4, 5)
// ======================================================
export function renderProCodeEditor(ctx) {
  const { state, saveProjects, navigate, showToast, render, openNewProjectModal } = ctx;
  const proj = state.projects.find((p) => p.id === state.activeProjectId) || state.projects[0];

  if (!proj) {
    return `
      <div class="max-w-5xl mx-auto px-4 py-6">
        <div class="wevlo-card p-6">
          <div class="flex items-center justify-between mb-8">
            <div class="flex items-center gap-2">
              <i data-lucide="folder" class="w-5 h-5 text-purple-600"></i>
              <h2 class="font-extrabold text-base">Choose a project</h2>
            </div>
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
  if (!state.edUndoStack[activeFile.name]) {
    state.edUndoStack[activeFile.name] = { list: [content], idx: 0 };
  }

  window.toggleEdDrawer = (open) => {
    state.edDrawerOpen = open;
    render();
  };

  window.selectEdFile = (name) => {
    state.edActiveFile = name;
    state.edDrawerOpen = false;
    render();
  };

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
    showToast(`Created ${clean}`, "success");
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
      showToast(`Imported ${file.name}`, "success");
    };
    r.readAsText(file);
  };

  window.exportEdProject = () => {
    syncProjectPreviewData(proj);
    const full = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${proj.css}</style></head><body>${proj.html}<script>${proj.js}<\/script></body></html>`;
    const blob = new Blob([full], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
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
    if (g) {
      const cnt = Math.max(el.value.split("\n").length, 20);
      g.innerHTML = Array.from({ length: cnt }, (_, i) => `<div>${i + 1}</div>`).join("");
    }
    window.updateEdCursor(el);
  };

  window.edUndo = () => {
    const st = state.edUndoStack[activeFile.name];
    const ta = document.getElementById("proCodeArea");
    if (st && st.idx > 0 && ta) {
      st.idx -= 1;
      ta.value = st.list[st.idx];
      window.onEdInput(ta, false);
    }
  };

  window.edRedo = () => {
    const st = state.edUndoStack[activeFile.name];
    const ta = document.getElementById("proCodeArea");
    if (st && st.idx < st.list.length - 1 && ta) {
      st.idx += 1;
      ta.value = st.list[st.idx];
      window.onEdInput(ta, false);
    }
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
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    ta.value = ta.value.slice(0, s) + txt + ta.value.slice(e);
    ta.selectionStart = ta.selectionEnd = s + txt.length;
    ta.focus();
    window.onEdInput(ta);
  };

  window.edAction = (type) => {
    const ta = document.getElementById("proCodeArea");
    if (!ta) return;
    const lines = ta.value.split("\n");
    const pos = ta.selectionStart || 0;
    const lineIdx = ta.value.slice(0, pos).split("\n").length - 1;
    if (type === "dup") lines.splice(lineIdx + 1, 0, lines[lineIdx]);
    if (type === "del" && lines.length > 1) lines.splice(lineIdx, 1);
    if (type === "up" && lineIdx > 0) [lines[lineIdx - 1], lines[lineIdx]] = [lines[lineIdx], lines[lineIdx - 1]];
    if (type === "down" && lineIdx < lines.length - 1) [lines[lineIdx + 1], lines[lineIdx]] = [lines[lineIdx], lines[lineIdx + 1]];
    if (type === "comment") lines[lineIdx] = lines[lineIdx].startsWith("// ") ? lines[lineIdx].slice(3) : "// " + lines[lineIdx];
    ta.value = type === "indent" ? lines.map((l) => l.trimEnd()).join("\n") : lines.join("\n");
    window.onEdInput(ta);
    state.edActionsOpen = false;
    render();
  };

  window.runEdPreviewTab = () => {
    syncProjectPreviewData(proj);
    const full = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${proj.css}</style></head><body>${proj.html}<script>${proj.js}<\/script></body></html>`;
    const w = window.open("", "_blank");
    if (w) {
      w.document.open();
      w.document.write(full);
      w.document.close();
    }
  };

  syncProjectPreviewData(proj);
  const quickPreviewDoc = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${proj.css}</style></head><body>${proj.html}<script>${proj.js}<\/script></body></html>`;

  return `
    <div class="h-[100dvh] w-full flex flex-col bg-[#1b1929] text-slate-100 relative overflow-hidden">
      <!-- Top Bar (Exact match to Screenshot 4) -->
      <div class="bg-white text-slate-900 px-3 h-14 flex items-center justify-between border-b border-slate-200 shrink-0">
        <div class="flex items-center gap-2 min-w-0">
          <button onclick="navigate('#/projects')" class="p-1.5 rounded-full hover:bg-slate-100"><i data-lucide="arrow-left" class="w-5 h-5"></i></button>
          <button onclick="toggleEdDrawer(true)" class="p-2 rounded-xl bg-slate-100 hover:bg-slate-200"><i data-lucide="menu" class="w-4 h-4"></i></button>
          <span class="font-extrabold text-base truncate">${proj.name}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <button onclick="state.edFindOpen=!state.edFindOpen; render()" class="p-2 rounded-xl hover:bg-slate-100"><i data-lucide="search" class="w-4 h-4"></i></button>
          <button onclick="state.edActionsOpen=true; render()" class="p-2 rounded-xl hover:bg-slate-100"><i data-lucide="more-horizontal" class="w-4 h-4"></i></button>
          <button onclick="saveProjects(); showToast('Saved!','success')" class="btn-purple p-2 rounded-xl"><i data-lucide="save" class="w-4 h-4"></i></button>
          <button onclick="state.edQuickPreview=true; render()" class="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"><i data-lucide="play" class="w-4 h-4"></i></button>
          <button onclick="navigate('#/build')" class="p-2 rounded-xl border border-slate-200 bg-white text-purple-600 hover:bg-purple-50"><i data-lucide="rocket" class="w-4 h-4"></i></button>
        </div>
      </div>

      <!-- Open File Tabs -->
      <div class="bg-[#242136] px-2 pt-1.5 flex items-center gap-1 overflow-x-auto border-b border-[#322e4a] shrink-0">
        ${files
          .map(
            (f) => `
          <button onclick="selectEdFile('${f.name}')" class="px-3.5 py-2 rounded-t-xl text-xs font-semibold flex items-center gap-2 shrink-0 ${
              f.name === activeFile.name ? "bg-[#1b1929] text-white" : "text-slate-400 hover:text-white"
            }">
            <span class="w-2.5 h-2.5 rounded-sm ${f.name.endsWith(".html") ? "bg-orange-500" : f.name.endsWith(".css") ? "bg-sky-400" : "bg-amber-400"}"></span>
            ${f.name}
          </button>`
          )
          .join("")}
      </div>

      <!-- Formatting Toolbar -->
      <div class="bg-[#1f1c2e] px-3 py-2 flex items-center justify-between gap-2 border-b border-[#322e4a] text-slate-300 text-xs shrink-0 overflow-x-auto">
        <div class="flex items-center gap-2">
          <button onclick="edUndo()" class="p-1.5 rounded hover:bg-white/10"><i data-lucide="undo-2" class="w-4 h-4"></i></button>
          <button onclick="edRedo()" class="p-1.5 rounded hover:bg-white/10"><i data-lucide="redo-2" class="w-4 h-4"></i></button>
          <button onclick="state.edFindOpen=!state.edFindOpen; render()" class="p-1.5 rounded hover:bg-white/10"><i data-lucide="search" class="w-4 h-4"></i></button>
          <button onclick="edAction('comment')" class="px-2 py-1 rounded hover:bg-white/10 font-mono">//</button>
          <button onclick="state.edWrap=!${wordWrap}; render()" class="px-2.5 py-1 rounded-lg ${wordWrap ? "bg-purple-600 text-white" : "hover:bg-white/10"}">Wrap</button>
        </div>
        <div class="flex items-center gap-2.5 shrink-0">
          <button onclick="state.edFontSize=Math.max(11,${fontSize}-1); render()" class="px-1.5 py-0.5 rounded hover:bg-white/10 font-bold">A-</button>
          <span class="font-bold text-white">${fontSize}</span>
          <button onclick="state.edFontSize=Math.min(22,${fontSize}+1); render()" class="px-1.5 py-0.5 rounded hover:bg-white/10 font-bold">A+</button>
        </div>
      </div>

      ${
        state.edFindOpen
          ? `<div class="bg-[#242136] px-3 py-2 flex items-center gap-2 border-b border-[#322e4a] shrink-0">
              <input id="edFindInput" placeholder="Find text in file..." class="flex-1 bg-[#1b1929] border border-[#3d385c] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none" />
              <button onclick="const q=document.getElementById('edFindInput').value; const ta=document.getElementById('proCodeArea'); const i=ta.value.indexOf(q); if(i>=0){ta.focus();ta.setSelectionRange(i,i+q.length);}else{showToast('Not found','error')}" class="btn-purple px-3 py-1.5 rounded-lg text-xs font-bold">Find</button>
            </div>`
          : ""
      }

      <!-- Main Dark Code Area -->
      <div class="flex-1 flex min-h-0 bg-[#1b1929]">
        <div id="proGutter" class="code-gutter font-mono bg-[#181625] border-r border-[#2d2945]" style="font-size:${fontSize}px">${gutterHtml}</div>
        <textarea
          id="proCodeArea"
          oninput="onEdInput(this)"
          onclick="updateEdCursor(this)"
          onkeyup="updateEdCursor(this)"
          onscroll="document.getElementById('proGutter').scrollTop=this.scrollTop"
          wrap="${wordWrap ? "soft" : "off"}"
          style="font-size:${fontSize}px"
          class="code-input flex-1 bg-[#1b1929] text-slate-100 font-mono p-3.5 focus:outline-none ${wordWrap ? "" : "whitespace-pre overflow-x-auto"}"
        >${content.replace(/</g, "&lt;")}</textarea>
      </div>

      <!-- Bottom Mobile Quick-Symbol Bar -->
      <div class="bg-[#242136] px-2 py-2 flex items-center gap-1.5 overflow-x-auto border-t border-[#322e4a] shrink-0">
        ${[["⇥", "TAB"], ["{", "{"], ["}", "}"], ["(", "("], [")", ")"], ["[", "["], ["]", "]"], ["<", "<"], [">", ">"], ["=", "="], [";", ";"], ['"', '"']]
          .map(([lbl, val]) => `<button onclick="insertEdSymbol('${val}')" class="min-w-[38px] h-9 rounded-xl bg-[#2f2b47] hover:bg-purple-600 text-white font-mono text-sm font-bold shrink-0">${lbl}</button>`)
          .join("")}
      </div>

      <!-- Status Bar -->
      <div class="bg-[#13111d] px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
        <span id="edCursorPos">${activeFile.lang} &nbsp; Ln 1, Col 1</span>
        <span class="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <span class="w-2 h-2 rounded-full bg-emerald-400"></span> Saved
        </span>
      </div>

      <!-- File Explorer Slide-Over Drawer (Screenshot 1) -->
      ${
        state.edDrawerOpen
          ? `<div class="absolute inset-0 z-40 flex">
              <div class="w-72 bg-white text-slate-900 h-full flex flex-col justify-between p-4 shadow-2xl">
                <div class="space-y-4 overflow-y-auto">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2.5">
                      <span class="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center"><i data-lucide="folder" class="w-5 h-5"></i></span>
                      <div><p class="font-extrabold text-sm">${proj.name}</p><p class="text-[11px] text-slate-500">${files.length} files</p></div>
                    </div>
                    <button onclick="toggleEdDrawer(false)" class="p-1.5 rounded-xl bg-slate-100"><i data-lucide="x" class="w-4 h-4"></i></button>
                  </div>
                  <div class="grid grid-cols-4 gap-1.5 text-center text-[10px] font-bold">
                    <button onclick="createEdNewFile()" class="p-2 rounded-xl border border-slate-200 flex flex-col items-center gap-1"><i data-lucide="file-plus" class="w-4 h-4 text-purple-600"></i>New file</button>
                    <button onclick="createEdNewFile()" class="p-2 rounded-xl border border-slate-200 flex flex-col items-center gap-1"><i data-lucide="folder-plus" class="w-4 h-4 text-purple-600"></i>Folder</button>
                    <label class="p-2 rounded-xl border border-slate-200 flex flex-col items-center gap-1 cursor-pointer"><i data-lucide="upload" class="w-4 h-4 text-purple-600"></i>Import<input type="file" class="hidden" onchange="importEdFile(event)" /></label>
                    <button onclick="exportEdProject()" class="p-2 rounded-xl border border-slate-200 flex flex-col items-center gap-1"><i data-lucide="download" class="w-4 h-4 text-purple-600"></i>Export</button>
                  </div>
                  <div class="space-y-1.5">
                    ${files
                      .map(
                        (f) => `
                      <div class="flex items-center justify-between px-3 py-2.5 rounded-xl ${
                        f.name === activeFile.name ? "bg-purple-50 border-l-4 border-purple-600 text-purple-800 font-bold" : "hover:bg-slate-50"
                      }">
                        <button onclick="selectEdFile('${f.name}')" class="flex items-center gap-2 text-xs flex-1 text-left">
                          <span class="text-orange-500 font-mono">&lt;/&gt;</span> ${f.name}
                        </button>
                        <button onclick="deleteEdFile('${f.name}')" class="text-slate-400 hover:text-rose-500 p-1"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                      </div>`
                      )
                      .join("")}
                  </div>
                </div>
                <p class="text-[11px] text-slate-400 pt-2 border-t">${files.length} files • ${(content.length / 1024).toFixed(1)} KB</p>
              </div>
              <div onclick="toggleEdDrawer(false)" class="flex-1 bg-black/40"></div>
            </div>`
          : ""
      }

      <!-- Editor Actions Bottom Sheet (Screenshot 5) -->
      ${
        state.edActionsOpen
          ? `<div class="fixed inset-0 z-50 bg-slate-900/50 flex items-end sm:items-center justify-center">
              <div class="bg-white text-slate-900 w-full sm:max-w-md rounded-t-[28px] sm:rounded-[28px] p-5 space-y-2.5 animate-slide-up">
                <div class="flex justify-between items-center pb-1">
                  <div>
                    <h3 class="font-extrabold text-base">Editor actions</h3>
                    <p class="text-xs text-slate-500">${activeFile.name} • ${linesCount} lines • ${content.length} chars</p>
                  </div>
                  <button onclick="state.edActionsOpen=false; render()" class="p-1.5 rounded-full bg-slate-100"><i data-lucide="x" class="w-4 h-4"></i></button>
                </div>
                <div class="grid grid-cols-2 gap-2 text-xs font-bold">
                  <button onclick="edAction('dup')" class="p-3 rounded-2xl border border-slate-200 hover:bg-slate-50">Duplicate line</button>
                  <button onclick="edAction('del')" class="p-3 rounded-2xl border border-slate-200 hover:bg-slate-50">Delete line</button>
                  <button onclick="edAction('up')" class="p-3 rounded-2xl border border-slate-200 hover:bg-slate-50">↑ Move line up</button>
                  <button onclick="edAction('down')" class="p-3 rounded-2xl border border-slate-200 hover:bg-slate-50">↓ Move line down</button>
                </div>
                <button onclick="edAction('indent')" class="w-full text-left p-3 rounded-2xl border border-slate-200 text-xs font-bold">Auto-indent file</button>
                <button onclick="navigator.clipboard?.writeText(document.getElementById('proCodeArea').value); state.edActionsOpen=false; render(); showToast('Copied whole file!','success')" class="w-full text-left p-3 rounded-2xl border border-slate-200 text-xs font-bold">Copy whole file</button>
                <button onclick="state.edActionsOpen=false; runEdPreviewTab()" class="w-full text-left p-3 rounded-2xl border border-slate-200 text-xs font-bold">Open preview in new tab</button>
                <button onclick="state.edActionsOpen=false; exportEdProject()" class="w-full text-left p-3 rounded-2xl border border-slate-200 text-xs font-bold">Download project HTML</button>
                <div class="flex items-center justify-between pt-2 text-xs font-bold">
                  <span class="text-slate-500">Indent</span>
                  <div class="flex gap-2">
                    <button onclick="state.edIndent=2; render()" class="px-3.5 py-1.5 rounded-full ${indentSize === 2 ? "btn-purple" : "border"}">2 spaces</button>
                    <button onclick="state.edIndent=4; render()" class="px-3.5 py-1.5 rounded-full ${indentSize === 4 ? "btn-purple" : "border"}">4 spaces</button>
                  </div>
                </div>
              </div>
            </div>`
          : ""
      }

      <!-- Instant Play Live Preview Overlay -->
      ${
        state.edQuickPreview
          ? `<div class="fixed inset-0 z-50 bg-white text-slate-900 flex flex-col">
              <div class="h-14 px-4 border-b flex items-center justify-between">
                <button onclick="state.edQuickPreview=false; render()" class="flex items-center gap-2 font-bold text-sm"><i data-lucide="arrow-left" class="w-4 h-4"></i> Back to Code</button>
                <span class="font-bold text-xs text-purple-700">${proj.name} — Live Preview</span>
                <button onclick="runEdPreviewTab()" class="text-xs font-bold text-slate-600">New Tab ↗</button>
              </div>
              <iframe class="flex-1 w-full bg-white" srcdoc="${quickPreviewDoc.replace(/"/g, "&quot;")}"></iframe>
            </div>`
          : ""
      }
    </div>`;
}

// ======================================================
// ২. GitHub Build + Full-Screen VS Code IDE (Screenshots 2, 3, 7)
// ======================================================
export function renderProGithubBuild(ctx) {
  const { state, ghFetch, runGithubApkPipeline, showToast, render, navigate, confirmLogout, loginWithGithub, importExistingKey, loadGithubRepos } = ctx;

  window.openGhVsCodeIde = async () => {
    if (!state.githubToken) return showToast("আগে GitHub কানেক্ট করুন!", "error");
    const repo = document.getElementById("ghRepoSelect")?.value || state.selectedGhRepo;
    if (!repo) {
      const newName = prompt("New GitHub Android Repository Name (e.g. my-android-app):");
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
    state.ghMobileTab = "editor";
    state.ghTreeLoading = true;
    render();

    try {
      const branch = state.ghBranch || "main";
      const treeData = await ghFetch(`/repos/${state.selectedGhRepo}/git/trees/${branch}?recursive=1`);
      state.ghTreeFiles = (treeData.tree || []).filter((t) => t.type === "blob").slice(0, 70);
      const def =
        state.ghTreeFiles.find((f) => f.path.endsWith("MainActivity.java")) ||
        state.ghTreeFiles.find((f) => f.path.endsWith(".java") || f.path.endsWith(".kt")) ||
        state.ghTreeFiles[0];
      state.ghTreeLoading = false;
      if (def) await window.openGhIdeFile(def.path);
      else render();
    } catch (e) {
      state.ghTreeLoading = false;
      state.ghTreeFiles = [];
      showToast("Repo tree error: " + e.message, "error");
      render();
    }
  };

  window.openGhIdeFile = async (path) => {
    state.ghIdeActivePath = path;
    state.ghIdeFileLoading = true;
    state.ghMobileTab = "editor";
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

  window.saveGhIdeFile = async () => {
    if (!state.selectedGhRepo || !state.ghIdeActivePath) return;
    try {
      const content = document.getElementById("ghIdeTextArea")?.value ?? state.ghIdeContent;
      let bin = "";
      new TextEncoder().encode(content).forEach((b) => (bin += String.fromCharCode(b)));
      const res = await ghFetch(`/repos/${state.selectedGhRepo}/contents/${state.ghIdeActivePath}`, {
        method: "PUT",
        body: JSON.stringify({
          message: `Edit ${state.ghIdeActivePath} via Wevlo IDE`,
          content: btoa(bin),
          branch: state.ghBranch || "main",
          ...(state.ghIdeFileSha ? { sha: state.ghIdeFileSha } : {})
        })
      });
      state.ghIdeFileSha = res.content?.sha;
      state.ghIdeContent = content;
      showToast(`Saved ${state.ghIdeActivePath}!`, "success");
    } catch (e) {
      showToast("Save error: " + e.message, "error");
    }
  };

  window.triggerGhIdeBuild = async () => {
    state.ghMobileTab = "build";
    if (document.getElementById("ghIdeTextArea") && state.ghIdeActivePath) {
      await window.saveGhIdeFile();
    }
    runGithubApkPipeline({
      repoName: state.selectedGhRepo.split("/")[1],
      existingFullRepo: state.selectedGhRepo,
      appName: state.selectedGhRepo.split("/")[1],
      pkgName: "com.wevlo.androidapp",
      javaSource: state.ghJavaCode,
      logElId: "ghIdeBuildOutput"
    });
  };

  // STEP 3: Full-Screen VS Code Android IDE (Screenshot 3)
  if (state.ghIdeOpen && state.selectedGhRepo) {
    const files = state.ghTreeFiles || [];
    const activePath = state.ghIdeActivePath || "MainActivity.java";
    const fileCode = state.ghIdeContent || "";
    const lines = Array.from({ length: Math.max(fileCode.split("\n").length, 22) }, (_, i) => `<div>${i + 1}</div>`).join("");
    const mobTab = state.ghMobileTab || "editor";

    return `
      <div class="h-[100dvh] w-full flex flex-col bg-[#131124] text-slate-100 overflow-hidden">
        <!-- Top Bar -->
        <div class="bg-[#1b1833] px-3 h-12 flex items-center justify-between border-b border-[#2c2750] text-xs shrink-0">
          <div class="flex items-center gap-2 min-w-0">
            <button onclick="state.ghIdeOpen=false; render()" class="px-2.5 py-1 rounded-lg bg-[#272346] hover:bg-purple-600 font-bold">← Back</button>
            <span class="font-extrabold text-purple-300 truncate">${state.selectedGhRepo.split("/")[1]}</span>
          </div>
          <div class="flex items-center gap-2">
            <a href="https://github.com/${state.selectedGhRepo}" target="_blank" class="px-2.5 py-1 rounded-lg bg-[#272346] font-semibold">Open in GitHub ↗</a>
          </div>
        </div>

        <!-- Mobile Switch Tabs -->
        <div class="grid grid-cols-3 lg:hidden bg-[#18152c] border-b border-[#2c2750] text-xs font-bold shrink-0">
          <button onclick="state.ghMobileTab='explorer'; render()" class="py-2.5 ${mobTab === "explorer" ? "text-purple-400 border-b-2 border-purple-500" : "text-slate-400"}">Explorer (${files.length})</button>
          <button onclick="state.ghMobileTab='editor'; render()" class="py-2.5 ${mobTab === "editor" ? "text-purple-400 border-b-2 border-purple-500" : "text-slate-400"}">Code</button>
          <button onclick="state.ghMobileTab='build'; render()" class="py-2.5 ${mobTab === "build" ? "text-purple-400 border-b-2 border-purple-500" : "text-slate-400"}">Build &amp; Logs</button>
        </div>

        <!-- 3-Column IDE Workspace -->
        <div class="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
          <!-- Left: Activity Bar + Project Explorer -->
          <div class="lg:col-span-3 border-r border-[#2c2750] bg-[#161428] flex min-h-0 ${mobTab === "explorer" ? "" : "hidden lg:flex"}">
            <div class="w-11 bg-[#110f20] border-r border-[#252142] py-3 flex flex-col items-center gap-5 text-slate-400 shrink-0">
              <i data-lucide="files" class="w-4 h-4 text-purple-400"></i>
              <i data-lucide="search" class="w-4 h-4"></i>
              <i data-lucide="git-branch" class="w-4 h-4"></i>
              <i data-lucide="bug-play" class="w-4 h-4"></i>
            </div>
            <div class="flex-1 p-2.5 overflow-y-auto text-[11px]">
              <div class="flex items-center justify-between font-bold text-slate-400 uppercase mb-2 px-1">
                <span>Project Explorer</span>
                <button onclick="openGhVsCodeIde()"><i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i></button>
              </div>
              ${
                state.ghTreeLoading
                  ? `<div class="p-6 text-center"><span class="spinner"></span></div>`
                  : files
                      .map(
                        (f) => `
                    <button onclick="openGhIdeFile('${f.path}')" class="w-full text-left px-2 py-1.5 rounded-lg truncate flex items-center gap-1.5 ${
                          f.path === activePath ? "bg-purple-600/35 text-white font-bold" : "text-slate-300 hover:bg-white/5"
                        }">
                      ${getFileBadge(f.path)}
                      <span class="truncate">${f.path}</span>
                    </button>`
                      )
                      .join("")
              }
            </div>
          </div>

          <!-- Center: Code Editor + Terminal -->
          <div class="lg:col-span-6 flex flex-col border-r border-[#2c2750] min-h-0 ${mobTab === "editor" ? "" : "hidden lg:flex"}">
            <div class="bg-[#1b1833] px-3 py-1.5 flex items-center justify-between border-b border-[#2c2750] text-xs shrink-0">
              <span class="font-mono text-purple-300 truncate flex items-center gap-1.5">${getFileBadge(activePath)} ${activePath}</span>
              <button onclick="saveGhIdeFile()" class="btn-purple px-3 py-1 rounded-lg text-[11px] font-bold">Save &amp; Commit</button>
            </div>
            <div class="flex-1 flex min-h-0 bg-[#110f20]">
              <div id="ghIdeGutter" class="code-gutter font-mono bg-[#110f20] border-r border-[#23203b]">${lines}</div>
              <textarea
                id="ghIdeTextArea"
                oninput="state.ghIdeContent=this.value; document.getElementById('ghIdeGutter').innerHTML=Array.from({length:Math.max(this.value.split('\\n').length,22)},(_,i)=>'<div>'+(i+1)+'</div>').join('')"
                onscroll="document.getElementById('ghIdeGutter').scrollTop=this.scrollTop"
                class="code-input flex-1 bg-[#110f20] text-emerald-300 font-mono p-3 focus:outline-none"
              >${state.ghIdeFileLoading ? "// Loading from GitHub..." : fileCode.replace(/</g, "&lt;")}</textarea>
            </div>
            <div class="h-28 bg-[#0d0c18] border-t border-[#2c2750] flex flex-col shrink-0">
              <div class="px-3 py-1 flex gap-4 text-[11px] font-bold border-b border-[#23203b]">
                <span class="text-purple-400">&gt;_ Terminal</span>
                <span class="text-slate-400">Build Output</span>
              </div>
              <div class="p-2.5 font-mono text-[11px] text-slate-300 overflow-y-auto">
                $ Ready — press Start Build to run Gradle on GitHub Actions.
              </div>
            </div>
          </div>

          <!-- Right: Build Panel -->
          <div class="lg:col-span-3 p-3.5 bg-[#161428] space-y-3.5 text-xs overflow-y-auto ${mobTab === "build" ? "" : "hidden lg:block"}">
            <div class="grid grid-cols-2 gap-1.5">
              <button onclick="triggerGhIdeBuild()" class="btn-purple py-2 rounded-xl font-bold">▶ Run</button>
              <button onclick="triggerGhIdeBuild()" class="bg-[#272346] py-2 rounded-xl font-bold">Build</button>
            </div>
            <div>
              <label class="text-[11px] text-slate-400 font-bold">Build Variant</label>
              <select class="w-full mt-1 bg-[#110f20] border border-[#2f2a52] rounded-xl px-3 py-2 text-xs">
                <option value="debug">debug</option>
                <option value="release">release</option>
              </select>
            </div>
            <div>
              <label class="text-[11px] text-slate-400 font-bold">Gradle Task</label>
              <select class="w-full mt-1 bg-[#110f20] border border-[#2f2a52] rounded-xl px-3 py-2 text-xs">
                <option value="assembleDebug">assembleDebug (APK)</option>
                <option value="bundleRelease">bundleRelease (AAB)</option>
              </select>
            </div>
            <button onclick="triggerGhIdeBuild()" class="w-full btn-purple py-2.5 rounded-full font-bold">🚀 Start Build</button>
            <div id="ghIdeBuildOutput" class="hidden bg-[#110f20] border border-[#2f2a52] rounded-xl p-3 text-[11px]"></div>
            <div class="bg-[#110f20] border border-[#2c2750] rounded-2xl p-3 space-y-1 text-[11px] text-slate-300">
              <p class="font-bold text-purple-300 mb-1">ℹ Project Info</p>
              <p>Project: <b>${state.selectedGhRepo.split("/")[1]}</b></p>
              <p>Gradle Version: <b>8.7</b></p>
              <p>Android Plugin: <b>8.5.2</b></p>
              <p>Min SDK: <b>24</b></p>
            </div>
          </div>
        </div>

        <!-- Status Bar -->
        <div class="bg-[#1b1833] border-t border-[#2c2750] px-3 py-1 flex justify-between text-[10px] text-slate-400 shrink-0">
          <span>● Ready | Gradle: Idle | ⑂ ${state.ghBranch || "main"}</span>
          <span>Java | GitHub Actions</span>
        </div>
      </div>`;
  }

  // STEP 1 & 2: Project Selector (Screenshots 2 & 7)
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
          <div>
            <h3 class="font-extrabold text-base">Connect Your GitHub Account</h3>
            <p class="text-muted mt-0.5">Sign in with GitHub to access your repositories. Builds run on GitHub Actions.</p>
          </div>
        </div>
        ${
          state.githubToken
            ? `<div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex justify-between items-center text-slate-900">
                <div class="flex items-center gap-2.5">
                  <span class="w-9 h-9 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center">${(state.githubUser?.login || "G")[0].toUpperCase()}</span>
                  <div><p class="font-bold text-xs">${state.githubUser?.login}</p><p class="text-[11px] text-emerald-700 font-semibold">Connected</p></div>
                </div>
                <button onclick="confirmLogout()" class="bg-white border px-3.5 py-1.5 rounded-full text-xs font-bold">Disconnect</button>
              </div>`
            : `<button onclick="loginWithGithub()" class="btn-purple px-5 py-2.5 rounded-full text-xs font-bold">Connect GitHub Account</button>`
        }
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
        ${
          repos
            .slice(0, 4)
            .map((r) => `<div class="flex justify-between items-center p-3 border border-soft rounded-2xl"><div><p class="font-bold">${r.name}</p><p class="text-[11px] text-muted">${r.default_branch}</p></div><button onclick="state.selectedGhRepo='${r.full_name}'; openGhVsCodeIde()" class="text-purple-600 font-bold">Open IDE →</button></div>`)
            .join("") || `<p class="text-muted">Connect GitHub to see your repositories.</p>`
        }
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div class="wevlo-card p-5 space-y-1.5"><h4 class="font-extrabold text-sm">⚡ Build with Confidence</h4><p>✓ Connect GitHub Repository</p><p>✓ Edit code in the built-in IDE</p><p>✓ Build with Gradle on GitHub Actions</p><p>✓ Download AAB &amp; APK</p></div>
        <div class="wevlo-card p-5 space-y-2"><h4 class="font-extrabold text-sm">🔨 What is Gradle?</h4><p class="text-muted">Gradle builds Android projects on GitHub Actions in your repository, just like Android Studio.</p><button onclick="navigate('#/docs')" class="border border-soft px-4 py-1.5 rounded-full font-bold">Learn More →</button></div>
      </div>
      <div class="btn-purple rounded-[22px] p-5 text-center space-y-1"><p class="font-extrabold text-sm">Fast • Secure • Reliable</p><p class="text-xs opacity-90">Build your Android app in minutes with Wevlo.</p></div>
    </div>`;
}
