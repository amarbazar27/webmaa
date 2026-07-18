import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:url_launcher/url_launcher.dart';
import 'models.dart';
import 'database_service.dart';
import 'cart_provider.dart';
import 'product_detail_view.dart';
import 'checkout_view.dart';
import 'web_shop_view.dart';

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
  final TextEditingController _searchController = TextEditingController();

  Shop? _shop;
  List<Category> _categories = [];
  List<Product> _products = [];
  List<Product> _filteredProducts = [];

  bool _isLoading = true;
  String _selectedCategoryId = 'all';
  String _selectedSubcategory = 'all';
  String _searchQuery = '';
  int _currentBottomNavIndex = 0;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadStoreData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
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
    final query = _searchQuery.trim().toLowerCase();

    setState(() {
      _filteredProducts = _products.where((p) {
        // 1. Category Matching
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

        // 2. Subcategory Matching
        bool matchesSubcategory = _selectedSubcategory == 'all';
        if (!matchesSubcategory && p.subcategory.isNotEmpty) {
          matchesSubcategory = p.subcategory.trim().toLowerCase() == _selectedSubcategory.trim().toLowerCase();
        }

        // 3. Search Query Matching (Name, Description, Category, Subcategory)
        bool matchesSearch = query.isEmpty;
        if (!matchesSearch) {
          final nameMatch = p.name.toLowerCase().contains(query);
          final descMatch = p.description.toLowerCase().contains(query);
          final catMatch = p.categoryId.toLowerCase().contains(query);
          final subcatMatch = p.subcategory.toLowerCase().contains(query);
          matchesSearch = nameMatch || descMatch || catMatch || subcatMatch;
        }

        return matchesCategory && matchesSubcategory && matchesSearch;
      }).toList();
    });
  }

  // Get active subcategories for current selected category
  List<String> get _currentSubcategories {
    if (_selectedCategoryId == 'all') return [];
    final catObj = _categories.firstWhere(
      (c) => c.id == _selectedCategoryId || c.name == _selectedCategoryId,
      orElse: () => Category(id: '', name: '', icon: ''),
    );
    return catObj.subcategories;
  }

  void _launchWhatsApp(String message) async {
    final phone = _shop?.whatsappPhone.isNotEmpty == true ? _shop!.whatsappPhone : _shop?.contactPhone ?? '';
    if (phone.isEmpty) return;
    final cleanPhone = phone.replaceAll(RegExp(r'[^0-9+]'), '');
    final uri = Uri.parse("https://wa.me/$cleanPhone?text=${Uri.encodeComponent(message)}");
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
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
        actions: [
          IconButton(
            icon: const Icon(Icons.shopping_bag_outlined, color: Colors.black87),
            onPressed: () => _openCartBottomSheet(context, themeColor),
          ),
        ],
      ),
      body: IndexedStack(
        index: _currentBottomNavIndex,
        children: [
          // Tab 0: Native Storefront Catalog
          _buildNativeStorefront(themeColor, cart),

          // Tab 1: Embedded Web Shop (100% Website Features)
          WebShopView(url: _shop!.targetUrl, title: '${_shop!.name} (ফুল ওয়েবসাইট)'),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentBottomNavIndex,
        selectedItemColor: themeColor,
        unselectedItemColor: Colors.grey[600],
        type: BottomNavigationBarType.fixed,
        onTap: (index) {
          if (index == 2) {
            // WhatsApp Direct Action
            _launchWhatsApp("হ্যালো! ${_shop!.name}-এর পণ্য সম্পর্কে জানতে চাই।");
          } else if (index == 3) {
            // Open Cart Bottom Sheet directly
            _openCartBottomSheet(context, themeColor);
          } else {
            setState(() {
              _currentBottomNavIndex = index;
            });
          }
        },
        items: [
          const BottomNavigationBarItem(
            icon: Icon(Icons.storefront),
            label: 'স্টোর',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.language),
            label: 'ফুল শপ',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.chat_bubble_outline),
            label: 'WhatsApp',
          ),
          BottomNavigationBarItem(
            icon: Badge(
              label: Text('${cart.itemCount}'),
              isLabelVisible: cart.itemCount > 0,
              child: const Icon(Icons.shopping_cart_outlined),
            ),
            label: 'কার্ট',
          ),
        ],
      ),
      // Floating Shopping Cart Bubble
      floatingActionButton: cart.itemCount > 0 && _currentBottomNavIndex == 0
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

  Widget _buildNativeStorefront(Color themeColor, CartProvider cart) {
    final subcats = _currentSubcategories;

    return RefreshIndicator(
      onRefresh: _loadStoreData,
      child: Column(
        children: [
          // Banner / Announcement Notice
          if (_shop!.notice.isNotEmpty)
            Container(
              width: double.infinity,
              color: themeColor.withOpacity(0.08),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Row(
                children: [
                  Icon(Icons.campaign, size: 18, color: themeColor),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _shop!.notice,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: themeColor),
                    ),
                  ),
                ],
              ),
            ),

          // Search Bar with Clear Icon (X)
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'পণ্য, ক্যাটাগরি বা বিবরণ লিখে খুঁজুন...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 20),
                        onPressed: () {
                          _searchController.clear();
                          setState(() {
                            _searchQuery = '';
                          });
                          _filterProducts();
                        },
                      )
                    : null,
                filled: true,
                fillColor: Colors.white,
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(30),
                  borderSide: BorderSide.none,
                ),
              ),
              onChanged: (val) {
                setState(() {
                  _searchQuery = val;
                });
                _filterProducts();
              },
            ),
          ),

          // Main Categories Tabs Bar
          if (_categories.isNotEmpty)
            Container(
              height: 42,
              margin: const EdgeInsets.only(bottom: 6),
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                children: [
                  _buildCategoryChip('all', 'সব প্রোডাক্ট', themeColor),
                  ..._categories.map((c) => _buildCategoryChip(c.id, c.name, themeColor)),
                ],
              ),
            ),

          // Subcategories Chips Bar (If selected category has subcategories)
          if (subcats.isNotEmpty)
            Container(
              height: 34,
              margin: const EdgeInsets.only(bottom: 8),
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                children: [
                  _buildSubcategoryChip('all', 'সব সাব-ক্যাটাগরি', themeColor),
                  ...subcats.map((sub) => _buildSubcategoryChip(sub, sub, themeColor)),
                ],
              ),
            ),

          // Banner Carousel / Image header if available
          if (_shop!.bannerUrls.isNotEmpty && _selectedCategoryId == 'all' && _searchQuery.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 4.0),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: CachedNetworkImage(
                  imageUrl: _shop!.bannerUrls.first,
                  height: 140,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => Container(height: 140, color: Colors.grey[200]),
                  errorWidget: (context, url, error) => const SizedBox.shrink(),
                ),
              ),
            ),

          // Products Catalog Grid
          Expanded(
            child: _filteredProducts.isEmpty
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.search_off, size: 50, color: Colors.grey[400]),
                          const SizedBox(height: 12),
                          const Text(
                            'কোনো প্রোডাক্ট পাওয়া যায়নি।',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                          ),
                          if (_searchQuery.isNotEmpty) ...[
                            const SizedBox(height: 6),
                            Text(
                              '"$_searchQuery"-এর সাথে মেলে এমন কোনো পণ্য পাওয়া যায়নি।',
                              style: const TextStyle(fontSize: 12, color: Colors.grey),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 16),
                            ElevatedButton(
                              onPressed: () {
                                _searchController.clear();
                                setState(() {
                                  _searchQuery = '';
                                  _selectedCategoryId = 'all';
                                  _selectedSubcategory = 'all';
                                });
                                _filterProducts();
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: themeColor,
                                foregroundColor: Colors.white,
                              ),
                              child: const Text('সব ফিল্টার ক্লিয়ার করুন'),
                            ),
                          ],
                        ],
                      ),
                    ),
                  )
                : GridView.builder(
                    padding: const EdgeInsets.all(12),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.66,
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
    );
  }

  Widget _buildCategoryChip(String id, String label, Color themeColor) {
    final isSelected = _selectedCategoryId == id;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedCategoryId = id;
          _selectedSubcategory = 'all';
        });
        _filterProducts();
      },
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
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

  Widget _buildSubcategoryChip(String id, String label, Color themeColor) {
    final isSelected = _selectedSubcategory == id;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedSubcategory = id;
        });
        _filterProducts();
      },
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 3),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? themeColor.withOpacity(0.15) : Colors.white,
          borderRadius: BorderRadius.circular(15),
          border: Border.all(color: isSelected ? themeColor : Colors.grey[300]!),
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              color: isSelected ? themeColor : Colors.black54,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              fontSize: 11,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildProductCard(Product product, Color themeColor) {
    final hasDiscount = product.originalPrice > product.price;
    final discountPercent = hasDiscount
        ? (((product.originalPrice - product.price) / product.originalPrice) * 100).round()
        : 0;

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
        child: Stack(
          children: [
            Column(
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
                      if (product.subcategory.isNotEmpty)
                        Text(
                          product.subcategory,
                          style: TextStyle(fontSize: 9, color: themeColor, fontWeight: FontWeight.bold),
                        ),
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
                          if (hasDiscount) ...[
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
                                duration: const Duration(milliseconds: 600),
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
            // Discount Tag
            if (hasDiscount && discountPercent > 0)
              Positioned(
                top: 6,
                left: 6,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.red,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    '-$discountPercent%',
                    style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                  ),
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

class HexColor {
  static Color fromHex(String hexString) {
    final buffer = StringBuffer();
    if (hexString.length == 6 || hexString.length == 7) buffer.write('ff');
    buffer.write(hexString.replaceFirst('#', ''));
    return Color(int.parse(buffer.toString(), radix: 16));
  }
}
