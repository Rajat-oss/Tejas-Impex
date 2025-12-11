import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Package, Plus } from 'lucide-react';

export default function SupplierDashboard() {
  const { user, profile, isSupplier, isLoading } = useAuth();
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
      .from('supplier_products')
      .select('*, products(*)')
      .eq('supplier_id', user?.id);
    
    if (data) setProducts(data);
  };

  if (isLoading) return <div>Loading...</div>;
  if (!isSupplier || profile?.approval_status !== 'approved') return null;

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-display text-4xl font-bold">Supplier Dashboard</h1>
          <Button onClick={() => navigate('/supplier/add-product')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        <div className="grid gap-6">
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5" />
              My Products ({products.length})
            </h2>
            
            {products.length > 0 ? (
              <div className="space-y-3">
                {products.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.products?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Price: ₹{item.products?.price} | Commission: {item.commission_percent}%
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="destructive" size="sm">Remove</Button>
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
