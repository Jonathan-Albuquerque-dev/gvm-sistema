
'use client';

import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit3, Trash2, MoreVertical, Eye, Loader2 } from 'lucide-react';
import type { Client } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
// import { useAuth } from '@/hooks/useAuth'; // If you filter by userId

export function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  // const { user } = useAuth(); // For userId filtering

  useEffect(() => {
    // if (!user) { // Optional: only fetch if user is logged in
    //   setIsLoading(false);
    //   setClients([]);
    //   return;
    // }

    setIsLoading(true);
    // const q = query(collection(db, 'clients'), where('userId', '==', user.uid)); // Example for user-specific data
    const q = query(collection(db, 'clients'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const clientsData: Client[] = [];
      querySnapshot.forEach((doc) => {
        clientsData.push({ id: doc.id, ...doc.data() } as Client);
      });
      setClients(clientsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao buscar clientes:", error);
      toast({ title: "Erro ao buscar clientes", description: "Não foi possível carregar a lista de clientes.", variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribe(); // Cleanup subscription on component unmount
  }, [toast]); // Add user to dependency array if filtering by user.uid

  const handleEdit = (clientId: string) => {
    router.push(`/clients/${clientId}/edit`);
  };

  const handleDelete = async (clientId: string, clientName: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o cliente "${clientName}"? Esta ação não pode ser desfeita.`)) {
        return;
    }
    try {
      await deleteDoc(doc(db, 'clients', clientId));
      toast({
        title: 'Cliente Excluído!',
        description: `O cliente "${clientName}" foi excluído com sucesso do Firebase.`,
      });
      // No need to manually update state if using onSnapshot, it will update automatically
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      toast({
        title: 'Erro ao Excluir',
        description: `Não foi possível excluir o cliente "${clientName}". Tente novamente.`,
        variant: 'destructive',
      });
    }
  };
  
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.companyName && client.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.document.includes(searchTerm)
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando clientes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        <Input 
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
        />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome / Empresa</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden lg:table-cell">Telefone</TableHead>
              <TableHead className="hidden lg:table-cell">Orçamentos</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="font-medium">{client.name}</div>
                    {client.companyName && <div className="text-sm text-muted-foreground">{client.companyName}</div>}
                  </TableCell>
                  <TableCell>{client.document}</TableCell>
                  <TableCell className="hidden md:table-cell">{client.email}</TableCell>
                  <TableCell className="hidden lg:table-cell">{client.phone}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                     <Badge variant="secondary">{client.budgetIds?.length || 0}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/clients/${client.id}`)}>
                          <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(client.id)}>
                          <Edit3 className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(client.id, client.name)} className="text-destructive hover:!bg-destructive hover:!text-destructive-foreground">
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Nenhum cliente encontrado. {clients.length === 0 && !searchTerm ? "Cadastre o primeiro cliente." : ""}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
           {filteredClients.length === 0 && (clients.length > 0 || searchTerm) && (
             <TableCaption>Nenhum cliente encontrado para "{searchTerm}".</TableCaption>
           )}
        </Table>
      </div>
    </div>
  );
}
