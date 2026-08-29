import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:url_launcher/url_launcher.dart';
import 'config.dart';

class AppWebViewScreen extends StatefulWidget {
  const AppWebViewScreen({super.key});

  @override
  State<AppWebViewScreen> createState() => _AppWebViewScreenState();
}

class _AppWebViewScreenState extends State<AppWebViewScreen> with SingleTickerProviderStateMixin {
  InAppWebViewController? _webViewController;

  bool _isAppReady = false;
  bool _hasError = false;
  String _errorMessage = '';
  DateTime? _lastBackPressed;

  @override
  void initState() {
    super.initState();
    // Safety fallback: reveal interface after 1.5s max so user is never stuck waiting on slow networks
    Timer(const Duration(milliseconds: 1500), () {
      if (mounted && !_isAppReady) {
        setState(() {
          _isAppReady = true;
        });
      }
    });
  }

  Future<bool> _handlePopScope() async {
    if (_webViewController != null) {
      if (await _webViewController!.canGoBack()) {
        await _webViewController!.goBack();
        return false;
      }
    }

    final now = DateTime.now();
    if (_lastBackPressed == null || now.difference(_lastBackPressed!) > const Duration(seconds: 2)) {
      _lastBackPressed = now;
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text(
              'অ্যাপ বন্ধ করতে আবার ব্যাক বাটন চাপুন',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            duration: const Duration(seconds: 2),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            margin: const EdgeInsets.symmetric(horizontal: 48, vertical: 20),
            backgroundColor: const Color(0xFF0F172A),
          ),
        );
      }
      return false;
    }
    return true;
  }

  void _handleExternalUrl(Uri uri) async {
    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    } catch (e) {
      debugPrint("Could not launch external URL $uri: $e");
    }
  }

  void _injectNativeAppStyles(InAppWebViewController controller) async {
    try {
      await controller.evaluateJavascript(source: """
        (function() {
          if (document.getElementById('bdretailers-native-app-styles')) return;
          var style = document.createElement('style');
          style.id = 'bdretailers-native-app-styles';
          style.innerHTML = `
            html, body {
              overscroll-behavior-y: none !important;
              overscroll-behavior-x: none !important;
              overscroll-behavior: none !important;
              -webkit-tap-highlight-color: transparent !important;
              -webkit-touch-callout: none !important;
            }
            ::-webkit-scrollbar {
              display: none !important;
            }
          `;
          document.head.appendChild(style);
        })();
      """);
    } catch (e) {
      debugPrint("Style injection error: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    final primaryColor = HexColor.fromHex(AppConfig.primaryColorHex);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        final shouldExit = await _handlePopScope();
        if (shouldExit && context.mounted) {
          SystemNavigator.pop();
        }
      },
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: Stack(
            children: [
              // ── 1. Optimized Native WebView ──
              if (!_hasError)
                InAppWebView(
                  initialUrlRequest: URLRequest(
                    url: WebUri(AppConfig.targetUrl),
                  ),
                  initialSettings: InAppWebViewSettings(
                    useShouldOverrideUrlLoading: true,
                    mediaPlaybackRequiresUserGesture: false,
                    allowsInlineMediaPlayback: true,
                    javaScriptEnabled: true,
                    domStorageEnabled: true,
                    databaseEnabled: true,
                    useWideViewPort: true,
                    loadWithOverviewMode: true,
                    supportZoom: false,
                    builtInZoomControls: false,
                    displayZoomControls: false,
                    mixedContentMode: MixedContentMode.MIXED_CONTENT_ALWAYS_ALLOW,
                    userAgent: "Mozilla/5.0 (Linux; Android 13; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
                    allowFileAccessFromFileURLs: true,
                    allowUniversalAccessFromFileURLs: true,
                    javaScriptCanOpenWindowsAutomatically: true,
                    supportMultipleWindows: true,
                    geolocationEnabled: true,
                    cacheEnabled: true,
                    cacheMode: CacheMode.LOAD_DEFAULT,
                    hardwareAcceleration: true,
                    thirdPartyCookiesEnabled: true,
                    sharedCookiesEnabled: true,
                    transparentBackground: false,
                    verticalScrollBarEnabled: false,
                    horizontalScrollBarEnabled: false,
                    overScrollMode: OverScrollMode.NEVER,
                    disableDefaultErrorPage: true,
                    preferredContentMode: UserPreferredContentMode.MOBILE,
                  ),
                  onCreateWindow: (controller, createWindowAction) async {
                    showDialog(
                      context: context,
                      barrierDismissible: false,
                      builder: (dialogContext) {
                        return Dialog(
                          insetPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 20),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                          clipBehavior: Clip.antiAlias,
                          child: SizedBox(
                            width: MediaQuery.of(context).size.width,
                            height: MediaQuery.of(context).size.height * 0.85,
                            child: Column(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                  color: const Color(0xFFF1F5F9),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      const Row(
                                        children: [
                                          Icon(Icons.lock_outline_rounded, size: 16, color: Color(0xFF475569)),
                                          SizedBox(width: 6),
                                          Text(
                                            'Google Sign In',
                                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF1E293B)),
                                          ),
                                        ],
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.close_rounded, size: 20, color: Color(0xFF475569)),
                                        padding: EdgeInsets.zero,
                                        constraints: const BoxConstraints(),
                                        onPressed: () {
                                          if (Navigator.canPop(dialogContext)) {
                                            Navigator.pop(dialogContext);
                                          }
                                        },
                                      ),
                                    ],
                                  ),
                                ),
                                Expanded(
                                  child: InAppWebView(
                                    windowId: createWindowAction.windowId,
                                    initialSettings: InAppWebViewSettings(
                                      javaScriptEnabled: true,
                                      domStorageEnabled: true,
                                      databaseEnabled: true,
                                      thirdPartyCookiesEnabled: true,
                                      sharedCookiesEnabled: true,
                                      mixedContentMode: MixedContentMode.MIXED_CONTENT_ALWAYS_ALLOW,
                                      supportMultipleWindows: false,
                                      javaScriptCanOpenWindowsAutomatically: true,
                                      allowsInlineMediaPlayback: true,
                                      userAgent: "Mozilla/5.0 (Linux; Android 13; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
                                    ),
                                    onCloseWindow: (controller) {
                                      if (Navigator.canPop(dialogContext)) {
                                        Navigator.pop(dialogContext);
                                      }
                                    },
                                    onLoadStop: (controller, url) async {
                                      final urlStr = url?.toString().toLowerCase() ?? '';
                                      if (urlStr.contains('/api/auth') || urlStr.contains('__/auth/handler') || urlStr.contains('accounts.google.com/rotatecookiespage')) {
                                        Future.delayed(const Duration(milliseconds: 600), () {
                                          if (Navigator.canPop(dialogContext)) {
                                            Navigator.pop(dialogContext);
                                          }
                                        });
                                      }
                                    },
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    );
                    return true;
                  },
                  onWebViewCreated: (controller) {
                    _webViewController = controller;
                  },
                  onPageCommitVisible: (controller, url) {
                    _injectNativeAppStyles(controller);
                    if (mounted && !_isAppReady) {
                      setState(() {
                        _isAppReady = true;
                        _hasError = false;
                      });
                    }
                  },
                  onProgressChanged: (controller, progress) {
                    if (progress >= 20 && mounted && !_isAppReady) {
                      _injectNativeAppStyles(controller);
                      setState(() {
                        _isAppReady = true;
                        _hasError = false;
                      });
                    }
                  },
                  onLoadStop: (controller, url) async {
                    _injectNativeAppStyles(controller);
                    if (mounted && !_isAppReady) {
                      setState(() {
                        _isAppReady = true;
                        _hasError = false;
                      });
                    }
                  },
                  onGeolocationPermissionsShowPrompt: (controller, origin) async {
                    try {
                      final status = await Permission.location.request();
                      if (status.isGranted || status.isLimited) {
                        return GeolocationPermissionShowPromptResponse(
                          origin: origin,
                          allow: true,
                          retain: true,
                        );
                      }
                    } catch (e) {
                      debugPrint("Geolocation prompt error: $e");
                    }
                    return GeolocationPermissionShowPromptResponse(
                      origin: origin,
                      allow: true,
                      retain: true,
                    );
                  },
                  onReceivedError: (controller, request, error) {
                    if (request.isForMainFrame ?? true) {
                      if (mounted) {
                        setState(() {
                          _isAppReady = false;
                          _hasError = true;
                          _errorMessage = error.description;
                        });
                      }
                    }
                  },
                  shouldOverrideUrlLoading: (controller, navigationAction) async {
                    final uri = navigationAction.request.url;
                    if (uri == null) return NavigationActionPolicy.ALLOW;

                    final scheme = uri.scheme.toLowerCase();
                    final urlString = uri.toString().toLowerCase();

                    // Handle phone calls, SMS, mailto, WhatsApp, bKash, Nagad
                    if (scheme == 'tel' ||
                        scheme == 'mailto' ||
                        scheme == 'sms' ||
                        urlString.contains('wa.me') ||
                        urlString.contains('whatsapp') ||
                        urlString.contains('intent:') ||
                        scheme == 'bkash' ||
                        scheme == 'nagad') {
                      _handleExternalUrl(uri);
                      return NavigationActionPolicy.CANCEL;
                    }

                    return NavigationActionPolicy.ALLOW;
                  },
                ),

              // ── 2. Branded Native Splash Shell (Smooth Fade Transition) ──
              IgnorePointer(
                ignoring: _isAppReady,
                child: AnimatedOpacity(
                  opacity: _isAppReady ? 0.0 : 1.0,
                  duration: const Duration(milliseconds: 350),
                  curve: Curves.easeOut,
                  child: Container(
                    color: Colors.white,
                    width: double.infinity,
                    height: double.infinity,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const SizedBox(height: 40),
                        // Center Brand & Logo
                        Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 100,
                              height: 100,
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(28),
                                boxShadow: [
                                  BoxShadow(
                                    color: primaryColor.withOpacity(0.12),
                                    blurRadius: 30,
                                    spreadRadius: 4,
                                  ),
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.06),
                                    blurRadius: 16,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                                border: Border.all(
                                  color: Colors.grey.withOpacity(0.15),
                                  width: 1.5,
                                ),
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(16),
                                child: Image.asset(
                                  'assets/icon.png',
                                  fit: BoxFit.contain,
                                  errorBuilder: (ctx, err, stack) => Icon(
                                    Icons.shopping_bag_rounded,
                                    size: 48,
                                    color: primaryColor,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 24),
                            Text(
                              AppConfig.appName,
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFF0F172A),
                                letterSpacing: -0.5,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 24),
                            SizedBox(
                              width: 26,
                              height: 26,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.8,
                                valueColor: AlwaysStoppedAnimation<Color>(primaryColor),
                              ),
                            ),
                          ],
                        ),

                        // Bottom Platform Attribution
                        Padding(
                          padding: const EdgeInsets.only(bottom: 24.0),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                width: 14,
                                height: 14,
                                decoration: BoxDecoration(
                                  color: primaryColor,
                                  shape: BoxShape.circle,
                                ),
                                child: const Center(
                                  child: Text('⚡', style: TextStyle(fontSize: 8, color: Colors.white)),
                                ),
                              ),
                              const SizedBox(width: 6),
                              const Text(
                                'Secured by BDRetailers',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF64748B),
                                  letterSpacing: 0.2,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // ── 3. Offline / Network Error Screen ──
              if (_hasError)
                Container(
                  color: Colors.white,
                  child: Center(
                    child: Padding(
                      padding: const EdgeInsets.all(32.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFEF2F2),
                              borderRadius: BorderRadius.circular(28),
                            ),
                            child: const Icon(Icons.wifi_off_rounded, size: 56, color: Color(0xFFEF4444)),
                          ),
                          const SizedBox(height: 24),
                          const Text(
                            'ইন্টারনেট সংযোগ নেই',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            _errorMessage.isNotEmpty
                                ? _errorMessage
                                : 'ডাটা লোড করা সম্ভব হয়নি। অনুগ্রহ করে ইন্টারনেট সংযোগ চেক করে আবার চেষ্টা করুন।',
                            textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 13, color: Color(0xFF64748B), height: 1.4),
                          ),
                          const SizedBox(height: 28),
                          ElevatedButton.icon(
                            onPressed: () {
                              setState(() {
                                _hasError = false;
                                _isAppReady = false;
                              });
                              _webViewController?.reload();
                            },
                            icon: const Icon(Icons.refresh_rounded, size: 18),
                            label: const Text(
                              'আবার চেষ্টা করুন',
                              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: primaryColor,
                              foregroundColor: Colors.white,
                              elevation: 0,
                              padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

// Local helper for parsing dynamic Hex colors
class HexColor {
  static Color fromHex(String hexString) {
    final buffer = StringBuffer();
    if (hexString.length == 6 || hexString.length == 7) buffer.write('ff');
    buffer.write(hexString.replaceFirst('#', ''));
    return Color(int.parse(buffer.toString(), radix: 16));
  }
}
