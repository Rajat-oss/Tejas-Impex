import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, Upload } from 'lucide-react';
import type { Category, Brand } from '@/types';

interface ProductRow {
  id: string;
  name: string;
  category_id: string;
  brand_id: string;
  weight: string;
  sku: string;
  stock_quantity: string;
  price: string;
  currency: string;
  discount_percent: string;
  image: File | null;
  imagePreview: string;
}

export default function AddProduct() {
  const { user, isSupplier } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([
    { id: crypto.randomUUID(), name: '', category_id: '', brand_id: '', weight: '', sku: '', stock_quantity: '', price: '', currency: 'INR', discount_percent: '0', image: null, imagePreview: '' }
  ]);

  const skuOptions = ['PCS', 'KG', 'GM', 'LTR', 'MTR', 'BOX', 'CTN', 'SET', 'PAIR', 'DOZEN'];

  useEffect(() => {
    if (!isSupplier) {
      navigate('/login');
      return;
    }
    loadCategoriesAndBrands();
  }, [isSupplier, navigate]);

  const loadCategoriesAndBrands = async () => {
    const [categoriesRes, brandsRes] = await Promise.all([
      supabase.from('categories').select('*').eq('is_active', true).order('name'),
      supabase.from('brands').select('*').eq('is_active', true).order('name')
    ]);
    
    if (categoriesRes.data) setCategories(categoriesRes.data);
    if (brandsRes.data) setBrands(brandsRes.data);
  };

  const addRow = () => {
    setProducts([...products, { id: crypto.randomUUID(), name: '', category_id: '', brand_id: '', weight: '', sku: '', stock_quantity: '', price: '', currency: 'INR', discount_percent: '0', image: null, imagePreview: '' }]);
  };

  const removeRow = (id: string) => {
    if (products.length > 1) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const updateProduct = (id: string, field: keyof ProductRow, value: any) => {
    setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const calculateTotal = (product: ProductRow) => {
    const price = parseFloat(product.price) || 0;
    const quantity = parseInt(product.stock_quantity) || 0;
    const discount = parseInt(product.discount_percent) || 0;
    const subtotal = price * quantity;
    const discountAmount = (subtotal * discount) / 100;
    const total = subtotal - discountAmount;
    return { subtotal, total, hasDiscount: discount > 0 };
  };

  const handleImageUpload = (id: string, file: File | null) => {
    if (file) {
      console.log('📸 Image selected:', file.name, 'Size:', file.size);
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log('✅ Image loaded to preview');
        setProducts(prev => prev.map(p => 
          p.id === id 
            ? { ...p, image: file, imagePreview: reader.result as string }
            : p
        ));
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImageToStorage = async (file: File, productId: string): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${productId}.${fileExt}`;
      
      console.log('📸 Uploading:', fileName, 'Size:', file.size, 'Type:', file.type);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('❌ Storage upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      
      console.log('✅ Upload success:', uploadData);
      
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      console.log('🔗 Public URL:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (err: any) {
      console.error('❌ Upload exception:', err);
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      for (const product of products) {
        if (!product.name || !product.price || !product.stock_quantity || !product.sku) {
          toast({ title: 'Error', description: 'Please fill all required fields (Name, SKU, Quantity, Price)', variant: 'destructive' });
          setLoading(false);
          return;
        }

        console.log('🚀 Creating product:', product.name);
        const slug = `${product.name}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert({
            name: product.name,
            slug,
            sku: product.sku || null,
            price: parseFloat(product.price),
            currency: product.currency,
            stock_quantity: parseInt(product.stock_quantity),
            category_id: product.category_id || null,
            brand_id: product.brand_id || null,
            weight: product.weight || null,
            discount_percent: parseInt(product.discount_percent),
            supplier_id: user?.id,
            is_active: true,
            approval_status: 'pending'
          })
          .select()
          .single();

        if (error) {
          console.error('❌ Product insert error:', error);
          throw error;
        }

        console.log('✅ Product created:', newProduct.id);

        console.log('🔍 Checking image:', product.image ? 'YES' : 'NO', product.image);
        
        if (product.image && newProduct) {
          console.log('📸 Has image, uploading...');
          try {
            const imageUrl = await uploadImageToStorage(product.image, newProduct.id);
            console.log('✅ Image uploaded:', imageUrl);
            console.log('💾 Inserting to product_images table...');
            
            const { data: imageData, error: imageError } = await supabase
              .from('product_images')
              .insert({
                product_id: newProduct.id,
                image_url: imageUrl,
                sort_order: 0
              })
              .select();
            
            if (imageError) {
              console.error('❌ Image DB insert error:', imageError);
              toast({ title: 'Warning', description: `Product added but image failed: ${imageError.message}` });
            } else {
              console.log('✅ Image saved to DB:', imageData);
            }
          } catch (imgErr: any) {
            console.error('❌ Image upload exception:', imgErr);
            toast({ title: 'Warning', description: `Product added but image failed: ${imgErr.message}` });
          }
        } else {
          console.log('ℹ️ No image for this product');
        }
      }

      toast({ title: 'Success', description: `${products.length} product(s) added successfully!` });
      navigate('/supplier');
    } catch (error: any) {
      console.error('❌ Submit error:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container py-8">
        <Button variant="ghost" onClick={() => navigate('/supplier')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex justify-between items-center mb-6">
          <h1 className="font-display text-3xl font-bold">Add Products</h1>
          <Button onClick={addRow} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Row
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full border-collapse">
              <thead className="bg-muted">
                <tr>
                  <th className="border p-2 text-left text-sm font-medium min-w-[150px]">Name *</th>
                  {categories.length > 0 && <th className="border p-2 text-left text-sm font-medium min-w-[120px]">Category</th>}
                  {brands.length > 0 && <th className="border p-2 text-left text-sm font-medium min-w-[120px]">Brand</th>}
                  <th className="border p-2 text-left text-sm font-medium min-w-[80px]">Weight (per)</th>
                  <th className="border p-2 text-left text-sm font-medium min-w-[80px]">Quantity *</th>
                  <th className="border p-2 text-left text-sm font-medium min-w-[80px]">SKU *</th>
                  <th className="border p-2 text-left text-sm font-medium min-w-[100px]">Price (per) *</th>
                  <th className="border p-2 text-left text-sm font-medium min-w-[80px]">Discount%</th>
                  <th className="border p-2 text-left text-sm font-medium min-w-[120px]">Image</th>
                  <th className="border p-2 text-center text-sm font-medium w-[50px]">Action</th>
                  <th className="border p-2 text-left text-sm font-medium min-w-[120px]">Total</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="border p-1">
                      <input
                        type="text"
                        className="w-full px-2 py-1 border-0 focus:ring-1 focus:ring-primary rounded"
                        value={product.name}
                        onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                        required
                      />
                    </td>
                    {categories.length > 0 && (
                      <td className="border p-1">
                        <select
                          className="w-full px-2 py-1 border-0 focus:ring-1 focus:ring-primary rounded"
                          value={product.category_id}
                          onChange={(e) => updateProduct(product.id, 'category_id', e.target.value)}
                        >
                          <option value="">Select</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </td>
                    )}
                    {brands.length > 0 && (
                      <td className="border p-1">
                        <select
                          className="w-full px-2 py-1 border-0 focus:ring-1 focus:ring-primary rounded"
                          value={product.brand_id}
                          onChange={(e) => updateProduct(product.id, 'brand_id', e.target.value)}
                        >
                          <option value="">Select</option>
                          {brands.map((brand) => (
                            <option key={brand.id} value={brand.id}>{brand.name}</option>
                          ))}
                        </select>
                      </td>
                    )}
                    <td className="border p-1">
                      <input
                        type="text"
                        className="w-full px-2 py-1 border-0 focus:ring-1 focus:ring-primary rounded"
                        value={product.weight}
                        onChange={(e) => updateProduct(product.id, 'weight', e.target.value)}
                      />
                    </td>
                    <td className="border p-1">
                      <input
                        type="number"
                        className="w-full px-2 py-1 border-0 focus:ring-1 focus:ring-primary rounded"
                        value={product.stock_quantity}
                        onChange={(e) => updateProduct(product.id, 'stock_quantity', e.target.value)}
                        required
                      />
                    </td>
                    <td className="border p-1">
                      <select
                        className="w-full px-2 py-1 border-0 focus:ring-1 focus:ring-primary rounded"
                        value={product.sku}
                        onChange={(e) => updateProduct(product.id, 'sku', e.target.value)}
                        required
                      >
                        <option value="">Select</option>
                        {skuOptions.map((sku) => (
                          <option key={sku} value={sku}>{sku}</option>
                        ))}
                      </select>
                    </td>
                    <td className="border p-1">
                      <div className="flex gap-1">
                        <input
                          type="number"
                          step="0.01"
                          className="w-full px-2 py-1 border-0 focus:ring-1 focus:ring-primary rounded"
                          value={product.price}
                          onChange={(e) => updateProduct(product.id, 'price', e.target.value)}
                          required
                        />
                        <select
                          className="px-1 py-1 border-0 focus:ring-1 focus:ring-primary rounded text-xs"
                          value={product.currency}
                          onChange={(e) => updateProduct(product.id, 'currency', e.target.value)}
                        >
                          <option value="INR">INR</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="RMB">RMB</option>
                        </select>
                      </div>
                    </td>
                    <td className="border p-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-full px-2 py-1 border-0 focus:ring-1 focus:ring-primary rounded"
                        value={product.discount_percent}
                        onChange={(e) => updateProduct(product.id, 'discount_percent', e.target.value)}
                      />
                    </td>
                    <td className="border p-1">
                      <div className="flex flex-col gap-1">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp,image/svg+xml"
                            className="hidden"
                            onChange={(e) => handleImageUpload(product.id, e.target.files?.[0] || null)}
                          />
                          <div className="flex items-center gap-1 text-xs text-primary hover:underline">
                            <Upload className="h-3 w-3" />
                            {product.image ? 'Change' : 'Upload'}
                          </div>
                        </label>
                        {product.imagePreview && (
                          <img src={product.imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded border" />
                        )}
                      </div>
                    </td>
                    <td className="border p-1 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRow(product.id)}
                        disabled={products.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                    <td className="border p-1">
                      {(() => {
                        const { subtotal, total, hasDiscount } = calculateTotal(product);
                        return (
                          <div className="text-sm px-2 py-1">
                            {hasDiscount && (
                              <div className="text-gray-400 line-through text-xs">
                                {product.currency} {subtotal.toFixed(2)}
                              </div>
                            )}
                            <div className="font-semibold">
                              {product.currency} {total.toFixed(2)}
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding Products...' : `Add ${products.length} Product(s)`}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/supplier')}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
