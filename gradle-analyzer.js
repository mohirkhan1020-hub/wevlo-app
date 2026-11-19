// ======================================================
// Complete Multi-Language & Android Gradle Engine
// ======================================================

const PLACEHOLDER_LOGO_PNG_B64 =
  "__BASE64__:iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

export const APP_FRAMEWORKS = [
  { id: "java", name: "Java Android", badge: "☕ Java", desc: "Classic Android Studio Gradle", color: "text-amber-500", bg: "bg-amber-500/15" },
  { id: "kotlin", name: "Kotlin Native", badge: "🟣 Kotlin", desc: "Modern official Android", color: "text-purple-500", bg: "bg-purple-500/15" },
  { id: "flutter", name: "Flutter (Dart)", badge: "🐦 Flutter", desc: "Cross-platform UI", color: "text-sky-500", bg: "bg-sky-500/15" },
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
import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;

public class MainActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        Button btnNext = findViewById(R.id.btnNextScreen);
        if (btnNext != null) {
            btnNext.setOnClickListener(v ->
                startActivity(new Intent(this, SecondActivity.class))
            );
        }
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
        android:label="@string/app_name"
        android:usesCleartextTraffic="true"
        android:theme="@style/AppTheme">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        <activity
            android:name=".SecondActivity"
            android:exported="false" />
    </application>
</manifest>`
};

export const FRAMEWORK_STARTERS = {
  // 1. Java Android Project Structure
  java: {
    "settings.gradle": DEFAULT_ANDROID_TEMPLATES["settings.gradle"],
    "build.gradle": DEFAULT_ANDROID_TEMPLATES["build.gradle"],
    "gradle.properties": DEFAULT_ANDROID_TEMPLATES["gradle.properties"],
    "app/build.gradle": DEFAULT_ANDROID_TEMPLATES["app/build.gradle"],
    "app/src/main/AndroidManifest.xml": DEFAULT_ANDROID_TEMPLATES["app/src/main/AndroidManifest.xml"],
    "app/src/main/java/com/wevlo/app/MainActivity.java": DEFAULT_ANDROID_TEMPLATES["MainActivity.java"],
    "app/src/main/java/com/wevlo/app/SecondActivity.java": `package com.wevlo.app;

import android.app.Activity;
import android.os.Bundle;
import android.widget.Button;

public class SecondActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_second);

        Button btnBack = findViewById(R.id.btnBack);
        if (btnBack != null) {
            btnBack.setOnClickListener(v -> finish());
        }
    }
}`,
    "app/src/main/java/com/wevlo/app/utils/AppHelper.java": `package com.wevlo.app.utils;

import android.content.Context;
import android.widget.Toast;

public class AppHelper {
    public static void showMessage(Context context, String message) {
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show();
    }
}`,
    "app/src/main/res/layout/activity_main.xml": `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:gravity="center"
    android:padding="24dp"
    android:background="@color/app_bg">

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="@string/welcome_title"
        android:textSize="22sp"
        android:textStyle="bold"
        android:textColor="@color/text_primary" />

    <Button
        android:id="@+id/btnNextScreen"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="20dp"
        android:text="Open Second Screen"
        android:background="@color/color_primary"
        android:textColor="#FFFFFF" />
</LinearLayout>`,
    "app/src/main/res/layout/activity_second.xml": `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:gravity="center"
    android:padding="24dp"
    android:background="@color/app_bg">

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Second Activity"
        android:textSize="20sp"
        android:textStyle="bold"
        android:textColor="@color/text_primary" />

    <Button
        android:id="@+id/btnBack"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="16dp"
        android:text="Go Back" />
</LinearLayout>`,
    "app/src/main/res/values/strings.xml": `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Wevlo Java App</string>
    <string name="welcome_title">Hello Java Android</string>
</resources>`,
    "app/src/main/res/values/colors.xml": `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="color_primary">#6D28D9</color>
    <color name="app_bg">#F8F7FC</color>
    <color name="text_primary">#0F172A</color>
</resources>`,
    "app/src/main/res/values/styles.xml": `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="android:Theme.DeviceDefault.Light.NoActionBar" />
</resources>`,
    "README.md": `# Wevlo Java Android Project

## Structure
- \`app/src/main/java/com/wevlo/app/\`: Activities and helper classes
- \`app/src/main/res/layout/\`: XML UI layouts
- \`app/src/main/res/values/\`: Strings, colors, and themes
- \`app/build.gradle\`: App-level Gradle configuration
`
  },

  // 2. Kotlin Native Android Project Structure
  kotlin: {
    "settings.gradle": DEFAULT_ANDROID_TEMPLATES["settings.gradle"],
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
    namespace 'com.wevlo.app'
    compileSdk 34

    defaultConfig {
        applicationId "com.wevlo.app"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0"
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
    "app/src/main/AndroidManifest.xml": `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <application
        android:label="@string/app_name"
        android:usesCleartextTraffic="true"
        android:theme="@style/AppTheme">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        <activity
            android:name=".DetailActivity"
            android:exported="false" />
    </application>
</manifest>`,
    "app/src/main/java/com/wevlo/app/MainActivity.kt": `package com.wevlo.app

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.widget.Button
import com.wevlo.app.model.AppItem

class MainActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val item = AppItem(id = 1, title = "Kotlin Native Ready")
        findViewById<Button>(R.id.btnOpenDetail)?.setOnClickListener {
            val intent = Intent(this, DetailActivity::class.java).apply {
                putExtra("ITEM_TITLE", item.title)
            }
            startActivity(intent)
        }
    }
}`,
    "app/src/main/java/com/wevlo/app/DetailActivity.kt": `package com.wevlo.app

import android.app.Activity
import android.os.Bundle
import android.widget.Button
import android.widget.TextView

class DetailActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_detail)

        val title = intent.getStringExtra("ITEM_TITLE") ?: "Detail View"
        findViewById<TextView>(R.id.tvDetailTitle)?.text = title
        findViewById<Button>(R.id.btnGoBack)?.setOnClickListener { finish() }
    }
}`,
    "app/src/main/java/com/wevlo/app/model/AppItem.kt": `package com.wevlo.app.model

data class AppItem(
    val id: Int,
    val title: String
)`,
    "app/src/main/res/layout/activity_main.xml": `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:gravity="center"
    android:padding="24dp"
    android:background="@color/app_bg">

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="@string/welcome_title"
        android:textSize="22sp"
        android:textStyle="bold"
        android:textColor="@color/text_primary" />

    <Button
        android:id="@+id/btnOpenDetail"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="20dp"
        android:text="Open Detail"
        android:background="@color/color_primary"
        android:textColor="#FFFFFF" />
</LinearLayout>`,
    "app/src/main/res/layout/activity_detail.xml": `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:gravity="center"
    android:padding="24dp"
    android:background="@color/app_bg">

    <TextView
        android:id="@+id/tvDetailTitle"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Details"
        android:textSize="20sp"
        android:textStyle="bold"
        android:textColor="@color/text_primary" />

    <Button
        android:id="@+id/btnGoBack"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="16dp"
        android:text="Back" />
</LinearLayout>`,
    "app/src/main/res/values/strings.xml": `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Wevlo Kotlin App</string>
    <string name="welcome_title">Hello Kotlin Android</string>
</resources>`,
    "app/src/main/res/values/colors.xml": `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="color_primary">#7C3AED</color>
    <color name="app_bg">#F8F7FC</color>
    <color name="text_primary">#0F172A</color>
</resources>`,
    "app/src/main/res/values/styles.xml": `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="android:Theme.DeviceDefault.Light.NoActionBar" />
</resources>`,
    "README.md": `# Wevlo Kotlin Android Project

## Structure
- \`app/src/main/java/com/wevlo/app/\`: Kotlin Activities and data models
- \`app/src/main/res/layout/\`: XML layouts
- \`app/src/main/res/values/\`: App strings, colors, and styles
`
  },

  // 3. Flutter (Dart) Project Structure
  flutter: {
    "android/app/src/main/AndroidManifest.xml": `<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <application
        android:label="Wevlo Flutter App"
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
    "android/app/build.gradle": `plugins {
    id "com.android.application"
    id "kotlin-android"
    id "dev.flutter.flutter-gradle-plugin"
}

android {
    namespace = "com.wevlo.flutterapp"
    compileSdk = flutter.compileSdkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17
    }

    defaultConfig {
        applicationId = "com.wevlo.flutterapp"
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("debug")
        }
    }
}

flutter {
    source = "../.."
}`,
    "lib/main.dart": `import 'package:flutter/material.dart';
import 'screens/home_screen.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Wevlo Flutter App',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorSchemeSeed: const Color(0xFF6D28D9),
        useMaterial3: true,
      ),
      home: const HomeScreen(),
    );
  }
}`,
    "lib/screens/home_screen.dart": `import 'package:flutter/material.dart';
import '../widgets/custom_button.dart';
import 'details_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _counter = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Wevlo Home')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Image.asset('assets/logo.png', width: 64, height: 64),
              const SizedBox(height: 16),
              Text(
                'Counter: $_counter',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 20),
              CustomButton(
                label: 'Increment',
                onPressed: () => setState(() => _counter++),
              ),
              const SizedBox(height: 12),
              OutlinedButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const DetailsScreen()),
                  );
                },
                child: const Text('Open Details Screen'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}`,
    "lib/screens/details_screen.dart": `import 'package:flutter/material.dart';

class DetailsScreen extends StatelessWidget {
  const DetailsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Details')),
      body: const Center(
        child: Text(
          'Secondary screen inside lib/screens/',
          style: TextStyle(fontSize: 16),
        ),
      ),
    );
  }
}`,
    "lib/widgets/custom_button.dart": `import 'package:flutter/material.dart';

class CustomButton extends StatelessWidget {
  final String label;
  final VoidCallback onPressed;

  const CustomButton({
    super.key,
    required this.label,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: FilledButton(
        onPressed: onPressed,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 14),
          child: Text(label),
        ),
      ),
    );
  }
}`,
    "assets/logo.png": PLACEHOLDER_LOGO_PNG_B64,
    "pubspec.yaml": `name: wevlo_flutter_app
description: Built with Wevlo Studio
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.2.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter

flutter:
  uses-material-design: true
  assets:
    - assets/logo.png
`,
    "README.md": `# Wevlo Flutter Project

## Folder Structure
- \`android/\`: Native Android configuration, manifest, and resources
- \`lib/main.dart\`: Application entry point
- \`lib/screens/\`: Application screens
- \`lib/widgets/\`: Reusable UI widgets
- \`assets/\`: Images and static assets
- \`pubspec.yaml\`: Dependencies and asset declarations
`
  },

  // 4. Capacitor JS (Web-to-Native) Project Structure
  capacitor: {
    "package.json": `{
  "name": "wevlo-capacitor-app",
  "version": "1.0.0",
  "dependencies": {
    "@capacitor/core": "^6.1.0",
    "@capacitor/android": "^6.1.0",
    "@capacitor/cli": "^6.1.0"
  }
}`,
    "capacitor.config.json": `{
  "appId": "com.wevlo.capapp",
  "appName": "Wevlo Cap",
  "webDir": "www"
}`,
    "www/index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Wevlo Capacitor App</title>
  <link rel="stylesheet" href="css/style.css" />
</head>
<body>
  <main class="container">
    <h1>Capacitor App</h1>
    <p id="status">Ready to run natively.</p>
    <button id="actionBtn">Tap Me</button>
    <a class="link" href="pages/about.html">About Page</a>
  </main>
  <script src="js/app.js"></script>
</body>
</html>`,
    "www/pages/about.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>About</title>
  <link rel="stylesheet" href="../css/style.css" />
</head>
<body>
  <main class="container">
    <h1>About App</h1>
    <p>Built with HTML, CSS, JavaScript, and Capacitor.</p>
    <a class="link" href="../index.html">Back Home</a>
  </main>
</body>
</html>`,
    "www/css/style.css": `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
body {
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  background: #f6f6fb;
  color: #0f172a;
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: 20px;
}
.container {
  background: #ffffff;
  border-radius: 20px;
  padding: 28px;
  width: 100%;
  max-width: 360px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}
button {
  margin-top: 16px;
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 999px;
  background: #6d28d9;
  color: #ffffff;
  font-weight: 700;
}
.link {
  display: inline-block;
  margin-top: 14px;
  color: #6d28d9;
  font-size: 14px;
}`,
    "www/js/app.js": `document.getElementById("actionBtn")?.addEventListener("click", () => {
  const status = document.getElementById("status");
  if (status) {
    status.textContent = "Native Capacitor bridge active!";
  }
});`,
    "README.md": `# Wevlo Capacitor JS Project

## Folder Structure
- \`www/index.html\`: Main entry web page
- \`www/pages/\`: Additional HTML views
- \`www/css/\`: Stylesheets
- \`www/js/\`: JavaScript logic
- \`capacitor.config.json\`: Native app ID, name, and webDir
`
  },

  // 5. Python Kivy (Buildozer) Project Structure
  python: {
    "main.py": `from kivy.app import App
from kivy.uix.screenmanager import ScreenManager
from screens.home_screen import HomeScreen


class MainApp(App):
    def build(self):
        sm = ScreenManager()
        sm.add_widget(HomeScreen(name="home"))
        return sm


if __name__ == "__main__":
    MainApp().run()`,
    "screens/__init__.py": ``,
    "screens/home_screen.py": `from kivy.uix.screenmanager import Screen
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from widgets.custom_widgets import PrimaryButton


class HomeScreen(Screen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        layout = BoxLayout(orientation="vertical", padding=40, spacing=20)
        self.title_label = Label(text="Python Kivy App Ready", font_size="22sp")
        btn = PrimaryButton(text="Click Me")
        btn.bind(on_press=self.on_button_click)
        layout.add_widget(self.title_label)
        layout.add_widget(btn)
        self.add_widget(layout)

    def on_button_click(self, _instance):
        self.title_label.text = "Button Pressed!"`,
    "widgets/__init__.py": ``,
    "widgets/custom_widgets.py": `from kivy.uix.button import Button


class PrimaryButton(Button):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.size_hint_y = None
        self.height = "48dp"
        self.background_color = (0.43, 0.16, 0.85, 1)`,
    "assets/logo.png": PLACEHOLDER_LOGO_PNG_B64,
    "buildozer.spec": `[app]
title = Wevlo App
package.name = wevlopy
package.domain = com.wevlo
source.dir = .
source.include_exts = py,png,jpg,kv,atlas
version = 1.0
requirements = python3,kivy
orientation = portrait

[buildozer]
log_level = 2`,
    "README.md": `# Wevlo Python Kivy Project

## Folder Structure
- \`main.py\`: Application entry point
- \`screens/\`: Kivy screens
- \`widgets/\`: Reusable Kivy widgets
- \`assets/\`: Images and media
- \`buildozer.spec\`: Android packaging configuration
`
  }
};

const CORE_REQUIRED_FILES = {
  java: ["settings.gradle", "build.gradle", "gradle.properties", "app/build.gradle", "app/src/main/AndroidManifest.xml"],
  kotlin: ["settings.gradle", "build.gradle", "gradle.properties", "app/build.gradle", "app/src/main/AndroidManifest.xml"],
  flutter: ["pubspec.yaml", "lib/main.dart"],
  capacitor: ["package.json", "capacitor.config.json", "www/index.html"],
  python: ["main.py", "buildozer.spec"]
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
            flutter create --platforms=android .
            rm -rf lib && cp -r .wevlo_bak/lib . 2>/dev/null || true
            if [ -d ".wevlo_bak/assets" ]; then rm -rf assets && cp -r .wevlo_bak/assets .; fi
            if [ -f ".wevlo_bak/pubspec.yaml" ]; then cp .wevlo_bak/pubspec.yaml pubspec.yaml; fi
            if [ -f ".wevlo_bak/AndroidManifest.xml" ]; then cp .wevlo_bak/AndroidManifest.xml android/app/src/main/AndroidManifest.xml; fi
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
            gh release create "v${versionName}-\${{ github.run_number }}" "\${FILES[@]}" --title "v${versionName}-\${{ github.run_number }}" --notes "Built with Wevlo"
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
            gh release create "v${versionName}-\${{ github.run_number }}" "\${FILES[@]}" --title "v${versionName}-\${{ github.run_number }}" --notes "Built with Wevlo"
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
            gh release create "v${versionName}-\${{ github.run_number }}" "\${FILES[@]}" --title "v${versionName}-\${{ github.run_number }}" --notes "Built with Wevlo"
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
            gh release create "v${versionName}-\${{ github.run_number }}" "\${FILES[@]}" --title "v${versionName}-\${{ github.run_number }}" --notes "Built with Wevlo"
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
    const m = raw.match(/([A-Za-z0-9_./-]+\.(?:java|kt|dart|py|xml|gradle|ya?ml)):(\d+):\s*(error|warning)?:?\s*(.+)/i);
    if (m) {
      const file = m[1].replace(/^.*\/(app\/|lib\/|www\/|screens\/|widgets\/|\.github\/|main\.py|settings\.gradle|build\.gradle)/, "$1");
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
  const lines = content.split("\n");
  if (path.endsWith(".java") || path.endsWith(".kt") || path.endsWith(".dart")) {
    let bal = 0;
    lines.forEach((ln) => {
      bal += (ln.match(/\{/g) || []).length - (ln.match(/\}/g) || []).length;
    });
    if (bal !== 0) {
      issues.push({ severity: "error", file: path, line: lines.length, message: `Unbalanced braces '{' vs '}' (diff: ${bal}).` });
    }
  }
  if (path === "build.gradle" && /allprojects\s*\{[\s\S]*repositories\s*\{/.test(content)) {
    issues.push({
      severity: "error",
      file: path,
      line: 1,
      message: "build.gradle contains allprojects { repositories }, which conflicts with FAIL_ON_PROJECT_REPOS in settings.gradle.",
      fixPath: "build.gradle",
      fixContent: DEFAULT_ANDROID_TEMPLATES["build.gradle"]
    });
  }
  if (framework === "flutter" && path === "android/app/build.gradle" && !content.includes("jvmTarget")) {
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
  const coreFiles = CORE_REQUIRED_FILES[fw] || [];
  const starter = FRAMEWORK_STARTERS[fw] || FRAMEWORK_STARTERS.java;

  if (paths.length > 0) {
    for (const reqPath of coreFiles) {
      if (!paths.includes(reqPath) && starter[reqPath] !== undefined) {
        problems.push({
          severity: "error",
          file: reqPath,
          line: 1,
          message: `Missing required file: ${reqPath}`,
          fixPath: reqPath,
          fixContent: starter[reqPath]
        });
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
