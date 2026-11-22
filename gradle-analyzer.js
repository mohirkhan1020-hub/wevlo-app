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
  capacitor: buildFrameworkStarter("capacitor", { appName: "Hello Capacitor", packageName
