import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Orders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (user) {
      loadOrders();
      
      const channel = supabase
        .channel('orders-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `user_id=eq.${user.id}`
          },
          () => loadOrders()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*, products(name, product_images(image_url)))
      `)
      .eq('user_id', user?.id)
      .neq('order_status', 'cancelled')
      .order('created_at', { ascending: false });
    
    if (data) setOrders(data);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      placed: 'bg-blue-100 text-blue-800',
      processing: 'bg-yellow-100 text-yellow-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast({ title: 'Please provide a reason', variant: 'destructive' });
      return;
    }

    const { error } = await supabase
      .from('orders')
      .update({
        order_status: 'cancelled',
        notes: cancelReason,
      })
      .eq('id', cancelOrderId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Order cancelled successfully' });
      setCancelOrderId(null);
      setCancelReason('');
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Please login to view your orders</h2>
          <Button asChild><Link to="/login">Login</Link></Button>
        </div>
      </Layout>
    );
  }

  if (loading) return <Layout><div className="container py-8">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="font-display text-4xl font-bold mb-6">My Orders</h1>
        
        {cancelOrderId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setCancelOrderId(null)}>
            <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold mb-4">Cancel Order</h2>
              <p className="text-sm text-muted-foreground mb-4">Please provide a reason for cancellation:</p>
              <textarea
                placeholder="Reason for cancellation"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-4 py-2 rounded-md border bg-background mb-4"
                rows={4}
                required
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setCancelOrderId(null); setCancelReason(''); }} className="flex-1">
                  Back
                </Button>
                <Button variant="destructive" onClick={handleCancelOrder} className="flex-1">
                  Confirm Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">No orders yet</p>
            <Button asChild><Link to="/products">Start Shopping</Link></Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-card rounded-lg border p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Order ID: {order.id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.order_status)}`}>
                    {order.order_status.toUpperCase()}
                  </span>
                </div>
                
                <div className="space-y-3 mb-4">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex gap-3">
                      {item.products?.product_images?.[0]?.image_url ? (
                        <img
                          src={item.products.product_images[0].image_url}
                          alt={item.products.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-secondary rounded" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold">{item.products?.name}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        <p className="text-sm font-semibold">₹{item.price}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="mb-4">
                    <p className="font-semibold mb-2">Delivered To:</p>
                    <p className="text-sm">{order.address_snapshot?.full_name}</p>
                    <p className="text-sm">{order.address_snapshot?.phone}</p>
                    <p className="text-sm">{order.address_snapshot?.address_line}</p>
                    <p className="text-sm">{order.address_snapshot?.city}, {order.address_snapshot?.state} - {order.address_snapshot?.pincode}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Payment: {order.payment_method.toUpperCase()}</p>
                      <p className="text-sm text-muted-foreground">Status: {order.payment_status}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="text-2xl font-bold text-primary">₹{order.total}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link to={`/order-tracking/${order.id}`}>Track Order</Link>
                    </Button>
                    {order.order_status !== 'cancelled' && order.order_status !== 'delivered' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setCancelOrderId(order.id)}
                      >
                        Cancel Order
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
