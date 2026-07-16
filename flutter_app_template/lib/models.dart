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
    // Read delivery configuration safely
    final delivery = data['deliveryConfig'] ?? {};
    return Shop(
      id: docId,
      name: data['shopName'] ?? data['name'] ?? 'My Store',
      slogan: data['slogan'] ?? '',
      logoUrl: data['logoUrl'] ?? data['logo'] ?? '',
      primaryColorHex: data['primaryColor'] ?? data['primaryColorHex'] ?? '#9333ea',
      deliveryInsideDhaka: double.tryParse(delivery['insideDhaka']?.toString() ?? '80') ?? 80,
      deliveryOutsideDhaka: double.tryParse(delivery['outsideDhaka']?.toString() ?? '150') ?? 150,
      contactPhone: delivery['contactPhone'] ?? data['phone'] ?? '',
      contactEmail: delivery['contactEmail'] ?? data['email'] ?? '',
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
      name: data['name'] ?? '',
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
    // Parse list arrays safely
    final imgs = List<String>.from(data['images'] ?? []);
    if (imgs.isEmpty && data['imageUrl'] != null) {
      imgs.add(data['imageUrl']);
    }
    return Product(
      id: docId,
      name: data['title'] ?? data['name'] ?? '',
      description: data['description'] ?? '',
      price: double.tryParse(data['price']?.toString() ?? '0') ?? 0,
      originalPrice: double.tryParse(data['originalPrice']?.toString() ?? '0') ?? 0,
      images: imgs,
      sizes: List<String>.from(data['sizes'] ?? []),
      colors: List<String>.from(data['colors'] ?? []),
      categoryId: data['category'] ?? data['categoryId'] ?? '',
      inStock: data['inStock'] ?? true,
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
