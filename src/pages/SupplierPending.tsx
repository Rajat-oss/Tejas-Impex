import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SupplierPending() {
  const { user, profile, isSupplier, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !isSupplier) {
      navigate('/login');
    } else if (profile?.approval_status === 'approved') {
      navigate('/supplier');
    }
  }, [user, isSupplier, profile, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <Layout>
      <div className="container max-w-2xl py-16">
        <div className="bg-card rounded-lg border p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-yellow-100 dark:bg-yellow-900/20 p-4 rounded-full">
              <Clock className="h-12 w-12 text-yellow-600 dark:text-yellow-500" />
            </div>
          </div>
          
          <h1 className="font-display text-3xl font-bold mb-4">
            Waiting for Approval
          </h1>
          
          <p className="text-muted-foreground mb-6">
            Thank you for registering as a supplier! Your account is currently pending approval from our admin team.
          </p>

          <div className="bg-secondary/50 rounded-lg p-6 mb-6 text-left">
            <h2 className="font-semibold mb-3">What happens next?</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Our admin team will review your supplier registration</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>You will receive an email notification once approved</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>After approval, you can access your supplier dashboard</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>You'll be able to add and manage your products</span>
              </li>
            </ul>
          </div>

          <div className="border-t pt-6">
            <p className="text-sm text-muted-foreground mb-4">
              Need help? Contact our support team:
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="mailto:support@tejasimpex.com" className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Mail className="h-4 w-4" />
                support@tejasimpex.com
              </a>
              <a href="tel:+911234567890" className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Phone className="h-4 w-4" />
                +91 123 456 7890
              </a>
            </div>
          </div>

          <div className="mt-8">
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
