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
  });

  factory Shop.fromFirestore(String docId, Map<String, dynamic> data) {
    // Read nested sub-maps safely
    final delivery = data['deliveryConfig'] is Map ? data['deliveryConfig'] : {};
    final design = data['designOverrides'] is Map ? data['designOverrides'] : {};
    final appCfg = data['appConfig'] is Map ? data['appConfig'] : {};

    String primaryColor = design['primaryColor'] ?? data['primaryColor'] ?? data['primaryColorHex'] ?? '#9333ea';
    if (!primaryColor.startsWith('#')) primaryColor = '#$primaryColor';

    return Shop(
      id: docId,
      name: appCfg['appName'] ?? data['shopName'] ?? data['name'] ?? 'My Store',
      slogan: data['slogan'] ?? data['tagline'] ?? '',
      logoUrl: appCfg['logoUrl'] ?? data['logoUrl'] ?? data['logo'] ?? '',
      primaryColorHex: primaryColor,
      deliveryInsideDhaka: double.tryParse(delivery['insideDhaka']?.toString() ?? delivery['inside']?.toString() ?? data['deliveryInsideDhaka']?.toString() ?? '80') ?? 80,
      deliveryOutsideDhaka: double.tryParse(delivery['outsideDhaka']?.toString() ?? delivery['outside']?.toString() ?? data['deliveryOutsideDhaka']?.toString() ?? '150') ?? 150,
      contactPhone: delivery['contactPhone'] ?? data['phone'] ?? data['contactPhone'] ?? data['ownerPhone'] ?? '',
      contactEmail: delivery['contactEmail'] ?? data['email'] ?? data['contactEmail'] ?? data['ownerEmail'] ?? '',
      uddoktapayUrl: data['uddoktapayUrl'],
      uddoktapayApiKey: data['uddoktapayApiKey'],
    );
  }
}

class Category {
  final String id;
  final String name;
  final String icon;

  Category({
    required this.id,
    required this.name,
    required this.icon,
  });

  factory Category.fromFirestore(String docId, Map<String, dynamic> data) {
    return Category(
      id: docId,
      name: data['name'] ?? data['title'] ?? data['categoryName'] ?? 'Category',
      icon: data['icon'] ?? '',
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
  final bool inStock;

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
    required this.inStock,
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
    bool inStockBool = true;
    if (inStockVal is bool) {
      inStockBool = inStockVal;
    } else if (stockVal != null) {
      final stockNum = int.tryParse(stockVal.toString()) ?? 1;
      inStockBool = stockNum > 0;
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
      inStock: inStockBool,
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
