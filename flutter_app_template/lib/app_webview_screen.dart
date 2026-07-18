import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:url_launcher/url_launcher.dart';
import 'config.dart';

class AppWebViewScreen extends StatefulWidget {
  const AppWebViewScreen({super.key});

  @override
  State<AppWebViewScreen> createState() => _AppWebViewScreenState();
}

class _AppWebViewScreenState extends State<AppWebViewScreen> {
  InAppWebViewController? _webViewController;
  PullToRefreshController? _pullToRefreshController;

  double _progress = 0;
  bool _isLoading = true;
  bool _hasError = false;
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    _initPullToRefresh();
  }

  void _initPullToRefresh() {
    _pullToRefreshController = kIsWeb
        ? null
        : PullToRefreshController(
            settings: PullToRefreshSettings(
              color: HexColor.fromHex(AppConfig.primaryColorHex),
            ),
            onRefresh: () async {
              if (Platform.isAndroid) {
                _webViewController?.reload();
              } else if (Platform.isIOS) {
                _webViewController?.loadUrl(
                  urlRequest: URLRequest(url: await _webViewController?.getUrl()),
                );
              }
            },
          );
  }

  Future<bool> _onWillPop() async {
    if (_webViewController != null) {
      if (await _webViewController!.canGoBack()) {
        await _webViewController!.goBack();
        return false;
      }
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

  @override
  Widget build(BuildContext context) {
    final primaryColor = HexColor.fromHex(AppConfig.primaryColorHex);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        final shouldPop = await _onWillPop();
        if (shouldPop && context.mounted) {
          SystemNavigator.pop();
        }
      },
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: Stack(
            children: [
              if (!_hasError)
                InAppWebView(
                  initialUrlRequest: URLRequest(
                    url: WebUri(AppConfig.targetUrl),
                  ),
                  pullToRefreshController: _pullToRefreshController,
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
                    userAgent: "BDRetailersMobileApp/1.0.0 (Android; Mobile)",
                    allowFileAccessFromFileURLs: true,
                    allowUniversalAccessFromFileURLs: true,
                    javaScriptCanOpenWindowsAutomatically: true,
                    supportMultipleWindows: false,
                  ),
                  onWebViewCreated: (controller) {
                    _webViewController = controller;
                  },
                  onLoadStart: (controller, url) {
                    setState(() {
                      _isLoading = true;
                      _hasError = false;
                    });
                  },
                  onLoadStop: (controller, url) async {
                    _pullToRefreshController?.endRefreshing();
                    setState(() {
                      _isLoading = false;
                    });
                  },
                  onProgressChanged: (controller, progress) {
                    if (progress == 100) {
                      _pullToRefreshController?.endRefreshing();
                    }
                    setState(() {
                      _progress = progress / 100;
                      if (progress == 100) {
                        _isLoading = false;
                      }
                    });
                  },
                  onReceivedError: (controller, request, error) {
                    _pullToRefreshController?.endRefreshing();
                    // Only show full error page if main frame fails
                    if (request.isForMainFrame ?? true) {
                      setState(() {
                        _isLoading = false;
                        _hasError = true;
                        _errorMessage = error.description;
                      });
                    }
                  },
                  shouldOverrideUrlLoading: (controller, navigationAction) async {
                    final uri = navigationAction.request.url;
                    if (uri == null) return NavigationActionPolicy.ALLOW;

                    final scheme = uri.scheme.toLowerCase();
                    final urlString = uri.toString().toLowerCase();

                    // Handle phone calls, SMS, mailto, WhatsApp, Bkash, Nagad
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

              // Progress Indicator at top
              if (_isLoading && !_hasError)
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  child: LinearProgressIndicator(
                    value: _progress > 0 ? _progress : null,
                    backgroundColor: Colors.grey[200],
                    valueColor: AlwaysStoppedAnimation<Color>(primaryColor),
                  ),
                ),

              // Offline / Network Error Screen
              if (_hasError)
                Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.wifi_off_rounded, size: 72, color: Colors.grey[400]),
                        const SizedBox(height: 20),
                        const Text(
                          'কানেকশন সমস্যা!',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _errorMessage.isNotEmpty
                              ? _errorMessage
                              : 'ওয়েবসাইট ডাটা লোড করা যায়নি। ইন্টারনেট কানেকশন চেক করে আবার চেষ্টা করুন।',
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 13, color: Colors.grey),
                        ),
                        const SizedBox(height: 24),
                        ElevatedButton.icon(
                          onPressed: () {
                            setState(() {
                              _hasError = false;
                              _isLoading = true;
                            });
                            _webViewController?.reload();
                          },
                          icon: const Icon(Icons.refresh),
                          label: const Text('আবার চেষ্টা করুন (Retry)'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: primaryColor,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                          ),
                        ),
                      ],
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

class HexColor {
  static Color fromHex(String hexString) {
    final buffer = StringBuffer();
    if (hexString.length == 6 || hexString.length == 7) buffer.write('ff');
    buffer.write(hexString.replaceFirst('#', ''));
    return Color(int.parse(buffer.toString(), radix: 16));
  }
}
