// ======================================================
// File 4/4: app.js (PART 1 of 2)
// ======================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { renderExtraPages } from "./pages-extra.js";
import { renderProCodeEditor, renderProGithubBuild } from "./ide-editors.js";

// ======================================================
// 1. Firebase Auth Config
// ======================================================
const firebaseConfig = {
  apiKey: "AIzaSyBXUklgCWDOujtIuSZvW_VDnEVu6WKFrNA",
  authDomain: "hwllo-cdde8.firebaseapp.com",
  projectId: "hwllo-cdde8",
  storageBucket: "hwllo-cdde8.firebasestorage.app",
  messagingSenderId: "814010361703",
  appId: "1:814010361703:web:7ae39494076f943b2a71c2"
};

let fbApp = null;
let auth = null;
try {
  fbApp = initializeApp(firebaseConfig);
  auth = getAuth(fbApp);
} catch (err) {
  console.warn("Firebase init error:", err.message);
}

// ======================================================
// 2. Global State (Personal Studio + Persistent GitHub Session)
// ======================================================
const savedProfile = JSON.parse(localStorage.getItem("wevlo_profile") || "null");
const savedGhSession = JSON.parse(localStorage.getItem("wevlo_gh_session") || "null");

const state = {
  route: window.location.hash || "#/",
  theme: localStorage.getItem("wevlo_theme") || "light",
  user: null,
  profile: savedProfile || { name: "", pkgPrefix: "com.wevlo" },
  githubToken: sessionStorage.getItem("wevlo_gh_token") || null,
  githubUser: JSON.parse(sessionStorage.getItem("wevlo_gh_user") || "null"),
  githubRepos: [],
  repoFilter: "",
  selectedGhRepo: savedGhSession?.repo || "",
  ghBranch: savedGhSession?.branch || "main",
  ghIdeActivePath: savedGhSession?.activePath || "",
  ghOpenTabs: savedGhSession?.openTabs || [],
  ghManualFw: savedGhSession?.manualFw || null,
  ghIdeOpen: false,
  newRepoLang: "java",
  projects: JSON.parse(localStorage.getItem("wevlo_projects") || "[]"),
  projSearch: "",
  activeProjectId: localStorage.getItem("wevlo_active_project") || null,
  activities: JSON.parse(localStorage.getItem("wevlo_activities") || "[]"),
  files: JSON.parse(localStorage.getItem("wevlo_files") || "[]"),
  previewDevice: "phone",
  modalType: "html",
  buildConfig: {
    appName: "",
    pkgName: "com.wevlo.app",
    versionName: "1.0.0",
    versionCode: 1,
    fullscreen: false,
    jsEnabled: true,
    domStorage: true,
    permCamera: false,
    permLocation: false
  },
  web2app: {
    url: "https://example.com",
    appName: "My Web App",
    pkgName: "com.wevlo.mywebapp",
    versionName: "1.0.0",
    versionCode: 1,
    fullscreen: false,
    pkgEdited: false
  }
};

// ======================================================
// 3. Theme, Modals & Utility Helpers
// ======================================================
function applyTheme() {
  document.documentElement.setAttribute("data-theme", state.theme);
  const lbl = document.getElementById("themeLabel");
  const ic = document.getElementById("themeIcon");
  if (lbl) lbl.textContent = state.theme === "dark" ? "Dark" : "Light";
  if (ic) ic.setAttribute("data-lucide", state.theme === "dark" ? "moon" : "sun");
}
applyTheme();

window.toggleTheme = () => {
  state.theme = state.theme === "light" ? "dark" : "light";
  localStorage.setItem("wevlo_theme", state.theme);
  applyTheme();
  if (window.lucide) window.lucide.createIcons();
};

function saveProjects() {
  localStorage.setItem("wevlo_projects", JSON.stringify(state.projects));
  if (state.activeProjectId) localStorage.setItem("wevlo_active_project", state.activeProjectId);
  else localStorage.removeItem("wevlo_active_project");
}

function addActivity(text) {
  state.activities.unshift({ text, time: new Date().toLocaleTimeString() });
  state.activities = state.activities.slice(0, 8);
  localStorage.setItem("wevlo_activities", JSON.stringify(state.activities));
}

function getActiveProject() {
  return state.projects.find((p) => p.id === state.activeProjectId) || state.projects[0] || null;
}

function slugifyPkgPart(raw, fallback = "myapp") {
  const s = (raw || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return (s ? s.replace(/^[0-9]+/, "") : "") || fallback;
}

function sanitizePkgId(raw, fallback = "com.wevlo.myapp") {
  const clean = (raw || "")
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "")
    .replace(/\.+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  const parts = clean
    .split(".")
    .map((p) => p.replace(/^[^a-z]+/, ""))
    .filter(Boolean);
  return parts.length >= 2 ? parts.join(".") : fallback;
}

function escapeXml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeHtmlAttr(str) {
  return escapeXml(str).replace(/'/g, "&#39;");
}

let confirmCallback = null;
function openConfirmModal({ title, message, onConfirm }) {
  document.getElementById("confirmTitle").textContent = title;
  document.getElementById("confirmMsg").textContent = message;
  confirmCallback = onConfirm;
  const m = document.getElementById("confirmModal");
  m.classList.remove("hidden");
  m.classList.add("flex");
}

window.closeConfirmModal = () => {
  const m = document.getElementById("confirmModal");
  m.classList.add("hidden");
  m.classList.remove("flex");
};

document.getElementById("confirmOkBtn").addEventListener("click", () => {
  if (confirmCallback) confirmCallback();
  window.closeConfirmModal();
});

let toastTimer = null;
window.showToast = (msg, type = "info") => {
  const t = document.getElementById("toast");
  t.textContent = msg;
  const bg = type === "error" ? "bg-rose-600" : type === "success" ? "bg-emerald-600" : "bg-slate-900";
  t.className = `fixed top-20 left-1/2 -translate-x-1/2 z-[60] text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg max-w-[90vw] text-center ${bg}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add("hidden"), 3800);
};

window.resumeGithubIde = async () => {
  if (!state.selectedGhRepo) return window.navigate("#/github-build");
  state.ghIdeOpen = true;
  window.navigate("#/github-build");
  if (!state.ghTreeFiles?.length && window.openGhVsCodeIde) {
    await window.openGhVsCodeIde(state.selectedGhRepo, state.ghBranch || "main");
  }
};

// ======================================================
// 4. Auth + Popup-Free Email & GitHub Token Connect
// ======================================================
function injectPopupFreeAuthUI() {
  const menuBox = document.querySelector("#accountMenu .space-y-2");
  if (menuBox && !document.getElementById("btnEmailLoginMenu")) {
    const emailBtn = document.createElement("button");
    emailBtn.id = "btnEmailLoginMenu";
    emailBtn.className = "w-full flex items-center justify-center gap-2 border border-violet-400/50 bg-violet-500/10 text-violet-700 font-bold text-xs py-2.5 rounded-xl transition";
    emailBtn.textContent = "Email / Password (No Popup)";
    emailBtn.onclick = () => {
      document.getElementById("accountMenu")?.classList.add("hidden");
      window.openEmailAuthModal();
    };
    const ghPatBtn = document.createElement("button");
    ghPatBtn.id = "btnGhTokenMenu";
    ghPatBtn.className = "w-full flex items-center justify-center gap-2 border border-soft hover:bg-violet-500/5 font-semibold text-xs py-2 rounded-xl transition";
    ghPatBtn.textContent = "GitHub via Token (No Popup)";
    ghPatBtn.onclick = () => {
      document.getElementById("accountMenu")?.classList.add("hidden");
      window.openGhTokenModal();
    };
    menuBox.insertBefore(ghPatBtn, menuBox.children[2] || null);
    menuBox.insertBefore(emailBtn, ghPatBtn);
  }

  if (!document.getElementById("popupFreeAuthModal")) {
    const modal = document.createElement("div");
    modal.id = "popupFreeAuthModal";
    modal.className = "fixed inset-0 z-[65] hidden items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4";
    modal.innerHTML = `
      <div class="surface-card w-full max-w-sm rounded-[26px] p-6 space-y-4 shadow-2xl animate-slide-up text-xs">
        <div class="flex justify-between items-center">
          <h3 id="pfAuthTitle" class="text-base font-extrabold">Email / Password Login</h3>
          <button onclick="document.getElementById('popupFreeAuthModal').classList.add('hidden'); document.getElementById('popupFreeAuthModal').classList.remove('flex')" class="p-1.5 rounded-full hover:bg-violet-500/10">✕</button>
        </div>
        <div id="pfEmailBox" class="space-y-3">
          <input id="pfEmailInp" type="email" placeholder="your@email.com" class="w-full border border-soft rounded-xl px-3.5 py-2.5 text-sm bg-transparent" />
          <input id="pfPassInp" type="password" placeholder="Password (min 6 chars)" class="w-full border border-soft rounded-xl px-3.5 py-2.5 text-sm bg-transparent" />
          <div class="grid grid-cols-2 gap-2">
            <button onclick="submitEmailAuth('login')" class="btn-purple py-2.5 rounded-full font-bold">Sign In</button>
            <button onclick="submitEmailAuth('signup')" class="border border-violet-500 text-violet-700 py-2.5 rounded-full font-bold">Create Account</button>
          </div>
        </div>
        <div id="pfTokenBox" class="hidden space-y-3">
          <p class="text-muted">Create a Personal Access Token (classic) in GitHub Settings → Developer settings with <b>repo</b> and <b>workflow</b> permissions:</p>
          <input id="pfGhPatInp" type="password" placeholder="ghp_xxxxxxxxxxxx" class="w-full border border-soft rounded-xl px-3.5 py-2.5 text-sm bg-transparent font-mono" />
          <button onclick="submitGhTokenConnect()" class="w-full btn-purple py-2.5 rounded-full font-bold">Connect GitHub</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }
}

window.openEmailAuthModal = () => {
  injectPopupFreeAuthUI();
  document.getElementById("pfAuthTitle").textContent = "Email / Password Login";
  document.getElementById("pfEmailBox").classList.remove("hidden");
  document.getElementById("pfTokenBox").classList.add("hidden");
  const m = document.getElementById("popupFreeAuthModal");
  m.classList.remove("hidden");
  m.classList.add("flex");
};

window.openGhTokenModal = () => {
  injectPopupFreeAuthUI();
  document.getElementById("pfAuthTitle").textContent = "Connect GitHub via Token";
  document.getElementById("pfEmailBox").classList.add("hidden");
  document.getElementById("pfTokenBox").classList.remove("hidden");
  const m = document.getElementById("popupFreeAuthModal");
  m.classList.remove("hidden");
  m.classList.add("flex");
};

window.submitEmailAuth = async (mode) => {
  const email = document.getElementById("pfEmailInp")?.value.trim();
  const pass = document.getElementById("pfPassInp")?.value;
  if (!email || !pass || pass.length < 6) {
    return window.showToast("Enter a valid email and at least 6 characters password!", "error");
  }
  try {
    if (mode === "signup") await createUserWithEmailAndPassword(auth, email, pass);
    else await signInWithEmailAndPassword(auth, email, pass);
    const m = document.getElementById("popupFreeAuthModal");
    m.classList.add("hidden");
    m.classList.remove("flex");
    window.showToast("Signed in!", "success");
  } catch (e) {
    window.showToast(e.message, "error");
  }
};

window.submitGhTokenConnect = async () => {
  const tok = document.getElementById("pfGhPatInp")?.value.trim();
  if (!tok) return window.showToast("Please paste your GitHub Token!", "error");
  try {
    state.githubToken = tok;
    const u = await ghFetch("/user");
    state.githubUser = u;
    sessionStorage.setItem("wevlo_gh_token", tok);
    sessionStorage.setItem("wevlo_gh_user", JSON.stringify(u));
    await window.loadGithubRepos();
    const m = document.getElementById("popupFreeAuthModal");
    m.classList.add("hidden");
    m.classList.remove("flex");
    updateAccountUI();
    window.render();
    window.showToast(`GitHub Connected: @${u.login}`, "success");
  } catch (e) {
    state.githubToken = null;
    window.showToast("Invalid or expired token! " + e.message, "error");
  }
};

if (auth) {
  onAuthStateChanged(auth, (u) => {
    state.user = u;
    updateAccountUI();
    window.render();
  });
}

function updateAccountUI() {
  injectPopupFreeAuthUI();
  const av = document.getElementById("userAvatar");
  const accName = document.getElementById("accName");
  const accEmail = document.getElementById("accEmail");
  const btnLogout = document.getElementById("btnLogoutMenu");
  if (!av || !accName || !accEmail || !btnLogout) return;
  if (state.user) {
    const label = state.user.displayName || state.profile.name || state.user.email || "User";
    av.textContent = label[0].toUpperCase();
    accName.textContent = label;
    accEmail.textContent = state.user.email || "Signed in";
    btnLogout.classList.remove("hidden");
  } else if (state.githubUser) {
    av.textContent = state.githubUser.login[0].toUpperCase();
    accName.textContent = state.githubUser.login;
    accEmail.textContent = "GitHub Connected";
    btnLogout.classList.remove("hidden");
  } else {
    av.textContent = "W";
    accName.textContent = "Personal Studio";
    accEmail.textContent = "Connect GitHub or Google";
    btnLogout.classList.add("hidden");
  }
  const ghLbl = document.getElementById("ghMenuLabel");
  if (ghLbl) ghLbl.textContent = state.githubToken ? `GitHub: @${state.githubUser?.login || "Connected"}` : "Connect GitHub Account";
}
updateAccountUI();

let authPopupBusy = false;
window.loginWithGoogle = async () => {
  if (authPopupBusy) return;
  authPopupBusy = true;
  const p = new GoogleAuthProvider();
  p.setCustomParameters({ prompt: "select_account" });
  try {
    await signInWithPopup(auth, p);
    window.showToast("Google signed in!", "success");
    document.getElementById("accountMenu").classList.add("hidden");
  } catch (e) {
    if (e.code === "auth/popup-closed-by-user" || e.code === "auth/popup-blocked") {
      window.showToast("Popup blocked! Use Email/Password login.", "error");
      window.openEmailAuthModal();
    } else {
      window.showToast(e.message, "error");
    }
  } finally {
    authPopupBusy = false;
  }
};

window.loginWithGithub = async () => {
  if (authPopupBusy) return;
  authPopupBusy = true;
  const p = new GithubAuthProvider();
  p.addScope("repo");
  p.addScope("workflow");
  try {
    const res = await signInWithPopup(auth, p);
    const cred = GithubAuthProvider.credentialFromResult(res);
    if (cred?.accessToken) {
      state.githubToken = cred.accessToken;
      sessionStorage.setItem("wevlo_gh_token", cred.accessToken);
      state.githubUser = await ghFetch("/user");
      sessionStorage.setItem("wevlo_gh_user", JSON.stringify(state.githubUser));
      await window.loadGithubRepos();
      updateAccountUI();
      window.render();
      window.showToast("GitHub connected!", "success");
    }
    document.getElementById("accountMenu").classList.add("hidden");
  } catch (e) {
    if (e.code === "auth/popup-closed-by-user" || e.code === "auth/popup-blocked") {
      window.showToast("GitHub popup blocked! Connect using a Token.", "error");
      window.openGhTokenModal();
    } else {
      window.showToast(e.message, "error");
    }
  } finally {
    authPopupBusy = false;
  }
};

window.confirmLogout = () =>
  openConfirmModal({
    title: "Disconnect Accounts?",
    message: "Sign out and clear cached GitHub & Google session?",
    onConfirm: async () => {
      try {
        if (auth) await signOut(auth);
      } catch {}
      state.user = null;
      state.githubToken = null;
      state.githubUser = null;
      state.githubRepos = [];
      state.ghIdeOpen = false;
      state.selectedGhRepo = "";
      state._loadedIdeRepo = "";
      state.ghDrafts = {};
      state.ghDirtyMap = {};
      sessionStorage.clear();
      localStorage.removeItem("wevlo_gh_session");
      document.getElementById("accountMenu").classList.add("hidden");
      updateAccountUI();
      window.render();
      window.showToast("Disconnected!", "info");
    }
  });

// ======================================================
// 5. Sidebar & Navigation
// ======================================================
const sidebarMenu = [
  { route: "#/", label: "Dashboard", icon: "home" },
  { route: "#/github-build", label: "GitHub IDE", icon: "github" },
  { route: "#/projects", label: "My Projects", icon: "folder" },
  { route: "#/editor", label: "Web Editor", icon: "code-2" },
  { route: "#/web2app", label: "Website to App", icon: "globe" },
  { route: "#/build", label: "Build APK", icon: "smartphone" },
  { route: "#/preview", label: "Device Preview", icon: "eye" },
  { route: "#/templates", label: "Templates", icon: "layout-grid" },
  { route: "#/lab", label: "Starter Lab", icon: "flask-conical" },
  { route: "#/files", label: "File Manager", icon: "folder-open" },
  { route: "#/icons", label: "Icon Library", icon: "shapes" },
  { route: "#/secure-converter", label: "Secure Converter", icon: "shield-check" },
  { route: "#/docs", label: "Documentation", icon: "book-open" },
  { route: "#/settings", label: "Settings", icon: "settings" }
];
const pageTitles = Object.fromEntries(sidebarMenu.map((i) => [i.route, i.label]));

window.navigate = (r) => {
  state.route = r;
  if (window.location.hash !== r) window.location.hash = r;
  window.toggleDrawer(false);
  window.render();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

window.addEventListener("hashchange", () => {
  const next = window.location.hash || "#/";
  if (state.route !== next) {
    state.route = next;
    window.render();
  }
});

window.toggleDrawer = (open) => {
  document.getElementById("sidebar").classList.toggle("-translate-x-full", !open);
  document.getElementById("drawerOverlay").classList.toggle("hidden", !open);
};

window.toggleAccountMenu = () => document.getElementById("accountMenu").classList.toggle("hidden");

function renderHeaderAndNav() {
  const resumeBtn =
    state.githubToken && state.selectedGhRepo
      ? `<button onclick="resumeGithubIde(); toggleDrawer(false)" class="w-full flex items-center justify-between px-3 py-2 rounded-xl mb-2 bg-violet-600/15 text-violet-700 font-bold text-xs"><span class="truncate">⚡ Resume: ${escapeHtmlAttr(state.selectedGhRepo.split("/")[1])}</span><span>→</span></button>`
      : "";

  document.getElementById("sidebarNav").innerHTML =
    resumeBtn +
    sidebarMenu
      .map((item) => {
        const active = state.route === item.route;
        return `<button onclick="navigate('${item.route}')" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${active ? "bg-violet-500/15 text-violet-700 font-bold" : "text-muted hover:bg-violet-500/5"}"><i data-lucide="${item.icon}" class="w-4 h-4"></i><span>${item.label}</span></button>`;
      })
      .join("");

  document.querySelectorAll(".bnav-item").forEach((b) => b.classList.toggle("active", b.dataset.bnav === state.route));
  const subpages = ["#/build", "#/github-build", "#/lab", "#/files", "#/icons", "#/secure-converter", "#/docs", "#/privacy"];
  const hl = document.getElementById("headerLeft");
  const curTitle = pageTitles[state.route] || "Wevlo Studio";
  hl.innerHTML = subpages.includes(state.route)
    ? `<button onclick="navigate('#/')" class="w-9 h-9 rounded-full surface-card flex items-center justify-center"><i data-lucide="arrow-left" class="w-4 h-4"></i></button><span class="font-extrabold text-lg">${curTitle}</span>`
    : `<button onclick="toggleDrawer(true)" class="lg:hidden p-2 -ml-2 rounded-xl"><i data-lucide="menu" class="w-5 h-5"></i></button><a href="#/" onclick="navigate('#/'); return false;" class="flex items-center gap-1.5 lg:hidden"><span class="w-7 h-7 rounded-lg icon-box-purple flex items-center justify-center"><svg width="16" height="12" viewBox="0 0 36 28" fill="none"><path d="M3 5L10.5 22L18 9L25.5 22L33 5" stroke="#fff" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="text-lg font-extrabold">Wevlo</span></a><span class="hidden lg:inline-block font-bold text-base">${curTitle}</span>`;
}

window.openNewProjectModal = (type = "html") => {
  window.selectModalType(type);
  document.getElementById("modalProjName").value = "";
  const m = document.getElementById("newProjectModal");
  m.classList.remove("hidden");
  m.classList.add("flex");
};

window.closeNewProjectModal = () => {
  const m = document.getElementById("newProjectModal");
  m.classList.add("hidden");
  m.classList.remove("flex");
};

window.selectModalType = (t) => {
  state.modalType = t;
  document.querySelectorAll(".ptype-card").forEach((c) => c.classList.toggle("active", c.dataset.ptype === t));
};

window.confirmCreateProject = () => {
  const name = document.getElementById("modalProjName").value.trim() || `Project ${state.projects.length + 1}`;
  const slug = slugifyPkgPart(name, "app" + (state.projects.length + 1));
  const prefix = sanitizePkgId(state.profile?.pkgPrefix || "com.wevlo", "com.wevlo");
  state.projects.unshift({
    id: "proj_" + Date.now(),
    name,
    type: state.modalType,
    url: "https://example.com",
    pkgName: `${prefix}.${slug}`,
    versionName: "1.0.0",
    versionCode: 1,
    html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${name}</title></head><body><div class="card"><h1>${name}</h1><p>Built with Wevlo</p><button onclick="go()">Get Started</button></div></body></html>`,
    css: `body{font-family:sans-serif;background:#f6f6fb;display:grid;place-items:center;min-height:100vh;margin:0}.card{background:#fff;padding:28px;border-radius:20px;text-align:center}button{background:#6d28d9;color:#fff;border:none;padding:10px 22px;border-radius:99px;font-weight:bold}`,
    js: `function go(){alert("Hello from ${name}!")}`,
    updatedAt: new Date().toLocaleDateString()
  });
  state.activeProjectId = state.projects[0].id;
  saveProjects();
  addActivity(`Created "${name}"`);
  window.closeNewProjectModal();
  window.navigate(state.modalType === "webview" ? "#/web2app" : "#/editor");
};

// ======================================================
// 6. GitHub REST API (No-Cache) & Web2App / HTML APK Pipeline
// ======================================================
function toBase64(str) {
  let bin = "";
  new TextEncoder().encode(str || "").forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

async function ghFetch(path, options = {}) {
  const res = await fetch("https://api.github.com" + path, {
    cache: "no-store",
    ...options,
    headers: {
      Authorization: "Bearer " + state.githubToken,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `GitHub Error (${res.status})`);
  return data;
}

window.loadGithubRepos = async () => {
  if (!state.githubToken) return;
  try {
    state.githubRepos = await ghFetch("/user/repos?sort=updated&per_page=100");
  } catch {}
};

window.downloadPipelineApk = async (apiUrl, fileName, browserUrl) => {
  try {
    window.showToast("Downloading " + fileName + "...", "info");
    const res = await fetch(apiUrl, { headers: { Authorization: "Bearer " + state.githubToken, Accept: "application/octet-stream" } });
    if (!res.ok) throw new Error();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(await res.blob());
    a.download = fileName;
    a.click();
  } catch {
    window.open(browserUrl, "_blank");
  }
};

async function ghPutPipelineFile(repoFull, path, content, branch) {
  let sha;
  try {
    sha = (await ghFetch(`/repos/${repoFull}/contents/${path}?ref=${encodeURIComponent(branch)}`)).sha;
  } catch {}
  return ghFetch(`/repos/${repoFull}/contents/${path}`, {
    method: "PUT",
    body: JSON.stringify({
      message: `Update ${path}`,
      content: toBase64(content),
      branch,
      ...(sha ? { sha } : {})
    })
  });
}

async function runGithubApkPipeline({ repoName, appName, pkgName, versionName = "1.0.0", versionCode = 1, fullscreen = false, javaSource, logElId }) {
  const logEl = document.getElementById(logElId);
  logEl.classList.remove("hidden");
  logEl.innerHTML = `<div class="flex items-center gap-2 font-bold mb-2"><span class="spinner"></span><span>Building APK on GitHub Actions...</span></div><div id="${logElId}_l" class="space-y-1"></div>`;
  const logs = document.getElementById(`${logElId}_l`);
  if (!state.githubToken) return (logs.innerHTML = `<span class="text-rose-600 font-bold">Please connect GitHub first!</span>`);

  const cleanPkg = sanitizePkgId(pkgName, "");
  if (!cleanPkg) {
    return (logs.innerHTML = `<span class="text-rose-600 font-bold">Invalid Package Name! Example: com.mycompany.myapp</span>`);
  }
  const safeVerName = (versionName || "1.0.0").trim().replace(/[^a-zA-Z0-9._-]/g, "") || "1.0.0";
  const safeVerCode = Math.max(1, parseInt(versionCode, 10) || 1);
  const safeRepo = (repoName || "wevlo-app").trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "-").replace(/^-+|-+$/g, "") || "wevlo-app";
  const themeAttr = fullscreen
    ? "@android:style/Theme.DeviceDefault.Light.NoActionBar.Fullscreen"
    : "@android:style/Theme.DeviceDefault.Light.NoActionBar";

  try {
    const owner = state.githubUser?.login || (await ghFetch("/user")).login;
    const repoFull = `${owner}/${safeRepo}`;
    let branch = "main";
    let repoExists = false;

    try {
      const existing = await ghFetch(`/repos/${repoFull}`);
      branch = existing.default_branch || "main";
      repoExists = true;
      logs.innerHTML += `<div>• Updating existing repository <b>${repoFull}</b>...</div>`;
    } catch {
      const r = await ghFetch("/user/repos", { method: "POST", body: JSON.stringify({ name: safeRepo, private: true, auto_init: true }) });
      branch = r.default_branch || "main";
      await new Promise((res) => setTimeout(res, 800));
      logs.innerHTML += `<div>• Created repository <b>${repoFull}</b>...</div>`;
    }

    const pkgPath = cleanPkg.replace(/\./g, "/");
    const files = [
      { path: "settings.gradle", content: `pluginManagement{repositories{google();mavenCentral();gradlePluginPortal()}}\ndependencyResolutionManagement{repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS);repositories{google();mavenCentral()}}\nrootProject.name="WevloApp"\ninclude ':app'\n` },
      { path: "build.gradle", content: `plugins{id 'com.android.application' version '8.5.2' apply false}\n` },
      { path: "gradle.properties", content: `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8\nandroid.useAndroidX=true\nandroid.nonTransitiveRClass=true\n` },
      { path: "app/build.gradle", content: `plugins{id 'com.android.application'}\nandroid{namespace '${cleanPkg}';compileSdk 34;defaultConfig{applicationId "${cleanPkg}";minSdk 24;targetSdk 34;versionCode ${safeVerCode};versionName "${safeVerName}"};compileOptions{sourceCompatibility JavaVersion.VERSION_17;targetCompatibility JavaVersion.VERSION_17}}\n` },
      { path: "app/src/main/AndroidManifest.xml", content: `<?xml version="1.0" encoding="utf-8"?><manifest xmlns:android="http://schemas.android.com/apk/res/android"><uses-permission android:name="android.permission.INTERNET"/><application android:label="${escapeXml(appName)}" android:usesCleartextTraffic="true" android:theme="${themeAttr}"><activity android:name=".MainActivity" android:exported="true" android:configChanges="orientation|screenSize|keyboardHidden"><intent-filter><action android:name="android.intent.action.MAIN"/><category android:name="android.intent.category.LAUNCHER"/></intent-filter></activity></application></manifest>` },
      { path: `app/src/main/java/${pkgPath}/MainActivity.java`, content: `package ${cleanPkg};\n${javaSource}` },
      {
        path: ".github/workflows/wevlo-build.yml",
        content: `name: Build\non:\n  push:\n    branches: ["${branch}"]\npermissions:\n  contents: write\njobs:\n  b:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v6\n      - uses: actions/setup-java@v5\n        with:\n          distribution: 'temurin'\n          java-version: '17'\n      - uses: gradle/actions/setup-gradle@v6\n        with:\n          gradle-version: '8.7'\n      - run: gradle assembleDebug --no-daemon\n      - name: Publish Release\n        env:\n          GH_TOKEN: \${{ github.token }}\n        run: |\n          shopt -s nullglob globstar\n          FILES=(app/build/outputs/apk/**/*.apk)\n          if [ \${#FILES[@]} -gt 0 ]; then\n            gh release create "v${safeVerName}-\${{ github.run_number }}" "\${FILES[@]}" --title "v${safeVerName}-\${{ github.run_number }}" --notes "Built with Wevlo"\n          fi\n`
      }
    ];

    const createdAtMs = Date.now() - 15000;
    for (const f of files) {
      await ghPutPipelineFile(repoFull, f.path, f.content, branch);
    }
    if (!repoExists) await window.loadGithubRepos();
    logs.innerHTML += `<div>• Pushed ${cleanPkg} (v${safeVerName}, code ${safeVerCode}). Building APK...</div>`;

    clearInterval(window.__wevloPipelineTimer);
    window.__wevloPipelineTimer = setInterval(async () => {
      try {
        const latest = (await ghFetch(`/repos/${repoFull}/actions/runs?per_page=1`)).workflow_runs?.[0];
        if (!latest) return;
        if (new Date(latest.created_at).getTime() < createdAtMs) return;
        if (latest.status === "completed") {
          clearInterval(window.__wevloPipelineTimer);
          if (latest.conclusion === "success") {
            const apk = (await ghFetch(`/repos/${repoFull}/releases/latest`)).assets?.find((a) => a.name.endsWith(".apk"));
            if (apk) {
              logs.innerHTML += `<div class="mt-2"><button onclick="downloadPipelineApk('${apk.url}','${apk.name}','${apk.browser_download_url}')" class="btn-purple px-4 py-2 rounded-full text-xs font-bold inline-block">⬇ Download APK (${(apk.size / 1048576).toFixed(2)} MB)</button></div>`;
            }
          } else {
            logs.innerHTML += `<div class="text-rose-600 font-bold">Build Failed (${latest.conclusion}) — <a class="underline" target="_blank" href="${latest.html_url}">View Logs ↗</a></div>`;
          }
        }
      } catch {}
    }, 7000);
  } catch (e) {
    logs.innerHTML += `<div class="text-rose-600 font-bold">${escapeXml(e.message)}</div>`;
  }
}
// ======================================================
// File 4/4: app.js (PART 2 of 2 — paste directly below PART 1)
// ======================================================

// ======================================================
// 7. Personal Studio Pages
// ======================================================
function renderDashboard() {
  const c = state.projects.length;
  const repoCount = (state.githubRepos || []).length;
  const langCards = [
    ["java", "☕ Java", "Hello World Gradle"],
    ["kotlin", "🟣 Kotlin", "Hello World Native"],
    ["flutter", "🐦 Flutter", "Hello World Dart"],
    ["capacitor", "⚡ Capacitor", "Hello World Web APK"],
    ["python", "🐍 Python", "Hello World Kivy"]
  ];
  return `
    ${state.githubToken && state.selectedGhRepo ? `<div class="wevlo-card p-4 border-violet-400/50 bg-violet-500/5 flex flex-wrap items-center justify-between gap-2"><span class="text-xs font-bold">⚡ Active GitHub IDE: <b class="text-violet-700">${escapeHtmlAttr(state.selectedGhRepo)}</b> (${escapeHtmlAttr(state.ghBranch || "main")})</span><button onclick="resumeGithubIde()" class="btn-purple px-4 py-1.5 rounded-full text-xs font-bold">Open IDE →</button></div>` : ""}

    <div class="hero-lavender rounded-[26px] p-6 flex items-start justify-between gap-3">
      <div>
        <span class="inline-flex items-center gap-1.5 bg-white/80 text-violet-700 text-[11px] font-bold px-3 py-1 rounded-full mb-3"><i data-lucide="zap" class="w-3 h-3"></i> Personal Developer Studio</span>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900">Build Apps <span class="text-violet-700">Your Way</span></h1>
        <p class="text-xs text-slate-600 mt-1">All languages and APK tools unlocked with zero limits.</p>
        <div class="flex flex-wrap gap-2.5 mt-4">
          <button onclick="openNewProjectModal()" class="btn-purple px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold inline-flex items-center gap-1.5">Create Web Project →</button>
          <button onclick="navigate('#/github-build')" class="bg-white text-slate-900 border border-[#e3dff2] px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold inline-flex items-center gap-2"><i data-lucide="github" class="w-4 h-4"></i> Open GitHub IDE</button>
        </div>
      </div>
      <div class="icon-box-purple w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"><i data-lucide="rocket" class="w-6 h-6"></i></div>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      <div onclick="navigate('#/projects')" class="wevlo-card wevlo-card-hover p-4 flex items-center gap-3 cursor-pointer"><span class="w-11 h-11 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center"><i data-lucide="folder" class="w-5 h-5"></i></span><div><p class="text-xs text-muted">Web Projects</p><p class="text-xl font-extrabold">${c}</p></div></div>
      <div onclick="navigate('#/github-build')" class="wevlo-card wevlo-card-hover p-4 flex items-center gap-3 cursor-pointer"><span class="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center"><i data-lucide="github" class="w-5 h-5"></i></span><div><p class="text-xs text-muted">GitHub Repos</p><p class="text-xl font-extrabold">${repoCount}</p></div></div>
      <div onclick="navigate('#/files')" class="wevlo-card wevlo-card-hover p-4 flex items-center gap-3 cursor-pointer"><span class="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><i data-lucide="file" class="w-5 h-5"></i></span><div><p class="text-xs text-muted">Local Files</p><p class="text-xl font-extrabold">${state.files.length}</p></div></div>
      <div onclick="navigate('#/settings')" class="wevlo-card wevlo-card-hover p-4 flex items-center gap-3 cursor-pointer"><span class="w-11 h-11 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center"><i data-lucide="shield-check" class="w-5 h-5"></i></span><div><p class="text-xs text-muted">GitHub Status</p><p class="text-sm font-extrabold">${state.githubToken ? "Connected" : "Offline"}</p></div></div>
    </div>

    <div class="wevlo-card p-5">
      <div class="flex items-center justify-between mb-3"><h2 class="font-bold text-base flex items-center gap-2"><i data-lucide="cpu" class="w-5 h-5 text-violet-600"></i> Multi-Language Hello World Studio</h2><span class="text-[11px] font-bold text-violet-600">5 Languages</span></div>
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
        ${langCards.map(([id, title, sub]) => `<button onclick="openStudioLanguage('${id}')" class="p-3 rounded-2xl border border-soft wevlo-card-hover text-left transition"><p class="font-extrabold text-sm">${title}</p><p class="text-[11px] text-muted mt-0.5">${sub}</p></button>`).join("")}
      </div>
    </div>

    <div class="wevlo-card p-5">
      <h2 class="font-bold text-base mb-4">⚡ Quick Actions</h2>
      <div class="grid grid-cols-4 gap-2.5">
        ${[
          ["New Project", "rocket", "bg-violet-50 text-violet-600", "openNewProjectModal()"],
          ["Web Editor", "code-2", "bg-sky-50 text-sky-600", "navigate('#/editor')"],
          ["GitHub IDE", "github", "bg-slate-100 text-slate-800", "navigate('#/github-build')"],
          ["Website to App", "globe", "bg-emerald-50 text-emerald-600", "navigate('#/web2app')"],
          ["Build APK", "smartphone", "bg-rose-50 text-rose-500", "navigate('#/build')"],
          ["Preview", "eye", "bg-indigo-50 text-indigo-600", "navigate('#/preview')"],
          ["Templates", "layout-grid", "bg-amber-50 text-amber-500", "navigate('#/templates')"],
          ["Docs", "book-open", "bg-sky-50 text-sky-600", "navigate('#/docs')"]
        ].map(([l, ic, bg, act]) => `<button onclick="${act}" class="border border-soft wevlo-card-hover rounded-2xl p-3 flex flex-col items-center gap-2"><span class="w-10 h-10 rounded-xl ${bg} flex items-center justify-center"><i data-lucide="${ic}" class="w-5 h-5"></i></span><span class="text-[11px] font-bold text-center">${l}</span></button>`).join("")}
      </div>
    </div>`;
}

function renderProjects() {
  const filtered = state.projects.filter((p) => p.name.toLowerCase().includes(state.projSearch.toLowerCase()));
  if (state.projects.length === 0) {
    return `<div class="wevlo-card p-8 border-2 border-dashed border-soft text-center space-y-4"><h2 class="text-xl font-extrabold">No web projects yet</h2><button onclick="openNewProjectModal()" class="btn-purple px-5 py-2.5 rounded-full text-xs font-bold">+ Create Project</button></div>`;
  }
  return `<div class="flex flex-wrap justify-between gap-3"><h1 class="text-xl font-extrabold">My Projects (${filtered.length})</h1><div class="flex gap-2"><input value="${escapeHtmlAttr(state.projSearch)}" oninput="state.projSearch=this.value;render()" placeholder="Search..." class="border border-soft rounded-full px-4 py-1.5 text-xs bg-transparent"/><button onclick="openNewProjectModal()" class="btn-purple px-4 py-2 rounded-full text-xs font-bold">+ New</button></div></div><div class="grid grid-cols-1 md:grid-cols-2 gap-4">${filtered.map((p) => `<div class="wevlo-card wevlo-card-hover p-5 space-y-3"><div class="flex justify-between"><div><h3 class="font-bold text-base">${escapeHtmlAttr(p.name)}</h3><p class="text-xs text-muted uppercase">${escapeHtmlAttr(p.type)} ${p.pkgName ? "• " + escapeHtmlAttr(p.pkgName) : ""}</p></div><button onclick="confirmDeleteProject('${p.id}')" class="text-rose-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button></div><div class="flex gap-2"><button onclick="openProjectInEditor('${p.id}')" class="btn-purple px-4 py-1.5 rounded-full text-xs font-bold">Edit</button><button onclick="openProjectInPreview('${p.id}')" class="border border-soft px-3.5 py-1.5 rounded-full text-xs font-bold">Preview</button><button onclick="openProjectInBuild('${p.id}')" class="bg-violet-50 text-violet-700 px-3.5 py-1.5 rounded-full text-xs font-bold">Build APK</button></div></div>`).join("")}</div>`;
}

function renderBuildApk() {
  const proj = getActiveProject();
  if (!proj) {
    return `<div class="wevlo-card p-6 text-center space-y-3"><h3 class="font-bold">No projects to build</h3><button onclick="navigate('#/projects')" class="btn-purple px-6 py-2.5 rounded-full text-xs font-bold">Go to My Projects</button></div>`;
  }
  const prefix = sanitizePkgId(state.profile?.pkgPrefix || "com.wevlo", "com.wevlo");
  const defaultSlug = slugifyPkgPart(proj.name, "myapp");
  if (!proj.pkgName) proj.pkgName = `${prefix}.${defaultSlug}`;
  if (!proj.appName) proj.appName = proj.name;
  if (!proj.versionName) proj.versionName = "1.0.0";
  if (!proj.versionCode) proj.versionCode = 1;
  if (!proj.repoName) proj.repoName = `wevlo-${proj.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;

  const b = state.buildConfig;
  const toggleRow = (l, k) => `<div class="flex justify-between items-center py-1.5"><span>${l}</span><label class="toggle-switch"><input type="checkbox" ${b[k] ? "checked" : ""} onchange="state.buildConfig['${k}']=this.checked"><span class="toggle-slider"></span></label></div>`;
  return `
    <div class="wevlo-card p-5 space-y-4 text-xs">
      <div>
        <b class="text-base">Build APK (${escapeHtmlAttr(proj.name)})</b>
        <p class="text-[11px] text-muted mt-0.5">প্রতিটি অ্যাপের Package ID আলাদা রাখলে ফোনের আগের অ্যাপ আপডেট হবে না।</p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="font-bold text-muted">App Name</label>
          <input value="${escapeHtmlAttr(proj.appName)}" oninput="updateActiveProjBuildField('${proj.id}','appName',this.value)" placeholder="My App" class="w-full mt-1 border border-soft rounded-xl px-3 py-2 bg-transparent"/>
        </div>
        <div>
          <label class="font-bold text-muted">Package Name (Unique ID)</label>
          <input value="${escapeHtmlAttr(proj.pkgName)}" oninput="updateActiveProjBuildField('${proj.id}','pkgName',this.value)" placeholder="${prefix}.${defaultSlug}" class="w-full mt-1 border border-soft rounded-xl px-3 py-2 bg-transparent font-mono"/>
        </div>
        <div>
          <label class="font-bold text-muted">Version Name</label>
          <input value="${escapeHtmlAttr(proj.versionName)}" oninput="updateActiveProjBuildField('${proj.id}','versionName',this.value)" placeholder="1.0.0" class="w-full mt-1 border border-soft rounded-xl px-3 py-2 bg-transparent font-mono"/>
        </div>
        <div>
          <label class="font-bold text-muted">Version Code</label>
          <input type="number" min="1" value="${escapeHtmlAttr(proj.versionCode)}" oninput="updateActiveProjBuildField('${proj.id}','versionCode',this.value)" placeholder="1" class="w-full mt-1 border border-soft rounded-xl px-3 py-2 bg-transparent font-mono"/>
        </div>
        <div class="sm:col-span-2">
          <label class="font-bold text-muted">GitHub Repository Name</label>
          <input id="bRepoName" value="${escapeHtmlAttr(proj.repoName)}" oninput="updateActiveProjBuildField('${proj.id}','repoName',this.value)" class="w-full mt-1 border border-soft rounded-xl px-3 py-2 bg-transparent font-mono"/>
        </div>
      </div>
      <div class="space-y-1 border border-soft rounded-2xl p-3.5">
        ${toggleRow("Enable JavaScript", "jsEnabled")}
        ${toggleRow("Enable DOM Storage", "domStorage")}
        ${toggleRow("Fullscreen Mode", "fullscreen")}
      </div>
      <button onclick="buildProjectToApk('${proj.id}')" class="w-full btn-purple py-3.5 rounded-full text-sm font-bold">Start Build APK →</button>
      <div id="buildProjLog" class="hidden border border-soft rounded-2xl p-4"></div>
    </div>`;
}

function renderWeb2App() {
  const w = state.web2app;
  return `
    <div class="hero-lavender rounded-[24px] p-5 flex justify-between items-center">
      <h1 class="text-xl font-extrabold text-slate-900">Website Into <span class="text-violet-700">Android App</span></h1>
      <div class="icon-box-purple w-11 h-11 rounded-2xl flex items-center justify-center"><i data-lucide="globe" class="w-5 h-5"></i></div>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div class="lg:col-span-7 wevlo-card p-5 space-y-3 text-xs">
        <div><label class="font-bold text-muted">Website URL</label><input value="${escapeHtmlAttr(w.url)}" oninput="updateW2A('url',this.value)" placeholder="https://" class="w-full mt-1 border border-soft rounded-xl px-3.5 py-2.5 bg-transparent"/></div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label class="font-bold text-muted">App Name</label><input value="${escapeHtmlAttr(w.appName)}" oninput="updateW2A('appName',this.value)" placeholder="App Name" class="w-full mt-1 border border-soft rounded-xl px-3.5 py-2.5 bg-transparent"/></div>
          <div><label class="font-bold text-muted">Package ID (Unique)</label><input id="w2aPkgInput" value="${escapeHtmlAttr(w.pkgName)}" oninput="state.web2app.pkgEdited=true; updateW2A('pkgName',this.value)" placeholder="com.myapp.web" class="w-full mt-1 border border-soft rounded-xl px-3.5 py-2.5 bg-transparent font-mono"/></div>
          <div><label class="font-bold text-muted">Version Name</label><input value="${escapeHtmlAttr(w.versionName || "1.0.0")}" oninput="updateW2A('versionName',this.value)" placeholder="1.0.0" class="w-full mt-1 border border-soft rounded-xl px-3.5 py-2.5 bg-transparent font-mono"/></div>
          <div><label class="font-bold text-muted">Version Code</label><input type="number" min="1" value="${escapeHtmlAttr(w.versionCode || 1)}" oninput="updateW2A('versionCode',this.value)" placeholder="1" class="w-full mt-1 border border-soft rounded-xl px-3.5 py-2.5 bg-transparent font-mono"/></div>
        </div>
        <div class="flex justify-between items-center py-1.5 px-1">
          <span class="font-bold text-muted">Fullscreen Mode</span>
          <label class="toggle-switch"><input type="checkbox" ${w.fullscreen ? "checked" : ""} onchange="updateW2A('fullscreen',this.checked)"><span class="toggle-slider"></span></label>
        </div>
        <button onclick="startWeb2AppBuild()" class="w-full btn-purple py-3.5 rounded-full text-sm font-bold">🚀 Convert to Android App →</button>
        <div id="w2aLog" class="hidden border border-soft rounded-2xl p-4"></div>
      </div>
      <div class="lg:col-span-5 wevlo-card p-5 flex justify-center">
        <div class="phone-mockup flex flex-col">
          <div class="phone-notch"></div>
          <div class="btn-purple pt-6 pb-2.5 px-3 text-white text-xs font-bold" id="mockAppName">${escapeHtmlAttr(w.appName)}</div>
          <div class="flex-1 flex flex-col items-center justify-center p-4 text-center">
            <p class="font-extrabold text-sm" id="mockWelcome">Welcome to ${escapeHtmlAttr(w.appName)}</p>
            <p class="text-[11px] text-slate-400 break-all mt-1" id="mockUrl">${escapeHtmlAttr(w.url)}</p>
          </div>
        </div>
      </div>
    </div>`;
}

function renderTemplates() {
  return `
    <h1 class="text-xl font-extrabold">Templates</h1>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      ${["Portfolio Landing", "E-Commerce Store", "News & Blog App"]
        .map(
          (n) => `
        <div class="wevlo-card wevlo-card-hover p-5 space-y-3">
          <h3 class="font-bold text-base">${n}</h3>
          <p class="text-xs text-muted">Ready-to-edit HTML/CSS/JS starter.</p>
          <button onclick="cloneTemplate('${n}')" class="w-full btn-purple py-2.5 rounded-full text-xs font-bold">Use Template</button>
        </div>`
        )
        .join("")}
    </div>`;
}

function renderPreview() {
  const proj = getActiveProject();
  if (!proj) return `<div class="wevlo-card p-8 text-center text-xs text-muted">Please create a project first.</div>`;
  const doc = `<!DOCTYPE html><html><head><style>${proj.css}</style></head><body>${proj.html}<script>${proj.js}<\/script></body></html>`;
  const w = { phone: "max-w-[360px]", tablet: "max-w-[700px]", desktop: "max-w-full" }[state.previewDevice];
  return `<div class="wevlo-card p-4 flex justify-between items-center"><b class="text-sm">${escapeHtmlAttr(proj.name)}</b><div class="flex gap-1.5">${["phone", "tablet", "desktop"].map((d) => `<button onclick="state.previewDevice='${d}';render()" class="px-3 py-1 rounded-full text-xs font-bold capitalize ${state.previewDevice === d ? "btn-purple" : "border border-soft"}">${d}</button>`).join("")}</div></div><div class="flex justify-center"><iframe class="${w} w-full h-[520px] bg-white rounded-3xl border-4 border-slate-800 shadow-xl" srcdoc="${escapeHtmlAttr(doc)}"></iframe></div>`;
}

function renderSettings() {
  const pr = state.profile;
  return `
    <div class="wevlo-card p-5 space-y-4 text-xs">
      <h1 class="text-xl font-extrabold">Settings &amp; Connections</h1>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="font-bold text-muted">Developer Name</label>
          <input value="${escapeHtmlAttr(pr.name || "")}" placeholder="Enter your name" oninput="state.profile.name=this.value" class="w-full mt-1 border border-soft rounded-xl px-3.5 py-2.5 bg-transparent"/>
        </div>
        <div>
          <label class="font-bold text-muted">Default Package Prefix</label>
          <input value="${escapeHtmlAttr(pr.pkgPrefix || "com.wevlo")}" placeholder="com.mycompany" oninput="state.profile.pkgPrefix=this.value" class="w-full mt-1 border border-soft rounded-xl px-3.5 py-2.5 bg-transparent font-mono"/>
        </div>
      </div>
      <div class="flex flex-wrap gap-2.5">
        <button onclick="saveUserProfile()" class="btn-purple px-5 py-2.5 rounded-full font-bold">Save Profile</button>
        <button onclick="loginWithGithub()" class="border border-soft px-4 py-2.5 rounded-full font-bold">Connect GitHub (OAuth)</button>
        <button onclick="openGhTokenModal()" class="border border-soft px-4 py-2.5 rounded-full font-bold">GitHub via Token</button>
        <button onclick="loginWithGoogle()" class="border border-soft px-4 py-2.5 rounded-full font-bold">Connect Google</button>
        <button onclick="openEmailAuthModal()" class="border border-violet-400 text-violet-700 px-4 py-2.5 rounded-full font-bold">Email / Password</button>
        <button onclick="confirmLogout()" class="border border-rose-300 text-rose-600 px-4 py-2.5 rounded-full font-bold">Disconnect / Sign Out</button>
      </div>
    </div>`;
}

// ======================================================
// 8. Bindings & Router
// ======================================================
window.openStudioLanguage = (lang) => {
  state.newRepoLang = lang;
  state.ghNewProjModalOpen = true;
  state.ghIdeOpen = false;
  window.navigate("#/github-build");
};

window.openProjectInEditor = (id) => {
  state.activeProjectId = id;
  saveProjects();
  window.navigate("#/editor");
};
window.openProjectInPreview = (id) => {
  state.activeProjectId = id;
  saveProjects();
  window.navigate("#/preview");
};
window.openProjectInBuild = (id) => {
  state.activeProjectId = id;
  saveProjects();
  window.navigate("#/build");
};
window.updateActiveProjBuildField = (id, key, val) => {
  const proj = state.projects.find((p) => p.id === id);
  if (!proj) return;
  proj[key] = val;
  saveProjects();
};
window.confirmDeleteProject = (id) =>
  openConfirmModal({
    title: "Delete Project?",
    message: "Delete this project?",
    onConfirm: () => {
      state.projects = state.projects.filter((p) => p.id !== id);
      if (state.activeProjectId === id) {
        state.activeProjectId = state.projects[0]?.id || null;
      }
      saveProjects();
      window.render();
    }
  });
window.updateW2A = (k, v) => {
  state.web2app[k] = v;
  if (k === "appName") {
    const el = document.getElementById("mockAppName");
    const wel = document.getElementById("mockWelcome");
    if (el) el.textContent = v;
    if (wel) wel.textContent = "Welcome to " + v;
    if (!state.web2app.pkgEdited) {
      const prefix = sanitizePkgId(state.profile?.pkgPrefix || "com.wevlo", "com.wevlo");
      const nextPkg = `${prefix}.${slugifyPkgPart(v, "webapp")}`;
      state.web2app.pkgName = nextPkg;
      const pkgEl = document.getElementById("w2aPkgInput");
      if (pkgEl) pkgEl.value = nextPkg;
    }
  } else if (k === "url") {
    const uEl = document.getElementById("mockUrl");
    if (uEl) uEl.textContent = v;
  }
};

window.startWeb2AppBuild = () => {
  const w = state.web2app;
  const safeUrl = (w.url || "https://example.com").replace(/"/g, '\\"');
  runGithubApkPipeline({
    repoName: "wevlo-" + slugifyPkgPart(w.appName, "webapp"),
    appName: w.appName || "My Web App",
    pkgName: w.pkgName,
    versionName: w.versionName || "1.0.0",
    versionCode: w.versionCode || 1,
    fullscreen: !!w.fullscreen,
    javaSource: `import android.app.Activity;\nimport android.os.Bundle;\nimport android.webkit.*;\npublic class MainActivity extends Activity {\n  @Override protected void onCreate(Bundle b) {\n    super.onCreate(b);\n    WebView wv = new WebView(this);\n    wv.getSettings().setJavaScriptEnabled(true);\n    wv.getSettings().setDomStorageEnabled(true);\n    wv.setWebViewClient(new WebViewClient());\n    wv.loadUrl("${safeUrl}");\n    setContentView(wv);\n  }\n}`,
    logElId: "w2aLog"
  });
};

window.buildProjectToApk = (id) => {
  const proj = state.projects.find((p) => p.id === id);
  if (!proj) return;
  let htmlBody = proj.html || "";
  let cssBody = proj.css || "";
  let jsBody = proj.js || "";
  if (Array.isArray(proj.files) && proj.files.length > 0) {
    const htmlFile = proj.files.find((f) => f.name === "index.html") || proj.files.find((f) => f.name.endsWith(".html"));
    if (htmlFile) htmlBody = htmlFile.content || "";
    const cssFiles = proj.files.filter((f) => f.name.endsWith(".css"));
    if (cssFiles.length) cssBody = cssFiles.map((f) => f.content || "").join("\n");
    const jsFiles = proj.files.filter((f) => f.name.endsWith(".js"));
    if (jsFiles.length) jsBody = jsFiles.map((f) => f.content || "").join("\n");
  }
  const fullHtml = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${cssBody}</style></head><body>${htmlBody}<script>${jsBody}<\/script></body></html>`;
  const htmlB64 = toBase64(fullHtml);
  const b = state.buildConfig;
  const repoInput = document.getElementById("bRepoName")?.value.trim() || proj.repoName || `wevlo-${proj.name}`;
  runGithubApkPipeline({
    repoName: repoInput,
    appName: proj.appName || proj.name,
    pkgName: proj.pkgName || b.pkgName,
    versionName: proj.versionName || "1.0.0",
    versionCode: proj.versionCode || 1,
    fullscreen: !!b.fullscreen,
    javaSource: `import android.app.Activity;\nimport android.os.Bundle;\nimport android.util.Base64;\nimport android.webkit.WebView;\nimport java.nio.charset.StandardCharsets;\npublic class MainActivity extends Activity {\n  @Override protected void onCreate(Bundle b) {\n    super.onCreate(b);\n    WebView w = new WebView(this);\n    w.getSettings().setJavaScriptEnabled(${!!b.jsEnabled});\n    w.getSettings().setDomStorageEnabled(${!!b.domStorage});\n    String html = new String(Base64.decode("${htmlB64}", Base64.DEFAULT), StandardCharsets.UTF_8);\n    w.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null);\n    setContentView(w);\n  }\n}`,
    logElId: "buildProjLog"
  });
};

window.cloneTemplate = (name) => {
  const slug = slugifyPkgPart(name, "template");
  const prefix = sanitizePkgId(state.profile?.pkgPrefix || "com.wevlo", "com.wevlo");
  state.projects.unshift({
    id: "proj_" + Date.now(),
    name,
    type: "html",
    pkgName: `${prefix}.${slug}`,
    versionName: "1.0.0",
    versionCode: 1,
    html: `<h1>${name}</h1>`,
    css: `body{font-family:sans-serif;text-align:center;padding:30px}`,
    js: ``,
    updatedAt: new Date().toLocaleDateString()
  });
  state.activeProjectId = state.projects[0].id;
  saveProjects();
  window.navigate("#/editor");
};

window.saveUserProfile = () => {
  state.profile.pkgPrefix = sanitizePkgId(state.profile.pkgPrefix, "com.wevlo");
  localStorage.setItem("wevlo_profile", JSON.stringify(state.profile));
  updateAccountUI();
  window.showToast("Profile saved!", "success");
};

window.state = state;
window.render = function render() {
  renderHeaderAndNav();

  const isFullIde =
    (state.route === "#/editor" && !!getActiveProject()) ||
    (state.route === "#/github-build" && !!state.ghIdeOpen && !!state.selectedGhRepo);

  const headerEl = document.querySelector("header");
  const sidebarEl = document.getElementById("sidebar");
  const bnavEl = document.querySelector("nav.fixed");
  const c = document.getElementById("appContent");
  if (headerEl) headerEl.classList.toggle("hidden", isFullIde);
  if (sidebarEl) sidebarEl.classList.toggle("lg:hidden", isFullIde);
  if (bnavEl) bnavEl.classList.toggle("hidden", isFullIde);
  if (c?.parentElement) c.parentElement.className = isFullIde ? "flex-1 flex flex-col min-w-0" : "flex-1 flex flex-col min-w-0 pb-24 lg:pb-8";
  if (c) c.className = isFullIde ? "w-full min-h-screen p-0" : "max-w-5xl w-full mx-auto px-4 py-5 space-y-5";

  const extraHtml = renderExtraPages({
    state,
    saveProjects,
    navigate: window.navigate,
    showToast: window.showToast,
    render: window.render,
    addActivity,
    openConfirmModal
  });
  if (extraHtml) {
    c.innerHTML = extraHtml;
  } else {
    switch (state.route) {
      case "#/projects":
        c.innerHTML = renderProjects();
        break;
      case "#/editor":
        c.innerHTML = renderProCodeEditor({
          state,
          saveProjects,
          navigate: window.navigate,
          showToast: window.showToast,
          render: window.render,
          openNewProjectModal: window.openNewProjectModal
        });
        break;
      case "#/build":
        c.innerHTML = renderBuildApk();
        break;
      case "#/web2app":
        c.innerHTML = renderWeb2App();
        break;
      case "#/github-build":
        c.innerHTML = renderProGithubBuild({
          state,
          ghFetch,
          showToast: window.showToast,
          render: window.render,
          navigate: window.navigate,
          confirmLogout: window.confirmLogout,
          loginWithGithub: window.loginWithGithub,
          loadGithubRepos: window.loadGithubRepos
        });
        break;
      case "#/templates":
        c.innerHTML = renderTemplates();
        break;
      case "#/preview":
        c.innerHTML = renderPreview();
        break;
      case "#/settings":
        c.innerHTML = renderSettings();
        break;
      default:
        c.innerHTML = renderDashboard();
    }
  }
  if (window.lucide) window.lucide.createIcons();
};

if (state.githubToken) window.loadGithubRepos().then(() => window.render());
else window.render();
