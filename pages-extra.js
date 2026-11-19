export function renderExtraPages(ctx) {
  const { state, saveProjects, navigate, showToast, render, openConfirmModal } = ctx;
  const pCfg = state.paymentConfig || {
    bkashNumber: "01700000000",
    nagadNumber: "01700000000",
    proMonthlyPrice: 299,
    proYearlyPrice: 2499,
    notice: "Send money and submit your TrxID for verification."
  };

  const docGuides = [
    { cat: "Getting started", route: "#/settings", title: "Create your account & sign in", desc: "Everything in Wevlo needs a free account.", body: "Open the top-right account menu and click Continue with Gmail or Connect GitHub Account." },
    { cat: "Getting started", route: "#/", title: "Dashboard", desc: "Your home screen: projects, wallet, plan and shortcuts.", body: "View total projects, wallet balance, active plan, Multi-Language Studio & quick actions." },
    { cat: "Getting started", route: "#/projects", title: "My Projects", desc: "Create, search and manage all your projects in one place.", body: "Search projects by name, edit HTML/CSS/JS, or convert to APK." },
    { cat: "Build apps", route: "#/web2app", title: "Website to App", desc: "Turn any https website into an Android app in a few taps.", body: "Enter your https:// URL, App Name, and click Convert to Android App." },
    { cat: "Build apps", route: "#/editor", title: "Code Editor", desc: "Write HTML, CSS and JavaScript on your phone or computer.", body: "Syntax-highlighted CodeMirror editor with instant Live Preview." },
    { cat: "Tools", route: "#/preview", title: "Preview", desc: "Test your project on phone, tablet and desktop sizes.", body: "Switch between Phone, Tablet, and Desktop viewports." },
    { cat: "Build apps", route: "#/build", title: "Build APK", desc: "Package a project as an installable Android app.", body: "Configure permissions, WebView settings, and PRO modules before building." },
    { cat: "GitHub Build", route: "#/github-build", title: "GitHub Build (Multi-Language IDE)", desc: "Build Java, Kotlin, Flutter, Capacitor JS & Python apps.", body: "Create or open a GitHub repo, write code with CodeMirror & Visual XML Designer, and compile APK/AAB." },
    { cat: "Account & payments", route: "#/wallet", title: "Wallet", desc: "Add money once and pay instantly for templates and plans.", body: "Send money via bKash/Nagad and submit TrxID for verification." },
    { cat: "Account & payments", route: "#/subscription", pro: true, title: "Subscription (Wevlo Pro)", desc: "Unlock Encryption, App Lock, Push Notifications & Pro Languages.", body: "Pay via Wallet or submit direct bKash/Nagad TrxID to activate Pro." },
    { cat: "Account & payments", route: "#/payments", title: "Payments history", desc: "Track every payment and its status.", body: "View Pending, Approved and Completed transactions." },
    { cat: "Tools", route: "#/icons", title: "Icon Library", desc: "Free outline icons for your projects.", body: "Search Lucide icons and copy code with 1 click." },
    { cat: "Tools", route: "#/secure-converter", title: "Secure Converter", desc: "Make your HTML harder to read and copy.", body: "Obfuscate HTML source code before bundling." }
  ];

  const faqs = [
    ["What is the difference between APK and AAB?", "APK installs directly on Android phones. AAB is required by Google Play Store."],
    ["How do I activate Wevlo Pro?", "Go to Subscription, pay via bKash/Nagad or Wallet, and submit your TrxID. Pro activates automatically after verification."],
    ["Why does a feature say PRO or Unavailable?", "Some advanced tools and languages require a Wevlo Pro plan or may be temporarily unavailable during maintenance."],
    ["My build failed. What should I check?", "Check the Build Output and Problems tab for exact compiler error lines and click Auto-Fix if a Gradle or YAML file has an issue."],
    ["Are my GitHub files safe?", "Yes, Wevlo uses official Firebase GitHub OAuth tokens stored only for your active browser session."]
  ];

  const glossary = [
    ["APK", "Installable Android app file."],
    ["AAB", "Android App Bundle for Google Play."],
    ["Gradle", "Android build automation tool."],
    ["TrxID", "bKash/Nagad transaction ID after sending money."]
  ];

  window.openGuideDetail = (idx) => {
    const g = docGuides[idx];
    if (!g) return;
    document.getElementById("guideCatBadge").textContent = g.cat + (g.pro ? " • PRO" : "");
    document.getElementById("guideTitle").textContent = g.title;
    document.getElementById("guideBody").textContent = g.body;
    document.getElementById("guideActionBtn").onclick = () => {
      document.getElementById("guideModal").classList.add("hidden");
      navigate(g.route);
    };
    const m = document.getElementById("guideModal");
    m.classList.remove("hidden");
    m.classList.add("flex");
  };

  window.submitDirectSubPayment = async () => {
    const trx = document.getElementById("subTrxInput")?.value.trim();
    if (!trx) return showToast("Please enter Transaction ID (TrxID)!", "error");
    const isYear = state.subDuration === "yearly";
    const amt = isYear ? pCfg.proYearlyPrice : pCfg.proMonthlyPrice;
    const days = isYear ? 365 : 30;
    const ok = await window.submitCloudPayment?.({
      type: "subscription",
      method: state.subPayMethod || "bKash",
      amount: amt,
      trxId: trx,
      planDurationDays: days
    });
    if (ok) {
      state.payments.unshift({
        id: "SUB-" + Date.now(),
        title: `Wevlo Pro (${isYear ? "1 Year" : "30 Days"})`,
        amount: amt,
        method: state.subPayMethod || "bKash",
        trx,
        status: "Pending",
        date: new Date().toLocaleDateString()
      });
      localStorage.setItem("wevlo_payments", JSON.stringify(state.payments));
      document.getElementById("subTrxInput").value = "";
      render();
    }
  };

  window.runSecureConvert = () => {
    const raw = document.getElementById("secInput").value;
    const mode = document.getElementById("secMode").value;
    if (!raw.trim()) return showToast("Please paste HTML code first!", "error");
    const out =
      mode === "base64"
        ? `<!-- Protected by Wevlo -->\n<script>document.write(decodeURIComponent(escape(atob("${btoa(unescape(encodeURIComponent(raw)))}"))));<\/script>`
        : `<div>${Array.from(raw).map((c) => "&#x" + c.charCodeAt(0).toString(16) + ";").join("")}</div>`;
    state.secOutput = out;
    document.getElementById("secOutput").value = out;
    showToast("Converted!", "success");
  };

  window.applySecuredToProject = () => {
    const out = document.getElementById("secOutput").value;
    const proj = state.projects.find((p) => p.id === state.activeProjectId) || state.projects[0];
    if (!proj || !out) return showToast("No active project or converted output found!", "error");
    proj.html = out;
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
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) return showToast("Please select a file smaller than 1MB.", "error");
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
    };
    r.readAsDataURL(file);
  };

  window.deleteFileItem = (id) =>
    openConfirmModal({
      title: "Delete File?",
      message: "Remove this file?",
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
  window.sendPushDemo = () => {
    const t = document.getElementById("pushTitle").value.trim();
    const b = document.getElementById("pushBody").value.trim();
    if (!t || !b) return showToast("Please enter both Title and Message!", "error");
    state.pushLogs.unshift({ title: t, body: b, time: new Date().toLocaleTimeString() });
    localStorage.setItem("wevlo_push_logs", JSON.stringify(state.pushLogs));
    render();
  };
  window.submitSupportTicket = () => {
    const s = document.getElementById("supSubject").value.trim();
    const m = document.getElementById("supMsg").value.trim();
    if (!s || !m) return showToast("Please enter both Subject and Message!", "error");
    document.getElementById("supSubject").value = "";
    document.getElementById("supMsg").value = "";
    showToast("Support message sent!", "success");
  };

  switch (state.route) {
    case "#/subscription": {
      const subDur = state.subDuration || "monthly";
      const subMethod = state.subPayMethod || "bKash";
      const payAmt = subDur === "yearly" ? pCfg.proYearlyPrice : pCfg.proMonthlyPrice;
      const sendNum = subMethod === "bKash" ? pCfg.bkashNumber : pCfg.nagadNumber;
      return `
        <div class="hero-lavender rounded-[24px] p-5 flex items-center justify-between">
          <div>
            <span class="pro-badge">PRO PLAN</span>
            <h1 class="text-2xl font-extrabold mt-1 text-slate-900">Wevlo <span class="text-purple-700">Subscription</span></h1>
            <p class="text-xs text-slate-600 mt-1">Current Plan: <b>${state.plan}</b> ${state.proExpiresAt ? "• Valid till " + new Date(state.proExpiresAt).toLocaleDateString() : ""}</p>
          </div>
          <div class="icon-box-purple w-12 h-12 rounded-2xl flex items-center justify-center"><i data-lucide="crown" class="w-6 h-6"></i></div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="wevlo-card p-5 space-y-3 border-2 ${subDur === "monthly" ? "border-purple-600" : "border-soft"}">
            <div class="flex justify-between"><h3 class="font-extrabold text-base">Pro Monthly (30 Days)</h3><span class="pro-badge">POPULAR</span></div>
            <p class="text-2xl font-extrabold text-purple-700">৳${pCfg.proMonthlyPrice}</p>
            <div class="flex gap-2">
              <button onclick="buyProWithCloudWallet(${pCfg.proMonthlyPrice}, 30)" class="flex-1 btn-purple py-2.5 rounded-full text-xs font-bold">Pay with Wallet</button>
              <button onclick="state.subDuration='monthly'; render()" class="px-4 py-2.5 rounded-full border border-soft text-xs font-bold">bKash/Nagad</button>
            </div>
          </div>

          <div class="wevlo-card p-5 space-y-3 border-2 ${subDur === "yearly" ? "border-purple-600" : "border-soft"}">
            <div class="flex justify-between"><h3 class="font-extrabold text-base">Pro Yearly (365 Days)</h3><span class="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">SAVE</span></div>
            <p class="text-2xl font-extrabold text-purple-700">৳${pCfg.proYearlyPrice}</p>
            <div class="flex gap-2">
              <button onclick="buyProWithCloudWallet(${pCfg.proYearlyPrice}, 365)" class="flex-1 btn-purple py-2.5 rounded-full text-xs font-bold">Pay with Wallet</button>
              <button onclick="state.subDuration='yearly'; render()" class="px-4 py-2.5 rounded-full border border-soft text-xs font-bold">bKash/Nagad</button>
            </div>
          </div>
        </div>

        <div class="wevlo-card p-5 space-y-3.5 text-xs">
          <h3 class="font-extrabold text-base">Direct bKash / Nagad Subscription (${subDur === "yearly" ? "Yearly" : "Monthly"} — ৳${payAmt})</h3>
          <div class="grid grid-cols-2 gap-2">
            <button onclick="state.subPayMethod='bKash'; render()" class="py-2.5 rounded-xl font-bold ${subMethod === "bKash" ? "btn-purple" : "border border-soft"}">bKash</button>
            <button onclick="state.subPayMethod='Nagad'; render()" class="py-2.5 rounded-xl font-bold ${subMethod === "Nagad" ? "btn-purple" : "border border-soft"}">Nagad</button>
          </div>
          <div class="bg-[#f3f0fc] text-slate-900 rounded-2xl p-3.5 flex justify-between items-center font-bold">
            <span>Send ৳${payAmt} (${subMethod}): <b class="text-purple-700">${sendNum}</b></span>
            <button onclick="navigator.clipboard?.writeText('${sendNum}'); showToast('Number copied!','success')" class="bg-white px-3 py-1 rounded-full border">Copy</button>
          </div>
          <p class="text-muted">${pCfg.notice}</p>
          <input id="subTrxInput" placeholder="Enter Transaction ID (TrxID)" class="w-full border border-soft rounded-xl px-4 py-2.5 text-sm bg-transparent" />
          <button onclick="submitDirectSubPayment()" class="w-full btn-purple py-3 rounded-full text-sm font-bold">Submit for Pro Activation →</button>
        </div>`;
    }

    case "#/payments":
      return `
        <div class="wevlo-card p-5 space-y-4">
          <div class="flex items-center justify-between"><h2 class="font-extrabold text-lg">Payments History</h2><button onclick="navigate('#/wallet')" class="btn-purple px-4 py-1.5 rounded-full text-xs font-bold">+ Add Funds</button></div>
          ${state.payments.length === 0 ? `<p class="text-center text-xs text-muted py-10">No payment transactions yet.</p>` : `<div class="overflow-x-auto"><table class="w-full text-left text-xs"><thead><tr class="border-b border-soft text-muted"><th class="py-2">Title</th><th>Method</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead><tbody>${state.payments.map((p) => `<tr class="border-b last:border-0 border-soft"><td class="py-3 font-bold">${p.title}</td><td>${p.method}</td><td>${p.date}</td><td class="font-extrabold">৳${p.amount}</td><td><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600">${p.status}</span></td></tr>`).join("")}</tbody></table></div>`}
        </div>`;

    case "#/secure-converter":
      return `<div class="wevlo-card p-5 space-y-4"><h1 class="text-xl font-extrabold">Secure Converter</h1><select id="secMode" class="border border-soft rounded-xl px-3 py-1.5 text-xs font-bold bg-transparent"><option value="base64">Base64 JS Loader</option><option value="entities">HTML Hex Entities</option></select><div class="grid grid-cols-1 lg:grid-cols-2 gap-4"><textarea id="secInput" rows="9" placeholder="<h1>Paste HTML...</h1>" class="w-full bg-slate-950 text-sky-300 font-mono text-xs p-3.5 rounded-2xl"></textarea><textarea id="secOutput" rows="9" readonly class="w-full bg-slate-950 text-emerald-300 font-mono text-xs p-3.5 rounded-2xl">${state.secOutput || ""}</textarea></div><div class="flex gap-2"><button onclick="runSecureConvert()" class="btn-purple px-5 py-2.5 rounded-full text-xs font-bold">Convert</button><button onclick="applySecuredToProject()" class="border border-soft px-4 py-2.5 rounded-full text-xs font-bold">Apply to Project</button></div></div>`;

    case "#/push":
      return `<div class="wevlo-card p-5 space-y-4"><h2 class="font-extrabold text-lg">Push Notifications <span class="pro-badge">PRO</span></h2><input id="pushTitle" placeholder="Title" class="w-full border border-soft rounded-xl px-3.5 py-2.5 text-sm bg-transparent"/><textarea id="pushBody" rows="3" placeholder="Message..." class="w-full border border-soft rounded-xl px-3.5 py-2.5 text-sm bg-transparent"></textarea><button onclick="sendPushDemo()" class="btn-purple px-6 py-2.5 rounded-full text-xs font-bold">Send Push</button>${state.pushLogs.map((n) => `<div class="p-3 rounded-xl border border-soft text-xs"><b>${n.title}</b> — ${n.body}</div>`).join("")}</div>`;

    case "#/lab":
      return `<h1 class="text-xl font-extrabold">Wevlo Lab</h1><div class="grid grid-cols-1 md:grid-cols-3 gap-4">${["Neon Task Tracker", "Flashlight UI", "Business Bio Card"].map((t, i) => `<div class="wevlo-card p-5 space-y-3"><h3 class="font-bold">${t}</h3><button onclick="cloneLabProject(${i})" class="w-full btn-purple py-2 rounded-full text-xs font-bold">Clone Project</button></div>`).join("")}</div>`;

    case "#/files":
      return `<div class="wevlo-card p-5 space-y-4"><div class="flex justify-between"><h2 class="font-extrabold text-lg">File Manager</h2><label class="btn-purple px-4 py-2 rounded-full text-xs font-bold cursor-pointer">+ Upload<input type="file" class="hidden" onchange="uploadFileManagerItem(event)"/></label></div>${state.files.length === 0 ? `<p class="text-center text-xs text-muted py-8">No files yet.</p>` : state.files.map((f) => `<div class="p-3 rounded-2xl border border-soft flex justify-between items-center text-xs"><b>${f.name} (${f.size})</b><button onclick="deleteFileItem('${f.id}')" class="text-rose-500">Delete</button></div>`).join("")}</div>`;

    case "#/icons": {
      const icons = ["home", "rocket", "code-2", "smartphone", "globe", "wallet", "crown", "bell", "folder", "settings", "shield-check", "lock", "eye", "download", "github", "zap", "heart", "star", "search", "user"];
      const q = (state.iconSearch || "").toLowerCase();
      return `<div class="wevlo-card p-5 space-y-4"><div class="flex justify-between items-center"><h2 class="font-extrabold text-lg">Icon Library</h2><input value="${state.iconSearch || ""}" oninput="state.iconSearch=this.value;render()" placeholder="Search..." class="border border-soft rounded-full px-4 py-1.5 text-xs bg-transparent"/></div><div class="grid grid-cols-4 sm:grid-cols-6 gap-3">${icons.filter((i) => i.includes(q)).map((ic) => `<button onclick="copyLucideIconSvg('${ic}')" class="p-3 rounded-2xl border border-soft flex flex-col items-center gap-1.5"><i data-lucide="${ic}" class="w-5 h-5 text-purple-600"></i><span class="text-[10px]">${ic}</span></button>`).join("")}</div></div>`;
    }

    case "#/docs": {
      const q = (state.docSearch || "").toLowerCase();
      const cat = state.docCat || "All";
      const cats = ["All", "Getting started", "Build apps", "GitHub Build", "Account & payments", "Tools"];
      const filtered = docGuides.map((g, i) => ({ ...g, idx: i })).filter((g) => (cat === "All" || g.cat === cat) && (g.title.toLowerCase().includes(q) || g.desc.toLowerCase().includes(q)));
      return `<div class="hero-lavender rounded-[24px] p-5 space-y-3"><h1 class="text-xl font-extrabold">Help &amp; Documentation</h1><input value="${state.docSearch || ""}" oninput="state.docSearch=this.value;render()" placeholder="Search guides..." class="w-full bg-white text-slate-900 rounded-full px-4 py-2 text-xs"/><div class="flex flex-wrap gap-1.5">${cats.map((c) => `<button onclick="state.docCat='${c}';render()" class="px-3 py-1 rounded-full text-[11px] font-bold ${cat === c ? "btn-purple" : "bg-white text-slate-700"}">${c}</button>`).join("")}</div></div><div class="wevlo-card p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">${filtered.map((g) => `<button onclick="openGuideDetail(${g.idx})" class="text-left p-3.5 rounded-2xl border border-soft"><p class="font-bold text-xs">${g.title} ${g.pro ? '<span class="pro-badge">PRO</span>' : ""}</p><p class="text-[11px] text-muted mt-1">${g.desc}</p></button>`).join("")}</div><div class="wevlo-card p-5 space-y-2">${faqs.map(([qT, a]) => `<details class="p-3 rounded-2xl border border-soft text-xs"><summary class="font-bold cursor-pointer">${qT}</summary><p class="text-muted mt-2">${a}</p></details>`).join("")}</div><div class="wevlo-card p-5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">${glossary.map(([t, d]) => `<div class="p-2.5 rounded-xl border border-soft"><b>${t}:</b> ${d}</div>`).join("")}</div>`;
    }

    case "#/privacy":
      return `<div class="wevlo-card p-6 space-y-3 text-xs"><h1 class="text-xl font-extrabold">Privacy Policy</h1><p class="text-muted">Your projects stay on your device or your GitHub repository. Account &amp; payment data are stored securely in Firebase.</p></div>`;

    case "#/support":
      return `<div class="wevlo-card p-6 space-y-3"><h1 class="text-xl font-extrabold">Support</h1><input id="supSubject" placeholder="Subject" class="w-full border border-soft rounded-xl px-4 py-2 text-sm bg-transparent"/><textarea id="supMsg" rows="4" placeholder="Message..." class="w-full border border-soft rounded-xl px-4 py-2 text-sm bg-transparent"></textarea><button onclick="submitSupportTicket()" class="btn-purple px-6 py-2.5 rounded-full text-xs font-bold">Send Message</button></div>`;
  }
  return "";
}
