import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Users, Music, Settings, Database } from 'lucide-react';
import AdminLayout from './AdminLayout';

interface AccountRequest {
  id: string;
  email: string;
  display_name: string;
  status: string;
  requested_at: string;
  reviewed_at?: string;
  notes?: string;
}

interface UserAccount {
  id: string;
  email: string;
  display_name: string;
  role: string;
  created_at: string;
  last_sign_in_at?: string;
}

interface DatabaseData {
  [key: string]: any[];
}

export default function AdminDashboard() {
  const [accountRequests, setAccountRequests] = useState<AccountRequest[]>([]);
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);
  const [databaseData, setDatabaseData] = useState<DatabaseData>({});
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAccountRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('account_requests')
        .select('*')
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setAccountRequests(data || []);
    } catch (error) {
      console.error('Error fetching account requests:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les demandes de compte",
        variant: "destructive"
      });
    }
  };

  const fetchUserAccounts = async () => {
    try {
      // First get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, created_at');

      if (profilesError) throw profilesError;

      // Then get user roles separately
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const users = profiles?.map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.user_id);
        return {
          id: profile.user_id,
          email: profile.user_id, // We'll need to get this from auth metadata
          display_name: profile.display_name || 'Utilisateur sans nom',
          role: userRole?.role || 'pending',
          created_at: profile.created_at,
          last_sign_in_at: profile.created_at
        };
      }) || [];

      setUserAccounts(users);
    } catch (error) {
      console.error('Error fetching user accounts:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les comptes utilisateur",
        variant: "destructive"
      });
    }
  };

  const fetchDatabaseData = async () => {
    try {
      const validTables = ['tracks', 'presets', 'profiles', 'user_roles', 'account_requests'] as const;
      const data: DatabaseData = {};

      for (const table of validTables) {
        const { data: tableData, error } = await supabase
          .from(table)
          .select('*')
          .limit(100);

        if (!error && tableData) {
          data[table] = tableData;
        }
      }

      setDatabaseData(data);
      if (!selectedTable && Object.keys(data).length > 0) {
        setSelectedTable(Object.keys(data)[0]);
      }
    } catch (error) {
      console.error('Error fetching database data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de la base",
        variant: "destructive"
      });
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const { error } = await supabase.rpc('approve_account_request', {
        request_id: requestId
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Demande de compte approuvée"
      });

      await fetchAccountRequests();
      await fetchUserAccounts();
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'approuver la demande",
        variant: "destructive"
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase.rpc('reject_account_request', {
        request_id: requestId,
        rejection_notes: 'Rejeté par l\'administrateur'
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Demande de compte rejetée"
      });

      await fetchAccountRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: "Erreur",
        description: "Impossible de rejeter la demande",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchAccountRequests(),
        fetchUserAccounts(),
        fetchDatabaseData()
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Chargement des données...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const pendingRequests = accountRequests.filter(req => req.status === 'pending');

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Tableau de Bord Admin
          </h1>
          <p className="text-lg text-muted-foreground">
            Gérez les demandes de compte et surveillez l'activité
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Demandes en attente</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingRequests.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilisateurs actifs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userAccounts.filter(u => u.role === 'user').length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tracks</CardTitle>
              <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{databaseData.tracks?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Presets</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{databaseData.presets?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="requests" className="space-y-4">
          <TabsList>
            <TabsTrigger value="requests">Demandes de compte</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="database">Base de données</TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>Demandes de création de compte</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Nom d'affichage</TableHead>
                      <TableHead>Date de demande</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accountRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{request.email}</TableCell>
                        <TableCell>{request.display_name || 'Non spécifié'}</TableCell>
                        <TableCell>{new Date(request.requested_at).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell>
                          <Badge variant={
                            request.status === 'approved' ? 'default' :
                            request.status === 'rejected' ? 'destructive' : 'secondary'
                          }>
                            {request.status === 'approved' ? 'Approuvé' :
                             request.status === 'rejected' ? 'Rejeté' : 'En attente'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {request.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApproveRequest(request.id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approuver
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectRequest(request.id)}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Rejeter
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Comptes utilisateur</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nom d'affichage</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Date de création</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userAccounts.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-mono text-xs">{user.id.slice(0, 8)}...</TableCell>
                        <TableCell>{user.display_name}</TableCell>
                        <TableCell>
                          <Badge variant={
                            user.role === 'admin' ? 'default' :
                            user.role === 'user' ? 'secondary' : 'outline'
                          }>
                            {user.role === 'admin' ? 'Admin' :
                             user.role === 'user' ? 'Utilisateur' : 'En attente'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString('fr-FR')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Données de la base
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Select value={selectedTable} onValueChange={setSelectedTable}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Sélectionner une table" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(databaseData).map((table) => (
                        <SelectItem key={table} value={table}>
                          {table} ({databaseData[table].length} entrées)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedTable && databaseData[selectedTable] && (
                    <div className="border rounded-md">
                      <div className="max-h-96 overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {Object.keys(databaseData[selectedTable][0] || {}).map((column) => (
                                <TableHead key={column}>{column}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {databaseData[selectedTable].map((row, index) => (
                              <TableRow key={index}>
                                {Object.entries(row).map(([key, value]) => (
                                  <TableCell key={key} className="max-w-48 truncate">
                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}