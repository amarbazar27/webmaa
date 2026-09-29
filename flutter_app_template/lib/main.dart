import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import 'config.dart';
import 'theme.dart';
import 'app_webview_screen.dart';

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
  if (notification != null) {
    flutterLocalNotificationsPlugin.show(
      notification.hashCode,
      notification.title,
      notification.body,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'bdretailers_channel',
          'BDRetailers Notifications',
          channelDescription: 'Notifications for BDRetailers stores',
          icon: '@mipmap/ic_launcher',
          importance: Importance.max,
          priority: Priority.high,
          playSound: true,
          enableVibration: true,
        ),
      ),
    );
  }
}

Future<void> _registerDeviceToken() async {
  try {
    final settings = await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );
    debugPrint("User notification permission: ${settings.authorizationStatus}");

    // Get initial device FCM token
    final token = await FirebaseMessaging.instance.getToken();
    if (token != null) {
      debugPrint("Device FCM Token obtained: $token");
      await _sendTokenToServer(token);
    }

    // React to token updates
    FirebaseMessaging.instance.onTokenRefresh.listen((newToken) {
      _sendTokenToServer(newToken);
    });

    // Foreground notifications listener
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint("Foreground message received: ${message.notification?.title}");
      _showNotification(message);
    });
  } catch (e) {
    debugPrint("Failed to register FCM device token: $e");
  }
}

Future<void> _sendTokenToServer(String token) async {
  try {
    final client = HttpClient();
    client.connectionTimeout = const Duration(seconds: 10);
    final url = Uri.parse('${AppConfig.targetUrl}/api/fcm-token');
    final request = await client.postUrl(url);
    request.headers.set('content-type', 'application/json');
    final payload = jsonEncode({
      'token': token,
      'shopId': AppConfig.shopId.isNotEmpty ? AppConfig.shopId : null,
      'platform': 'android',
    });
    request.add(utf8.encode(payload));
    final response = await request.close();
    debugPrint("FCM token registered to server (${response.statusCode}): ${AppConfig.targetUrl}");
  } catch (e) {
    debugPrint("Error sending FCM token to server: $e");
  }
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Enable edge-to-edge system UI layout
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);

  // Set system UI layout styling immediately
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
    systemNavigationBarColor: Colors.transparent,
    systemNavigationBarIconBrightness: Brightness.dark,
  ));

  // Initialize Firebase safely before runApp so plugins are ready
  try {
    await Firebase.initializeApp();
    _firebaseInitialized = true;
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Set up Android notification channel
    await flutterLocalNotificationsPlugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(const AndroidNotificationChannel(
          'bdretailers_channel',
          'BDRetailers Notifications',
          description: 'Notifications for BDRetailers stores',
          importance: Importance.max,
          playSound: true,
          enableVibration: true,
        ));
    debugPrint("Firebase initialized successfully.");

    // Automatically register device token with backend
    _registerDeviceToken();
  } catch (e) {
    _firebaseInitialized = false;
    debugPrint("Firebase init failed (non-critical): $e. App will work without push notifications.");
  }

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: AppConfig.appName,
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      home: const AppWebViewScreen(),
    );
  }
}

