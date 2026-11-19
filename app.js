import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, GithubAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { renderExtraPages } from "./pages-extra.js";
import { renderProCodeEditor, renderProGithubBuild } from "./ide-editors.js";
import { initCloudFirestore, renderAdminPanel, isAdminUser, checkFeatureAccess, DEFAULT_FEATURE_RULES, DEFAULT_PAYMENT_CONFIG } from "./admin-panel.js";

// ======================================================
// ১. Firebase Config
// ======================================================
const firebaseConfig = {
  apiKey: "AIzaSyBXUklgCWDOujtIuSZvW_VDnEVu6WKFrNA",
  authDomain: "hwllo-cdde8.firebaseapp.com",
  projectId: "hwllo-cdde8",
  storageBucket: "hwllo-cdde8.firebasestorage.app",
  messagingSenderId: "814010361703",
  appId: "1:814010361703:web:7ae39494076f943b2a71c2"
};

let fbApp = null, auth = null;
try {
  fbApp = initializeApp(firebaseConfig);
  auth = getAuth(fbApp);
} catch (err) { console.warn("Firebase init error:", err.message); }

// ======================================================
// ২. Global State
// ======================================================
const savedProfile = JSON.parse(localStorage.getItem("wevlo_profile") || "null");
if (savedProfile && savedProfile.name === "Wevlo Developer") { savedProfile.name = ""; localStorage.setItem("wevlo_profile", JSON.stringify(savedProfile)); }

const state = {
  route: window.location.hash || "#/",
  theme: localStorage.getItem("wevlo_theme") || "light",
  user: null,
  profile: savedProfile || { name: "", pkgPrefix: "com.wevlo", emailNotify: true, autoSave: true },
  plan: localStorage.getItem("wevlo_plan") || "Free",
  proExpiresAt: null,
  featureRules: { ...DEFAULT_FEATURE_RULES },
  paymentConfig: { ...DEFAULT_PAYMENT_CONFIG },
  githubToken: sessionStorage.getItem("wevlo_gh_token") || null,
  githubUser: JSON.parse(sessionStorage.getItem("wevlo_gh_user") || "null"),
  githubRepos: [], repoFilter: "", selectedGhRepo: "", ghBranch: "main", ghIdeOpen: false, newRepoLang: "java",
  ghJavaCode: `import android.app.Activity;\nimport android.os.Bundle;\nimport android.widget.*;\npublic class MainActivity extends Activity {\n  @Override protected void onCreate(Bundle b) { super.onCreate(b); TextView t=new TextView(this); t.setText("Hello Wevlo!"); setContentView(t); }\n}`,
  projects: JSON.parse(localStorage.getItem("wevlo_projects") || "[]"), projSearch: "",
  activeProjectId: localStorage.getItem("wevlo_active_project") || null,
  activities: JSON.parse(localStorage.getItem("wevlo_activities") || "[]"),
  files: JSON.parse(localStorage.getItem("wevlo_files") || "[]"),
  payments: JSON.parse(localStorage.getItem("wevlo_payments") || "[]"),
  pushLogs: JSON.parse(localStorage.getItem("wevlo_push_logs") || "[]"),
  previewDevice: "phone", modalType: "html",
  wallet: JSON.parse(localStorage.getItem("wevlo_wallet") || '{"balance":0,"deposited":0,"spent":0,"pending":0}'),
  walletTab: "add", payMethod: "bKash", payAmount: 100, depositFileName: "",
  buildConfig: {
    buildType: "Debug", pkgName: "com.wevlo.app", versionName: "1.0.0", versionCode: Number(localStorage.getItem("wevlo_ver_code") || 1),
    fullscreen: false, jsEnabled: true, domStorage: true, permCamera: false, permLocation: false,
    encryption: false, appLock: false, pushPro: false, adsPro: false
  },
  web2app: { url: "https://example.com", appName: "My Awesome App", pkgName: "com.wevlo.webapp", version: "1.0.0", orientation: "Auto (Portrait & Landscape)" }
};

// ======================================================
// ৩. Helpers (Theme, Modals, Toast, Feature Gate)
// ======================================================
function applyTheme() {
  document.documentElement.setAttribute("data-theme", state.theme);
  const lbl = document.getElementById("themeLabel"), ic = document.getElementById("themeIcon");
  if (lbl) lbl.textContent = state.theme === "dark" ? "Dark" : "Light";
  if (ic) ic.setAttribute("data-lucide", state.theme === "dark" ? "moon" : "sun");
}
applyTheme();
window.toggleTheme = () => { state.theme = state.theme === "light" ? "dark" : "light"; localStorage.setItem("wevlo_theme", state.theme); applyTheme(); if (window.lucide) window.lucide.createIcons(); };

function saveProjects() { localStorage.setItem("wevlo_projects", JSON.stringify(state.projects)); if (state.activeProjectId) localStorage.setItem("wevlo_active_project", state.activeProjectId); }
function addActivity(text) { state.activities.unshift({ text, time: new Date().toLocaleTimeString() }); state.activities = state.activities.slice(0, 8); localStorage.setItem("wevlo_activities", JSON.stringify(state.activities)); }
function getActiveProject() { return state.projects.find((p) => p.id === state.activeProjectId) || state.projects[0] || null; }

let confirmCallback = null;
function openConfirmModal({ title, message, onConfirm }) {
  document.getElementById("confirmTitle").textContent = title; document.getElementById("confirmMsg").textContent = message;
  confirmCallback = onConfirm; const m = document.getElementById("confirmModal"); m.classList.remove("hidden"); m.classList.add("flex");
}
window.closeConfirmModal = () => { const m = document.getElementById("confirmModal"); m.classList.add("hidden"); m.classList.remove("flex"); };
document.getElementById("confirmOkBtn").addEventListener("click", () => { if (confirmCallback) confirmCallback(); window.closeConfirmModal(); });

window.showToast = (msg, type = "info") => {
  const t = document.getElementById("toast"); t.textContent = msg;
  const bg = type === "error" ? "bg-rose-600" : type === "success" ? "bg-emerald-600" : "bg-slate-900";
  t.className = `fixed top-20 left-1/2 -translate-x-1/2 z-[60] text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg ${bg}`;
  setTimeout(() => t.classList.add("hidden"), 3000);
};

// Initialize Cloud Firestore (Admin Feature Control + Payments + Users)
initCloudFirestore(fbApp, { state, render: () => window.render(), showToast: window.showToast, navigate: (r) => window.navigate(r) });

// ======================================================
// ৪. Firebase Auth (Gmail & GitHub)
// ======================================================
if (auth) onAuthStateChanged(auth, (u) => { state.user = u; updateAccountUI(); window.syncCloudUser?.(u); window.render(); });

function updateAccountUI() {
  const av = document.getElementById("userAvatar"), accName = document.getElementById("accName"), accEmail = document.getElementById("accEmail"), btnLogout = document.getElementById("btnLogoutMenu");
  if (state.user) {
    const label = state.user.displayName || state.profile.name || state.user.email || "User";
    av.textContent = label[0].toUpperCase(); accName.textContent = label; accEmail.textContent = state.user.email || "Signed in"; btnLogout.classList.remove("hidden");
  } else if (state.githubUser) {
    av.textContent = state.githubUser.login[0].toUpperCase(); accName.textContent = state.githubUser.login; accEmail.textContent = "GitHub Connected"; btnLogout.classList.remove("hidden");
  } else {
    av.textContent = "W"; accName.textContent = "Not Signed In"; accEmail.textContent = "Sign in with Gmail or GitHub"; btnLogout.classList.add("hidden");
  }
  document.getElementById("ghMenuLabel").textContent = state.githubToken ? `GitHub: @${state.githubUser?.login || "Connected"}` : "Connect GitHub Account";
}
updateAccountUI();

window.loginWithGoogle = async () => {
  try { await signInWithPopup(auth, new GoogleAuthProvider()); window.showToast("Gmail লগইন সফল!", "success"); document.getElementById("accountMenu").classList.add("hidden"); }
  catch (e) { window.showToast(e.message, "error"); }
};

window.loginWithGithub = async () => {
  const p = new GithubAuthProvider(); p.addScope("repo"); p.addScope("workflow");
  try {
    const res = await signInWithPopup(auth, p);
    const cred = GithubAuthProvider.credentialFromResult(res);
    if (cred?.accessToken) {
      state.githubToken = cred.accessToken; sessionStorage.setItem("wevlo_gh_token", cred.accessToken);
      state.githubUser = await ghFetch("/user"); sessionStorage.setItem("wevlo_gh_user", JSON.stringify(state.githubUser));
      await window.loadGithubRepos(); updateAccountUI(); window.render(); window.showToast("GitHub কানেক্ট হয়েছে!", "success");
    }
    document.getElementById("accountMenu").classList.add("hidden");
  } catch (e) { window.showToast(e.code === "auth/popup-closed-by-user" ? "পপআপ বন্ধ হয়েছে! Chrome Pop-ups Allow করে আবার চেষ্টা করুন।" : e.message, "error"); }
};

window.confirmLogout = () => openConfirmModal({
  title: "Remove / Sign Out Account?", message: "Sign out and clear cached Gmail & GitHub session?",
  onConfirm: async () => {
    try { if (auth) await signOut(auth); if (window.indexedDB) indexedDB.deleteDatabase("firebaseLocalStorageDb"); } catch {}
    state.user = null; state.plan = "Free"; state.githubToken = null; state.githubUser = null; state.githubRepos = []; state.ghIdeOpen = false;
    sessionStorage.clear(); localStorage.removeItem("wevlo_profile"); state.profile.name = "";
    document.getElementById("accountMenu").classList.add("hidden"); updateAccountUI(); window.render(); window.showToast("Signed out!", "info");
  }
});

// ======================================================
// ৫. Sidebar & Navigation (With Admin Panel Link + Feature Badges)
// ======================================================
const sidebarMenu = [
  { route: "#/", label: "Dashboard", icon: "home" },
  { route: "#/projects", label: "My Projects", icon: "folder" },
  { route: "#/templates", label: "Templates", icon: "layout-grid", fkey: "templates" },
  { route: "#/web2app", label: "Website to App", icon: "globe", fkey: "web2app" },
  { route: "#/editor", label: "Code Editor", icon: "code-2", fkey: "codeEditor" },
  { route: "#/build", label: "Build APK", icon: "smartphone", fkey: "buildApk" },
  { route: "#/github-build", label: "GitHub Build", icon: "github", fkey: "githubBuild" },
  { route: "#/preview", label: "Preview", icon: "eye", fkey: "preview" },
  { route: "#/wallet", label: "Wallet", icon: "wallet" },
  { route: "#/subscription", label: "Subscription", icon: "crown" },
  { route: "#/payments", label: "Payments", icon: "receipt" },
  { route: "#/push", label: "Push Notifications", icon: "bell-ring", fkey: "proPush" },
  { route: "#/lab", label: "Lab", icon: "flask-conical", fkey: "lab" },
  { route: "#/files", label: "File Manager", icon: "folder-open", fkey: "fileManager" },
  { route: "#/icons", label: "Icon Library", icon: "shapes", fkey: "iconLibrary" },
  { route: "#/secure-converter", label: "Secure Converter", icon: "shield-alert", fkey: "secureConverter" },
  { route: "#/docs", label: "Documentation", icon: "book-open" },
  { route: "#/privacy", label: "Privacy Policy", icon: "shield" },
  { route: "#/support", label: "Support", icon: "headphones" }
];
const pageTitles = Object.fromEntries([...sidebarMenu.map((i) => [i.route, i.label]), ["#/settings", "Settings & Profile"], ["#/admin", "Admin Panel"]]);

window.navigate = (r) => { state.route = r; window.location.hash = r; window.toggleDrawer(false); window.render(); window.scrollTo({ top: 0, behavior: "smooth" }); };
window.addEventListener("hashchange", () => { state.route = window.location.hash || "#/"; window.render(); });
window.toggleDrawer = (open) => { document.getElementById("sidebar").classList.toggle("-translate-x-full", !open); document.getElementById("drawerOverlay").classList.toggle("hidden", !open); };
window.toggleAccountMenu = () => document.getElementById("accountMenu").classList.toggle("hidden");

function renderHeaderAndNav() {
  const adminBtn = isAdminUser(state)
    ? `<button onclick="navigate('#/admin')" class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl mb-2 ${state.route === "#/admin" ? "btn-purple font-bold" : "bg-purple-50 text-purple-800 font-bold"}"><span class="flex items-center gap-2"><i data-lucide="shield-check" class="w-4 h-4"></i> Admin Panel</span><span class="pro-badge">ADMIN</span></button>`
    : "";

  document.getElementById("sidebarNav").innerHTML = adminBtn + sidebarMenu.map((item) => {
    const mode = item.fkey ? (state.featureRules?.[item.fkey] || "free") : "free";
    const badge = mode === "pro" ? `<span class="pro-badge">PRO</span>` : mode === "off" ? `<span class="text-[9px] bg-rose-100 text-rose-600 px-1.5 rounded-full font-bold">OFF</span>` : "";
    return `<button onclick="navigate('${item.route}')" class="w-full flex items-center justify-between px-3 py-2 rounded-xl transition ${state.route === item.route ? "bg-purple-50 text-purple-700 font-bold" : "text-muted hover:bg-purple-500/5"}"><span class="flex items-center gap-3"><i data-lucide="${item.icon}" class="w-4 h-4"></i><span>${item.label}</span></span>${badge}</button>`;
  }).join("");

  document.querySelectorAll(".bnav-item").forEach((b) => b.classList.toggle("active", b.dataset.bnav === state.route));
  const subpages = ["#/build", "#/github-build", "#/subscription", "#/payments", "#/push", "#/lab", "#/files", "#/icons", "#/secure-converter", "#/docs", "#/privacy", "#/support", "#/admin"];
  const hl = document.getElementById("headerLeft");
  hl.innerHTML = subpages.includes(state.route)
    ? `<button onclick="navigate('#/')" class="w-9 h-9 rounded-full surface-card flex items-center justify-center"><i data-lucide="arrow-left" class="w-4 h-4"></i></button><span class="font-extrabold text-lg">${pageTitles[state.route]}</span>`
    : `<button onclick="toggleDrawer(true)" class="lg:hidden p-2 -ml-2 rounded-xl"><i data-lucide="menu" class="w-5 h-5"></i></button><a href="#/" onclick="navigate('#/')" class="flex items-center gap-1 lg:hidden"><svg width="26" height="20" viewBox="0 0 36 28" fill="none"><path d="M3 5L10.5 22L18 9L25.5 22L33 5" stroke="url(#wGrad)" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="text-lg font-extrabold">evlo</span></a><span class="hidden lg:inline-block font-bold text-base">${pageTitles[state.route] || "Wevlo"}</span>`;
}

window.openNewProjectModal = (type = "html") => { window.selectModalType(type); document.getElementById("modalProjName").value = ""; const m = document.getElementById("newProjectModal"); m.classList.remove("hidden"); m.classList.add("flex"); };
window.closeNewProjectModal = () => { const m = document.getElementById("newProjectModal"); m.classList.add("hidden"); m.classList.remove("flex"); };
window.selectModalType = (t) => { state.modalType = t; document.querySelectorAll(".ptype-card").forEach((c) => c.classList.toggle("active", c.dataset.ptype === t)); };
window.confirmCreateProject = () => {
  const name = document.getElementById("modalProjName").value.trim() || `Project ${state.projects.length + 1}`;
  state.projects.unshift({
    id: "proj_" + Date.now(), name, type: state.modalType, url: "https://example.com",
    html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${name}</title></head><body><div class="card"><h1>${name}</h1><p>Built with Wevlo</p><button onclick="go()">Get Started</button></div></body></html>`,
    css: `body{font-family:sans-serif;background:#f6f6fb;display:grid;place-items:center;min-height:100vh;margin:0}.card{background:#fff;padding:28px;border-radius:20px;text-align:center}button{background:#6d28d9;color:#fff;border:none;padding:10px 22px;border-radius:99px;font-weight:bold}`,
    js: `function go(){alert("Hello from ${name}!")}`, updatedAt: new Date().toLocaleDateString()
  });
  state.activeProjectId = state.projects[0].id; saveProjects(); addActivity(`Created "${name}"`); window.closeNewProjectModal();
  window.navigate(state.modalType === "webview" ? "#/web2app" : "#/editor");
};

// ======================================================
// ৬. GitHub REST API & APK Pipeline
// ======================================================
function toBase64(str) { let bin = ""; new TextEncoder().encode(str).forEach((b) => (bin += String.fromCharCode(b))); return btoa(bin); }
async function ghFetch(path, options = {}) {
  const res = await fetch("https://api.github.com" + path, { ...options, headers: { Authorization: "Bearer " + state.githubToken, Accept: "application/vnd.github+json", "Content-Type": "application/json", ...(options.headers || {}) } });
  const data = await res.json().catch(() => ({})); if (!res.ok) throw new Error(data.message || `GitHub Error (${res.status})`); return data;
}
window.loadGithubRepos = async () => { if (state.githubToken) try { state.githubRepos = await ghFetch("/user/repos?sort=updated&per_page=30"); } catch {} };

async function runGithubApkPipeline({ repoName, appName, pkgName, javaSource, logElId }) {
  const logEl = document.getElementById(logElId); logEl.classList.remove("hidden");
  logEl.innerHTML = `<div class="flex items-center gap-2 font-bold mb-2"><span class="spinner"></span><span id="${logElId}_t">Building...</span></div><div id="${logElId}_l" class="space-y-1"></div>`;
  const logs = document.getElementById(`${logElId}_l`);
  if (!state.githubToken) return (logs.innerHTML = `<span class="text-rose-600 font-bold">আগে GitHub কানেক্ট করুন!</span>`);
  try {
    const owner = state.githubUser?.login || (await ghFetch("/user")).login;
    const r = await ghFetch("/user/repos", { method: "POST", body: JSON.stringify({ name: repoName, private: false, auto_init: true }) });
    const branch = r.default_branch || "main", pkgPath = pkgName.replace(/\./g, "/");
    const files = [
      { path: "settings.gradle", content: `pluginManagement{repositories{google();mavenCentral();gradlePluginPortal()}}\ndependencyResolutionManagement{repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS);repositories{google();mavenCentral()}}\nrootProject.name="Wevlo"\ninclude ':app'\n` },
      { path: "build.gradle", content: `plugins{id 'com.android.application' version '8.5.2' apply false}\n` },
      { path: "gradle.properties", content: `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8\n` },
      { path: "app/build.gradle", content: `plugins{id 'com.android.application'}\nandroid{namespace '${pkgName}';compileSdk 34;defaultConfig{applicationId "${pkgName}";minSdk 24;targetSdk 34;versionCode 1;versionName "1.0"};compileOptions{sourceCompatibility JavaVersion.VERSION_17;targetCompatibility JavaVersion.VERSION_17}}\n` },
      { path: "app/src/main/AndroidManifest.xml", content: `<?xml version="1.0" encoding="utf-8"?><manifest xmlns:android="http://schemas.android.com/apk/res/android"><uses-permission android:name="android.permission.INTERNET"/><application android:label="${appName}" android:usesCleartextTraffic="true" android:theme="@android:style/Theme.DeviceDefault.Light.NoActionBar"><activity android:name=".MainActivity" android:exported="true"><intent-filter><action android:name="android.intent.action.MAIN"/><category android:name="android.intent.category.LAUNCHER"/></intent-filter></activity></application></manifest>` },
      { path: `app/src/main/java/${pkgPath}/MainActivity.java`, content: `package ${pkgName};\n${javaSource}` },
      { path: ".github/workflows/wevlo-build.yml", content: `name: Build\non:\n  push:\n    branches: ["${branch}"]\npermissions:\n  contents: write\njobs:\n  b:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-java@v4\n        with: {distribution: 'temurin', java-version: '17'}\n      - uses: gradle/actions/setup-gradle@v4\n        with: {gradle-version: '8.7'}\n      - run: gradle assembleDebug --no-daemon\n      - uses: softprops/action-gh-release@v2\n        with: {tag_name: "v1-\${{ github.run_number }}", files: "app/build/outputs/apk/debug/app-debug.apk"}\n` }
    ];
    for (const f of files) await ghFetch(`/repos/${owner}/${repoName}/contents/${f.path}`, { method: "PUT", body: JSON.stringify({ message: `Add ${f.path}`, content: toBase64(f.content), branch }) });
    logs.innerHTML += `<div>• Building on GitHub Actions...</div>`;
    const timer = setInterval(async () => {
      try {
        const latest = (await ghFetch(`/repos/${owner}/${repoName}/actions/runs`)).workflow_runs?.[0];
        if (latest?.status === "completed") {
          clearInterval(timer);
          if (latest.conclusion === "success") {
            const apk = (await ghFetch(`/repos/${owner}/${repoName}/releases/latest`)).assets?.find((a) => a.name.endsWith(".apk"));
            if (apk) logs.innerHTML += `<div class="mt-2"><a href="${apk.browser_download_url}" class="btn-purple px-4 py-2 rounded-full text-xs font-bold inline-block">Download APK (${(apk.size / 1048576).toFixed(2)} MB)</a></div>`;
          } else logs.innerHTML += `<div class="text-rose-600 font-bold">Failed (${latest.conclusion})</div>`;
        }
      } catch {}
    }, 7000);
  } catch (e) { logs.innerHTML += `<div class="text-rose-600">${e.message}</div>`; }
}

// ======================================================
// ৭. Core Screens & Feature Lock Screen
// ======================================================
function renderFeatureLocked(label, mode) {
  if (mode === "off") {
    return `<div class="wevlo-card p-8 text-center space-y-3"><i data-lucide="slash" class="w-10 h-10 mx-auto text-rose-500"></i><h2 class="text-lg font-extrabold">${label} Temporarily Disabled</h2><p class="text-xs text-muted">এই ফিচারটি বর্তমানে Admin বন্ধ রেখেছেন।</p></div>`;
  }
  return `<div class="wevlo-card p-8 text-center space-y-4"><span class="pro-badge">PRO FEATURE</span><h2 class="text-xl font-extrabold">${label} is for Pro Users</h2><p class="text-xs text-muted">এই ফিচারটি ব্যবহার করতে আপনার অ্যাকাউন্টটি Wevlo Pro-তে আপগ্রেড করুন।</p><button onclick="navigate('#/subscription')" class="btn-purple px-6 py-3 rounded-full text-xs font-bold">Upgrade to Wevlo Pro →</button></div>`;
}

function renderDashboard() {
  const c = state.projects.length;
  const langCards = [
    ["java", "langJava", "☕ Java", "Android Gradle"],
    ["kotlin", "langKotlin", "🟣 Kotlin", "Modern Native"],
    ["flutter", "langFlutter", "🐦 Flutter", "Dart Cross-App"],
    ["capacitor", "langCapacitor", "⚡ Capacitor", "HTML/JS APK"],
    ["python", "langPython", "🐍 Python", "Kivy Buildozer"]
  ];
  return `
    ${isAdminUser(state) ? `<div class="wevlo-card p-4 bg-purple-600/10 border-purple-400 flex items-center justify-between"><span class="text-xs font-extrabold text-purple-700">🛡 Logged in as Super Admin</span><button onclick="navigate('#/admin')" class="btn-purple px-4 py-1.5 rounded-full text-xs font-bold">Open Admin Panel →</button></div>` : ""}

    <div class="hero-lavender rounded-[24px] p-5 flex items-start justify-between gap-3">
      <div>
        <span class="inline-flex items-center gap-1 bg-white/80 text-purple-700 text-[11px] font-bold px-3 py-1 rounded-full mb-2.5"><i data-lucide="zap" class="w-3 h-3"></i> Welcome to Wevlo</span>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900">Build Something <span class="text-purple-700">Amazing</span></h1>
        <div class="flex flex-wrap gap-2.5 mt-4">
          <button onclick="openNewProjectModal()" class="btn-purple px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold inline-flex items-center gap-1.5">Create New Project →</button>
          <button onclick="navigate('#/github-build')" class="bg-white text-slate-900 border border-[#e3dff2] px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold inline-flex items-center gap-2"><i data-lucide="github" class="w-4 h-4"></i> GitHub Build</button>
        </div>
      </div>
      <div class="icon-box-purple w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"><i data-lucide="rocket" class="w-6 h-6"></i></div>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      <div class="wevlo-card p-4 flex items-center gap-3"><span class="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center"><i data-lucide="folder" class="w-5 h-5"></i></span><div><p class="text-xs text-muted">Total Projects</p><p class="text-xl font-extrabold">${c}</p></div></div>
      <div class="wevlo-card p-4 flex items-center gap-3"><span class="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><i data-lucide="download" class="w-5 h-5"></i></span><div><p class="text-xs text-muted">Templates</p><p class="text-xl font-extrabold">0</p></div></div>
      <div onclick="navigate('#/wallet')" class="wevlo-card p-4 flex items-center gap-3 cursor-pointer"><span class="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center"><i data-lucide="wallet" class="w-5 h-5"></i></span><div><p class="text-xs text-muted">Wallet Balance</p><p class="text-xl font-extrabold">৳${state.wallet.balance}</p></div></div>
      <div onclick="navigate('#/subscription')" class="wevlo-card p-4 flex items-center gap-3 cursor-pointer"><span class="w-11 h-11 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center"><i data-lucide="crown" class="w-5 h-5"></i></span><div><p class="text-xs text-muted">Current Plan</p><p class="text-lg font-extrabold">${state.plan}</p></div></div>
    </div>

    <div class="wevlo-card p-5">
      <div class="flex items-center justify-between mb-3"><h2 class="font-bold text-base flex items-center gap-2"><i data-lucide="cpu" class="w-5 h-5 text-purple-600"></i> Multi-Language App Studio</h2><span class="text-[11px] font-bold text-purple-600">5 Languages</span></div>
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
        ${langCards.map(([id, fkey, title, sub]) => {
          const m = state.featureRules?.[fkey] || "free";
          return `<button onclick="openStudioLanguage('${id}')" class="p-3 rounded-2xl border border-soft hover:border-purple-500 text-left transition relative"><div class="flex justify-between items-center"><p class="font-extrabold text-sm">${title}</p>${m === "pro" ? '<span class="pro-badge">PRO</span>' : m === "off" ? '<span class="text-[9px] text-rose-500 font-bold">OFF</span>' : ""}</div><p class="text-[11px] text-muted mt-0.5">${sub}</p></button>`;
        }).join("")}
      </div>
    </div>

    <div class="wevlo-card p-5">
      <h2 class="font-bold text-base mb-4">⚡ Quick Actions</h2>
      <div class="grid grid-cols-4 gap-2.5">
        ${[["Create Project", "rocket", "bg-purple-50 text-purple-600", "openNewProjectModal()"], ["Code Editor", "code-2", "bg-sky-50 text-sky-600", "navigate('#/editor')"], ["Upload Files", "upload", "bg-emerald-50 text-emerald-600", "navigate('#/files')"], ["Templates", "layout-grid", "bg-amber-50 text-amber-500", "navigate('#/templates')"], ["Build APK", "smartphone", "bg-rose-50 text-rose-500", "navigate('#/build')"], ["Preview", "eye", "bg-indigo-50 text-indigo-600", "navigate('#/preview')"], ["Wallet", "wallet", "bg-emerald-50 text-emerald-600", "navigate('#/wallet')"], ["Support", "headphones", "bg-sky-50 text-sky-600", "navigate('#/support')"]].map(([l, ic, bg, act]) => `<button onclick="${act}" class="border border-soft rounded-2xl p-3 flex flex-col items-center gap-2 hover:border-purple-400"><span class="w-10 h-10 rounded-xl ${bg} flex items-center justify-center"><i data-lucide="${ic}" class="w-5 h-5"></i></span><span class="text-[11px] font-bold text-center">${l}</span></button>`).join("")}
      </div>
    </div>`;
}

function renderProjects() {
  const filtered = state.projects.filter((p) => p.name.toLowerCase().includes(state.projSearch.toLowerCase()));
  if (state.projects.length === 0) return `<div class="wevlo-card p-6 border-2 border-dashed border-soft text-center space-y-4"><h2 class="text-xl font-extrabold">No projects yet</h2><button onclick="openNewProjectModal()" class="btn-purple px-5 py-2.5 rounded-full text-xs font-bold">+ Create Project</button></div>`;
  return `<div class="flex flex-wrap justify-between gap-3"><h1 class="text-xl font-extrabold">My Projects (${filtered.length})</h1><div class="flex gap-2"><input value="${state.projSearch}" oninput="state.projSearch=this.value;render()" placeholder="Search..." class="border border-soft rounded-full px-4 py-1.5 text-xs bg-transparent"/><button onclick="openNewProjectModal()" class="btn-purple px-4 py-2 rounded-full text-xs font-bold">+ New</button></div></div><div class="grid grid-cols-1 md:grid-cols-2 gap-4">${filtered.map((p) => `<div class="wevlo-card p-5 space-y-3"><div class="flex justify-between"><div><h3 class="font-bold text-base">${p.name}</h3><p class="text-xs text-muted uppercase">${p.type}</p></div><button onclick="confirmDeleteProject('${p.id}')" class="text-rose-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button></div><div class="flex gap-2"><button onclick="openProjectInEditor('${p.id}')" class="btn-purple px-4 py-1.5 rounded-full text-xs font-bold">Edit</button><button onclick="openProjectInPreview('${p.id}')" class="border border-soft px-3.5 py-1.5 rounded-full text-xs font-bold">Preview</button><button onclick="openProjectInBuild('${p.id}')" class="bg-purple-50 text-purple-700 px-3.5 py-1.5 rounded-full text-xs font-bold">Build APK</button></div></div>`).join("")}</div>`;
}

function renderBuildApk() {
  const proj = getActiveProject();
  if (!proj) return `<div class="wevlo-card p-6 text-center space-y-3"><h3 class="font-bold">No projects to build</h3><button onclick="navigate('#/projects')" class="btn-purple px-6 py-2.5 rounded-full text-xs font-bold">Go to My Projects</button></div>`;
  const b = state.buildConfig;
  const toggleRow = (l, k, fkey = null) => {
    const acc = fkey ? checkFeatureAccess(fkey, state) : { allowed: true, mode: "free" };
    return `<div class="flex justify-between items-center py-1"><span>${l} ${acc.mode === "pro" ? '<span class="pro-badge">PRO</span>' : ""}</span><label class="toggle-switch"><input type="checkbox" ${b[k] ? "checked" : ""} onchange="if(${!acc.allowed}){this.checked=false;navigate('#/subscription');showToast('Wevlo Pro প্রয়োজন!','error')}else{state.buildConfig['${k}']=this.checked}"><span class="toggle-slider"></span></label></div>`;
  };
  return `<div class="wevlo-card p-5 space-y-4 text-xs"><b class="text-base">Build APK (${proj.name})</b><div class="grid grid-cols-1 sm:grid-cols-2 gap-3"><input value="${b.pkgName}" oninput="state.buildConfig.pkgName=this.value" class="border border-soft rounded-xl px-3 py-2 bg-transparent"/><input id="bRepoName" value="wevlo-${proj.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}" class="border border-soft rounded-xl px-3 py-2 bg-transparent"/></div><div class="space-y-1.5 border border-soft rounded-2xl p-3.5">${toggleRow("JavaScript", "jsEnabled")}${toggleRow("AES-256-GCM Encryption", "encryption", "proEncryption")}${toggleRow("App Lock", "appLock", "proAppLock")}${toggleRow("Push Notifications", "pushPro", "proPush")}${toggleRow("AdMob Ads", "adsPro", "proAds")}</div><button onclick="buildProjectToApk('${proj.id}')" class="w-full btn-purple py-3.5 rounded-full text-sm font-bold">Start Build APK →</button><div id="buildProjLog" class="hidden border border-soft rounded-2xl p-4"></div></div>`;
}

function renderWeb2App() {
  const w = state.web2app;
  return `<div class="hero-lavender rounded-[24px] p-5 flex justify-between items-center"><h1 class="text-xl font-extrabold text-slate-900">Website Into <span class="text-purple-700">Android App</span></h1><div class="icon-box-purple w-11 h-11 rounded-2xl flex items-center justify-center"><i data-lucide="globe" class="w-5 h-5"></i></div></div><div class="grid grid-cols-1 lg:grid-cols-12 gap-5"><div class="lg:col-span-7 wevlo-card p-5 space-y-3 text-xs"><input value="${w.url}" oninput="updateW2A('url',this.value)" placeholder="https://" class="w-full border border-soft rounded-xl px-3.5 py-2.5 bg-transparent"/><input value="${w.appName}" oninput="updateW2A('appName',this.value)" placeholder="App Name" class="w-full border border-soft rounded-xl px-3.5 py-2.5 bg-transparent"/><input value="${w.pkgName}" oninput="updateW2A('pkgName',this.value)" placeholder="com.myapp.web" class="w-full border border-soft rounded-xl px-3.5 py-2.5 bg-transparent"/><button onclick="startWeb2AppBuild()" class="w-full btn-purple py-3.5 rounded-full text-sm font-bold">🚀 Convert to Android App →</button><div id="w2aLog" class="hidden border border-soft rounded-2xl p-4"></div></div><div class="lg:col-span-5 wevlo-card p-5 flex justify-center"><div class="phone-mockup flex flex-col"><div class="phone-notch"></div><div class="btn-purple pt-6 pb-2.5 px-3 text-white text-xs font-bold" id="mockAppName">${w.appName}</div><div class="flex-1 flex flex-col items-center justify-center p-4 text-center"><p class="font-extrabold text-sm">Welcome to ${w.appName}</p><p class="text-[11px] text-slate-400 break-all mt-1">${w.url}</p></div></div></div></div>`;
}

function renderWallet() {
  const w = state.wallet, pCfg = state.paymentConfig || DEFAULT_PAYMENT_CONFIG;
  const sendNum = state.payMethod === "bKash" ? pCfg.bkashNumber : pCfg.nagadNumber;
  return `
    <div class="hero-lavender rounded-[24px] p-5 flex justify-between items-center"><div><h1 class="text-2xl font-extrabold text-slate-900">Digital <span class="text-purple-700">Wallet</span></h1></div><div class="icon-box-purple w-11 h-11 rounded-2xl flex items-center justify-center"><i data-lucide="wallet" class="w-5 h-5"></i></div></div>
    <div class="grid grid-cols-2 gap-3.5"><div class="wevlo-card p-4"><b>Available Balance</b><p class="text-lg font-extrabold text-purple-700">৳${w.balance.toFixed(2)}</p></div><div class="wevlo-card p-4"><b>Total Deposited</b><p class="text-lg font-extrabold">৳${w.deposited}</p></div><div class="wevlo-card p-4"><b>Total Spent</b><p class="text-lg font-extrabold">৳${w.spent}</p></div><div class="wevlo-card p-4"><b>Pending</b><p class="text-lg font-extrabold">${w.pending}</p></div></div>
    <div class="wevlo-card p-5 space-y-3">
      <div class="grid grid-cols-2 gap-2"><button onclick="state.payMethod='bKash';render()" class="py-2 rounded-xl font-bold text-xs ${state.payMethod === "bKash" ? "btn-purple" : "border border-soft"}">bKash</button><button onclick="state.payMethod='Nagad';render()" class="py-2 rounded-xl font-bold text-xs ${state.payMethod === "Nagad" ? "btn-purple" : "border border-soft"}">Nagad</button></div>
      <div class="flex flex-wrap gap-2">${[50, 100, 200, 500, 1000].map((a) => `<button onclick="state.payAmount=${a};render()" class="px-4 py-1.5 rounded-full text-xs font-bold border ${state.payAmount === a ? "border-purple-600 text-purple-700" : "border-soft"}">৳${a}</button>`).join("")}</div>
      <div class="bg-[#f3f0fc] text-slate-900 rounded-2xl p-3 flex justify-between text-xs font-bold"><span>Send Money (${state.payMethod}): ${sendNum}</span><button onclick="navigator.clipboard?.writeText('${sendNum}');showToast('Copied!','success')" class="bg-white px-3 py-1 rounded-full border">Copy</button></div>
      <p class="text-[11px] text-muted">${pCfg.notice}</p>
      <input id="trxInput" placeholder="Transaction ID (TrxID)" class="w-full border border-soft rounded-xl px-4 py-2.5 text-sm bg-transparent"/>
      <button onclick="submitWalletDeposit()" class="w-full btn-purple py-3 rounded-full text-sm font-bold">Add Funds Now →</button>
    </div>`;
}

function renderTemplates() { return `<h1 class="text-xl font-extrabold">Templates</h1><div class="grid grid-cols-1 md:grid-cols-3 gap-4">${["Portfolio Landing", "E-Commerce Store", "News & Blog App"].map((n) => `<div class="wevlo-card p-5 space-y-3"><h3 class="font-bold text-base">${n}</h3><button onclick="cloneTemplate('${n}')" class="w-full btn-purple py-2 rounded-full text-xs font-bold">Use Template</button></div>`).join("")}</div>`; }

function renderPreview() {
  const proj = getActiveProject(); if (!proj) return `<div class="wevlo-card p-8 text-center text-xs text-muted">আগে একটি প্রজেক্ট তৈরি করুন।</div>`;
  const doc = `<!DOCTYPE html><html><head><style>${proj.css}</style></head><body>${proj.html}<script>${proj.js}<\/script></body></html>`;
  const w = { phone: "max-w-[360px]", tablet: "max-w-[700px]", desktop: "max-w-full" }[state.previewDevice];
  return `<div class="wevlo-card p-4 flex justify-between items-center"><b class="text-sm">${proj.name}</b><div class="flex gap-1.5">${["phone", "tablet", "desktop"].map((d) => `<button onclick="state.previewDevice='${d}';render()" class="px-3 py-1 rounded-full text-xs font-bold capitalize ${state.previewDevice === d ? "btn-purple" : "border border-soft"}">${d}</button>`).join("")}</div></div><div class="flex justify-center"><iframe class="${w} w-full h-[520px] bg-white rounded-3xl border-4 border-slate-800 shadow-xl" srcdoc="${doc.replace(/"/g, "&quot;")}"></iframe></div>`;
}

function renderSettings() {
  const pr = state.profile;
  return `<div class="wevlo-card p-5 space-y-4 text-xs"><h1 class="text-xl font-extrabold">Settings &amp; Profile</h1><input value="${pr.name}" placeholder="Enter your name" oninput="state.profile.name=this.value" class="w-full border border-soft rounded-xl px-3 py-2 bg-transparent"/><div class="flex flex-wrap gap-2.5"><button onclick="saveUserProfile()" class="btn-purple px-5 py-2 rounded-full font-bold">Save Profile</button><button onclick="loginWithGoogle()" class="border border-soft px-4 py-2 rounded-full font-bold">Connect Gmail</button><button onclick="loginWithGithub()" class="border border-soft px-4 py-2 rounded-full font-bold">Connect GitHub</button><button onclick="confirmLogout()" class="border border-rose-300 text-rose-600 px-4 py-2 rounded-full font-bold">Remove / Sign Out</button></div></div>`;
}

// ======================================================
// ৮. Bindings & Router With Admin Feature Gate
// ======================================================
const langKeyMap = { java: "langJava", kotlin: "langKotlin", flutter: "langFlutter", capacitor: "langCapacitor", python: "langPython" };
window.openStudioLanguage = (lang) => {
  const acc = checkFeatureAccess(langKeyMap[lang] || "langJava", state);
  if (!acc.allowed) {
    if (acc.mode === "off") return window.showToast("এই ল্যাঙ্গুয়েজটি বর্তমানে Admin বন্ধ রেখেছেন।", "error");
    window.showToast("এটি Pro ফিচার! আগে Wevlo Pro নিন।", "error");
    return window.navigate("#/subscription");
  }
  state.newRepoLang = lang; state.ghNewProjModalOpen = true; state.ghIdeOpen = false; window.navigate("#/github-build");
};

window.openProjectInEditor = (id) => { state.activeProjectId = id; saveProjects(); window.navigate("#/editor"); };
window.openProjectInPreview = (id) => { state.activeProjectId = id; saveProjects(); window.navigate("#/preview"); };
window.openProjectInBuild = (id) => { state.activeProjectId = id; saveProjects(); window.navigate("#/build"); };
window.confirmDeleteProject = (id) => openConfirmModal({ title: "Delete Project?", message: "Delete this project?", onConfirm: () => { state.projects = state.projects.filter((p) => p.id !== id); saveProjects(); window.render(); } });
window.updateW2A = (k, v) => { state.web2app[k] = v; if (k === "appName") { const el = document.getElementById("mockAppName"); if (el) el.textContent = v; } };
window.startWeb2AppBuild = () => {
  const w = state.web2app, repoName = "wevlo-" + w.appName.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Math.floor(Math.random() * 900 + 100);
  runGithubApkPipeline({ repoName, appName: w.appName, pkgName: w.pkgName, javaSource: `import android.app.Activity;import android.os.Bundle;import android.webkit.*;public class MainActivity extends Activity{private WebView wv;@Override protected void onCreate(Bundle b){super.onCreate(b);wv=new WebView(this);wv.getSettings().setJavaScriptEnabled(true);wv.setWebViewClient(new WebViewClient());wv.loadUrl("${w.url}");setContentView(wv);}}`, logElId: "w2aLog" });
};
window.buildProjectToApk = (id) => {
  const proj = state.projects.find((p) => p.id === id); if (!proj) return;
  const fullHtml = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${proj.css}</style></head><body>${proj.html}<script>${proj.js}<\/script></body></html>`.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "");
  runGithubApkPipeline({ repoName: document.getElementById("bRepoName").value.trim(), appName: proj.name, pkgName: state.buildConfig.pkgName, javaSource: `import android.app.Activity;import android.os.Bundle;import android.webkit.WebView;public class MainActivity extends Activity{@Override protected void onCreate(Bundle b){super.onCreate(b);WebView w=new WebView(this);w.getSettings().setJavaScriptEnabled(true);w.loadDataWithBaseURL(null,"${fullHtml}","text/html","UTF-8",null);setContentView(w);}}`, logElId: "buildProjLog" });
};
window.cloneTemplate = (name) => { state.projects.unshift({ id: "proj_" + Date.now(), name, type: "html", html: `<h1>${name}</h1>`, css: `body{font-family:sans-serif;text-align:center;padding:30px}`, js: ``, updatedAt: new Date().toLocaleDateString() }); state.activeProjectId = state.projects[0].id; saveProjects(); window.navigate("#/editor"); };

window.submitWalletDeposit = async () => {
  const trx = document.getElementById("trxInput").value.trim();
  if (!trx) return window.showToast("TrxID লিখুন!", "error");
  const ok = await window.submitCloudPayment?.({ type: "deposit", method: state.payMethod, amount: state.payAmount, trxId: trx, screenshotName: state.depositFileName });
  if (ok) {
    state.wallet.pending += 1;
    state.payments.unshift({ id: "DEP-" + Date.now(), title: `${state.payMethod} Deposit`, amount: state.payAmount, method: state.payMethod, trx, status: "Pending", date: new Date().toLocaleDateString() });
    localStorage.setItem("wevlo_wallet", JSON.stringify(state.wallet)); localStorage.setItem("wevlo_payments", JSON.stringify(state.payments));
    document.getElementById("trxInput").value = ""; window.render();
  }
};
window.saveUserProfile = () => { localStorage.setItem("wevlo_profile", JSON.stringify(state.profile)); updateAccountUI(); window.showToast("Profile saved!", "success"); };

const routeFeatureMap = {
  "#/editor": ["codeEditor", "Code Editor"],
  "#/preview": ["preview", "Device Preview"],
  "#/web2app": ["web2app", "Website to App"],
  "#/build": ["buildApk", "Build APK"],
  "#/github-build": ["githubBuild", "GitHub Build IDE"],
  "#/templates": ["templates", "Templates"],
  "#/lab": ["lab", "Community Lab"],
  "#/files": ["fileManager", "File Manager"],
  "#/icons": ["iconLibrary", "Icon Library"],
  "#/secure-converter": ["secureConverter", "Secure Converter"],
  "#/push": ["proPush", "Push Notifications"]
};

window.state = state;
window.render = function render() {
  renderHeaderAndNav();

  // Check Admin Feature Control before opening restricted pages
  const gate = routeFeatureMap[state.route];
  const gateResult = gate ? checkFeatureAccess(gate[0], state) : { allowed: true };

  const isFullIde = gateResult.allowed && ((state.route === "#/editor" && !!getActiveProject()) || (state.route === "#/github-build" && !!state.ghIdeOpen && !!state.selectedGhRepo));
  const headerEl = document.querySelector("header"), sidebarEl = document.getElementById("sidebar"), bnavEl = document.querySelector("nav.fixed"), c = document.getElementById("appContent");
  if (headerEl) headerEl.classList.toggle("hidden", isFullIde);
  if (sidebarEl) sidebarEl.classList.toggle("lg:hidden", isFullIde);
  if (bnavEl) bnavEl.classList.toggle("hidden", isFullIde);
  if (c?.parentElement) c.parentElement.className = isFullIde ? "flex-1 flex flex-col min-w-0" : "flex-1 flex flex-col min-w-0 pb-24 lg:pb-8";
  if (c) c.className = isFullIde ? "w-full min-h-screen p-0" : "max-w-5xl w-full mx-auto px-4 py-5 space-y-5";

  if (!gateResult.allowed) {
    c.innerHTML = renderFeatureLocked(gate[1], gateResult.mode);
  } else if (state.route === "#/admin") {
    c.innerHTML = renderAdminPanel({ state, showToast: window.showToast, render: window.render });
  } else {
    const extraHtml = renderExtraPages({ state, saveProjects, navigate: window.navigate, showToast: window.showToast, render: window.render, addActivity, openConfirmModal });
    if (extraHtml) c.innerHTML = extraHtml;
    else {
      switch (state.route) {
        case "#/projects": c.innerHTML = renderProjects(); break;
        case "#/editor": c.innerHTML = renderProCodeEditor({ state, saveProjects, navigate: window.navigate, showToast: window.showToast, render: window.render, openNewProjectModal: window.openNewProjectModal }); break;
        case "#/build": c.innerHTML = renderBuildApk(); break;
        case "#/web2app": c.innerHTML = renderWeb2App(); break;
        case "#/github-build": c.innerHTML = renderProGithubBuild({ state, ghFetch, showToast: window.showToast, render: window.render, navigate: window.navigate, confirmLogout: window.confirmLogout, loginWithGithub: window.loginWithGithub, loadGithubRepos: window.loadGithubRepos }); break;
        case "#/wallet": c.innerHTML = renderWallet(); break;
        case "#/templates": c.innerHTML = renderTemplates(); break;
        case "#/preview": c.innerHTML = renderPreview(); break;
        case "#/settings": c.innerHTML = renderSettings(); break;
        default: c.innerHTML = renderDashboard();
      }
    }
  }
  if (window.lucide) window.lucide.createIcons();
};

if (state.githubToken) window.loadGithubRepos().then(() => window.render());
else window.render();
