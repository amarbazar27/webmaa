import 'package:cloud_firestore/cloud_firestore.dart';
import 'models.dart';

class DatabaseService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  // ─── Shop Queries ──────────────────────────────────────────────

  /// Fetch shop metadata by ID, slug, or custom domain.
  Future<Shop?> getShop(String shopId) async {
    try {
      if (shopId.trim().isEmpty) return null;

      // 1. Try direct doc ID query
      final doc = await _db.collection('shops').doc(shopId).get();
      if (doc.exists && doc.data() != null) {
        return Shop.fromFirestore(doc.id, doc.data()!);
      }

      // 2. Fallback query by subdomainSlug
      final snapSubdomain = await _db
          .collection('shops')
          .where('subdomainSlug', isEqualTo: shopId)
          .limit(1)
          .get();
      if (snapSubdomain.docs.isNotEmpty && snapSubdomain.docs.first.data() != null) {
        final d = snapSubdomain.docs.first;
        return Shop.fromFirestore(d.id, d.data());
      }

      // 3. Fallback query by shopSlug
      final snapSlug = await _db
          .collection('shops')
          .where('shopSlug', isEqualTo: shopId)
          .limit(1)
          .get();
      if (snapSlug.docs.isNotEmpty && snapSlug.docs.first.data() != null) {
        final d = snapSlug.docs.first;
        return Shop.fromFirestore(d.id, d.data());
      }

      // 4. Fallback query by customDomain
      final snapDomain = await _db
          .collection('shops')
          .where('customDomain', isEqualTo: shopId)
          .limit(1)
          .get();
      if (snapDomain.docs.isNotEmpty && snapDomain.docs.first.data() != null) {
        final d = snapDomain.docs.first;
        return Shop.fromFirestore(d.id, d.data());
      }
    } catch (e) {
      print('Error fetching shop: $e');
    }
    return null;
  }

  /// Fetch all shops for marketplace directory view.
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

  // ─── Category Queries ──────────────────────────────────────────

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

  // ─── Product Queries ───────────────────────────────────────────

  /// Fetch all in-stock products for a shop.
  Future<List<Product>> getProducts(String shopId) async {
    try {
      final snapshot = await _db
          .collection('shops')
          .doc(shopId)
          .collection('products')
          .get();
      return snapshot.docs
          .map((doc) => Product.fromFirestore(doc.id, doc.data()))
          .where((p) => p.inStock)
          .toList();
    } catch (e) {
      print('Error fetching products: $e');
      return [];
    }
  }

  /// Real-time product stream for live updates.
  Stream<List<Product>> getProductsStream(String shopId) {
    return _db
        .collection('shops')
        .doc(shopId)
        .collection('products')
        .snapshots()
        .map((snap) => snap.docs
            .map((doc) => Product.fromFirestore(doc.id, doc.data()))
            .where((p) => p.inStock)
            .toList());
  }

  // ─── Order Placement (Atomic) ──────────────────────────────────

  /// Place an order with atomic stock validation & decrement.
  /// Uses Firestore transaction: all-or-nothing.
  /// Returns the order document ID on success, null on failure.
  Future<String?> placeOrder({
    required String shopId,
    required String customerName,
    required String customerPhone,
    required String customerAddress,
    required String city,
    required double deliveryFee,
    required String paymentMethod,
    required List<CartItem> items,
    String? customerEmail,
  }) async {
    try {
      return await _db.runTransaction<String?>((transaction) async {
        // 1. Read current stock for every product in the cart
        final refs = <DocumentReference>[];
        final docs = <DocumentSnapshot>[];
        for (final item in items) {
          final ref = _db
              .collection('shops')
              .doc(shopId)
              .collection('products')
              .doc(item.product.id);
          refs.add(ref);
          docs.add(await transaction.get(ref));
        }

        // 2. Validate stock availability
        for (int i = 0; i < items.length; i++) {
          final data = docs[i].data() as Map<String, dynamic>?;
          if (data == null) {
            throw Exception('পণ্য খুঁজে পাওয়া যায়নি: ${items[i].product.name}');
          }
          final currentStock = (data['stock'] as num?)?.toDouble() ?? 0;
          if (currentStock < items[i].quantity) {
            throw Exception(
              '${items[i].product.name} এর পর্যাপ্ত স্টক নেই (${currentStock.toInt()} টি বাকি আছে)',
            );
          }
        }

        // 3. Decrement stock atomically
        for (int i = 0; i < items.length; i++) {
          final data = docs[i].data() as Map<String, dynamic>;
          final currentStock = (data['stock'] as num?)?.toDouble() ?? 0;
          transaction.update(refs[i], {
            'stock': currentStock - items[i].quantity,
          });
        }

        // 4. Generate sequential daily order ID (e.g. 01#20092026)
        final now = DateTime.now();
        final dd = now.day.toString().padLeft(2, '0');
        final mm = now.month.toString().padLeft(2, '0');
        final yyyy = now.year.toString();
        final dateKey = 'orders_$dd$mm$yyyy';

        final counterRef = _db
            .collection('shops')
            .doc(shopId)
            .collection('counters')
            .doc(dateKey);
        final counterDoc = await transaction.get(counterRef);

        int orderNum = 1;
        if (counterDoc.exists) {
          orderNum = ((counterDoc.data() as Map<String, dynamic>)['count'] as int? ?? 0) + 1;
        }
        transaction.set(counterRef, {'count': orderNum}, SetOptions(merge: true));

        final orderIdVisual = '${orderNum.toString().padLeft(2, '0')}#$dd$mm$yyyy';

        // 5. Create order document
        final orderRef = _db
            .collection('shops')
            .doc(shopId)
            .collection('orders')
            .doc();

        final subtotal = items.fold(0.0, (sum, item) => sum + item.totalPrice);

        transaction.set(orderRef, {
          'orderIdVisual': orderIdVisual,
          'customerName': customerName,
          'customerPhone': customerPhone,
          'customerEmail': customerEmail ?? '',
          'customerAddress': customerAddress,
          'city': city,
          'items': items
              .map((item) => {
                    'productId': item.product.id,
                    'title': item.product.name,
                    'price': item.product.price,
                    'quantity': item.quantity,
                    'selectedSize': item.selectedSize,
                    'selectedColor': item.selectedColor,
                    'imageUrl': item.product.images.isNotEmpty
                        ? item.product.images.first
                        : '',
                  })
              .toList(),
          'subtotal': subtotal,
          'deliveryFee': deliveryFee,
          'total': subtotal + deliveryFee,
          'paymentMethod': paymentMethod,
          'paymentStatus': 'pending',
          'status': 'pending',
          'source': 'native_app',
          'createdAt': FieldValue.serverTimestamp(),
        });

        return orderRef.id;
      });
    } catch (e) {
      print('Error placing order: $e');
      return null;
    }
  }

  // ─── Order Queries ─────────────────────────────────────────────

  /// Look up orders by customer phone number (most recent first).
  Future<List<ShopOrder>> getOrdersByPhone(String shopId, String phone) async {
    try {
      // Try with ordering (needs composite index)
      final snapshot = await _db
          .collection('shops')
          .doc(shopId)
          .collection('orders')
          .where('customerPhone', isEqualTo: phone)
          .orderBy('createdAt', descending: true)
          .limit(20)
          .get();
      return snapshot.docs
          .map((doc) => ShopOrder.fromFirestore(doc.id, doc.data()))
          .toList();
    } catch (e) {
      // Fallback: query without ordering (no index needed), sort client-side
      try {
        final snapshot = await _db
            .collection('shops')
            .doc(shopId)
            .collection('orders')
            .where('customerPhone', isEqualTo: phone)
            .limit(20)
            .get();
        final orders = snapshot.docs
            .map((doc) => ShopOrder.fromFirestore(doc.id, doc.data()))
            .toList();
        orders.sort((a, b) =>
            (b.createdAt ?? DateTime(2000)).compareTo(a.createdAt ?? DateTime(2000)));
        return orders;
      } catch (e2) {
        print('Error fetching orders by phone: $e2');
        return [];
      }
    }
  }

  /// Real-time stream for a single order (live tracking).
  Stream<ShopOrder?> getOrderStream(String shopId, String orderId) {
    return _db
        .collection('shops')
        .doc(shopId)
        .collection('orders')
        .doc(orderId)
        .snapshots()
        .map((doc) {
      if (!doc.exists || doc.data() == null) return null;
      return ShopOrder.fromFirestore(doc.id, doc.data()!);
    });
  }
}
