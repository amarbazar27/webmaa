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
import 'marketplace_view.dart';

// Local Notifications Plugin setup for background messages
final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();

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

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Try to initialize Firebase — fully optional, app works without it
  try {
    await Firebase.initializeApp();
    _firebaseInitialized = true;
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
    
    // Set up Android notification channel
    await flutterLocalNotificationsPlugin
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(const AndroidNotificationChannel(
          'bdretailers_channel',
          'BDRetailers Notifications',
          description: 'Notifications for BDRetailers stores',
          importance: Importance.max,
        ));
    debugPrint("Firebase initialized successfully.");
  } catch (e) {
    _firebaseInitialized = false;
    debugPrint("Firebase init failed (non-critical): $e. App will work without push notifications.");
  }

  // Set system UI layout styling
  Color primaryColor = HexColor.fromHex(AppConfig.primaryColorHex);
  SystemChrome.setSystemUIOverlayStyle(SystemUiOverlayStyle(
    statusBarColor: primaryColor,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: Colors.black,
    systemNavigationBarIconBrightness: Brightness.light,
  ));

  // Run application
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => CartProvider()),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    Color primaryColor = HexColor.fromHex(AppConfig.primaryColorHex);
    return MaterialApp(
      title: AppConfig.appName,
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primaryColor: primaryColor,
        colorScheme: ColorScheme.fromSeed(seedColor: primaryColor),
        useMaterial3: true,
      ),
      home: const MainRootNavigator(),
    );
  }
}

class MainRootNavigator extends StatefulWidget {
  const MainRootNavigator({super.key});

  @override
  State<MainRootNavigator> createState() => _MainRootNavigatorState();
}

class _MainRootNavigatorState extends State<MainRootNavigator> {
  @override
  Widget build(BuildContext context) {
    // If shopId is bdretailers or main, load Marketplace View directory
    if (AppConfig.shopId == 'bdretailers' || AppConfig.shopId == 'main') {
      return const MarketplaceView();
    }
    // Load specific storefront directly
    return StorefrontView(shopId: AppConfig.shopId);
  }
}

// Utility to parse Hex styling variables dynamically
extension HexColor on Color {
  static Color fromHex(String hexString) {
    final buffer = StringBuffer();
    if (hexString.length == 6 || hexString.length == 7) buffer.write('ff');
    buffer.write(hexString.replaceFirst('#', ''));
    return Color(int.parse(buffer.toString(), radix: 16));
  }
}
