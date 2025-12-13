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
  const { user, isSupplier } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProduct();
    if (user) checkWishlist();
  }, [id, user]);

  useEffect(() => {
    if (product?.category_id) loadSimilarProducts();
  }, [product]);

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

  const loadSimilarProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select(`
        *,
        product_images(image_url)
      `)
      .eq('category_id', product.category_id)
      .eq('is_active', true)
      .neq('id', id)
      .limit(4);
    
    if (data) setSimilarProducts(data);
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
      <div className="container py-4 px-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <div className="bg-card rounded-xl border p-4 sm:p-6">
            {product.product_images?.[0]?.image_url ? (
              <img
                src={product.product_images[0].image_url}
                alt={product.name}
                className="w-full aspect-square object-cover rounded-lg shadow-md"
              />
            ) : (
              <div className="w-full aspect-square bg-secondary rounded-lg" />
            )}
          </div>
          
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">{product.name}</h1>
              {product.brands && (
                <p className="text-sm sm:text-base text-muted-foreground">by {product.brands.name}</p>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <p className="text-3xl sm:text-4xl font-bold text-primary">₹{product.admin_price || product.price}</p>
              {product.discount_percent > 0 && (
                <span className="bg-red-100 text-red-800 px-3 py-1.5 rounded-lg text-sm font-semibold">
                  {product.discount_percent}% OFF
                </span>
              )}
            </div>

            {product.description && (
              <div className="bg-muted/50 rounded-lg p-4">
                <h2 className="text-lg sm:text-xl font-semibold mb-2">Description</h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{product.description}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {product.categories && (
                <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-sm font-medium">
                  {product.categories.name}
                </span>
              )}
              <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                product.stock_quantity > 0 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {product.stock_quantity > 0 ? `In Stock (${product.stock_quantity})` : 'Out of Stock'}
              </span>
            </div>

            {!isSupplier && (
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  onClick={addToCart}
                  disabled={product.stock_quantity === 0}
                  className="flex-1 h-12 text-base"
                  size="lg"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  onClick={toggleWishlist}
                  className="h-12 sm:w-12"
                  size="lg"
                >
                  <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
              </div>
            )}
          </div>
        </div>

        {similarProducts.length > 0 && (
          <div className="mt-12 sm:mt-16">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Similar Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {similarProducts.map((item) => (
                <div
                  key={item.id}
                  className="bg-card rounded-lg border p-3 sm:p-4 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => navigate(`/product/${item.id}`)}
                >
                  {item.product_images?.[0]?.image_url ? (
                    <img
                      src={item.product_images[0].image_url}
                      alt={item.name}
                      className="aspect-square object-cover rounded-md mb-3 group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="aspect-square bg-secondary rounded-md mb-3" />
                  )}
                  <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2 line-clamp-2">{item.name}</h3>
                  <p className="font-bold text-primary text-sm sm:text-base">₹{item.admin_price || item.price}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
