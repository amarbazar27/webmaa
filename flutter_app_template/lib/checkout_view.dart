import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'models.dart';
import 'cart_provider.dart';
import 'database_service.dart';

class CheckoutView extends StatefulWidget {
  final Shop shop;

  const CheckoutView({
    super.key,
    required this.shop,
  });

  @override
  State<CheckoutView> createState() => _CheckoutViewState();
}

class _CheckoutViewState extends State<CheckoutView> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _addressController = TextEditingController();

  String _selectedCity = 'Inside Dhaka';
  String _selectedPaymentMethod = 'cod'; // cod, automated
  bool _isPlacingOrder = false;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  double get _deliveryFee {
    return _selectedCity == 'Inside Dhaka'
        ? widget.shop.deliveryInsideDhaka
        : widget.shop.deliveryOutsideDhaka;
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();
    final themeColor = HexColor.fromHex(widget.shop.primaryColorHex);
    final totalAmount = cart.subtotalAmount + _deliveryFee;

    return Scaffold(
      appBar: AppBar(
        title: const Text('অর্ডার সম্পন্ন করুন (Checkout)'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 0.5,
      ),
      backgroundColor: Colors.grey[50],
      body: _isPlacingOrder
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('অর্ডার সাবমিট করা হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...',
                      style: TextStyle(fontWeight: FontWeight.bold)),
                ],
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Delivery Details Card
                    Card(
                      color: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0.5,
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Delivery Information / ঠিকানা',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                            const Divider(height: 24),
                            TextFormField(
                              controller: _nameController,
                              decoration: const InputDecoration(
                                labelText: 'আপনার নাম *',
                                border: OutlineInputBorder(),
                                prefixIcon: Icon(Icons.person),
                              ),
                              validator: (val) => val == null || val.isEmpty ? 'নাম লিখুন' : null,
                            ),
                            const SizedBox(height: 16),
                            TextFormField(
                              controller: _phoneController,
                              keyboardType: TextInputType.phone,
                              decoration: const InputDecoration(
                                labelText: 'মোবাইল নম্বর *',
                                border: OutlineInputBorder(),
                                prefixIcon: Icon(Icons.phone),
                              ),
                              validator: (val) => val == null || val.length < 11 ? 'সঠিক মোবাইল নম্বর দিন' : null,
                            ),
                            const SizedBox(height: 16),
                            TextFormField(
                              controller: _emailController,
                              keyboardType: TextInputType.emailAddress,
                              decoration: const InputDecoration(
                                labelText: 'ইমেইল (ঐচ্ছিক)',
                                border: OutlineInputBorder(),
                                prefixIcon: Icon(Icons.email),
                              ),
                            ),
                            const SizedBox(height: 16),
                            TextFormField(
                              controller: _addressController,
                              maxLines: 3,
                              decoration: const InputDecoration(
                                labelText: 'সম্পূর্ণ ঠিকানা *',
                                border: OutlineInputBorder(),
                                prefixIcon: Icon(Icons.location_on),
                              ),
                              validator: (val) => val == null || val.isEmpty ? 'ঠিকানা লিখুন' : null,
                            ),
                            const SizedBox(height: 16),
                            // City Selector
                            const Text('ডেলিভারি এরিয়া নির্বাচন করুন:', style: TextStyle(fontWeight: FontWeight.bold)),
                            const SizedBox(height: 8),
                            DropdownButtonFormField<String>(
                              value: _selectedCity,
                              decoration: const InputDecoration(border: OutlineInputBorder()),
                              items: const [
                                DropdownMenuItem(value: 'Inside Dhaka', child: Text('ঢাকার ভেতরে (Inside Dhaka)')),
                                DropdownMenuItem(value: 'Outside Dhaka', child: Text('ঢাকার বাইরে (Outside Dhaka)')),
                              ],
                              onChanged: (val) {
                                if (val != null) {
                                  setState(() {
                                    _selectedCity = val;
                                  });
                                }
                              },
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Payment Method Card
                    Card(
                      color: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0.5,
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Payment Method / পেমেন্ট মাধ্যম',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                            const Divider(height: 24),
                            RadioListTile<String>(
                              title: const Text('ক্যাশ অন ডেলিভারি (Cash on Delivery)'),
                              value: 'cod',
                              groupValue: _selectedPaymentMethod,
                              activeColor: themeColor,
                              onChanged: (val) => setState(() => _selectedPaymentMethod = val!),
                            ),
                            RadioListTile<String>(
                              title: const Text('স্বয়ংক্রিয় অনলাইন পেমেন্ট (bKash/Nagad/Rocket)'),
                              value: 'automated',
                              groupValue: _selectedPaymentMethod,
                              activeColor: themeColor,
                              onChanged: (val) => setState(() => _selectedPaymentMethod = val!),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Order Summary Card
                    Card(
                      color: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0.5,
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Order Summary / অর্ডার সারসংক্ষেপ', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                            const Divider(height: 24),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Subtotal / সাবটোটাল'),
                                Text('৳${cart.subtotalAmount.toStringAsFixed(2)}'),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Delivery Fee / ডেলিভারি চার্জ'),
                                Text('৳${_deliveryFee.toStringAsFixed(2)}'),
                              ],
                            ),
                            const Divider(height: 20),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Total / সর্বমোট', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                Text('৳${totalAmount.toStringAsFixed(2)}', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: themeColor)),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Submit Order Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () => _submitOrder(cart),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: themeColor,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        child: const Text('অর্ডার কনফার্ম করুন (Confirm Order)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  void _submitOrder(CartProvider cart) async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isPlacingOrder = true;
    });

    final orderId = await DatabaseService().placeOrder(
      shopId: widget.shop.id,
      customerName: _nameController.text,
      customerPhone: _phoneController.text,
      customerEmail: _emailController.text,
      customerAddress: _addressController.text,
      city: _selectedCity,
      totalAmount: cart.subtotalAmount + _deliveryFee,
      deliveryFee: _deliveryFee,
      paymentMethod: _selectedPaymentMethod,
      items: cart.items,
    );

    setState(() {
      _isPlacingOrder = false;
    });

    if (orderId != null) {
      cart.clearCart();
      if (_selectedPaymentMethod == 'automated') {
        // Build automated payment redirect
        final checkoutUrl = 'https://bdretailers.com/shop/${widget.shop.id}/order/$orderId?payment=pay';
        final uri = Uri.parse(checkoutUrl);
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        }
      }

      // Show success popup and navigate back
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          title: const Text('অর্ডার সফল হয়েছে!'),
          content: const Text('আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে। আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব। ধন্যবাদ!'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(ctx).pop();
                Navigator.of(context).popUntil((route) => route.isFirst);
              },
              child: const Text('ঠিক আছে'),
            ),
          ],
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('অর্ডার প্রসেস করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।'),
          backgroundColor: Colors.red,
        ),
      );
    }
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
