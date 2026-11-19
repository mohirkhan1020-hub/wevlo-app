import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  linkWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { renderExtraPages } from "./pages-extra.js";
import { renderProCodeEditor, renderProGithubBuild } from "./ide-editors.js";

// ======================================================
// ১. আপনার Firebase Config এখানে বসান
// ======================================================
const firebaseConfig = {
  apiKey: "AIzaSyBXUklgCWDOujtIuSZvW_VDnEVu6WKFrNA",
  authDomain: "hwllo-cdde8.firebaseapp.com",
  projectId: "hwllo-cdde8",
  storageBucket: "hwllo-cdde8.firebasestorage.app",
  messagingSenderId: "814010361703",
  appId: "1:814010361703:web:7ae39494076f943b2a71c2"
};

let auth = null;
try {
  if (firebaseConfig.apiKey !== "AIzaSyBXUklgCWDOujtIuSZvW_VDnEVu6WKFrNA") {
    auth = getAuth(initializeApp(firebaseConfig));
  }
} catch (err) {
  console.warn("Firebase init skipped:", err.message);
}

// ======================================================
// ২. Global Application State (Demo Profile Removed)
// ======================================================
const savedProfile = JSON.parse(localStorage.getItem("wevlo_profile") || "null");
if (savedProfile && savedProfile.name === "Wevlo Developer") {
  savedProfile.name = "";
  localStorage.setItem("wevlo_profile", JSON.stringify(savedProfile));
}

const state = {
  route: window.location.hash || "#/",
  theme: localStorage.getItem("wevlo_theme") || "light",
  user: null,
  profile: savedProfile || {
    name: "",
    pkgPrefix: "com.wevlo",
    emailNotify: true,
    autoSave: true
  },
  plan: localStorage.getItem("wevlo_plan") || "Free",
  githubToken: sessionStorage.getItem("wevlo_gh_token") || null,
  githubUser: JSON.parse(sessionStorage.getItem("wevlo_gh_user") || "null"),
  githubRepos: [],
  repoFilter: "",
  selectedGhRepo: "",
  ghBranch: "main",
  ghIdeOpen: false,
  ghJavaCode: `import android.app.Activity;
import android.os.Bundle;
import android.view.Gravity;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setGravity(Gravity.CENTER);

        TextView tv = new TextView(this);
        tv.setText("Built with Wevlo GitHub IDE!");
        tv.setTextSize(20f);

        Button btn = new Button(this);
        btn.setText("Click Me");
        btn.setOnClickListener(v -> Toast.makeText(this, "Working!", Toast.LENGTH_SHORT).show());

        layout.addView(tv);
        layout.addView(btn);
        setContentView(layout);
    }
}`,
  projects: JSON.parse(localStorage.getItem("wevlo_projects") || "[]"),
  projSearch: "",
  activeProjectId: localStorage.getItem("wevlo_active_project") || null,
  activities: JSON.parse(localStorage.getItem("wevlo_activities") || "[]"),
  files: JSON.parse(localStorage.getItem("wevlo_files") || "[]"),
  payments: JSON.parse(localStorage.getItem("wevlo_payments") || "[]"),
  pushLogs: JSON.parse(localStorage.getItem("wevlo_push_logs") || "[]"),
  previewDevice: "phone",
  modalType: "html",
  wallet: JSON.parse(
    localStorage.getItem("wevlo_wallet") ||
      '{"balance":0,"deposited":0,"spent":0,"pending":0}'
  ),
  walletTab: "add",
  payMethod: "bKash",
  payAmount: 100,
  depositFileName: "",
  buildConfig: {
    buildType: "Debug",
    pkgName: "com.wevlo.app",
    versionName: "1.0.0",
    versionCode: Number(localStorage.getItem("wevlo_ver_code") || 1),
    fullscreen: false,
    pullToRefresh: true,
    keepScreenOn: false,
    statusColor: "#6d28d9",
    splash: true,
    swipeBack: true,
    loadingBar: true,
    confirmExit: false,
    jsEnabled: true,
    domStorage: true,
    fileAccess: true,
    geoLocation: false,
    zoomControls: false,
    userAgent: "Mobile (Default)",
    permInternet: true,
    permCamera: false,
    permMic: false,
    permLocation: false,
    permStorage: false,
    permContacts: false,
    permVibrate: true,
    permNotify: true,
    permBluetooth: false,
    bottomNav: false,
    bottomLabels: true,
    bottomTabsJson: "Home|#,Profile|#profile",
    customInject: false,
    customCode: "/* Custom CSS/JS */",
    encryption: false,
    encMode: "Basic",
    encPass: "",
    appLock: false,
    lockTimeout: "Immediately",
    lockPass: "",
    pushPro: false,
    pushTopic: "all_users",
    adsPro: false,
    adBanner: true,
    adInterstitial: false,
    adAppId: "",
    adBannerId: "",
    adInterId: ""
  },
  web2app: {
    url: "https://example.com",
    appName: "My Awesome App",
    pkgName: "com.wevlo.webapp",
    version: "1.0.0",
    iconDataUrl: "",
    splash: true,
    push: true,
    customTheme: false,
    orientation: "Auto (Portrait & Landscape)",
    signingMode: "own",
    hasKey: !!localStorage.getItem("wevlo_signing_key")
  }
};

// ======================================================
// ৩. Theme, Storage, Modal & Toast Helpers
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
  if (state.activeProjectId) {
    localStorage.setItem("wevlo_active_project", state.activeProjectId);
  }
}

function addActivity(text) {
  state.activities.unshift({ text, time: new Date().toLocaleTimeString() });
  state.activities = state.activities.slice(0, 8);
  localStorage.setItem("wevlo_activities", JSON.stringify(state.activities));
}

function getActiveProject() {
  return state.projects.find((p) => p.id === state.activeProjectId) || state.projects[0] || null;
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

window.showToast = (msg, type = "info") => {
  const t = document.getElementById("toast");
  t.textContent = msg;
  const bg =
    type === "error" ? "bg-rose-600" : type === "success" ? "bg-emerald-600" : "bg-slate-900";
  t.className = `fixed top-20 left-1/2 -translate-x-1/2 z-[60] text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg ${bg}`;
  setTimeout(() => t.classList.add("hidden"), 3000);
};

// ======================================================
// ৪. Firebase Gmail & GitHub Auth (Clean Account System)
// ======================================================
if (auth) {
  onAuthStateChanged(auth, (u) => {
    state.user = u;
    updateAccountUI();
  });
}

function updateAccountUI() {
  const av = document.getElementById("userAvatar");
  const accName = document.getElementById("accName");
  const accEmail = document.getElementById("accEmail");
  const btnLogout = document.getElementById("btnLogoutMenu");

  if (state.user) {
    const label = state.user.displayName || state.profile.name || state.user.email || "User";
    av.textContent = label[0].toUpperCase();
    accName.textContent = label;
    accEmail.textContent = state.user.email || state.githubUser?.login || "Signed in";
    btnLogout.classList.remove("hidden");
  } else if (state.githubUser) {
    av.textContent = state.githubUser.login[0].toUpperCase();
    accName.textContent = state.githubUser.login;
    accEmail.textContent = "GitHub Connected";
    btnLogout.classList.remove("hidden");
  } else {
    av.textContent = "W";
    accName.textContent = "Not Signed In";
    accEmail.textContent = "Sign in with Gmail or GitHub";
    btnLogout.classList.add("hidden");
  }

  document.getElementById("ghMenuLabel").textContent = state.githubToken
    ? `GitHub: @${state.githubUser?.login || "Connected"}`
    : "Connect GitHub Account";
}
updateAccountUI();

window.loginWithGoogle = async () => {
  if (!auth) return window.showToast("আগে app.js-এ Firebase Config বসান!", "error");
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
    window.showToast("Gmail লগইন সফল!", "success");
    document.getElementById("accountMenu").classList.add("hidden");
  } catch (e) {
    window.showToast(e.message, "error");
  }
};

window.loginWithGithub = async () => {
  if (!auth) return window.showToast("আগে app.js-এ Firebase Config বসান!", "error");
  const p = new GithubAuthProvider();
  p.addScope("repo");
  p.addScope("workflow");
  try {
    const res = auth.currentUser
      ? await linkWithPopup(auth.currentUser, p).catch(() => signInWithPopup(auth, p))
      : await signInWithPopup(auth, p);
    const cred = GithubAuthProvider.credentialFromResult(res);
    if (cred?.accessToken) {
      state.githubToken = cred.accessToken;
      sessionStorage.setItem("wevlo_gh_token", cred.accessToken);
      state.githubUser = await ghFetch("/user");
      sessionStorage.setItem("wevlo_gh_user", JSON.stringify(state.githubUser));
      await window.loadGithubRepos();
      updateAccountUI();
      window.render();
      window.showToast("GitHub কানেক্ট হয়েছে!", "success");
    }
    document.getElementById("accountMenu").classList.add("hidden");
  } catch (e) {
    window.showToast(e.message, "error");
  }
};

window.confirmLogout = () =>
  openConfirmModal({
    title: "Remove / Sign Out Account?",
    message: "This will sign out and clear your cached Gmail and GitHub session.",
    onConfirm: async () => {
      try {
        if (auth) await signOut(auth);
        if (window.indexedDB) indexedDB.deleteDatabase("firebaseLocalStorageDb");
      } catch {}
      state.user = null;
      state.githubToken = null;
      state.githubUser = null;
      state.githubRepos = [];
      state.ghIdeOpen = false;
      sessionStorage.clear();
      localStorage.removeItem("wevlo_profile");
      state.profile.name = "";
      document.getElementById("accountMenu").classList.add("hidden");
      updateAccountUI();
      window.render();
      window.showToast("Account removed & signed out!", "info");
    }
  });

// ======================================================
// ৫. Sidebar, Header & New Project Modal
// ======================================================
const sidebarMenu = [
  { route: "#/", label: "Dashboard", icon: "home" },
  { route: "#/projects", label: "My Projects", icon: "folder" },
  { route: "#/templates", label: "Templates", icon: "layout-grid" },
  { route: "#/web2app", label: "Website to App", icon: "globe" },
  { route: "#/editor", label: "Code Editor", icon: "code-2" },
  { route: "#/build", label: "Build APK", icon: "smartphone" },
  { route: "#/github-build", label: "GitHub Build", icon: "github" },
  { route: "#/preview", label: "Preview", icon: "eye" },
  { route: "#/wallet", label: "Wallet", icon: "wallet" },
  { route: "#/subscription", label: "Subscription", icon: "crown" },
  { route: "#/payments", label: "Payments", icon: "receipt" },
  { route: "#/push", label: "Push Notifications", icon: "bell-ring" },
  { route: "#/lab", label: "Lab", icon: "flask-conical" },
  { route: "#/files", label: "File Manager", icon: "folder-open" },
  { route: "#/icons", label: "Icon Library", icon: "shapes" },
  { route: "#/secure-converter", label: "Secure Converter", icon: "shield-alert" },
  { route: "#/docs", label: "Documentation", icon: "book-open" },
  { route: "#/privacy", label: "Privacy Policy", icon: "shield" },
  { route: "#/support", label: "Support", icon: "headphones" }
];

const pageTitles = Object.fromEntries([
  ...sidebarMenu.map((i) => [i.route, i.label]),
  ["#/settings", "Settings & Profile"]
]);

window.navigate = (r) => {
  state.route = r;
  window.location.hash = r;
  window.toggleDrawer(false);
  window.render();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

window.addEventListener("hashchange", () => {
  state.route = window.location.hash || "#/";
  window.render();
});

window.toggleDrawer = (open) => {
  document.getElementById("sidebar").classList.toggle("-translate-x-full", !open);
  document.getElementById("drawerOverlay").classList.toggle("hidden", !open);
};

window.toggleAccountMenu = () => {
  document.getElementById("accountMenu").classList.toggle("hidden");
};

function renderHeaderAndNav() {
  document.getElementById("sidebarNav").innerHTML = sidebarMenu
    .map(
      (item) => `
      <button onclick="navigate('${item.route}')" class="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition ${
        state.route === item.route
          ? "bg-purple-50 text-purple-700 font-bold"
          : "text-muted hover:bg-purple-500/5"
      }">
        <i data-lucide="${item.icon}" class="w-4 h-4"></i>
        <span>${item.label}</span>
      </button>`
    )
    .join("");

  document.querySelectorAll(".bnav-item").forEach((b) => {
    b.classList.toggle("active", b.dataset.bnav === state.route);
  });

  const subpages = [
    "#/build",
    "#/github-build",
    "#/subscription",
    "#/payments",
    "#/push",
    "#/lab",
    "#/files",
    "#/icons",
    "#/secure-converter",
    "#/docs",
    "#/privacy",
    "#/support"
  ];
  const hl = document.getElementById("headerLeft");
  if (subpages.includes(state.route)) {
    hl.innerHTML = `
      <button onclick="navigate('#/')" class="w-9 h-9 rounded-full surface-card flex items-center justify-center">
        <i data-lucide="arrow-left" class="w-4 h-4"></i>
      </button>
      <span class="font-extrabold text-lg">${pageTitles[state.route]}</span>`;
  } else {
    hl.innerHTML = `
      <button onclick="toggleDrawer(true)" class="lg:hidden p-2 -ml-2 rounded-xl">
        <i data-lucide="menu" class="w-5 h-5"></i>
      </button>
      <a href="#/" onclick="navigate('#/')" class="flex items-center gap-1 lg:hidden">
        <svg width="26" height="20" viewBox="0 0 36 28" fill="none">
          <path d="M3 5L10.5 22L18 9L25.5 22L33 5" stroke="url(#wGrad)" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="text-lg font-extrabold">evlo</span>
      </a>
      <span class="hidden lg:inline-block font-bold text-base">${pageTitles[state.route] || "Wevlo"}</span>`;
  }
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
  document.querySelectorAll(".ptype-card").forEach((c) => {
    c.classList.toggle("active", c.dataset.ptype === t);
  });
};

window.confirmCreateProject = () => {
  const name = document.getElementById("modalProjName").value.trim() || `Project ${state.projects.length + 1}`;
  state.projects.unshift({
    id: "proj_" + Date.now(),
    name,
    type: state.modalType,
    url: "https://example.com",
    html: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>${name}</title>\n</head>\n<body>\n  <div class="card">\n    <h1>${name}</h1>\n    <p>Built with Wevlo</p>\n    <button onclick="go()">Get Started</button>\n  </div>\n</body>\n</html>`,
    css: `body{font-family:sans-serif;background:#f6f6fb;display:grid;place-items:center;min-height:100vh;margin:0}\n.card{background:#fff;padding:28px;border-radius:20px;text-align:center;box-shadow:0 10px 25px rgba(109,40,217,.1)}\nbutton{background:#6d28d9;color:#fff;border:none;padding:10px 22px;border-radius:99px;font-weight:bold}`,
    js: `function go(){\n  alert("Hello from ${name}!");\n}`,
    updatedAt: new Date().toLocaleDateString()
  });
  state.activeProjectId = state.projects[0].id;
  saveProjects();
  addActivity(`Created "${name}"`);
  window.closeNewProjectModal();
  window.navigate(state.modalType === "webview" ? "#/web2app" : "#/editor");
};

// ======================================================
// ৬. GitHub REST API & APK Build Pipeline
// ======================================================
function toBase64(str) {
  let bin = "";
  new TextEncoder().encode(str).forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

async function ghFetch(path, options = {}) {
  const res = await fetch("https://api.github.com" + path, {
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
    state.githubRepos = await ghFetch("/user/repos?sort=updated&per_page=30");
  } catch {}
};

async function runGithubApkPipeline({
  repoName,
  appName,
  pkgName,
  versionName = "1.0.0",
  versionCode = 1,
  javaSource,
  permissions = ["INTERNET"],
  orientation = "unspecified",
  logElId,
  existingFullRepo = null,
  preserveExistingFiles = false
}) {
  const logEl = document.getElementById(logElId);
  if (logEl) {
    logEl.classList.remove("hidden");
    logEl.innerHTML = `
      <div class="flex items-center gap-2 font-bold mb-2">
        <span class="spinner"></span>
        <span id="${logElId}_title">Preparing build...</span>
      </div>
      <div class="w-full h-2 bg-purple-100 rounded-full overflow-hidden mb-2">
        <div id="${logElId}_bar" class="h-full bg-purple-600 transition-all duration-500" style="width:15%"></div>
      </div>
      <div id="${logElId}_logs" class="space-y-1"></div>`;
  }

  const logs = document.getElementById(`${logElId}_logs`);
  const setProg = (pct, msg) => {
    const b = document.getElementById(`${logElId}_bar`);
    const t = document.getElementById(`${logElId}_title`);
    if (b) b.style.width = pct + "%";
    if (t) t.textContent = msg;
  };
  const log = (h) => {
    if (logs) logs.innerHTML += `<div>• ${h}</div>`;
  };

  if (!state.githubToken) {
    setProg(0, "GitHub Required");
    return log(`<span class="text-rose-600 font-bold">আগে GitHub Account কানেক্ট করুন!</span>`);
  }

  try {
    const owner = state.githubUser?.login || (await ghFetch("/user")).login;
    let targetRepo = repoName;
    let branch = state.ghBranch || "main";

    if (existingFullRepo) {
      targetRepo = existingFullRepo.split("/")[1];
      log(`Using repository <b>${existingFullRepo}</b>`);
    } else {
      const r = await ghFetch("/user/repos", {
        method: "POST",
        body: JSON.stringify({ name: targetRepo, private: false, auto_init: true })
      });
      branch = r.default_branch || "main";
      log(`Created repository <b>${targetRepo}</b>`);
    }

    setProg(40, "Triggering Gradle workflow...");
    const workflowYaml = `name: Build APK\non:\n  push:\n    branches: [ "${branch}" ]\n  workflow_dispatch:\npermissions:\n  contents: write\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-java@v4\n        with:\n          distribution: 'temurin'\n          java-version: '17'\n      - uses: gradle/actions/setup-gradle@v4\n        with:\n          gradle-version: '8.7'\n      - run: gradle assembleDebug --no-daemon\n      - uses: softprops/action-gh-release@v2\n        with:\n          tag_name: v${versionName}-\${{ github.run_number }}\n          files: app/build/outputs/apk/debug/app-debug.apk\n`;

    let filesToPush = [{ path: ".github/workflows/wevlo-build.yml", content: workflowYaml }];

    if (!preserveExistingFiles) {
      const permXml = permissions.map((p) => `  <uses-permission android:name="android.permission.${p}" />`).join("\n");
      const orientAttr = orientation.includes("Portrait")
        ? 'android:screenOrientation="portrait"'
        : orientation.includes("Landscape")
        ? 'android:screenOrientation="landscape"'
        : "";
      const pkgPath = pkgName.replace(/\./g, "/");
      filesToPush = [
        {
          path: "settings.gradle",
          content: `pluginManagement {\n  repositories { google(); mavenCentral(); gradlePluginPortal() }\n}\ndependencyResolutionManagement {\n  repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)\n  repositories { google(); mavenCentral() }\n}\nrootProject.name = "WevloApp"\ninclude ':app'\n`
        },
        {
          path: "build.gradle",
          content: `plugins {\n  id 'com.android.application' version '8.5.2' apply false\n}\n`
        },
        {
          path: "gradle.properties",
          content: `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8\nandroid.nonTransitiveRClass=true\n`
        },
        {
          path: "app/build.gradle",
          content: `plugins {\n  id 'com.android.application'\n}\nandroid {\n  namespace '${pkgName}'\n  compileSdk 34\n  defaultConfig {\n    applicationId "${pkgName}"\n    minSdk 24\n    targetSdk 34\n    versionCode ${versionCode}\n    versionName "${versionName}"\n  }\n  compileOptions {\n    sourceCompatibility JavaVersion.VERSION_17\n    targetCompatibility JavaVersion.VERSION_17\n  }\n}\n`
        },
        {
          path: "app/src/main/AndroidManifest.xml",
          content: `<?xml version="1.0" encoding="utf-8"?>\n<manifest xmlns:android="http://schemas.android.com/apk/res/android">\n${permXml}\n  <application android:label="${appName}" android:usesCleartextTraffic="true" android:theme="@android:style/Theme.DeviceDefault.Light.NoActionBar">\n    <activity android:name=".MainActivity" android:exported="true" ${orientAttr} android:configChanges="orientation|screenSize|keyboardHidden">\n      <intent-filter>\n        <action android:name="android.intent.action.MAIN" />\n        <category android:name="android.intent.category.LAUNCHER" />\n      </intent-filter>\n    </activity>\n  </application>\n</manifest>\n`
        },
        {
          path: `app/src/main/java/${pkgPath}/MainActivity.java`,
          content: `package ${pkgName};\n\n${javaSource.replace(/^package\s+[\w.]+;\s*/m, "")}`
        },
        ...filesToPush
      ];
    }

    for (const f of filesToPush) {
      let sha;
      try {
        sha = (await ghFetch(`/repos/${owner}/${targetRepo}/contents/${f.path}?ref=${branch}`)).sha;
      } catch {}
      await ghFetch(`/repos/${owner}/${targetRepo}/contents/${f.path}`, {
        method: "PUT",
        body: JSON.stringify({
          message: `Wevlo update ${f.path}`,
          content: toBase64(f.content),
          branch,
          ...(sha ? { sha } : {})
        })
      });
    }

    setProg(70, "Compiling APK on GitHub Actions...");
    log(
      `Workflow running (<a href="https://github.com/${owner}/${targetRepo}/actions" target="_blank" class="text-purple-400 underline font-bold">Live Logs</a>)`
    );

    const timer = setInterval(async () => {
      try {
        const runs = await ghFetch(`/repos/${owner}/${targetRepo}/actions/runs`);
        const latest = runs.workflow_runs?.[0];
        if (latest?.status === "completed") {
          clearInterval(timer);
          if (latest.conclusion === "success") {
            const rel = await ghFetch(`/repos/${owner}/${targetRepo}/releases/latest`);
            const apk = rel.assets?.find((a) => a.name.endsWith(".apk"));
            if (apk) {
              setProg(100, "Build Completed!");
              state.buildConfig.versionCode += 1;
              localStorage.setItem("wevlo_ver_code", state.buildConfig.versionCode);
              addActivity(`Built APK for ${appName}`);
              if (logs) {
                logs.innerHTML += `
                  <div class="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-slate-900">
                    <p class="font-bold text-emerald-800 mb-2">APK Ready!</p>
                    <a href="${apk.browser_download_url}" class="inline-block btn-purple px-4 py-2 rounded-full text-xs font-bold">
                      Download APK (${(apk.size / 1048576).toFixed(2)} MB)
                    </a>
                  </div>`;
              }
            }
          } else {
            setProg(100, "Build Failed");
            log(`<span class="text-rose-500 font-bold">Failed (${latest.conclusion})</span>`);
          }
        }
      } catch {}
    }, 7000);
  } catch (e) {
    log(`<span class="text-rose-500 font-bold">${e.message}</span>`);
  }
}

// ====== PART 1 END — নিচে PART 2 পেস্ট করুন ======
// ======================================================
// ৭. Core Page Renderers (Part 2 of 2)
// ======================================================
function renderDashboard() {
  const c = state.projects.length;
  return `
    <!-- Hero Card -->
    <div class="hero-lavender rounded-[24px] p-5 flex items-start justify-between gap-3">
      <div>
        <span class="inline-flex items-center gap-1 bg-white/80 text-purple-700 text-[11px] font-bold px-3 py-1 rounded-full mb-2.5">
          <i data-lucide="zap" class="w-3 h-3"></i> Welcome to Wevlo
        </span>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
          Build Something <span class="text-purple-700">Amazing</span>
        </h1>
        <div class="flex flex-wrap gap-2.5 mt-4">
          <button onclick="openNewProjectModal()" class="btn-purple px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold inline-flex items-center gap-1.5">
            Create New Project <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </button>
          <button onclick="navigate('#/github-build')" class="bg-white text-slate-900 border border-[#e3dff2] px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold inline-flex items-center gap-2">
            <i data-lucide="github" class="w-4 h-4"></i> GitHub Build
          </button>
        </div>
      </div>
      <div class="icon-box-purple w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
        <i data-lucide="rocket" class="w-6 h-6"></i>
      </div>
    </div>

    <!-- 2x2 Stats Grid -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      <div class="wevlo-card p-4 flex items-center gap-3">
        <span class="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
          <i data-lucide="folder" class="w-5 h-5"></i>
        </span>
        <div>
          <p class="text-xs text-muted">Total Projects</p>
          <p class="text-xl font-extrabold">${c}</p>
        </div>
      </div>
      <div class="wevlo-card p-4 flex items-center gap-3">
        <span class="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <i data-lucide="download" class="w-5 h-5"></i>
        </span>
        <div>
          <p class="text-xs text-muted">Templates Owned</p>
          <p class="text-xl font-extrabold">0</p>
        </div>
      </div>
      <div onclick="navigate('#/wallet')" class="wevlo-card p-4 flex items-center gap-3 cursor-pointer">
        <span class="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
          <i data-lucide="wallet" class="w-5 h-5"></i>
        </span>
        <div>
          <p class="text-xs text-muted">Wallet Balance</p>
          <p class="text-xl font-extrabold">৳${state.wallet.balance}</p>
        </div>
      </div>
      <div onclick="navigate('#/subscription')" class="wevlo-card p-4 flex items-center gap-3 cursor-pointer">
        <span class="w-11 h-11 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
          <i data-lucide="crown" class="w-5 h-5"></i>
        </span>
        <div>
          <p class="text-xs text-muted">Current Plan</p>
          <p class="text-lg font-extrabold leading-tight">${state.plan}</p>
          <p class="text-[11px] text-muted">${state.plan === "Free" ? "No paid plan" : "Pro Active"}</p>
        </div>
      </div>
    </div>

    <!-- Analytics Overview -->
    <div class="wevlo-card p-5">
      <div class="flex justify-between items-center mb-3">
        <h2 class="font-bold text-base flex items-center gap-2">
          <i data-lucide="bar-chart-2" class="w-5 h-5 text-purple-600"></i> Analytics Overview
        </h2>
        <span class="text-xs font-semibold bg-purple-500/10 px-3 py-1 rounded-full">Last 30 days</span>
      </div>
      <div class="flex gap-4 text-xs mb-3">
        <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-purple-600"></span> Projects</span>
        <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Edited</span>
      </div>
      ${
        c === 0
          ? `<p class="text-center text-sm text-muted py-5">Create your first project to see activity here.</p>`
          : `<div class="h-20 flex items-end gap-2">${[40, 65, 45, 85, 55, 95, 75]
              .map(
                (h) =>
                  `<div class="flex-1 bg-purple-500/15 rounded-t-lg relative" style="height:${h}%"><div class="absolute bottom-0 inset-x-0 bg-purple-600 rounded-t-lg" style="height:60%"></div></div>`
              )
              .join("")}</div>`
      }
    </div>

    <!-- Quick Actions -->
    <div class="wevlo-card p-5">
      <h2 class="font-bold text-base flex items-center gap-2 mb-4">
        <i data-lucide="zap" class="w-5 h-5 text-purple-600"></i> Quick Actions
      </h2>
      <div class="grid grid-cols-4 gap-2.5">
        ${[
          ["Create Project", "rocket", "bg-purple-50 text-purple-600", "openNewProjectModal()"],
          ["Code Editor", "code-2", "bg-sky-50 text-sky-600", "navigate('#/editor')"],
          ["Upload Files", "upload", "bg-emerald-50 text-emerald-600", "navigate('#/files')"],
          ["Templates", "layout-grid", "bg-amber-50 text-amber-500", "navigate('#/templates')"],
          ["Build APK", "smartphone", "bg-rose-50 text-rose-500", "navigate('#/build')"],
          ["Preview", "eye", "bg-indigo-50 text-indigo-600", "navigate('#/preview')"],
          ["Wallet", "wallet", "bg-emerald-50 text-emerald-600", "navigate('#/wallet')"],
          ["Support", "headphones", "bg-sky-50 text-sky-600", "navigate('#/support')"]
        ]
          .map(
            ([l, ic, bg, act]) => `
            <button onclick="${act}" class="border border-soft rounded-2xl p-3 flex flex-col items-center gap-2 hover:border-purple-400 transition">
              <span class="w-10 h-10 rounded-xl ${bg} flex items-center justify-center"><i data-lucide="${ic}" class="w-5 h-5"></i></span>
              <span class="text-[11px] font-bold leading-tight text-center">${l}</span>
            </button>`
          )
          .join("")}
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="wevlo-card p-5">
      <h3 class="font-bold text-sm flex items-center gap-2 mb-2">
        <i data-lucide="history" class="w-4 h-4 text-purple-600"></i> Recent Activity
      </h3>
      ${
        state.activities.length === 0
          ? `<p class="text-xs text-muted">Nothing yet.</p>`
          : state.activities
              .slice(0, 4)
              .map(
                (a) =>
                  `<div class="text-xs py-1.5 border-b last:border-0 border-soft flex justify-between"><span>${a.text}</span><span class="text-muted">${a.time}</span></div>`
              )
              .join("")
      }
    </div>

    <!-- Recent Projects & System Status -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="wevlo-card p-5">
        <div class="flex justify-between items-center mb-3">
          <h3 class="font-bold text-sm flex items-center gap-2"><i data-lucide="folder" class="w-4 h-4 text-purple-600"></i> Recent Projects</h3>
          <button onclick="navigate('#/projects')" class="text-xs font-bold text-purple-600">View All →</button>
        </div>
        ${
          c === 0
            ? `<p class="text-xs text-muted">No projects yet — create one to get started.</p>`
            : state.projects
                .slice(0, 3)
                .map(
                  (p) =>
                    `<div onclick="openProjectInEditor('${p.id}')" class="flex justify-between py-2 border-b last:border-0 border-soft cursor-pointer text-xs"><b>${p.name}</b><span class="text-purple-600 font-bold">Open →</span></div>`
                )
                .join("")
        }
      </div>

      <div class="wevlo-card p-5">
        <div class="flex justify-between items-center mb-3">
          <h3 class="font-bold text-sm flex items-center gap-2"><i data-lucide="activity" class="w-4 h-4 text-purple-600"></i> System Status</h3>
          <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
            navigator.onLine ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          }">${navigator.onLine ? "Online" : "Offline"}</span>
        </div>
        <div class="grid grid-cols-3 gap-2 text-center text-xs font-bold">
          <div class="p-3 rounded-xl border border-soft"><i data-lucide="server" class="w-4 h-4 mx-auto text-purple-600 mb-1"></i>${state.githubToken ? "GitHub OK" : "Ready"}</div>
          <div class="p-3 rounded-xl border border-soft"><i data-lucide="folder" class="w-4 h-4 mx-auto text-purple-600 mb-1"></i>${c}</div>
          <div class="p-3 rounded-xl border border-soft"><i data-lucide="shield-check" class="w-4 h-4 mx-auto text-purple-600 mb-1"></i>Secure</div>
        </div>
      </div>
    </div>`;
}

function renderProjects() {
  const filtered = state.projects.filter((p) =>
    p.name.toLowerCase().includes(state.projSearch.toLowerCase())
  );
  if (state.projects.length === 0) {
    return `
      <div class="wevlo-card p-6 border-2 border-dashed border-soft text-center space-y-4">
        <h2 class="text-xl font-extrabold">No projects yet</h2>
        <p class="text-xs text-muted">Pick a starting point — you can change everything later.</p>
        <div class="space-y-2.5 max-w-md mx-auto text-left">
          <button onclick="openNewProjectModal('html')" class="w-full wevlo-card p-4 font-bold text-sm">HTML page <span class="block text-xs font-normal text-muted">Single page</span></button>
          <button onclick="openNewProjectModal('multifile')" class="w-full wevlo-card p-4 font-bold text-sm">Multi file <span class="block text-xs font-normal text-muted">Empty HTML/CSS/JS</span></button>
          <button onclick="openNewProjectModal('webview')" class="w-full wevlo-card p-4 font-bold text-sm">WebView app <span class="block text-xs font-normal text-muted">Ready for APK</span></button>
        </div>
        <button onclick="navigate('#/templates')" class="text-xs font-bold text-purple-600">or browse templates →</button>
      </div>`;
  }
  return `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-xl font-extrabold">My Projects (${filtered.length})</h1>
      <div class="flex items-center gap-2">
        <input value="${state.projSearch}" oninput="state.projSearch=this.value; render()" placeholder="Search projects..." class="border border-soft rounded-full px-4 py-1.5 text-xs bg-transparent" />
        <button onclick="openNewProjectModal()" class="btn-purple px-4 py-2 rounded-full text-xs font-bold">+ New</button>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      ${filtered
        .map(
          (p) => `
        <div class="wevlo-card p-5 space-y-3">
          <div class="flex justify-between">
            <div><h3 class="font-bold text-base">${p.name}</h3><p class="text-xs text-muted uppercase">${p.type} • ${p.updatedAt}</p></div>
            <button onclick="confirmDeleteProject('${p.id}')" class="text-rose-500 p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
          </div>
          <div class="flex flex-wrap gap-2">
            <button onclick="openProjectInEditor('${p.id}')" class="btn-purple px-4 py-1.5 rounded-full text-xs font-bold">Edit Code</button>
            <button onclick="openProjectInPreview('${p.id}')" class="border border-soft px-3.5 py-1.5 rounded-full text-xs font-bold">Preview</button>
            <button onclick="openProjectInBuild('${p.id}')" class="bg-purple-50 text-purple-700 px-3.5 py-1.5 rounded-full text-xs font-bold">Build APK</button>
          </div>
        </div>`
        )
        .join("")}
    </div>`;
}

function renderBuildApk() {
  const proj = getActiveProject();
  if (!proj) {
    return `
      <div class="wevlo-card p-6 space-y-6">
        <div class="flex items-center gap-2 font-bold text-base"><i data-lucide="settings" class="w-5 h-5 text-purple-600"></i> Build Configuration</div>
        <div class="py-10 text-center space-y-3">
          <i data-lucide="folder" class="w-10 h-10 mx-auto text-muted"></i>
          <h3 class="font-bold">No projects to build</h3>
          <p class="text-xs text-muted">Create a project first, then build it into an APK.</p>
          <button onclick="navigate('#/projects')" class="btn-purple px-6 py-2.5 rounded-full text-xs font-bold">Go to My Projects</button>
        </div>
      </div>`;
  }
  const b = state.buildConfig;
  const toggleRow = (label, key, pro = false) => `
    <div class="flex justify-between items-center py-1">
      <span class="flex items-center gap-1.5">${label} ${pro ? '<span class="pro-badge">PRO</span>' : ""}</span>
      <label class="toggle-switch">
        <input type="checkbox" ${b[key] ? "checked" : ""} onchange="if(${pro} && state.plan!=='Pro'){this.checked=false;navigate('#/subscription');showToast('Wevlo Pro প্রয়োজন!','error')}else{state.buildConfig['${key}']=this.checked}">
        <span class="toggle-slider"></span>
      </label>
    </div>`;

  return `
    <div class="wevlo-card p-5 space-y-4 text-xs">
      <div class="flex justify-between items-center">
        <span class="font-bold text-base flex items-center gap-2"><i data-lucide="settings" class="w-5 h-5 text-purple-600"></i> Build APK (${proj.name})</span>
        <span class="font-bold text-purple-600">v${b.versionName} (${b.versionCode})</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div><label class="font-bold text-muted">Package Name</label><input value="${b.pkgName}" oninput="state.buildConfig.pkgName=this.value" class="w-full mt-1 border border-soft rounded-xl px-3 py-2 bg-transparent" /></div>
        <div><label class="font-bold text-muted">GitHub Repo Name</label><input id="bRepoName" value="wevlo-${proj.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}" class="w-full mt-1 border border-soft rounded-xl px-3 py-2 bg-transparent" /></div>
        <div><label class="font-bold text-muted">Build Type</label><select onchange="state.buildConfig.buildType=this.value" class="w-full mt-1 border border-soft rounded-xl px-3 py-2 bg-transparent"><option>Debug</option><option>Release</option></select></div>
      </div>

      <details class="border border-soft rounded-2xl p-3.5" open>
        <summary class="font-bold cursor-pointer">1. Display &amp; Behavior (8 settings)</summary>
        <div class="mt-3 space-y-2">${toggleRow("Fullscreen Mode", "fullscreen")}${toggleRow("Pull-to-Refresh", "pullToRefresh")}${toggleRow("Keep Screen On", "keepScreenOn")}${toggleRow("Show Splash Screen", "splash")}${toggleRow("Swipe Back Navigation", "swipeBack")}${toggleRow("Loading Progress Bar", "loadingBar")}${toggleRow("Confirm Exit Dialog", "confirmExit")}<div><label class="font-bold text-muted">Status Bar Color</label><input type="color" value="${b.statusColor}" onchange="state.buildConfig.statusColor=this.value" class="ml-2 align-middle" /></div></div>
      </details>

      <details class="border border-soft rounded-2xl p-3.5">
        <summary class="font-bold cursor-pointer">2. Web Engine (6 settings)</summary>
        <div class="mt-3 space-y-2">${toggleRow("JavaScript Enabled", "jsEnabled")}${toggleRow("DOM Storage", "domStorage")}${toggleRow("File Access / Upload", "fileAccess")}${toggleRow("Geolocation API", "geoLocation")}${toggleRow("Zoom Controls", "zoomControls")}<div><label class="font-bold text-muted">User-Agent</label><select onchange="state.buildConfig.userAgent=this.value" class="ml-2 border border-soft rounded-lg px-2 py-1 bg-transparent"><option>Mobile (Default)</option><option>Desktop Mode</option></select></div></div>
      </details>

      <details class="border border-soft rounded-2xl p-3.5">
        <summary class="font-bold cursor-pointer">3. Permissions (9 settings)</summary>
        <div class="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
          ${[["Internet", "permInternet"], ["Camera", "permCamera"], ["Microphone", "permMic"], ["Location", "permLocation"], ["Storage", "permStorage"], ["Contacts", "permContacts"], ["Vibrate", "permVibrate"], ["Notifications", "permNotify"], ["Bluetooth", "permBluetooth"]]
            .map(([l, k]) => `<label class="flex items-center gap-2"><input type="checkbox" ${b[k] ? "checked" : ""} onchange="state.buildConfig['${k}']=this.checked" /> ${l}</label>`)
            .join("")}
        </div>
      </details>

      <details class="border border-soft rounded-2xl p-3.5">
        <summary class="font-bold cursor-pointer">4. Bottom Navigation (3 settings)</summary>
        <div class="mt-3 space-y-2">${toggleRow("Enable Bottom Nav", "bottomNav")}${toggleRow("Show Tab Labels", "bottomLabels")}<input value="${b.bottomTabsJson}" oninput="state.buildConfig.bottomTabsJson=this.value" class="w-full border border-soft rounded-xl px-3 py-2 bg-transparent" /></div>
      </details>

      <details class="border border-soft rounded-2xl p-3.5">
        <summary class="font-bold cursor-pointer">5. Custom Code (2 settings)</summary>
        <div class="mt-3 space-y-2">${toggleRow("Inject Custom Code", "customInject")}<textarea rows="3" oninput="state.buildConfig.customCode=this.value" class="w-full border border-soft rounded-xl p-2 font-mono bg-transparent">${b.customCode}</textarea></div>
      </details>

      <details class="border border-soft rounded-2xl p-3.5">
        <summary class="font-bold cursor-pointer">6. Encryption AES-256-GCM (3) <span class="pro-badge ml-1">PRO</span></summary>
        <div class="mt-3 space-y-2">${toggleRow("Encrypt App Assets", "encryption", true)}<div class="flex gap-4"><label><input type="radio" name="em" checked onchange="state.buildConfig.encMode='Basic'"> Basic</label><label><input type="radio" name="em" onchange="state.buildConfig.encMode='Private'"> Private Lock</label></div><input type="password" placeholder="Passphrase (Private mode)" oninput="state.buildConfig.encPass=this.value" class="w-full border border-soft rounded-xl px-3 py-2 bg-transparent" /></div>
      </details>

      <details class="border border-soft rounded-2xl p-3.5">
        <summary class="font-bold cursor-pointer">7. App Lock (3) <span class="pro-badge ml-1">PRO</span></summary>
        <div class="mt-3 space-y-2">${toggleRow("Enable App Lock", "appLock", true)}<select onchange="state.buildConfig.lockTimeout=this.value" class="w-full border border-soft rounded-xl px-3 py-2 bg-transparent"><option>Immediately</option><option>After 1 Minute</option></select><input type="password" placeholder="4-Digit Passcode" oninput="state.buildConfig.lockPass=this.value" class="w-full border border-soft rounded-xl px-3 py-2 bg-transparent" /></div>
      </details>

      <details class="border border-soft rounded-2xl p-3.5">
        <summary class="font-bold cursor-pointer">8. Push Notifications (2) <span class="pro-badge ml-1">PRO</span></summary>
        <div class="mt-3 space-y-2">${toggleRow("Enable FCM Push", "pushPro", true)}<input value="${b.pushTopic}" oninput="state.buildConfig.pushTopic=this.value" class="w-full border border-soft rounded-xl px-3 py-2 bg-transparent" /></div>
      </details>

      <details class="border border-soft rounded-2xl p-3.5">
        <summary class="font-bold cursor-pointer">9. Ads — AdMob (6) <span class="pro-badge ml-1">PRO</span></summary>
        <div class="mt-3 space-y-2">${toggleRow("Enable Ads", "adsPro", true)}${toggleRow("Banner Ad", "adBanner", true)}${toggleRow("Interstitial Ad", "adInterstitial", true)}<input placeholder="AdMob App ID" oninput="state.buildConfig.adAppId=this.value" class="w-full border border-soft rounded-xl px-3 py-2 bg-transparent" /><input placeholder="Banner Unit ID" oninput="state.buildConfig.adBannerId=this.value" class="w-full border border-soft rounded-xl px-3 py-2 bg-transparent" /><input placeholder="Interstitial Unit ID" oninput="state.buildConfig.adInterId=this.value" class="w-full border border-soft rounded-xl px-3 py-2 bg-transparent" /></div>
      </details>

      <button onclick="buildProjectToApk('${proj.id}')" class="w-full btn-purple py-3.5 rounded-full text-sm font-bold">Start Build APK →</button>
      <div id="buildProjLog" class="hidden border border-soft rounded-2xl p-4 space-y-1"></div>
    </div>`;
}

function renderWeb2App() {
  const w = state.web2app;
  return `
    <div class="hero-lavender rounded-[24px] p-5 flex justify-between items-start gap-3">
      <div><span class="inline-block bg-white/80 text-purple-700 text-[11px] font-bold px-3 py-1 rounded-full mb-2">⚡ Fast &amp; Easy Conversion</span><h1 class="text-xl sm:text-2xl font-extrabold text-slate-900">Turn Your Website Into an <span class="text-purple-700">Android App</span></h1></div>
      <div class="icon-box-purple w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"><i data-lucide="globe" class="w-6 h-6"></i></div>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div class="lg:col-span-7 wevlo-card p-5 space-y-3.5 text-xs">
        <h2 class="font-bold text-base">Website Information</h2>
        <div><label class="font-bold">Website URL *</label><div class="flex mt-1"><input value="${w.url}" oninput="updateW2A('url',this.value)" class="flex-1 border border-soft rounded-l-xl px-3 py-2.5 bg-transparent" /><span class="btn-purple px-3.5 flex items-center rounded-r-xl"><i data-lucide="globe" class="w-4 h-4"></i></span></div></div>
        <div><label class="font-bold">App Name</label><input value="${w.appName}" oninput="updateW2A('appName',this.value)" class="w-full mt-1 border border-soft rounded-xl px-3 py-2.5 bg-transparent" /></div>
        <label class="border-2 border-dashed border-soft rounded-2xl p-4 flex flex-col items-center cursor-pointer"><input type="file" accept="image/*" class="hidden" onchange="handleAppIconUpload(event)" /><i data-lucide="upload-cloud" class="w-6 h-6 text-purple-600 mb-1"></i><b>Upload Icon (PNG, JPG 512×512)</b></label>
        ${[["Show Splash Screen", "splash"], ["Enable Push Notifications", "push"], ["Use Custom Theme", "customTheme"]].map(([l, k]) => `<div class="flex justify-between items-center font-semibold"><span>${l}</span><label class="toggle-switch"><input type="checkbox" ${w[k] ? "checked" : ""} onchange="updateW2A('${k}',this.checked)"><span class="toggle-slider"></span></label></div>`).join("")}
        <div><label class="font-bold">Orientation</label><select onchange="updateW2A('orientation',this.value)" class="w-full mt-1 border border-soft rounded-xl px-3 py-2 bg-transparent"><option>Auto (Portrait & Landscape)</option><option>Portrait Only</option><option>Landscape Only</option></select></div>
        <details><summary class="font-bold text-purple-600 cursor-pointer">Package name &amp; version</summary><div class="grid grid-cols-2 gap-2 mt-2"><input value="${w.pkgName}" oninput="updateW2A('pkgName',this.value)" class="border border-soft rounded-xl px-3 py-2 bg-transparent" /><input value="${w.version}" oninput="updateW2A('version',this.value)" class="border border-soft rounded-xl px-3 py-2 bg-transparent" /></div></details>
        <div class="border border-soft rounded-2xl p-3.5 space-y-2">
          <b>Signing key</b>
          <label class="flex justify-between p-2 rounded-xl border ${w.signingMode === "own" ? "border-purple-600" : "border-soft"}"><span><input type="radio" name="ws" ${w.signingMode === "own" ? "checked" : ""} onchange="updateW2A('signingMode','own');render()"> My own key</span><span class="text-purple-600 font-bold">Recommended</span></label>
          <label class="flex gap-2 p-2 rounded-xl border ${w.signingMode === "shared" ? "border-purple-600" : "border-soft"}"><input type="radio" name="ws" ${w.signingMode === "shared" ? "checked" : ""} onchange="updateW2A('signingMode','shared');render()"> Wevlo shared key</label>
          <button onclick="generateLocalKey()" class="w-full btn-purple py-2 rounded-full font-bold">${w.hasKey ? "✓ Key Ready" : "✨ Create my signing key"}</button>
          <button onclick="importExistingKey()" class="w-full border border-soft py-2 rounded-full font-bold">I already have a key</button>
        </div>
        <button onclick="startWeb2AppBuild()" class="w-full btn-purple py-3.5 rounded-full text-sm font-bold">🚀 Convert to Android App →</button>
        <div id="w2aLog" class="hidden border border-soft rounded-2xl p-4"></div>
      </div>
      <div class="lg:col-span-5 space-y-4">
        <div class="wevlo-card p-5 flex flex-col items-center">
          <h3 class="w-full font-bold text-sm mb-3">Live Preview</h3>
          <div class="bg-[#f3f1fb] w-full rounded-2xl py-6 flex justify-center">
            <div class="phone-mockup flex flex-col"><div class="phone-notch"></div><div class="btn-purple pt-6 pb-2.5 px-3 flex justify-between text-white"><div class="flex items-center gap-2">${w.iconDataUrl ? `<img src="${w.iconDataUrl}" class="w-5 h-5 rounded-md bg-white object-cover"/>` : `<span class="w-5 h-5 rounded-md bg-white text-purple-700 font-extrabold text-[10px] flex items-center justify-center">W</span>`}<span id="mockAppName" class="text-xs font-bold truncate max-w-[120px]">${w.appName}</span></div><i data-lucide="menu" class="w-3.5 h-3.5"></i></div><div class="flex-1 flex flex-col items-center justify-center p-4 text-center space-y-2"><p class="font-extrabold text-sm">Welcome to ${w.appName}</p><p class="text-[11px] text-slate-400 break-all">${w.url}</p><span class="btn-purple px-4 py-1.5 rounded-full text-[11px] font-bold">Get Started</span></div></div>
          </div>
        </div>
        <div class="wevlo-card p-4 grid grid-cols-2 gap-3 text-[11px] font-bold">
          <div>⚡ Ultra Fast Conversion</div><div>🛡 100% Secure &amp; Reliable</div><div>📱 Play Store Ready APK</div><div>🎧 Help when you need it</div>
        </div>
      </div>
    </div>`;
}

function renderWallet() {
  const w = state.wallet;
  return `
    <div class="hero-lavender rounded-[24px] p-5 flex justify-between items-center"><div><h1 class="text-2xl font-extrabold text-slate-900">Digital <span class="text-purple-700">Wallet</span></h1><p class="text-xs text-slate-600">Manage balance, add funds and track transactions.</p></div><div class="icon-box-purple w-12 h-12 rounded-2xl flex items-center justify-center"><i data-lucide="wallet" class="w-6 h-6"></i></div></div>
    <div class="grid grid-cols-2 gap-3.5"><div class="wevlo-card p-4"><b>Available Balance</b><p class="text-lg font-extrabold text-purple-700">৳${w.balance.toFixed(2)}</p></div><div class="wevlo-card p-4"><b>Total Deposited</b><p class="text-lg font-extrabold">৳${w.deposited}</p></div><div class="wevlo-card p-4"><b>Total Spent</b><p class="text-lg font-extrabold">৳${w.spent}</p></div><div class="wevlo-card p-4"><b>Pending Deposits</b><p class="text-lg font-extrabold">${w.pending}</p></div></div>
    <div class="grid grid-cols-2 gap-2.5"><button onclick="state.walletTab='add';render()" class="py-2.5 rounded-2xl font-bold text-xs ${state.walletTab === "add" ? "btn-purple" : "wevlo-card"}">Add Funds</button><button onclick="state.walletTab='history';render()" class="py-2.5 rounded-2xl font-bold text-xs ${state.walletTab === "history" ? "btn-purple" : "wevlo-card"}">Transaction History</button></div>
    ${
      state.walletTab === "add"
        ? `<div class="wevlo-card p-5 space-y-3.5"><div class="grid grid-cols-2 gap-2"><button onclick="state.payMethod='bKash';render()" class="py-2 rounded-xl font-bold text-xs ${state.payMethod === "bKash" ? "btn-purple" : "border border-soft"}">bKash</button><button onclick="state.payMethod='Nagad';render()" class="py-2 rounded-xl font-bold text-xs ${state.payMethod === "Nagad" ? "btn-purple" : "border border-soft"}">Nagad</button></div><div class="flex flex-wrap gap-2">${[50, 100, 200, 500, 1000].map((a) => `<button onclick="state.payAmount=${a};render()" class="px-4 py-1.5 rounded-full text-xs font-bold border ${state.payAmount === a ? "border-purple-600 text-purple-700" : "border-soft"}">৳${a}</button>`).join("")}</div><div class="bg-[#f3f0fc] text-slate-900 rounded-2xl p-3 flex justify-between text-xs font-bold"><span>Send Money (${state.payMethod}): 01700000000</span><button onclick="navigator.clipboard?.writeText('01700000000');showToast('Copied!','success')" class="bg-white px-3 py-1 rounded-full border">Copy</button></div><input id="trxInput" placeholder="Transaction ID (TrxID)" class="w-full border border-soft rounded-xl px-4 py-2.5 text-sm bg-transparent" /><label class="flex items-center gap-3 border border-soft rounded-xl p-2.5 text-xs cursor-pointer"><span class="px-3 py-1 rounded-lg border border-soft font-bold">Choose File</span><span class="text-muted">${state.depositFileName || "No file chosen"}</span><input type="file" accept="image/*" class="hidden" onchange="state.depositFileName=this.files[0]?.name||'';render()" /></label><button onclick="submitWalletDeposit()" class="w-full btn-purple py-3 rounded-full text-sm font-bold">Add Funds Now →</button><div class="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-3 text-xs">✓ Every deposit is checked by an admin before your balance changes.</div></div><div class="wevlo-card p-4 grid grid-cols-3 gap-2 text-center text-[11px] font-bold"><div>🛡 Secure &amp; Trusted</div><div>⚡ Reviewed fast</div><div>🎧 Support on request</div></div>`
        : `<div class="wevlo-card p-5 text-xs space-y-2">${state.payments.length === 0 ? `<p class="text-center text-muted py-6">No transactions yet.</p>` : state.payments.map((p) => `<div class="flex justify-between p-3 border border-soft rounded-xl"><b>${p.title}</b><span>৳${p.amount} • ${p.status}</span></div>`).join("")}</div>`
    }`;
}

function renderTemplates() {
  const list = [
    { name: "Portfolio Landing", color: "from-purple-500 to-indigo-600", badge: "Free" },
    { name: "E-Commerce Store", color: "from-emerald-500 to-teal-600", badge: "Popular" },
    { name: "News & Blog App", color: "from-sky-500 to-blue-600", badge: "WebView" }
  ];
  return `<h1 class="text-xl font-extrabold">Templates</h1><div class="grid grid-cols-1 md:grid-cols-3 gap-4">${list.map((t) => `<div class="wevlo-card overflow-hidden"><div class="h-32 bg-gradient-to-br ${t.color} p-4 flex flex-col justify-between text-white"><span class="self-start text-[10px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full">${t.badge}</span><div class="bg-white/15 backdrop-blur-sm rounded-xl p-2 text-xs font-bold">${t.name} Preview</div></div><div class="p-4 space-y-3"><h3 class="font-bold text-sm">${t.name}</h3><button onclick="cloneTemplate('${t.name}')" class="w-full btn-purple py-2 rounded-full text-xs font-bold">Use Template</button></div></div>`).join("")}</div>`;
}

function renderPreview() {
  const proj = getActiveProject();
  if (!proj) return `<div class="wevlo-card p-8 text-center text-xs text-muted">আগে একটি প্রজেক্ট তৈরি করুন।</div>`;
  const doc = `<!DOCTYPE html><html><head><style>${proj.css}</style></head><body>${proj.html}<script>${proj.js}<\/script></body></html>`;
  const w = { phone: "max-w-[360px]", tablet: "max-w-[700px]", desktop: "max-w-full" }[state.previewDevice];
  return `<div class="wevlo-card p-4 flex justify-between items-center"><b class="text-sm">${proj.name}</b><div class="flex gap-1.5">${["phone", "tablet", "desktop"].map((d) => `<button onclick="state.previewDevice='${d}';render()" class="px-3 py-1 rounded-full text-xs font-bold capitalize ${state.previewDevice === d ? "btn-purple" : "border border-soft"}">${d}</button>`).join("")}</div></div><div class="flex justify-center"><iframe class="${w} w-full h-[520px] bg-white rounded-3xl border-4 border-slate-800 shadow-xl" srcdoc="${doc.replace(/"/g, "&quot;")}"></iframe></div>`;
}

function renderSettings() {
  const pr = state.profile;
  return `
    <div class="wevlo-card p-5 space-y-4 text-xs">
      <h1 class="text-xl font-extrabold">Settings &amp; Profile</h1>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label class="font-bold text-muted">Display Name</label><input value="${pr.name}" placeholder="Enter your name" oninput="state.profile.name=this.value" class="w-full mt-1 border border-soft rounded-xl px-3 py-2 bg-transparent" /></div>
        <div><label class="font-bold text-muted">Default Package Prefix</label><input value="${pr.pkgPrefix}" oninput="state.profile.pkgPrefix=this.value" class="w-full mt-1 border border-soft rounded-xl px-3 py-2 bg-transparent" /></div>
      </div>
      <div class="flex justify-between items-center"><b>Auto-save Editor Changes</b><label class="toggle-switch"><input type="checkbox" ${pr.autoSave ? "checked" : ""} onchange="state.profile.autoSave=this.checked"><span class="toggle-slider"></span></label></div>
      <div class="flex justify-between items-center"><b>Email Build Notifications</b><label class="toggle-switch"><input type="checkbox" ${pr.emailNotify ? "checked" : ""} onchange="state.profile.emailNotify=this.checked"><span class="toggle-slider"></span></label></div>
      <div class="flex flex-wrap gap-2.5 pt-2">
        <button onclick="saveUserProfile()" class="btn-purple px-5 py-2 rounded-full font-bold">Save Profile</button>
        <button onclick="loginWithGoogle()" class="border border-soft px-4 py-2 rounded-full font-bold">Connect Gmail</button>
        <button onclick="loginWithGithub()" class="border border-soft px-4 py-2 rounded-full font-bold">Connect GitHub</button>
        <button onclick="confirmLogout()" class="border border-rose-300 text-rose-600 px-4 py-2 rounded-full font-bold">Remove / Sign Out</button>
      </div>
    </div>`;
}

// ======================================================
// ৮. Global Action Bindings & Full-Screen Router
// ======================================================
window.openProjectInEditor = (id) => { state.activeProjectId = id; saveProjects(); window.navigate("#/editor"); };
window.openProjectInPreview = (id) => { state.activeProjectId = id; saveProjects(); window.navigate("#/preview"); };
window.openProjectInBuild = (id) => { state.activeProjectId = id; saveProjects(); window.navigate("#/build"); };

window.confirmDeleteProject = (id) =>
  openConfirmModal({
    title: "Delete Project?",
    message: "Are you sure you want to delete this project permanently?",
    onConfirm: () => {
      state.projects = state.projects.filter((p) => p.id !== id);
      saveProjects();
      window.render();
      window.showToast("Project deleted", "info");
    }
  });

window.updateW2A = (k, v) => {
  state.web2app[k] = v;
  if (k === "appName") {
    const el = document.getElementById("mockAppName");
    if (el) el.textContent = v;
  }
};

window.handleAppIconUpload = (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => { state.web2app.iconDataUrl = r.result; window.render(); };
  r.readAsDataURL(f);
};

window.generateLocalKey = () => {
  localStorage.setItem("wevlo_signing_key", "key_" + crypto.randomUUID());
  state.web2app.hasKey = true;
  window.render();
  window.showToast("Signing key created!", "success");
};

window.importExistingKey = () => {
  const k = prompt("Paste Keystore Alias or Signing Key:");
  if (k) {
    localStorage.setItem("wevlo_signing_key", k);
    state.web2app.hasKey = true;
    window.render();
    window.showToast("Key imported!", "success");
  }
};

window.startWeb2AppBuild = () => {
  const w = state.web2app;
  const repoName = "wevlo-" + w.appName.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Math.floor(Math.random() * 900 + 100);
  const javaSource = `import android.app.Activity;
import android.os.Bundle;
import android.webkit.*;
public class MainActivity extends Activity {
    private WebView wv;
    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        wv = new WebView(this);
        wv.getSettings().setJavaScriptEnabled(true);
        wv.getSettings().setDomStorageEnabled(true);
        wv.setWebViewClient(new WebViewClient());
        wv.loadUrl("${w.url}");
        setContentView(wv);
    }
    @Override public void onBackPressed() { if (wv.canGoBack()) wv.goBack(); else super.onBackPressed(); }
}`;
  runGithubApkPipeline({
    repoName,
    appName: w.appName,
    pkgName: w.pkgName,
    versionName: w.version,
    versionCode: state.buildConfig.versionCode,
    orientation: w.orientation,
    javaSource,
    logElId: "w2aLog"
  });
};

window.buildProjectToApk = (id) => {
  const proj = state.projects.find((p) => p.id === id);
  if (!proj) return;
  const bc = state.buildConfig;
  const perms = [
    bc.permInternet && "INTERNET",
    bc.permCamera && "CAMERA",
    bc.permMic && "RECORD_AUDIO",
    bc.permLocation && "ACCESS_FINE_LOCATION",
    bc.permBluetooth && "BLUETOOTH"
  ].filter(Boolean);
  const fullHtml = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${proj.css}</style></head><body>${proj.html}<script>${proj.js}<\/script></body></html>`
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "");
  const javaSource = `import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
public class MainActivity extends Activity {
    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        WebView w = new WebView(this);
        w.getSettings().setJavaScriptEnabled(${bc.jsEnabled});
        w.getSettings().setDomStorageEnabled(${bc.domStorage});
        w.loadDataWithBaseURL(null, "${fullHtml}", "text/html", "UTF-8", null);
        setContentView(w);
    }
}`;
  runGithubApkPipeline({
    repoName: document.getElementById("bRepoName").value.trim(),
    appName: proj.name,
    pkgName: bc.pkgName,
    versionName: bc.versionName,
    versionCode: bc.versionCode,
    permissions: perms,
    javaSource,
    logElId: "buildProjLog"
  });
};

window.cloneTemplate = (name) => {
  state.projects.unshift({
    id: "proj_" + Date.now(),
    name,
    type: "html",
    html: `<main style="padding:32px;text-align:center"><h1>${name}</h1><p>Template ready!</p></main>`,
    css: `body{font-family:sans-serif;background:#f6f6fb;margin:0}`,
    js: ``,
    updatedAt: new Date().toLocaleDateString()
  });
  state.activeProjectId = state.projects[0].id;
  saveProjects();
  addActivity(`Used template "${name}"`);
  window.navigate("#/editor");
};

window.submitWalletDeposit = () => {
  const trx = document.getElementById("trxInput").value.trim();
  if (!trx) return window.showToast("TrxID লিখুন!", "error");
  state.wallet.pending += 1;
  state.payments.unshift({
    id: "DEP-" + Date.now(),
    title: `${state.payMethod} Deposit`,
    amount: state.payAmount,
    method: state.payMethod,
    trx,
    status: "Pending",
    date: new Date().toLocaleDateString()
  });
  localStorage.setItem("wevlo_wallet", JSON.stringify(state.wallet));
  localStorage.setItem("wevlo_payments", JSON.stringify(state.payments));
  addActivity(`Deposit ৳${state.payAmount} (${state.payMethod})`);
  window.render();
  window.showToast("Deposit submitted!", "success");
};

window.saveUserProfile = () => {
  localStorage.setItem("wevlo_profile", JSON.stringify(state.profile));
  updateAccountUI();
  window.showToast("Profile saved!", "success");
};

window.state = state;
window.render = function render() {
  renderHeaderAndNav();

  // Full-screen IDE mode toggles outer header/sidebar/bottom-nav automatically
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
          runGithubApkPipeline,
          showToast: window.showToast,
          render: window.render,
          navigate: window.navigate,
          confirmLogout: window.confirmLogout,
          loginWithGithub: window.loginWithGithub,
          importExistingKey: window.importExistingKey,
          loadGithubRepos: window.loadGithubRepos
        });
        break;
      case "#/wallet":
        c.innerHTML = renderWallet();
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
