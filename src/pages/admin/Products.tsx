import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function AdminProducts() {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPrice, setEditingPrice] = useState<{ id: string; adminPrice: string } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    price: '',
    description: '',
    stock_quantity: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (!isLoading && !isAdmin) navigate('/');
    else loadProducts();
  }, [isAdmin, isLoading, navigate]);

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, product_images(image_url), profiles!products_supplier_id_fkey(full_name)')
      .order('created_at', { ascending: false });
    if (data) setProducts(data);
  };

  const updateAdminPrice = async (productId: string, adminPrice: string) => {
    const priceValue = adminPrice.trim() === '' ? null : parseFloat(adminPrice);
    const { error } = await supabase
      .from('products')
      .update({ admin_price: priceValue })
      .eq('id', productId);
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Admin price updated successfully' });
      setEditingPrice(null);
      loadProducts();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let imageUrl = null;
    if (imageFile) {
      const fileName = `${Date.now()}-${imageFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(fileName, imageFile);
      
      if (uploadError) {
        toast({ title: 'Error', description: 'Failed to upload image', variant: 'destructive' });
        return;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(fileName);
      imageUrl = publicUrl;
    }

    const { data: product, error } = await supabase.from('products').insert({
      ...formData,
      price: parseFloat(formData.price),
      stock_quantity: parseInt(formData.stock_quantity),
    }).select().single();

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    if (imageUrl && product) {
      await supabase.from('product_images').insert({
        product_id: product.id,
        image_url: imageUrl,
        sort_order: 0,
      });
    }

    toast({ title: 'Success', description: 'Product added successfully' });
    setShowForm(false);
    setFormData({ name: '', slug: '', price: '', description: '', stock_quantity: '' });
    setImageFile(null);
    loadProducts();
  };

  const handleDelete = async (id: string, name: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Product "${name}" deleted successfully` });
      loadProducts();
    }
  };

  if (isLoading) return <Layout><div className="container py-8">Loading...</div></Layout>;
  if (!isAdmin) return null;

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-display text-4xl font-bold">Manage Products</h1>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" /> Add Product
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card rounded-lg border p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Add New Product</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Product Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="px-4 py-2 rounded-md border bg-background"
                required
              />
              <input
                type="text"
                placeholder="Slug (e.g., product-name)"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="px-4 py-2 rounded-md border bg-background"
                required
              />
              <input
                type="number"
                placeholder="Price"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="px-4 py-2 rounded-md border bg-background"
                required
              />
              <input
                type="number"
                placeholder="Stock Quantity"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                className="px-4 py-2 rounded-md border bg-background"
                required
              />
            </div>
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 rounded-md border bg-background mt-4"
              rows={3}
            />
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Product Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 rounded-md border bg-background"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <Button type="submit">Add Product</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        )}

        <div className="bg-card rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left p-4">Image</th>
                <th className="text-left p-4">Name</th>
                <th className="text-left p-4">Supplier</th>
                <th className="text-left p-4">Supplier Price</th>
                <th className="text-left p-4">Admin Price</th>
                <th className="text-left p-4">Stock</th>
                <th className="text-left p-4">Status</th>
                <th className="text-right p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-t">
                  <td className="p-4">
                    {product.product_images?.[0]?.image_url ? (
                      <img
                        src={product.product_images[0].image_url}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-secondary rounded flex items-center justify-center text-xs text-muted-foreground">
                        No Image
                      </div>
                    )}
                  </td>
                  <td className="p-4">{product.name}</td>
                  <td className="p-4">
                    <span className="text-sm text-muted-foreground">
                      {product.profiles?.full_name || 'N/A'}
                    </span>
                  </td>
                  <td className="p-4">₹{product.price}</td>
                  <td className="p-4">
                    {editingPrice?.id === product.id ? (
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          step="0.01"
                          value={editingPrice.adminPrice}
                          onChange={(e) => setEditingPrice({ ...editingPrice, adminPrice: e.target.value })}
                          className="w-24 px-2 py-1 rounded border bg-background"
                          placeholder="Price"
                        />
                        <Button
                          size="sm"
                          onClick={() => updateAdminPrice(product.id, editingPrice.adminPrice)}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingPrice(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2 items-center">
                        <span className={product.admin_price ? 'font-bold text-primary' : 'text-muted-foreground'}>
                          {product.admin_price ? `₹${product.admin_price}` : 'Not set'}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingPrice({ id: product.id, adminPrice: product.admin_price?.toString() || '' })}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </td>
                  <td className="p-4">{product.stock_quantity}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      product.approval_status === 'approved' ? 'bg-green-100 text-green-800' :
                      product.approval_status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {product.approval_status || 'pending'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Product?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{product.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(product.id, product.name)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    No products yet. Add your first product!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
