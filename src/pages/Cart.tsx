import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

export default function Cart() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutStep, setCheckoutStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [address, setAddress] = useState({
    full_name: '',
    phone: '',
    address_line: '',
    city: '',
    state: '',
    pincode: '',
  });

  useEffect(() => {
    if (user) loadCart();
    else setLoading(false);
  }, [user]);

  const loadCart = async () => {
    const { data } = await supabase
      .from('cart')
      .select(`
        *,
        products(*, product_images(image_url))
      `)
      .eq('user_id', user?.id);
    
    if (data) setCartItems(data);
    setLoading(false);
  };

  const updateQuantity = async (id: string, quantity: number) => {
    if (quantity < 1) return;
    await supabase.from('cart').update({ quantity }).eq('id', id);
    loadCart();
  };

  const removeItem = async (id: string) => {
    await supabase.from('cart').delete().eq('id', id);
    toast({ title: 'Removed from cart' });
    loadCart();
  };

  const total = cartItems.reduce((sum, item) => sum + (item.products?.admin_price || item.products?.price || 0) * item.quantity, 0);
  const shippingCost = total > 999 ? 0 : 50;
  const finalTotal = total + shippingCost;

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    
    const { data: order, error } = await supabase.from('orders').insert({
      user_id: user?.id,
      address_snapshot: address,
      subtotal: total,
      shipping_cost: shippingCost,
      total: finalTotal,
      payment_method: paymentMethod,
      payment_status: paymentMethod === 'cod' ? 'pending' : 'completed',
      order_status: 'placed',
    }).select().single();

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    for (const item of cartItems) {
      await supabase.from('order_items').insert({
        order_id: order.id,
        product_id: item.product_id,
        product_snapshot: item.products,
        quantity: item.quantity,
        price: item.products.admin_price || item.products.price,
        supplier_status: 'pending',
      });
    }

    await supabase.from('cart').delete().eq('user_id', user?.id);
    
    toast({ title: 'Order placed successfully!' });
    setCheckoutStep(0);
    setAddress({ full_name: '', phone: '', address_line: '', city: '', state: '', pincode: '' });
    loadCart();
  };

  if (!user) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Please login to view your cart</h2>
          <Button asChild><Link to="/login">Login</Link></Button>
        </div>
      </Layout>
    );
  }

  if (loading) return <Layout><div className="container py-8">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="font-display text-4xl font-bold mb-6">Shopping Cart</h1>
        
        {checkoutStep > 0 && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setCheckoutStep(0)}>
            <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {checkoutStep === 1 && (
                <>
                  <h2 className="text-2xl font-bold mb-4">Delivery Address</h2>
                  <div className="space-y-3 mb-6">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={address.full_name}
                      onChange={(e) => setAddress({ ...address, full_name: e.target.value })}
                      className="w-full px-4 py-2 rounded-md border bg-background"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                      className="w-full px-4 py-2 rounded-md border bg-background"
                      required
                    />
                    <textarea
                      placeholder="Address Line"
                      value={address.address_line}
                      onChange={(e) => setAddress({ ...address, address_line: e.target.value })}
                      className="w-full px-4 py-2 rounded-md border bg-background"
                      rows={2}
                      required
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="City"
                        value={address.city}
                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                        className="px-4 py-2 rounded-md border bg-background"
                        required
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={address.state}
                        onChange={(e) => setAddress({ ...address, state: e.target.value })}
                        className="px-4 py-2 rounded-md border bg-background"
                        required
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Pincode"
                      value={address.pincode}
                      onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                      className="w-full px-4 py-2 rounded-md border bg-background"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setCheckoutStep(0)} className="flex-1">Cancel</Button>
                    <Button onClick={() => setCheckoutStep(2)} className="flex-1">Continue</Button>
                  </div>
                </>
              )}
              
              {checkoutStep === 2 && (
                <>
                  <h2 className="text-2xl font-bold mb-4">Payment Method</h2>
                  <div className="space-y-3 mb-6">
                    <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-secondary">
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <div>
                        <div className="font-semibold">Cash on Delivery</div>
                        <div className="text-sm text-muted-foreground">Pay when you receive</div>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-secondary">
                      <input
                        type="radio"
                        name="payment"
                        value="upi"
                        checked={paymentMethod === 'upi'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <div>
                        <div className="font-semibold">UPI Payment</div>
                        <div className="text-sm text-muted-foreground">PhonePe, GPay, Paytm</div>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-secondary">
                      <input
                        type="radio"
                        name="payment"
                        value="card"
                        checked={paymentMethod === 'card'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <div>
                        <div className="font-semibold">Credit/Debit Card</div>
                        <div className="text-sm text-muted-foreground">Visa, Mastercard, Rupay</div>
                      </div>
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setCheckoutStep(1)} className="flex-1">Back</Button>
                    <Button onClick={() => setCheckoutStep(3)} className="flex-1">Continue</Button>
                  </div>
                </>
              )}
              
              {checkoutStep === 3 && (
                <>
                  <h2 className="text-2xl font-bold mb-4">Invoice</h2>
                  <div className="space-y-4 mb-6">
                    <div className="border-b pb-3">
                      <p className="font-semibold">Delivery Address:</p>
                      <p className="text-sm">{address.full_name}</p>
                      <p className="text-sm">{address.phone}</p>
                      <p className="text-sm">{address.address_line}</p>
                      <p className="text-sm">{address.city}, {address.state} - {address.pincode}</p>
                    </div>
                    
                    <div className="border-b pb-3">
                      <p className="font-semibold mb-2">Items:</p>
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm mb-1">
                          <span>{item.products?.name} x {item.quantity}</span>
                          <span>₹{((item.products?.admin_price || item.products?.price) * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Subtotal</span>
                        <span>₹{total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Shipping</span>
                        <span>₹{shippingCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total</span>
                        <span>₹{finalTotal.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="bg-secondary p-3 rounded">
                      <p className="text-sm font-semibold">Payment Method:</p>
                      <p className="text-sm">{paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod === 'upi' ? 'UPI Payment' : 'Credit/Debit Card'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setCheckoutStep(2)} className="flex-1">Back</Button>
                    <Button onClick={handleCheckout} className="flex-1">Confirm & Place Order</Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        
        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">Your cart is empty</p>
            <Button asChild><Link to="/products">Continue Shopping</Link></Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-card rounded-lg border p-4 flex gap-4">
                  {item.products?.product_images?.[0]?.image_url ? (
                    <img src={item.products.product_images[0].image_url} alt={item.products.name} className="w-24 h-24 object-cover rounded" />
                  ) : (
                    <div className="w-24 h-24 bg-secondary rounded" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.products?.name}</h3>
                    <p className="text-primary font-bold">₹{item.products?.admin_price || item.products?.price}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => removeItem(item.id)} className="ml-auto">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-card rounded-lg border p-6 h-fit">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{total > 999 ? 'Free' : '₹50'}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>₹{(total + (total > 999 ? 0 : 50)).toFixed(2)}</span>
                </div>
              </div>
              <Button className="w-full" onClick={() => setCheckoutStep(1)}>Proceed to Checkout</Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
