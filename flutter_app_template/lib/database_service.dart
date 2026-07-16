import 'package:cloud_firestore/cloud_firestore.dart';
import 'models.dart';

class DatabaseService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  // Fetch shop metadata by ID
  Future<Shop?> getShop(String shopId) async {
    try {
      final doc = await _db.collection('shops').doc(shopId).get();
      if (doc.exists && doc.data() != null) {
        return Shop.fromFirestore(doc.id, doc.data()!);
      }
    } catch (e) {
      print('Error fetching shop: $e');
    }
    return null;
  }

  // Fetch all shops for marketplace directory view
  Future<List<Shop>> getAllShops() async {
    try {
      final snapshot = await _db.collection('shops').get();
      return snapshot.docs
          .map((doc) => Shop.fromFirestore(doc.id, doc.data()))
          .toList();
    } catch (e) {
      print('Error fetching shops: $e');
      return [];
    }
  }

  // Fetch categories for a specific shop
  Future<List<Category>> getCategories(String shopId) async {
    try {
      final snapshot = await _db
          .collection('shops')
          .doc(shopId)
          .collection('categories')
          .get();
      return snapshot.docs
          .map((doc) => Category.fromFirestore(doc.id, doc.data()))
          .toList();
    } catch (e) {
      print('Error fetching categories: $e');
      return [];
    }
  }

  // Fetch products for a specific shop
  Future<List<Product>> getProducts(String shopId) async {
    try {
      final snapshot = await _db
          .collection('shops')
          .doc(shopId)
          .collection('products')
          .where('inStock', isEqualTo: true)
          .get();
      return snapshot.docs
          .map((doc) => Product.fromFirestore(doc.id, doc.data()))
          .toList();
    } catch (e) {
      print('Error fetching products: $e');
      return [];
    }
  }

  // Place a native order in Firestore
  Future<String?> placeOrder({
    required String shopId,
    required String customerName,
    required String customerPhone,
    required String customerEmail,
    required String customerAddress,
    required String city,
    required double totalAmount,
    required double deliveryFee,
    required String paymentMethod,
    required List<CartItem> items,
  }) async {
    try {
      final orderRef = _db
          .collection('shops')
          .doc(shopId)
          .collection('orders')
          .doc();

      // Format items array
      final orderItems = items.map((item) => {
        'productId': item.product.id,
        'title': item.product.name,
        'price': item.product.price,
        'quantity': item.quantity,
        'selectedSize': item.selectedSize,
        'selectedColor': item.selectedColor,
        'imageUrl': item.product.images.isNotEmpty ? item.product.images.first : '',
      }).toList();

      // Generate a visual order ID (e.g. BD-10001)
      final timestamp = DateTime.now().millisecondsSinceEpoch.toString();
      final orderIdVisual = 'BD-${timestamp.substring(timestamp.length - 6)}';

      final orderData = {
        'orderIdVisual': orderIdVisual,
        'customerName': customerName,
        'customerPhone': customerPhone,
        'customerEmail': customerEmail.isNotEmpty ? customerEmail : null,
        'customerAddress': customerAddress,
        'city': city,
        'items': orderItems,
        'subtotal': totalAmount - deliveryFee,
        'deliveryFee': deliveryFee,
        'total': totalAmount,
        'paymentMethod': paymentMethod,
        'paymentStatus': 'pending',
        'status': 'pending',
        'createdAt': FieldValue.serverTimestamp(),
      };

      await orderRef.set(orderData);
      return orderRef.id; // Return DB Order ID
    } catch (e) {
      print('Error placing order: $e');
      return null;
    }
  }
}
