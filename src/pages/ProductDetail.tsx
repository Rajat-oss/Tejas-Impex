import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProduct();
    if (user) checkWishlist();
  }, [id, user]);

  const loadProduct = async () => {
    const { data } = await supabase
      .from('products')
      .select(`
        *,
        product_images(image_url),
        brands(name),
        categories(name)
      `)
      .eq('id', id)
      .single();
    
    if (data) setProduct(data);
    setLoading(false);
  };

  const checkWishlist = async () => {
    const { data } = await supabase
      .from('wishlist')
      .select('id')
      .match({ user_id: user?.id, product_id: id })
      .maybeSingle();
    
    setIsInWishlist(!!data);
  };

  const toggleWishlist = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (isInWishlist) {
      await supabase.from('wishlist').delete().match({ user_id: user.id, product_id: id });
      setIsInWishlist(false);
      toast({ title: 'Removed from wishlist' });
    } else {
      await supabase.from('wishlist').insert({ user_id: user.id, product_id: id });
      setIsInWishlist(true);
      toast({ title: 'Added to wishlist' });
    }
  };

  const addToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    const { error } = await supabase.from('cart').insert({
      user_id: user.id,
      product_id: id,
      quantity: 1,
    });
    if (error && error.code === '23505') {
      toast({ title: 'Already in cart' });
    } else if (!error) {
      toast({ title: 'Added to cart' });
    }
  };

  if (loading) return <Layout><div className="container py-8">Loading...</div></Layout>;
  if (!product) return <Layout><div className="container py-8">Product not found</div></Layout>;

  return (
    <Layout>
      <div className="container py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            {product.product_images?.[0]?.image_url ? (
              <img
                src={product.product_images[0].image_url}
                alt={product.name}
                className="w-full aspect-square object-cover rounded-lg"
              />
            ) : (
              <div className="w-full aspect-square bg-secondary rounded-lg" />
            )}
          </div>
          
          <div>
            <h1 className="font-display text-4xl font-bold mb-2">{product.name}</h1>
            {product.brands && (
              <p className="text-muted-foreground mb-4">by {product.brands.name}</p>
            )}
            
            <div className="flex items-center gap-4 mb-6">
              <p className="text-4xl font-bold text-primary">₹{product.price}</p>
              {product.discount_percent > 0 && (
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-semibold">
                  {product.discount_percent}% OFF
                </span>
              )}
            </div>

            {product.description && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Description</h2>
                <p className="text-muted-foreground">{product.description}</p>
              </div>
            )}

            {product.categories && (
              <p className="text-sm text-muted-foreground mb-4">
                Category: {product.categories.name}
              </p>
            )}

            <div className="flex items-center gap-2 mb-4">
              <span className={`px-3 py-1 rounded text-sm font-semibold ${
                product.stock_quantity > 0 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {product.stock_quantity > 0 ? `In Stock (${product.stock_quantity})` : 'Out of Stock'}
              </span>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={addToCart}
                disabled={product.stock_quantity === 0}
                className="flex-1"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
              <Button
                variant="outline"
                onClick={toggleWishlist}
              >
                <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
