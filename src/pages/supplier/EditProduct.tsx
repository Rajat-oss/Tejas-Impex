import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload } from 'lucide-react';
import type { Category, Brand } from '@/types';

export default function EditProduct() {
  const { id } = useParams();
  const { user, isSupplier } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'INR',
    stock_quantity: '',
    category_id: '',
    brand_id: '',
    sku: '',
    weight: '',
    discount_percent: '0'
  });

  useEffect(() => {
    if (!isSupplier) {
      navigate('/login');
      return;
    }
    loadProduct();
    loadCategoriesAndBrands();
  }, [isSupplier, navigate, id]);

  const loadProduct = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*, images:product_images(*)')
      .eq('id', id)
      .eq('supplier_id', user?.id)
      .single();

    if (error || !data) {
      toast({ title: 'Error', description: 'Product not found', variant: 'destructive' });
      navigate('/supplier');
      return;
    }

    setFormData({
      name: data.name,
      description: data.description || '',
      price: data.price.toString(),
      currency: data.currency || 'INR',
      stock_quantity: data.stock_quantity.toString(),
      category_id: data.category_id || '',
      brand_id: data.brand_id || '',
      sku: data.sku || '',
      weight: data.weight || '',
      discount_percent: data.discount_percent.toString()
    });
    
    if (data.images?.[0]?.image_url) {
      setImagePreview(data.images[0].image_url);
    }
  };

  const loadCategoriesAndBrands = async () => {
    const [categoriesRes, brandsRes] = await Promise.all([
      supabase.from('categories').select('*').eq('is_active', true).order('name'),
      supabase.from('brands').select('*').eq('is_active', true).order('name')
    ]);
    
    if (categoriesRes.data) setCategories(categoriesRes.data);
    if (brandsRes.data) setBrands(brandsRes.data);
  };

  const handleImageUpload = (file: File | null) => {
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${id}-${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file);

    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: formData.name,
          description: formData.description || null,
          price: parseFloat(formData.price),
          currency: formData.currency,
          stock_quantity: parseInt(formData.stock_quantity),
          category_id: formData.category_id || null,
          brand_id: formData.brand_id || null,
          weight: formData.weight || null,
          discount_percent: parseInt(formData.discount_percent)
        })
        .eq('id', id);

      if (error) throw error;

      if (image) {
        const imageUrl = await uploadImage(image);
        await supabase.from('product_images').delete().eq('product_id', id);
        await supabase.from('product_images').insert({
          product_id: id,
          image_url: imageUrl,
          sort_order: 0
        });
      }

      toast({ title: 'Success', description: 'Product updated successfully!' });
      navigate('/supplier');
    } catch (error: any) {
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

        <h1 className="font-display text-3xl font-bold mb-6">Edit Product</h1>

        <form onSubmit={handleSubmit}>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full border-collapse">
              <thead className="bg-muted">
                <tr>
                  <th className="border p-2 text-left text-sm font-medium">Field</th>
                  <th className="border p-2 text-left text-sm font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-2 font-medium">Name *</td>
                  <td className="border p-1">
                    <input
                      type="text"
                      className="w-full px-2 py-1 border-0 focus:ring-1 focus:ring-primary rounded"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </td>
                </tr>

                <tr>
                  <td className="border p-2 font-medium">Price *</td>
                  <td className="border p-1">
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-2 py-1 border-0 focus:ring-1 focus:ring-primary rounded"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border p-2 font-medium">Currency *</td>
                  <td className="border p-1">
                    <select
                      className="w-full px-2 py-1 border-0 focus:ring-1 focus:ring-primary rounded"
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="RMB">RMB (¥)</option>
                    </select>
                  </td>
                </tr>
                <tr>
                  <td className="border p-2 font-medium">Stock Quantity *</td>
                  <td className="border p-1">
                    <input
                      type="number"
                      className="w-full px-2 py-1 border-0 focus:ring-1 focus:ring-primary rounded"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      required
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border p-2 font-medium">Category</td>
                  <td className="border p-1">
                    <select
                      className="w-full px-2 py-1 border-0 focus:ring-1 focus:ring-primary rounded"
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
                <tr>
                  <td className="border p-2 font-medium">Brand</td>
                  <td className="border p-1">
                    <select
                      className="w-full px-2 py-1 border-0 focus:ring-1 focus:ring-primary rounded"
                      value={formData.brand_id}
                      onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                    >
                      <option value="">Select Brand</option>
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>

                <tr>
                  <td className="border p-2 font-medium">Weight</td>
                  <td className="border p-1">
                    <input
                      type="text"
                      className="w-full px-2 py-1 border-0 focus:ring-1 focus:ring-primary rounded"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border p-2 font-medium">Discount (%)</td>
                  <td className="border p-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="w-full px-2 py-1 border-0 focus:ring-1 focus:ring-primary rounded"
                      value={formData.discount_percent}
                      onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border p-2 font-medium">Image</td>
                  <td className="border p-2">
                    <div className="flex items-center gap-4">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp,image/svg+xml"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e.target.files?.[0] || null)}
                        />
                        <div className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
                          <Upload className="h-4 w-4" />
                          {imagePreview ? 'Change Image' : 'Upload Image'}
                        </div>
                      </label>
                      {imagePreview && (
                        <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded border" />
                      )}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating Product...' : 'Update Product'}
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
