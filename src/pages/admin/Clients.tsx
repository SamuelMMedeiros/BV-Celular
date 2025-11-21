/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
//
// === CÓDIGO COMPLETO PARA: src/pages/admin/Clients.tsx ===
//
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { fetchClients, deleteClient, createBulkClients } from "@/lib/api";
import { CustomerProfile, BulkClientInsertPayload } from "@/types";
import { Loader2, Trash2, Search, User, Download, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminClients = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);

    const { data: clients, isLoading } = useQuery<CustomerProfile[]>({
        queryKey: ["adminClients"],
        queryFn: fetchClients,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteClient(id),
        onSuccess: () => {
            toast({ title: "Sucesso", description: "Cliente removido." });
            queryClient.invalidateQueries({ queryKey: ["adminClients"] });
        },
        onError: (err) => toast({ variant: "destructive", title: "Erro", description: err.message }),
    });

    const importMutation = useMutation({
        mutationFn: (data: BulkClientInsertPayload[]) => createBulkClients(data),
        onSuccess: () => {
            toast({ title: "Importação concluída!", description: "Clientes adicionados com sucesso." });
            queryClient.invalidateQueries({ queryKey: ["adminClients"] });
            setIsImporting(false);
        },
        onError: (err) => {
            toast({ variant: "destructive", title: "Erro na importação", description: err.message });
            setIsImporting(false);
        }
    });

    const filteredClients = clients?.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );

    // Manipulador de CSV
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                // Simples parser CSV: assume cabeçalho na linha 1 ou ordem fixa: nome,email,telefone
                // Vamos assumir formato: nome,email,telefone (sem cabeçalho ou ignorando linha 1 se tiver header 'name')
                
                const lines = text.split('\n');
                const parsedData: BulkClientInsertPayload[] = [];

                lines.forEach((line, index) => {
                    const [name, email, phone] = line.split(',').map(item => item.trim());
                    
                    // Ignora linhas vazias ou cabeçalho
                    if (!name || !email || (index === 0 && name.toLowerCase() === 'name')) return;

                    parsedData.push({ name, email, phone: phone || "" });
                });

                if (parsedData.length > 0) {
                    importMutation.mutate(parsedData);
                } else {
                    //@ts-ignore
                    toast({ variant: "warning", title: "Arquivo vazio ou inválido" });
                    setIsImporting(false);
                }
            } catch (err) {
                console.error(err);
                toast({ variant: "destructive", title: "Erro ao ler arquivo" });
                setIsImporting(false);
            }
        };
        
        reader.readAsText(file);
        // Limpa o input para permitir selecionar o mesmo arquivo novamente
        event.target.value = ''; 
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container py-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Clientes</h1>
                        <p className="text-muted-foreground">Base de contatos da loja.</p>
                    </div>
                    
                    <div className="flex gap-2">
                        <input 
                            type="file" 
                            accept=".csv" 
                            ref={fileInputRef} 
                            className="hidden" 
                            onChange={handleFileUpload} 
                        />
                        <Button 
                            variant="outline" 
                            onClick={() => fileInputRef.current?.click()} 
                            disabled={isImporting}
                        >
                            {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            Importar CSV
                        </Button>
                        <Button variant="secondary" onClick={() => {
                            const csvContent = "data:text/csv;charset=utf-8,Nome,Email,Telefone\nExemplo Silva,exemplo@email.com,3499999999";
                            const encodedUri = encodeURI(csvContent);
                            const link = document.createElement("a");
                            link.setAttribute("href", encodedUri);
                            link.setAttribute("download", "modelo_clientes.csv");
                            document.body.appendChild(link);
                            link.click();
                        }}>
                            <Download className="mr-2 h-4 w-4" /> Modelo
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle>Lista de Clientes ({filteredClients?.length || 0})</CardTitle>
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Buscar por nome..." 
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Telefone</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                                    ) : !filteredClients || filteredClients.length === 0 ? (
                                        <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum cliente encontrado.</TableCell></TableRow>
                                    ) : (
                                        filteredClients.map((client) => (
                                            <TableRow key={client.id}>
                                                <TableCell className="font-medium flex items-center gap-2">
                                                    <div className="bg-primary/10 p-1 rounded-full"><User className="h-3 w-3 text-primary" /></div>
                                                    {client.name}
                                                </TableCell>
                                                <TableCell>{client.email}</TableCell>
                                                <TableCell>{client.phone}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="text-destructive hover:bg-destructive/10"
                                                        onClick={() => {
                                                            if(confirm("Tem certeza? Isso apagará o histórico de pedidos deste cliente.")) {
                                                                deleteMutation.mutate(client.id);
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default AdminClients;