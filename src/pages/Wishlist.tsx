import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Trash2, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

export default function Wishlist() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadWishlist();
    else setLoading(false);
  }, [user]);

  const loadWishlist = async () => {
    const { data } = await supabase
      .from('wishlist')
      .select(`
        *,
        products(*, product_images(image_url))
      `)
      .eq('user_id', user?.id);
    
    if (data) setWishlistItems(data);
    setLoading(false);
  };

  const removeItem = async (id: string) => {
    await supabase.from('wishlist').delete().eq('id', id);
    toast({ title: 'Removed from wishlist' });
    loadWishlist();
  };

  const moveToCart = async (item: any) => {
    const { error } = await supabase.from('cart').insert({
      user_id: user?.id,
      product_id: item.product_id,
      quantity: 1,
    });

    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Already in cart' });
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    } else {
      await removeItem(item.id);
      toast({ title: 'Moved to cart' });
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Please login to view your wishlist</h2>
          <Button asChild><Link to="/login">Login</Link></Button>
        </div>
      </Layout>
    );
  }

  if (loading) return <Layout><div className="container py-8">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="font-display text-4xl font-bold mb-6">My Wishlist</h1>
        {wishlistItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">Your wishlist is empty</p>
            <Button asChild><Link to="/products">Browse Products</Link></Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlistItems.map((item) => (
              <div key={item.id} className="bg-card rounded-lg border p-4">
                {item.products?.product_images?.[0]?.image_url ? (
                  <img src={item.products.product_images[0].image_url} alt={item.products.name} className="aspect-square object-cover rounded-md mb-4" />
                ) : (
                  <div className="aspect-square bg-secondary rounded-md mb-4" />
                )}
                <h3 className="font-semibold mb-2">{item.products?.name}</h3>
                <p className="text-primary font-bold mb-4">₹{item.products?.price}</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => moveToCart(item)} className="flex-1">
                    <ShoppingCart className="h-4 w-4 mr-1" /> Add to Cart
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => removeItem(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
