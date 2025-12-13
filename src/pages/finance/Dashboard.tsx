import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { DollarSign, Package, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface Product {
  id: string;
  name: string;
  supplier_price: number;
  finance_price: number | null;
  supplier_name: string;
  supplier_email: string;
  image_url: string;
  description: string;
  created_at: string;
  stock_quantity: number;
}

export default function FinanceDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFinance, setIsFinance] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkFinanceRole();
  }, []);

  useEffect(() => {
    if (!isFinance) return;

    // Subscribe to realtime changes
    const channel = supabase
      .channel('finance-products-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          if (payload.new.approval_status === 'finance_pending') {
            loadPendingProducts();
          }
          if (payload.old?.approval_status === 'finance_pending' && payload.new.approval_status !== 'finance_pending') {
            setProducts(prev => prev.filter(p => p.id !== payload.new.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isFinance]);

  const checkFinanceRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleData?.role === 'finance') {
      setIsFinance(true);
      loadPendingProducts();
    } else {
      toast({ title: 'Access Denied', description: 'Finance role required', variant: 'destructive' });
      navigate('/');
    }
  };

  const loadPendingProducts = async () => {
    setLoading(true);
    
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, description, supplier_price, finance_price, created_at, supplier_id, stock_quantity')
        .eq('approval_status', 'finance_pending')
        .order('created_at', { ascending: false });

      if (productsError) {
        toast({ title: 'Error', description: 'Failed to load products', variant: 'destructive' });
        setLoading(false);
        return;
      }

      if (!productsData || productsData.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const productIds = productsData.map(p => p.id);
      const supplierIds = productsData.map(p => p.supplier_id).filter(Boolean);

      const [imagesResult, profilesResult] = await Promise.all([
        supabase.from('product_images').select('product_id, image_url').in('product_id', productIds),
        supabase.from('profiles').select('id, full_name, email').in('id', supplierIds)
      ]);

      const transformedData = productsData.map(p => {
        const image = imagesResult.data?.find(img => img.product_id === p.id);
        const profile = profilesResult.data?.find(prof => prof.id === p.supplier_id);
        
        return {
          id: p.id,
          name: p.name,
          description: p.description,
          supplier_price: p.supplier_price,
          finance_price: p.finance_price,
          created_at: p.created_at,
          image_url: image?.image_url || '',
          supplier_name: profile?.full_name || 'N/A',
          supplier_email: profile?.email || 'N/A',
          stock_quantity: p.stock_quantity || 0,
        };
      });

      setProducts(transformedData);
    } catch (err) {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updatePrice = async (productId: string, newPrice: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('products')
      .update({ 
        finance_price: newPrice,
        price: newPrice,
        finance_status: 'approved',
        approval_status: 'approved',
        finance_approved_at: new Date().toISOString(),
        finance_approved_by: user?.id
      })
      .eq('id', productId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update price', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Price updated! Product is now live for customers.' });
      setProducts(prev => prev.filter(p => p.id !== productId));
    }
  };

  if (loading) return <Layout><div className="container py-8">Loading...</div></Layout>;
  if (!isFinance) return null;

  return (
    <Layout>
      <div className="container py-4 px-4 sm:py-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
          <DollarSign className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold">Finance Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-card rounded-lg border p-4 sm:p-6">
            <Package className="h-6 w-6 sm:h-8 sm:w-8 text-primary mb-2" />
            <h3 className="font-semibold text-xl sm:text-2xl">{products.length}</h3>
            <p className="text-sm sm:text-base text-muted-foreground">Pending Products</p>
          </div>
          <div className="bg-card rounded-lg border p-4 sm:p-6">
            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 mb-2" />
            <h3 className="font-semibold text-xl sm:text-2xl">0</h3>
            <p className="text-sm sm:text-base text-muted-foreground">Approved Today</p>
          </div>
          <div className="bg-card rounded-lg border p-4 sm:p-6 sm:col-span-2 md:col-span-1">
            <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 mb-2" />
            <h3 className="font-semibold text-xl sm:text-2xl">₹0</h3>
            <p className="text-sm sm:text-base text-muted-foreground">Total Revenue</p>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6">Products Awaiting Price Approval</h2>
          
          {products.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 sm:py-8 text-sm sm:text-base">No products pending approval</p>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {products.map((product) => (
                <ProductPriceCard 
                  key={product.id} 
                  product={product} 
                  onUpdatePrice={updatePrice}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function ProductPriceCard({ 
  product, 
  onUpdatePrice 
}: { 
  product: Product; 
  onUpdatePrice: (id: string, price: number) => void;
}) {
  const [newPrice, setNewPrice] = useState(product.supplier_price?.toString() || '0');
  const [margin, setMargin] = useState(0);

  const calculateMargin = (price: number) => {
    const supplierPrice = product.supplier_price || 0;
    if (supplierPrice === 0) return 0;
    return ((price - supplierPrice) / supplierPrice * 100).toFixed(2);
  };

  const handlePriceChange = (value: string) => {
    setNewPrice(value);
    const price = parseFloat(value) || 0;
    setMargin(parseFloat(calculateMargin(price)));
  };

  return (
    <div className="border rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
      <img 
        src={product.image_url} 
        alt={product.name}
        className="w-full sm:w-20 md:w-24 h-40 sm:h-20 md:h-24 object-cover rounded"
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-base sm:text-lg break-words">{product.name}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">{product.description?.substring(0, 100)}...</p>
        <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 text-xs sm:text-sm">
          <span>Supplier: <strong>{product.supplier_name}</strong></span>
          <span>Supplier Price: <strong>{formatCurrency(product.supplier_price || 0)}</strong></span>
          <span>Stock: <strong>{product.stock_quantity}</strong></span>
        </div>
      </div>
      <div className="flex flex-col gap-2 w-full sm:w-auto sm:min-w-[180px] md:min-w-[200px]">
        <label className="text-xs sm:text-sm font-medium">Set Final Price</label>
        <input
          type="number"
          value={newPrice}
          onChange={(e) => handlePriceChange(e.target.value)}
          className="px-3 py-2 rounded-md border bg-background text-sm"
          placeholder="Enter price"
          step="0.01"
        />
        <div className="text-xs sm:text-sm">
          Margin: <span className={margin >= 0 ? 'text-green-600' : 'text-red-600'}>
            {margin}%
          </span>
        </div>
        <Button 
          onClick={() => onUpdatePrice(product.id, parseFloat(newPrice))}
          disabled={!newPrice || parseFloat(newPrice) <= 0}
          className="w-full text-sm"
        >
          Approve & Set Price
        </Button>
      </div>
    </div>
  );
}
