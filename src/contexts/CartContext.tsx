import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { CartItem, Product } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface LocalCartItem {
  productId: string;
  quantity: number;
  product?: Product;
}

interface CartContextType {
  items: CartItem[] | LocalCartItem[];
  itemCount: number;
  total: number;
  isLoading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_CART_KEY = 'tejasimpex_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<CartItem[] | LocalCartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch cart items
  const fetchCart = async () => {
    if (user) {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('cart')
        .select(`
          *,
          product:products(
            *,
            brand:brands(*),
            images:product_images(*)
          )
        `)
        .eq('user_id', user.id);
      
      if (!error && data) {
        setItems(data as unknown as CartItem[]);
      }
      setIsLoading(false);
    } else {
      // Load from localStorage for guests
      const localCart = localStorage.getItem(LOCAL_CART_KEY);
      if (localCart) {
        const parsed = JSON.parse(localCart) as LocalCartItem[];
        // Fetch product details for local cart
        if (parsed.length > 0) {
          const productIds = parsed.map(item => item.productId);
          const { data: products } = await supabase
            .from('products')
            .select(`
              *,
              brand:brands(*),
              images:product_images(*)
            `)
            .in('id', productIds);
          
          if (products) {
            const itemsWithProducts = parsed.map(item => ({
              ...item,
              product: products.find(p => p.id === item.productId) as Product,
            }));
            setItems(itemsWithProducts);
          }
        }
      }
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const addToCart = async (productId: string, quantity = 1) => {
    if (user) {
      // Check if already in cart
      const { data: existing } = await supabase
        .from('cart')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .single();
      
      if (existing) {
        await supabase
          .from('cart')
          .update({ quantity: existing.quantity + quantity })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('cart')
          .insert({ user_id: user.id, product_id: productId, quantity });
      }
    } else {
      // Local storage for guests
      const localCart = localStorage.getItem(LOCAL_CART_KEY);
      const parsed: LocalCartItem[] = localCart ? JSON.parse(localCart) : [];
      const existingIndex = parsed.findIndex(item => item.productId === productId);
      
      if (existingIndex >= 0) {
        parsed[existingIndex].quantity += quantity;
      } else {
        parsed.push({ productId, quantity });
      }
      
      localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(parsed));
    }
    
    await fetchCart();
    toast({
      title: "Added to cart",
      description: "Product has been added to your cart.",
    });
  };

  const removeFromCart = async (productId: string) => {
    if (user) {
      await supabase
        .from('cart')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);
    } else {
      const localCart = localStorage.getItem(LOCAL_CART_KEY);
      if (localCart) {
        const parsed: LocalCartItem[] = JSON.parse(localCart);
        const filtered = parsed.filter(item => item.productId !== productId);
        localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(filtered));
      }
    }
    
    await fetchCart();
    toast({
      title: "Removed from cart",
      description: "Product has been removed from your cart.",
    });
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }
    
    if (user) {
      await supabase
        .from('cart')
        .update({ quantity })
        .eq('user_id', user.id)
        .eq('product_id', productId);
    } else {
      const localCart = localStorage.getItem(LOCAL_CART_KEY);
      if (localCart) {
        const parsed: LocalCartItem[] = JSON.parse(localCart);
        const index = parsed.findIndex(item => item.productId === productId);
        if (index >= 0) {
          parsed[index].quantity = quantity;
          localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(parsed));
        }
      }
    }
    
    await fetchCart();
  };

  const clearCart = async () => {
    if (user) {
      await supabase
        .from('cart')
        .delete()
        .eq('user_id', user.id);
    } else {
      localStorage.removeItem(LOCAL_CART_KEY);
    }
    
    setItems([]);
  };

  const itemCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  
  const total = items.reduce((sum, item) => {
    const product = 'product' in item ? item.product : null;
    if (!product) return sum;
    const price = product.price * (1 - (product.discount_percent || 0) / 100);
    return sum + price * (item.quantity || 0);
  }, 0);

  return (
    <CartContext.Provider value={{
      items,
      itemCount,
      total,
      isLoading,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
