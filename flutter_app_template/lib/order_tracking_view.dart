import 'package:flutter/material.dart';
import 'models.dart';
import 'database_service.dart';
import 'theme.dart';

/// Order tracking tab — customers look up orders by phone number.
/// No login required. Embedded as a tab in StorefrontView (no Scaffold).
class OrderTrackingView extends StatefulWidget {
  final String shopId;

  const OrderTrackingView({super.key, required this.shopId});

  @override
  State<OrderTrackingView> createState() => _OrderTrackingViewState();
}

class _OrderTrackingViewState extends State<OrderTrackingView> {
  final _db = DatabaseService();
  final _phoneController = TextEditingController();
  List<ShopOrder>? _orders;
  bool _isLoading = false;
  String? _error;

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _searchOrders() async {
    final phone = _phoneController.text.trim();
    if (phone.length < 11) {
      setState(() => _error = 'সঠিক মোবাইল নম্বর দিন (১১ ডিজিট)');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final orders = await _db.getOrdersByPhone(widget.shopId, phone);
      if (mounted) {
        setState(() {
          _orders = orders;
          _isLoading = false;
          if (orders.isEmpty) {
            _error = 'এই নম্বরে কোনো অর্ডার পাওয়া যায়নি';
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _error = 'অর্ডার খোঁজায় সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).primaryColor;

    return Column(
      children: [
        // Search bar
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'মোবাইল নম্বর দিয়ে অর্ডার খুঁজুন',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      decoration: InputDecoration(
                        hintText: '01XXXXXXXXX',
                        prefixIcon: const Icon(Icons.phone),
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(vertical: 0),
                      ),
                      onSubmitted: (_) => _searchOrders(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  SizedBox(
                    height: 48,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _searchOrders,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Text('খুঁজুন', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 12)),
              ],
            ],
          ),
        ),

        // Results
        Expanded(
          child: _orders == null
              ? _buildEmptyState()
              : _orders!.isEmpty
                  ? _buildEmptyState()
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: _orders!.length,
                      itemBuilder: (ctx, i) => _buildOrderCard(_orders![i], primary),
                    ),
        ),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.local_shipping_outlined, size: 64, color: Colors.grey[300]),
          const SizedBox(height: 16),
          const Text(
            'আপনার মোবাইল নম্বর দিয়ে\nঅর্ডারের স্ট্যাটাস জানুন',
            style: TextStyle(fontSize: 14, color: Colors.grey),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildOrderCard(ShopOrder order, Color primary) {
    final statusColor = _getStatusColor(order.status);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Order ID + Status badge
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'অর্ডার #${order.orderIdVisual}',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    order.statusLabel,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: statusColor,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            // Status timeline
            _buildStatusTimeline(order, primary),
            const SizedBox(height: 10),

            // Order items summary
            ...order.items.take(3).map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Row(
                    children: [
                      Text(
                        '${item['quantity']}x ',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                      Expanded(
                        child: Text(
                          item['title'] ?? 'পণ্য',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 12),
                        ),
                      ),
                      Text(
                        '৳${((item['price'] as num?) ?? 0) * ((item['quantity'] as num?) ?? 1)}',
                        style: const TextStyle(fontSize: 12),
                      ),
                    ],
                  ),
                )),
            if (order.items.length > 3)
              Text(
                '+${order.items.length - 3} আরো আইটেম',
                style: TextStyle(fontSize: 11, color: Colors.grey[600]),
              ),

            const Divider(height: 16),

            // Total + date
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  order.createdAt != null
                      ? '${order.createdAt!.day}/${order.createdAt!.month}/${order.createdAt!.year}'
                      : '',
                  style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                ),
                Text(
                  'মোট: ৳${order.total.toStringAsFixed(0)}',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: primary),
                ),
              ],
            ),

            // Tracking code
            if (order.trackingCode != null && order.trackingCode!.isNotEmpty) ...[
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(Icons.qr_code, size: 14, color: Colors.grey),
                  const SizedBox(width: 4),
                  Text(
                    'ট্র্যাকিং: ${order.trackingCode}',
                    style: TextStyle(fontSize: 11, color: Colors.grey[700]),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStatusTimeline(ShopOrder order, Color primary) {
    const steps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const labels = ['অপেক্ষমাণ', 'নিশ্চিত', 'প্রস্তুত', 'শিপড', 'ডেলিভারি'];

    // Handle cancelled/returned separately
    if (order.status == 'cancelled' || order.status == 'returned') {
      return Row(
        children: [
          Icon(
            order.status == 'cancelled' ? Icons.cancel : Icons.undo,
            size: 18,
            color: Colors.red,
          ),
          const SizedBox(width: 6),
          Text(
            order.statusLabel,
            style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 13),
          ),
        ],
      );
    }

    final currentIdx = steps.indexOf(order.status);

    return Row(
      children: List.generate(steps.length, (i) {
        final isCompleted = i <= currentIdx;
        final isLast = i == steps.length - 1;

        return Expanded(
          child: Row(
            children: [
              Column(
                children: [
                  Container(
                    width: 16,
                    height: 16,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: isCompleted ? primary : Colors.grey[300],
                    ),
                    child: isCompleted
                        ? const Icon(Icons.check, size: 10, color: Colors.white)
                        : null,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    labels[i],
                    style: TextStyle(
                      fontSize: 8,
                      fontWeight: isCompleted ? FontWeight.bold : FontWeight.normal,
                      color: isCompleted ? primary : Colors.grey,
                    ),
                  ),
                ],
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    height: 2,
                    margin: const EdgeInsets.only(bottom: 14),
                    color: i < currentIdx ? primary : Colors.grey[300],
                  ),
                ),
            ],
          ),
        );
      }),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'pending':
        return Colors.orange;
      case 'confirmed':
        return Colors.blue;
      case 'processing':
        return Colors.indigo;
      case 'shipped':
        return Colors.purple;
      case 'delivered':
      case 'completed':
        return Colors.green;
      case 'cancelled':
      case 'returned':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}
