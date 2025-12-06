import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Shield, Clock, Award } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';

const features = [
  { icon: Truck, title: 'Free Shipping', desc: 'On orders above ₹999' },
  { icon: Shield, title: '100% Authentic', desc: 'Genuine imported products' },
  { icon: Clock, title: 'Fast Delivery', desc: '3-5 business days' },
  { icon: Award, title: 'Premium Quality', desc: 'Curated selection' },
];

const featuredBrands = [
  { name: 'Lindt', country: 'Switzerland', desc: 'Premium Swiss chocolate' },
  { name: 'Ferrero', country: 'Italy', desc: 'Iconic Italian confectionery' },
  { name: 'Godiva', country: 'Belgium', desc: 'Luxury Belgian chocolates' },
  { name: 'Kelloggs', country: 'USA', desc: 'Breakfast cereals & snacks' },
];

const categories = [
  { name: 'Gourmet Food', slug: 'gourmet-food' },
  { name: 'Snacks', slug: 'snacks' },
  { name: 'Beverages', slug: 'beverages' },
  { name: 'Bakery', slug: 'bakery' },
  { name: 'Dairy', slug: 'dairy' },
  { name: 'Condiments', slug: 'condiments' },
];

export default function Index() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-primary py-20 lg:py-32">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=1920')] opacity-10 bg-cover bg-center" />
        <div className="container relative z-10">
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight">
              Premium Imported
              <span className="block text-accent">Gourmet Products</span>
            </h1>
            <p className="mt-6 text-lg text-primary-foreground/90 max-w-lg">
              Discover world-class brands and authentic international flavors delivered to your doorstep across India.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/products">
                  Shop Now <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10" asChild>
                <Link to="/brands">Explore Brands</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-card border-b">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Brands */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-3xl font-bold">Featured Brands</h2>
              <p className="text-muted-foreground mt-1">Discover premium international brands</p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/brands">View All</Link>
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredBrands.map((brand) => (
              <Link
                key={brand.name}
                to={`/brands/${brand.name.toLowerCase()}`}
                className="group p-6 bg-card rounded-lg border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300"
              >
                <div className="h-20 flex items-center justify-center mb-4 bg-secondary rounded-md">
                  <span className="font-display text-2xl font-bold text-primary">{brand.name}</span>
                </div>
                <h3 className="font-semibold group-hover:text-primary transition-colors">{brand.name}</h3>
                <p className="text-sm text-muted-foreground">{brand.country}</p>
                <p className="text-sm text-muted-foreground mt-1">{brand.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Shop by Category */}
      <section className="py-16 bg-secondary/50">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl font-bold">Shop by Category</h2>
            <p className="text-muted-foreground mt-2">Find exactly what you're looking for</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/products?category=${cat.slug}`}
                className="group p-6 bg-card rounded-lg border border-border text-center hover:border-primary hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <span className="text-xl">🍽️</span>
                </div>
                <h3 className="font-medium text-sm group-hover:text-primary transition-colors">{cat.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16">
        <div className="container">
          <div className="gradient-gold rounded-2xl p-8 lg:p-12 text-center">
            <h2 className="font-display text-3xl font-bold text-accent-foreground mb-4">
              Ready to Explore Premium Imports?
            </h2>
            <p className="text-accent-foreground/80 mb-6 max-w-xl mx-auto">
              Join thousands of satisfied customers who trust TejasImpex for authentic international products.
            </p>
            <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90" asChild>
              <Link to="/products">Start Shopping</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
