// ======================================================
// Android Gradle Blueprints, Default Java Code & Linter
// ======================================================

export const DEFAULT_ANDROID_TEMPLATES = {
  "MainActivity.java": `package com.wevlo.app;

import android.app.Activity;
import android.os.Bundle;
import android.view.Gravity;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

/**
 * Default Wevlo Java Activity
 * Use this structure to understand how Java connects with Gradle & AndroidManifest.xml
 */
public class MainActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setGravity(Gravity.CENTER);

        TextView title = new TextView(this);
        title.setText("Hello Android from Wevlo!");
        title.setTextSize(20f);

        Button btn = new Button(this);
        btn.setText("Test Action");
        btn.setOnClickListener(v ->
            Toast.makeText(this, "Build & Java Code Working!", Toast.LENGTH_SHORT).show()
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

  "build.gradle": `// Top-level build file for Android Gradle Plugin 8.5.2
plugins {
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
    // Add AndroidX or third-party dependencies here if needed
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

export function generateWorkflowYaml(branch = "main", gradleTask = "assembleDebug", versionName = "1.0") {
  const cmd = gradleTask.includes("+")
    ? gradleTask.split("+").map((t) => t.trim()).join(" ")
    : gradleTask;
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
        run: gradle ${cmd} --no-daemon --stacktrace

      - name: Publish Release Assets
        uses: softprops/action-gh-release@v2
        with:
          tag_name: v${versionName}-\${{ github.run_number }}
          name: Build #\${{ github.run_number }}
          files: |
            app/build/outputs/apk/**/*.apk
            app/build/outputs/bundle/**/*.aab`;
}

export function analyzeProjectIssues({ treeFiles = [], activePath = "", activeContent = "", branch = "main" }) {
  const problems = [];
  const paths = treeFiles.map((f) => f.path);

  // 1. Check essential Gradle & Manifest files
  const required = [
    ["settings.gradle", "Missing settings.gradle — Gradle cannot locate ':app' module."],
    ["build.gradle", "Missing root build.gradle — Android Gradle Plugin version is missing."],
    ["app/build.gradle", "Missing app/build.gradle — compileSdk, minSdk & applicationId required."],
    ["gradle.properties", "Missing gradle.properties — JVM memory & AndroidX flags missing."],
    ["app/src/main/AndroidManifest.xml", "Missing AndroidManifest.xml — App launcher & permissions missing."]
  ];

  for (const [reqPath, msg] of required) {
    if (paths.length > 0 && !paths.includes(reqPath)) {
      problems.push({
        severity: "error",
        file: reqPath,
        message: msg,
        fixPath: reqPath,
        fixContent: DEFAULT_ANDROID_TEMPLATES[reqPath]
      });
    }
  }

  // Check workflow file
  if (paths.length > 0 && !paths.some((p) => p.startsWith(".github/workflows/") && p.endsWith(".yml"))) {
    problems.push({
      severity: "warning",
      file: ".github/workflows/wevlo-build.yml",
      message: "Missing GitHub Actions workflow YAML — required for cloud APK compilation.",
      fixPath: ".github/workflows/wevlo-build.yml",
      fixContent: generateWorkflowYaml(branch)
    });
  }

  // 2. Analyze currently opened file code
  if (activePath && activeContent) {
    if (activePath.endsWith(".java")) {
      if (!/^\s*package\s+[\w.]+;/m.test(activeContent)) {
        problems.push({
          severity: "error",
          file: activePath,
          message: "Missing 'package com.yourapp;' declaration at top of Java file."
        });
      }
      const openBraces = (activeContent.match(/\{/g) || []).length;
      const closeBraces = (activeContent.match(/\}/g) || []).length;
      if (openBraces !== closeBraces) {
        problems.push({
          severity: "error",
          file: activePath,
          message: `Unbalanced curly braces: found ${openBraces} '{' and ${closeBraces} '}'`
        });
      }
      if (activePath.endsWith("MainActivity.java") && !activeContent.includes("onCreate")) {
        problems.push({
          severity: "warning",
          file: activePath,
          message: "MainActivity.java should override onCreate(Bundle savedInstanceState)."
        });
      }
    }

    if (activePath.endsWith("app/build.gradle")) {
      if (!activeContent.includes("compileSdk")) {
        problems.push({
          severity: "error",
          file: activePath,
          message: "Missing 'compileSdk 34' inside android { ... } block."
        });
      }
      if (!activeContent.includes("namespace") && !activeContent.includes("applicationId")) {
        problems.push({
          severity: "error",
          file: activePath,
          message: "Missing 'namespace' or 'applicationId' in app/build.gradle."
        });
      }
    }

    if (activePath.endsWith("AndroidManifest.xml")) {
      if (!activeContent.includes("android.permission.INTERNET")) {
        problems.push({
          severity: "warning",
          file: activePath,
          message: "INTERNET permission not found in AndroidManifest.xml."
        });
      }
      if (!activeContent.includes('android:exported="true"')) {
        problems.push({
          severity: "error",
          file: activePath,
          message: "Launcher activity requires android:exported=\"true\" for Android 12+ (targetSdk 34)."
        });
      }
    }
  }

  return problems;
}

export function runTerminalCommand(rawCmd, ctx) {
  const { treeFiles, activePath, activeContent, branch, triggerBuild, clearTerminal } = ctx;
  const cmd = (rawCmd || "").trim();
  const parts = cmd.split(/\s+/);
  const base = (parts[0] || "").toLowerCase();

  if (!cmd) return [];
  if (base === "clear" || base === "cls") {
    clearTerminal();
    return [];
  }
  if (base === "help") {
    return [
      "Available Wevlo Terminal Commands:",
      "  gradle check          - Scan project for missing Gradle/Manifest/Java code",
      "  gradle tasks          - List supported Android Gradle build tasks",
      "  gradle template <f>   - Show default code (e.g. app/build.gradle, MainActivity.java)",
      "  ls                    - List files in repository",
      "  cat                   - Print currently open file lines",
      "  build                 - Start Gradle APK build on GitHub Actions",
      "  clear                 - Clear terminal output"
    ];
  }
  if (base === "ls" || base === "dir") {
    if (!treeFiles.length) return ["(No files loaded — open a repository first)"];
    return treeFiles.slice(0, 25).map((f) => `  ${f.path}`);
  }
  if (base === "cat") {
    if (!activeContent) return ["No file currently open in Editor."];
    return [`--- ${activePath} ---`, ...activeContent.split("\n").slice(0, 25)];
  }
  if (base === "build") {
    triggerBuild();
    return ["Triggering GitHub Actions Gradle build..."];
  }
  if (cmd === "gradle tasks") {
    return [
      "Android Gradle Tasks:",
      "  • assembleDebug   - Builds installable debug APK",
      "  • assembleRelease - Builds release APK",
      "  • bundleRelease   - Builds Play Store AAB bundle"
    ];
  }
  if (cmd === "gradle check" || base === "doctor") {
    const issues = analyzeProjectIssues({ treeFiles, activePath, activeContent, branch });
    if (!issues.length) return ["✓ All required Gradle files, Manifest & active code checks passed!"];
    return [
      `Found ${issues.length} issue(s) — open Problems tab to Auto-Fix:`,
      ...issues.map((i) => `  [${i.severity.toUpperCase()}] ${i.file}: ${i.message}`)
    ];
  }
  if (parts[0] === "gradle" && parts[1] === "template") {
    const target = parts[2] || "app/build.gradle";
    const tpl = DEFAULT_ANDROID_TEMPLATES[target];
    if (!tpl) {
      return [`Unknown template '${target}'. Try: ${Object.keys(DEFAULT_ANDROID_TEMPLATES).join(", ")}`];
    }
    return [`--- Default ${target} ---`, ...tpl.split("\n")];
  }

  return [`Command not found: '${cmd}'. Type 'help' to see available commands.`];
}
