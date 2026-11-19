export function renderExtraPages(ctx) {
  const { state, saveProjects, navigate, showToast, render, addActivity, openConfirmModal } = ctx;

  // All 24 Guides
  const docGuides = [
    { cat: "Getting started", route: "#/settings", title: "Create your account & sign in", desc: "Everything in Wevlo needs a free account.", body: "Open the top-right account menu and click Continue with Gmail or Connect GitHub Account. Your session uses Firebase Authentication." },
    { cat: "Getting started", route: "#/", title: "Dashboard", desc: "Your home screen: projects, wallet, plan and shortcuts.", body: "The Dashboard shows your project count, wallet balance, active plan, 30-day analytics chart, quick actions, and live system status." },
    { cat: "Getting started", route: "#/projects", title: "My Projects", desc: "Create, search and manage all your projects in one place.", body: "Search projects by name, switch between HTML/Multi-file/WebView apps, or delete projects cleanly with confirmation." },
    { cat: "Build apps", route: "#/web2app", title: "Website to App", desc: "Turn any https website into an Android app in a few taps.", body: "Enter your https:// URL, App Name, Icon, Orientation, and Signing Key, then click Convert to Android App to build via GitHub Actions." },
    { cat: "Build apps", route: "#/editor", title: "Code Editor", desc: "Write HTML, CSS and JavaScript on your phone or computer.", body: "Tabbed HTML, CSS, and JS editor with line numbers and instant side-by-side Live Preview." },
    { cat: "Tools", route: "#/preview", title: "Preview", desc: "Test your project on phone, tablet and desktop sizes.", body: "Switch between Phone (360px), Tablet (700px), and Desktop viewports in one click." },
    { cat: "Build apps", route: "#/build", title: "Build APK", desc: "Package a project as an installable Android app.", body: "Configure all 9 feature categories including Display, Web Engine, Permissions, Bottom Nav, and PRO modules before building." },
    { cat: "Build apps", route: "#/build", title: "Pick the right features", desc: "A short tour of the switches in Build APK.", body: "Keep JavaScript & DOM Storage enabled for modern web apps, and enable Camera/Location permissions only if your app needs them." },
    { cat: "Build apps", route: "#/web2app", title: "Signing key (only you can update your app)", desc: "Your own key stops anyone else from publishing a fake update.", body: "Generate your own signing key or import an existing key so Android recognizes future updates as yours." },
    { cat: "Build apps", route: "#/build", pro: true, title: "Protect your app's files (Encryption)", desc: "Keep source code and private documents unreadable inside the APK.", body: "AES-256-GCM encryption scrambles HTML/JS assets inside the APK. Choose Basic mode or Private Lock with a passphrase." },
    { cat: "Build apps", route: "#/build", title: "Bottom navigation bar", desc: "Add a tab bar so people can move between pages.", body: "Enable Native Bottom Navigation in Build APK and define your tab links easily." },
    { cat: "Tools", route: "#/templates", title: "Templates", desc: "Start from a professionally designed app.", body: "Browse ready-made templates with live thumbnail previews and clone them straight into your Code Editor." },
    { cat: "Tools", route: "#/lab", title: "Lab (community projects)", desc: "See what others built and clone the ones you like.", body: "Explore public community starter projects and clone any project into your workspace in 1 tap." },
    { cat: "Tools", route: "#/files", title: "File Manager", desc: "Keep images, documents and archives next to your projects.", body: "Upload assets up to 1MB into browser storage, preview thumbnails, or delete unused files." },
    { cat: "GitHub Build", route: "#/github-build", title: "GitHub Build (native Android projects)", desc: "Write Kotlin/Java Android code and build an APK or AAB with Gradle.", body: "Connect your GitHub repository, edit Java code in the browser IDE, and compile APK/AAB on GitHub Actions." },
    { cat: "GitHub Build", route: "#/github-build", title: "The GitHub Build editor", desc: "An Android-Studio-style workspace in your browser.", body: "Edit MainActivity.java, adjust package names and branches, and inspect live GitHub Actions workflow links." },
    { cat: "GitHub Build", route: "#/github-build", title: "Signing keystore", desc: "Required to publish releases and updates.", body: "Create or import a signing keystore identifier before releasing to Google Play." },
    { cat: "Account & payments", route: "#/wallet", title: "Wallet", desc: "Add money once and pay instantly for templates and plans.", body: "Top up via bKash or Nagad with TrxID and receipt screenshot, then track balance & transaction history." },
    { cat: "Account & payments", route: "#/subscription", pro: true, title: "Subscription (Wevlo Pro)", desc: "Unlock Encryption, App Lock, Push Notifications and Ads.", body: "Upgrade from Free to Wevlo Pro directly using your Wallet balance." },
    { cat: "Account & payments", route: "#/payments", title: "Payments history", desc: "Track every payment and its status.", body: "View Pending and Completed deposits and Pro plan purchases in one table." },
    { cat: "Build apps", route: "#/push", pro: true, title: "Push Notifications", desc: "Send messages straight to your users' phones.", body: "Compose title and body campaigns for your app users from the Push Notifications dashboard." },
    { cat: "Account & payments", route: "#/settings", title: "Settings & profile", desc: "Your details, stats and shortcuts.", body: "Update your profile name, default package prefix, theme preference, and linked Google/GitHub accounts." },
    { cat: "Tools", route: "#/icons", title: "Icon Library", desc: "Free outline icons for your projects.", body: "Search clean Lucide outline icons and copy their HTML/SVG snippet with 1 click." },
    { cat: "Tools", route: "#/secure-converter", title: "Secure Converter", desc: "Make your HTML harder to read and copy.", body: "Paste HTML into Secure Converter to encode and obfuscate markup against casual inspection." }
  ];

  // 19 FAQ Items
  const faqs = [
    ["What is the difference between APK and AAB?", "APK is directly installable on Android phones. AAB (Android App Bundle) is the bundle format required by Google Play Store."],
    ["Which build type should I use, Release or Debug?", "Use Debug for quick testing on your own phone, and Release with your signing key when sharing publicly."],
    ["My build failed. What should I check?", "Make sure GitHub is connected, your package name has at least two segments (e.g. com.app.name), and Java syntax is valid."],
    ["How do I send an update of my app?", "Use the exact same signing key/keystore and increase the Version Code before building again."],
    ["The camera, microphone or location does not work in my app.", "Enable Camera, Microphone, and Location checkboxes under Permissions in Build APK settings."],
    ["What is a signing key and do I need one?", "A signing key proves you are the real developer of the app so Android allows future updates."],
    ["I cleared my browser or I'm on a new device. Where is my signing key?", "Keys created in the browser are stored locally. Always export or back up your key string safely."],
    ["How safe is Encryption?", "AES-256-GCM encryption protects your bundled HTML/CSS/JS files from casual unzip inspection."],
    ["Why does my app ask for a passphrase when it opens?", "Private Lock mode was enabled under Encryption or App Lock settings."],
    ["Why can't I switch on Encryption, App Lock, Push or Ads?", "Those advanced modules carry a PRO badge and require an active Wevlo Pro subscription."],
    ["My links open in the browser, not inside my app.", "Ensure WebViewClient internal link handling is enabled in your Web Engine settings."],
    ["My projects or files disappeared.", "Browser storage clears if you wipe site data; push important projects to GitHub or export backups."],
    ["My payment still says Pending.", "Manual bKash/Nagad TrxID submissions wait for admin verification before balance updates."],
    ["I lost my keystore or its password.", "Play Store apps cannot be updated with a different keystore; you must publish under a new package name if lost."],
    ["Can Wevlo admins see my projects and files?", "No — local projects stay on your device, and GitHub projects stay inside your private or public GitHub account."],
    ["Are my GitHub files safe?", "Yes, Wevlo uses official GitHub OAuth tokens stored only for your active browser session."],
    ["Can I use my own code, not only a website?", "Yes! Use Code Editor for HTML/CSS/JS or GitHub Build for native Java/Android apps."],
    ["How does Secure Converter protect my HTML?", "It encodes your HTML payload into obfuscated JavaScript/entities so View Source shows unreadable code."],
    ["Can I test templates before building an APK?", "Yes, clone any template into My Projects and open the Preview tool to test Phone, Tablet, and Desktop views."]
  ];

  // 10 Glossary Terms
  const glossary = [
    ["APK", "The installable app file for Android."],
    ["AAB", "Android App Bundle, the file you upload to Google Play."],
    ["Package name", "The unique ID of your app, like com.mycompany.myapp."],
    ["Version name / code", "Display version (1.0.0) + integer build number that rises on updates."],
    ["WebView", "The part of Android that shows a website or web page inside your app."],
    ["Keystore", "A file that signs your app so Android and Google Play verify updates come from you."],
    ["Gradle", "The tool that compiles and builds Android projects."],
    ["GitHub Actions", "GitHub's cloud service that runs your Gradle build automatically."],
    ["Interstitial", "A full-screen ad shown between screens."],
    ["TrxID", "The transaction ID you get from bKash or Nagad after sending money."]
  ];

  // Action Bindings
  window.openGuideDetail = (idx) => {
    const g = docGuides[idx];
    if (!g) return;
    document.getElementById("guideCatBadge").textContent = g.cat + (g.pro ? " • PRO" : "");
    document.getElementById("guideTitle").textContent = g.title;
    document.getElementById("guideBody").textContent = g.body;
    const btn = document.getElementById("guideActionBtn");
    btn.onclick = () => {
      document.getElementById("guideModal").classList.add("hidden");
      navigate(g.route);
    };
    const m = document.getElementById("guideModal");
    m.classList.remove("hidden");
    m.classList.add("flex");
    if (window.lucide) window.lucide.createIcons();
  };

  window.runSecureConvert = () => {
    const raw = document.getElementById("secInput").value;
    const mode = document.getElementById("secMode").value;
    if (!raw.trim()) return showToast("আগে HTML কোড পেস্ট করুন!", "error");
    let out = "";
    if (mode === "base64") {
      const b64 = btoa(unescape(encodeURIComponent(raw)));
      out = `<!-- Protected by Wevlo Secure Converter -->\n<script>document.write(decodeURIComponent(escape(atob("${b64}"))));<\/script>`;
    } else {
      const hex = Array.from(raw).map((c) => "&#x" + c.charCodeAt(0).toString(16) + ";").join("");
      out = `<!-- Entity Obfuscated by Wevlo -->\n<div>${hex}</div>`;
    }
    state.secOutput = out;
    document.getElementById("secOutput").value = out;
    addActivity("Obfuscated HTML with Secure Converter");
    showToast("HTML সফলভাবে Convert হয়েছে!", "success");
  };

  window.applySecuredToProject = () => {
    const out = document.getElementById("secOutput").value;
    const proj = state.projects.find((p) => p.id === state.activeProjectId) || state.projects[0];
    if (!proj || !out) return showToast("সক্রিয় প্রজেক্ট বা কনভার্টেড কোড নেই!", "error");
    proj.html = out;
    saveProjects();
    showToast(`Applied to "${proj.name}"!`, "success");
  };

  window.upgradePlanWithWallet = (price) => {
    if (state.wallet.balance < price) {
      showToast(`Wallet balance কম! কমপক্ষে ৳${price} Add Funds করুন।`, "error");
      return navigate("#/wallet");
    }
    state.wallet.balance -= price;
    state.wallet.spent += price;
    state.plan = "Pro";
    state.payments.unshift({
      id: "PAY-" + Date.now(),
      title: "Wevlo Pro Plan",
      amount: price,
      method: "Wallet",
      status: "Completed",
      date: new Date().toLocaleDateString()
    });
    localStorage.setItem("wevlo_wallet", JSON.stringify(state.wallet));
    localStorage.setItem("wevlo_payments", JSON.stringify(state.payments));
    localStorage.setItem("wevlo_plan", "Pro");
    addActivity("Upgraded to Wevlo Pro Plan");
    render();
    showToast("Wevlo Pro সক্রিয় হয়েছে!", "success");
  };

  window.cloneLabProject = (idx) => {
    const items = [
      {
        name: "Neon Task Tracker",
        html: `<div class="app"><h2>My Tasks</h2><input id="t" placeholder="New task"/><button onclick="add()">Add</button><ul id="l"></ul></div>`,
        css: `body{font-family:sans-serif;background:#0f172a;color:#fff;padding:24px}button{background:#7c3aed;color:#fff;border:none;padding:8px 16px;border-radius:8px}`,
        js: `function add(){if(t.value){l.innerHTML+='<li>'+t.value+'</li>';t.value=''}}`
      },
      {
        name: "Flashlight Utility UI",
        html: `<div class="c"><h1>Flash Control</h1><button onclick="this.classList.toggle('on')">TOGGLE POWER</button></div>`,
        css: `body{display:grid;place-items:center;height:100vh;background:#f6f6fb;font-family:sans-serif}button{padding:18px 28px;border-radius:99px;border:none;background:#6d28d9;color:#fff;font-weight:bold}button.on{background:#eab308;color:#000}`,
        js: ``
      },
      {
        name: "Business Bio Card",
        html: `<div class="card"><h1>Studio Digital</h1><p>Web &amp; Mobile Apps</p><a href="https://example.com">Visit Website</a></div>`,
        css: `body{background:#ece8ff;font-family:sans-serif;padding:30px}.card{background:#fff;padding:24px;border-radius:20px;text-align:center}a{display:inline-block;margin-top:12px;background:#6d28d9;color:#fff;padding:10px 20px;border-radius:99px;text-decoration:none}`,
        js: ``
      }
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
    addActivity(`Cloned "${it.name}" from Lab`);
    showToast(`"${it.name}" ক্লোন হয়েছে!`, "success");
    navigate("#/editor");
  };

  window.uploadFileManagerItem = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) return showToast("1MB-এর কম ফাইল দিন।", "error");
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
      addActivity(`Uploaded file ${file.name}`);
      render();
      showToast("File uploaded!", "success");
    };
    r.readAsDataURL(file);
  };

  window.deleteFileItem = (id) => {
    openConfirmModal({
      title: "Delete File?",
      message: "This file will be permanently removed from browser storage.",
      onConfirm: () => {
        state.files = state.files.filter((f) => f.id !== id);
        localStorage.setItem("wevlo_files", JSON.stringify(state.files));
        render();
        showToast("File deleted", "info");
      }
    });
  };

  window.copyLucideIconSvg = (name) => {
    navigator.clipboard?.writeText(`<i data-lucide="${name}"></i>`);
    showToast(`Copied <i data-lucide="${name}"></i>`, "success");
  };

  window.sendPushDemo = () => {
    const title = document.getElementById("pushTitle").value.trim();
    const body = document.getElementById("pushBody").value.trim();
    if (!title || !body) return showToast("Title ও Message লিখুন!", "error");
    state.pushLogs.unshift({ title, body, time: new Date().toLocaleTimeString() });
    localStorage.setItem("wevlo_push_logs", JSON.stringify(state.pushLogs));
    addActivity(`Sent Push: ${title}`);
    render();
    showToast("Push Notification sent!", "success");
  };

  window.submitSupportTicket = () => {
    const s = document.getElementById("supSubject").value.trim();
    const m = document.getElementById("supMsg").value.trim();
    if (!s || !m) return showToast("Subject ও Message লিখুন!", "error");
    addActivity(`Support ticket: ${s}`);
    document.getElementById("supSubject").value = "";
    document.getElementById("supMsg").value = "";
    showToast("সাপোর্ট মেসেজ পাঠানো হয়েছে!", "success");
  };

  // Extra Pages Router
  switch (state.route) {
    case "#/secure-converter":
      return `
        <div class="hero-lavender rounded-[24px] p-5 flex items-center justify-between">
          <div>
            <h1 class="text-xl font-extrabold">Secure <span class="text-purple-700">Converter</span></h1>
            <p class="text-xs text-slate-600">Make your HTML harder to read, inspect and copy inside APKs.</p>
          </div>
          <div class="icon-box-purple w-11 h-11 rounded-2xl flex items-center justify-center">
            <i data-lucide="shield-alert" class="w-5 h-5"></i>
          </div>
        </div>
        <div class="wevlo-card p-5 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <label class="text-xs font-bold">Protection Method</label>
            <select id="secMode" class="border border-soft rounded-xl px-3 py-1.5 text-xs font-bold bg-transparent">
              <option value="base64">Base64 JS Loader (Recommended)</option>
              <option value="entities">HTML Hex Entity Obfuscation</option>
            </select>
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-bold text-muted">Input HTML</label>
              <textarea id="secInput" rows="10" placeholder="<h1>Paste your HTML here...</h1>" class="w-full mt-1 bg-slate-950 text-sky-300 font-mono text-xs p-3.5 rounded-2xl"></textarea>
            </div>
            <div>
              <label class="text-xs font-bold text-muted">Secured Output</label>
              <textarea id="secOutput" rows="10" readonly class="w-full mt-1 bg-slate-950 text-emerald-300 font-mono text-xs p-3.5 rounded-2xl">${state.secOutput || ""}</textarea>
            </div>
          </div>
          <div class="flex flex-wrap gap-2.5">
            <button onclick="runSecureConvert()" class="btn-purple px-5 py-2.5 rounded-full text-xs font-bold">Convert / Protect HTML</button>
            <button onclick="navigator.clipboard?.writeText(document.getElementById('secOutput').value); showToast('Copied secured HTML!','success')" class="border border-soft px-4 py-2.5 rounded-full text-xs font-bold">Copy Output</button>
            <button onclick="applySecuredToProject()" class="border border-soft px-4 py-2.5 rounded-full text-xs font-bold text-purple-600">Apply to Active Project</button>
          </div>
        </div>`;

    case "#/subscription":
      return `
        <div class="hero-lavender rounded-[24px] p-5 flex items-center justify-between">
          <div>
            <span class="pro-badge">PRO PLAN</span>
            <h1 class="text-2xl font-extrabold mt-1">Wevlo <span class="text-purple-700">Subscription</span></h1>
            <p class="text-xs text-slate-600 mt-1">Unlock Encryption, App Lock, Push Notifications and Ads.</p>
          </div>
          <div class="icon-box-purple w-12 h-12 rounded-2xl flex items-center justify-center"><i data-lucide="crown" class="w-6 h-6"></i></div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="wevlo-card p-6 space-y-4">
            <h3 class="font-extrabold text-lg">Free Plan</h3>
            <p class="text-2xl font-extrabold">৳0 <span class="text-xs font-normal text-muted">/ forever</span></p>
            <ul class="text-xs space-y-2 text-muted">
              <li>✓ HTML/CSS/JS Editor &amp; Device Preview</li>
              <li>✓ Website to App &amp; GitHub Java APK Builds</li>
              <li>✓ Templates, Icon Library &amp; Secure Converter</li>
            </ul>
            <button class="w-full py-2.5 rounded-full border border-soft text-xs font-bold">${state.plan === "Free" ? "Current Plan" : "Basic Plan"}</button>
          </div>
          <div class="wevlo-card p-6 space-y-4 border-2 border-purple-600">
            <div class="flex justify-between items-center">
              <h3 class="font-extrabold text-lg">Wevlo Pro</h3>
              <span class="pro-badge">RECOMMENDED</span>
            </div>
            <p class="text-2xl font-extrabold text-purple-700">৳299 <span class="text-xs font-normal text-muted">/ month</span></p>
            <ul class="text-xs space-y-2">
              <li>✓ AES-256-GCM Source Encryption</li>
              <li>✓ Biometric / Passphrase App Lock</li>
              <li>✓ Push Notifications &amp; AdMob Ads</li>
            </ul>
            <button onclick="upgradePlanWithWallet(299)" class="w-full btn-purple py-2.5 rounded-full text-xs font-bold">
              ${state.plan === "Pro" ? "✓ Active Pro Plan" : "Upgrade with Wallet (৳299)"}
            </button>
          </div>
        </div>`;

    case "#/payments":
      return `
        <div class="wevlo-card p-5 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="font-extrabold text-lg flex items-center gap-2"><i data-lucide="receipt" class="w-5 h-5 text-purple-600"></i> Payments History</h2>
            <button onclick="navigate('#/wallet')" class="btn-purple px-4 py-1.5 rounded-full text-xs font-bold">+ Add Funds</button>
          </div>
          ${
            state.payments.length === 0
              ? `<p class="text-center text-xs text-muted py-10">No payment transactions yet.</p>`
              : `<div class="overflow-x-auto">
                  <table class="w-full text-left text-xs">
                    <thead>
                      <tr class="border-b border-soft text-muted">
                        <th class="py-2">Title</th><th>Method</th><th>Date</th><th>Amount</th><th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${state.payments
                        .map(
                          (p) => `
                        <tr class="border-b last:border-0 border-soft">
                          <td class="py-3 font-bold">${p.title}</td>
                          <td>${p.method}</td>
                          <td>${p.date}</td>
                          <td class="font-extrabold">৳${p.amount}</td>
                          <td><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === "Completed" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                          }">${p.status}</span></td>
                        </tr>`
                        )
                        .join("")}
                    </tbody>
                  </table>
                </div>`
          }
        </div>`;

    case "#/push":
      return `
        <div class="wevlo-card p-5 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="font-extrabold text-lg flex items-center gap-2"><i data-lucide="bell-ring" class="w-5 h-5 text-purple-600"></i> Push Notifications</h2>
            <span class="pro-badge">PRO</span>
          </div>
          <p class="text-xs text-muted">Send messages straight to your users' phones.</p>
          <input id="pushTitle" placeholder="Notification Title" class="w-full border border-soft rounded-xl px-3.5 py-2.5 text-sm bg-transparent" />
          <textarea id="pushBody" rows="3" placeholder="Notification Message..." class="w-full border border-soft rounded-xl px-3.5 py-2.5 text-sm bg-transparent"></textarea>
          <button onclick="sendPushDemo()" class="btn-purple px-6 py-2.5 rounded-full text-xs font-bold">Send Push Notification</button>
          <div class="pt-3 border-t border-soft space-y-2">
            <h4 class="font-bold text-xs text-muted uppercase">Sent List</h4>
            ${
              state.pushLogs.length === 0
                ? `<p class="text-xs text-muted">No notifications sent yet.</p>`
                : state.pushLogs
                    .map((n) => `<div class="p-3 rounded-xl border border-soft text-xs"><b>${n.title}</b> — ${n.body} <span class="text-muted">(${n.time})</span></div>`)
                    .join("")
            }
          </div>
        </div>`;

    case "#/lab":
      return `
        <div class="hero-lavender rounded-[24px] p-5 flex items-center justify-between">
          <div>
            <h1 class="text-xl font-extrabold">Wevlo <span class="text-purple-700">Lab</span></h1>
            <p class="text-xs text-slate-600">See what others built and clone the ones you like.</p>
          </div>
          <div class="icon-box-purple w-11 h-11 rounded-2xl flex items-center justify-center"><i data-lucide="flask-conical" class="w-5 h-5"></i></div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${["Neon Task Tracker", "Flashlight Utility UI", "Business Bio Card"]
            .map(
              (t, i) => `
              <div class="wevlo-card p-5 space-y-3">
                <span class="text-[10px] font-bold bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full">Public Project</span>
                <h3 class="font-bold text-base">${t}</h3>
                <p class="text-xs text-muted">Clone and edit directly in Code Editor.</p>
                <button onclick="cloneLabProject(${i})" class="w-full btn-purple py-2 rounded-full text-xs font-bold">Clone Project</button>
              </div>`
            )
            .join("")}
        </div>`;

    case "#/files":
      return `
        <div class="wevlo-card p-5 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="font-extrabold text-lg">File Manager</h2>
              <p class="text-xs text-muted">Keep images, documents and archives next to your projects.</p>
            </div>
            <label class="btn-purple px-4 py-2 rounded-full text-xs font-bold cursor-pointer">
              + Upload File
              <input type="file" class="hidden" onchange="uploadFileManagerItem(event)" />
            </label>
          </div>
          ${
            state.files.length === 0
              ? `<p class="py-10 text-center text-xs text-muted">No files uploaded yet.</p>`
              : `<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  ${state.files
                    .map(
                      (f) => `
                    <div class="p-3 rounded-2xl border border-soft flex items-center justify-between gap-2">
                      <div class="flex items-center gap-2.5 min-w-0">
                        ${
                          f.type.startsWith("image/")
                            ? `<img src="${f.dataUrl}" class="w-10 h-10 rounded-xl object-cover shrink-0" />`
                            : `<span class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0"><i data-lucide="file" class="w-5 h-5"></i></span>`
                        }
                        <div class="min-w-0">
                          <p class="font-bold text-xs truncate">${f.name}</p>
                          <p class="text-[11px] text-muted">${f.size}</p>
                        </div>
                      </div>
                      <button onclick="deleteFileItem('${f.id}')" class="p-1.5 text-rose-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>`
                    )
                    .join("")}
                </div>`
          }
        </div>`;

    case "#/icons": {
      const icons = [
        "home", "rocket", "code-2", "smartphone", "globe", "wallet",
        "crown", "bell", "folder", "settings", "shield-check", "lock",
        "eye", "download", "upload-cloud", "github", "zap", "heart",
        "star", "search", "user", "mail", "camera", "compass"
      ];
      const q = (state.iconSearch || "").toLowerCase();
      return `
        <div class="wevlo-card p-5 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="font-extrabold text-lg">Icon Library</h2>
              <p class="text-xs text-muted">Free outline icons — click to copy code.</p>
            </div>
            <input value="${state.iconSearch || ""}" oninput="state.iconSearch=this.value; render()" placeholder="Search icons..." class="border border-soft rounded-full px-4 py-2 text-xs bg-transparent" />
          </div>
          <div class="grid grid-cols-3 sm:grid-cols-6 gap-3">
            ${icons
              .filter((i) => i.includes(q))
              .map(
                (ic) => `
              <button onclick="copyLucideIconSvg('${ic}')" class="p-4 rounded-2xl border border-soft hover:border-purple-500 flex flex-col items-center gap-2 transition">
                <i data-lucide="${ic}" class="w-6 h-6 text-purple-600"></i>
                <span class="text-[11px] text-muted">${ic}</span>
              </button>`
              )
              .join("")}
          </div>
        </div>`;
    }

    case "#/docs": {
      const q = (state.docSearch || "").toLowerCase();
      const cat = state.docCat || "All";
      const cats = ["All", "Getting started", "Build apps", "GitHub Build", "Account & payments", "Tools"];
      const filtered = docGuides
        .map((g, i) => ({ ...g, idx: i }))
        .filter((g) => (cat === "All" || g.cat === cat) && (g.title.toLowerCase().includes(q) || g.desc.toLowerCase().includes(q)));

      return `
        <div class="sticky top-16 z-20 hero-lavender rounded-[24px] p-5 space-y-3 shadow-sm">
          <h1 class="text-xl font-extrabold">Help &amp; Documentation</h1>
          <input value="${state.docSearch || ""}" oninput="state.docSearch=this.value; render()" placeholder="Search the guides… (try “icon”, “push”, “GitHub”)" class="w-full bg-white text-slate-900 rounded-full px-4 py-2.5 text-xs border border-purple-200 focus:outline-none" />
          <div class="flex flex-wrap gap-1.5">
            ${cats
              .map(
                (c) => `<button onclick="state.docCat='${c}'; render()" class="px-3 py-1 rounded-full text-[11px] font-bold ${cat === c ? "btn-purple" : "bg-white text-slate-700"}">${c}</button>`
              )
              .join("")}
          </div>
        </div>

        <div class="wevlo-card p-5 space-y-3">
          <h2 class="font-extrabold text-base">Quick start: your first app in 4 steps</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <button onclick="openNewProjectModal()" class="text-left p-3.5 rounded-2xl border border-soft hover:border-purple-500"><b>1. Create a project</b><p class="text-muted mt-1">Website link, blank page or template.</p></button>
            <button onclick="navigate('#/editor')" class="text-left p-3.5 rounded-2xl border border-soft hover:border-purple-500"><b>2. Edit &amp; preview</b><p class="text-muted mt-1">Change code &amp; test on phone view.</p></button>
            <button onclick="navigate('#/build')" class="text-left p-3.5 rounded-2xl border border-soft hover:border-purple-500"><b>3. Choose features</b><p class="text-muted mt-1">Pick name, icon, permissions &amp; nav bar.</p></button>
            <button onclick="navigate('#/build')" class="text-left p-3.5 rounded-2xl border border-soft hover:border-purple-500"><b>4. Build &amp; install</b><p class="text-muted mt-1">Start Build → Download APK → Install.</p></button>
          </div>
        </div>

        <div class="wevlo-card p-5 space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="font-extrabold text-base">Guides</h2>
            <span class="text-xs font-bold bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full">${filtered.length}</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            ${filtered
              .map(
                (g) => `
              <button onclick="openGuideDetail(${g.idx})" class="text-left p-3.5 rounded-2xl border border-soft hover:border-purple-500 transition">
                <div class="flex items-center justify-between gap-2">
                  <p class="font-bold text-xs">${g.title}</p>
                  ${g.pro ? '<span class="pro-badge">PRO</span>' : ""}
                </div>
                <p class="text-[11px] text-muted mt-1">${g.desc}</p>
              </button>`
              )
              .join("")}
          </div>
        </div>

        <div class="wevlo-card p-5 space-y-3">
          <h2 class="font-extrabold text-base">Questions &amp; answers (${faqs.length})</h2>
          <div class="space-y-2">
            ${faqs
              .map(
                ([qT, a]) => `
              <details class="p-3.5 rounded-2xl border border-soft text-xs">
                <summary class="font-bold cursor-pointer">${qT}</summary>
                <p class="text-muted mt-2 leading-relaxed">${a}</p>
              </details>`
              )
              .join("")}
          </div>
        </div>

        <div class="wevlo-card p-5 space-y-3">
          <h2 class="font-extrabold text-base">Simple word list</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            ${glossary
              .map(([t, d]) => `<div class="p-3 rounded-xl border border-soft"><b>${t}:</b> <span class="text-muted">${d}</span></div>`)
              .join("")}
          </div>
        </div>`;
    }

    case "#/privacy":
      return `
        <div class="wevlo-card p-6 space-y-4 text-xs leading-relaxed">
          <h1 class="text-xl font-extrabold">Privacy Policy</h1>
          <p class="text-muted">Your projects and files stay on your device, and GitHub projects stay in your GitHub account.</p>
          <ul class="list-disc pl-5 space-y-2 text-muted">
            <li><b>Authentication:</b> Gmail and GitHub logins use Firebase Authentication securely.</li>
            <li><b>GitHub Repositories:</b> Accessed only via OAuth when you trigger a build or list your projects.</li>
            <li><b>Browser Keys:</b> Locally created signing keys stay on your browser unless exported.</li>
          </ul>
        </div>`;

    case "#/support":
      return `
        <div class="wevlo-card p-6 space-y-4">
          <h1 class="text-xl font-extrabold">Support / Contact</h1>
          <p class="text-xs text-muted">
            Still stuck? Send a message or email us at
            <a href="mailto:support@wevlo.app" class="text-purple-600 font-bold underline">support@wevlo.app</a>
          </p>
          <input id="supSubject" placeholder="Subject" class="w-full border border-soft rounded-xl px-4 py-2.5 text-sm bg-transparent" />
          <textarea id="supMsg" rows="4" placeholder="Write your message..." class="w-full border border-soft rounded-xl px-4 py-2.5 text-sm bg-transparent"></textarea>
          <button onclick="submitSupportTicket()" class="btn-purple px-6 py-2.5 rounded-full text-xs font-bold">Send Support Message</button>
        </div>`;
  }
  return "";
        }
