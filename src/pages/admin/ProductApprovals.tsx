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

    const updates: any = { approval_status: status === 'approved' ? 'finance_pending' : 'rejected' };
    
    if (status === 'approved') {
      updates.supplier_price = product.price;
      updates.finance_status = 'pending';
      
      const stockInput = document.querySelector(`input[data-stock-id="${productId}"]`) as HTMLInputElement;
      if (stockInput?.value) {
        const newStock = parseInt(stockInput.value);
        updates.stock_quantity = Math.min(newStock, product.stock_quantity);
      } else {
        updates.stock_quantity = product.stock_quantity;
      }
    }

    // Remove from UI FIRST
    setProducts(products.filter(p => p.id !== productId));

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
      <div className="container py-4 px-4 sm:py-8">
        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">Product Approvals</h1>

        {products.length === 0 ? (
          <div className="bg-card rounded-lg border p-6 sm:p-8 text-center text-muted-foreground">
            No pending products
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-card rounded-lg border p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  {product.product_images?.[0]?.image_url ? (
                    <img
                      src={product.product_images[0].image_url}
                      alt={product.name}
                      className="w-full sm:w-32 h-48 sm:h-32 object-cover rounded"
                    />
                  ) : (
                    <div className="w-full sm:w-32 h-48 sm:h-32 bg-secondary rounded" />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-semibold mb-2 break-words">{product.name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                      Supplier: {product.profiles?.full_name || 'N/A'}
                    </p>
                    <p className="text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">{product.description}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                      <div>
                        <label className="text-xs sm:text-sm font-medium">Supplier Price</label>
                        <p className="text-base sm:text-lg font-bold text-muted-foreground">₹{product.price}</p>
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm font-medium">Supplier Stock</label>
                        <p className="text-base sm:text-lg font-bold text-muted-foreground">{product.stock_quantity}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs sm:text-sm font-medium block mb-1">Set Stock Quantity (can only decrease)</label>
                        <input
                          type="number"
                          defaultValue={product.stock_quantity}
                          max={product.stock_quantity}
                          data-stock-id={product.id}
                          className="w-full px-3 py-2 rounded border bg-background text-sm"
                          placeholder="Stock"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={() => handleApproval(product.id, 'approved')}
                        className="bg-green-600 hover:bg-green-700 w-full sm:w-auto text-sm"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Send to Finance
                      </Button>
                      <Button
                        onClick={() => handleApproval(product.id, 'rejected')}
                        variant="destructive"
                        className="w-full sm:w-auto text-sm"
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
