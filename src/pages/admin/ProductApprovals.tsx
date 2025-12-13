import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Check, X } from 'lucide-react';

export default function ProductApprovals() {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading && !isAdmin) navigate('/');
    else loadProducts();
  }, [isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel('admin-products-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products' }, (payload) => {
        if (payload.new.approval_status !== 'pending') {
          setProducts(prev => prev.filter(p => p.id !== payload.new.id));
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'products' }, () => loadProducts())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'product_images' }, () => loadProducts())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [isAdmin]);

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false });
    
    if (!data || data.length === 0) {
      setProducts([]);
      return;
    }

    const productIds = data.map(p => p.id);
    const supplierIds = data.map(p => p.supplier_id).filter(Boolean);

    const [images, profiles] = await Promise.all([
      supabase.from('product_images').select('product_id, image_url').in('product_id', productIds),
      supabase.from('profiles').select('id, full_name').in('id', supplierIds)
    ]);

    const productsWithData = data.map(p => ({
      ...p,
      product_images: images.data?.filter(img => img.product_id === p.id) || [],
      profiles: profiles.data?.find(prof => prof.id === p.supplier_id)
    }));

    setProducts(productsWithData);
  };

  const handleApproval = async (productId: string, status: 'approved' | 'rejected') => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Remove from UI FIRST
    setProducts(products.filter(p => p.id !== productId));

    const updates: any = { approval_status: status === 'approved' ? 'finance_pending' : 'rejected' };
    
    if (status === 'approved') {
      updates.supplier_price = product.price;
      updates.finance_status = 'pending';
      
      const stockInput = document.querySelector(`input[data-stock-id="${productId}"]`) as HTMLInputElement;
      if (stockInput?.value) updates.stock_quantity = parseInt(stockInput.value);
    }

    const { error } = await supabase.from('products').update(updates).eq('id', productId);

    if (error) {
      setProducts([...products]);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: status === 'approved' ? '✅ Sent to Finance!' : 'Rejected' });
    }
  };

  if (isLoading) return <Layout><div className="container py-8">Loading...</div></Layout>;
  if (!isAdmin) return null;

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="font-display text-4xl font-bold mb-6">Product Approvals</h1>

        {products.length === 0 ? (
          <div className="bg-card rounded-lg border p-8 text-center text-muted-foreground">
            No pending products
          </div>
        ) : (
          <div className="grid gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-card rounded-lg border p-6">
                <div className="flex gap-6">
                  {product.product_images?.[0]?.image_url ? (
                    <img
                      src={product.product_images[0].image_url}
                      alt={product.name}
                      className="w-32 h-32 object-cover rounded"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-secondary rounded" />
                  )}
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Supplier: {product.profiles?.full_name || 'N/A'}
                    </p>
                    <p className="text-sm mb-4">{product.description}</p>
                    
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-sm font-medium">Supplier Price</label>
                        <p className="text-lg font-bold text-muted-foreground">₹{product.price}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Supplier Stock</label>
                        <p className="text-lg font-bold text-muted-foreground">{product.stock_quantity}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1">Set Stock Quantity</label>
                        <input
                          type="number"
                          defaultValue={product.stock_quantity}
                          data-stock-id={product.id}
                          className="w-full px-3 py-2 rounded border bg-background"
                          placeholder="Stock"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApproval(product.id, 'approved')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Send to Finance
                      </Button>
                      <Button
                        onClick={() => handleApproval(product.id, 'rejected')}
                        variant="destructive"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
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
