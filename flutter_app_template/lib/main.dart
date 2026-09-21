import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import 'config.dart';
import 'cart_provider.dart';
import 'storefront_view.dart';
import 'theme.dart';

// Local Notifications Plugin setup for background messages
final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();

bool _firebaseInitialized = false;

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp();
    _showNotification(message);
  } catch (e) {
    // Silently ignore if Firebase not configured
  }
}

void _showNotification(RemoteMessage message) async {
  RemoteNotification? notification = message.notification;
  AndroidNotification? android = message.notification?.android;
  if (notification != null && android != null) {
    flutterLocalNotificationsPlugin.show(
      notification.hashCode,
      notification.title,
      notification.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          'bdretailers_channel',
          'BDRetailers Notifications',
          channelDescription: 'Notifications for BDRetailers stores',
          icon: '@mipmap/ic_launcher',
          importance: Importance.max,
          priority: Priority.high,
        ),
      ),
    );
  }
}

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // Enable edge-to-edge system UI layout for Android 15 compatibility
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);

  // Set system UI layout styling immediately
  Color primaryColor = appPrimaryColor;
  SystemChrome.setSystemUIOverlayStyle(SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: Colors.transparent,
    systemNavigationBarIconBrightness: Brightness.light,
  ));

  // Run application instantly (Zero Cold Start Delay)
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => CartProvider()),
      ],
      child: const MyApp(),
    ),
  );

  // Background initialization of Firebase & Notifications (non-blocking)
  Future.microtask(() async {
    try {
      await Firebase.initializeApp();
      _firebaseInitialized = true;
      FirebaseMessaging.onBackgroundMessage(
          _firebaseMessagingBackgroundHandler);

      // Set up Android notification channel
      await flutterLocalNotificationsPlugin
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(const AndroidNotificationChannel(
            'bdretailers_channel',
            'BDRetailers Notifications',
            description: 'Notifications for BDRetailers stores',
            importance: Importance.max,
          ));
      debugPrint("Firebase initialized in background.");
    } catch (e) {
      _firebaseInitialized = false;
      debugPrint(
          "Firebase init failed (non-critical): $e. App will work without push notifications.");
    }
  });
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: AppConfig.appName,
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      // ★ THE KEY CHANGE: Native StorefrontView instead of AppWebViewScreen
      // This is what fixes the laggy/non-responsive WebView issue.
      // The app now renders native Flutter widgets directly from Firestore,
      // giving 60fps performance instead of loading a website in a browser.
      home: StorefrontView(shopId: AppConfig.shopId),
    );
  }
}
