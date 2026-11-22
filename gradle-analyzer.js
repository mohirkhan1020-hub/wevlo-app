// ======================================================
// File 1/4: gradle-analyzer.js
// Complete Multi-Language & Android Gradle Engine
// ======================================================

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
  let clean = (raw || "")
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "")
    .replace(/\.+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  const parts = clean
    .split(".")
    .map((p) => p.replace(/^[^a-z]+/, ""))
    .filter(Boolean);
  if (parts.length < 2) return fallback;
  return parts.join(".");
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
  "MainActivity.java": `package com.wevlo.app;

import android.app.Activity;
import android.os.Bundle;

public class MainActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
    }
}`,

  "settings.gradle": `pluginManagement {
    repositories {
        gradlePluginPortal()
        google()
        mavenCentral()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        maven { url 'https://jitpack.io' }
    }
}
rootProject.name = "WevloApp"
include ':app'`,

  "build.gradle": `plugins {
    id 'com.android.application' version '8.5.2' apply false
}`,

  "app/build.gradle": `plugins {
    id 'com.android.application'
}

android {
    namespace 'com.wevlo.app'
    compileSdk 34

    defaultConfig {
        applicationId "com.wevlo.app"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
    }

    buildTypes {
        release {
            minifyEnabled false
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
}`,

  "gradle.properties": `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true`,

  "app/src/main/AndroidManifest.xml": `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <application
        android:label="@string/app_name"
        android:usesCleartextTraffic="true"
        android:theme="@android:style/Theme.DeviceDefault.Light.NoActionBar">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`
};

export function buildFrameworkStarter(lang = "java", opts = {}) {
  const pkg = sanitizePackageName(opts.packageName, "com.wevlo.app");
  const pkgPath = pkg.replace(/\./g, "/");
  const appName = (opts.appName || "").trim() || `Hello ${lang.charAt(0).toUpperCase() + lang.slice(1)}`;
  const safeXmlAppName = escapeXmlText(appName);
  const verName = sanitizeVersionName(opts.versionName, "1.0.0");
  const verCode = sanitizeVersionCode(opts.versionCode, 1);
  const gradleRootName = appName.replace(/[^a-zA-Z0-9_-]/g, "") || "WevloApp";

  const settingsGradle = DEFAULT_ANDROID_TEMPLATES["settings.gradle"].replace(
    'rootProject.name = "WevloApp"',
    `rootProject.name = "${gradleRootName}"`
  );

  if (lang === "java") {
    return {
      "settings.gradle": settingsGradle,
      "build.gradle": DEFAULT_ANDROID_TEMPLATES["build.gradle"],
      "gradle.properties": DEFAULT_ANDROID_TEMPLATES["gradle.properties"],
      "app/build.gradle": `plugins {
    id 'com.android.application'
}

android {
    namespace '${pkg}'
    compileSdk 34

    defaultConfig {
        applicationId "${pkg}"
        minSdk 24
        targetSdk 34
        versionCode ${verCode}
        versionName "${verName}"
    }

    buildTypes {
        release {
            minifyEnabled false
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
}`,
      "app/src/main/AndroidManifest.xml": DEFAULT_ANDROID_TEMPLATES["app/src/main/AndroidManifest.xml"],
      "app/src/main/res/values/strings.xml": `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${safeXmlAppName}</string>
</resources>`,
      "app/src/main/res/layout/activity_main.xml": `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:gravity="center"
    android:padding="24dp">

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Hello, ${safeXmlAppName}!"
        android:textSize="22sp"
        android:textStyle="bold" />
</LinearLayout>`,
      [`app/src/main/java/${pkgPath}/MainActivity.java`]: `package ${pkg};

import android.app.Activity;
import android.os.Bundle;

public class MainActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
    }
}`
    };
  }

  if (lang === "kotlin") {
    return {
      "settings.gradle": settingsGradle,
      "build.gradle": `plugins {
    id 'com.android.application' version '8.5.2' apply false
    id 'org.jetbrains.kotlin.android' version '1.9.24' apply false
}`,
      "gradle.properties": DEFAULT_ANDROID_TEMPLATES["gradle.properties"],
      "app/build.gradle": `plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
}

android {
    namespace '${pkg}'
    compileSdk 34

    defaultConfig {
        applicationId "${pkg}"
        minSdk 24
        targetSdk 34
        versionCode ${verCode}
        versionName "${verName}"
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = '17'
    }
}

dependencies {
    implementation 'androidx.core:core-ktx:1.13.1'
}`,
      "app/src/main/AndroidManifest.xml": DEFAULT_ANDROID_TEMPLATES["app/src/main/AndroidManifest.xml"],
      "app/src/main/res/values/strings.xml": `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${safeXmlAppName}</string>
</resources>`,
      "app/src/main/res/layout/activity_main.xml": `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:gravity="center"
    android:padding="24dp">

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Hello, ${safeXmlAppName}!"
        android:textSize="22sp"
        android:textStyle="bold" />
</LinearLayout>`,
      [`app/src/main/java/${pkgPath}/MainActivity.kt`]: `package ${pkg}

import android.app.Activity
import android.os.Bundle

class MainActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
    }
}`
    };
  }

  if (lang === "flutter") {
    const dartPubName = (pkg.split(".").pop() || "wevlo_app").replace(/[^a-z0-9_]/g, "_") || "wevlo_app";
    return {
      "pubspec.yaml": `name: ${dartPubName}
description: ${appName}
publish_to: 'none'
version: ${verName}+${verCode}

environment:
  sdk: '>=3.2.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter

flutter:
  uses-material-design: true
`,
      "lib/main.dart": `import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '${appName.replace(/'/g, "\\'")}',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorSchemeSeed: const Color(0xFF6D28D9),
        useMaterial3: true,
      ),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('${appName.replace(/'/g, "\\'")}')),
      body: const Center(
        child: Text(
          'Hello, World!',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
}`,
      "android/app/src/main/AndroidManifest.xml": `<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <application
        android:label="${safeXmlAppName}"
        android:name="\${applicationName}"
        android:icon="@mipmap/ic_launcher">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:theme="@style/LaunchTheme"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|smallestScreenSize|locale|layoutDirection|fontScale|screenLayout|density|uiMode"
            android:hardwareAccelerated="true"
            android:windowSoftInputMode="adjustResize">
            <meta-data
                android:name="io.flutter.embedding.android.NormalTheme"
                android:resource="@style/NormalTheme" />
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        <meta-data
            android:name="flutterEmbedding"
            android:value="2" />
    </application>
</manifest>`,
      "android/app/src/main/res/values/styles.xml": `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="LaunchTheme" parent="@android:style/Theme.Light.NoTitleBar">
        <item name="android:windowBackground">@android:color/white</item>
    </style>
    <style name="NormalTheme" parent="@android:style/Theme.Light.NoTitleBar">
        <item name="android:windowBackground">?android:colorBackground</item>
    </style>
</resources>`,
      [`android/app/src/main/kotlin/${pkgPath}/MainActivity.kt`]: `package ${pkg}

import io.flutter.embedding.android.FlutterActivity

class MainActivity: FlutterActivity()
`,
      "android/app/build.gradle": `plugins {
    id "com.android.application"
    id "kotlin-android"
    id "dev.flutter.flutter-gradle-plugin"
}

android {
    namespace = "${pkg}"
    compileSdk = flutter.compileSdkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17
    }

    defaultConfig {
        applicationId = "${pkg}"
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = ${verCode}
        versionName = "${verName}"
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("debug")
        }
    }
}

flutter {
    source = "../.."
}`
    };
  }

  if (lang === "capacitor") {
    const capName = (pkg.split(".").pop() || "wevlo-cap-app").replace(/[^a-z0-9-]/g, "-") || "wevlo-cap-app";
    return {
      "package.json": `{
  "name": "${capName}",
  "version": "${verName}",
  "dependencies": {
    "@capacitor/core": "^6.1.0",
    "@capacitor/android": "^6.1.0",
    "@capacitor/cli": "^6.1.0"
  }
}`,
      "capacitor.config.json": `{
  "appId": "${pkg}",
  "appName": "${appName.replace(/"/g, '\\"')}",
  "webDir": "www"
}`,
      "www/index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeXmlAppName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      display: grid;
      place-items: center;
      min-height: 100vh;
      margin: 0;
      background: #f6f6fb;
      color: #0f172a;
      text-align: center;
    }
    button {
      margin-top: 12px;
      padding: 12px 24px;
      border: none;
      border-radius: 999px;
      background: #6d28d9;
      color: #fff;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div>
    <h1>${safeXmlAppName}</h1>
    <p>Capacitor Android App</p>
    <button onclick="alert('Working!')">Test Button</button>
  </div>
</body>
</html>`
    };
  }

  // python
  const parts = pkg.split(".");
  const pyName = (parts.pop() || "wevlopy").replace(/[^a-z0-9]/g, "") || "wevlopy";
  const pyDomain = parts.join(".") || "com.wevlo";
  return {
    "main.py": `from kivy.app import App
from kivy.uix.label import Label


class MainApp(App):
    def build(self):
        return Label(text="Hello, ${appName.replace(/"/g, '\\"')}!", font_size="24sp")


if __name__ == "__main__":
    MainApp().run()`,
    "buildozer.spec": `[app]
title = ${appName}
package.name = ${pyName}
package.domain = ${pyDomain}
source.dir = .
source.include_exts = py,png,jpg,kv,atlas
version = ${verName}
requirements = python3,kivy
orientation = portrait

[buildozer]
log_level = 2`
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
      if (pkg) {
        g = g.replace(/(applicationId\s*(?:=|\s)\s*)["'][^"']+["']/, `$1"${pkg}"`);
      }
      if (verCode >= 1) {
        g = g.replace(/(versionCode\s*(?:=|\s)\s*)\d+/, `$1${verCode}`);
      }
      if (verName) {
        g = g.replace(/(versionName\s*(?:=|\s)\s*)["'][^"']+["']/, `$1"${verName}"`);
      }
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
      if (/^\s*version:/m.test(p)) {
        p = p.replace(/^(\s*version:\s*).+$/m, `$1${vn}+${vc}`);
      } else {
        p += `\nversion: ${vn}+${vc}\n`;
      }
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
  java: [
    ["settings.gradle", "settings.gradle.kts"],
    ["build.gradle", "build.gradle.kts"],
    ["gradle.properties"],
    ["app/build.gradle", "app/build.gradle.kts"],
    ["app/src/main/AndroidManifest.xml"]
  ],
  kotlin: [
    ["settings.gradle", "settings.gradle.kts"],
    ["build.gradle", "build.gradle.kts"],
    ["gradle.properties"],
    ["app/build.gradle", "app/build.gradle.kts"],
    ["app/src/main/AndroidManifest.xml"]
  ],
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

export function generateWorkflowYaml(
  branch = "main",
  gradleTask = "assembleDebug",
  versionName = "1.0",
  useCloudSigning = false,
  framework = "java",
  packageName = "com.wevlo.app"
) {
  const safeTagVer = sanitizeVersionName(versionName, "1.0");
  const safeOrg = sanitizePackageName(packageName, "com.wevlo.app").split(".").slice(0, 2).join(".") || "com.wevlo";

  if (framework === "flutter") {
    const flCmd = gradleTask.includes("bundle")
      ? "flutter build appbundle --release"
      : gradleTask.includes("Release")
      ? "flutter build apk --release"
      : "flutter build apk --debug";
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
      - uses: actions/checkout@v6
      - uses: actions/setup-java@v5
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
            if [ -d ".wevlo_bak/assets" ]; then rm -rf assets && cp -r .wevlo_bak/assets .; fi
            if [ -f ".wevlo_bak/pubspec.yaml" ]; then cp .wevlo_bak/pubspec.yaml pubspec.yaml; fi
            if [ -f ".wevlo_bak/AndroidManifest.xml" ]; then cp .wevlo_bak/AndroidManifest.xml android/app/src/main/AndroidManifest.xml; fi
            if [ -f ".wevlo_bak/app_build.gradle" ]; then cp .wevlo_bak/app_build.gradle android/app/build.gradle; fi
            if [ -d ".wevlo_bak/kotlin" ]; then
              rm -rf android/app/src/main/kotlin
              cp -r .wevlo_bak/kotlin android/app/src/main/kotlin
            else
              PKG=$(grep -E 'namespace' android/app/build.gradle | head -n1 | sed -E "s/.*['\\"]([^'\\"]+)['\\"].*/\\1/")
              if [ -n "$PKG" ]; then
                PKG_DIR="android/app/src/main/kotlin/$(echo "$PKG" | tr '.' '/')"
                rm -rf android/app/src/main/kotlin
                mkdir -p "$PKG_DIR"
                printf "package %s\\n\\nimport io.flutter.embedding.android.FlutterActivity\\n\\nclass MainActivity: FlutterActivity()\\n" "$PKG" > "$PKG_DIR/MainActivity.kt"
              fi
            fi
            rm -rf .wevlo_bak
          fi
          if [ -f "android/app/build.gradle" ] && ! grep -q "jvmTarget" android/app/build.gradle; then
            printf '\\nandroid {\\n    compileOptions {\\n        sourceCompatibility = JavaVersion.VERSION_17\\n        targetCompatibility = JavaVersion.VERSION_17\\n    }\\n    kotlinOptions {\\n        jvmTarget = "17"\\n    }\\n}\\n' >> android/app/build.gradle
          fi
          flutter pub get 2>&1 | tee build-output.log
          ${flCmd} 2>&1 | tee -a build-output.log
      - name: Publish Release
        if: success()
        env:
          GH_TOKEN: \${{ github.token }}
        run: |
          shopt -s nullglob
          FILES=(build/app/outputs/flutter-apk/*.apk build/app/outputs/bundle/release/*.aab)
          if [ \${#FILES[@]} -gt 0 ]; then
            gh release create "v${safeTagVer}-\${{ github.run_number }}" "\${FILES[@]}" --title "v${safeTagVer}-\${{ github.run_number }}" --notes "Built with Wevlo"
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
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: '22'
      - uses: actions/setup-java@v5
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
      - name: Publish Release
        if: success()
        env:
          GH_TOKEN: \${{ github.token }}
        run: |
          shopt -s nullglob globstar
          FILES=(android/app/build/outputs/apk/**/*.apk android/app/build/outputs/bundle/**/*.aab)
          if [ \${#FILES[@]} -gt 0 ]; then
            gh release create "v${safeTagVer}-\${{ github.run_number }}" "\${FILES[@]}" --title "v${safeTagVer}-\${{ github.run_number }}" --notes "Built with Wevlo"
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
      - uses: actions/checkout@v6
      - uses: ArtemSBulgakov/buildozer-action@v1
        with:
          command: "buildozer android debug"
          buildozer_version: "stable"
      - name: Publish Release
        if: success()
        env:
          GH_TOKEN: \${{ github.token }}
        run: |
          shopt -s nullglob
          FILES=(bin/*.apk)
          if [ \${#FILES[@]} -gt 0 ]; then
            gh release create "v${safeTagVer}-\${{ github.run_number }}" "\${FILES[@]}" --title "v${safeTagVer}-\${{ github.run_number }}" --notes "Built with Wevlo"
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
      - uses: actions/checkout@v6
      - uses: actions/setup-java@v5
        with:
          distribution: 'temurin'
          java-version: '17'
      - uses: gradle/actions/setup-gradle@v6
        with:
          gradle-version: '8.7'
          cache-provider: basic
      - name: Run Gradle Build
        run: |
          set -o pipefail
          if [ -f "./gradlew" ]; then
            chmod +x ./gradlew
            ./gradlew ${cmd} --no-daemon --stacktrace 2>&1 | tee build-output.log
          else
            gradle ${cmd} --no-daemon --stacktrace 2>&1 | tee build-output.log
          fi
      - name: Publish Release
        if: success()
        env:
          GH_TOKEN: \${{ github.token }}
        run: |
          shopt -s nullglob globstar
          FILES=(app/build/outputs/apk/**/*.apk app/build/outputs/bundle/**/*.aab)
          if [ \${#FILES[@]} -gt 0 ]; then
            gh release create "v${safeTagVer}-\${{ github.run_number }}" "\${FILES[@]}" --title "v${safeTagVer}-\${{ github.run_number }}" --notes "Built with Wevlo"
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
    issues.push({
      severity: "error",
      file: path,
      line: 1,
      message: "Workflow YAML file is empty. Add valid GitHub Actions YAML.",
      fixPath: path,
      fixContent: generateWorkflowYaml(branch, "assembleDebug", "1.0", false, framework)
    });
    return issues;
  }

  const lines = content.split("\n");
  lines.forEach((ln, idx) => {
    if (ln.includes("\t")) {
      issues.push({
        severity: "error",
        file: path,
        line: idx + 1,
        message: "Tabs (\\t) are not allowed in YAML. Use spaces instead.",
        fixPath: path,
        fixContent: content.replace(/\t/g, "  ")
      });
    }
  });

  if (path.includes(".github/workflows/")) {
    if (!/^\s*on\s*:/m.test(content) || !/^\s*jobs\s*:/m.test(content)) {
      issues.push({
        severity: "error",
        file: path,
        line: 1,
        message: "GitHub Actions YAML is missing 'on:' or 'jobs:' section.",
        fixPath: path,
        fixContent: generateWorkflowYaml(branch, "assembleDebug", "1.0", false, framework)
      });
    }
  }
  return issues;
}

export function lintCodeLines(path, content, branch = "main", framework = "java") {
  const issues = [];
  if (!path || content === undefined || content === null) return issues;
  if (path.endsWith(".yml") || path.endsWith(".yaml")) {
    return lintYamlWorkflow(path, content, branch, framework);
  }
  if (!content) return issues;
  if ((path === "build.gradle" || path === "build.gradle.kts") && /allprojects\s*\{[\s\S]*repositories\s*\{/.test(content)) {
    issues.push({
      severity: "error",
      file: path,
      line: 1,
      message: `${path} contains allprojects { repositories }, which conflicts with FAIL_ON_PROJECT_REPOS in settings.gradle.`,
      fixPath: path,
      fixContent: DEFAULT_ANDROID_TEMPLATES["build.gradle"]
    });
  }
  if (framework === "flutter" && (path === "android/app/build.gradle" || path === "android/app/build.gradle.kts") && !content.includes("jvmTarget")) {
    issues.push({
      severity: "error",
      file: path,
      line: 1,
      message: "Flutter android/app/build.gradle is missing Java 17 / Kotlin jvmTarget compatibility.",
      fixPath: "android/app/build.gradle",
      fixContent: FRAMEWORK_STARTERS.flutter["android/app/build.gradle"]
    });
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
      const hasAny = alternatives.some((p) => paths.includes(p));
      if (!hasAny) {
        const primary = alternatives[0];
        if (starter[primary] !== undefined) {
          problems.push({
            severity: "error",
            file: primary,
            line: 1,
            message: `Missing required file: ${alternatives.join(" or ")}`,
            fixPath: primary,
            fixContent: starter[primary]
          });
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
  if (base === "clear" || base === "cls") {
    clearTerminal();
    return [];
  }
  if (base === "help") return ["Commands: gradle check, ls, build, clear, help"];
  if (base === "ls") return treeFiles.length ? treeFiles.slice(0, 40).map((f) => `  ${f.path}`) : ["(Empty)"];
  if (base === "build") {
    triggerBuild();
    return ["Triggering cloud build..."];
  }
  if (cmd === "gradle check" || base === "check") {
    const issues = analyzeProjectIssues({ treeFiles, activePath, activeContent, branch, framework });
    return issues.length ? issues.map((i) => `  [${i.severity.toUpperCase()}] ${i.file}: ${i.message}`) : ["All files look good!"];
  }
  return [`Unknown command '${cmd}'. Type 'help'.`];
}
