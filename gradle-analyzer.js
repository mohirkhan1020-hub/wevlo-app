// ======================================================
// Multi-Language App Studio Engine:
// Supports: Java, Kotlin, Flutter (Dart), Capacitor (JS), Python (Kivy)
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
  "MainActivity.java": `package com.wevlo.app;\n\nimport android.app.Activity;\nimport android.os.Bundle;\nimport android.view.Gravity;\nimport android.widget.Button;\nimport android.widget.LinearLayout;\nimport android.widget.TextView;\nimport android.widget.Toast;\n\npublic class MainActivity extends Activity {\n    @Override\n    protected void onCreate(Bundle savedInstanceState) {\n        super.onCreate(savedInstanceState);\n        LinearLayout layout = new LinearLayout(this);\n        layout.setOrientation(LinearLayout.VERTICAL);\n        layout.setGravity(Gravity.CENTER);\n        TextView tv = new TextView(this);\n        tv.setText("Hello Java Android!");\n        tv.setTextSize(20f);\n        Button btn = new Button(this);\n        btn.setText("Click Me");\n        btn.setOnClickListener(v -> Toast.makeText(this, "Working!", Toast.LENGTH_SHORT).show());\n        layout.addView(tv);\n        layout.addView(btn);\n        setContentView(layout);\n    }\n}`,
  "settings.gradle": `pluginManagement {\n    repositories { google(); mavenCentral(); gradlePluginPortal() }\n}\ndependencyResolutionManagement {\n    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)\n    repositories { google(); mavenCentral(); maven { url 'https://jitpack.io' } }\n}\nrootProject.name = "WevloApp"\ninclude ':app'`,
  "build.gradle": `plugins {\n    id 'com.android.application' version '8.5.2' apply false\n}`,
  "app/build.gradle": `plugins {\n    id 'com.android.application'\n}\nandroid {\n    namespace 'com.wevlo.app'\n    compileSdk 34\n    defaultConfig { applicationId "com.wevlo.app"; minSdk 24; targetSdk 34; versionCode 1; versionName "1.0" }\n    compileOptions { sourceCompatibility JavaVersion.VERSION_17; targetCompatibility JavaVersion.VERSION_17 }\n}\ndependencies {\n}`,
  "gradle.properties": `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8\nandroid.useAndroidX=true\nandroid.nonTransitiveRClass=true`,
  "app/src/main/AndroidManifest.xml": `<?xml version="1.0" encoding="utf-8"?>\n<manifest xmlns:android="http://schemas.android.com/apk/res/android">\n    <uses-permission android:name="android.permission.INTERNET" />\n    <application android:label="Wevlo App" android:usesCleartextTraffic="true" android:theme="@android:style/Theme.DeviceDefault.Light.NoActionBar">\n        <activity android:name=".MainActivity" android:exported="true" android:configChanges="orientation|screenSize|keyboardHidden">\n            <intent-filter><action android:name="android.intent.action.MAIN" /><category android:name="android.intent.category.LAUNCHER" /></intent-filter>\n        </activity>\n    </application>\n</manifest>`
};

// Complete Auto-Starter File Sets Per Language
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
    "build.gradle": `plugins {\n    id 'com.android.application' version '8.5.2' apply false\n    id 'org.jetbrains.kotlin.android' version '1.9.24' apply false\n}`,
    "gradle.properties": DEFAULT_ANDROID_TEMPLATES["gradle.properties"],
    "app/build.gradle": `plugins {\n    id 'com.android.application'\n    id 'org.jetbrains.kotlin.android'\n}\nandroid {\n    namespace 'com.wevlo.app'\n    compileSdk 34\n    defaultConfig { applicationId "com.wevlo.app"; minSdk 24; targetSdk 34; versionCode 1; versionName "1.0" }\n    compileOptions { sourceCompatibility JavaVersion.VERSION_17; targetCompatibility JavaVersion.VERSION_17 }\n    kotlinOptions { jvmTarget = '17' }\n}\ndependencies {\n    implementation 'androidx.core:core-ktx:1.13.1'\n}`,
    "app/src/main/AndroidManifest.xml": DEFAULT_ANDROID_TEMPLATES["app/src/main/AndroidManifest.xml"],
    "app/src/main/java/com/wevlo/app/MainActivity.kt": `package com.wevlo.app\n\nimport android.app.Activity\nimport android.os.Bundle\nimport android.view.Gravity\nimport android.widget.Button\nimport android.widget.LinearLayout\nimport android.widget.TextView\nimport android.widget.Toast\n\nclass MainActivity : Activity() {\n    override fun onCreate(savedInstanceState: Bundle?) {\n        super.onCreate(savedInstanceState)\n        val layout = LinearLayout(this).apply {\n            orientation = LinearLayout.VERTICAL\n            gravity = Gravity.CENTER\n        }\n        val tv = TextView(this).apply {\n            text = "Hello Kotlin Android!"\n            textSize = 20f\n        }\n        val btn = Button(this).apply {\n            text = "Click Me"\n            setOnClickListener { Toast.makeText(this@MainActivity, "Kotlin Working!", Toast.LENGTH_SHORT).show() }\n        }\n        layout.addView(tv)\n        layout.addView(btn)\n        setContentView(layout)\n    }\n}`
  },
  flutter: {
    "pubspec.yaml": `name: wevlo_flutter_app\ndescription: Built with Wevlo Flutter Studio\npublish_to: 'none'\nversion: 1.0.0+1\nenvironment:\n  sdk: '>=3.2.0 <4.0.0'\ndependencies:\n  flutter:\n    sdk: flutter\nflutter:\n  uses-material-design: true`,
    "lib/main.dart": `import 'package:flutter/material.dart';\n\nvoid main() => runApp(const WevloApp());\n\nclass WevloApp extends StatelessWidget {\n  const WevloApp({super.key});\n\n  @override\n  Widget build(BuildContext context) {\n    return MaterialApp(\n      debugShowCheckedModeBanner: false,\n      theme: ThemeData(colorSchemeSeed: Colors.deepPurple, useMaterial3: true),\n      home: const HomePage(),\n    );\n  }\n}\n\nclass HomePage extends StatefulWidget {\n  const HomePage({super.key});\n  @override\n  State<HomePage> createState() => _HomePageState();\n}\n\nclass _HomePageState extends State<HomePage> {\n  int count = 0;\n  @override\n  Widget build(BuildContext context) {\n    return Scaffold(\n      appBar: AppBar(title: const Text('Wevlo Flutter App')),\n      body: Center(\n        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [\n          const Text('Flutter APK Built on Cloud!', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),\n          const SizedBox(height: 12),\n          Text('Clicks: \$count', style: const TextStyle(fontSize: 26, color: Colors.deepPurple)),\n        ]),\n      ),\n      floatingActionButton: FloatingActionButton(\n        onPressed: () => setState(() => count++),\n        child: const Icon(Icons.add),\n      ),\n    );\n  }\n}`
  },
  capacitor: {
    "package.json": `{\n  "name": "wevlo-capacitor-app",\n  "version": "1.0.0",\n  "scripts": { "build": "echo ready" },\n  "dependencies": {\n    "@capacitor/core": "^6.1.0",\n    "@capacitor/android": "^6.1.0"\n  },\n  "devDependencies": {\n    "@capacitor/cli": "^6.1.0"\n  }\n}`,
    "capacitor.config.json": `{\n  "appId": "com.wevlo.capapp",\n  "appName": "Wevlo Cap App",\n  "webDir": "www"\n}`,
    "www/index.html": `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>Wevlo Capacitor App</title>\n  <style>\n    body { font-family: sans-serif; display: grid; place-items: center; min-height: 100vh; margin: 0; background: #f6f6fb; }\n    .card { background: #fff; padding: 28px; border-radius: 22px; text-align: center; box-shadow: 0 10px 30px rgba(109,40,217,0.12); }\n    button { background: #6d28d9; color: #fff; border: none; padding: 12px 24px; border-radius: 99px; font-weight: bold; }\n  </style>\n</head>\n<body>\n  <div class="card">\n    <h1>Capacitor Native App</h1>\n    <p>HTML/CSS/JS compiled into Native APK!</p>\n    <button onclick="alert('Native Capacitor Ready!')">Test Button</button>\n  </div>\n</body>\n</html>`
  },
  python: {
    "main.py": `from kivy.app import App\nfrom kivy.uix.boxlayout import BoxLayout\nfrom kivy.uix.label import Label\nfrom kivy.uix.button import Button\n\nclass WevloPythonApp(App):\n    def build(self):\n        box = BoxLayout(orientation='vertical', padding=30, spacing=15)\n        self.lbl = Label(text='Hello from Python Kivy APK!', font_size='22sp')\n        btn = Button(text='Tap Me', size_hint=(1, 0.3), background_color=(0.43, 0.16, 0.85, 1))\n        btn.bind(on_press=lambda x: setattr(self.lbl, 'text', 'Python APK is Working!'))\n        box.add_widget(self.lbl)\n        box.add_widget(btn)\n        return box\n\nif __name__ == '__main__':\n    WevloPythonApp().run()`,
    "buildozer.spec": `[app]\ntitle = Wevlo Python App\npackage.name = wevlopy\npackage.domain = com.wevlo\nsource.dir = .\nsource.include_exts = py,png,jpg,kv,atlas\nversion = 1.0\nrequirements = python3,kivy\norientation = portrait\nandroid.permissions = INTERNET\nandroid.accept_sdk_license = True\n[buildozer]\nlog_level = 2`
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
    return `name: Build Flutter APK / AAB
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
        with: { distribution: 'temurin', java-version: '17' }
      - uses: subosito/flutter-action@v2
        with: { channel: 'stable', cache: true }
      - name: Ensure Android Folder & Build
        shell: bash
        run: |
          set -o pipefail
          [ -d android ] || flutter create . --platforms=android --org com.wevlo
          flutter pub get 2>&1 | tee build-output.log
          ${flCmd} 2>&1 | tee -a build-output.log
      - if: failure()
        uses: softprops/action-gh-release@v2
        with: { tag_name: log-latest, prerelease: true, files: build-output.log }
      - if: success()
        uses: softprops/action-gh-release@v2
        with:
          tag_name: v${versionName}-\${{ github.run_number }}
          files: |
            build/app/outputs/flutter-apk/*.apk
            build/app/outputs/bundle/release/*.aab`;
  }

  if (framework === "capacitor") {
    const capTask = gradleTask.includes("bundle") ? "bundleRelease" : gradleTask.includes("Release") ? "assembleRelease" : "assembleDebug";
    return `name: Build Capacitor Android APK
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
        with: { distribution: 'temurin', java-version: '17' }
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - name: Install & Compile Android
        shell: bash
        run: |
          set -o pipefail
          npm install 2>&1 | tee build-output.log
          [ -d android ] || npx cap add android 2>&1 | tee -a build-output.log
          npx cap sync android 2>&1 | tee -a build-output.log
          cd android && chmod +x gradlew && ./gradlew ${capTask} --no-daemon 2>&1 | tee -a ../build-output.log
      - if: failure()
        uses: softprops/action-gh-release@v2
        with: { tag_name: log-latest, prerelease: true, files: build-output.log }
      - if: success()
        uses: softprops/action-gh-release@v2
        with:
          tag_name: v${versionName}-\${{ github.run_number }}
          files: |
            android/app/build/outputs/apk/**/*.apk
            android/app/build/outputs/bundle/**/*.aab`;
  }

  if (framework === "python") {
    return `name: Build Python Kivy APK
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
      - name: Build with Buildozer
        uses: ArtemSBulgakov/buildozer-action@v1
        id: buildozer
        with:
          command: buildozer android debug
          buildozer_version: stable
      - if: success()
        uses: softprops/action-gh-release@v2
        with:
          tag_name: v${versionName}-\${{ github.run_number }}
          files: bin/*.apk`;
  }

  // Default: Java & Kotlin Android Gradle
  const cmd = gradleTask.includes("+") ? gradleTask.split("+").map((t) => t.trim()).join(" ") : gradleTask;
  const signStep = useCloudSigning
    ? `\n      - name: Sign Release\n        if: success() && contains('${cmd}', 'Release')\n        env:\n          KEY_PASS: \${{ secrets.WEVLO_KEY_PASS }}\n          KEY_ALIAS: \${{ secrets.WEVLO_KEY_ALIAS }}\n        run: |\n          if [ -n "$KEY_PASS" ]; then\n            keytool -genkeypair -v -keystore release.jks -alias "\${KEY_ALIAS:-key0}" -keyalg RSA -keysize 2048 -validity 9125 -storepass "$KEY_PASS" -keypass "$KEY_PASS" -dname "CN=Wevlo, O=Wevlo, C=BD" || true\n            for f in app/build/outputs/apk/release/*.apk app/build/outputs/bundle/release/*.aab; do [ -f "$f" ] && jarsigner -keystore release.jks -storepass "$KEY_PASS" "$f" "\${KEY_ALIAS:-key0}" || true; done\n          fi`
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
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: 'temurin', java-version: '17' }
      - uses: gradle/actions/setup-gradle@v4
        with: { gradle-version: '8.7' }
      - name: Run Gradle (${cmd})
        shell: bash
        run: |
          set -o pipefail
          gradle ${cmd} --no-daemon --stacktrace 2>&1 | tee build-output.log
${signStep}
      - if: failure()
        uses: softprops/action-gh-release@v2
        with: { tag_name: log-latest, prerelease: true, files: build-output.log }
      - if: success()
        uses: softprops/action-gh-release@v2
        with:
          tag_name: v${versionName}-\${{ github.run_number }}
          files: |
            app/build/outputs/apk/**/*.apk
            app/build/outputs/bundle/**/*.aab`;
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
  if (path.endsWith(".py") && path.endsWith("main.py") && !content.includes("App")) {
    issues.push({ severity: "warning", file: path, line: 1, message: "Kivy apps should subclass kivy.app.App and call .run()." });
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
          message: `Missing required ${fw.toUpperCase()} file: ${reqPath}`,
          fixPath: reqPath,
          fixContent: defaultContent
        });
      }
    }
    if (!paths.some((p) => p.startsWith(".github/workflows/") && p.endsWith(".yml"))) {
      problems.push({
        severity: "warning",
        file: ".github/workflows/wevlo-build.yml",
        line: 1,
        message: `Missing GitHub Actions workflow for ${fw.toUpperCase()}.`,
        fixPath: ".github/workflows/wevlo-build.yml",
        fixContent: generateWorkflowYaml(branch, "assembleDebug", "1.0", false, fw)
      });
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
    return issues.length ? issues.map((i) => `  [${i.severity.toUpperCase()}] ${i.file}: ${i.message}`) : [`✓ All ${framework || "Android"} required files look good!`];
  }
  return [`Unknown command '${cmd}'. Type 'help'.`];
}
