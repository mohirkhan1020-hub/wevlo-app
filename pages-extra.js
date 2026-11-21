export function renderExtraPages(ctx) {
  const { state, saveProjects, navigate, showToast, render, openConfirmModal } = ctx;

  const docGuides = [
    { cat: "Getting started", route: "#/settings", title: "Connect Google & GitHub", desc: "Sign in or connect your GitHub account to build APKs.", body: "Open Settings or the top-right profile menu and connect your GitHub account (OAuth or Personal Access Token)." },
    { cat: "Getting started", route: "#/", title: "Dashboard", desc: "Your studio home: projects, languages, and shortcuts.", body: "Create web projects, open the multi-language GitHub IDE, or launch Website-to-App." },
    { cat: "Getting started", route: "#/projects", title: "My Projects", desc: "Create, search, and manage local web projects.", body: "Edit HTML/CSS/JS projects, preview across screen sizes, or package into an Android APK." },
    { cat: "Build apps", route: "#/web2app", title: "Website to App", desc: "Turn any https website into an Android APK.", body: "Enter your https:// URL, App Name, and Package Name, then click Convert to Android App." },
    { cat: "Build apps", route: "#/editor", title: "Web Code Editor", desc: "Write HTML, CSS, and JavaScript with CodeMirror.", body: "Full-screen mobile-friendly code editor with tabs, undo/redo, copy/paste toolbar, and instant live preview." },
    { cat: "Tools", route: "#/preview", title: "Device Preview", desc: "Test your web project on phone, tablet, and desktop sizes.", body: "Switch between Phone, Tablet, and Desktop viewports." },
    { cat: "Build apps", route: "#/build", title: "Build APK", desc: "Package a local web project into an installable Android APK.", body: "Configure WebView permissions and build your project via GitHub Actions." },
    { cat: "GitHub Build", route: "#/github-build", title: "GitHub Build (Multi-Language IDE)", desc: "Build Java, Kotlin, Flutter, Capacitor JS & Python apps.", body: "Click any repository to open it, upload files directly, edit with CodeMirror or Visual XML Designer, and compile APK/AAB." },
    { cat: "Tools", route: "#/icons", title: "Icon Library", desc: "Free outline icons for your projects.", body: "Search Lucide icons and copy HTML tags with one click." },
    { cat: "Tools", route: "#/secure-converter", title: "Secure Converter", desc: "Encode HTML source code before bundling.", body: "Convert HTML into Base64 loader or hex entities." }
  ];

  const faqs = [
    ["What is the difference between APK and AAB?", "APK installs directly on Android phones. AAB is required by Google Play Store."],
    ["How do I upload files to a GitHub repo?", "Open GitHub IDE, go to the Files tab, and tap Upload (or tap the menu icon on any folder to upload inside that folder)."],
    ["My build failed. What should I check?", "Open the Output tab and check Build Output or Problems for the exact error line and Auto-Fix options."],
    ["Are my GitHub tokens safe?", "Yes, tokens are kept only in your browser session storage."]
  ];

  const glossary = [
    ["APK", "Installable Android app package."],
    ["AAB", "Android App Bundle for Google Play."],
    ["Gradle", "Android build automation system."],
    ["WebView", "Embedded browser container for web-to-app builds."]
  ];

  function encodeUtf8Base64(str) {
    let bin = "";
    new TextEncoder().encode(str || "").forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin);
  }

  window.openGuideDetail = (idx) => {
    const g = docGuides[idx];
    if (!g) return;
    document.getElementById("guideCatBadge").textContent = g.cat;
    document.getElementById("guideTitle").textContent = g.title;
    document.getElementById("guideBody").textContent = g.body;
    document.getElementById("guideActionBtn").onclick = () => {
      const m = document.getElementById("guideModal");
      m.classList.add("hidden");
      m.classList.remove("flex");
      navigate(g.route);
    };
    const m = document.getElementById("guideModal");
    m.classList.remove("hidden");
    m.classList.add("flex");
  };

  window.runSecureConvert = () => {
    const raw = document.getElementById("secInput").value;
    const mode = document.getElementById("secMode").value;
    if (!raw.trim()) return showToast("Please paste HTML code first!", "error");
    const out =
      mode === "base64"
        ? `<!-- Protected by Wevlo -->\n<script>document.write(new TextDecoder().decode(Uint8Array.from(atob("${encodeUtf8Base64(raw)}"), c => c.charCodeAt(0))));<\/script>`
        : `<div>${Array.from(raw).map((c) => "&#x" + c.charCodeAt(0).toString(16) + ";").join("")}</div>`;
    state.secOutput = out;
    document.getElementById("secOutput").value = out;
    showToast("Converted!", "success");
  };

  window.applySecuredToProject = () => {
    const out = document.getElementById("secOutput").value;
    const proj = state.projects.find((p) => p.id === state.activeProjectId) || state.projects[0];
    if (!proj || !out) return showToast("No active project or output found!", "error");
    proj.html = out;
    if (Array.isArray(proj.files)) {
      const htmlF = proj.files.find((f) => f.name.endsWith(".html"));
      if (htmlF) htmlF.content = out;
    }
    saveProjects();
    showToast(`Applied to "${proj.name}"!`, "success");
  };

  window.cloneLabProject = (idx) => {
    const items = [
      { name: "Neon Task Tracker", html: `<h2>My Tasks</h2><input id="t"/><button onclick="add()">Add</button><ul id="l"></ul>`, css: `body{font-family:sans-serif;background:#0f172a;color:#fff;padding:24px}`, js: `function add(){if(t.value){l.innerHTML+='<li>'+t.value+'</li>';t.value=''}}` },
      { name: "Flashlight UI", html: `<button onclick="this.classList.toggle('on')">POWER</button>`, css: `body{display:grid;place-items:center;height:100vh}button{padding:18px 28px;border-radius:99px;background:#6d28d9;color:#fff;border:none}`, js: `` },
      { name: "Business Bio Card", html: `<div class="card"><h1>Studio Digital</h1><p>Web &amp; Mobile Apps</p></div>`, css: `body{background:#ece8ff;font-family:sans-serif;padding:30px}.card{background:#fff;padding:24px;border-radius:20px;text-align:center}`, js: `` }
    ];
    const it = items[idx];
    state.projects.unshift({
      id: "proj_" + Date.now(),
      name: it.name,
      type: "html",
      html: it.html,
      css: it.css,
      js: it.js,
      updatedAt: new Date().toLocaleDateString()
    });
    state.activeProjectId = state.projects[0].id;
    saveProjects();
    navigate("#/editor");
  };

  window.uploadFileManagerItem = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 1024 * 1024) return showToast("Please choose a file smaller than 1MB.", "error");
    const r = new FileReader();
    r.onload = () => {
      state.files.unshift({
        id: "f_" + Date.now(),
        name: file.name,
        size: (file.size / 1024).toFixed(1) + " KB",
        type: file.type || "file",
        dataUrl: r.result
      });
      localStorage.setItem("wevlo_files", JSON.stringify(state.files));
      render();
      showToast(`Uploaded ${file.name}!`, "success");
    };
    r.readAsDataURL(file);
  };

  window.deleteFileItem = (id) =>
    openConfirmModal({
      title: "Delete File?",
      message: "Remove this file from local storage?",
      onConfirm: () => {
        state.files = state.files.filter((f) => f.id !== id);
        localStorage.setItem("wevlo_files", JSON.stringify(state.files));
        render();
      }
    });

  window.copyLucideIconSvg = (name) => {
    navigator.clipboard?.writeText(`<i data-lucide="${name}"></i>`);
    showToast(`Copied ${name}!`, "success");
  };

  switch (state.route) {
    case "#/secure-converter":
      return `
        <div class="wevlo-card p-5 space-y-4">
          <div class="flex items-center justify-between">
            <h1 class="text-xl font-extrabold">Secure Converter</h1>
            <select id="secMode" class="border border-soft rounded-xl px-3 py-1.5 text-xs font-bold bg-transparent">
              <option value="base64">Base64 JS Loader</option>
              <option value="entities">HTML Hex Entities</option>
            </select>
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <textarea id="secInput" rows="9" placeholder="<h1>Paste HTML...</h1>" class="w-full bg-slate-950 text-sky-300 font-mono text-xs p-3.5 rounded-2xl focus:outline-none"></textarea>
            <textarea id="secOutput" rows="9" readonly class="w-full bg-slate-950 text-emerald-300 font-mono text-xs p-3.5 rounded-2xl focus:outline-none">${state.secOutput || ""}</textarea>
          </div>
          <div class="flex flex-wrap gap-2">
            <button onclick="runSecureConvert()" class="btn-purple px-5 py-2.5 rounded-full text-xs font-bold">Convert</button>
            <button onclick="applySecuredToProject()" class="border border-soft px-4 py-2.5 rounded-full text-xs font-bold">Apply to Active Project</button>
          </div>
        </div>`;

    case "#/lab":
      return `
        <h1 class="text-xl font-extrabold">Starter Lab</h1>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${["Neon Task Tracker", "Flashlight UI", "Business Bio Card"]
            .map(
              (t, i) => `
            <div class="wevlo-card wevlo-card-hover p-5 space-y-3">
              <h3 class="font-bold text-base">${t}</h3>
              <p class="text-xs text-muted">Clone and edit directly inside the Web Editor.</p>
              <button onclick="cloneLabProject(${i})" class="w-full btn-purple py-2.5 rounded-full text-xs font-bold">Clone Project</button>
            </div>`
            )
            .join("")}
        </div>`;

    case "#/files":
      return `
        <div class="wevlo-card p-5 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="font-extrabold text-lg">Local File Manager</h2>
              <p class="text-xs text-muted">Store small local assets up to 1MB.</p>
            </div>
            <label class="btn-purple px-4 py-2 rounded-full text-xs font-bold cursor-pointer">+ Upload<input type="file" class="hidden" onchange="uploadFileManagerItem(event)"/></label>
          </div>
          ${
            state.files.length === 0
              ? `<p class="text-center text-xs text-muted py-8">No files yet.</p>`
              : state.files
                  .map(
                    (f) => `
                <div class="p-3 rounded-2xl border border-soft flex justify-between items-center text-xs gap-2">
                  <div class="min-w-0">
                    <b class="truncate block">${f.name}</b>
                    <span class="text-muted">${f.size}</span>
                  </div>
                  <div class="flex items-center gap-3 shrink-0">
                    <a href="${f.dataUrl}" download="${f.name}" class="text-violet-600 font-bold">Download</a>
                    <button onclick="deleteFileItem('${f.id}')" class="text-rose-500 font-bold">Delete</button>
                  </div>
                </div>`
                  )
                  .join("")
          }
        </div>`;

    case "#/icons": {
      const icons = ["home", "rocket", "code-2", "smartphone", "globe", "folder", "settings", "shield-check", "lock", "eye", "download", "github", "zap", "heart", "star", "search", "user", "upload", "terminal", "cpu"];
      const q = (state.iconSearch || "").toLowerCase();
      return `
        <div class="wevlo-card p-5 space-y-4">
          <div class="flex flex-wrap justify-between items-center gap-2">
            <h2 class="font-extrabold text-lg">Icon Library</h2>
            <input value="${state.iconSearch || ""}" oninput="state.iconSearch=this.value;render()" placeholder="Search icons..." class="border border-soft rounded-full px-4 py-1.5 text-xs bg-transparent"/>
          </div>
          <div class="grid grid-cols-4 sm:grid-cols-6 gap-3">
            ${icons
              .filter((i) => i.includes(q))
              .map(
                (ic) => `
              <button onclick="copyLucideIconSvg('${ic}')" class="p-3 rounded-2xl border border-soft wevlo-card-hover flex flex-col items-center gap-1.5">
                <i data-lucide="${ic}" class="w-5 h-5 text-violet-600"></i>
                <span class="text-[10px]">${ic}</span>
              </button>`
              )
              .join("")}
          </div>
        </div>`;
    }

    case "#/docs": {
      const q = (state.docSearch || "").toLowerCase();
      const cat = state.docCat || "All";
      const cats = ["All", "Getting started", "Build apps", "GitHub Build", "Tools"];
      const filtered = docGuides
        .map((g, i) => ({ ...g, idx: i }))
        .filter((g) => (cat === "All" || g.cat === cat) && (g.title.toLowerCase().includes(q) || g.desc.toLowerCase().includes(q)));
      return `
        <div class="hero-lavender rounded-[24px] p-5 space-y-3">
          <h1 class="text-xl font-extrabold">Help &amp; Documentation</h1>
          <input value="${state.docSearch || ""}" oninput="state.docSearch=this.value;render()" placeholder="Search guides..." class="w-full bg-white text-slate-900 rounded-full px-4 py-2 text-xs"/>
          <div class="flex flex-wrap gap-1.5">
            ${cats.map((c) => `<button onclick="state.docCat='${c}';render()" class="px-3 py-1 rounded-full text-[11px] font-bold ${cat === c ? "btn-purple" : "bg-white text-slate-700"}">${c}</button>`).join("")}
          </div>
        </div>
        <div class="wevlo-card p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${filtered
            .map(
              (g) => `
            <button onclick="openGuideDetail(${g.idx})" class="text-left p-3.5 rounded-2xl border border-soft wevlo-card-hover">
              <p class="font-bold text-xs">${g.title}</p>
              <p class="text-[11px] text-muted mt-1">${g.desc}</p>
            </button>`
            )
            .join("")}
        </div>
        <div class="wevlo-card p-5 space-y-2">
          ${faqs.map(([qT, a]) => `<details class="p-3 rounded-2xl border border-soft text-xs"><summary class="font-bold cursor-pointer">${qT}</summary><p class="text-muted mt-2">${a}</p></details>`).join("")}
        </div>
        <div class="wevlo-card p-5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          ${glossary.map(([t, d]) => `<div class="p-2.5 rounded-xl border border-soft"><b>${t}:</b> ${d}</div>`).join("")}
        </div>`;
    }

    case "#/privacy":
      return `
        <div class="wevlo-card p-6 space-y-3 text-xs">
          <h1 class="text-xl font-extrabold">Privacy Policy</h1>
          <p class="text-muted">Your local projects stay on your device, and your GitHub projects are stored directly in your own GitHub repositories.</p>
        </div>`;
  }
  return "";
}
