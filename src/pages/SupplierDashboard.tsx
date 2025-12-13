import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Package, Plus, Edit, Trash2, Bell, Clock, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getCurrencySymbol } from '@/lib/currency';

export default function SupplierDashboard() {
  const { user, profile, isSupplier, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading && (!user || !isSupplier)) {
      navigate('/login');
    } else if (!isLoading && profile?.approval_status === 'pending') {
      navigate('/supplier-pending');
    }
  }, [user, isSupplier, profile, isLoading, navigate]);

  useEffect(() => {
    if (user && isSupplier) {
      loadSupplierProducts();
    }
  }, [user, isSupplier]);

  const loadSupplierProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, product_images(*), categories(name), brands(name)')
      .eq('supplier_id', user?.id)
      .order('created_at', { ascending: false });
    
    if (data) {
      const mapped = data.map(p => ({
        ...p,
        images: p.product_images,
        category: p.categories,
        brand: p.brands
      }));
      setProducts(mapped);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Product deleted successfully' });
      loadSupplierProducts();
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!isSupplier || profile?.approval_status !== 'approved') return null;

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-display text-4xl font-bold">Supplier Dashboard</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/supplier/new-orders')}>
              <Bell className="h-4 w-4 mr-2" />
              New Orders
            </Button>
            <Button onClick={() => navigate('/supplier/add-product')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5" />
              My Products ({products.length})
            </h2>
            
            {products.length > 0 ? (
              <div className="space-y-3">
                {products.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4 flex gap-4">
                    {product.images?.[0] && (
                      <img 
                        src={product.images[0].image_url} 
                        alt={product.name}
                        className="w-20 h-20 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{product.name}</p>
                        {product.approval_status === 'pending' && (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                            <Clock className="h-3 w-3 mr-1" />Pending
                          </Badge>
                        )}
                        {product.approval_status === 'approved' && (
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            <Check className="h-3 w-3 mr-1" />Approved
                          </Badge>
                        )}
                        {product.approval_status === 'rejected' && (
                          <Badge variant="outline" className="bg-red-100 text-red-800">
                            <X className="h-3 w-3 mr-1" />Rejected
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Price: {getCurrencySymbol(product.currency)}{product.price} | Stock: {product.stock_quantity}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {product.category?.name} {product.brand?.name && `• ${product.brand.name}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/supplier/edit-product/${product.id}`)}
                        disabled={product.approval_status === 'approved'}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                        disabled={product.approval_status === 'approved'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No products added yet. Click "Add Product" to get started.
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
