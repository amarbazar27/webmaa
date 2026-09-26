# Proguard / R8 rules for Flutter & Firebase Android Release Builds

# Suppress missing class warnings for Flutter Engine & Play Core split install
-dontwarn com.google.android.play.core.**
-dontwarn io.flutter.embedding.engine.deferredcomponents.**
-dontwarn io.flutter.plugins.**
-dontwarn **
-ignorewarnings

# Flutter Engine & Plugins
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.embedding.** { *; }
-keep class io.flutter.provider.** { *; }
-keep class io.flutter.plugins.** { *; }

# InAppWebView Plugin
-keep class com.pichillilorenzo.flutter_inappwebview_android.** { *; }
-dontwarn com.pichillilorenzo.flutter_inappwebview_android.**

# Local Notifications Plugin
-keep class com.dexterous.flutterlocalnotifications.** { *; }
-dontwarn com.dexterous.flutterlocalnotifications.**

# Flutter Community Plugins (share_plus, url_launcher, etc.)
-keep class dev.fluttercommunity.** { *; }
-dontwarn dev.fluttercommunity.**
-keep class com.baseflow.** { *; }
-dontwarn com.baseflow.**

# Firebase Core, Firestore, Messaging & Analytics
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

# Firestore Model Field Preservation
-keepclassmembers class * {
    @com.google.firebase.firestore.PropertyName <fields>;
    @com.google.firebase.firestore.PropertyName <methods>;
}

# Android Native Components (optimized - allow R8 to obfuscate and shrink AndroidX)
-keepclassmembers class * extends androidx.lifecycle.ViewModel {
    <init>(...);
}
-keep class androidx.lifecycle.ReportFragment { *; }
-keep class androidx.activity.ComponentActivity { *; }
-keep class **.R$* { *; }

