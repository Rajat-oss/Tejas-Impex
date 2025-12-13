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
      <div className="w-full max-w-full overflow-x-hidden">
        {/* Mobile Layout */}
        <div className="lg:hidden">
          {/* Product Image */}
          <div className="bg-white">
            {product.product_images?.[0]?.image_url ? (
              <img
                src={product.product_images[0].image_url}
                alt={product.name}
                className="w-full aspect-square object-contain"
              />
            ) : (
              <div className="w-full aspect-square bg-secondary" />
            )}
          </div>

          {/* Product Info */}
          <div className="bg-white px-4 py-3 space-y-3">
            {/* Brand */}
            {product.brands && (
              <p className="text-xs text-muted-foreground uppercase">{product.brands.name}</p>
            )}
            
            {/* Product Name */}
            <h1 className="text-base font-medium leading-tight">{product.name}</h1>
            
            {/* Rating & Reviews - Placeholder */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-0.5 rounded text-xs">
                <span>4.3</span>
                <span>★</span>
              </div>
              <span className="text-xs text-muted-foreground">1,234 Ratings</span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-2">
              <p className="text-2xl font-semibold">₹{product.admin_price || product.price}</p>
              {product.discount_percent > 0 && (
                <>
                  <span className="text-sm text-muted-foreground line-through">₹{Math.round((product.admin_price || product.price) * 100 / (100 - product.discount_percent))}</span>
                  <span className="text-sm text-green-600 font-medium">{product.discount_percent}% off</span>
                </>
              )}
            </div>

            {/* Stock Status */}
            <div>
              <span className={`text-sm font-medium ${
                product.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="bg-white mt-2 px-4 py-3">
              <h2 className="text-sm font-semibold mb-2">Product Details</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Category */}
          {product.categories && (
            <div className="bg-white mt-2 px-4 py-3">
              <span className="text-xs text-muted-foreground">Category: </span>
              <span className="text-sm font-medium">{product.categories.name}</span>
            </div>
          )}

          {/* Similar Products */}
          {similarProducts.length > 0 && (
            <div className="bg-white mt-2 px-4 py-4">
              <h2 className="text-base font-semibold mb-3">Similar Products</h2>
              <div className="grid grid-cols-2 gap-3">
                {similarProducts.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-2 active:bg-secondary"
                    onClick={() => navigate(`/product/${item.id}`)}
                  >
                    {item.product_images?.[0]?.image_url ? (
                      <img
                        src={item.product_images[0].image_url}
                        alt={item.name}
                        className="w-full aspect-square object-cover rounded mb-2"
                      />
                    ) : (
                      <div className="w-full aspect-square bg-secondary rounded mb-2" />
                    )}
                    <h3 className="text-xs font-medium line-clamp-2 mb-1">{item.name}</h3>
                    <p className="text-sm font-semibold">₹{item.admin_price || item.price}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fixed Bottom Bar */}
          {!isSupplier && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-10">
              <div className="flex items-center gap-2 p-3">
                <Button
                  variant="outline"
                  onClick={toggleWishlist}
                  className="h-12 w-12 flex-shrink-0"
                >
                  <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
                <Button
                  onClick={addToCart}
                  disabled={product.stock_quantity === 0}
                  className="flex-1 h-12 text-base font-semibold"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  ADD TO CART
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:block container py-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="bg-card rounded-xl border p-6">
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
            
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-4xl font-bold mb-2">{product.name}</h1>
                {product.brands && (
                  <p className="text-base text-muted-foreground">by {product.brands.name}</p>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <p className="text-4xl font-bold text-primary">₹{product.admin_price || product.price}</p>
                {product.discount_percent > 0 && (
                  <span className="bg-red-100 text-red-800 px-3 py-1.5 rounded-lg text-sm font-semibold">
                    {product.discount_percent}% OFF
                  </span>
                )}
              </div>

              {product.description && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <h2 className="text-xl font-semibold mb-2">Description</h2>
                  <p className="text-base text-muted-foreground leading-relaxed">{product.description}</p>
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
                <div className="flex gap-3 pt-4">
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
                    className="h-12 w-12"
                    size="lg"
                  >
                    <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {similarProducts.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-bold mb-6">Similar Products</h2>
              <div className="grid grid-cols-4 gap-6">
                {similarProducts.map((item) => (
                  <div
                    key={item.id}
                    className="bg-card rounded-lg border p-4 hover:shadow-lg transition-all cursor-pointer group"
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
                    <h3 className="font-semibold text-base mb-2 line-clamp-2">{item.name}</h3>
                    <p className="font-bold text-primary text-base">₹{item.admin_price || item.price}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
