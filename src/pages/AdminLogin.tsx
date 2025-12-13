import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast({ title: 'Login Failed', description: error.message || 'Invalid credentials', variant: 'destructive' });
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .maybeSingle();
      
      if (roleData?.role === 'admin') {
        toast({ title: 'Success', description: 'Admin logged in successfully' });
        navigate('/admin');
      } else {
        await supabase.auth.signOut();
        toast({ title: 'Access Denied', description: 'Admin credentials required', variant: 'destructive' });
      }
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div className="container max-w-md py-16">
        <div className="bg-card rounded-lg border p-8">
          <div className="flex items-center justify-center mb-6">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold mb-2 text-center">Admin Access</h1>
          <p className="text-center text-sm text-muted-foreground mb-6">Authorized personnel only</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-md border bg-background"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-md border bg-background"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Verifying...' : 'Access Admin Panel'}
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
