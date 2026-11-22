// === START OF FILE: gradle-analyzer.js (STEP 1 OF 4) ===
// Complete Multi-Language & Android Gradle Engine

export const APP_FRAMEWORKS = [
  { id: "java", name: "Java Android", badge: "☕ Java", desc: "Android Studio Gradle", color: "text-amber-500", bg: "bg-amber-500/15" },
  { id: "kotlin", name: "Kotlin Native", badge: "🟣 Kotlin", desc: "Modern Android Native", color: "text-purple-500", bg: "bg-purple-500/15" },
  { id: "flutter", name: "Flutter (Dart)", badge: "🐦 Flutter", desc: "Cross-platform Dart UI", color: "text-sky-500", bg: "bg-sky-500/15" },
  { id: "capacitor", name: "Capacitor JS", badge: "⚡ JS / Web", desc: "HTML/CSS/JS to APK", color: "text-emerald-500", bg: "bg-emerald-500/15" },
  { id: "python", name: "Python Kivy", badge: "🐍 Python", desc: "Python Buildozer APK", color: "text-yellow-500", bg: "bg-yellow-500/15" }
];

export const ANDROID_LIBRARIES = [
  { id: "appcompat", name: "AndroidX AppCompat", impl: "implementation 'androidx.appcompat:appcompat:1.7.0'", desc: "Modern ActionBar & compatibility" },
  { id: "material", name: "Material Components", impl: "implementation 'com.google.android.material:material:1.12.0'", desc: "Material buttons, cards & sheets" },
  { id: "constraintlayout", name: "ConstraintLayout", impl: "implementation 'androidx.constraintlayout:constraintlayout:2.1.4'", desc: "Responsive constraints" },
  { id: "recyclerview", name: "RecyclerView", impl: "implementation 'androidx.recyclerview:recyclerview:1.3.2'", desc: "Fast scrolling lists" },
  { id: "glide", name: "Glide Image Loader", impl: "implementation 'com.github.bumptech.glide:glide:4.16.0'", desc: "Network image loader" },
  { id: "retrofit", name: "Retrofit2 + Gson", impl: "implementation 'com.squareup.retrofit2:retrofit:2.11.0'\n    implementation 'com.squareup.retrofit2:converter-gson:2.11.0'", desc: "REST API JSON networking" },
  { id: "lottie", name: "Lottie Animations", impl: "implementation 'com.airbnb.android:lottie:6.4.0'", desc: "JSON animations" }
];

export function sanitizePackageName(raw, fallback = "com.wevlo.myapp") {
  const clean = (raw || "")
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "")
    .replace(/\.+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  const parts = clean.split(".").map((p) => p.replace(/^[^a-z]+/, "")).filter(Boolean);
  return parts.length >= 2 ? parts.join(".") : fallback;
}

export function sanitizeVersionName(raw, fallback = "1.0.0") {
  const v = (raw || "").trim().replace(/[^a-zA-Z0-9._-]/g, "");
  return v || fallback;
}

export function sanitizeVersionCode(raw, fallback = 1) {
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 ? n : fallback;
}

function escapeXmlText(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const DEFAULT_ANDROID_TEMPLATES = {
  "MainActivity.java": `package com.wevlo.app;\n\nimport android.app.Activity;\nimport android.os.Bundle;\n\npublic class MainActivity extends Activity {\n    @Override\n    protected void onCreate(Bundle savedInstanceState) {\n        super.onCreate(savedInstanceState);\n        setContentView(R.layout.activity_main);\n    }\n}`,

  "settings.gradle": `pluginManagement {\n    repositories {\n        gradlePluginPortal()\n        google()\n        mavenCentral()\n    }\n}\ndependencyResolutionManagement {\n    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)\n    repositories {\n        google()\n        mavenCentral()\n        maven { url 'https://jitpack.io' }\n    }\n}\nrootProject.name = "WevloApp"\ninclude ':app'`,

  "build.gradle": `plugins {\n    id 'com.android.application' version '8.5.2' apply false\n}`,

  "app/build.gradle": `plugins {\n    id 'com.android.application'\n}\n\nandroid {\n    namespace 'com.wevlo.app'\n    compileSdk 34\n\n    defaultConfig {\n        applicationId "com.wevlo.app"\n        minSdk 24\n        targetSdk 34\n        versionCode 1\n        versionName "1.0.0"\n    }\n\n    buildTypes {\n        release {\n            minifyEnabled false\n        }\n    }\n\n    compileOptions {\n        sourceCompatibility JavaVersion.VERSION_17\n        targetCompatibility JavaVersion.VERSION_17\n    }\n}\n\ndependencies {\n}`,

  "gradle.properties": `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8\nandroid.useAndroidX=true\nandroid.nonTransitiveRClass=true`,

  "app/src/main/AndroidManifest.xml": `<?xml version="1.0" encoding="utf-8"?>\n<manifest xmlns:android="http://schemas.android.com/apk/res/android">\n    <uses-permission android:name="android.permission.INTERNET" />\n    <application\n        android:label="@string/app_name"\n        android:usesCleartextTraffic="true"\n        android:theme="@android:style/Theme.DeviceDefault.Light.NoActionBar">\n        <activity\n            android:name=".MainActivity"\n            android:exported="true"\n            android:configChanges="orientation|screenSize|keyboardHidden">\n            <intent-filter>\n                <action android:name="android.intent.action.MAIN" />\n                <category android:name="android.intent.category.LAUNCHER" />\n            </intent-filter>\n        </activity>\n    </application>\n</manifest>`
};

export function buildFrameworkStarter(lang = "java", opts = {}) {
  const pkg = sanitizePackageName(opts.packageName, "com.wevlo.app");
  const pkgPath = pkg.replace(/\./g, "/");
  const appName = (opts.appName || "").trim() || `Hello ${lang.charAt(0).toUpperCase() + lang.slice(1)}`;
  const safeXmlAppName = escapeXmlText(appName);
  const verName = sanitizeVersionName(opts.versionName, "1.0.0");
  const verCode = sanitizeVersionCode(opts.versionCode, 1);
  const gradleRootName = appName.replace(/[^a-zA-Z0-9_-]/g, "") || "WevloApp";
  const settingsGradle = DEFAULT_ANDROID_TEMPLATES["settings.gradle"].replace('rootProject.name = "WevloApp"', `rootProject.name = "${gradleRootName}"`);

  if (lang === "java") {
    return {
      "settings.gradle": settingsGradle,
      "build.gradle": DEFAULT_ANDROID_TEMPLATES["build.gradle"],
      "gradle.properties": DEFAULT_ANDROID_TEMPLATES["gradle.properties"],
      "app/build.gradle": `plugins {\n    id 'com.android.application'\n}\n\nandroid {\n    namespace '${pkg}'\n    compileSdk 34\n\n    defaultConfig {\n        applicationId "${pkg}"\n        minSdk 24\n        targetSdk 34\n        versionCode ${verCode}\n        versionName "${verName}"\n    }\n\n    buildTypes {\n        release {\n            minifyEnabled false\n        }\n    }\n\n    compileOptions {\n        sourceCompatibility JavaVersion.VERSION_17\n        targetCompatibility JavaVersion.VERSION_17\n    }\n}\n\ndependencies {\n}`,
      "app/src/main/AndroidManifest.xml": DEFAULT_ANDROID_TEMPLATES["app/src/main/AndroidManifest.xml"],
      "app/src/main/res/values/strings.xml": `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <string name="app_name">${safeXmlAppName}</string>\n</resources>`,
      "app/src/main/res/layout/activity_main.xml": `<?xml version="1.0" encoding="utf-8"?>\n<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"\n    android:layout_width="match_parent"\n    android:layout_height="match_parent"\n    android:orientation="vertical"\n    android:gravity="center"\n    android:padding="24dp">\n\n    <TextView\n        android:layout_width="wrap_content"\n        android:layout_height="wrap_content"\n        android:text="Hello, ${safeXmlAppName}!"\n        android:textSize="22sp"\n        android:textStyle="bold" />\n</LinearLayout>`,
      [`app/src/main/java/${pkgPath}/MainActivity.java`]: `package ${pkg};\n\nimport android.app.Activity;\nimport android.os.Bundle;\n\npublic class MainActivity extends Activity {\n    @Override\n    protected void onCreate(Bundle savedInstanceState) {\n        super.onCreate(savedInstanceState);\n        setContentView(R.layout.activity_main);\n    }\n}`
    };
  }

  if (lang === "kotlin") {
    return {
      "settings.gradle": settingsGradle,
      "build.gradle": `plugins {\n    id 'com.android.application' version '8.5.2' apply false\n    id 'org.jetbrains.kotlin.android' version '1.9.24' apply false\n}`,
      "gradle.properties": DEFAULT_ANDROID_TEMPLATES["gradle.properties"],
      "app/build.gradle": `plugins {\n    id 'com.android.application'\n    id 'org.jetbrains.kotlin.android'\n}\n\nandroid {\n    namespace '${pkg}'\n    compileSdk 34\n\n    defaultConfig {\n        applicationId "${pkg}"\n        minSdk 24\n        targetSdk 34\n        versionCode ${verCode}\n        versionName "${verName}"\n    }\n\n    compileOptions {\n        sourceCompatibility JavaVersion.VERSION_17\n        targetCompatibility JavaVersion.VERSION_17\n    }\n\n    kotlinOptions {\n        jvmTarget = '17'\n    }\n}\n\ndependencies {\n    implementation 'androidx.core:core-ktx:1.13.1'\n}`,
      "app/src/main/AndroidManifest.xml": DEFAULT_ANDROID_TEMPLATES["app/src/main/AndroidManifest.xml"],
      "app/src/main/res/values/strings.xml": `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <string name="app_name">${safeXmlAppName}</string>\n</resources>`,
      "app/src/main/res/layout/activity_main.xml": `<?xml version="1.0" encoding="utf-8"?>\n<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"\n    android:layout_width="match_parent"\n    android:layout_height="match_parent"\n    android:orientation="vertical"\n    android:gravity="center"\n    android:padding="24dp">\n\n    <TextView\n        android:layout_width="wrap_content"\n        android:layout_height="wrap_content"\n        android:text="Hello, ${safeXmlAppName}!"\n        android:textSize="22sp"\n        android:textStyle="bold" />\n</LinearLayout>`,
      [`app/src/main/java/${pkgPath}/MainActivity.kt`]: `package ${pkg}\n\nimport android.app.Activity\nimport android.os.Bundle\n\nclass MainActivity : Activity() {\n    override fun onCreate(savedInstanceState: Bundle?) {\n        super.onCreate(savedInstanceState)\n        setContentView(R.layout.activity_main)\n    }\n}`
    };
  }

  if (lang === "flutter") {
    const dartPubName = (pkg.split(".").pop() || "wevlo_app").replace(/[^a-z0-9_]/g, "_") || "wevlo_app";
    return {
      "pubspec.yaml": `name: ${dartPubName}\ndescription: ${appName}\npublish_to: 'none'\nversion: ${verName}+${verCode}\n\nenvironment:\n  sdk: '>=3.2.0 <4.0.0'\n\ndependencies:\n  flutter:\n    sdk: flutter\n\nflutter:\n  uses-material-design: true\n`,
      "lib/main.dart": `import 'package:flutter/material.dart';\n\nvoid main() {\n  runApp(const MyApp());\n}\n\nclass MyApp extends StatelessWidget {\n  const MyApp({super.key});\n\n  @override\n  Widget build(BuildContext context) {\n    return MaterialApp(\n      title: '${appName.replace(/'/g, "\\'")}',\n      debugShowCheckedModeBanner: false,\n      theme: ThemeData(\n        colorSchemeSeed: const Color(0xFF6D28D9),\n        useMaterial3: true,\n      ),\n      home: const HomePage(),\n    );\n  }\n}\n\nclass HomePage extends StatelessWidget {\n  const HomePage({super.key});\n\n  @override\n  Widget build(BuildContext context) {\n    return Scaffold(\n      appBar: AppBar(title: const Text('${appName.replace(/'/g, "\\'")}')),\n      body: const Center(\n        child: Text(\n          'Hello, World!',\n          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),\n        ),\n      ),\n    );\n  }\n}`,
      "android/app/src/main/AndroidManifest.xml": `<manifest xmlns:android="http://schemas.android.com/apk/res/android">\n    <uses-permission android:name="android.permission.INTERNET" />\n    <application\n        android:label="${safeXmlAppName}"\n        android:name="\${applicationName}"\n        android:icon="@mipmap/ic_launcher">\n        <activity\n            android:name=".MainActivity"\n            android:exported="true"\n            android:launchMode="singleTop"\n            android:theme="@style/LaunchTheme"\n            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|smallestScreenSize|locale|layoutDirection|fontScale|screenLayout|density|uiMode"\n            android:hardwareAccelerated="true"\n            android:windowSoftInputMode="adjustResize">\n            <meta-data\n                android:name="io.flutter.embedding.android.NormalTheme"\n                android:resource="@style/NormalTheme" />\n            <intent-filter>\n                <action android:name="android.intent.action.MAIN" />\n                <category android:name="android.intent.category.LAUNCHER" />\n            </intent-filter>\n        </activity>\n        <meta-data\n            android:name="flutterEmbedding"\n            android:value="2" />\n    </application>\n</manifest>`,
      "android/app/src/main/res/values/styles.xml": `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <style name="LaunchTheme" parent="@android:style/Theme.Light.NoTitleBar">\n        <item name="android:windowBackground">@android:color/white</item>\n    </style>\n    <style name="NormalTheme" parent="@android:style/Theme.Light.NoTitleBar">\n        <item name="android:windowBackground">?android:colorBackground</item>\n    </style>\n</resources>`,
      [`android/app/src/main/kotlin/${pkgPath}/MainActivity.kt`]: `package ${pkg}\n\nimport io.flutter.embedding.android.FlutterActivity\n\nclass MainActivity: FlutterActivity()\n`,
      "android/app/build.gradle": `plugins {\n    id "com.android.application"\n    id "kotlin-android"\n    id "dev.flutter.flutter-gradle-plugin"\n}\n\nandroid {\n    namespace = "${pkg}"\n    compileSdk = flutter.compileSdkVersion\n\n    compileOptions {\n        sourceCompatibility = JavaVersion.VERSION_17\n        targetCompatibility = JavaVersion.VERSION_17\n    }\n\n    kotlinOptions {\n        jvmTarget = JavaVersion.VERSION_17\n    }\n\n    defaultConfig {\n        applicationId = "${pkg}"\n        minSdk = flutter.minSdkVersion\n        targetSdk = flutter.targetSdkVersion\n        versionCode = ${verCode}\n        versionName = "${verName}"\n    }\n\n    buildTypes {\n        release {\n            signingConfig = signingConfigs.getByName("debug")\n        }\n    }\n}\n\nflutter {\n    source = "../.."\n}`
    };
  }

  if (lang === "capacitor") {
    const capName = (pkg.split(".").pop() || "wevlo-cap-app").replace(/[^a-z0-9-]/g, "-") || "wevlo-cap-app";
    return {
      "package.json": `{\n  "name": "${capName}",\n  "version": "${verName}",\n  "dependencies": {\n    "@capacitor/core": "^6.1.0",\n    "@capacitor/android": "^6.1.0",\n    "@capacitor/cli": "^6.1.0"\n  }\n}`,
      "capacitor.config.json": `{\n  "appId": "${pkg}",\n  "appName": "${appName.replace(/"/g, '\\"')}",\n  "webDir": "www"\n}`,
      "www/index.html": `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>${safeXmlAppName}</title>\n  <style>\n    body { font-family: sans-serif; display: grid; place-items: center; min-height: 100vh; margin: 0; background: #f6f6fb; color: #0f172a; text-align: center; }\n    button { margin-top: 12px; padding: 12px 24px; border: none; border-radius: 999px; background: #6d28d9; color: #fff; font-weight: 700; }\n  </style>\n</head>\n<body>\n  <div>\n    <h1>${safeXmlAppName}</h1>\n    <p>Capacitor Android App</p>\n    <button onclick="alert('Working!')">Test Button</button>\n  </div>\n</body>\n</html>`
    };
  }

  const parts = pkg.split(".");
  const pyName = (parts.pop() || "wevlopy").replace(/[^a-z0-9]/g, "") || "wevlopy";
  const pyDomain = parts.join(".") || "com.wevlo";
  return {
    "main.py": `from kivy.app import App\nfrom kivy.uix.label import Label\n\nclass MainApp(App):\n    def build(self):\n        return Label(text="Hello, ${appName.replace(/"/g, '\\"')}!", font_size="24sp")\n\nif __name__ == "__main__":\n    MainApp().run()`,
    "buildozer.spec": `[app]\ntitle = ${appName}\npackage.name = ${pyName}\npackage.domain = ${pyDomain}\nsource.dir = .\nsource.include_exts = py,png,jpg,kv,atlas\nversion = ${verName}\nrequirements = python3,kivy\norientation = portrait\n\n[buildozer]\nlog_level = 2`
  };
}

export const FRAMEWORK_STARTERS = {
  java: buildFrameworkStarter("java", { appName: "Hello Java", packageName: "com.wevlo.app" }),
  kotlin: buildFrameworkStarter("kotlin", { appName: "Hello Kotlin", packageName: "com.wevlo.app" }),
  flutter: buildFrameworkStarter("flutter", { appName: "Hello Flutter", packageName: "com.wevlo.flutterapp" }),
  capacitor: buildFrameworkStarter("capacitor", { appName: "Hello Capacitor", packageName: "com.wevlo.capapp" }),
  python: buildFrameworkStarter("python", { appName: "Hello Python", packageName: "com.wevlo.wevlopy" })
};

export function extractAppConfigFromFiles(filesMap = {}, framework = "java") {
  const cfg = { appName: "", packageName: "", versionName: "1.0.0", versionCode: "1" };
  if (framework === "java" || framework === "kotlin") {
    const gradle = filesMap["app/build.gradle"] || filesMap["app/build.gradle.kts"] || "";
    const appIdM = gradle.match(/applicationId\s*(?:=|\s)\s*["']([^"']+)["']/);
    const nsM = gradle.match(/namespace\s*(?:=|\s)\s*["']([^"']+)["']/);
    const vcM = gradle.match(/versionCode\s*(?:=|\s)\s*(\d+)/);
    const vnM = gradle.match(/versionName\s*(?:=|\s)\s*["']([^"']+)["']/);
    if (appIdM) cfg.packageName = appIdM[1];
    else if (nsM) cfg.packageName = nsM[1];
    if (vcM) cfg.versionCode = vcM[1];
    if (vnM) cfg.versionName = vnM[1];
    const stringsXml = filesMap["app/src/main/res/values/strings.xml"] || "";
    const strM = stringsXml.match(/<string\s+name=["']app_name["'][^>]*>([^<]*)<\/string>/);
    const manifest = filesMap["app/src/main/AndroidManifest.xml"] || "";
    const manLblM = manifest.match(/android:label=["']([^"'@][^"']*)["']/);
    cfg.appName = (strM && strM[1]) || (manLblM && manLblM[1]) || "";
  } else if (framework === "flutter") {
    const pub = filesMap["pubspec.yaml"] || "";
    const pubVer = pub.match(/^\s*version:\s*([^\s+#]+)(?:\+(\d+))?/m);
    if (pubVer) {
      cfg.versionName = pubVer[1];
      if (pubVer[2]) cfg.versionCode = pubVer[2];
    }
    const gradle = filesMap["android/app/build.gradle"] || filesMap["android/app/build.gradle.kts"] || "";
    const appIdM = gradle.match(/applicationId\s*(?:=|\s)\s*["']([^"']+)["']/);
    if (appIdM) cfg.packageName = appIdM[1];
    const manifest = filesMap["android/app/src/main/AndroidManifest.xml"] || "";
    const manLblM = manifest.match(/android:label=["']([^"']+)["']/);
    if (manLblM) cfg.appName = manLblM[1];
  } else if (framework === "capacitor") {
    try {
      const cap = JSON.parse(filesMap["capacitor.config.json"] || "{}");
      cfg.packageName = cap.appId || "";
      cfg.appName = cap.appName || "";
    } catch {}
    try {
      const pkgJ = JSON.parse(filesMap["package.json"] || "{}");
      if (pkgJ.version) cfg.versionName = pkgJ.version;
    } catch {}
  } else if (framework === "python") {
    const spec = filesMap["buildozer.spec"] || "";
    const tM = spec.match(/^\s*title\s*=\s*(.+)$/m);
    const nM = spec.match(/^\s*package\.name\s*=\s*(.+)$/m);
    const dM = spec.match(/^\s*package\.domain\s*=\s*(.+)$/m);
    const vM = spec.match(/^\s*version\s*=\s*(.+)$/m);
    if (tM) cfg.appName = tM[1].trim();
    if (dM && nM) cfg.packageName = `${dM[1].trim()}.${nM[1].trim()}`;
    if (vM) cfg.versionName = vM[1].trim();
  }
  return cfg;
}

export function applyAppConfigToFiles(filesMap = {}, config = {}, framework = "java") {
  const updates = {};
  const pkg = sanitizePackageName(config.packageName, "");
  const appName = (config.appName || "").trim();
  const verName = sanitizeVersionName(config.versionName, "");
  const verCode = sanitizeVersionCode(config.versionCode, 0);

  if (framework === "java" || framework === "kotlin") {
    const gradlePath = filesMap["app/build.gradle.kts"] !== undefined ? "app/build.gradle.kts" : "app/build.gradle";
    if (filesMap[gradlePath] !== undefined) {
      let g = filesMap[gradlePath];
      if (pkg) g = g.replace(/(applicationId\s*(?:=|\s)\s*)["'][^"']+["']/, `$1"${pkg}"`);
      if (verCode >= 1) g = g.replace(/(versionCode\s*(?:=|\s)\s*)\d+/, `$1${verCode}`);
      if (verName) g = g.replace(/(versionName\s*(?:=|\s)\s*)["'][^"']+["']/, `$1"${verName}"`);
      if (g !== filesMap[gradlePath]) updates[gradlePath] = g;
    }
    if (appName) {
      const safeName = escapeXmlText(appName);
      const strPath = "app/src/main/res/values/strings.xml";
      if (filesMap[strPath] !== undefined) {
        let s = filesMap[strPath];
        if (/<string\s+name=["']app_name["']/.test(s)) {
          s = s.replace(/(<string\s+name=["']app_name["'][^>]*>)[^<]*(<\/string>)/, `$1${safeName}$2`);
        } else {
          s = s.replace("</resources>", `    <string name="app_name">${safeName}</string>\n</resources>`);
        }
        if (s !== filesMap[strPath]) updates[strPath] = s;
      } else {
        const manPath = "app/src/main/AndroidManifest.xml";
        if (filesMap[manPath] !== undefined) {
          let m = filesMap[manPath];
          if (m.includes("@string/app_name")) {
            updates[strPath] = `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <string name="app_name">${safeName}</string>\n</resources>`;
          } else {
            m = m.replace(/(android:label=["'])[^"']+["']/, `$1${safeName}"`);
            if (m !== filesMap[manPath]) updates[manPath] = m;
          }
        }
      }
    }
  } else if (framework === "flutter") {
    if (filesMap["pubspec.yaml"] !== undefined && (verName || verCode >= 1)) {
      let p = filesMap["pubspec.yaml"];
      const vn = verName || "1.0.0";
      const vc = verCode >= 1 ? verCode : 1;
      p = /^\s*version:/m.test(p) ? p.replace(/^(\s*version:\s*).+$/m, `$1${vn}+${vc}`) : p + `\nversion: ${vn}+${vc}\n`;
      if (p !== filesMap["pubspec.yaml"]) updates["pubspec.yaml"] = p;
    }
    const gPath = filesMap["android/app/build.gradle.kts"] !== undefined ? "android/app/build.gradle.kts" : "android/app/build.gradle";
    if (filesMap[gPath] !== undefined) {
      let g = filesMap[gPath];
      if (pkg) g = g.replace(/(applicationId\s*(?:=|\s)\s*)["'][^"']+["']/, `$1"${pkg}"`);
      if (verCode >= 1 && /versionCode\s*(?:=|\s)\s*\d+/.test(g)) g = g.replace(/(versionCode\s*(?:=|\s)\s*)\d+/, `$1${verCode}`);
      if (verName && /versionName\s*(?:=|\s)\s*["'][^"']+["']/.test(g)) g = g.replace(/(versionName\s*(?:=|\s)\s*)["'][^"']+["']/, `$1"${verName}"`);
      if (g !== filesMap[gPath]) updates[gPath] = g;
    }
    const mPath = "android/app/src/main/AndroidManifest.xml";
    if (appName && filesMap[mPath] !== undefined) {
      const m = filesMap[mPath].replace(/(android:label=["'])[^"']+["']/, `$1${escapeXmlText(appName)}"`);
      if (m !== filesMap[mPath]) updates[mPath] = m;
    }
  } else if (framework === "capacitor") {
    if (filesMap["capacitor.config.json"] !== undefined) {
      try {
        const cap = JSON.parse(filesMap["capacitor.config.json"]);
        if (pkg) cap.appId = pkg;
        if (appName) cap.appName = appName;
        const next = JSON.stringify(cap, null, 2);
        if (next !== filesMap["capacitor.config.json"]) updates["capacitor.config.json"] = next;
      } catch {}
    }
    if (verName && filesMap["package.json"] !== undefined) {
      try {
        const pkgJ = JSON.parse(filesMap["package.json"]);
        pkgJ.version = verName;
        const next = JSON.stringify(pkgJ, null, 2);
        if (next !== filesMap["package.json"]) updates["package.json"] = next;
      } catch {}
    }
  } else if (framework === "python") {
    if (filesMap["buildozer.spec"] !== undefined) {
      let s = filesMap["buildozer.spec"];
      if (appName) s = s.replace(/^(\s*title\s*=\s*).+$/m, `$1${appName}`);
      if (verName) s = s.replace(/^(\s*version\s*=\s*).+$/m, `$1${verName}`);
      if (pkg) {
        const parts = pkg.split(".");
        const pyName = (parts.pop() || "wevlopy").replace(/[^a-z0-9]/g, "") || "wevlopy";
        const pyDomain = parts.join(".") || "com.wevlo";
        s = s.replace(/^(\s*package\.name\s*=\s*).+$/m, `$1${pyName}`);
        s = s.replace(/^(\s*package\.domain\s*=\s*).+$/m, `$1${pyDomain}`);
      }
      if (s !== filesMap["buildozer.spec"]) updates["buildozer.spec"] = s;
    }
  }
  return updates;
}

const CORE_REQUIRED_GROUPS = {
  java: [["settings.gradle", "settings.gradle.kts"], ["build.gradle", "build.gradle.kts"], ["gradle.properties"], ["app/build.gradle", "app/build.gradle.kts"], ["app/src/main/AndroidManifest.xml"]],
  kotlin: [["settings.gradle", "settings.gradle.kts"], ["build.gradle", "build.gradle.kts"], ["gradle.properties"], ["app/build.gradle", "app/build.gradle.kts"], ["app/src/main/AndroidManifest.xml"]],
  flutter: [["pubspec.yaml"], ["lib/main.dart"]],
  capacitor: [["package.json"], ["capacitor.config.json"], ["www/index.html"]],
  python: [["main.py"], ["buildozer.spec"]]
};

export function detectFramework(treeFiles = []) {
  const paths = treeFiles.map((f) => f.path);
  if (paths.includes("pubspec.yaml")) return "flutter";
  if (paths.includes("buildozer.spec") || paths.includes("main.py")) return "python";
  if (paths.includes("capacitor.config.json")) return "capacitor";
  if (paths.some((p) => p.endsWith(".kt") || p.endsWith(".kts"))) return "kotlin";
  return "java";
}

export function generateWorkflowYaml(branch = "main", gradleTask = "assembleDebug", versionName = "1.0", useCloudSigning = false, framework = "java", packageName = "com.wevlo.app") {
  const safeTagVer = sanitizeVersionName(versionName, "1.0");
  const safeOrg = sanitizePackageName(packageName, "com.wevlo.app").split(".").slice(0, 2).join(".") || "com.wevlo";

  if (framework === "flutter") {
    const flCmd = gradleTask.includes("bundle") ? "flutter build appbundle --release" : gradleTask.includes("Release") ? "flutter build apk --release" : "flutter build apk --debug";
    return `name: Build Flutter APK
on:
  push:
    branches: [ "${branch}" ]
  workflow_dispatch:
permissions:
  contents: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
      - uses: subosito/flutter-action@v2
        with:
          channel: 'stable'
          cache: true
      - name: Setup Android & Build Flutter
        run: |
          set -o pipefail
          if [ ! -f "android/gradlew" ]; then
            mkdir -p .wevlo_bak
            cp -r lib .wevlo_bak/ 2>/dev/null || true
            cp -r assets .wevlo_bak/ 2>/dev/null || true
            cp pubspec.yaml .wevlo_bak/ 2>/dev/null || true
            cp android/app/src/main/AndroidManifest.xml .wevlo_bak/AndroidManifest.xml 2>/dev/null || true
            cp android/app/build.gradle .wevlo_bak/app_build.gradle 2>/dev/null || true
            cp -r android/app/src/main/kotlin .wevlo_bak/kotlin 2>/dev/null || true
            flutter create --org ${safeOrg} --platforms=android .
            rm -rf lib && cp -r .wevlo_bak/lib . 2>/dev/null || true
            [ -d ".wevlo_bak/assets" ] && rm -rf assets && cp -r .wevlo_bak/assets . || true
            [ -f ".wevlo_bak/pubspec.yaml" ] && cp .wevlo_bak/pubspec.yaml pubspec.yaml || true
            [ -f ".wevlo_bak/AndroidManifest.xml" ] && cp .wevlo_bak/AndroidManifest.xml android/app/src/main/AndroidManifest.xml || true
            [ -f ".wevlo_bak/app_build.gradle" ] && cp .wevlo_bak/app_build.gradle android/app/build.gradle || true
            if [ -d ".wevlo_bak/kotlin" ]; then
              rm -rf android/app/src/main/kotlin && cp -r .wevlo_bak/kotlin android/app/src/main/kotlin
            fi
            rm -rf .wevlo_bak
          fi
          flutter pub get 2>&1 | tee build-output.log
          ${flCmd} 2>&1 | tee -a build-output.log
      - name: Upload Build Artifact
        if: success()
        uses: actions/upload-artifact@v4
        with:
          name: app-output
          path: |
            build/app/outputs/flutter-apk/*.apk
            build/app/outputs/bundle/release/*.aab
          if-no-files-found: ignore
      - name: Publish Release
        if: success()
        env:
          GH_TOKEN: \${{ github.token }}
        run: |
          mapfile -t FILES < <(find build/app/outputs -type f \( -name "*.apk" -o -name "*.aab" \) 2>/dev/null)
          if [ \${#FILES[@]} -gt 0 ]; then
            TAG="v${safeTagVer}-\${{ github.run_number }}"
            gh release create "$TAG" "\${FILES[@]}" --title "$TAG" --notes "Built with Wevlo" || gh release upload "$TAG" "\${FILES[@]}" --clobber
          fi
      - name: Upload Failure Log
        if: failure()
        env:
          GH_TOKEN: \${{ github.token }}
        run: |
          if [ -f "build-output.log" ]; then
            gh release delete log-latest -y || true
            gh release create log-latest build-output.log --prerelease --title "Latest Build Log" --notes "Build log" || true
          fi
`;
  }

  if (framework === "capacitor") {
    const capTask = gradleTask.includes("bundle") ? "bundleRelease" : gradleTask.includes("Release") ? "assembleRelease" : "assembleDebug";
    return `name: Build Capacitor APK
on:
  push:
    branches: [ "${branch}" ]
  workflow_dispatch:
permissions:
  contents: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
      - name: Build Capacitor Android
        run: |
          set -o pipefail
          npm install 2>&1 | tee build-output.log
          if [ ! -d "android" ]; then npx cap add android 2>&1 | tee -a build-output.log; fi
          npx cap sync android 2>&1 | tee -a build-output.log
          cd android
          chmod +x gradlew
          ./gradlew ${capTask} --no-daemon --stacktrace 2>&1 | tee -a ../build-output.log
      - name: Upload Build Artifact
        if: success()
        uses: actions/upload-artifact@v4
        with:
          name: app-output
          path: |
            android/app/build/outputs/apk/**/*.apk
            android/app/build/outputs/bundle/**/*.aab
          if-no-files-found: ignore
      - name: Publish Release
        if: success()
        env:
          GH_TOKEN: \${{ github.token }}
        run: |
          mapfile -t FILES < <(find android/app/build/outputs -type f \( -name "*.apk" -o -name "*.aab" \) ! -path "*/intermediates/*" 2>/dev/null)
          if [ \${#FILES[@]} -gt 0 ]; then
            TAG="v${safeTagVer}-\${{ github.run_number }}"
            gh release create "$TAG" "\${FILES[@]}" --title "$TAG" --notes "Built with Wevlo" || gh release upload "$TAG" "\${FILES[@]}" --clobber
          fi
      - name: Upload Failure Log
        if: failure()
        env:
          GH_TOKEN: \${{ github.token }}
        run: |
          if [ -f "build-output.log" ]; then
            gh release delete log-latest -y || true
            gh release create log-latest build-output.log --prerelease --title "Latest Build Log" --notes "Build log" || true
          fi
`;
  }

  if (framework === "python") {
    return `name: Build Python APK
on:
  push:
    branches: [ "${branch}" ]
  workflow_dispatch:
permissions:
  contents: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ArtemSBulgakov/buildozer-action@v1
        with:
          command: "buildozer android debug"
          buildozer_version: "stable"
      - name: Upload Build Artifact
        if: success()
        uses: actions/upload-artifact@v4
        with:
          name: app-output
          path: bin/*.apk
          if-no-files-found: ignore
      - name: Publish Release
        if: success()
        env:
          GH_TOKEN: \${{ github.token }}
        run: |
          mapfile -t FILES < <(find bin -type f -name "*.apk" 2>/dev/null)
          if [ \${#FILES[@]} -gt 0 ]; then
            TAG="v${safeTagVer}-\${{ github.run_number }}"
            gh release create "$TAG" "\${FILES[@]}" --title "$TAG" --notes "Built with Wevlo" || gh release upload "$TAG" "\${FILES[@]}" --clobber
          fi
`;
  }

  const cmd = gradleTask.includes("+") ? gradleTask.split("+").map((t) => t.trim()).join(" ") : gradleTask;
  return `name: Build Android APK / AAB
on:
  push:
    branches: [ "${branch}" ]
  workflow_dispatch:
permissions:
  contents: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
      - uses: gradle/actions/setup-gradle@v4
        with:
          gradle-version: '8.7'
      - name: Run Gradle Build
        run: |
          set -o pipefail
          if [ -f "./gradlew" ]; then
            chmod +x ./gradlew
            ./gradlew ${cmd} --no-daemon --stacktrace 2>&1 | tee build-output.log
          else
            gradle ${cmd} --no-daemon --stacktrace 2>&1 | tee build-output.log
          fi
      - name: Upload Build Artifact
        if: success()
        uses: actions/upload-artifact@v4
        with:
          name: app-output
          path: |
            **/build/outputs/apk/**/*.apk
            **/build/outputs/bundle/**/*.aab
          if-no-files-found: ignore
      - name: Publish Release
        if: success()
        env:
          GH_TOKEN: \${{ github.token }}
        run: |
          mapfile -t FILES < <(find . -path "*/build/outputs/*" -type f \( -name "*.apk" -o -name "*.aab" \) ! -path "*/intermediates/*" 2>/dev/null)
          if [ \${#FILES[@]} -eq 0 ]; then
            mapfile -t FILES < <(find . -type f \( -name "*.apk" -o -name "*.aab" \) ! -path "*/intermediates/*" ! -path "./.gradle/*" 2>/dev/null)
          fi
          if [ \${#FILES[@]} -gt 0 ]; then
            TAG="v${safeTagVer}-\${{ github.run_number }}"
            gh release create "$TAG" "\${FILES[@]}" --title "$TAG" --notes "Built with Wevlo" || gh release upload "$TAG" "\${FILES[@]}" --clobber
          fi
      - name: Upload Failure Log
        if: failure()
        env:
          GH_TOKEN: \${{ github.token }}
        run: |
          if [ -f "build-output.log" ]; then
            gh release delete log-latest -y || true
            gh release create log-latest build-output.log --prerelease --title "Latest Build Log" --notes "Build log" || true
          fi
`;
}

export function extractCompilerErrors(logText = "") {
  const errors = [];
  const seen = new Set();
  for (const raw of logText.split("\n")) {
    const m = raw.match(/([A-Za-z0-9_./-]+\.(?:java|kt|kts|dart|py|xml|gradle|ya?ml)):(\d+):\s*(error|warning)?:?\s*(.+)/i);
    if (m) {
      const file = m[1].replace(/^.*\/(app\/|lib\/|www\/|\.github\/|main\.py|settings\.gradle|build\.gradle)/, "$1");
      const key = `${file}:${m[2]}:${m[4].trim()}`;
      if (!seen.has(key)) {
        seen.add(key);
        errors.push({ file, line: Number(m[2]), severity: (m[3] || "error").toLowerCase(), message: m[4].trim() });
      }
    } else if (/^FAILURE:|>\s*Execution failed for task/i.test(raw.trim())) {
      errors.push({ file: "Build", line: 1, severity: "error", message: raw.trim() });
    }
  }
  return errors.slice(0, 25);
}

export function lintYamlWorkflow(path, content, branch = "main", framework = "java") {
  const issues = [];
  if (!path.endsWith(".yml") && !path.endsWith(".yaml")) return issues;
  if (!content || !content.trim()) {
    issues.push({ severity: "error", file: path, line: 1, message: "Workflow YAML file is empty.", fixPath: path, fixContent: generateWorkflowYaml(branch, "assembleDebug", "1.0", false, framework) });
    return issues;
  }
  content.split("\n").forEach((ln, idx) => {
    if (ln.includes("\t")) {
      issues.push({ severity: "error", file: path, line: idx + 1, message: "Tabs (\\t) are not allowed in YAML.", fixPath: path, fixContent: content.replace(/\t/g, "  ") });
    }
  });
  if (path.includes(".github/workflows/") && (!/^\s*on\s*:/m.test(content) || !/^\s*jobs\s*:/m.test(content))) {
    issues.push({ severity: "error", file: path, line: 1, message: "GitHub Actions YAML is missing 'on:' or 'jobs:'.", fixPath: path, fixContent: generateWorkflowYaml(branch, "assembleDebug", "1.0", false, framework) });
  }
  return issues;
}

export function lintCodeLines(path, content, branch = "main", framework = "java") {
  const issues = [];
  if (!path || content === undefined || content === null) return issues;
  if (path.endsWith(".yml") || path.endsWith(".yaml")) return lintYamlWorkflow(path, content, branch, framework);
  if (!content) return issues;
  if ((path === "build.gradle" || path === "build.gradle.kts") && /allprojects\s*\{[\s\S]*repositories\s*\{/.test(content)) {
    issues.push({ severity: "error", file: path, line: 1, message: `${path} conflicts with FAIL_ON_PROJECT_REPOS in settings.gradle.`, fixPath: path, fixContent: DEFAULT_ANDROID_TEMPLATES["build.gradle"] });
  }
  if (framework === "flutter" && (path === "android/app/build.gradle" || path === "android/app/build.gradle.kts") && !content.includes("jvmTarget")) {
    issues.push({ severity: "error", file: path, line: 1, message: "Flutter android/app/build.gradle is missing Java 17 / Kotlin jvmTarget.", fixPath: "android/app/build.gradle", fixContent: FRAMEWORK_STARTERS.flutter["android/app/build.gradle"] });
  }
  return issues;
}

export function analyzeProjectIssues({ treeFiles = [], activePath = "", activeContent = "", branch = "main", compilerErrors = [], framework = null }) {
  const fw = framework || detectFramework(treeFiles);
  const problems = [...compilerErrors];
  const paths = treeFiles.map((f) => f.path);
  const groups = CORE_REQUIRED_GROUPS[fw] || [];
  const starter = FRAMEWORK_STARTERS[fw] || FRAMEWORK_STARTERS.java;
  if (paths.length > 0) {
    for (const alternatives of groups) {
      if (!alternatives.some((p) => paths.includes(p))) {
        const primary = alternatives[0];
        if (starter[primary] !== undefined) {
          problems.push({ severity: "error", file: primary, line: 1, message: `Missing required file: ${alternatives.join(" or ")}`, fixPath: primary, fixContent: starter[primary] });
        }
      }
    }
  }
  problems.push(...lintCodeLines(activePath, activeContent, branch, fw));
  return problems;
}

export function createActivityTemplates(activityName, pkgName = "com.wevlo.app") {
  const cleanName = activityName.replace(/[^A-Za-z0-9]/g, "");
  const className = cleanName.endsWith("Activity") ? cleanName : cleanName + "Activity";
  const layoutName = "activity_" + className.replace(/Activity$/, "").replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
  return {
    className,
    layoutName,
    javaCode: `package ${pkgName};\n\nimport android.app.Activity;\nimport android.os.Bundle;\n\npublic class ${className} extends Activity {\n    @Override protected void onCreate(Bundle b) { super.onCreate(b); setContentView(R.layout.${layoutName}); }\n}`,
    xmlCode: `<?xml version="1.0" encoding="utf-8"?>\n<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android" android:layout_width="match_parent" android:layout_height="match_parent" android:orientation="vertical" android:gravity="center" android:padding="24dp">\n    <TextView android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="${className}" android:textSize="22sp" />\n    <Button android:layout_width="match_parent" android:layout_height="wrap_content" android:text="Continue" />\n</LinearLayout>`
  };
}

export function runTerminalCommand(rawCmd, ctx) {
  const { treeFiles, activePath, activeContent, branch, framework, triggerBuild, clearTerminal } = ctx;
  const cmd = (rawCmd || "").trim();
  const base = (cmd.split(/\s+/)[0] || "").toLowerCase();
  if (!cmd) return [];
  if (base === "clear" || base === "cls") { clearTerminal(); return []; }
  if (base === "help") return ["Commands: gradle check, ls, build, clear, help"];
  if (base === "ls") return treeFiles.length ? treeFiles.slice(0, 40).map((f) => `  ${f.path}`) : ["(Empty)"];
  if (base === "build") { triggerBuild(); return ["Triggering cloud build..."]; }
  if (cmd === "gradle check" || base === "check") {
    const issues = analyzeProjectIssues({ treeFiles, activePath, activeContent, branch, framework });
    return issues.length ? issues.map((i) => `  [${i.severity.toUpperCase()}] ${i.file}: ${i.message}`) : ["All files look good!"];
  }
  return [`Unknown command '${cmd}'. Type 'help'.`];
}
// === END OF FILE: gradle-analyzer.js (STEP 1 OF 4) ===
