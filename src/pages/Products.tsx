import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { getCurrencySymbol } from '@/lib/currency';

export default function Products() {
  const { user, isAdmin, isSupplier, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      loadProducts();
      if (user) loadWishlistIds();
    }
  }, [user, isAdmin, authLoading]);

  const loadProducts = async () => {
    // RLS policies handle filtering:
    // - Admins see all products
    // - Public sees only approved INR products
    const { data } = await supabase
      .from('products')
      .select(`
        *,
        product_images(image_url)
      `)
      .eq('is_active', true)
      .eq('approval_status', 'approved')
      .order('created_at', { ascending: false });
    
    if (data) setProducts(data);
    setLoading(false);
  };

  const loadWishlistIds = async () => {
    const { data } = await supabase
      .from('wishlist')
      .select('product_id')
      .eq('user_id', user?.id);
    
    if (data) setWishlistIds(new Set(data.map(item => item.product_id)));
  };

  const addToCart = async (productId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    const { error } = await supabase.from('cart').insert({
      user_id: user.id,
      product_id: productId,
      quantity: 1,
    });
    if (error && error.code === '23505') {
      toast({ title: 'Already in cart' });
    } else if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Added to cart' });
    }
  };

  const toggleWishlist = async (productId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (wishlistIds.has(productId)) {
      await supabase.from('wishlist').delete().match({
        user_id: user.id,
        product_id: productId,
      });
      setWishlistIds(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      toast({ title: 'Removed from wishlist' });
    } else {
      const { error } = await supabase.from('wishlist').insert({
        user_id: user.id,
        product_id: productId,
      });
      if (!error) {
        setWishlistIds(prev => new Set(prev).add(productId));
        toast({ title: 'Added to wishlist' });
      }
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-8">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="font-display text-4xl font-bold mb-6">Products</h1>
        {products.length === 0 ? (
          <p className="text-muted-foreground">No products available yet.</p>
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-card rounded-lg border p-4 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
                {product.product_images?.[0]?.image_url ? (
                  <img
                    src={product.product_images[0].image_url}
                    alt={product.name}
                    className="aspect-square object-cover rounded-md mb-4"
                  />
                ) : (
                  <div className="aspect-square bg-secondary rounded-md mb-4" />
                )}
                <h3 className="font-semibold mb-2">{product.name}</h3>
                <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                  {product.description || 'Premium imported product'}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-primary">
                      {getCurrencySymbol(product.currency)}{product.admin_price || product.price}
                    </p>
                    {isAdmin && (
                      <div className="flex flex-col gap-1">
                        {product.admin_price && (
                          <p className="text-xs text-muted-foreground line-through">
                            Supplier: {getCurrencySymbol(product.currency)}{product.price}
                          </p>
                        )}
                        {product.currency !== 'INR' && (
                          <Badge variant="outline" className="text-xs">{product.currency}</Badge>
                        )}
                      </div>
                    )}
                  </div>
                  {!isSupplier && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
                    >
                      <Heart className={`h-4 w-4 ${wishlistIds.has(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                  )}
                </div>
                {!isSupplier && (
                  product.stock_quantity > 0 ? (
                    <Button size="sm" className="w-full mt-2" onClick={(e) => { e.stopPropagation(); addToCart(product.id); }}>Add to Cart</Button>
                  ) : (
                    <span className="text-sm text-muted-foreground block text-center mt-2">Out of Stock</span>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
