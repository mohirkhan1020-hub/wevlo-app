// ======================================================
// AIDE Engine: Gradle Blueprints, Libraries, Error Parser & Linter
// ======================================================

export const ANDROID_LIBRARIES = [
  { id: "appcompat", name: "AndroidX AppCompat", impl: "implementation 'androidx.appcompat:appcompat:1.7.0'", desc: "Modern ActionBar & backward compatibility" },
  { id: "material", name: "Material Components", impl: "implementation 'com.google.android.material:material:1.12.0'", desc: "Material buttons, cards, bottom bars" },
  { id: "constraintlayout", name: "ConstraintLayout", impl: "implementation 'androidx.constraintlayout:constraintlayout:2.1.4'", desc: "Flexible responsive layouts" },
  { id: "recyclerview", name: "RecyclerView", impl: "implementation 'androidx.recyclerview:recyclerview:1.3.2'", desc: "High-performance scrolling lists" },
  { id: "cardview", name: "CardView", impl: "implementation 'androidx.cardview:cardview:1.0.0'", desc: "Rounded shadow cards" },
  { id: "glide", name: "Glide Image Loader", impl: "implementation 'com.github.bumptech.glide:glide:4.16.0'", desc: "Fast network image loading & caching" },
  { id: "retrofit", name: "Retrofit2 + Gson", impl: "implementation 'com.squareup.retrofit2:retrofit:2.11.0'\n    implementation 'com.squareup.retrofit2:converter-gson:2.11.0'", desc: "REST API JSON networking" },
  { id: "okhttp", name: "OkHttp3", impl: "implementation 'com.squareup.okhttp3:okhttp:4.12.0'", desc: "HTTP & WebSocket client" },
  { id: "lottie", name: "Lottie Animations", impl: "implementation 'com.airbnb.android:lottie:6.4.0'", desc: "JSON vector animations" }
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

        TextView title = new TextView(this);
        title.setText("Hello Android from Wevlo AIDE!");
        title.setTextSize(20f);

        Button btn = new Button(this);
        btn.setText("Test Action");
        btn.setOnClickListener(v ->
            Toast.makeText(this, "Build Working!", Toast.LENGTH_SHORT).show()
        );

        layout.addView(title);
        layout.addView(btn);
        setContentView(layout);
    }
}`,
  "settings.gradle": `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
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
rootProject.name = "WevloAndroidApp"
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
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

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

export function generateWorkflowYaml(branch = "main", gradleTask = "assembleDebug", versionName = "1.0", useCloudSigning = false) {
  const cmd = gradleTask.includes("+")
    ? gradleTask.split("+").map((t) => t.trim()).join(" ")
    : gradleTask;

  const signStep = useCloudSigning
    ? `
      - name: Sign Release Build with Cloud Keystore
        if: success() && (contains('${cmd}', 'Release'))
        env:
          KEY_PASS: \${{ secrets.WEVLO_KEY_PASS }}
          KEY_ALIAS: \${{ secrets.WEVLO_KEY_ALIAS }}
        run: |
          if [ -n "$KEY_PASS" ]; then
            keytool -genkeypair -v -keystore release.jks -alias "\${KEY_ALIAS:-key0}" -keyalg RSA -keysize 2048 -validity 9125 -storepass "$KEY_PASS" -keypass "$KEY_PASS" -dname "CN=WevloApp, O=Wevlo, C=BD" || true
            for f in app/build/outputs/apk/release/*.apk app/build/outputs/bundle/release/*.aab; do
              [ -f "$f" ] && jarsigner -verbose -keystore release.jks -storepass "$KEY_PASS" -keypass "$KEY_PASS" "$f" "\${KEY_ALIAS:-key0}" || true
            done
          fi`
    : "";

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
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@v4
        with:
          gradle-version: '8.7'

      - name: Run Gradle (${cmd})
        shell: bash
        run: |
          set -o pipefail
          gradle ${cmd} --no-daemon --stacktrace 2>&1 | tee build-output.log
${signStep}

      - name: Upload Error Log on Failure
        if: failure()
        uses: softprops/action-gh-release@v2
        with:
          tag_name: log-latest
          name: Latest Build Error Log
          prerelease: true
          files: build-output.log

      - name: Publish Release APK / AAB
        if: success()
        uses: softprops/action-gh-release@v2
        with:
          tag_name: v${versionName}-\${{ github.run_number }}
          name: Build #\${{ github.run_number }}
          files: |
            app/build/outputs/apk/**/*.apk
            app/build/outputs/bundle/**/*.aab`;
}

// Parse Real Java / Kotlin / XML / Gradle Compiler Errors from build-output.log
export function extractCompilerErrors(logText = "") {
  const errors = [];
  const seen = new Set();
  const lines = logText.split("\n");
  for (const raw of lines) {
    // Match patterns like: /home/runner/work/.../app/src/main/java/.../MainActivity.java:24: error: ';' expected
    const m = raw.match(/([A-Za-z0-9_./-]+\.(?:java|kt|xml|gradle)):(\d+):\s*(error|warning)?:?\s*(.+)/i);
    if (m) {
      let file = m[1].replace(/^.*\/(app\/|settings\.gradle|build\.gradle)/, "$1");
      const line = Number(m[2]);
      const severity = (m[3] || "error").toLowerCase();
      const message = m[4].trim();
      const key = `${file}:${line}:${message}`;
      if (!seen.has(key)) {
        seen.add(key);
        errors.push({ file, line, severity, message });
      }
    } else if (/^FAILURE:|>\s*Execution failed for task/i.test(raw.trim())) {
      errors.push({ file: "Gradle", line: 1, severity: "error", message: raw.trim() });
    }
  }
  return errors.slice(0, 25);
}

// Real-time Line-by-Line Java & XML Linter
export function lintCodeLines(path, content) {
  const issues = [];
  if (!path || !content) return issues;
  const lines = content.split("\n");

  if (path.endsWith(".java")) {
    if (!/^\s*package\s+[\w.]+;/m.test(content)) {
      issues.push({ severity: "error", file: path, line: 1, message: "Missing 'package com.example.app;' declaration at line 1." });
    }
    let braceBalance = 0;
    lines.forEach((ln, idx) => {
      const lineNum = idx + 1;
      const trimmed = ln.trim();
      braceBalance += (ln.match(/\{/g) || []).length - (ln.match(/\}/g) || []).length;
      if (/^(import|package|return)\s+/.test(trimmed) && !trimmed.endsWith(";") && !trimmed.endsWith("{")) {
        issues.push({ severity: "error", file: path, line: lineNum, message: `Missing semicolon ';' at end of line ${lineNum}.` });
      }
    });
    if (braceBalance !== 0) {
      issues.push({ severity: "error", file: path, line: lines.length, message: `Unbalanced braces '{' vs '}' (difference: ${braceBalance}).` });
    }
  }

  if (path.endsWith(".xml")) {
    const openTags = (content.match(/<[A-Za-z0-9_.]+(?![^>]*\/>)/g) || []).length;
    const closeTags = (content.match(/<\/[A-Za-z0-9_.]+>/g) || []).length;
    if (openTags > closeTags + 1) {
      issues.push({ severity: "error", file: path, line: lines.length, message: "Unclosed XML tag detected. Check opening and closing tags." });
    }
    if (path.includes("res/layout/") && !content.includes("android:layout_width")) {
      issues.push({ severity: "warning", file: path, line: 1, message: "Layout XML views require 'android:layout_width' and 'android:layout_height'." });
    }
  }
  return issues;
}

export function analyzeProjectIssues({ treeFiles = [], activePath = "", activeContent = "", branch = "main", compilerErrors = [] }) {
  const problems = [...compilerErrors];
  const paths = treeFiles.map((f) => f.path);

  const required = [
    ["settings.gradle", "Missing settings.gradle — Gradle cannot locate ':app'."],
    ["build.gradle", "Missing root build.gradle — Android Gradle Plugin missing."],
    ["app/build.gradle", "Missing app/build.gradle — compileSdk & applicationId required."],
    ["gradle.properties", "Missing gradle.properties — AndroidX flags missing."],
    ["app/src/main/AndroidManifest.xml", "Missing AndroidManifest.xml — Launcher activity missing."]
  ];

  for (const [reqPath, msg] of required) {
    if (paths.length > 0 && !paths.includes(reqPath)) {
      problems.push({ severity: "error", file: reqPath, line: 1, message: msg, fixPath: reqPath, fixContent: DEFAULT_ANDROID_TEMPLATES[reqPath] });
    }
  }

  if (paths.length > 0 && !paths.some((p) => p.startsWith(".github/workflows/") && p.endsWith(".yml"))) {
    problems.push({
      severity: "warning",
      file: ".github/workflows/wevlo-build.yml",
      line: 1,
      message: "Missing GitHub Actions workflow YAML.",
      fixPath: ".github/workflows/wevlo-build.yml",
      fixContent: generateWorkflowYaml(branch)
    });
  }

  problems.push(...lintCodeLines(activePath, activeContent));
  return problems;
}

export function createActivityTemplates(activityName, pkgName = "com.wevlo.app") {
  const cleanName = activityName.replace(/[^A-Za-z0-9]/g, "");
  const className = cleanName.endsWith("Activity") ? cleanName : cleanName + "Activity";
  const layoutName = "activity_" + className.replace(/Activity$/, "").replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();

  const javaCode = `package ${pkgName};

import android.app.Activity;
import android.os.Bundle;

public class ${className} extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.${layoutName});
    }
}`;

  const xmlCode = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:gravity="center"
    android:padding="24dp"
    android:background="#F6F6FB">

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="${className}"
        android:textSize="22sp"
        android:textColor="#0F172A" />

    <Button
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Continue"
        android:textColor="#FFFFFF"
        android:background="#6D28D9"
        android:padding="12dp" />

</LinearLayout>`;

  return { className, layoutName, javaCode, xmlCode };
}

export function runTerminalCommand(rawCmd, ctx) {
  const { treeFiles, activePath, activeContent, branch, triggerBuild, clearTerminal } = ctx;
  const cmd = (rawCmd || "").trim();
  const parts = cmd.split(/\s+/);
  const base = (parts[0] || "").toLowerCase();

  if (!cmd) return [];
  if (base === "clear" || base === "cls") { clearTerminal(); return []; }
  if (base === "help") {
    return [
      "Wevlo AIDE Terminal Commands:",
      "  gradle check          - Scan Java, XML & Gradle files for errors",
      "  gradle tasks          - List build tasks",
      "  gradle template <f>   - Print default template (e.g. app/build.gradle)",
      "  ls                    - List files in repository",
      "  build                 - Start Gradle build on GitHub Actions",
      "  clear                 - Clear terminal"
    ];
  }
  if (base === "ls" || base === "dir") return treeFiles.length ? treeFiles.slice(0, 30).map((f) => `  ${f.path}`) : ["(No files)"];
  if (base === "build") { triggerBuild(); return ["Triggering GitHub Actions Gradle build..."]; }
  if (cmd === "gradle tasks") return ["Tasks: assembleDebug, assembleRelease, bundleRelease"];
  if (cmd === "gradle check" || base === "doctor") {
    const issues = analyzeProjectIssues({ treeFiles, activePath, activeContent, branch });
    if (!issues.length) return ["✓ Zero Gradle, Manifest or Java syntax issues found!"];
    return [`Found ${issues.length} issue(s):`, ...issues.map((i) => `  [${i.severity.toUpperCase()}] ${i.file}:${i.line} - ${i.message}`)];
  }
  if (parts[0] === "gradle" && parts[1] === "template") {
    const tpl = DEFAULT_ANDROID_TEMPLATES[parts[2] || "app/build.gradle"];
    return tpl ? tpl.split("\n") : ["Template not found."];
  }
  return [`Command not found: '${cmd}'. Type 'help'.`];
}
