import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'models.dart';
import 'database_service.dart';
import 'cart_provider.dart';
import 'product_detail_view.dart';
import 'checkout_view.dart';

class StorefrontView extends StatefulWidget {
  final String shopId;

  const StorefrontView({
    super.key,
    required this.shopId,
  });

  @override
  State<StorefrontView> createState() => _StorefrontViewState();
}

class _StorefrontViewState extends State<StorefrontView> {
  final DatabaseService _db = DatabaseService();
  Shop? _shop;
  List<Category> _categories = [];
  List<Product> _products = [];
  List<Product> _filteredProducts = [];

  bool _isLoading = true;
  String _selectedCategoryId = 'all';
  String _searchQuery = '';

  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadStoreData();
  }

  Future<void> _loadStoreData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final shop = await _db.getShop(widget.shopId);
      if (shop != null) {
        final categories = await _db.getCategories(shop.id);
        final products = await _db.getProducts(shop.id);
        if (mounted) {
          setState(() {
            _shop = shop;
            _categories = categories;
            _products = products;
            _isLoading = false;
          });
          _filterProducts();
        }
      } else {
        if (mounted) {
          setState(() {
            _isLoading = false;
            _errorMessage = 'স্টোর খুঁজে পাওয়া যায়নি! (ID: ${widget.shopId})';
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'নেটওয়ার্ক বা ডাটাবেজ কানেকশনে সমস্যা হয়েছে।';
        });
      }
    }
  }

  void _filterProducts() {
    setState(() {
      _filteredProducts = _products.where((p) {
        bool matchesCategory = _selectedCategoryId == 'all';
        if (!matchesCategory) {
          final pCat = p.categoryId.trim().toLowerCase();
          final selCat = _selectedCategoryId.trim().toLowerCase();

          matchesCategory = (pCat == selCat);

          if (!matchesCategory) {
            for (final c in _categories) {
              final cId = c.id.trim().toLowerCase();
              final cName = c.name.trim().toLowerCase();
              if (cId == selCat || cName == selCat) {
                if (pCat == cId || pCat == cName) {
                  matchesCategory = true;
                  break;
                }
              }
            }
          }
        }

        final matchesSearch = _searchQuery.isEmpty || p.name.toLowerCase().contains(_searchQuery.trim().toLowerCase());
        return matchesCategory && matchesSearch;
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: Colors.grey[50],
        body: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text(
                'স্টোর ডাটা লোড হচ্ছে...',
                style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black54),
              ),
            ],
          ),
        ),
      );
    }

    if (_shop == null) {
      return Scaffold(
        backgroundColor: Colors.grey[50],
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.store_mall_directory_outlined, size: 64, color: Colors.grey),
                const SizedBox(height: 16),
                Text(
                  _errorMessage ?? 'স্টোর খুঁজে পাওয়া যায়নি!',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black87),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                const Text(
                  'দয়া করে ইন্টারনেট কানেকশন চেক করে পুনরায় চেষ্টা করুন।',
                  style: TextStyle(fontSize: 12, color: Colors.grey),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 20),
                ElevatedButton.icon(
                  onPressed: _loadStoreData,
                  icon: const Icon(Icons.refresh),
                  label: const Text('আবার চেষ্টা করুন (Retry)'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF9333EA),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final themeColor = HexColor.fromHex(_shop!.primaryColorHex);
    final cart = context.watch<CartProvider>();

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        centerTitle: true,
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (_shop!.logoUrl.isNotEmpty)
              CachedNetworkImage(
                imageUrl: _shop!.logoUrl,
                height: 32,
                placeholder: (context, url) => const SizedBox(width: 32),
                errorWidget: (context, url, error) => const Icon(Icons.store),
              ),
            const SizedBox(width: 8),
            Text(
              _shop!.name,
              style: const TextStyle(color: Colors.black87, fontWeight: FontWeight.bold, fontSize: 16),
            ),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _loadStoreData,
        child: Column(
          children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'পণ্য খুঁজুন...',
                prefixIcon: const Icon(Icons.search),
                filled: true,
                fillColor: Colors.white,
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(30),
                  borderSide: BorderSide.none,
                ),
              ),
              onChanged: (val) {
                _searchQuery = val;
                _filterProducts();
              },
            ),
          ),

          // Categories Tabs Bar
          if (_categories.isNotEmpty)
            Container(
              height: 45,
              margin: const EdgeInsets.only(bottom: 8),
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                children: [
                  _buildCategoryChip('all', 'সব প্রোডাক্ট', themeColor),
                  ..._categories.map((c) => _buildCategoryChip(c.id, c.name, themeColor)),
                ],
              ),
            ),

          // Products Catalog Grid
          Expanded(
            child: _filteredProducts.isEmpty
                ? const Center(child: Text('কোনো প্রোডাক্ট পাওয়া যায়নি।'))
                : GridView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.72,
                      crossAxisSpacing: 10,
                      mainAxisSpacing: 10,
                    ),
                    itemCount: _filteredProducts.length,
                    itemBuilder: (context, index) {
                      final product = _filteredProducts[index];
                      return _buildProductCard(product, themeColor);
                    },
                  ),
          ),
        ],
      ),
    ),
      // Floating Shopping Cart Bubble
      floatingActionButton: cart.itemCount > 0
          ? FloatingActionButton.extended(
              onPressed: () => _openCartBottomSheet(context, themeColor),
              backgroundColor: themeColor,
              icon: const Icon(Icons.shopping_cart, color: Colors.white),
              label: Text(
                '${cart.itemCount} টি প্রোডাক্ট | ৳${cart.subtotalAmount.toStringAsFixed(0)}',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
            )
          : null,
    );
  }

  Widget _buildCategoryChip(String id, String label, Color themeColor) {
    final isSelected = _selectedCategoryId == id;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedCategoryId = id;
          _filterProducts();
        });
      },
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? themeColor : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? themeColor : Colors.grey[200]!),
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              color: isSelected ? Colors.white : Colors.black87,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildProductCard(Product product, Color themeColor) {
    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => ProductDetailView(product: product, shop: _shop!),
          ),
        );
      },
      child: Card(
        color: Colors.white,
        elevation: 0.5,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Product Image
            Expanded(
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(10)),
                child: CachedNetworkImage(
                  imageUrl: product.images.isNotEmpty ? product.images.first : '',
                  width: double.infinity,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => Container(color: Colors.grey[100]),
                  errorWidget: (context, url, error) => Container(
                    color: Colors.grey[100],
                    child: const Icon(Icons.broken_image, color: Colors.grey),
                  ),
                ),
              ),
            ),
            // Title & Pricing
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text(
                        '৳${product.price.toStringAsFixed(0)}',
                        style: TextStyle(fontWeight: FontWeight.bold, color: themeColor, fontSize: 14),
                      ),
                      if (product.originalPrice > product.price) ...[
                        const SizedBox(width: 6),
                        Text(
                          '৳${product.originalPrice.toStringAsFixed(0)}',
                          style: const TextStyle(
                            fontSize: 11,
                            color: Colors.grey,
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 6),
                  // Add Button
                  SizedBox(
                    width: double.infinity,
                    height: 28,
                    child: ElevatedButton(
                      onPressed: () {
                        context.read<CartProvider>().addItem(product);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('${product.name} কার্টে যোগ করা হয়েছে।'),
                            duration: const Duration(milliseconds: 500),
                            backgroundColor: themeColor,
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: themeColor,
                        padding: EdgeInsets.zero,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                      ),
                      child: const Text(
                        'অর্ডার করুন',
                        style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _openCartBottomSheet(BuildContext context, Color themeColor) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return Consumer<CartProvider>(
          builder: (context, cart, child) {
            return Container(
              padding: const EdgeInsets.all(16),
              height: 450,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'শপিং কার্ট (Shopping Cart)',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      IconButton(
                        onPressed: () => Navigator.of(ctx).pop(),
                        icon: const Icon(Icons.close),
                      ),
                    ],
                  ),
                  const Divider(),
                  Expanded(
                    child: cart.items.isEmpty
                        ? const Center(child: Text('আপনার কার্টটি খালি!'))
                        : ListView.builder(
                            itemCount: cart.items.length,
                            itemBuilder: (c, index) {
                              final item = cart.items[index];
                              return ListTile(
                                leading: item.product.images.isNotEmpty
                                    ? Image.network(item.product.images.first, width: 40, height: 40, fit: BoxFit.cover)
                                    : const Icon(Icons.image),
                                title: Text(item.product.name, maxLines: 1, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                subtitle: Text(
                                  '৳${item.product.price.toStringAsFixed(0)} ${item.selectedSize.isNotEmpty ? " | Size: " + item.selectedSize : ""}',
                                  style: TextStyle(color: themeColor, fontSize: 12),
                                ),
                                trailing: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    IconButton(
                                      onPressed: () => cart.updateQuantity(item, item.quantity - 1),
                                      icon: const Icon(Icons.remove_circle_outline, size: 20),
                                    ),
                                    Text('${item.quantity}', style: const TextStyle(fontWeight: FontWeight.bold)),
                                    IconButton(
                                      onPressed: () => cart.updateQuantity(item, item.quantity + 1),
                                      icon: const Icon(Icons.add_circle_outline, size: 20),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                  ),
                  const Divider(),
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('সর্বমোট (Subtotal):', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                        Text('৳${cart.subtotalAmount.toStringAsFixed(2)}', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: themeColor)),
                      ],
                    ),
                  ),
                  if (cart.items.isNotEmpty)
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.of(ctx).pop();
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (context) => CheckoutView(shop: _shop!),
                            ),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: themeColor,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        child: const Text('চেকআউট করতে এগিয়ে যান', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                      ),
                    ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}

// HSL Hex parser fallback inside file
class HexColor {
  static Color fromHex(String hexString) {
    final buffer = StringBuffer();
    if (hexString.length == 6 || hexString.length == 7) buffer.write('ff');
    buffer.write(hexString.replaceFirst('#', ''));
    return Color(int.parse(buffer.toString(), radix: 16));
  }
}
