import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Package, Truck, CheckCircle, Clock } from 'lucide-react';

export default function OrderTracking() {
  const { orderId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && orderId) loadOrder();
  }, [user, orderId]);

  const loadOrder = async () => {
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*, products(name, product_images(image_url)))
      `)
      .eq('id', orderId)
      .eq('user_id', user?.id)
      .single();
    
    if (data) setOrder(data);
    setLoading(false);
  };

  const trackingSteps = [
    { status: 'placed', label: 'Order Placed', icon: Package },
    { status: 'processing', label: 'Processing', icon: Clock },
    { status: 'shipped', label: 'Shipped', icon: Truck },
    { status: 'delivered', label: 'Delivered', icon: CheckCircle },
  ];

  const getStepIndex = (status: string) => {
    return trackingSteps.findIndex(step => step.status === status);
  };

  if (loading) return <Layout><div className="container py-8">Loading...</div></Layout>;

  if (!order) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Order not found</h2>
          <Button onClick={() => navigate('/orders')}>View All Orders</Button>
        </div>
      </Layout>
    );
  }

  const currentStepIndex = getStepIndex(order.order_status);

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate('/orders')} className="mb-4">
          ← Back to Orders
        </Button>

        <div className="bg-card rounded-lg border p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">Order Tracking</h1>
          <p className="text-muted-foreground">Order ID: {order.id.slice(0, 8)}</p>
          <p className="text-sm text-muted-foreground">
            Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        {order.order_status !== 'cancelled' && (
          <div className="bg-card rounded-lg border p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6">Tracking Status</h2>
            <div className="relative">
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
              <div 
                className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
                style={{ width: `${(currentStepIndex / (trackingSteps.length - 1)) * 100}%` }}
              />
              
              <div className="relative flex justify-between">
                {trackingSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  
                  return (
                    <div key={step.status} className="flex flex-col items-center">
                      <div 
                        className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                          isCompleted 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-muted-foreground'
                        } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className={`text-sm font-medium ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {order.order_status === 'cancelled' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Order Cancelled</h2>
            {order.notes && <p className="text-sm text-red-600">Reason: {order.notes}</p>}
          </div>
        )}

        <div className="bg-card rounded-lg border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Order Items</h2>
          <div className="space-y-3">
            {order.order_items?.map((item: any) => (
              <div key={item.id} className="flex gap-3 pb-3 border-b last:border-0">
                {item.products?.product_images?.[0]?.image_url ? (
                  <img
                    src={item.products.product_images[0].image_url}
                    alt={item.products.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                ) : (
                  <div className="w-20 h-20 bg-secondary rounded" />
                )}
                <div className="flex-1">
                  <p className="font-semibold">{item.products?.name}</p>
                  <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                  <p className="text-sm font-semibold">₹{item.price}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{(item.quantity * item.price).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Delivery Address</h2>
            <p className="text-sm font-medium">{order.address_snapshot?.full_name}</p>
            <p className="text-sm">{order.address_snapshot?.phone}</p>
            <p className="text-sm">{order.address_snapshot?.address_line}</p>
            <p className="text-sm">
              {order.address_snapshot?.city}, {order.address_snapshot?.state} - {order.address_snapshot?.pincode}
            </p>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>₹{order.shipping_cost}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Total</span>
                <span>₹{order.total}</span>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm">
                  <span className="font-medium">Payment Method:</span> {order.payment_method.toUpperCase()}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Payment Status:</span> {order.payment_status}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
