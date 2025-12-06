import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [phone, setPhone] = useState(user?.user_metadata?.phone || '');

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    toast({ title: 'Signed out successfully' });
    navigate('/');
  };

  return (
    <Layout>
      <div className="container max-w-2xl py-8">
        <h1 className="font-display text-4xl font-bold mb-6">My Profile</h1>
        
        <div className="bg-card rounded-lg border p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 rounded-md border bg-background"
              disabled
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={user.email}
              className="w-full px-4 py-2 rounded-md border bg-background"
              disabled
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 rounded-md border bg-background"
              disabled
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Role</label>
            <input
              type="text"
              value={user.user_metadata?.role || 'user'}
              className="w-full px-4 py-2 rounded-md border bg-background capitalize"
              disabled
            />
          </div>
          
          <div className="pt-4">
            <Button variant="destructive" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
