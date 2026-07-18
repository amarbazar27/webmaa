class Shop {
  final String id;
  final String name;
  final String slogan;
  final String logoUrl;
  final String primaryColorHex;
  final double deliveryInsideDhaka;
  final double deliveryOutsideDhaka;
  final String contactPhone;
  final String contactEmail;
  final String? uddoktapayUrl;
  final String? uddoktapayApiKey;
  final List<String> bannerUrls;
  final String notice;
  final String whatsappPhone;
  final String targetUrl;

  Shop({
    required this.id,
    required this.name,
    required this.slogan,
    required this.logoUrl,
    required this.primaryColorHex,
    required this.deliveryInsideDhaka,
    required this.deliveryOutsideDhaka,
    required this.contactPhone,
    required this.contactEmail,
    this.uddoktapayUrl,
    this.uddoktapayApiKey,
    this.bannerUrls = const [],
    this.notice = '',
    this.whatsappPhone = '',
    this.targetUrl = '',
  });

  factory Shop.fromFirestore(String docId, Map<String, dynamic> data) {
    // Read nested sub-maps safely
    final delivery = data['deliveryConfig'] is Map ? data['deliveryConfig'] : {};
    final design = data['designOverrides'] is Map ? data['designOverrides'] : {};
    final appCfg = data['appConfig'] is Map ? data['appConfig'] : {};
    final social = data['socialLinks'] is Map ? data['socialLinks'] : {};

    String primaryColor = design['primaryColor'] ?? data['primaryColor'] ?? data['primaryColorHex'] ?? '#9333ea';
    if (!primaryColor.startsWith('#')) primaryColor = '#$primaryColor';

    List<String> bannersList = [];
    if (data['banners'] is List) {
      for (var b in data['banners']) {
        if (b is Map && b['url'] != null && b['url'].toString().isNotEmpty) {
          bannersList.add(b['url'].toString());
        } else if (b is String && b.isNotEmpty) {
          bannersList.add(b);
        }
      }
    }
    if (bannersList.isEmpty && data['coverImg'] != null && data['coverImg'].toString().isNotEmpty) {
      bannersList.add(data['coverImg'].toString());
    }

    final subSlug = data['subdomainSlug'] ?? data['shopSlug'] ?? docId;
    final domain = data['customDomain'] ?? '';
    final fullUrl = domain.isNotEmpty ? 'https://$domain' : 'https://bdretailers.com/shop/$subSlug';

    return Shop(
      id: docId,
      name: appCfg['appName'] ?? data['shopName'] ?? data['name'] ?? 'My Store',
      slogan: data['slogan'] ?? data['tagline'] ?? '',
      logoUrl: appCfg['logoUrl'] ?? data['logoUrl'] ?? data['logo'] ?? '',
      primaryColorHex: primaryColor,
      deliveryInsideDhaka: double.tryParse(delivery['insideDhaka']?.toString() ?? delivery['inside']?.toString() ?? data['deliveryInsideDhaka']?.toString() ?? '80') ?? 80,
      deliveryOutsideDhaka: double.tryParse(delivery['outsideDhaka']?.toString() ?? delivery['outside']?.toString() ?? data['deliveryOutsideDhaka']?.toString() ?? '150') ?? 150,
      contactPhone: delivery['methods'] ?? delivery['contactPhone'] ?? data['phone'] ?? data['contactPhone'] ?? data['ownerPhone'] ?? '',
      contactEmail: delivery['contactEmail'] ?? data['email'] ?? data['contactEmail'] ?? data['ownerEmail'] ?? '',
      uddoktapayUrl: data['uddoktapayUrl'],
      uddoktapayApiKey: data['uddoktapayApiKey'],
      bannerUrls: bannersList,
      notice: data['notices'] ?? data['notice'] ?? data['welcomeMessage'] ?? '',
      whatsappPhone: social['wa'] ?? delivery['methods'] ?? data['phone'] ?? '',
      targetUrl: fullUrl,
    );
  }
}

class Category {
  final String id;
  final String name;
  final String icon;
  final List<String> subcategories;

  Category({
    required this.id,
    required this.name,
    required this.icon,
    this.subcategories = const [],
  });

  factory Category.fromFirestore(String docId, Map<String, dynamic> data) {
    return Category(
      id: docId,
      name: data['name'] ?? data['title'] ?? data['categoryName'] ?? 'Category',
      icon: data['icon'] ?? '',
      subcategories: List<String>.from(data['subcategories'] ?? []),
    );
  }
}

class Product {
  final String id;
  final String name;
  final String description;
  final double price;
  final double originalPrice;
  final List<String> images;
  final List<String> sizes;
  final List<String> colors;
  final String categoryId;
  final String subcategory;
  final bool inStock;
  final double stock;

  Product({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.originalPrice,
    required this.images,
    required this.sizes,
    required this.colors,
    required this.categoryId,
    this.subcategory = '',
    required this.inStock,
    this.stock = 1,
  });

  factory Product.fromFirestore(String docId, Map<String, dynamic> data) {
    final imgs = List<String>.from(data['images'] ?? []);
    if (imgs.isEmpty && data['imageUrl'] != null && data['imageUrl'].toString().isNotEmpty) {
      imgs.add(data['imageUrl'].toString());
    }
    if (imgs.isEmpty && data['image'] != null && data['image'].toString().isNotEmpty) {
      imgs.add(data['image'].toString());
    }

    final price = double.tryParse(data['price']?.toString() ?? '0') ?? 0;
    final origPrice = double.tryParse(data['originalPrice']?.toString() ?? data['regularPrice']?.toString() ?? '0') ?? price;

    final inStockVal = data['inStock'];
    final stockVal = data['stock'];
    double stockNum = 1.0;
    bool inStockBool = true;
    if (stockVal != null) {
      stockNum = double.tryParse(stockVal.toString()) ?? 1.0;
    }
    if (inStockVal is bool) {
      inStockBool = inStockVal;
    } else {
      inStockBool = stockNum > 0;
    }
    if (data['isHidden'] == true) {
      inStockBool = false;
    }

    return Product(
      id: docId,
      name: data['title'] ?? data['name'] ?? 'Untitled Product',
      description: data['description'] ?? '',
      price: price,
      originalPrice: origPrice,
      images: imgs,
      sizes: List<String>.from(data['sizes'] ?? []),
      colors: List<String>.from(data['colors'] ?? []),
      categoryId: data['category'] ?? data['categoryId'] ?? data['categoryName'] ?? '',
      subcategory: data['subcategory'] ?? data['subCategory'] ?? '',
      inStock: inStockBool,
      stock: stockNum,
    );
  }
}

class CartItem {
  final Product product;
  final String selectedSize;
  final String selectedColor;
  int quantity;

  CartItem({
    required this.product,
    this.selectedSize = '',
    this.selectedColor = '',
    this.quantity = 1,
  });

  double get totalPrice => product.price * quantity;
}
