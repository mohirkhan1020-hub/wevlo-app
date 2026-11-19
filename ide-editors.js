import {
  DEFAULT_ANDROID_TEMPLATES,
  analyzeProjectIssues,
  runTerminalCommand,
  generateWorkflowYaml
} from "./gradle-analyzer.js";

// ======================================================
// Helpers & JSZip Loader
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

function ensureProjectFiles(proj) {
  if (!proj.files || !Array.isArray(proj.files) || proj.files.length === 0) {
    proj.files = [
      {
        name: "index.html",
        lang: "HTML",
        content:
          proj.html ||
          `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>${proj.name}</title>\n</head>\n<body>\n  <h1>${proj.name}</h1>\n  <p>Built with Wevlo Pro Editor</p>\n</body>\n</html>`
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

function toBase64Utf8(str) {
  let bin = "";
  new TextEncoder().encode(str).forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

// ======================================================
// ১. Full-Screen Mobile Pro Web Code Editor
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
          <div class="py-10 text-center space-y-2"><i data-lucide="folder" class="w-10 h-10 mx-auto text-muted"></i><p class="font-bold">No projects yet</p></div>
        </div>
      </div>`;
  }

  const files = ensureProjectFiles(proj);
  if (!state.edActiveFile || !files.some((f) => f.name === state.edActiveFile)) state.edActiveFile = files[0].name;
  const activeFile = files.find((f) => f.name === state.edActiveFile) || files[0];
  const fontSize = state.edFontSize || 15;
  const content = activeFile.content || "";
  const gutterHtml = Array.from({ length: Math.max(content.split("\n").length, 20) }, (_, i) => `<div>${i + 1}</div>`).join("");

  window.toggleEdDrawer = (open) => { state.edDrawerOpen = open; render(); };
  window.selectEdFile = (name) => { state.edActiveFile = name; state.edDrawerOpen = false; render(); };
  window.createEdNewFile = () => {
    const name = prompt("New file name (e.g. about.html):");
    if (!name || !name.trim()) return;
    files.push({ name: name.trim(), lang: name.trim().split(".").pop().toUpperCase(), content: "" });
    state.edActiveFile = name.trim();
    state.edDrawerOpen = false;
    saveProjects();
    render();
  };
  window.importEdFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      files.push({ name: f.name, lang: f.name.split(".").pop().toUpperCase(), content: r.result });
      state.edActiveFile = f.name;
      state.edDrawerOpen = false;
      syncProjectPreviewData(proj);
      saveProjects();
      render();
    };
    r.readAsText(f);
  };
  window.exportEdProject = () => {
    syncProjectPreviewData(proj);
    const full = `<!DOCTYPE html><html><head><style>${proj.css}</style></head><body>${proj.html}<script>${proj.js}<\/script></body></html>`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([full], { type: "text/html" }));
    a.download = `${proj.name.replace(/\s+/g, "-").toLowerCase()}.html`;
    a.click();
  };
  window.deleteEdFile = (name) => {
    if (files.length <= 1) return showToast("কমপক্ষে ১টি ফাইল থাকতে হবে!", "error");
    proj.files = files.filter((f) => f.name !== name);
    state.edActiveFile = proj.files[0].name;
    syncProjectPreviewData(proj);
    saveProjects();
    render();
  };
  window.onEdInput = (el) => {
    activeFile.content = el.value;
    syncProjectPreviewData(proj);
    saveProjects();
    const g = document.getElementById("proGutter");
    if (g) g.innerHTML = Array.from({ length: Math.max(el.value.split("\n").length, 20) }, (_, i) => `<div>${i + 1}</div>`).join("");
  };
  window.insertEdSymbol = (sym) => {
    const ta = document.getElementById("proCodeArea");
    if (!ta) return;
    const txt = sym === "TAB" ? "  " : sym;
    const s = ta.selectionStart, e = ta.selectionEnd;
    ta.value = ta.value.slice(0, s) + txt + ta.value.slice(e);
    ta.selectionStart = ta.selectionEnd = s + (txt.length === 2 && txt !== "  " ? 1 : txt.length);
    ta.focus();
    window.onEdInput(ta);
  };

  syncProjectPreviewData(proj);
  const quickPreviewDoc = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${proj.css}</style></head><body>${proj.html}<script>${proj.js}<\/script></body></html>`;

  return `
    <div class="h-[100dvh] w-full flex flex-col bg-[#1b1929] text-slate-100 relative overflow-hidden">
      <div class="bg-white text-slate-900 px-3 h-14 flex items-center justify-between border-b shrink-0">
        <div class="flex items-center gap-2 min-w-0">
          <button onclick="navigate('#/projects')" class="p-1.5 rounded-full hover:bg-slate-100"><i data-lucide="arrow-left" class="w-5 h-5"></i></button>
          <button onclick="toggleEdDrawer(true)" class="p-2 rounded-xl bg-slate-100"><i data-lucide="menu" class="w-4 h-4"></i></button>
          <span class="font-extrabold text-base truncate">${proj.name}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <button onclick="saveProjects(); showToast('Saved!','success')" class="btn-purple p-2 rounded-xl"><i data-lucide="save" class="w-4 h-4"></i></button>
          <button onclick="state.edQuickPreview=true; render()" class="p-2 rounded-xl border bg-white"><i data-lucide="play" class="w-4 h-4"></i></button>
          <button onclick="navigate('#/build')" class="p-2 rounded-xl border bg-white text-purple-600"><i data-lucide="rocket" class="w-4 h-4"></i></button>
        </div>
      </div>

      <div class="bg-[#242136] px-2 pt-1.5 flex items-center gap-1 overflow-x-auto border-b border-[#322e4a] shrink-0">
        ${files.map((f) => `<button onclick="selectEdFile('${f.name}')" class="px-3.5 py-2 rounded-t-xl text-xs font-semibold shrink-0 ${f.name === activeFile.name ? "bg-[#1b1929] text-white" : "text-slate-400"}">${f.name}</button>`).join("")}
      </div>

      <div class="flex-1 flex min-h-0 bg-[#1b1929]">
        <div id="proGutter" class="code-gutter font-mono bg-[#181625] border-r border-[#2d2945]" style="font-size:${fontSize}px">${gutterHtml}</div>
        <textarea id="proCodeArea" oninput="onEdInput(this)" onscroll="document.getElementById('proGutter').scrollTop=this.scrollTop" style="font-size:${fontSize}px" class="code-input flex-1 bg-[#1b1929] text-slate-100 font-mono p-3.5 focus:outline-none">${content.replace(/</g, "&lt;")}</textarea>
      </div>

      <div class="bg-[#242136] px-2 py-2 flex items-center gap-1.5 overflow-x-auto border-t border-[#322e4a] shrink-0">
        ${[["Tab", "TAB"], ["{ }", "{}"], ["( )", "()"], ["[ ]", "[]"], ['" "', '""'], ["< >", "<>"], [";", ";"]]
          .map(([lbl, val]) => `<button onclick='insertEdSymbol(${JSON.stringify(val)})' class="px-3 h-9 rounded-xl bg-[#2f2b47] text-white font-mono text-xs font-bold shrink-0">${lbl}</button>`)
          .join("")}
      </div>

      ${state.edDrawerOpen ? `<div class="absolute inset-0 z-40 flex"><div class="w-72 bg-white text-slate-900 h-full flex flex-col justify-between p-4 shadow-2xl"><div class="space-y-4 overflow-y-auto"><div class="flex items-center justify-between"><span class="font-extrabold text-sm">${proj.name}</span><button onclick="toggleEdDrawer(false)" class="p-1.5 rounded-xl bg-slate-100"><i data-lucide="x" class="w-4 h-4"></i></button></div><div class="grid grid-cols-3 gap-1.5 text-center text-[10px] font-bold"><button onclick="createEdNewFile()" class="p-2 rounded-xl border">New file</button><label class="p-2 rounded-xl border cursor-pointer">Import<input type="file" class="hidden" onchange="importEdFile(event)" /></label><button onclick="exportEdProject()" class="p-2 rounded-xl border">Export</button></div><div class="space-y-1.5">${files.map((f) => `<div class="flex items-center justify-between px-3 py-2 rounded-xl ${f.name === activeFile.name ? "bg-purple-50 text-purple-800 font-bold" : ""}"><button onclick="selectEdFile('${f.name}')" class="text-xs flex-1 text-left">${f.name}</button><button onclick="deleteEdFile('${f.name}')" class="text-rose-500 text-xs">×</button></div>`).join("")}</div></div></div><div onclick="toggleEdDrawer(false)" class="flex-1 bg-black/40"></div></div>` : ""}

      ${state.edQuickPreview ? `<div class="fixed inset-0 z-50 bg-white text-slate-900 flex flex-col"><div class="h-14 px-4 border-b flex items-center justify-between"><button onclick="state.edQuickPreview=false; render()" class="font-bold text-sm">← Back</button><span class="font-bold text-xs text-purple-700">${proj.name}</span><span></span></div><iframe class="flex-1 w-full bg-white" srcdoc="${quickPreviewDoc.replace(/"/g, "&quot;")}"></iframe></div>` : ""}
    </div>`;
}

// ======================================================
// ২. GitHub Build + Full Android Studio Replacement IDE
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

function renderFolderTreeHtml(node, prefix, expandedMap, activePath) {
  let html = "";
  for (const fname of Object.keys(node.folders).sort()) {
    const fullFolder = prefix ? `${prefix}/${fname}` : fname;
    const isOpen = !!expandedMap[fullFolder];
    const folderColor = fname === "res" ? "text-amber-400" : "text-sky-400";
    html += `
      <div>
        <div class="flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-white/5">
          <button onclick="toggleGhFolder('${fullFolder}')" class="flex items-center gap-2 min-w-0 flex-1 text-left">
            <span class="text-slate-400 text-[10px] w-3">${isOpen ? "▾" : "▸"}</span>
            <i data-lucide="folder" class="w-4 h-4 ${folderColor} shrink-0"></i>
            <span class="text-sm font-medium text-slate-100 truncate">${fname}</span>
          </button>
          <button onclick="openGhItemMenu('folder','${fullFolder}')" class="text-slate-400 hover:text-white p-1"><i data-lucide="more-vertical" class="w-4 h-4"></i></button>
        </div>
        ${isOpen ? `<div class="pl-3.5 border-l border-[#2c2750] ml-3">${renderFolderTreeHtml(node.folders[fname], fullFolder, expandedMap, activePath)}</div>` : ""}
      </div>`;
  }
  for (const file of node.files.sort((a, b) => a.name.localeCompare(b.name))) {
    const active = file.path === activePath;
    html += `
      <div class="flex items-center justify-between py-1.5 px-2.5 rounded-xl ${active ? "bg-purple-600/35 text-white font-bold shadow-sm" : "hover:bg-white/5 text-slate-200"}">
        <button onclick="openGhIdeFile('${file.path}')" class="flex items-center gap-2.5 min-w-0 flex-1 text-left">
          ${getFileBadge(file.name)}
          <span class="text-sm truncate">${file.name}</span>
        </button>
        <button onclick="openGhItemMenu('file','${file.path}')" class="text-slate-400 hover:text-white p-1"><i data-lucide="more-vertical" class="w-4 h-4"></i></button>
      </div>`;
  }
  return html;
}

export function renderProGithubBuild(ctx) {
  const { state, ghFetch, showToast, render, navigate, confirmLogout, loginWithGithub, loadGithubRepos } = ctx;

  if (!state.ghExpandedFolders) state.ghExpandedFolders = { app: true, "app/src": true, "app/src/main": true, "app/src/main/java": true };
  if (!state.ghOpenTabs) state.ghOpenTabs = [];
  if (!state.ghBuildVariant) state.ghBuildVariant = "debug";
  if (!state.ghGradleTask) state.ghGradleTask = "assembleDebug";
  if (!state.ghOutputSubTab) state.ghOutputSubTab = "output";
  if (!state.ghTerminalLines) state.ghTerminalLines = ["$ Ready — type 'help' or 'gradle check' below."];
  if (!state.ghLogcat) state.ghLogcat = JSON.parse(localStorage.getItem("wevlo_logcat") || "[]");
  if (!state.activeBuild) state.activeBuild = JSON.parse(localStorage.getItem("wevlo_active_build") || "null");
  if (!state.newRepoPriv) state.newRepoPriv = "private";
  if (state.newRepoStarter === undefined) state.newRepoStarter = true;

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
    addLogcat(isErr ? "E" : "I", "GradleCI", msg);
  }

  // Safely create or update any GitHub file (Always checks SHA first — fixes "sha wasn't supplied"!)
  async function ghPutFileSafe(repoFull, path, contentStr, commitMsg, branch, isAlreadyBase64 = false) {
    let sha;
    try {
      const existing = await ghFetch(`/repos/${repoFull}/contents/${path}?ref=${branch}`);
      sha = existing.sha;
    } catch {}
    return ghFetch(`/repos/${repoFull}/contents/${path}`, {
      method: "PUT",
      body: JSON.stringify({
        message: commitMsg || `Update ${path}`,
        content: isAlreadyBase64 ? contentStr : toBase64Utf8(contentStr),
        branch,
        ...(sha ? { sha } : {})
      })
    });
  }

  // Background Build Polling (Survives tab/page navigation!)
  if (state.activeBuild?.status === "running" && !window.__wevloBuildPolling) {
    window.__wevloBuildPolling = setInterval(async () => {
      if (!state.activeBuild || state.activeBuild.status !== "running" || !state.githubToken) {
        clearInterval(window.__wevloBuildPolling);
        window.__wevloBuildPolling = null;
        return;
      }
      try {
        const repoFull = state.activeBuild.repoFull;
        const runs = await ghFetch(`/repos/${repoFull}/actions/runs?per_page=1`);
        const latest = runs.workflow_runs?.[0];
        if (!latest) return;

        state.activeBuild.runUrl = latest.html_url;
        state.activeBuild.runId = latest.id;

        const jobsRes = await ghFetch(`/repos/${repoFull}/actions/runs/${latest.id}/jobs`);
        const job = jobsRes.jobs?.[0];
        if (job) {
          state.activeBuild.steps = (job.steps || []).map((s) => ({ name: s.name, status: s.status, conclusion: s.conclusion }));
          const done = state.activeBuild.steps.filter((s) => s.status === "completed").length;
          state.activeBuild.progress = Math.min(92, Math.max(25, Math.round((done / Math.max(state.activeBuild.steps.length, 1)) * 90)));
        }

        if (latest.status === "completed") {
          clearInterval(window.__wevloBuildPolling);
          window.__wevloBuildPolling = null;
          state.activeBuild.progress = 100;

          if (latest.conclusion === "success") {
            state.activeBuild.status = "success";
            appendBuildLog("✓ Gradle build succeeded! Fetching APK/AAB asset...");
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
            showToast("APK Build সফল হয়েছে!", "success");
          } else {
            state.activeBuild.status = "failed";
            const failedStep = (state.activeBuild.steps || []).find((s) => s.conclusion === "failure");
            const errMsg = failedStep ? `Failed at step: "${failedStep.name}"` : `Build failed (${latest.conclusion}).`;
            state.activeBuild.errorSummary = errMsg;
            appendBuildLog("✖ " + errMsg, true);
            showToast("Build Failed! Check Output tab.", "error");
          }
        }
        saveActiveBuild();
        if (state.route === "#/github-build" && state.ghIdeOpen) render();
      } catch {}
    }, 6000);
  }

  // Authenticated Download Helper (Works for BOTH Private & Public Repositories!)
  window.downloadBuiltApkAsset = async (apiUrl, fileName, browserUrl) => {
    try {
      showToast("Downloading " + fileName + "...", "info");
      const res = await fetch(apiUrl, {
        headers: { Authorization: "Bearer " + state.githubToken, Accept: "application/octet-stream" }
      });
      if (!res.ok) throw new Error("Fallback to browser URL");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      a.click();
    } catch {
      window.open(browserUrl, "_blank");
    }
  };

  window.startPersistentIdeBuild = async () => {
    if (!state.githubToken) return showToast("আগে GitHub কানেক্ট করুন!", "error");
    if (state.ghIdeDirty && state.ghIdeActivePath) await window.saveGhIdeFile();

    const repoFull = state.selectedGhRepo;
    const branch = state.ghBranch || "main";
    const task = state.ghGradleTask || "assembleDebug";

    state.activeBuild = {
      repoFull, branch, task, status: "running", progress: 15, startedAt: new Date().toLocaleTimeString(),
      logs: [{ time: new Date().toLocaleTimeString(), msg: `Starting '${task}' on ${repoFull} (${branch})...`, isErr: false }],
      steps: [], apkUrl: "", apkApiUrl: "", errorSummary: ""
    };
    saveActiveBuild();
    addLogcat("I", "BuildManager", `Queued ${task}`);
    state.ghMobileTab = "output";
    state.ghOutputSubTab = "output";
    render();

    try {
      const wfContent = generateWorkflowYaml(branch, task, "1.0");
      await ghPutFileSafe(repoFull, ".github/workflows/wevlo-build.yml", wfContent, `Trigger Gradle ${task}`, branch);
      appendBuildLog("Workflow triggered on GitHub Actions. Polling steps...");
      render();
    } catch (e) {
      state.activeBuild.status = "failed";
      state.activeBuild.errorSummary = e.message;
      appendBuildLog("Error: " + e.message, true);
      saveActiveBuild();
      render();
    }
  };

  window.downloadBuildReportTxt = () => {
    const b = state.activeBuild;
    if (!b) return;
    const issues = analyzeProjectIssues({ treeFiles: state.ghTreeFiles || [], activePath: state.ghIdeActivePath || "", activeContent: state.ghIdeContent || "", branch: state.ghBranch || "main" });
    const text = [
      `=== WEVLO ANDROID BUILD REPORT ===`,
      `Repo: ${b.repoFull} (${b.branch}) | Task: ${b.task} | Status: ${b.status.toUpperCase()}`,
      `Run URL: ${b.runUrl || "N/A"}`,
      b.errorSummary ? `\nERROR: ${b.errorSummary}` : "",
      `\n=== STEPS ===`,
      ...(b.steps || []).map((s) => `- [${s.conclusion || s.status}] ${s.name}`),
      `\n=== LOGS ===`,
      ...(b.logs || []).map((l) => `[${l.time}] ${l.msg}`),
      `\n=== PROBLEMS (${issues.length}) ===`,
      ...issues.map((i) => `[${i.severity.toUpperCase()}] ${i.file}: ${i.message}`)
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

  // Fixed Auto-Fix (Now always fetches SHA before PUT!)
  window.autoFixProblem = async (idx) => {
    const issues = analyzeProjectIssues({ treeFiles: state.ghTreeFiles || [], activePath: state.ghIdeActivePath || "", activeContent: state.ghIdeContent || "", branch: state.ghBranch || "main" });
    const prob = issues[idx];
    if (!prob || !prob.fixPath || !prob.fixContent) return;
    try {
      showToast(`Fixing ${prob.fixPath}...`, "info");
      await ghPutFileSafe(state.selectedGhRepo, prob.fixPath, prob.fixContent, `Auto-fix ${prob.fixPath}`, state.ghBranch || "main");
      addLogcat("I", "AutoFix", `Fixed ${prob.fixPath}`);
      showToast(`Fixed ${prob.fixPath}!`, "success");
      await window.refreshGhTree();
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  window.execTerminalInput = (forcedCmd = null) => {
    const inp = document.getElementById("ghTermInput");
    const cmd = forcedCmd !== null ? forcedCmd : inp?.value || "";
    if (!cmd.trim()) return;
    if (inp && forcedCmd === null) inp.value = "";
    state.ghTerminalLines.push(`mohir@wevlo:~$ ${cmd}`);
    const out = runTerminalCommand(cmd, {
      treeFiles: state.ghTreeFiles || [],
      activePath: state.ghIdeActivePath || "",
      activeContent: state.ghIdeContent || "",
      branch: state.ghBranch || "main",
      triggerBuild: () => window.startPersistentIdeBuild(),
      clearTerminal: () => { state.ghTerminalLines = []; }
    });
    state.ghTerminalLines.push(...out);
    addLogcat("D", "Terminal", cmd);
    render();
  };

  // New Project Modal Actions (Screenshot 4)
  window.confirmCreateGhNewProject = async () => {
    const name = document.getElementById("ghModalRepoName")?.value.trim();
    if (!name) return showToast("Repository name লিখুন!", "error");
    if (!state.githubToken) return showToast("আগে GitHub কানেক্ট করুন!", "error");
    try {
      showToast("Creating repository...", "info");
      const r = await ghFetch("/user/repos", {
        method: "POST",
        body: JSON.stringify({ name, private: state.newRepoPriv === "private", auto_init: true })
      });
      state.ghBranch = r.default_branch || "main";
      state.selectedGhRepo = r.full_name;
      if (state.newRepoStarter) {
        const seed = [
          ["settings.gradle", DEFAULT_ANDROID_TEMPLATES["settings.gradle"]],
          ["build.gradle", DEFAULT_ANDROID_TEMPLATES["build.gradle"]],
          ["gradle.properties", DEFAULT_ANDROID_TEMPLATES["gradle.properties"]],
          ["app/build.gradle", DEFAULT_ANDROID_TEMPLATES["app/build.gradle"]],
          ["app/src/main/AndroidManifest.xml", DEFAULT_ANDROID_TEMPLATES["app/src/main/AndroidManifest.xml"]],
          ["app/src/main/java/com/wevlo/app/MainActivity.java", DEFAULT_ANDROID_TEMPLATES["MainActivity.java"]]
        ];
        for (const [p, c] of seed) {
          await ghPutFileSafe(r.full_name, p, c, `Starter ${p}`, state.ghBranch);
        }
      }
      state.ghNewProjModalOpen = false;
      await loadGithubRepos();
      await window.openGhVsCodeIde();
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  // Import Actions (Files / ZIP / Folder - Screenshot 3)
  window.handleImportFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (!state.githubToken) return showToast("আগে GitHub কানেক্ট করুন!", "error");
    const repoName = prompt("Repository name for imported files:", state.selectedGhRepo?.split("/")[1] || "imported-android-app");
    if (!repoName) return;
    try {
      showToast("Uploading " + files.length + " file(s)...", "info");
      const r = await ghFetch("/user/repos", { method: "POST", body: JSON.stringify({ name: repoName.trim(), private: true, auto_init: true }) });
      const br = r.default_branch || "main";
      for (const f of files.slice(0, 60)) {
        const relPath = f.webkitRelativePath ? f.webkitRelativePath.split("/").slice(1).join("/") : f.name;
        if (!relPath || relPath.startsWith(".git/")) continue;
        const buf = await f.arrayBuffer();
        let bin = "";
        new Uint8Array(buf).forEach((b) => (bin += String.fromCharCode(b)));
        await ghPutFileSafe(r.full_name, relPath, btoa(bin), `Import ${relPath}`, br, true);
      }
      state.ghImportMenuOpen = false;
      state.selectedGhRepo = r.full_name;
      state.ghBranch = br;
      await loadGithubRepos();
      await window.openGhVsCodeIde();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  window.handleImportZip = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!state.githubToken) return showToast("আগে GitHub কানেক্ট করুন!", "error");
    const repoName = prompt("New Repository name for ZIP:", file.name.replace(/\.zip$/i, "").replace(/[^a-zA-Z0-9-_]/g, "-"));
    if (!repoName) return;
    try {
      showToast("Extracting ZIP & uploading...", "info");
      const JSZip = await ensureJSZip();
      const zip = await JSZip.loadAsync(file);
      const r = await ghFetch("/user/repos", { method: "POST", body: JSON.stringify({ name: repoName.trim(), private: true, auto_init: true }) });
      const br = r.default_branch || "main";
      const entries = Object.values(zip.files).filter((z) => !z.dir && !z.name.startsWith("__MACOSX") && !z.name.startsWith(".git/"));
      for (const entry of entries.slice(0, 60)) {
        const b64 = await entry.async("base64");
        await ghPutFileSafe(r.full_name, entry.name, b64, `Import ${entry.name}`, br, true);
      }
      state.ghImportMenuOpen = false;
      state.selectedGhRepo = r.full_name;
      state.ghBranch = br;
      await loadGithubRepos();
      await window.openGhVsCodeIde();
    } catch (err) {
      showToast("ZIP Import Error: " + err.message, "error");
    }
  };

  // Create Signing Keystore Action (Screenshot 5)
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
    const country = document.getElementById("ksCountry")?.value.trim() || "BD";
    const years = document.getElementById("ksYears")?.value.trim() || "25";
    const alias = document.getElementById("ksAlias")?.value.trim() || "key0";
    const pass = document.getElementById("ksPassInput")?.value || "";
    if (pass.length < 6) return showToast("কমপক্ষে ৬ অক্ষরের Password দিন!", "error");
    const keyPair = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
    const jwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
    const ksObj = { name, org, country, years, alias, createdAt: new Date().toISOString(), jwk };
    localStorage.setItem("wevlo_signing_key", JSON.stringify(ksObj));
    state.ghKeystoreModalOpen = false;
    render();
    showToast(`Keystore "${alias}" created & saved on device!`, "success");
  };

  // Explorer Tree, Dirty Dot & File Saving
  window.toggleGhFolder = (path) => { state.ghExpandedFolders[path] = !state.ghExpandedFolders[path]; render(); };
  window.openGhNewFileModal = (prefix = "app/") => { state.ghNewFilePrefix = prefix; state.ghNewFileModalOpen = true; state.ghItemMenu = null; render(); };
  window.openGhItemMenu = (type, path) => { state.ghItemMenu = { type, path }; render(); };

  window.deleteGhRepoFile = async (path) => {
    state.ghItemMenu = null;
    if (!confirm(`Delete ${path} from GitHub?`)) return;
    try {
      const br = state.ghBranch || "main";
      const fData = await ghFetch(`/repos/${state.selectedGhRepo}/contents/${path}?ref=${br}`);
      await ghFetch(`/repos/${state.selectedGhRepo}/contents/${path}`, { method: "DELETE", body: JSON.stringify({ message: `Delete ${path}`, sha: fData.sha, branch: br }) });
      showToast(`Deleted ${path}`, "info");
      await window.refreshGhTree();
    } catch (e) { showToast(e.message, "error"); }
  };

  window.createGhNewFileConfirm = async () => {
    const path = document.getElementById("ghNewFilePathInput")?.value.trim();
    if (!path || path.endsWith("/")) return showToast("সঠিক ফাইল নাম লিখুন!", "error");
    try {
      const defContent = DEFAULT_ANDROID_TEMPLATES[path] || DEFAULT_ANDROID_TEMPLATES[path.split("/").pop()] || "// Created with Wevlo IDE\n";
      await ghPutFileSafe(state.selectedGhRepo, path, defContent, `Create ${path}`, state.ghBranch || "main");
      state.ghNewFileModalOpen = false;
      showToast(`Created ${path}!`, "success");
      await window.refreshGhTree();
      await window.openGhIdeFile(path);
    } catch (e) { showToast(e.message, "error"); }
  };

  window.refreshGhTree = async () => {
    state.ghTreeLoading = true;
    render();
    try {
      const treeData = await ghFetch(`/repos/${state.selectedGhRepo}/git/trees/${state.ghBranch || "main"}?recursive=1`);
      state.ghTreeFiles = (treeData.tree || []).filter((t) => t.type === "blob").slice(0, 120);
    } catch (e) { showToast("Tree error: " + e.message, "error"); }
    state.ghTreeLoading = false;
    render();
  };

  window.openGhVsCodeIde = async () => {
    if (!state.githubToken) return showToast("আগে GitHub কানেক্ট করুন!", "error");
    const repo = document.getElementById("ghRepoSelect")?.value || state.selectedGhRepo;
    if (!repo) { state.ghNewProjModalOpen = true; return render(); }
    state.selectedGhRepo = repo;
    state.ghIdeOpen = true;
    state.ghMobileTab = "files";
    state.ghIdeDirty = false;
    await window.refreshGhTree();
    const def = (state.ghTreeFiles || []).find((f) => f.path.endsWith("MainActivity.java")) || (state.ghTreeFiles || [])[0];
    if (def) await window.openGhIdeFile(def.path, false);
  };

  window.openGhIdeFile = async (path, switchToEditor = true) => {
    state.ghIdeActivePath = path;
    if (!state.ghOpenTabs.includes(path)) state.ghOpenTabs.push(path);
    state.ghIdeFileLoading = true;
    state.ghIdeDirty = false;
    if (switchToEditor) state.ghMobileTab = "editor";
    render();
    try {
      const data = await ghFetch(`/repos/${state.selectedGhRepo}/contents/${path}?ref=${state.ghBranch || "main"}`);
      state.ghIdeFileSha = data.sha;
      state.ghIdeContent = decodeURIComponent(escape(atob((data.content || "").replace(/\n/g, ""))));
      addLogcat("D", "Editor", `Opened ${path}`);
    } catch (e) { state.ghIdeContent = "// Error: " + e.message; }
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

  window.onGhCodeEdit = (el) => {
    state.ghIdeContent = el.value;
    if (!state.ghIdeDirty) {
      state.ghIdeDirty = true;
      document.getElementById("saveDirtyDot")?.classList.remove("hidden");
      document.getElementById("editorTabDot")?.classList.remove("hidden");
    }
    const g = document.getElementById("ghIdeGutter");
    if (g) g.innerHTML = Array.from({ length: Math.max(el.value.split("\n").length, 22) }, (_, i) => `<div>${i + 1}</div>`).join("");
  };

  window.saveGhIdeFile = async () => {
    if (!state.selectedGhRepo || !state.ghIdeActivePath) return;
    try {
      const content = document.getElementById("ghIdeTextArea")?.value ?? state.ghIdeContent;
      const res = await ghPutFileSafe(state.selectedGhRepo, state.ghIdeActivePath, content, `Update ${state.ghIdeActivePath}`, state.ghBranch || "main");
      state.ghIdeFileSha = res.content?.sha;
      state.ghIdeContent = content;
      state.ghIdeDirty = false;
      addLogcat("I", "GitCommit", `Committed ${state.ghIdeActivePath}`);
      render();
      showToast(`Saved ${state.ghIdeActivePath.split("/").pop()}!`, "success");
    } catch (e) { showToast("Save error: " + e.message, "error"); }
  };

  window.insertGhSymbol = (sym) => {
    const ta = document.getElementById("ghIdeTextArea");
    if (!ta) return;
    const txt = sym === "TAB" ? "    " : sym;
    const s = ta.selectionStart, e = ta.selectionEnd;
    ta.value = ta.value.slice(0, s) + txt + ta.value.slice(e);
    ta.selectionStart = ta.selectionEnd = s + (txt.length === 2 && txt !== "  " ? 1 : txt.length);
    window.onGhCodeEdit(ta);
    ta.focus();
  };

  // ======================================================
  // STEP 3: Full-Screen Computer-Class Mobile IDE
  // ======================================================
  if (state.ghIdeOpen && state.selectedGhRepo) {
    const files = state.ghTreeFiles || [];
    const repoName = state.selectedGhRepo.split("/")[1];
    const activePath = state.ghIdeActivePath || "";
    const fileCode = state.ghIdeContent || "";
    const lines = Array.from({ length: Math.max(fileCode.split("\n").length, 22) }, (_, i) => `<div>${i + 1}</div>`).join("");
    const tab = state.ghMobileTab || "files";
    const treeRoot = buildNestedTree(files);
    const issues = analyzeProjectIssues({ treeFiles: files, activePath, activeContent: fileCode, branch: state.ghBranch || "main" });
    const ab = state.activeBuild;
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
        <!-- Top Bar With Dirty Save Dot -->
        <div class="bg-[#191632] px-3 h-14 flex items-center justify-between border-b border-[#2b264e] shrink-0">
          <div class="flex items-center gap-2.5 min-w-0">
            <button onclick="state.ghIdeOpen=false; render()" class="p-1.5 rounded-full hover:bg-white/10"><i data-lucide="arrow-left" class="w-5 h-5"></i></button>
            <div class="min-w-0">
              <p class="font-extrabold text-sm truncate max-w-[120px]">${repoName}</p>
              <p class="text-[11px] text-slate-400 flex items-center gap-1"><i data-lucide="git-branch" class="w-3 h-3"></i> ${state.ghBranch || "main"}</p>
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            <button onclick="state.ghTemplatesOpen=true; render()" class="px-2.5 py-1.5 rounded-xl bg-[#27234a] text-[11px] font-bold text-purple-300">📘 Guide</button>
            <button onclick="saveGhIdeFile()" class="relative p-2 rounded-xl hover:bg-white/10">
              <i data-lucide="save" class="w-4 h-4 text-slate-200"></i>
              <span id="saveDirtyDot" class="${state.ghIdeDirty ? "" : "hidden"} absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400"></span>
            </button>
            <button onclick="startPersistentIdeBuild()" class="btn-purple p-2.5 rounded-xl"><i data-lucide="play" class="w-4 h-4"></i></button>
          </div>
        </div>

        ${ab && ab.status === "running" ? `<button onclick="state.ghMobileTab='output'; state.ghOutputSubTab='output'; render()" class="bg-purple-900/50 border-b border-purple-500/40 px-3 py-1.5 flex items-center justify-between text-xs shrink-0"><span class="flex items-center gap-2 font-bold text-purple-200"><span class="spinner"></span> Building ${ab.task} (${ab.progress}%)...</span><span class="text-purple-300 underline font-bold">View Output →</span></button>` : ""}

        <div class="flex-1 min-h-0 overflow-hidden flex flex-col">
          ${tab === "files" ? `<div class="flex-1 overflow-y-auto p-3.5 space-y-3"><div class="flex items-center justify-between"><span class="font-extrabold text-base">Project Explorer</span><div class="flex items-center gap-2"><button onclick="openGhNewFileModal('app/')" class="p-1.5 rounded-lg hover:bg-white/10"><i data-lucide="file-plus" class="w-4 h-4"></i></button><button onclick="refreshGhTree()" class="p-1.5 rounded-lg hover:bg-white/10"><i data-lucide="refresh-cw" class="w-4 h-4"></i></button></div></div><div class="bg-[#1b1836] border border-[#2d2854] rounded-2xl p-3 flex items-center justify-between gap-2"><div class="flex items-center gap-2.5 min-w-0"><span class="w-8 h-8 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center shrink-0"><i data-lucide="github" class="w-4 h-4"></i></span><span class="font-extrabold text-sm truncate">${repoName}</span></div><a href="https://github.com/${state.selectedGhRepo}" target="_blank" class="border border-[#3a3469] bg-[#242047] px-3 py-1.5 rounded-xl text-xs font-bold shrink-0">Open in GitHub ↗</a></div>${state.ghTreeLoading ? `<div class="py-12 text-center"><span class="spinner"></span></div>` : `<div class="space-y-0.5">${renderFolderTreeHtml(treeRoot, "", state.ghExpandedFolders, activePath)}</div>`}</div>` : ""}

          ${tab === "editor" ? `<div class="flex-1 flex flex-col min-h-0"><div class="bg-[#191632] px-2 pt-1.5 flex items-center gap-1 overflow-x-auto border-b border-[#2b264e] shrink-0">${(state.ghOpenTabs.length ? state.ghOpenTabs : [activePath].filter(Boolean)).map((tp) => `<div class="flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-xs shrink-0 ${tp === activePath ? "bg-[#121024] text-white font-bold border-t-2 border-purple-500" : "text-slate-400"}"><button onclick="openGhIdeFile('${tp}')">&lt;/&gt; ${tp.split("/").pop()}</button><button onclick="closeGhTab('${tp}')" class="text-slate-500 ml-1">×</button></div>`).join("")}</div><div class="flex-1 flex min-h-0 bg-[#121024]"><div id="ghIdeGutter" class="code-gutter font-mono bg-[#121024] border-r border-[#242042]">${lines}</div><textarea id="ghIdeTextArea" oninput="onGhCodeEdit(this)" onscroll="document.getElementById('ghIdeGutter').scrollTop=this.scrollTop" wrap="off" class="code-input flex-1 bg-[#121024] text-emerald-300 font-mono p-3 focus:outline-none whitespace-pre overflow-x-auto">${state.ghIdeFileLoading ? "// Loading..." : fileCode.replace(/</g, "&lt;")}</textarea></div><div class="bg-[#1b1836] px-2 py-2 flex items-center gap-1.5 overflow-x-auto border-t border-[#2b264e] shrink-0">${[["Tab", "TAB"], ["{ }", "{}"], ["( )", "()"], ["[ ]", "[]"], ['" "', '""'], ["< >", "<>"], [";", ";"]].map(([lbl, val]) => `<button onclick='insertGhSymbol(${JSON.stringify(val)})' class="px-3.5 h-9 rounded-xl bg-[#27234a] text-white font-mono text-xs font-bold shrink-0">${lbl}</button>`).join("")}</div></div>` : ""}

          ${tab === "build" ? `<div class="flex-1 overflow-y-auto p-4 space-y-4"><div class="grid grid-cols-3 gap-2"><button onclick="startPersistentIdeBuild()" class="btn-purple py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5"><i data-lucide="play" class="w-4 h-4"></i> Run</button><button onclick="startPersistentIdeBuild()" class="bg-[#231f42] border border-[#322d5c] py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5"><i data-lucide="hammer" class="w-4 h-4"></i> Build</button><button onclick="state.activeBuild=null; localStorage.removeItem('wevlo_active_build'); render(); showToast('Cleaned','info')" class="bg-[#231f42] border border-[#322d5c] py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5"><i data-lucide="trash-2" class="w-4 h-4"></i> Clean</button></div><div><label class="text-xs font-bold text-slate-300">Build Variant</label><select onchange="state.ghBuildVariant=this.value" class="w-full mt-1.5 bg-[#1b1836] border border-[#2f2a57] rounded-2xl px-4 py-3 text-sm font-semibold"><option value="debug" ${state.ghBuildVariant === "debug" ? "selected" : ""}>📱 debug</option><option value="release" ${state.ghBuildVariant === "release" ? "selected" : ""}>📱 release</option></select></div><div><label class="text-xs font-bold text-slate-300">Gradle Task</label><button onclick="state.ghTaskPickerOpen=true; render()" class="w-full mt-1.5 bg-[#1b1836] border border-[#2f2a57] rounded-2xl px-4 py-3 text-sm font-semibold flex items-center justify-between"><span class="flex items-center gap-2"><i data-lucide="hammer" class="w-4 h-4 text-emerald-400"></i> ${state.ghGradleTask}</span><i data-lucide="chevron-down" class="w-4 h-4 text-slate-400"></i></button><p class="text-[11px] text-slate-400 mt-1.5">${curTaskDesc}</p></div><button onclick="startPersistentIdeBuild()" class="w-full btn-purple py-3.5 rounded-2xl text-sm font-extrabold flex items-center justify-center gap-2"><i data-lucide="rocket" class="w-4 h-4"></i> Start Build</button><div class="bg-[#191632] border border-[#2c2754] rounded-2xl p-4 space-y-2 text-xs"><p class="font-extrabold text-sm">ℹ Project Info</p><div class="flex justify-between"><span class="text-slate-400">Project Name</span><b>: ${repoName}</b></div><div class="flex justify-between"><span class="text-slate-400">Gradle Version</span><b>: 8.7</b></div><div class="flex justify-between"><span class="text-slate-400">Android Plugin</span><b>: 8.5.2</b></div><div class="flex justify-between"><span class="text-slate-400">Problems</span><b class="${issues.length ? "text-amber-400" : "text-emerald-400"}">: ${issues.length}</b></div></div></div>` : ""}

          ${tab === "output" ? `<div class="flex-1 flex flex-col min-h-0"><div class="bg-[#191632] px-3 flex items-center gap-3 overflow-x-auto border-b border-[#2b264e] text-xs font-bold shrink-0"><button onclick="state.ghOutputSubTab='terminal'; render()" class="py-2.5 shrink-0 ${state.ghOutputSubTab === "terminal" ? "text-white border-b-2 border-purple-500" : "text-slate-400"}">&gt;_ Terminal</button><button onclick="state.ghOutputSubTab='output'; render()" class="py-2.5 shrink-0 ${state.ghOutputSubTab === "output" ? "text-white border-b-2 border-purple-500" : "text-slate-400"}">≡ Build Output</button><button onclick="state.ghOutputSubTab='logcat'; render()" class="py-2.5 shrink-0 ${state.ghOutputSubTab === "logcat" ? "text-white border-b-2 border-purple-500" : "text-slate-400"}">📱 Logcat</button><button onclick="state.ghOutputSubTab='problems'; render()" class="py-2.5 shrink-0 ${state.ghOutputSubTab === "problems" ? "text-white border-b-2 border-purple-500" : "text-slate-400"}">ⓘ Problems (${issues.length})</button></div>${state.ghOutputSubTab === "terminal" ? `<div class="flex-1 flex flex-col min-h-0 p-3 font-mono text-xs"><div class="flex gap-1.5 overflow-x-auto pb-2 shrink-0">${["gradle check", "ls", "gradle tasks", "gradle template app/build.gradle", "build", "clear"].map((c) => `<button onclick="execTerminalInput('${c}')" class="px-2.5 py-1 rounded-lg bg-[#231f42] text-purple-300 shrink-0">${c}</button>`).join("")}</div><div class="flex-1 overflow-y-auto space-y-1 text-slate-200 bg-[#0d0c18] p-3 rounded-2xl border border-[#252142]">${state.ghTerminalLines.map((l) => `<div class="whitespace-pre-wrap">${l.replace(/</g, "&lt;")}</div>`).join("")}</div><div class="mt-2 flex gap-2 shrink-0"><input id="ghTermInput" onkeydown="if(event.key==='Enter') execTerminalInput()" placeholder="Type command (gradle check, help)..." class="flex-1 bg-[#1b1836] border border-[#342f61] rounded-xl px-3 py-2 text-xs text-white" /><button onclick="execTerminalInput()" class="btn-purple px-4 rounded-xl font-bold">Run</button></div></div>` : ""}${state.ghOutputSubTab === "output" ? `<div class="flex-1 overflow-y-auto p-4 space-y-3 text-xs">${!ab ? `<p class="text-slate-400 font-mono">$ Ready — press Start Build to run Gradle on GitHub Actions.</p>` : `<div class="bg-[#191632] border border-[#2f2a57] rounded-2xl p-4 space-y-3"><div class="flex justify-between items-center"><span class="font-extrabold text-sm">${ab.status === "running" ? "⏳ Building..." : ab.status === "success" ? "✓ Build Succeeded" : "✖ Build Failed"}</span><button onclick="downloadBuildReportTxt()" class="bg-[#27234a] px-3 py-1.5 rounded-xl font-bold text-purple-300">⬇ Report (.txt)</button></div><div class="w-full h-2 bg-[#121024] rounded-full overflow-hidden"><div class="h-full bg-purple-600 transition-all" style="width:${ab.progress}%"></div></div>${ab.errorSummary ? `<div class="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 font-bold">${ab.errorSummary}</div>` : ""}${ab.apkUrl ? `<button onclick="downloadBuiltApkAsset('${ab.apkApiUrl}','${ab.apkName}','${ab.apkUrl}')" class="w-full btn-purple py-2.5 rounded-full font-bold">⬇ Download ${ab.apkName} (${ab.apkSize})</button>` : ""}${(ab.steps || []).length ? `<div class="space-y-1 pt-2 border-t border-[#2b264e]"><p class="font-bold text-slate-400">GitHub Steps:</p>${ab.steps.map((s) => `<div class="flex justify-between font-mono text-[11px]"><span>${s.name}</span><span class="${s.conclusion === "failure" ? "text-rose-400" : s.conclusion === "success" ? "text-emerald-400" : "text-amber-300"}">${s.conclusion || s.status}</span></div>`).join("")}</div>` : ""}<div class="space-y-1 pt-2 border-t border-[#2b264e] font-mono text-[11px]">${(ab.logs || []).map((l) => `<div class="${l.isErr ? "text-rose-400" : "text-slate-300"}">[${l.time}] ${l.msg}</div>`).join("")}${ab.runUrl ? `<a href="${ab.runUrl}" target="_blank" class="inline-block mt-2 text-purple-400 underline">Full GitHub Actions Logs ↗</a>` : ""}</div></div>`}</div>` : ""}${state.ghOutputSubTab === "logcat" ? `<div class="flex-1 flex flex-col min-h-0 p-3 space-y-2 text-xs"><div class="flex justify-between items-center"><span class="font-bold text-slate-400">Live Logcat</span><div class="flex gap-2"><button onclick="exportLogcatTxt()" class="px-3 py-1 rounded-lg bg-[#231f42] font-bold">Export .txt</button><button onclick="state.ghLogcat=[]; localStorage.removeItem('wevlo_logcat'); render()" class="px-3 py-1 rounded-lg bg-[#231f42] text-rose-400 font-bold">Clear</button></div></div><div class="flex-1 overflow-y-auto bg-[#0d0c18] border border-[#252142] rounded-2xl p-3 font-mono text-[11px] space-y-1">${state.ghLogcat.length === 0 ? `<p class="text-slate-500">No logcat events yet.</p>` : state.ghLogcat.map((l) => `<div class="${l.level === "E" ? "text-rose-400" : l.level === "W" ? "text-amber-300" : "text-emerald-300"}">[${l.time}] ${l.level}/${l.tag}: ${l.msg}</div>`).join("")}</div></div>` : ""}${state.ghOutputSubTab === "problems" ? `<div class="flex-1 overflow-y-auto p-4 space-y-2.5 text-xs">${issues.length === 0 ? `<p class="text-emerald-400 font-bold">✓ No problems found.</p>` : issues.map((p, idx) => `<div class="p-3.5 rounded-2xl border ${p.severity === "error" ? "bg-rose-500/10 border-rose-500/40" : "bg-amber-500/10 border-amber-500/40"} space-y-2"><div class="flex justify-between items-center"><b class="${p.severity === "error" ? "text-rose-300" : "text-amber-300"}">${p.file}</b><span class="uppercase text-[10px] font-extrabold">${p.severity}</span></div><p class="text-slate-200">${p.message}</p>${p.fixPath ? `<button onclick="autoFixProblem(${idx})" class="btn-purple px-3.5 py-1.5 rounded-full text-[11px] font-bold">⚡ Auto-Fix Missing File</button>` : ""}</div>`).join("")}</div>` : ""}</div>` : ""}
        </div>

        <!-- Bottom 4-Tab Bar With Unsaved Yellow Dot on Editor -->
        <div class="bg-[#17142e] border-t border-[#2b264e] grid grid-cols-4 text-[11px] font-bold shrink-0">
          ${[["files", "folder", "Files"], ["editor", "code-2", "Editor"], ["build", "rocket", "Build"], ["output", "terminal", "Output"]]
            .map(([id, ic, lbl]) => `<button onclick="state.ghMobileTab='${id}'; render()" class="relative py-2.5 flex flex-col items-center gap-1 ${tab === id ? "text-purple-400 border-t-2 border-purple-500" : "text-slate-400"}"><i data-lucide="${ic}" class="w-4 h-4"></i>${id === "editor" ? `<span id="editorTabDot" class="${state.ghIdeDirty ? "" : "hidden"} absolute top-2 right-[34%] w-2 h-2 rounded-full bg-amber-400"></span>` : ""}<span>${lbl}</span></button>`)
            .join("")}
        </div>

        ${state.ghItemMenu ? `<div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3"><div class="bg-[#1b1833] border border-[#342f61] w-full max-w-sm rounded-[26px] p-5 space-y-2.5 animate-slide-up text-xs font-bold"><div class="flex justify-between items-center pb-1"><span class="truncate text-purple-300">${state.ghItemMenu.path}</span><button onclick="state.ghItemMenu=null; render()" class="p-1 rounded-full bg-[#2a254d]"><i data-lucide="x" class="w-4 h-4"></i></button></div>${state.ghItemMenu.type === "folder" ? `<button onclick="openGhNewFileModal('${state.ghItemMenu.path}/')" class="w-full text-left p-3 rounded-2xl bg-[#242047]">+ New file in this folder</button>` : `<button onclick="const p=state.ghItemMenu.path; state.ghItemMenu=null; openGhIdeFile(p)" class="w-full text-left p-3 rounded-2xl bg-[#242047]">Open in Editor</button><button onclick="deleteGhRepoFile('${state.ghItemMenu.path}')" class="w-full text-left p-3 rounded-2xl bg-rose-500/20 text-rose-300">Delete from GitHub</button>`}<button onclick="navigator.clipboard?.writeText('${state.ghItemMenu.path}'); state.ghItemMenu=null; render(); showToast('Copied path!','success')" class="w-full text-left p-3 rounded-2xl bg-[#242047]">Copy path</button></div></div>` : ""}

        ${state.ghTemplatesOpen ? `<div class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3"><div class="bg-[#1b1833] border border-[#342f61] w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-[26px] p-5 space-y-3 text-xs"><div class="flex justify-between items-center"><h3 class="font-extrabold text-base">Java &amp; Gradle Setup Guide</h3><button onclick="state.ghTemplatesOpen=false; render()" class="p-1.5 rounded-full bg-[#2a254d]"><i data-lucide="x" class="w-4 h-4"></i></button></div>${Object.entries(DEFAULT_ANDROID_TEMPLATES).map(([fn, code]) => `<details class="border border-[#2f2a57] rounded-2xl p-3 bg-[#121024]"><summary class="font-bold cursor-pointer text-purple-300">${fn}</summary><pre class="mt-2 text-[11px] font-mono text-emerald-300 overflow-x-auto">${code.replace(/</g, "&lt;")}</pre></details>`).join("")}</div></div>` : ""}

        ${state.ghTaskPickerOpen ? `<div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3"><div class="bg-[#1c1936] border border-[#342f61] w-full max-w-md rounded-3xl p-4 space-y-2 animate-slide-up">${gradleTasks.map(([t, d]) => `<button onclick="state.ghGradleTask='${t}'; state.ghTaskPickerOpen=false; render()" class="w-full text-left p-3.5 rounded-2xl ${state.ghGradleTask === t ? "bg-purple-600/30 border border-purple-500" : "hover:bg-white/5"}"><p class="font-extrabold text-sm text-white">${t}</p><p class="text-xs text-slate-400">${d}</p></button>`).join("")}</div></div>` : ""}

        ${state.ghNewFileModalOpen ? `<div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3"><div class="bg-[#1b1833] border border-[#342f61] w-full max-w-md rounded-[26px] p-5 space-y-4 animate-slide-up"><div class="flex justify-between items-center"><h3 class="font-extrabold text-lg text-white">New file</h3><button onclick="state.ghNewFileModalOpen=false; render()" class="w-8 h-8 rounded-full bg-[#2a254d] flex items-center justify-center"><i data-lucide="x" class="w-4 h-4"></i></button></div><div><label class="text-xs text-slate-400">File path (folders separated by /)</label><input id="ghNewFilePathInput" value="${state.ghNewFilePrefix || "app/"}" class="w-full mt-1.5 bg-[#121024] border border-[#3b3569] rounded-2xl px-4 py-3 text-sm text-white focus:outline-none" /></div><div class="grid grid-cols-2 gap-3"><button onclick="state.ghNewFileModalOpen=false; render()" class="py-3 rounded-2xl bg-[#2a254d] font-bold text-sm">Cancel</button><button onclick="createGhNewFileConfirm()" class="py-3 rounded-2xl btn-purple font-bold text-sm">Create</button></div></div></div>` : ""}
      </div>`;
  }

  // ======================================================
  // STEP 1 & 2: Project Selector + New Project, Import & Keystore Modals
  // ======================================================
  const repos = (state.githubRepos || []).filter((r) => r.full_name.toLowerCase().includes((state.repoFilter || "").toLowerCase()));
  return `
    <div class="max-w-5xl mx-auto px-4 py-5 space-y-5 relative">
      <div class="wevlo-card p-4 flex items-center justify-between text-xs font-bold">
        <div class="flex items-center gap-1.5 text-purple-700"><span class="w-6 h-6 rounded-full btn-purple flex items-center justify-center">${state.githubToken ? "✓" : "1"}</span><span>Connect GitHub</span></div>
        <div class="flex-1 h-0.5 bg-purple-200 mx-2"></div>
        <div class="flex items-center gap-1.5 ${state.githubToken ? "text-purple-700" : "text-muted"}"><span class="w-6 h-6 rounded-full ${state.githubToken ? "btn-purple" : "bg-slate-200 text-slate-600"} flex items-center justify-center">2</span><span>Select Project</span></div>
        <div class="flex-1 h-0.5 bg-slate-200 mx-2"></div>
        <div class="flex items-center gap-1.5 text-muted"><span class="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">3</span><span>Code &amp; Build</span></div>
      </div>

      <div class="wevlo-card p-5 space-y-3 text-xs">
        <span class="text-[10px] font-bold bg-purple-600 text-white px-2.5 py-0.5 rounded-full">Step 1 of 3</span>
        <h3 class="font-extrabold text-base">Connect Your GitHub Account</h3>
        ${state.githubToken ? `<div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex justify-between items-center text-slate-900"><span class="font-bold">✓ ${state.githubUser?.login} (Connected)</span><button onclick="confirmLogout()" class="bg-white border px-3 py-1 rounded-full font-bold">Disconnect</button></div>` : `<button onclick="loginWithGithub()" class="btn-purple px-5 py-2.5 rounded-full font-bold">Connect GitHub Account</button>`}
      </div>

      <div class="wevlo-card p-5 space-y-3.5 text-xs relative">
        <span class="text-[10px] font-bold bg-purple-600 text-white px-2.5 py-0.5 rounded-full">Step 2 of 3</span>
        <h3 class="font-extrabold text-base">Select or Create a Project</h3>
        <select id="ghRepoSelect" onchange="state.selectedGhRepo=this.value" class="w-full border border-soft rounded-xl px-3 py-2.5 font-semibold bg-transparent">
          <option value="">-- Select a GitHub Repository --</option>
          ${repos.map((r) => `<option value="${r.full_name}" ${state.selectedGhRepo === r.full_name ? "selected" : ""}>${r.full_name}</option>`).join("")}
        </select>

        <div class="flex flex-wrap gap-2 relative">
          <button onclick="loadGithubRepos().then(()=>render())" class="border border-soft px-3.5 py-2 rounded-full font-bold">↻ Refresh</button>
          <button onclick="state.ghNewProjModalOpen=true; render()" class="btn-purple px-4 py-2 rounded-full font-bold">+ New</button>
          <button onclick="state.ghImportMenuOpen=!state.ghImportMenuOpen; render()" class="border border-soft px-3.5 py-2 rounded-full font-bold">↑ Import</button>
          <button onclick="state.ghKeystoreModalOpen=true; render()" class="text-purple-700 font-bold px-2 py-2">🔒 Create signing keystore</button>

          <!-- Import Dropdown Menu (Screenshot 3) -->
          ${state.ghImportMenuOpen ? `<div class="absolute left-0 top-12 z-40 w-64 surface-card rounded-2xl shadow-2xl p-2 space-y-1">
            <label class="flex items-center gap-3 p-3 rounded-xl hover:bg-purple-500/10 cursor-pointer"><i data-lucide="file-plus" class="w-5 h-5 text-purple-600"></i><div><p class="font-bold">Files</p><p class="text-[11px] text-muted">Pick one or more files</p></div><input type="file" multiple class="hidden" onchange="handleImportFiles(event)" /></label>
            <label class="flex items-center gap-3 p-3 rounded-xl hover:bg-purple-500/10 cursor-pointer"><i data-lucide="archive" class="w-5 h-5 text-purple-600"></i><div><p class="font-bold">ZIP file</p><p class="text-[11px] text-muted">Becomes a new project</p></div><input type="file" accept=".zip" class="hidden" onchange="handleImportZip(event)" /></label>
            <label class="flex items-center gap-3 p-3 rounded-xl hover:bg-purple-500/10 cursor-pointer"><i data-lucide="folder-plus" class="w-5 h-5 text-purple-600"></i><div><p class="font-bold">Folder</p><p class="text-[11px] text-muted">Whole project, as a new repo</p></div><input type="file" webkitdirectory multiple class="hidden" onchange="handleImportFiles(event)" /></label>
          </div>` : ""}
        </div>

        <input value="${state.repoFilter || ""}" oninput="state.repoFilter=this.value; render()" placeholder="Filter repositories..." class="w-full border border-soft rounded-xl px-3 py-2.5 bg-transparent" />
        <input value="${state.ghBranch || "main"}" oninput="state.ghBranch=this.value" placeholder="Branch" class="w-full border border-soft rounded-xl px-3 py-2.5 bg-transparent" />
        <button onclick="openGhVsCodeIde()" class="w-full btn-purple py-3.5 rounded-2xl text-sm font-bold">&lt;/&gt; Open in Editor →</button>
      </div>

      <!-- New Project Modal (Screenshot 4) -->
      ${state.ghNewProjModalOpen ? `<div class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
        <div class="surface-card w-full max-w-md rounded-[28px] p-6 space-y-4 shadow-2xl animate-slide-up text-xs">
          <div class="flex justify-between items-center"><h3 class="text-lg font-extrabold flex items-center gap-2"><i data-lucide="github" class="w-5 h-5 text-purple-600"></i> New project</h3><button onclick="state.ghNewProjModalOpen=false; render()" class="p-1.5 rounded-full hover:bg-purple-500/10"><i data-lucide="x" class="w-4 h-4"></i></button></div>
          <div><label class="font-bold text-muted">Repository name</label><input id="ghModalRepoName" placeholder="my-android-app" class="w-full mt-1 border border-soft rounded-2xl px-4 py-3 text-sm bg-transparent" /></div>
          <div class="flex gap-2">
            <button onclick="state.newRepoPriv='private'; render()" class="flex-1 p-3 rounded-2xl border font-bold ${state.newRepoPriv === "private" ? "border-purple-600 bg-purple-50 text-purple-800" : "border-soft"}">● Private <span class="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full ml-1">Recommended</span></button>
            <button onclick="state.newRepoPriv='public'; render()" class="px-5 p-3 rounded-2xl border font-bold ${state.newRepoPriv === "public" ? "border-purple-600 bg-purple-50 text-purple-800" : "border-soft"}">○ Public</button>
          </div>
          <label class="flex items-start gap-2.5 p-3 rounded-2xl border border-soft cursor-pointer"><input type="checkbox" ${state.newRepoStarter ? "checked" : ""} onchange="state.newRepoStarter=this.checked" class="mt-0.5 accent-purple-600" /><div><b>Add a starter Android project</b><p class="text-[11px] text-muted">A minimal Gradle app, ready to build.</p></div></label>
          <div class="flex justify-end gap-2"><button onclick="state.ghNewProjModalOpen=false; render()" class="px-5 py-2.5 rounded-full border border-soft font-bold">Cancel</button><button onclick="confirmCreateGhNewProject()" class="btn-purple px-5 py-2.5 rounded-full font-bold">+ Create &amp; open</button></div>
        </div>
      </div>` : ""}

      <!-- Create Signing Keystore Modal (Screenshot 5) -->
      ${state.ghKeystoreModalOpen ? `<div class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
        <div class="surface-card w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[28px] p-6 space-y-3 shadow-2xl animate-slide-up text-xs">
          <div class="flex justify-between items-center"><h3 class="text-lg font-extrabold flex items-center gap-2"><i data-lucide="lock" class="w-5 h-5 text-purple-600"></i> Create signing keystore</h3><button onclick="state.ghKeystoreModalOpen=false; render()" class="p-1.5 rounded-full hover:bg-purple-500/10"><i data-lucide="x" class="w-4 h-4"></i></button></div>
          <p class="text-muted leading-relaxed">A keystore signs your release APK / AAB. It is created in your browser; the private key never leaves your device.</p>
          <div><label class="font-bold">Name or app</label><input id="ksName" placeholder="My Android App" class="w-full mt-1 border border-soft rounded-xl px-3.5 py-2.5 bg-transparent" /></div>
          <div><label class="font-bold">Organization (optional)</label><input id="ksOrg" class="w-full mt-1 border border-soft rounded-xl px-3.5 py-2.5 bg-transparent" /></div>
          <div class="grid grid-cols-2 gap-2.5">
            <div><label class="font-bold">Country code</label><input id="ksCountry" value="BD" class="w-full mt-1 border border-soft rounded-xl px-3.5 py-2.5 bg-transparent" /></div>
            <div><label class="font-bold">Valid for (years)</label><input id="ksYears" value="25" class="w-full mt-1 border border-soft rounded-xl px-3.5 py-2.5 bg-transparent" /></div>
          </div>
          <div><label class="font-bold">Key alias</label><input id="ksAlias" value="key0" class="w-full mt-1 border border-soft rounded-xl px-3.5 py-2.5 bg-transparent" /></div>
          <div><label class="font-bold">Password</label><div class="flex gap-1.5 mt-1"><input id="ksPassInput" type="password" placeholder="Min 6 chars" class="flex-1 border border-soft rounded-xl px-3.5 py-2.5 bg-transparent" /><button type="button" onclick="const i=document.getElementById('ksPassInput'); i.type=i.type==='password'?'text':'password'" class="px-3 border border-soft rounded-xl">👁</button><button type="button" onclick="generateRandomKeyPass()" class="px-3 border border-soft rounded-xl">↻</button></div></div>
          <div class="flex justify-end gap-2 pt-2"><button onclick="state.ghKeystoreModalOpen=false; render()" class="px-5 py-2.5 rounded-full border border-soft font-bold">Cancel</button><button onclick="confirmCreateKeystore()" class="btn-purple px-5 py-2.5 rounded-full font-bold">🛡 Create keystore</button></div>
        </div>
      </div>` : ""}
    </div>`;
        }
