import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Categories from "./pages/Categories";
import CategoryDetail from "./pages/CategoryDetail";
import Offers from "./pages/Offers";
import NewArrivals from "./pages/NewArrivals";
import ContactUs from "./pages/ContactUs";
import AboutUs from "./pages/AboutUs";
import Brands from "./pages/Brands";
import BrandDetail from "./pages/BrandDetail";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import FinanceDashboard from "./pages/finance/Dashboard";
import AdminCreateFinance from "./pages/admin/CreateFinance";
import AdminFinanceUsers from "./pages/admin/FinanceUsers";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Orders from "./pages/Orders";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminBrands from "./pages/admin/Brands";
import AdminCategories from "./pages/admin/Categories";
import AdminSupplierApprovals from "./pages/admin/SupplierApprovals";
import AdminSupplierDetail from "./pages/admin/SupplierDetail";
import AdminProductApprovals from "./pages/admin/ProductApprovals";
import SupplierDashboard from "./pages/SupplierDashboard";
import SupplierPending from "./pages/SupplierPending";
import SupplierAddProduct from "./pages/supplier/AddProduct";
import SupplierEditProduct from "./pages/supplier/EditProduct";
import SupplierOrders from "./pages/supplier/Orders";
import SupplierNewOrders from "./pages/supplier/NewOrders";
import OrderTracking from "./pages/OrderTracking";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ScrollToTop } from "./components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/products" element={<Products />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/category/:slug" element={<CategoryDetail />} />
              <Route path="/offers" element={<Offers />} />
              <Route path="/new-arrivals" element={<NewArrivals />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/brands" element={<Brands />} />
              <Route path="/brands/:slug" element={<BrandDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/admin/finance-users" element={<ProtectedRoute requireAdmin><AdminFinanceUsers /></ProtectedRoute>} />
              <Route path="/admin/create-finance" element={<ProtectedRoute requireAdmin><AdminCreateFinance /></ProtectedRoute>} />
              <Route path="/finance" element={<FinanceDashboard />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/order-tracking/:orderId" element={<OrderTracking />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/products" element={<ProtectedRoute requireAdmin><AdminProducts /></ProtectedRoute>} />
              <Route path="/admin/brands" element={<ProtectedRoute requireAdmin><AdminBrands /></ProtectedRoute>} />
              <Route path="/admin/categories" element={<ProtectedRoute requireAdmin><AdminCategories /></ProtectedRoute>} />
              <Route path="/admin/suppliers" element={<ProtectedRoute requireAdmin><AdminSupplierApprovals /></ProtectedRoute>} />
              <Route path="/admin/suppliers/:id" element={<ProtectedRoute requireAdmin><AdminSupplierDetail /></ProtectedRoute>} />
              <Route path="/admin/product-approvals" element={<ProtectedRoute requireAdmin><AdminProductApprovals /></ProtectedRoute>} />
              <Route path="/supplier" element={<ProtectedRoute requireSupplier><SupplierDashboard /></ProtectedRoute>} />
              <Route path="/supplier-pending" element={<ProtectedRoute requireSupplier><SupplierPending /></ProtectedRoute>} />
              <Route path="/supplier/add-product" element={<ProtectedRoute requireSupplier><SupplierAddProduct /></ProtectedRoute>} />
              <Route path="/supplier/edit-product/:id" element={<ProtectedRoute requireSupplier><SupplierEditProduct /></ProtectedRoute>} />
              <Route path="/supplier/orders" element={<ProtectedRoute requireSupplier><SupplierOrders /></ProtectedRoute>} />
              <Route path="/supplier/new-orders" element={<ProtectedRoute requireSupplier><SupplierNewOrders /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
