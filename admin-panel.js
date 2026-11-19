import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  serverTimestamp,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ======================================================
// ১. Admin Security & Password Configuration
// ======================================================
export const ADMIN_EMAILS = [
  "mohirkhan01763@gmail.com",
  "mohirkhan1020@gmail.com"
];

// ডিফল্ট ব্যাকআপ পিন
export const DEFAULT_MASTER_PIN = "1020";

export function getActiveAdminPin(state) {
  return (
    state?.customAdminPin ||
    localStorage.getItem("wevlo_custom_admin_pin") ||
    DEFAULT_MASTER_PIN
  );
}

export function isAdminUser(state) {
  // ১. সেশনে অ্যাডমিন আনলক করা থাকলে
  if (sessionStorage.getItem("wevlo_admin_unlocked") === "true") return true;

  // ২. ইমেইল ম্যাচ করলে
  const email = (state.user?.email || "").toLowerCase();
  if (email && ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email)) return true;

  // ৩. ফায়ারবেস ডেটাবেসে role == "admin" থাকলে
  if (state.userRole === "admin") return true;

  return false;
}

// ======================================================
// ২. পুরো ওয়েবসাইটের ফিচার ক্যাটালগ (Free / Pro / Off)
// ======================================================
export const FEATURE_CATALOG = [
  { key: "codeEditor", group: "Core Tools", label: "Code Editor (HTML/CSS/JS)" },
  { key: "preview", group: "Core Tools", label: "Device Frame Preview" },
  { key: "web2app", group: "App Builders", label: "Website URL to APK" },
  { key: "buildApk", group: "App Builders", label: "Build Project to APK" },
  { key: "githubBuild", group: "App Builders", label: "GitHub Build & Android IDE" },
  { key: "langJava", group: "Languages", label: "Java Android Studio" },
  { key: "langKotlin", group: "Languages", label: "Kotlin Native Android" },
  { key: "langFlutter", group: "Languages", label: "Flutter (Dart)" },
  { key: "langCapacitor", group: "Languages", label: "Capacitor (HTML/JS APK)" },
  { key: "langPython", group: "Languages", label: "Python (Kivy APK)" },
  { key: "templates", group: "Resources", label: "Templates Gallery" },
  { key: "lab", group: "Resources", label: "Community Lab" },
  { key: "fileManager", group: "Resources", label: "File Manager" },
  { key: "iconLibrary", group: "Resources", label: "Icon Library" },
  { key: "secureConverter", group: "Resources", label: "Secure HTML Converter" },
  { key: "proEncryption", group: "APK Modules", label: "AES-256-GCM Encryption" },
  { key: "proAppLock", group: "APK Modules", label: "App Lock (PIN / Passphrase)" },
  { key: "proPush", group: "APK Modules", label: "Push Notifications" },
  { key: "proAds", group: "APK Modules", label: "AdMob Ads Module" },
  { key: "proCloudSigning", group: "APK Modules", label: "Play Store Cloud Signing" }
];

export const DEFAULT_FEATURE_RULES = {
  codeEditor: "free", preview: "free", web2app: "free", buildApk: "free", githubBuild: "free",
  langJava: "free", langKotlin: "free", langFlutter: "pro", langCapacitor: "free", langPython: "pro",
  templates: "free", lab: "free", fileManager: "free", iconLibrary: "free", secureConverter: "free",
  proEncryption: "pro", proAppLock: "pro", proPush: "pro", proAds: "pro", proCloudSigning: "pro"
};

export const DEFAULT_PAYMENT_CONFIG = {
  bkashNumber: "01700000000",
  nagadNumber: "01700000000",
  proMonthlyPrice: 299,
  proYearlyPrice: 2499,
  notice: "Send Money করে TrxID সাবমিট করুন। Admin যাচাই করে সাথে সাথে অ্যাক্টিভ করবে।"
};

export function checkFeatureAccess(featureKey, state) {
  if (isAdminUser(state)) return { allowed: true, mode: "admin" };
  const rules = state.featureRules || DEFAULT_FEATURE_RULES;
  const mode = rules[featureKey] || "free";
  if (mode === "off") return { allowed: false, mode: "off" };
  if (mode === "pro" && state.plan !== "Pro") return { allowed: false, mode: "pro" };
  return { allowed: true, mode };
}

// ======================================================
// ৩. Firestore Sync Engine
// ======================================================
let db = null;
let unsubUser = null;
let unsubPayments = null;

export function initCloudFirestore(fbApp, ctx) {
  const { state, render, showToast } = ctx;
  if (!fbApp) return;
  db = getFirestore(fbApp);

  state.featureRules = { ...DEFAULT_FEATURE_RULES };
  state.paymentConfig = { ...DEFAULT_PAYMENT_CONFIG };
  state.adminUsers = [];
  state.adminPayments = [];

  // Live Feature Controls
  onSnapshot(doc(db, "config", "features"), (snap) => {
    if (snap.exists()) {
      state.featureRules = { ...DEFAULT_FEATURE_RULES, ...snap.data() };
      render();
    }
  });

  // Live Payment Settings
  onSnapshot(doc(db, "config", "payments"), (snap) => {
    if (snap.exists()) {
      state.paymentConfig = { ...DEFAULT_PAYMENT_CONFIG, ...snap.data() };
      render();
    }
  });

  // Live Custom Admin Password / PIN from Firestore
  onSnapshot(doc(db, "config", "security"), (snap) => {
    if (snap.exists() && snap.data().adminPin) {
      state.customAdminPin = snap.data().adminPin;
      localStorage.setItem("wevlo_custom_admin_pin", snap.data().adminPin);
    }
  });

  window.syncCloudUser = async (user) => {
    if (unsubUser) { unsubUser(); unsubUser = null; }
    if (!user || !db) return;

    const uRef = doc(db, "users", user.uid);
    const snap = await getDoc(uRef).catch(() => null);
    if (snap && !snap.exists()) {
      await setDoc(uRef, {
        uid: user.uid,
        email: user.email || "",
        name: user.displayName || "User",
        plan: "Free",
        role: "user",
        walletBalance: 0,
        totalDeposited: 0,
        totalSpent: 0,
        proExpiresAt: null,
        createdAt: serverTimestamp()
      }).catch(() => {});
    }

    unsubUser = onSnapshot(uRef, (s) => {
      if (!s.exists()) return;
      const d = s.data();
      state.userRole = d.role || "user";
      let activePlan = d.plan || "Free";
      if (activePlan === "Pro" && d.proExpiresAt && Date.now() > d.proExpiresAt) {
        activePlan = "Free";
      }
      state.plan = activePlan;
      state.proExpiresAt = d.proExpiresAt || null;
      state.wallet.balance = Number(d.walletBalance || 0);
      state.wallet.deposited = Number(d.totalDeposited || 0);
      state.wallet.spent = Number(d.totalSpent || 0);
      render();
    });

    if (isAdminUser(state)) {
      loadAdminData(ctx);
    }
  };

  window.submitCloudPayment = async ({ type, method, amount, trxId, planDurationDays = 0, screenshotName = "" }) => {
    if (!state.user) return showToast("পেমেন্ট করতে আগে Gmail দিয়ে লগইন করুন!", "error");
    if (!db) return showToast("Firestore চালু করা হয়নি!", "error");
    try {
      await addDoc(collection(db, "payments"), {
        uid: state.user.uid,
        email: state.user.email || "",
        userName: state.user.displayName || "User",
        type, method, amount: Number(amount), trxId, planDurationDays, screenshotName,
        status: "Pending",
        createdAt: serverTimestamp(),
        dateStr: new Date().toLocaleDateString()
      });
      showToast("পেমেন্ট রিকোয়েস্ট পাঠানো হয়েছে! Admin যাচাই করে অ্যাপ্রুভ করবে।", "success");
      return true;
    } catch (e) {
      showToast("Payment Error: " + e.message, "error");
      return false;
    }
  };

  window.buyProWithCloudWallet = async (price, days) => {
    if (!state.user || !db) return showToast("আগে Gmail দিয়ে লগইন করুন!", "error");
    if (state.wallet.balance < price) {
      showToast(`Wallet balance কম! কমপক্ষে ৳${price} Add Funds করুন।`, "error");
      return ctx.navigate("#/wallet");
    }
    try {
      await updateDoc(doc(db, "users", state.user.uid), {
        walletBalance: increment(-price),
        totalSpent: increment(price),
        plan: "Pro",
        proExpiresAt: Date.now() + days * 86400000
      });
      await addDoc(collection(db, "payments"), {
        uid: state.user.uid,
        email: state.user.email || "",
        type: "subscription",
        method: "Wallet",
        amount: price,
        trxId: "WALLET-" + Date.now(),
        status: "Completed",
        createdAt: serverTimestamp(),
        dateStr: new Date().toLocaleDateString()
      });
      showToast("Wevlo Pro অ্যাক্টিভ হয়েছে!", "success");
    } catch (e) {
      showToast(e.message, "error");
    }
  };
}

async function loadAdminData(ctx) {
  const { state, render } = ctx;
  if (!db) return;
  if (unsubPayments) unsubPayments();
  const q = query(collection(db, "payments"), orderBy("createdAt", "desc"));
  unsubPayments = onSnapshot(q, (snap) => {
    state.adminPayments = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    render();
  });
  const usersSnap = await getDocs(collection(db, "users")).catch(() => null);
  if (usersSnap) {
    state.adminUsers = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    render();
  }
}

// ======================================================
// ৪. Admin Panel UI (#/admin)
// ======================================================
export function renderAdminPanel(ctx) {
  const { state, showToast, render } = ctx;

  // লক স্ক্রিন: মাস্টার পিন / পাসওয়ার্ড দিয়ে আনলক করার ফর্ম
  if (!isAdminUser(state)) {
    window.unlockAdminWithPin = () => {
      const pin = document.getElementById("adminPinInput")?.value.trim();
      const currentPin = getActiveAdminPin(state);
      if (pin === currentPin || pin === DEFAULT_MASTER_PIN) {
        sessionStorage.setItem("wevlo_admin_unlocked", "true");
        showToast("Super Admin Unlocked!", "success");
        loadAdminData(ctx);
        render();
      } else {
        showToast("ভুল Admin Password! সঠিক কোড দিন।", "error");
      }
    };

    return `
      <div class="wevlo-card p-6 sm:p-8 max-w-md mx-auto text-center space-y-4">
        <div class="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center">
          <i data-lucide="shield-alert" class="w-8 h-8"></i>
        </div>
        <h2 class="text-xl font-extrabold text-slate-900">Admin Security Check</h2>
        <p class="text-xs text-muted">আপনার Admin Password / PIN দিয়ে ড্যাশবোর্ড আনলক করুন:</p>

        <div class="space-y-3 pt-2">
          <input id="adminPinInput" type="password" placeholder="Enter Admin Password (Default: 1020)" class="w-full text-center tracking-widest text-base font-bold border-2 border-purple-500/50 rounded-2xl px-4 py-3 bg-transparent focus:outline-none focus:border-purple-600" />
          <button onclick="unlockAdminWithPin()" class="w-full btn-purple py-3 rounded-full text-sm font-bold">
            🔓 Unlock Admin Panel
          </button>
        </div>
      </div>`;
  }

  // আনলক হওয়ার পর পূর্ণাঙ্গ ড্যাশবোর্ড
  if (!state.adminTab) state.adminTab = "payments";
  if (!state.adminUserSearch) state.adminUserSearch = "";
  const payments = state.adminPayments || [];
  const users = (state.adminUsers || []).filter((u) => (u.email || u.name || "").toLowerCase().includes(state.adminUserSearch.toLowerCase()));
  const pendingCount = payments.filter((p) => p.status === "Pending").length;
  const rules = state.featureRules || DEFAULT_FEATURE_RULES;
  const pCfg = state.paymentConfig || DEFAULT_PAYMENT_CONFIG;
  const currentAdminPass = getActiveAdminPin(state);

  window.adminRefreshAll = () => loadAdminData(ctx);

  window.adminLockSession = () => {
    sessionStorage.removeItem("wevlo_admin_unlocked");
    showToast("Admin session locked", "info");
    render();
  };

  window.adminApprovePayment = async (payId) => {
    const p = payments.find((x) => x.id === payId);
    if (!p || !db) return;
    try {
      await updateDoc(doc(db, "payments", payId), { status: "Approved" });
      if (p.type === "subscription") {
        const days = p.planDurationDays || 30;
        await updateDoc(doc(db, "users", p.uid), {
          plan: "Pro",
          proExpiresAt: Date.now() + days * 86400000
        });
      } else {
        await updateDoc(doc(db, "users", p.uid), {
          walletBalance: increment(Number(p.amount)),
          totalDeposited: increment(Number(p.amount))
        });
      }
      showToast("Payment Approved & User Updated!", "success");
      loadAdminData(ctx);
    } catch (e) { showToast(e.message, "error"); }
  };

  window.adminRejectPayment = async (payId) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, "payments", payId), { status: "Rejected" });
      showToast("Payment Rejected", "info");
    } catch (e) { showToast(e.message, "error"); }
  };

  window.adminSetUserPlan = async (uid, plan, days = 30) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, "users", uid), {
        plan,
        proExpiresAt: plan === "Pro" ? (days === 0 ? null : Date.now() + days * 86400000) : null
      });
      showToast(`User plan set to ${plan}!`, "success");
      loadAdminData(ctx);
    } catch (e) { showToast(e.message, "error"); }
  };

  window.adminAdjustWallet = async (uid, delta) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, "users", uid), { walletBalance: increment(delta) });
      showToast(`Wallet updated (${delta > 0 ? "+" : ""}৳${delta})`, "success");
      loadAdminData(ctx);
    } catch (e) { showToast(e.message, "error"); }
  };

  window.adminSetFeatureMode = (key, mode) => {
    state.featureRules[key] = mode;
    render();
  };

  window.adminSaveFeatureRules = async () => {
    if (!db) return;
    try {
      await setDoc(doc(db, "config", "features"), state.featureRules, { merge: true });
      showToast("সব ফিচার কন্ট্রোল লাইভ সেভ হয়েছে!", "success");
    } catch (e) { showToast("Save Error: " + e.message, "error"); }
  };

  window.adminSavePaymentConfig = async () => {
    if (!db) return;
    try {
      const cfg = {
        bkashNumber: document.getElementById("admBkash").value.trim(),
        nagadNumber: document.getElementById("admNagad").value.trim(),
        proMonthlyPrice: Number(document.getElementById("admMonthPrice").value || 299),
        proYearlyPrice: Number(document.getElementById("admYearPrice").value || 2499),
        notice: document.getElementById("admPayNotice").value.trim()
      };
      await setDoc(doc(db, "config", "payments"), cfg, { merge: true });
      showToast("Payment settings updated live!", "success");
    } catch (e) { showToast(e.message, "error"); }
  };

  // ইন-অ্যাপ পাসওয়ার্ড বদলানোর হ্যান্ডলার
  window.adminChangePasswordAction = async () => {
    const newPass = document.getElementById("admNewPassInput")?.value.trim();
    if (!newPass || newPass.length < 4) {
      return showToast("কমপক্ষে ৪ অক্ষরের নতুন পাসওয়ার্ড দিন!", "error");
    }
    localStorage.setItem("wevlo_custom_admin_pin", newPass);
    state.customAdminPin = newPass;

    if (db) {
      await setDoc(doc(db, "config", "security"), { adminPin: newPass }, { merge: true }).catch(() => {});
    }
    document.getElementById("admNewPassInput").value = "";
    showToast(`Admin Password সফলভাবে আপডেট হয়েছে! (নতুন পাসওয়ার্ড: ${newPass})`, "success");
    render();
  };

  const groups = [...new Set(FEATURE_CATALOG.map((f) => f.group))];

  return `
    <div class="hero-lavender rounded-[24px] p-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <span class="pro-badge">SUPER ADMIN</span>
        <h1 class="text-2xl font-extrabold text-slate-900 mt-1">Admin <span class="text-purple-700">Control Center</span></h1>
        <p class="text-xs text-slate-600">Approve payments, manage users, and control Free/Pro features live.</p>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="adminRefreshAll()" class="btn-purple px-4 py-2 rounded-full text-xs font-bold">↻ Refresh</button>
        <button onclick="adminLockSession()" class="border border-rose-300 bg-rose-50 text-rose-600 px-3.5 py-2 rounded-full text-xs font-bold">🔒 Lock</button>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="grid grid-cols-3 gap-3 text-xs">
      <div class="wevlo-card p-4"><b>Pending Payments</b><p class="text-xl font-extrabold text-amber-500">${pendingCount}</p></div>
      <div class="wevlo-card p-4"><b>Total Users</b><p class="text-xl font-extrabold">${(state.adminUsers || []).length}</p></div>
      <div class="wevlo-card p-4"><b>Pro Users</b><p class="text-xl font-extrabold text-purple-600">${(state.adminUsers || []).filter((u) => u.plan === "Pro").length}</p></div>
    </div>

    <!-- Admin Sub-Tabs -->
    <div class="flex flex-wrap gap-2">
      ${[
        ["payments", `💳 Payments (${pendingCount})`],
        ["users", "👥 Users & Pro"],
        ["features", "🎛 Free / Pro Features"],
        ["settings", "⚙ Payment & Security"]
      ].map(([id, lbl]) => `<button onclick="state.adminTab='${id}'; render()" class="px-4 py-2 rounded-full text-xs font-bold ${state.adminTab === id ? "btn-purple" : "wevlo-card"}">${lbl}</button>`).join("")}
    </div>

    <!-- TAB 1: Payments -->
    ${
      state.adminTab === "payments"
        ? `<div class="wevlo-card p-5 space-y-3 text-xs">
            <h2 class="font-extrabold text-base">Subscription &amp; Wallet Payment Requests</h2>
            ${
              payments.length === 0
                ? `<p class="text-muted py-6 text-center">No payment requests yet.</p>`
                : payments
                    .map(
                      (p) => `
                  <div class="p-4 rounded-2xl border border-soft flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p class="font-extrabold text-sm">${p.email || p.uid} <span class="text-purple-600">(৳${p.amount})</span></p>
                      <p class="text-muted mt-0.5">${p.type.toUpperCase()} • ${p.method} • TrxID: <b class="text-main">${p.trxId}</b> • ${p.dateStr || ""}</p>
                    </div>
                    <div class="flex items-center gap-2">
                      ${
                        p.status === "Pending"
                          ? `<button onclick="adminApprovePayment('${p.id}')" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-full font-bold">✓ Approve</button>
                             <button onclick="adminRejectPayment('${p.id}')" class="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-full font-bold">✕ Reject</button>`
                          : `<span class="px-3 py-1 rounded-full font-bold ${p.status === "Approved" || p.status === "Completed" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}">${p.status}</span>`
                      }
                    </div>
                  </div>`
                    )
                    .join("")
            }
          </div>`
        : ""
    }

    <!-- TAB 2: Users & Pro Activation -->
    ${
      state.adminTab === "users"
        ? `<div class="wevlo-card p-5 space-y-3 text-xs">
            <div class="flex flex-wrap justify-between items-center gap-2">
              <h2 class="font-extrabold text-base">Users &amp; Manual Pro Activation</h2>
              <input value="${state.adminUserSearch}" oninput="state.adminUserSearch=this.value; render()" placeholder="Search email..." class="border border-soft rounded-full px-4 py-1.5 bg-transparent" />
            </div>
            <div class="space-y-2.5">
              ${users
                .map(
                  (u) => `
                <div class="p-4 rounded-2xl border border-soft flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p class="font-extrabold text-sm">${u.email || u.name} <span class="px-2 py-0.5 rounded-full text-[10px] ${u.plan === "Pro" ? "pro-badge" : "bg-slate-200 text-slate-700"}">${u.plan || "Free"}</span></p>
                    <p class="text-muted mt-0.5">Wallet: <b>৳${u.walletBalance || 0}</b> ${u.proExpiresAt ? "• Expires: " + new Date(u.proExpiresAt).toLocaleDateString() : ""}</p>
                  </div>
                  <div class="flex flex-wrap gap-1.5">
                    <button onclick="adminSetUserPlan('${u.id}','Pro',30)" class="btn-purple px-3 py-1.5 rounded-full font-bold">Pro 30d</button>
                    <button onclick="adminSetUserPlan('${u.id}','Pro',365)" class="bg-amber-500 text-white px-3 py-1.5 rounded-full font-bold">Pro 1yr</button>
                    <button onclick="adminSetUserPlan('${u.id}','Free',0)" class="border border-soft px-3 py-1.5 rounded-full font-bold">Set Free</button>
                    <button onclick="adminAdjustWallet('${u.id}',100)" class="bg-emerald-600 text-white px-3 py-1.5 rounded-full font-bold">+৳100</button>
                  </div>
                </div>`
                )
                .join("")}
            </div>
          </div>`
        : ""
    }

    <!-- TAB 3: Feature Controls -->
    ${
      state.adminTab === "features"
        ? `<div class="wevlo-card p-5 space-y-4 text-xs">
            <div class="flex flex-wrap justify-between items-center gap-2">
              <div>
                <h2 class="font-extrabold text-base">Website Feature Control</h2>
                <p class="text-muted">কোন ফিচার Free, কোনটা Pro আর কোনটা বন্ধ রাখবেন সিলেক্ট করুন।</p>
              </div>
              <button onclick="adminSaveFeatureRules()" class="btn-purple px-5 py-2.5 rounded-full font-bold">💾 Save All</button>
            </div>
            ${groups
              .map(
                (grp) => `
              <div class="space-y-2 pt-2">
                <h3 class="font-extrabold text-purple-600 uppercase text-[11px]">${grp}</h3>
                ${FEATURE_CATALOG.filter((f) => f.group === grp)
                  .map((f) => {
                    const m = rules[f.key] || "free";
                    return `
                      <div class="p-3 rounded-2xl border border-soft flex flex-wrap items-center justify-between gap-2">
                        <span class="font-bold">${f.label}</span>
                        <div class="flex gap-1.5">
                          <button onclick="adminSetFeatureMode('${f.key}','free')" class="px-3 py-1 rounded-full font-bold ${m === "free" ? "bg-emerald-600 text-white" : "border border-soft text-muted"}">Free</button>
                          <button onclick="adminSetFeatureMode('${f.key}','pro')" class="px-3 py-1 rounded-full font-bold ${m === "pro" ? "btn-purple" : "border border-soft text-muted"}">Pro Only</button>
                          <button onclick="adminSetFeatureMode('${f.key}','off')" class="px-3 py-1 rounded-full font-bold ${m === "off" ? "bg-rose-600 text-white" : "border border-soft text-muted"}">Off</button>
                        </div>
                      </div>`;
                  })
                  .join("")}
              </div>`
              )
              .join("")}
            <button onclick="adminSaveFeatureRules()" class="w-full btn-purple py-3 rounded-full text-sm font-bold">💾 Save &amp; Publish</button>
          </div>`
        : ""
    }

    <!-- TAB 4: Payment Settings & Admin Password Changer -->
    ${
      state.adminTab === "settings"
        ? `<div class="wevlo-card p-5 space-y-5 text-xs">
            <div>
              <h2 class="font-extrabold text-base">Payment Setup</h2>
              <p class="text-muted">bKash, Nagad এবং সাবস্ক্রিপশন ফি আপডেট করুন।</p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label class="font-bold text-muted">bKash Number</label><input id="admBkash" value="${pCfg.bkashNumber}" class="w-full mt-1 border border-soft rounded-xl px-3 py-2.5 bg-transparent" /></div>
              <div><label class="font-bold text-muted">Nagad Number</label><input id="admNagad" value="${pCfg.nagadNumber}" class="w-full mt-1 border border-soft rounded-xl px-3 py-2.5 bg-transparent" /></div>
              <div><label class="font-bold text-muted">Pro Monthly (৳)</label><input id="admMonthPrice" type="number" value="${pCfg.proMonthlyPrice}" class="w-full mt-1 border border-soft rounded-xl px-3 py-2.5 bg-transparent" /></div>
              <div><label class="font-bold text-muted">Pro Yearly (৳)</label><input id="admYearPrice" type="number" value="${pCfg.proYearlyPrice}" class="w-full mt-1 border border-soft rounded-xl px-3 py-2.5 bg-transparent" /></div>
            </div>
            <div><label class="font-bold text-muted">Checkout Notice</label><input id="admPayNotice" value="${pCfg.notice}" class="w-full mt-1 border border-soft rounded-xl px-3 py-2.5 bg-transparent" /></div>
            <button onclick="adminSavePaymentConfig()" class="btn-purple px-6 py-2.5 rounded-full font-bold">Save Payment Settings</button>

            <!-- ইন-অ্যাপ অ্যাডমিন পাসওয়ার্ড পরিবর্তন বক্স -->
            <div class="pt-4 border-t border-soft space-y-3">
              <div>
                <h3 class="font-extrabold text-base flex items-center gap-2 text-slate-900"><i data-lucide="key-round" class="w-4 h-4 text-purple-600"></i> Change Admin Password / PIN</h3>
                <p class="text-muted">বর্তমান সক্রিয় পাসওয়ার্ড/পিন: <b class="text-purple-600">${currentAdminPass}</b></p>
              </div>
              <div class="flex flex-wrap gap-2">
                <input id="admNewPassInput" type="text" placeholder="Enter New Admin Password..." class="flex-1 min-w-[200px] border-2 border-purple-500/50 rounded-xl px-4 py-2.5 bg-transparent font-bold focus:outline-none focus:border-purple-600" />
                <button onclick="adminChangePasswordAction()" class="btn-purple px-5 py-2.5 rounded-xl font-bold">Update Password</button>
              </div>
            </div>
          </div>`
        : ""
    }`;
}
