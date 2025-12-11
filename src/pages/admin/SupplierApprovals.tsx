import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Clock, Mail, Phone, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SupplierRequest {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  business_name: string;
  business_address: string;
  gst_number: string;
  approval_status: string;
  created_at: string;
}

export default function SupplierApprovals() {
  const [suppliers, setSuppliers] = useState<SupplierRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'supplier');

    if (userRoles) {
      const supplierIds = userRoles.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', supplierIds)
        .order('created_at', { ascending: false });

      if (profiles) {
        setSuppliers(profiles as SupplierRequest[]);
      }
    }
    setLoading(false);
  };

  const handleApproval = async (supplierId: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('profiles')
      .update({ approval_status: status, is_verified: status === 'approved' })
      .eq('id', supplierId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ 
        title: 'Success', 
        description: `Supplier ${status === 'approved' ? 'approved' : 'rejected'} successfully` 
      });
      loadSuppliers();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800"><X className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-8">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="font-display text-4xl font-bold mb-6">Supplier Approvals</h1>

        <div className="grid gap-4">
          {suppliers.length === 0 ? (
            <div className="bg-card rounded-lg border p-8 text-center text-muted-foreground">
              No supplier requests found
            </div>
          ) : (
            suppliers.map((supplier) => (
              <div key={supplier.id} className="bg-card rounded-lg border p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{supplier.full_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Registered: {new Date(supplier.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {getStatusBadge(supplier.approval_status)}
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{supplier.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{supplier.phone || 'N/A'}</span>
                  </div>
                  {supplier.business_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{supplier.business_name}</span>
                    </div>
                  )}
                  {supplier.gst_number && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">GST:</span>
                      <span>{supplier.gst_number}</span>
                    </div>
                  )}
                </div>

                {supplier.business_address && (
                  <div className="mb-4 text-sm">
                    <span className="text-muted-foreground">Address: </span>
                    <span>{supplier.business_address}</span>
                  </div>
                )}

                {supplier.approval_status === 'pending' && (
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleApproval(supplier.id, 'approved')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button 
                      onClick={() => handleApproval(supplier.id, 'rejected')}
                      variant="destructive"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
