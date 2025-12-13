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
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Load products error:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('ℹ️ No pending products');
      setProducts([]);
      return;
    }

    console.log('✅ Products loaded:', data.length);
    const productIds = data.map(p => p.id);
    const supplierIds = data.map(p => p.supplier_id).filter(Boolean);

    const [imagesResult, profilesResult] = await Promise.all([
      supabase.from('product_images').select('*').in('product_id', productIds),
      supabase.from('profiles').select('id, full_name').in('id', supplierIds)
    ]);

    console.log('📸 Images in DB:', imagesResult.data?.length || 0);
    console.log('📸 All images:', imagesResult.data);
    if (imagesResult.error) console.error('❌ Images error:', imagesResult.error);

    const productsWithData = data.map(p => {
      const images = imagesResult.data?.filter(img => img.product_id === p.id) || [];
      console.log(`Product ${p.name} has ${images.length} images:`, images);
      return {
        ...p,
        product_images: images,
        profiles: profilesResult.data?.find(prof => prof.id === p.supplier_id)
      };
    });

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
      <div className="w-full max-w-full overflow-x-hidden">
        <div className="container py-4 px-4 sm:py-8 max-w-7xl mx-auto">
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">Product Approvals</h1>

          {products.length === 0 ? (
            <div className="bg-card rounded-lg border p-6 sm:p-8 text-center text-muted-foreground">
              No pending products
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-card rounded-lg border p-4 sm:p-6 overflow-hidden">
                  <div className="flex flex-col gap-4">
                    {product.product_images && product.product_images.length > 0 && product.product_images[0]?.image_url ? (
                      <img
                        src={product.product_images[0].image_url}
                        alt={product.name}
                        className="w-full h-48 object-cover rounded"
                        onError={(e) => {
                          console.error('Image load error:', product.product_images[0].image_url);
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    ) : (
                      <div className="w-full h-48 bg-secondary rounded flex items-center justify-center text-xs text-muted-foreground">
                        No Image
                      </div>
                    )}
                    
                    <div className="w-full">
                      <h3 className="text-lg sm:text-xl font-semibold mb-2 break-words">{product.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                        Supplier: {product.profiles?.full_name || 'N/A'}
                      </p>
                      <p className="text-xs sm:text-sm mb-3 line-clamp-3">{product.description}</p>
                      
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                          <label className="text-xs font-medium block mb-1">Supplier Price</label>
                          <p className="text-base font-bold">₹{product.price}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium block mb-1">Supplier Stock</label>
                          <p className="text-base font-bold">{product.stock_quantity}</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="text-xs font-medium block mb-1">Set Stock Quantity</label>
                        <input
                          type="number"
                          defaultValue={product.stock_quantity}
                          max={product.stock_quantity}
                          data-stock-id={product.id}
                          className="w-full px-3 py-2 rounded border bg-background text-sm"
                          placeholder="Stock"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => handleApproval(product.id, 'approved')}
                          className="bg-green-600 hover:bg-green-700 w-full text-sm"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Send to Finance
                        </Button>
                        <Button
                          onClick={() => handleApproval(product.id, 'rejected')}
                          variant="destructive"
                          className="w-full text-sm"
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
      </div>
    </Layout>
  );
}
