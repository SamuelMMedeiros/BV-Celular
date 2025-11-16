/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ArrowLeft, Download, Trash2, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CustomerProfile } from "@/types";
import { fetchClients, deleteClient } from "@/lib/api"; // (deleteClient é simplificado)

// Libs de Exportação (Instale: npm install papaparse jspdf jspdf-autotable)
import { unparse } from "papaparse";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Helper para formatar o número do WhatsApp
const formatWhatsapp = (number: string): string => {
    const cleaned = number.replace(/\D/g, ''); 
    if (cleaned.length === 11) return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7, 11)}`;
    if (cleaned.length === 10) return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6, 10)}`;
    return number;
}

// Interface estendida para a biblioteca jsPDF
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export const AdminClients = () => {
  const { toast } = useToast();
  const [isExportOpen, setIsExportOpen] = useState(false);
  
  // Estado para os checkboxes de exportação
  const [exportFields, setExportFields] = useState({
    name: true,
    email: true,
    phone: true,
  });

  // Query para buscar todos os Clientes
  const { 
    data: clients, 
    isLoading, 
    isError 
  } = useQuery<CustomerProfile[]>({
    queryKey: ['adminClients'],
    queryFn: fetchClients,
  });

  // (Nota: Mutação de Delete não implementada totalmente, pois requer Edge Function)

  // --- Funções de Exportação ---

  const handleExport = (format: 'csv' | 'pdf' | 'whatsapp') => {
    if (!clients || clients.length === 0) {
      toast({ title: "Nada para exportar", description: "Não há clientes na lista." });
      return;
    }

    // 1. Filtra os dados com base nos checkboxes
    const dataToExport = clients.map(client => {
        let row: { [key: string]: any } = {};
        if (exportFields.name) row.Nome = client.name;
        if (exportFields.email) row.Email = client.email;
        if (exportFields.phone) row.Telefone = client.phone.replace(/\D/g, ''); // Limpa para CSV/PDF
        return row;
    });

    const headers = Object.keys(dataToExport[0]);

    if (format === 'csv') {
      // 2. Exportar para CSV
      const csv = unparse(dataToExport, { headers: true });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "bv_clientes.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } else if (format === 'pdf') {
      // 3. Exportar para PDF
      const doc = new jsPDF() as jsPDFWithAutoTable;
      doc.autoTable({
        head: [headers],
        body: dataToExport.map(row => Object.values(row)),
        startY: 10,
      });
      doc.save('bv_clientes.pdf');
      
    } else if (format === 'whatsapp') {
      // 4. Formatar para Link de WhatsApp
      let message = "*Lista de Clientes (BV Celular)*\n\n";
      clients.forEach(client => {
          if (exportFields.name) message += `*${client.name}*\n`;
          if (exportFields.phone) {
            const cleanedPhone = client.phone.replace(/\D/g, '');
            // Cria o link wa.me (necessário ter o 55)
            message += `_https://wa.me/55${cleanedPhone}_\n`;
          }
          if (exportFields.email) message += `_${client.email}_\n`;
          message += `\n`;
      });
      
      // Copia para o clipboard
      navigator.clipboard.writeText(message);
      toast({ title: "Copiado!", description: "Lista formatada para WhatsApp copiada." });
    }
    
    setIsExportOpen(false); // Fecha o modal
  };
  
  // Handler para os checkboxes
  const handleExportFieldChange = (field: keyof typeof exportFields, checked: boolean) => {
    setExportFields(prev => ({ ...prev, [field]: checked }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container py-8">
        {/* Cabeçalho da Página */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Button variant="ghost" size="sm" asChild className="mb-2">
              <Link to="/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Painel
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-foreground">
              Gerenciar Clientes
            </h1>
          </div>
          
          <div className="flex space-x-2">
            {/* Botão de Exportar */}
            <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Exportar Dados dos Clientes</DialogTitle>
                  <DialogDescription>
                    Selecione os dados e o formato desejado.
                  </DialogDescription>
                </DialogHeader>
                
                {/* Checkboxes para selecionar campos */}
                <div className="grid gap-4 py-4">
                    <Label className="text-base font-semibold">Dados para incluir:</Label>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="check-name" checked={exportFields.name} onCheckedChange={(c) => handleExportFieldChange('name', c as boolean)} />
                        <Label htmlFor="check-name">Nome</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="check-email" checked={exportFields.email} onCheckedChange={(c) => handleExportFieldChange('email', c as boolean)} />
                        <Label htmlFor="check-email">Email</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="check-phone" checked={exportFields.phone} onCheckedChange={(c) => handleExportFieldChange('phone', c as boolean)} />
                        <Label htmlFor="check-phone">Telefone (Link WhatsApp)</Label>
                    </div>
                </div>
                
                <DialogFooter className="flex-col sm:flex-row space-y-2 sm:space-y-0">
                    <Button variant="secondary" className="w-full" onClick={() => handleExport('whatsapp')}>
                        <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                    </Button>
                    <Button variant="secondary" className="w-full" onClick={() => handleExport('csv')}>
                        .CSV
                    </Button>
                    <Button variant="secondary" className="w-full" onClick={() => handleExport('pdf')}>
                        .PDF
                    </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {/* Botão de Importar CSV (Placeholder) */}
            <Button disabled>
              <Download className="mr-2 h-4 w-4" />
              Importar CSV (Em breve)
            </Button>
          </div>
        </div>

        {/* Tabela de Clientes */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-2/3" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-1/3" /></TableCell>
                    <TableCell className="flex gap-2">
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))
              )}
              {isError && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-destructive">
                    <AlertTriangle className="mr-2 inline h-4 w-4" />
                    Erro ao carregar os clientes.
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && !isError && clients?.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{formatWhatsapp(client.phone)}</TableCell>
                  <TableCell className="flex gap-2">
                    {/* (Opcional: Criar um modal de Edição de Cliente) */}
                    {/* <Button variant="outline" size="icon" className="h-8 w-8">
                      <Edit className="h-4 w-4" />
                    </Button> */}
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => alert("Exclusão de cliente requer Supabase Edge Function (ação complexa).")}
                      // disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {!isLoading && !isError && clients?.length === 0 && (
          <div className="py-20 text-center text-muted-foreground">
            Nenhum cliente cadastrado ainda.
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminClients;

