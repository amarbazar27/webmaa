import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:share_plus/share_plus.dart';
import 'models.dart';
import 'database_service.dart';
import 'cart_provider.dart';
import 'product_detail_view.dart';
import 'checkout_view.dart';
import 'order_tracking_view.dart';
import 'theme.dart';
import 'config.dart';

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
  final ScrollController _scrollController = ScrollController();

  Shop? _shop;
  List<Category> _categories = [];
  List<Product> _products = [];
  bool _isLoading = true;
  String? _errorMessage;

  String _selectedCategoryId = 'all';
  String _selectedSubcategory = 'all';
  String _searchQuery = '';
  int _currentTab = 0;

  // Banner carousel
  final PageController _bannerController = PageController();
  int _currentBannerIndex = 0;

  @override
  void initState() {
    super.initState();
    _loadStoreData();
    _startBannerAutoScroll();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    _bannerController.dispose();
    super.dispose();
  }

  void _startBannerAutoScroll() {
    Future.delayed(const Duration(seconds: 4), () {
      if (!mounted || _shop == null || _shop!.bannerUrls.length <= 1) return;
      if (_bannerController.hasClients) {
        final nextPage = (_currentBannerIndex + 1) % _shop!.bannerUrls.length;
        _bannerController.animateToPage(
          nextPage,
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeInOut,
        );
      }
      _startBannerAutoScroll();
    });
  }

  Future<void> _loadStoreData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final shop = await _db.getShop(widget.shopId);
      if (shop != null) {
        final results = await Future.wait([
          _db.getCategories(shop.id),
          _db.getProducts(shop.id),
        ]);
        if (mounted) {
          setState(() {
            _shop = shop;
            _categories = results[0] as List<Category>;
            _products = results[1] as List<Product>;
            _isLoading = false;
          });
        }
      } else {
        if (mounted) {
          setState(() {
            _isLoading = false;
            _errorMessage = 'স্টোর খুঁজে পাওয়া যায়নি! (ID: ${widget.shopId})';
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'নেটওয়ার্ক বা ডাটাবেজ কানেকশনে সমস্যা হয়েছে।';
        });
      }
    }
  }

  List<Product> get _filteredProducts {
    final query = _searchQuery.trim().toLowerCase();
    return _products.where((p) {
      // Category match
      bool matchCat = _selectedCategoryId == 'all';
      if (!matchCat) {
        final pCat = p.categoryId.trim().toLowerCase();
        final sel = _selectedCategoryId.trim().toLowerCase();
        matchCat = pCat == sel;
        if (!matchCat) {
          for (final c in _categories) {
            if ((c.id.trim().toLowerCase() == sel || c.name.trim().toLowerCase() == sel) &&
                (pCat == c.id.trim().toLowerCase() || pCat == c.name.trim().toLowerCase())) {
              matchCat = true;
              break;
            }
          }
        }
      }

      // Subcategory match
      bool matchSub = _selectedSubcategory == 'all';
      if (!matchSub && p.subcategory.isNotEmpty) {
        matchSub = p.subcategory.trim().toLowerCase() == _selectedSubcategory.trim().toLowerCase();
      }

      // Search match
      bool matchSearch = query.isEmpty;
      if (!matchSearch) {
        matchSearch = p.name.toLowerCase().contains(query) ||
            p.description.toLowerCase().contains(query) ||
            p.categoryId.toLowerCase().contains(query) ||
            p.subcategory.toLowerCase().contains(query);
      }

      return matchCat && matchSub && matchSearch;
    }).toList();
  }

  List<String> get _currentSubcategories {
    if (_selectedCategoryId == 'all') return [];
    final catObj = _categories.firstWhere(
      (c) => c.id == _selectedCategoryId || c.name == _selectedCategoryId,
      orElse: () => Category(id: '', name: '', icon: ''),
    );
    return catObj.subcategories;
  }

  void _launchWhatsApp() async {
    final phone = _shop?.whatsappPhone.isNotEmpty == true
        ? _shop!.whatsappPhone
        : _shop?.contactPhone ?? '';
    if (phone.isEmpty) return;
    final cleanPhone = phone.replaceAll(RegExp(r'[^0-9+]'), '');
    final msg = 'হ্যালো! ${_shop!.name}-এর পণ্য সম্পর্কে জানতে চাই।';
    final uri = Uri.parse('https://wa.me/$cleanPhone?text=${Uri.encodeComponent(msg)}');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  // ─── BUILD ─────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).primaryColor;
    final cart = context.watch<CartProvider>();

    return Scaffold(
      appBar: _buildAppBar(primary, cart),
      body: IndexedStack(
        index: _currentTab,
        children: [
          _buildHomeTab(primary),
          _buildCartTab(primary, cart),
          OrderTrackingView(shopId: _shop?.id ?? widget.shopId),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentTab,
        selectedItemColor: primary,
        unselectedItemColor: Colors.grey[600],
        type: BottomNavigationBarType.fixed,
        onTap: (i) => setState(() => _currentTab = i),
        items: [
          const BottomNavigationBarItem(
            icon: Icon(Icons.storefront),
            label: 'হোম',
          ),
          BottomNavigationBarItem(
            icon: Badge(
              label: Text('${cart.itemCount}'),
              isLabelVisible: cart.itemCount > 0,
              child: const Icon(Icons.shopping_cart_outlined),
            ),
            label: 'কার্ট',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.local_shipping_outlined),
            label: 'অর্ডার',
          ),
        ],
      ),
      floatingActionButton: _currentTab == 0 && _shop != null && _shop!.whatsappPhone.isNotEmpty
          ? FloatingActionButton(
              onPressed: _launchWhatsApp,
              backgroundColor: const Color(0xFF25D366),
              child: const Icon(Icons.chat, color: Colors.white),
            )
          : null,
    );
  }

  PreferredSizeWidget _buildAppBar(Color primary, CartProvider cart) {
    switch (_currentTab) {
      case 1:
        return AppBar(
          title: Text('কার্ট (${cart.itemCount} টি পণ্য)'),
          actions: [
            if (cart.items.isNotEmpty)
              IconButton(
                icon: const Icon(Icons.delete_outline),
                onPressed: () {
                  cart.clearCart();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('কার্ট খালি করা হয়েছে')),
                  );
                },
              ),
          ],
        );
      case 2:
        return AppBar(title: const Text('অর্ডার ট্র্যাকিং'));
      default:
        return AppBar(
          title: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (_shop?.logoUrl.isNotEmpty == true)
                CachedNetworkImage(
                  imageUrl: _shop!.logoUrl,
                  height: 32,
                  width: 32,
                  placeholder: (_, __) => const SizedBox(width: 32),
                  errorWidget: (_, __, ___) => const Icon(Icons.store),
                ),
              if (_shop?.logoUrl.isNotEmpty == true) const SizedBox(width: 8),
              Flexible(
                child: Text(
                  _shop?.name ?? AppConfig.appName,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
              ),
            ],
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.share_outlined),
              onPressed: () {
                if (_shop != null) {
                  Share.share('${_shop!.name}\n${_shop!.targetUrl}');
                }
              },
            ),
          ],
        );
    }
  }

  // ─── HOME TAB ──────────────────────────────────────────────────

  Widget _buildHomeTab(Color primary) {
    if (_isLoading) return _buildShimmerGrid();
    if (_errorMessage != null) return _buildErrorView(primary);

    final filtered = _filteredProducts;
    final subcats = _currentSubcategories;

    return RefreshIndicator(
      onRefresh: _loadStoreData,
      child: CustomScrollView(
        controller: _scrollController,
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          // Notice banner
          if (_shop!.notice.isNotEmpty)
            SliverToBoxAdapter(child: _buildNotice(primary)),

          // Search bar
          SliverToBoxAdapter(child: _buildSearchBar()),

          // Category chips
          if (_categories.isNotEmpty)
            SliverToBoxAdapter(child: _buildCategoryChips(primary)),

          // Subcategory chips
          if (subcats.isNotEmpty)
            SliverToBoxAdapter(child: _buildSubcategoryChips(subcats, primary)),

          // Banner carousel
          if (_shop!.bannerUrls.isNotEmpty &&
              _selectedCategoryId == 'all' &&
              _searchQuery.isEmpty)
            SliverToBoxAdapter(child: _buildBannerCarousel()),

          // Product count header
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
              child: Text(
                '${filtered.length} টি পণ্য',
                style: TextStyle(fontSize: 12, color: Colors.grey[600]),
              ),
            ),
          ),

          // Product grid or empty state
          if (filtered.isEmpty)
            SliverFillRemaining(child: _buildEmptyProducts(primary))
          else
            SliverPadding(
              padding: const EdgeInsets.all(12),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  childAspectRatio: 0.66,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                ),
                delegate: SliverChildBuilderDelegate(
                  (ctx, i) => _buildProductCard(filtered[i], primary),
                  childCount: filtered.length,
                ),
              ),
            ),

          // Bottom padding
          const SliverToBoxAdapter(child: SizedBox(height: 80)),
        ],
      ),
    );
  }

  Widget _buildShimmerGrid() {
    return GridView.builder(
      padding: const EdgeInsets.all(12),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.66,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
      ),
      itemCount: 6,
      itemBuilder: (_, __) => const ProductCardSkeleton(),
    );
  }

  Widget _buildErrorView(Color primary) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.store_mall_directory_outlined, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            Text(
              _errorMessage ?? 'স্টোর খুঁজে পাওয়া যায়নি!',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            const Text(
              'দয়া করে ইন্টারনেট কানেকশন চেক করে পুনরায় চেষ্টা করুন।',
              style: TextStyle(fontSize: 12, color: Colors.grey),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: _loadStoreData,
              icon: const Icon(Icons.refresh),
              label: const Text('আবার চেষ্টা করুন'),
              style: ElevatedButton.styleFrom(
                backgroundColor: primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNotice(Color primary) {
    return Container(
      width: double.infinity,
      color: primary.withOpacity(0.08),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        children: [
          Icon(Icons.campaign, size: 18, color: primary),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              _shop!.notice,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: primary),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.all(12),
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
                    setState(() => _searchQuery = '');
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
        onChanged: (val) => setState(() => _searchQuery = val),
      ),
    );
  }

  Widget _buildCategoryChips(Color primary) {
    return Container(
      height: 42,
      margin: const EdgeInsets.only(bottom: 6),
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        children: [
          _chip('all', 'সব প্রোডাক্ট', _selectedCategoryId == 'all', primary, () {
            setState(() {
              _selectedCategoryId = 'all';
              _selectedSubcategory = 'all';
            });
          }),
          ..._categories.map((c) => _chip(
                c.id,
                c.name,
                _selectedCategoryId == c.id,
                primary,
                () {
                  setState(() {
                    _selectedCategoryId = c.id;
                    _selectedSubcategory = 'all';
                  });
                },
              )),
        ],
      ),
    );
  }

  Widget _buildSubcategoryChips(List<String> subcats, Color primary) {
    return Container(
      height: 34,
      margin: const EdgeInsets.only(bottom: 8),
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        children: [
          _chip('all', 'সব সাব-ক্যাটাগরি', _selectedSubcategory == 'all', primary, () {
            setState(() => _selectedSubcategory = 'all');
          }),
          ...subcats.map((sub) => _chip(
                sub,
                sub,
                _selectedSubcategory == sub,
                primary,
                () => setState(() => _selectedSubcategory = sub),
              )),
        ],
      ),
    );
  }

  Widget _chip(String id, String label, bool selected, Color primary, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: selected ? primary : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: selected ? primary : Colors.grey[200]!),
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              color: selected ? Colors.white : Colors.black87,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBannerCarousel() {
    final banners = _shop!.bannerUrls;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: SizedBox(
          height: 150,
          child: banners.length == 1
              ? CachedNetworkImage(
                  imageUrl: banners.first,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  placeholder: (_, __) => Container(color: Colors.grey[200]),
                  errorWidget: (_, __, ___) => const SizedBox.shrink(),
                )
              : PageView.builder(
                  controller: _bannerController,
                  itemCount: banners.length,
                  onPageChanged: (i) => setState(() => _currentBannerIndex = i),
                  itemBuilder: (_, i) => CachedNetworkImage(
                    imageUrl: banners[i],
                    width: double.infinity,
                    fit: BoxFit.cover,
                    placeholder: (_, __) => Container(color: Colors.grey[200]),
                    errorWidget: (_, __, ___) => Container(color: Colors.grey[200]),
                  ),
                ),
        ),
      ),
    );
  }

  Widget _buildEmptyProducts(Color primary) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.search_off, size: 50, color: Colors.grey[400]),
            const SizedBox(height: 12),
            const Text('কোনো প্রোডাক্ট পাওয়া যায়নি।',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            if (_searchQuery.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(
                '"$_searchQuery"-এর সাথে মেলে এমন কোনো পণ্য পাওয়া যায়নি।',
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
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: primary,
                  foregroundColor: Colors.white,
                ),
                child: const Text('সব ফিল্টার ক্লিয়ার করুন'),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildProductCard(Product product, Color primary) {
    final hasDiscount = product.originalPrice > product.price;
    final discountPercent = hasDiscount
        ? (((product.originalPrice - product.price) / product.originalPrice) * 100).round()
        : 0;

    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => ProductDetailView(product: product, shop: _shop!),
          ),
        );
      },
      child: Card(
        color: Colors.white,
        elevation: 0.5,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Product image
                Expanded(
                  child: Hero(
                    tag: 'product_${product.id}',
                    child: CachedNetworkImage(
                      imageUrl: product.images.isNotEmpty ? product.images.first : '',
                      width: double.infinity,
                      fit: BoxFit.cover,
                      placeholder: (_, __) => Container(color: Colors.grey[100]),
                      errorWidget: (_, __, ___) => Container(
                        color: Colors.grey[100],
                        child: const Icon(Icons.broken_image, color: Colors.grey),
                      ),
                    ),
                  ),
                ),
                // Title & pricing
                Padding(
                  padding: const EdgeInsets.all(8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (product.subcategory.isNotEmpty)
                        Text(
                          product.subcategory,
                          style: TextStyle(fontSize: 9, color: primary, fontWeight: FontWeight.bold),
                        ),
                      Text(
                        product.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Text(
                            '৳${product.price.toStringAsFixed(0)}',
                            style: TextStyle(fontWeight: FontWeight.bold, color: primary, fontSize: 14),
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
                      SizedBox(
                        width: double.infinity,
                        height: 28,
                        child: ElevatedButton(
                          onPressed: () {
                            context.read<CartProvider>().addItem(product);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('${product.name} কার্টে যোগ করা হয়েছে'),
                                duration: const Duration(milliseconds: 600),
                                backgroundColor: primary,
                              ),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: primary,
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
            // Discount badge
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
            // Out of stock overlay
            if (!product.inStock || product.stock <= 0)
              Positioned.fill(
                child: Container(
                  color: Colors.white60,
                  child: const Center(
                    child: Text('স্টক আউট', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red)),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  // ─── CART TAB ──────────────────────────────────────────────────

  Widget _buildCartTab(Color primary, CartProvider cart) {
    if (cart.items.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.shopping_cart_outlined, size: 64, color: Colors.grey[300]),
            const SizedBox(height: 16),
            const Text('আপনার কার্ট খালি!', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const Text('পণ্য যোগ করতে স্টোরে ব্রাউজ করুন', style: TextStyle(color: Colors.grey)),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => setState(() => _currentTab = 0),
              style: ElevatedButton.styleFrom(backgroundColor: primary, foregroundColor: Colors.white),
              child: const Text('শপিং করুন'),
            ),
          ],
        ),
      );
    }

    return Column(
      children: [
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: cart.items.length,
            itemBuilder: (ctx, i) {
              final item = cart.items[i];
              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: Padding(
                  padding: const EdgeInsets.all(8),
                  child: Row(
                    children: [
                      // Product image
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: item.product.images.isNotEmpty
                            ? CachedNetworkImage(
                                imageUrl: item.product.images.first,
                                width: 64,
                                height: 64,
                                fit: BoxFit.cover,
                              )
                            : Container(
                                width: 64, height: 64,
                                color: Colors.grey[200],
                                child: const Icon(Icons.image, color: Colors.grey),
                              ),
                      ),
                      const SizedBox(width: 12),
                      // Details
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.product.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '৳${item.product.price.toStringAsFixed(0)}'
                              '${item.selectedSize.isNotEmpty ? " | ${item.selectedSize}" : ""}'
                              '${item.selectedColor.isNotEmpty ? " | ${item.selectedColor}" : ""}',
                              style: TextStyle(fontSize: 12, color: primary),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '৳${item.totalPrice.toStringAsFixed(0)}',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                          ],
                        ),
                      ),
                      // Quantity controls
                      Column(
                        children: [
                          IconButton(
                            icon: const Icon(Icons.add_circle_outline, size: 22),
                            onPressed: () => cart.updateQuantity(item, item.quantity + 1),
                            constraints: const BoxConstraints(),
                            padding: const EdgeInsets.all(4),
                          ),
                          Text('${item.quantity}', style: const TextStyle(fontWeight: FontWeight.bold)),
                          IconButton(
                            icon: Icon(
                              item.quantity > 1 ? Icons.remove_circle_outline : Icons.delete_outline,
                              size: 22,
                              color: item.quantity > 1 ? null : Colors.red,
                            ),
                            onPressed: () => cart.updateQuantity(item, item.quantity - 1),
                            constraints: const BoxConstraints(),
                            padding: const EdgeInsets.all(4),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),

        // Total + Checkout bottom bar
        Container(
          padding: const EdgeInsets.all(16),
          decoration: const BoxDecoration(
            color: Colors.white,
            boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, -2))],
          ),
          child: SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('সর্বমোট:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    Text(
                      '৳${cart.subtotalAmount.toStringAsFixed(0)}',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: primary),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _shop != null
                        ? () => Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => CheckoutView(shop: _shop!)),
                            )
                        : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: const Text(
                      'চেকআউট করুন',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
