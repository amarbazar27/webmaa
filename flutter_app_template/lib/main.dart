import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'config.dart';

// Local Notifications Plugin setup for background messages
final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();

bool _firebaseInitialized = false;

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Handles background notifications - safe no-op if Firebase not ready
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
          'daripallah_channel',
          'Daripallah Notifications',
          channelDescription: 'Notifications for Daripallah stores',
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
          'daripallah_channel',
          'Daripallah Notifications',
          description: 'Notifications for Daripallah stores',
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
  runApp(const MyApp());
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
      home: const MainWebViewPage(),
    );
  }
}

class MainWebViewPage extends StatefulWidget {
  const MainWebViewPage({super.key});

  @override
  State<MainWebViewPage> createState() => _MainWebViewPageState();
}

class _MainWebViewPageState extends State<MainWebViewPage> {
  InAppWebViewController? webViewController;
  PullToRefreshController? pullToRefreshController;
  
  double progress = 0;
  bool isOffline = false;
  bool isLoading = true;
  DateTime? lastPressedTime;

  @override
  void initState() {
    super.initState();
    initFirebaseListeners();
    initPullToRefresh();
  }

  void initFirebaseListeners() {
    if (!_firebaseInitialized) return; // Skip if Firebase not ready
    try {
      FirebaseMessaging.instance.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );

      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        _showNotification(message);
      });

      FirebaseMessaging.instance.getToken().then((token) {
        debugPrint("FCM Device Token: $token");
        // We can pass this token to the webview once it's loaded using javascript
      });
    } catch (_) {}
  }

  void initPullToRefresh() {
    pullToRefreshController = kIsWeb
        ? null
        : PullToRefreshController(
            settings: PullToRefreshSettings(
              color: HexColor.fromHex(AppConfig.primaryColorHex),
              backgroundColor: Colors.white,
            ),
            onRefresh: () async {
              if (Platform.isAndroid) {
                webViewController?.reload();
              } else if (Platform.isIOS) {
                webViewController?.loadUrl(
                    urlRequest: URLRequest(url: await webViewController?.getUrl()));
              }
            },
          );
  }

  Future<bool> handleBackButton() async {
    if (webViewController != null && await webViewController!.canGoBack()) {
      webViewController!.goBack();
      return false; // Prevent exit
    } else {
      DateTime now = DateTime.now();
      if (lastPressedTime == null ||
          now.difference(lastPressedTime!) > const Duration(seconds: 2)) {
        lastPressedTime = now;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('অ্যাপ থেকে বের হতে আরেকবার ব্যাক বাটন চাপুন।'),
            duration: Duration(seconds: 2),
          ),
        );
        return false;
      }
      return true; // Exit app
    }
  }

  @override
  Widget build(BuildContext context) {
    Color primaryColor = HexColor.fromHex(AppConfig.primaryColorHex);
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        final shouldPop = await handleBackButton();
        if (shouldPop && mounted) {
          SystemNavigator.pop();
        }
      },
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: Stack(
            children: [
              // Main WebView component
              if (!isOffline)
                InAppWebView(
                  initialUrlRequest: URLRequest(url: WebUri(AppConfig.targetUrl)),
                  initialSettings: InAppWebViewSettings(
                    useShouldOverrideUrlLoading: true,
                    mediaPlaybackRequiresUserGesture: false,
                    javaScriptEnabled: true,
                    domStorageEnabled: true,
                    geolocationEnabled: true,
                    allowFileAccessFromFileURLs: true,
                    allowUniversalAccessFromFileURLs: true,
                    applicationNameForUserAgent: 'DaripallahAndroidApp',
                    supportZoom: false,
                  ),
                  pullToRefreshController: pullToRefreshController,
                  onWebViewCreated: (controller) {
                    webViewController = controller;
                    
                    // Register native Javascript Channels
                    controller.addJavaScriptHandler(
                      handlerName: 'NativeShare',
                      callback: (args) {
                        if (args.isNotEmpty) {
                          String shareText = args[0].toString();
                          Share.share(shareText);
                        }
                      },
                    );

                    controller.addJavaScriptHandler(
                      handlerName: 'NativeToast',
                      callback: (args) {
                        if (args.isNotEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text(args[0].toString())),
                          );
                        }
                      },
                    );
                  },
                  onLoadStart: (controller, url) {
                    setState(() {
                      isLoading = true;
                      isOffline = false;
                    });
                  },
                  onLoadStop: (controller, url) async {
                    pullToRefreshController?.endRefreshing();
                    // Page loaded successfully — always cancel offline screen
                    setState(() {
                      isLoading = false;
                      isOffline = false;
                    });
                  },
                  onReceivedError: (controller, request, error) {
                    pullToRefreshController?.endRefreshing();
                    // CRITICAL: Only show offline screen if the MAIN page fails.
                    // Sub-resources (fonts, analytics, CDN images) also trigger this
                    // callback — we must ignore them, otherwise the app falsely
                    // shows "no internet" even when the main page loaded fine.
                    if (request.isForMainFrame == true) {
                      if (error.type == WebResourceErrorType.HOST_LOOKUP ||
                          error.type == WebResourceErrorType.TIMEOUT) {
                        setState(() {
                          isOffline = true;
                          isLoading = false;
                        });
                      }
                    }
                    // Sub-resource errors are silently ignored
                  },
                  onProgressChanged: (controller, progressVal) {
                    if (progressVal == 100) {
                      pullToRefreshController?.endRefreshing();
                    }
                    setState(() {
                      progress = progressVal / 100;
                    });
                  },
                  onPermissionRequest: (controller, permissionRequest) async {
                    // Automatically request and grant HTML5 permissions
                    List<Permission> systemPermissions = [];
                    for (var resource in permissionRequest.resources) {
                      if (resource == PermissionResourceType.CAMERA) {
                        systemPermissions.add(Permission.camera);
                      } else if (resource == PermissionResourceType.MICROPHONE) {
                        systemPermissions.add(Permission.microphone);
                      }
                    }

                    if (systemPermissions.isNotEmpty) {
                      Map<Permission, PermissionStatus> statuses = await systemPermissions.request();
                      bool allGranted = statuses.values.every((status) => status.isGranted);
                      
                      if (allGranted) {
                        return PermissionResponse(
                          resources: permissionRequest.resources,
                          action: PermissionResponseAction.GRANT,
                        );
                      }
                    }
                    return PermissionResponse(
                      resources: permissionRequest.resources,
                      action: PermissionResponseAction.DENY,
                    );
                  },
                  shouldOverrideUrlLoading: (controller, navigationAction) async {
                    var uri = navigationAction.request.url;
                    if (uri != null) {
                      String urlString = uri.toString();
                      // Open external apps for specific schemes (phone, mail, whatsapp, messenger, bkash, sslcommerz)
                      if (!urlString.startsWith("http://") && !urlString.startsWith("https://")) {
                        if (await canLaunchUrl(uri)) {
                          await launchUrl(uri, mode: LaunchMode.externalApplication);
                          return NavigationActionPolicy.CANCEL;
                        }
                      }
                    }
                    return NavigationActionPolicy.ALLOW;
                  },
                ),

              // Progress bar
              if (isLoading && !isOffline)
                LinearProgressIndicator(
                  value: progress,
                  color: primaryColor,
                  backgroundColor: Colors.grey[200],
                  minHeight: 3,
                ),

              // Custom Offline screen
              if (isOffline)
                OfflineView(
                  primaryColor: primaryColor,
                  onRetry: () {
                    setState(() {
                      isOffline = false;
                      isLoading = true;
                    });
                    webViewController?.loadUrl(
                      urlRequest: URLRequest(url: WebUri(AppConfig.targetUrl)),
                    );
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class OfflineView extends StatelessWidget {
  final Color primaryColor;
  final VoidCallback onRetry;

  const OfflineView({
    super.key,
    required this.primaryColor,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Icon(
              Icons.wifi_off_rounded,
              size: 80,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 24),
            const Text(
              'কোনো ইন্টারনেট সংযোগ নেই',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            const Text(
              'অনুগ্রহ করে আপনার মোবাইল ডাটা বা ওয়াইফাই সংযোগ পরীক্ষা করে পুনরায় চেষ্টা করুন।',
              style: TextStyle(
                fontSize: 14,
                color: Colors.black54,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded, color: Colors.white),
              label: const Text(
                'পুনরায় চেষ্টা করুন',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryColor,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Utility to parse HSL / Hex styling variables dynamically
extension HexColor on Color {
  static Color fromHex(String hexString) {
    final buffer = StringBuffer();
    if (hexString.length == 6 || hexString.length == 7) buffer.write('ff');
    buffer.write(hexString.replaceFirst('#', ''));
    return Color(int.parse(buffer.toString(), radix: 16));
  }
}
