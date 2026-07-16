import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'models.dart';
import 'database_service.dart';
import 'storefront_view.dart';

class MarketplaceView extends StatefulWidget {
  const MarketplaceView({super.key});

  @override
  State<MarketplaceView> createState() => _MarketplaceViewState();
}

class _MarketplaceViewState extends State<MarketplaceView> {
  final DatabaseService _db = DatabaseService();
  List<Shop> _shops = [];
  List<Shop> _filteredShops = [];
  bool _isLoading = true;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadShops();
  }

  void _loadShops() async {
    final list = await _db.getAllShops();
    setState(() {
      _shops = list;
      _filteredShops = list;
      _isLoading = false;
    });
  }

  void _searchShops(String query) {
    setState(() {
      _searchQuery = query;
      _filteredShops = _shops
          .where((shop) => shop.name.toLowerCase().contains(query.toLowerCase()) ||
              shop.slogan.toLowerCase().contains(query.toLowerCase()))
          .toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('BDRetailers Shop Directory', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 0.5,
        centerTitle: true,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Search Bar
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: TextField(
                    decoration: InputDecoration(
                      hintText: 'স্টোর বা শপ খুঁজুন...',
                      prefixIcon: const Icon(Icons.search),
                      filled: true,
                      fillColor: Colors.white,
                      contentPadding: const EdgeInsets.symmetric(vertical: 0),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(30),
                        borderSide: BorderSide.none,
                      ),
                    ),
                    onChanged: _searchShops,
                  ),
                ),
                // Shops List
                Expanded(
                  child: _filteredShops.isEmpty
                      ? const Center(child: Text('কোনো স্টোর পাওয়া যায়নি।'))
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _filteredShops.length,
                          itemBuilder: (context, index) {
                            final shop = _filteredShops[index];
                            return _buildShopCard(shop);
                          },
                        ),
                ),
              ],
            ),
    );
  }

  Widget _buildShopCard(Shop shop) {
    final themeColor = HexColor.fromHex(shop.primaryColorHex);
    return Card(
      color: Colors.white,
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 0.5,
      child: InkWell(
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => StorefrontView(shopId: shop.id),
            ),
          );
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: [
              // Logo
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: shop.logoUrl.isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl: shop.logoUrl,
                        width: 60,
                        height: 60,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => Container(color: Colors.grey[100]),
                        errorWidget: (context, url, error) => const Icon(Icons.store, size: 40),
                      )
                    : Container(
                        width: 60,
                        height: 60,
                        color: Colors.grey[100],
                        child: const Icon(Icons.store, size: 40),
                      ),
              ),
              const SizedBox(width: 16),
              // Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      shop.name,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      shop.slogan.isNotEmpty ? shop.slogan : 'Quality products, best service.',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                  ],
                ),
              ),
              // Arrow icon
              Icon(Icons.arrow_forward_ios, size: 16, color: themeColor),
            ],
          ),
        ),
      ),
    );
  }
}

// Local helper extension for themeColor parsing
class HexColor {
  static Color fromHex(String hexString) {
    final buffer = StringBuffer();
    if (hexString.length == 6 || hexString.length == 7) buffer.write('ff');
    buffer.write(hexString.replaceFirst('#', ''));
    return Color(int.parse(buffer.toString(), radix: 16));
  }
}
