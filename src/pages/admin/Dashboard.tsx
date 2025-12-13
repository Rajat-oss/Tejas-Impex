import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Package, ShoppingBag, Users, BarChart, UserCheck, Tag, FolderTree } from 'lucide-react';

export default function AdminDashboard() {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, isLoading, navigate]);

  if (isLoading) return <Layout><div className="container py-8">Loading...</div></Layout>;
  if (!isAdmin) return null;

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="font-display text-4xl font-bold mb-8">Admin Dashboard</h1>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-lg border p-6">
            <Package className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-semibold text-2xl">0</h3>
            <p className="text-muted-foreground">Total Products</p>
          </div>
          <div className="bg-card rounded-lg border p-6">
            <ShoppingBag className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-semibold text-2xl">0</h3>
            <p className="text-muted-foreground">Total Orders</p>
          </div>
          <div className="bg-card rounded-lg border p-6">
            <Users className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-semibold text-2xl">0</h3>
            <p className="text-muted-foreground">Total Users</p>
          </div>
          <div className="bg-card rounded-lg border p-6">
            <BarChart className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-semibold text-2xl">₹0</h3>
            <p className="text-muted-foreground">Total Revenue</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/admin/products" className="bg-card rounded-lg border p-6 hover:border-primary transition-colors">
            <Package className="h-6 w-6 text-primary mb-2" />
            <h3 className="font-semibold text-xl mb-2">Manage Products</h3>
            <p className="text-muted-foreground">Add, edit, or remove products</p>
          </Link>
          <Link to="/admin/brands" className="bg-card rounded-lg border p-6 hover:border-primary transition-colors">
            <Tag className="h-6 w-6 text-primary mb-2" />
            <h3 className="font-semibold text-xl mb-2">Manage Brands</h3>
            <p className="text-muted-foreground">Add, edit, or remove brands</p>
          </Link>
          <Link to="/admin/categories" className="bg-card rounded-lg border p-6 hover:border-primary transition-colors">
            <FolderTree className="h-6 w-6 text-primary mb-2" />
            <h3 className="font-semibold text-xl mb-2">Manage Categories</h3>
            <p className="text-muted-foreground">Add, edit, or remove categories</p>
          </Link>
          <Link to="/admin/suppliers" className="bg-card rounded-lg border p-6 hover:border-primary transition-colors">
            <UserCheck className="h-6 w-6 text-primary mb-2" />
            <h3 className="font-semibold text-xl mb-2">Supplier Approvals</h3>
            <p className="text-muted-foreground">Approve or reject supplier requests</p>
          </Link>
          <Link to="/admin/product-approvals" className="bg-card rounded-lg border p-6 hover:border-primary transition-colors">
            <Package className="h-6 w-6 text-primary mb-2" />
            <h3 className="font-semibold text-xl mb-2">Product Approvals</h3>
            <p className="text-muted-foreground">Review and approve supplier products</p>
          </Link>
          <div className="bg-card rounded-lg border p-6 opacity-50">
            <ShoppingBag className="h-6 w-6 text-muted-foreground mb-2" />
            <h3 className="font-semibold text-xl mb-2">Manage Orders</h3>
            <p className="text-muted-foreground">View and update order status</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
