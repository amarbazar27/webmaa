import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'models.dart';
import 'cart_provider.dart';
import 'database_service.dart';
import 'theme.dart';

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
  String _selectedPaymentMethod = 'cod';
  bool _isPlacingOrder = false;
  String? _orderError;

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
    final primary = HexColor.fromHex(widget.shop.primaryColorHex);
    final totalAmount = cart.subtotalAmount + _deliveryFee;

    return Scaffold(
      appBar: AppBar(
        title: const Text('অর্ডার সম্পন্ন করুন'),
      ),
      body: _isPlacingOrder
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(color: primary),
                  const SizedBox(height: 16),
                  const Text(
                    'অর্ডার সাবমিট করা হচ্ছে...',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'স্টক যাচাই ও অর্ডার তৈরি হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন',
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                ],
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Error banner
                    if (_orderError != null) ...[
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.red[50],
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.red[200]!),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline, color: Colors.red, size: 20),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _orderError!,
                                style: const TextStyle(color: Colors.red, fontSize: 13),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Order summary (items)
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'আপনার অর্ডার (${cart.itemCount} টি পণ্য)',
                              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                            ),
                            const Divider(height: 16),
                            ...cart.items.map((item) => Padding(
                                  padding: const EdgeInsets.only(bottom: 6),
                                  child: Row(
                                    children: [
                                      Text(
                                        '${item.quantity}x ',
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                                      ),
                                      Expanded(
                                        child: Text(
                                          item.product.name +
                                              (item.selectedSize.isNotEmpty ? ' (${item.selectedSize})' : '') +
                                              (item.selectedColor.isNotEmpty ? ' [${item.selectedColor}]' : ''),
                                          style: const TextStyle(fontSize: 12),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      Text(
                                        '৳${item.totalPrice.toStringAsFixed(0)}',
                                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                                      ),
                                    ],
                                  ),
                                )),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Delivery details
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'ডেলিভারি তথ্য',
                              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                            ),
                            const Divider(height: 20),
                            TextFormField(
                              controller: _nameController,
                              decoration: const InputDecoration(
                                labelText: 'আপনার নাম *',
                                border: OutlineInputBorder(),
                                prefixIcon: Icon(Icons.person),
                              ),
                              validator: (val) => val == null || val.isEmpty ? 'নাম লিখুন' : null,
                            ),
                            const SizedBox(height: 14),
                            TextFormField(
                              controller: _phoneController,
                              keyboardType: TextInputType.phone,
                              decoration: const InputDecoration(
                                labelText: 'মোবাইল নম্বর *',
                                border: OutlineInputBorder(),
                                prefixIcon: Icon(Icons.phone),
                              ),
                              validator: (val) =>
                                  val == null || val.length < 11 ? 'সঠিক মোবাইল নম্বর দিন' : null,
                            ),
                            const SizedBox(height: 14),
                            TextFormField(
                              controller: _emailController,
                              keyboardType: TextInputType.emailAddress,
                              decoration: const InputDecoration(
                                labelText: 'ইমেইল (ঐচ্ছিক)',
                                border: OutlineInputBorder(),
                                prefixIcon: Icon(Icons.email),
                              ),
                            ),
                            const SizedBox(height: 14),
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
                            const SizedBox(height: 14),
                            const Text('ডেলিভারি এরিয়া:', style: TextStyle(fontWeight: FontWeight.bold)),
                            const SizedBox(height: 8),
                            DropdownButtonFormField<String>(
                              value: _selectedCity,
                              decoration: const InputDecoration(border: OutlineInputBorder()),
                              items: const [
                                DropdownMenuItem(
                                    value: 'Inside Dhaka', child: Text('ঢাকার ভেতরে (Inside Dhaka)')),
                                DropdownMenuItem(
                                    value: 'Outside Dhaka', child: Text('ঢাকার বাইরে (Outside Dhaka)')),
                              ],
                              onChanged: (val) {
                                if (val != null) setState(() => _selectedCity = val);
                              },
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Payment method
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'পেমেন্ট মাধ্যম',
                              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                            ),
                            const Divider(height: 20),
                            RadioListTile<String>(
                              title: const Text('ক্যাশ অন ডেলিভারি (COD)'),
                              subtitle: const Text('ডেলিভারির সময় টাকা দিন', style: TextStyle(fontSize: 11)),
                              value: 'cod',
                              groupValue: _selectedPaymentMethod,
                              activeColor: primary,
                              onChanged: (val) => setState(() => _selectedPaymentMethod = val!),
                            ),
                            RadioListTile<String>(
                              title: const Text('অনলাইন পেমেন্ট (bKash/Nagad)'),
                              subtitle: const Text('অটোমেটিক পেমেন্ট গেটওয়ে', style: TextStyle(fontSize: 11)),
                              value: 'automated',
                              groupValue: _selectedPaymentMethod,
                              activeColor: primary,
                              onChanged: (val) => setState(() => _selectedPaymentMethod = val!),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Price summary
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('সাবটোটাল'),
                                Text('৳${cart.subtotalAmount.toStringAsFixed(0)}'),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('ডেলিভারি চার্জ'),
                                Text('৳${_deliveryFee.toStringAsFixed(0)}'),
                              ],
                            ),
                            const Divider(height: 20),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('সর্বমোট',
                                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                Text(
                                  '৳${totalAmount.toStringAsFixed(0)}',
                                  style: TextStyle(
                                      fontWeight: FontWeight.bold, fontSize: 16, color: primary),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Submit button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () => _submitOrder(cart),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        child: const Text(
                          'অর্ডার কনফার্ম করুন',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                        ),
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
      _orderError = null;
    });

    // Use atomic placeOrder with stock validation
    final orderId = await DatabaseService().placeOrder(
      shopId: widget.shop.id,
      customerName: _nameController.text,
      customerPhone: _phoneController.text,
      customerEmail: _emailController.text.isNotEmpty ? _emailController.text : null,
      customerAddress: _addressController.text,
      city: _selectedCity,
      deliveryFee: _deliveryFee,
      paymentMethod: _selectedPaymentMethod,
      items: cart.items,
    );

    if (!mounted) return;

    setState(() => _isPlacingOrder = false);

    if (orderId != null) {
      cart.clearCart();

      // If automated payment, redirect to payment gateway
      if (_selectedPaymentMethod == 'automated') {
        final checkoutUrl =
            'https://bdretailers.com/shop/${widget.shop.id}/order/$orderId?payment=pay';
        final uri = Uri.parse(checkoutUrl);
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        }
      }

      // Show success dialog
      if (!mounted) return;
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          icon: const Icon(Icons.check_circle, color: Colors.green, size: 48),
          title: const Text('অর্ডার সফল হয়েছে! 🎉'),
          content: const Text(
            'আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে।\n'
            'আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।\n\n'
            'অর্ডার ট্র্যাক করতে "অর্ডার" ট্যাবে আপনার মোবাইল নম্বর দিন।\n\nধন্যবাদ!',
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(ctx).pop();
                Navigator.of(context).popUntil((route) => route.isFirst);
              },
              child: Text('ঠিক আছে', style: TextStyle(color: HexColor.fromHex(widget.shop.primaryColorHex))),
            ),
          ],
        ),
      );
    } else {
      setState(() {
        _orderError = 'অর্ডার প্রসেস করতে ব্যর্থ হয়েছে। সম্ভবত কোনো পণ্যের স্টক শেষ হয়ে গেছে। পুনরায় চেষ্টা করুন।';
      });
    }
  }
}
