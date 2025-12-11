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
import Offers from "./pages/Offers";
import NewArrivals from "./pages/NewArrivals";
import ContactUs from "./pages/ContactUs";
import Brands from "./pages/Brands";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Orders from "./pages/Orders";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminSupplierApprovals from "./pages/admin/SupplierApprovals";
import SupplierDashboard from "./pages/SupplierDashboard";
import SupplierPending from "./pages/SupplierPending";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/products" element={<Products />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/offers" element={<Offers />} />
              <Route path="/new-arrivals" element={<NewArrivals />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/brands" element={<Brands />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/products" element={<ProtectedRoute requireAdmin><AdminProducts /></ProtectedRoute>} />
              <Route path="/admin/suppliers" element={<ProtectedRoute requireAdmin><AdminSupplierApprovals /></ProtectedRoute>} />
              <Route path="/supplier" element={<ProtectedRoute requireSupplier><SupplierDashboard /></ProtectedRoute>} />
              <Route path="/supplier-pending" element={<ProtectedRoute requireSupplier><SupplierPending /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
