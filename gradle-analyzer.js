// ======================================================
// Complete Multi-Language & Android Gradle Engine
// ======================================================

export const APP_FRAMEWORKS = [
  { id: "java", name: "Java Android", badge: "☕ Java", desc: "Classic Android Studio Gradle", color: "text-amber-500", bg: "bg-amber-500/15" },
  { id: "kotlin", name: "Kotlin Native", badge: "🟣 Kotlin", desc: "Modern official Android", color: "text-purple-500", bg: "bg-purple-500/15" },
  { id: "flutter", name: "Flutter (Dart)", badge: "🐦 Flutter", desc: "Beautiful cross-platform UI", color: "text-sky-500", bg: "bg-sky-500/15" },
  { id: "capacitor", name: "Capacitor JS", badge: "⚡ JS / Web", desc: "HTML/CSS/JS to Native APK", color: "text-emerald-500", bg: "bg-emerald-500/15" },
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

export const DEFAULT_ANDROID_TEMPLATES = {
  "MainActivity.java": `package com.wevlo.app;

import android.app.Activity;
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
        tv.setText("Hello Android from Wevlo!");
        tv.setTextSize(20f);

        Button btn = new Button(this);
        btn.setText("Click Me");
        btn.setOnClickListener(v -> Toast.makeText(this, "Working!", Toast.LENGTH_SHORT).show());

        layout.addView(tv);
        layout.addView(btn);
        setContentView(layout);
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

  "build.gradle": `buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.5.2'
    }
}

plugins {
    id 'com.android.application' version '8.5.2' apply false
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
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
        versionName "1.0"
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
        android:label="Wevlo App"
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

export const FRAMEWORK_STARTERS = {
  java: {
    "settings.gradle": DEFAULT_ANDROID_TEMPLATES["settings.gradle"],
    "build.gradle": DEFAULT_ANDROID_TEMPLATES["build.gradle"],
    "gradle.properties": DEFAULT_ANDROID_TEMPLATES["gradle.properties"],
    "app/build.gradle": DEFAULT_ANDROID_TEMPLATES["app/build.gradle"],
    "app/src/main/AndroidManifest.xml": DEFAULT_ANDROID_TEMPLATES["app/src/main/AndroidManifest.xml"],
    "app/src/main/java/com/wevlo/app/MainActivity.java": DEFAULT_ANDROID_TEMPLATES["MainActivity.java"]
  },
  kotlin: {
    "settings.gradle": DEFAULT_ANDROID_TEMPLATES["settings.gradle"],
    "build.gradle": `buildscript { repositories { google(); mavenCentral() }; dependencies { classpath 'com.android.tools.build:gradle:8.5.2'; classpath 'org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.24' } }\nplugins { id 'com.android.application' version '8.5.2' apply false; id 'org.jetbrains.kotlin.android' version '1.9.24' apply false }`,
    "gradle.properties": DEFAULT_ANDROID_TEMPLATES["gradle.properties"],
    "app/build.gradle": `plugins { id 'com.android.application'; id 'org.jetbrains.kotlin.android' }\nandroid { namespace 'com.wevlo.app'; compileSdk 34; defaultConfig { applicationId "com.wevlo.app"; minSdk 24; targetSdk 34; versionCode 1; versionName "1.0" }; compileOptions { sourceCompatibility JavaVersion.VERSION_17; targetCompatibility JavaVersion.VERSION_17 }; kotlinOptions { jvmTarget = '17' } }\ndependencies { implementation 'androidx.core:core-ktx:1.13.1' }`,
    "app/src/main/AndroidManifest.xml": DEFAULT_ANDROID_TEMPLATES["app/src/main/AndroidManifest.xml"],
    "app/src/main/java/com/wevlo/app/MainActivity.kt": `package com.wevlo.app\n\nimport android.app.Activity\nimport android.os.Bundle\nimport android.widget.TextView\n\nclass MainActivity : Activity() {\n    override fun onCreate(savedInstanceState: Bundle?) {\n        super.onCreate(savedInstanceState)\n        val tv = TextView(this).apply { text = "Hello Kotlin Android!"; textSize = 22f }\n        setContentView(tv)\n    }\n}`
  },
  flutter: {
    "pubspec.yaml": `name: wevlo_flutter_app\ndescription: Built with Wevlo Studio\npublish_to: 'none'\nversion: 1.0.0+1\nenvironment:\n  sdk: '>=3.2.0 <4.0.0'\ndependencies:\n  flutter:\n    sdk: flutter\nflutter:\n  uses-material-design: true`,
    "lib/main.dart": `import 'package:flutter/material.dart';\n\nvoid main() => runApp(const MyApp());\n\nclass MyApp extends StatelessWidget {\n  const MyApp({super.key});\n  @override\n  Widget build(BuildContext context) {\n    return MaterialApp(home: Scaffold(appBar: AppBar(title: const Text('Wevlo Flutter')), body: const Center(child: Text('Flutter APK Ready!'))));\n  }\n}`
  },
  capacitor: {
    "package.json": `{\n  "name": "wevlo-capacitor-app",\n  "version": "1.0.0",\n  "dependencies": { "@capacitor/core": "^6.1.0", "@capacitor/android": "^6.1.0" }\n}`,
    "capacitor.config.json": `{\n  "appId": "com.wevlo.capapp",\n  "appName": "Wevlo Cap",\n  "webDir": "www"\n}`,
    "www/index.html": `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:40px"><h1>Capacitor App</h1><button onclick="alert('Native Working!')">Click Me</button></body></html>`
  },
  python: {
    "main.py": `from kivy.app import App\nfrom kivy.uix.label import Label\n\nclass MainApp(App):\n    def build(self):\n        return Label(text='Hello Python Kivy APK!')\n\nif __name__ == '__main__':\n    MainApp().run()`,
    "buildozer.spec": `[app]\ntitle = Wevlo App\npackage.name = wevlopy\npackage.domain = com.wevlo\nsource.dir = .\nversion = 1.0\nrequirements = python3,kivy\norientation = portrait\n[buildozer]\nlog_level = 2`
  }
};

export function detectFramework(treeFiles = []) {
  const paths = treeFiles.map((f) => f.path);
  if (paths.includes("pubspec.yaml")) return "flutter";
  if (paths.includes("buildozer.spec") || paths.includes("main.py")) return "python";
  if (paths.includes("capacitor.config.json")) return "capacitor";
  if (paths.some((p) => p.endsWith(".kt"))) return "kotlin";
  return "java";
}

export function generateWorkflowYaml(branch = "main", gradleTask = "assembleDebug", versionName = "1.0", useCloudSigning = false, framework = "java") {
  if (framework === "flutter") {
    const flCmd = gradleTask.includes("bundle") ? "flutter build appbundle --release" : gradleTask.includes("Release") ? "flutter build apk --release" : "flutter build apk --debug";
    return `name: Build Flutter APK\non:\n  push:\n    branches: [ "${branch}" ]\n  workflow_dispatch:\npermissions:\n  contents: write\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: subosito/flutter-action@v2\n        with: { channel: 'stable', cache: true }\n      - run: flutter pub get && ${flCmd}\n      - uses: softprops/action-gh-release@v2\n        with: { tag_name: v${versionName}-\${{ github.run_number }}, files: "build/app/outputs/flutter-apk/*.apk" }\n`;
  }

  if (framework === "python") {
    return `name: Build Python APK\non:\n  push:\n    branches: [ "${branch}" ]\n  workflow_dispatch:\npermissions:\n  contents: write\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: ArtemSBulgakov/buildozer-action@v1\n        with: { command: "buildozer android debug", buildozer_version: "stable" }\n      - uses: softprops/action-gh-release@v2\n        with: { tag_name: v${versionName}-\${{ github.run_number }}, files: "bin/*.apk" }\n`;
  }

  const cmd = gradleTask.includes("+") ? gradleTask.split("+").map((t) => t.trim()).join(" ") : gradleTask;
  return `name: Build Android APK / AAB\non:\n  push:\n    branches: [ "${branch}" ]\n  workflow_dispatch:\npermissions:\n  contents: write\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-java@v4\n        with: { distribution: 'temurin', java-version: '17' }\n      - uses: gradle/actions/setup-gradle@v4\n        with: { gradle-version: '8.7' }\n      - run: gradle ${cmd} --no-daemon --stacktrace\n      - uses: softprops/action-gh-release@v2\n        with:\n          tag_name: v${versionName}-\${{ github.run_number }}\n          files: |\n            app/build/outputs/apk/**/*.apk\n            app/build/outputs/bundle/**/*.aab\n`;
}

export function extractCompilerErrors(logText = "") {
  const errors = [];
  const seen = new Set();
  for (const raw of logText.split("\n")) {
    const m = raw.match(/([A-Za-z0-9_./-]+\.(?:java|kt|dart|py|xml|gradle)):(\d+):\s*(error|warning)?:?\s*(.+)/i);
    if (m) {
      const file = m[1].replace(/^.*\/(app\/|lib\/|www\/|main\.py|settings\.gradle|build\.gradle)/, "$1");
      const key = `${file}:${m[2]}:${m[4].trim()}`;
      if (!seen.has(key)) { seen.add(key); errors.push({ file, line: Number(m[2]), severity: (m[3] || "error").toLowerCase(), message: m[4].trim() }); }
    } else if (/^FAILURE:|>\s*Execution failed for task/i.test(raw.trim())) {
      errors.push({ file: "Build", line: 1, severity: "error", message: raw.trim() });
    }
  }
  return errors.slice(0, 25);
}

export function lintCodeLines(path, content) {
  const issues = [];
  if (!path || !content) return issues;
  const lines = content.split("\n");
  if (path.endsWith(".java") || path.endsWith(".kt") || path.endsWith(".dart")) {
    let bal = 0;
    lines.forEach((ln) => { bal += (ln.match(/\{/g) || []).length - (ln.match(/\}/g) || []).length; });
    if (bal !== 0) issues.push({ severity: "error", file: path, line: lines.length, message: `Unbalanced braces '{' vs '}' (diff: ${bal}).` });
  }
  return issues;
}

export function analyzeProjectIssues({ treeFiles = [], activePath = "", activeContent = "", branch = "main", compilerErrors = [], framework = null }) {
  const fw = framework || detectFramework(treeFiles);
  const problems = [...compilerErrors];
  const paths = treeFiles.map((f) => f.path);
  const starter = FRAMEWORK_STARTERS[fw] || FRAMEWORK_STARTERS.java;

  if (paths.length > 0) {
    for (const [reqPath, defaultContent] of Object.entries(starter)) {
      if (!paths.includes(reqPath)) {
        problems.push({
          severity: "error",
          file: reqPath,
          line: 1,
          message: `Missing required file: ${reqPath}`,
          fixPath: reqPath,
          fixContent: defaultContent
        });
      }
    }
  }
  problems.push(...lintCodeLines(activePath, activeContent));
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
  if (base === "ls") return treeFiles.length ? treeFiles.slice(0, 30).map((f) => `  ${f.path}`) : ["(Empty)"];
  if (base === "build") { triggerBuild(); return ["Triggering cloud build..."]; }
  if (cmd === "gradle check" || base === "check") {
    const issues = analyzeProjectIssues({ treeFiles, activePath, activeContent, branch, framework });
    return issues.length ? issues.map((i) => `  [${i.severity.toUpperCase()}] ${i.file}: ${i.message}`) : [`✓ All files look good!`];
  }
  return [`Unknown command '${cmd}'. Type 'help'.`];
}
