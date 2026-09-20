import 'package:flutter/material.dart';
import 'config.dart';

/// Unified hex color parser — single source of truth.
/// Replaces per-file HexColor copies in storefront_view, product_detail_view,
/// checkout_view, and main.dart.
class HexColor {
  static Color fromHex(String hexString) {
    final buffer = StringBuffer();
    if (hexString.length == 6 || hexString.length == 7) buffer.write('ff');
    buffer.write(hexString.replaceFirst('#', ''));
    return Color(int.parse(buffer.toString(), radix: 16));
  }
}

/// App's primary brand color derived from tenant config.
Color get appPrimaryColor => HexColor.fromHex(AppConfig.primaryColorHex);

/// Material 3 theme built from tenant branding.
ThemeData buildAppTheme() {
  final seed = appPrimaryColor;
  return ThemeData(
    primaryColor: seed,
    colorScheme: ColorScheme.fromSeed(seedColor: seed),
    useMaterial3: true,
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.white,
      foregroundColor: Colors.black87,
      elevation: 0.5,
      centerTitle: true,
    ),
    scaffoldBackgroundColor: const Color(0xFFFAFAFA),
  );
}

/// Pulsing shimmer loading placeholder. Zero external dependencies.
class ShimmerBox extends StatefulWidget {
  final double width;
  final double height;
  final double borderRadius;

  const ShimmerBox({
    super.key,
    this.width = double.infinity,
    required this.height,
    this.borderRadius = 8,
  });

  @override
  State<ShimmerBox> createState() => _ShimmerBoxState();
}

class _ShimmerBoxState extends State<ShimmerBox>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c;

  @override
  void initState() {
    super.initState();
    _c = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _c,
      builder: (_, __) => Container(
        width: widget.width,
        height: widget.height,
        decoration: BoxDecoration(
          color: Color.lerp(
            const Color(0xFFE0E0E0),
            const Color(0xFFF5F5F5),
            _c.value,
          ),
          borderRadius: BorderRadius.circular(widget.borderRadius),
        ),
      ),
    );
  }
}

/// Shimmer product card skeleton for loading states.
class ProductCardSkeleton extends StatelessWidget {
  const ProductCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: const [
          Expanded(
            child: ShimmerBox(height: double.infinity, borderRadius: 12),
          ),
          Padding(
            padding: EdgeInsets.all(8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ShimmerBox(height: 14, width: 120),
                SizedBox(height: 6),
                ShimmerBox(height: 12, width: 80),
                SizedBox(height: 8),
                ShimmerBox(height: 28),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
