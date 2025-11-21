//
// === CÓDIGO COMPLETO PARA: src/lib/pdfGenerator.ts ===
//
import { Warranty, Store, CustomerProfile } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const generateWarrantyPDF = (warranty: Warranty, store: Store, client: CustomerProfile) => {
    // Abre uma nova janela para impressão
    const printWindow = window.open('', '', 'width=800,height=900');
    
    if (!printWindow) {
        alert("Por favor, permita popups para gerar o certificado de garantia.");
        return;
    }

    const formatDate = (dateStr: string) => format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Certificado de Garantia - BV Celular</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
                body { font-family: 'Inter', sans-serif; padding: 40px; color: #1a1a1a; max-width: 800px; margin: 0 auto; }
                .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
                .logo { font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
                .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
                .title-box { background: #f4f4f5; padding: 10px; text-align: center; font-weight: bold; font-size: 18px; border-radius: 4px; margin: 20px 0; border: 1px solid #e4e4e7; }
                
                .section { margin-bottom: 25px; }
                .section-title { font-size: 14px; text-transform: uppercase; font-weight: bold; border-bottom: 1px solid #e5e5e5; padding-bottom: 5px; margin-bottom: 10px; color: #404040; }
                
                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                .row { margin-bottom: 5px; font-size: 14px; }
                .label { font-weight: bold; color: #404040; margin-right: 5px; }
                
                .terms { font-size: 11px; line-height: 1.5; text-align: justify; color: #52525b; background: #fafafa; padding: 15px; border-radius: 4px; border: 1px solid #f4f4f5; }
                
                .signatures { margin-top: 60px; display: flex; justify-content: space-between; gap: 40px; }
                .sig-line { border-top: 1px solid #000; padding-top: 10px; text-align: center; font-size: 12px; flex: 1; }
                
                .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #999; }
                
                @media print {
                    body { padding: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">BV Celular</div>
                <div class="subtitle">${store.name} • ${store.city || 'Matriz'}</div>
                <div style="font-size: 12px; margin-top: 5px;">CNPJ: ${store.cnpj || 'Não informado'} • ${store.address || ''}</div>
            </div>

            <div class="title-box">CERTIFICADO DE GARANTIA</div>

            <div class="section">
                <div class="section-title">Dados do Cliente</div>
                <div class="grid">
                    <div class="row"><span class="label">Nome:</span> ${client.name}</div>
                    <div class="row"><span class="label">Telefone:</span> ${client.phone}</div>
                    <div class="row"><span class="label">Email:</span> ${client.email}</div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Dados do Produto</div>
                <div class="grid">
                    <div class="row"><span class="label">Produto/Modelo:</span> ${warranty.product_model}</div>
                    <div class="row"><span class="label">Nº de Série/IMEI:</span> ${warranty.serial_number}</div>
                    ${warranty.invoice_number ? `<div class="row"><span class="label">Nota Fiscal:</span> ${warranty.invoice_number}</div>` : ''}
                </div>
            </div>

            <div class="section">
                <div class="section-title">Vigência da Garantia</div>
                <div class="grid">
                    <div class="row"><span class="label">Data da Compra:</span> ${formatDate(warranty.purchase_date)}</div>
                    <div class="row"><span class="label">Válido Até:</span> <strong>${formatDate(warranty.warranty_end_date)}</strong></div>
                    <div class="row"><span class="label">Cobertura:</span> ${warranty.warranty_months} Meses</div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Termos e Condições</div>
                <div class="terms">
                    <p>1. Este certificado garante ao comprador a cobertura contra defeitos de fabricação pelo período estipulado acima, a contar da data da compra.</p>
                    <p>2. A garantia <strong>NÃO</strong> cobre:</p>
                    <ul style="margin: 5px 0; padding-left: 20px;">
                        <li>Danos causados por quedas, esmagamento ou impacto;</li>
                        <li>Danos por contato com líquidos (oxidação);</li>
                        <li>Tela quebrada ou trincada após a entrega;</li>
                        <li>Desgaste natural de bateria ou acessórios;</li>
                        <li>Reparos efetuados por terceiros não autorizados pela BV Celular.</li>
                    </ul>
                    <p>3. Para acionamento da garantia, é indispensável a apresentação deste documento e do aparelho com selo de garantia intacto.</p>
                </div>
            </div>

            <div class="signatures">
                <div class="sig-line">
                    Assinatura do Responsável (Loja)<br>
                    <strong>BV Celular</strong>
                </div>
                <div class="sig-line">
                    Assinatura do Cliente<br>
                    <strong>${client.name}</strong>
                </div>
            </div>

            <div class="footer">
                Documento emitido eletronicamente em ${new Date().toLocaleString('pt-BR')} • ID: ${warranty.id.split('-')[0]}
            </div>

            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                    }, 500);
                }
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
};