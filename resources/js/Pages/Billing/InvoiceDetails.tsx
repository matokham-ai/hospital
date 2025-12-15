import { Head, Link, router } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
// import html2pdf from 'html2pdf.js';
import { useState } from 'react';

import {
  ArrowLeft,
  Download,
  MessageSquare,
  CreditCard,
  Clock,
  FileText,
  Building,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  XCircle,
  QrCode,
  Eye,
  X,
  Loader2,
  Printer,
  ZoomIn,
  ZoomOut,
  Wrench,
  Sparkles
} from 'lucide-react';

interface Invoice {
  id: number;
  patient_name: string;
  phone: string;
  email: string;
  encounter_number: string;
  encounter_type: string;
  total_amount: number;
  paid_amount: number;
  balance: number;
  discount: number;
  net_amount: number;
  status: string;
  created_at: string;
}

interface BillItem {
  id: number;
  item_type: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  status: string;
  created_at: string;
}

interface Payment {
  id: number;
  amount: number;
  method: string;
  reference_no: string;
  created_at: string;
}

interface InvoiceDetailsProps {
  invoice: Invoice;
  items: BillItem[];
  payments: Payment[];
}

const statusConfig = {
  paid: { label: 'Paid', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  partial: { label: 'Partially Paid', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertCircle },
  unpaid: { label: 'Unpaid', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
};

const departmentIcons = {
  consultation: '🩺',
  laboratory: '🔬',
  radiology: '📡',
  pharmacy: '💊',
  accommodation: '🛏️',
  procedure: '⚕️',
  default: '📋'
};

export default function InvoiceDetails({ invoice, items, payments }: InvoiceDetailsProps) {
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState('');
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [printZoom, setPrintZoom] = useState(120);

  const StatusIcon = statusConfig[invoice.status as keyof typeof statusConfig]?.icon || AlertCircle;
  const statusStyle = statusConfig[invoice.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800 border-gray-200';
  const statusLabel = statusConfig[invoice.status as keyof typeof statusConfig]?.label || invoice.status;

  const paymentProgress = invoice.total_amount > 0 ? (invoice.paid_amount / invoice.total_amount) * 100 : 0;

  const generatePDF = async (action: 'preview' | 'download') => {
    setIsGeneratingPdf(true);
    try {
      const element = document.getElementById('invoice-content');
      if (!element) throw new Error('Invoice content not found');

      const options = {
        margin: [0.3, 0.3, 0.3, 0.3] as [number, number, number, number],
        filename: `Invoice_${invoice.id}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' as const },
      };

      const worker = html2pdf().set(options).from(element);

      if (action === 'download') {
        await worker.save();
      } else {
        // ✅ Correct blob output
        const pdfBlob = await worker.output('blob');
        setPdfBlob(pdfBlob);
        setShowPdfPreview(true);
      }
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('PDF preview could not be generated.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };


  const handlePreviewPDF = () => {
    generatePDF('preview');
  };

  const handleDownloadPDF = () => {
    generatePDF('download');
  };

  const handleDownloadFromPreview = () => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_${invoice.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const closePdfPreview = () => {
    setShowPdfPreview(false);
    setPdfBlob(null);
  };

  const handlePrintPreview = () => {
    setShowPrintPreview(true);
  };

  const closePrintPreview = () => {
    setShowPrintPreview(false);
    setPrintZoom(120);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const invoiceContent = document.getElementById('invoice-content')?.innerHTML;
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice #${invoice.id}</title>
            <style>
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body { 
                font-family: system-ui, -apple-system, sans-serif; 
                line-height: 1.5; 
                color: #1f2937;
                background: white;
                padding: 20px;
                margin: 0;
              }
              .bg-gradient-to-r { background: #f9fafb !important; }
              .rounded-2xl { border-radius: 8px; border: 1px solid #e5e7eb; }
              .shadow-sm { box-shadow: none; }
              .p-6 { padding: 16px; }
              .space-y-4 > * + * { margin-top: 16px; }
              .space-y-3 > * + * { margin-top: 12px; }
              .space-y-6 > * + * { margin-top: 24px; }
              .grid { display: grid; }
              .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
              .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
              .lg\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
              .gap-4 { gap: 16px; }
              .gap-6 { gap: 24px; }
              .gap-8 { gap: 32px; }
              .flex { display: flex; }
              .items-center { align-items: center; }
              .justify-between { justify-content: space-between; }
              .justify-center { justify-content: center; }
              .space-x-2 > * + * { margin-left: 8px; }
              .space-x-3 > * + * { margin-left: 12px; }
              .space-x-4 > * + * { margin-left: 16px; }
              .text-xl { font-size: 1.25rem; }
              .text-lg { font-size: 1.125rem; }
              .text-sm { font-size: 0.875rem; }
              .text-xs { font-size: 0.75rem; }
              .font-bold { font-weight: 700; }
              .font-semibold { font-weight: 600; }
              .font-medium { font-weight: 500; }
              .text-gray-900 { color: #111827; }
              .text-gray-600 { color: #4b5563; }
              .text-gray-500 { color: #6b7280; }
              .text-gray-400 { color: #9ca3af; }
              .text-red-600 { color: #dc2626; }
              .text-green-600 { color: #16a34a; }
              .text-teal-600 { color: #0d9488; }
              .bg-blue-500 { background-color: #3b82f6; }
              .bg-teal-600 { background-color: #0d9488; }
              .bg-gray-50 { background-color: #f9fafb; }
              .bg-gray-100 { background-color: #f3f4f6; }
              .bg-white { background-color: white; }
              .text-white { color: white; }
              .w-12 { width: 3rem; }
              .h-12 { width: 3rem; height: 3rem; }
              .w-16 { width: 4rem; }
              .h-16 { width: 4rem; height: 4rem; }
              .w-4 { width: 1rem; }
              .h-4 { width: 1rem; height: 1rem; }
              .w-6 { width: 1.5rem; }
              .h-6 { width: 1.5rem; height: 1.5rem; }
              .w-8 { width: 2rem; }
              .h-8 { width: 2rem; height: 2rem; }
              .rounded-full { border-radius: 9999px; }
              .rounded-lg { border-radius: 8px; }
              .border { border: 1px solid #e5e7eb; }
              .border-t { border-top: 1px solid #e5e7eb; }
              .border-b { border-bottom: 1px solid #e5e7eb; }
              .border-gray-200 { border-color: #e5e7eb; }
              .border-teal-100 { border-color: #ccfbf1; }
              .pt-3 { padding-top: 12px; }
              .mt-1 { margin-top: 4px; }
              .mt-2 { margin-top: 8px; }
              .mt-6 { margin-top: 24px; }
              .mb-3 { margin-bottom: 12px; }
              .mb-4 { margin-bottom: 16px; }
              .uppercase { text-transform: uppercase; }
              .capitalize { text-transform: capitalize; }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              .text-left { text-align: left; }
              .overflow-x-auto { overflow-x: auto; }
              .min-w-full { min-width: 100%; }
              .divide-y { border-collapse: collapse; }
              .divide-gray-200 > * + * { border-top: 1px solid #e5e7eb; }
              .px-6 { padding-left: 24px; padding-right: 24px; }
              .py-3 { padding-top: 12px; padding-bottom: 12px; }
              .py-4 { padding-top: 16px; padding-bottom: 16px; }
              .py-8 { padding-top: 32px; padding-bottom: 32px; }
              .whitespace-nowrap { white-space: nowrap; }
              .tracking-wider { letter-spacing: 0.05em; }
              table { width: 100%; border-collapse: collapse; }
              th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
              th { background-color: #f9fafb; font-weight: 600; }
              tr:nth-child(even) { background-color: #f9fafb; }
              .inline-flex { display: inline-flex; }
              .px-3 { padding-left: 12px; padding-right: 12px; }
              .py-1 { padding-top: 4px; padding-bottom: 4px; }
              .rounded-full { border-radius: 9999px; }
              .bg-green-100 { background-color: #dcfce7; }
              .text-green-800 { color: #166534; }
              .border-green-200 { border-color: #bbf7d0; }
              .bg-yellow-100 { background-color: #fef3c7; }
              .text-yellow-800 { color: #92400e; }
              .border-yellow-200 { border-color: #fde68a; }
              .bg-red-100 { background-color: #fee2e2; }
              .text-red-800 { color: #991b1b; }
              .border-red-200 { border-color: #fecaca; }
              .w-full { width: 100%; }
              .h-3 { height: 12px; }
              .bg-gray-200 { background-color: #e5e7eb; }
              .bg-gradient-to-r { background: linear-gradient(to right, #3b82f6, #10b981); }
              .from-blue-500 { --tw-gradient-from: #3b82f6; }
              .to-green-500 { --tw-gradient-to: #10b981; }
              .from-gray-50 { background: #f9fafb; }
              .to-gray-100 { background: #f3f4f6; }
              .from-teal-50 { background: #f0fdfa; }
              .to-blue-50 { background: #eff6ff; }
              @media print {
                body { margin: 0; padding: 15px; }
                .no-print { display: none !important; }
              }
            </style>
          </head>
          <body>
            ${invoiceContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  const adjustZoom = (direction: 'in' | 'out') => {
    setPrintZoom(prev => {
      if (direction === 'in' && prev < 150) return prev + 10;
      if (direction === 'out' && prev > 50) return prev - 10;
      return prev;
    });
  };

  const handleSendToPatient = () => {
    setComingSoonFeature('Send Invoice to Patient');
    setShowComingSoon(true);
  };

  const handleRecordPayment = () => {
    // Navigate to payments page with this invoice pre-selected
    router.visit(`/payments?invoice_id=${invoice.id}`);
  };

  const closeComingSoon = () => {
    setShowComingSoon(false);
    setComingSoonFeature('');
  };

  return (
    <HMSLayout>
      <Head title={`Invoice #${invoice.id}`}>
        <style>{`
          @media print {
            body { -webkit-print-color-adjust: exact; }
            #invoice-content { 
              background: white !important;
              box-shadow: none !important;
              border-radius: 0 !important;
            }
            .no-print { display: none !important; }
          }
          
          #invoice-content {
            background: white;
            padding: 16px;
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 100%;
            page-break-inside: avoid;
          }
          
          #invoice-content * {
            box-sizing: border-box;
          }
          
          #invoice-content .space-y-6 > * {
            margin-bottom: 16px !important;
          }
          
          #invoice-content .space-y-6 > *:last-child {
            margin-bottom: 0 !important;
          }
          
          #invoice-content .rounded-2xl {
            border-radius: 8px !important;
          }
          
          #invoice-content .p-6 {
            padding: 12px !important;
          }
          
          #invoice-content .gap-8 {
            gap: 16px !important;
          }
          
          #invoice-content .gap-6 {
            gap: 12px !important;
          }
          
          #invoice-content table {
            page-break-inside: auto;
          }
          
          #invoice-content tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          #invoice-content .grid {
            page-break-inside: avoid;
          }
          
          /* Compact spacing for PDF */
          #invoice-content .space-y-4 > * {
            margin-bottom: 8px !important;
          }
          
          #invoice-content .space-y-3 > * {
            margin-bottom: 6px !important;
          }
          
          #invoice-content .py-4 {
            padding-top: 8px !important;
            padding-bottom: 8px !important;
          }
          
          #invoice-content .px-6 {
            padding-left: 12px !important;
            padding-right: 12px !important;
          }
        `}</style>
      </Head>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header with Actions */}
        <div className="flex items-center justify-between no-print">
          <div className="flex items-center space-x-4">
            <Link
              href="/invoices"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Invoices</span>
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-2xl font-bold text-gray-900">Invoice #{invoice.id}</h1>
          </div>

          {/* Sticky Action Bar */}
          <div className="flex items-center space-x-2 bg-white/70 backdrop-blur-md p-2 rounded-xl shadow-sm border border-gray-200">
            {/* Left Group: File Actions */}
            <div className="flex items-center space-x-1 bg-gray-50 border border-gray-200 rounded-lg px-1">
              <button
                onClick={handlePrintPreview}
                className="flex items-center justify-center px-3 py-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-white transition-colors"
                title="Print Invoice"
              >
                <Printer className="h-4 w-4" />
              </button>
              <button
                onClick={handlePreviewPDF}
                disabled={isGeneratingPdf}
                className="flex items-center justify-center px-3 py-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Preview PDF"
              >
                {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPdf}
                className="flex items-center justify-center px-3 py-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download PDF"
              >
                {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              </button>
            </div>

            {/* Right Group: Communication & Payment */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSendToPatient}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-sm hover:shadow-md transition-all"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Send</span>
              </button>

              {invoice.status !== 'paid' && (
                <button
                  onClick={handleRecordPayment}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-lg shadow-sm hover:shadow-md transition-all"
                >
                  <CreditCard className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">Payment</span>
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Invoice Content - Wrapped for PDF Generation */}
        <div id="invoice-content">
          {/* Patient & Invoice Header */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Patient Info */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {invoice.patient_name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{invoice.patient_name}</h2>
                    <p className="text-sm text-gray-500">Patient</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{invoice.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{invoice.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{invoice.encounter_type} Visit</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{invoice.encounter_number}</span>
                  </div>
                </div>
              </div>

              {/* Right Column - Invoice Info */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 uppercase">Invoice Status</p>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusStyle} mt-1`}>
                      <StatusIcon className="w-4 h-4 mr-2" />
                      {statusLabel}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-500 uppercase">Invoice Date</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(invoice.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 uppercase">Total Amount</p>
                    <p className="text-xl font-bold text-gray-900">
                      KSh {new Intl.NumberFormat().format(invoice.total_amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 uppercase">Balance Due</p>
                    <p className={`text-xl font-bold ${invoice.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      KSh {new Intl.NumberFormat().format(invoice.balance)}
                    </p>
                  </div>
                </div>

                {/* Payment Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Payment Progress</span>
                    <span className="font-medium">{paymentProgress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${paymentProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Line Items */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Invoice Line Items</h3>
              <p className="text-sm text-gray-500 mt-1">Detailed breakdown of all charges</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Added</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">
                            {departmentIcons[item.item_type as keyof typeof departmentIcons] || departmentIcons.default}
                          </span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.description}</div>
                            <div className="text-xs text-gray-500 capitalize">{item.item_type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {item.item_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        KSh {new Intl.NumberFormat().format(item.unit_price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        KSh {new Intl.NumberFormat().format(item.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Summary & Payment History */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Totals Summary Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">
                    KSh {new Intl.NumberFormat().format(invoice.total_amount)}
                  </span>
                </div>

                {invoice.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-medium text-green-600">
                      -KSh {new Intl.NumberFormat().format(invoice.discount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Net Amount</span>
                  <span className="font-medium text-gray-900">
                    KSh {new Intl.NumberFormat().format(invoice.net_amount || invoice.total_amount)}
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Amount Paid</span>
                    <span className="font-medium text-green-600">
                      KSh {new Intl.NumberFormat().format(invoice.paid_amount)}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Balance Due</span>
                    <span className={`text-lg font-bold ${invoice.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      KSh {new Intl.NumberFormat().format(invoice.balance)}
                    </span>
                  </div>
                </div>
              </div>

              {/* QR Code for Mobile Payment */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center space-x-3 text-sm text-gray-500">
                  <QrCode className="h-4 w-4" />
                  <span>QR Code for Mobile Payment</span>
                </div>
                <div className="mt-2 flex justify-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <QrCode className="h-8 w-8 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment History */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
                <Clock className="h-5 w-5 text-gray-400" />
              </div>

              {payments.length > 0 ? (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          KSh {new Intl.NumberFormat().format(payment.amount)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {payment.method} • {payment.reference_no}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(payment.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No payments recorded yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Hospital Branding Footer */}
          <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl p-6 border border-teal-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">MediCare Hospital</h4>
                  <p className="text-sm text-gray-600">Professional Healthcare Services</p>
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                <p>Generated on {new Date().toLocaleDateString()}</p>
                <p>Invoice #{invoice.id}</p>
              </div>
            </div>
          </div>
        </div> {/* End of invoice-content */}

        {/* Print Preview Modal */}
        {showPrintPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[95vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Print Preview</h3>
                  <p className="text-sm text-gray-500">Invoice #{invoice.id} - {invoice.patient_name}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => adjustZoom('out')}
                      disabled={printZoom <= 50}
                      className="p-2 hover:bg-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-medium px-2 min-w-[60px] text-center">{printZoom}%</span>
                    <button
                      onClick={() => adjustZoom('in')}
                      disabled={printZoom >= 150}
                      className="p-2 hover:bg-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={handlePrint}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print</span>
                  </button>
                  <button
                    onClick={closePrintPreview}
                    className="flex items-center justify-center w-10 h-10 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Print Preview Content */}
              <div className="flex-1 p-4 overflow-auto bg-gray-100">
                <div className="max-w-5xl mx-auto bg-white shadow-lg" style={{ transform: `scale(${printZoom / 100})`, transformOrigin: 'top center' }}>
                  <div className="p-12">
                    {/* Hospital Header */}
                    <div className="text-center mb-12 border-b-2 border-gray-300 pb-8">
                      <div className="flex items-center justify-center space-x-4 mb-6">
                        <div className="w-16 h-16 bg-teal-600 rounded-lg flex items-center justify-center">
                          <Building className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <h1 className="text-4xl font-bold text-gray-900">MediCare Hospital</h1>
                          <p className="text-lg text-gray-600">Professional Healthcare Services</p>
                        </div>
                      </div>
                      <div className="text-base text-gray-600 space-y-1">
                        <p>123 Medical Center Drive, Nairobi, Kenya</p>
                        <p>Phone: +254 700 123 456 | Email: info@medicare.co.ke</p>
                      </div>
                    </div>

                    {/* Invoice Header */}
                    <div className="grid grid-cols-2 gap-12 mb-12">
                      <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">INVOICE</h2>
                        <div className="space-y-3 text-lg">
                          <p><span className="font-semibold">Invoice #:</span> {invoice.id}</p>
                          <p><span className="font-semibold">Date:</span> {new Date(invoice.created_at).toLocaleDateString()}</p>
                          <p><span className="font-semibold">Encounter:</span> {invoice.encounter_number}</p>
                          <p><span className="font-semibold">Status:</span>
                            <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                              invoice.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                              {statusLabel}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Bill To:</h3>
                        <div className="space-y-2 text-lg">
                          <p className="text-2xl font-semibold text-gray-900">{invoice.patient_name}</p>
                          <p className="text-gray-700">{invoice.phone || 'N/A'}</p>
                          <p className="text-gray-700">{invoice.email || 'N/A'}</p>
                          <p className="text-gray-700 font-medium">{invoice.encounter_type} Visit</p>
                        </div>
                      </div>
                    </div>

                    {/* Invoice Items */}
                    <div className="mb-12">
                      <h3 className="text-xl font-semibold text-gray-900 mb-6">Invoice Line Items</h3>
                      <table className="w-full text-lg">
                        <thead>
                          <tr className="border-b-2 border-gray-300 bg-gray-50">
                            <th className="text-left py-4 px-4 font-semibold text-gray-900">#</th>
                            <th className="text-left py-4 px-4 font-semibold text-gray-900">Description</th>
                            <th className="text-center py-4 px-4 font-semibold text-gray-900">Qty</th>
                            <th className="text-right py-4 px-4 font-semibold text-gray-900">Unit Price</th>
                            <th className="text-right py-4 px-4 font-semibold text-gray-900">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, index) => (
                            <tr key={item.id} className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                              <td className="py-4 px-4 font-medium">{index + 1}</td>
                              <td className="py-4 px-4">
                                <div>
                                  <div className="font-semibold text-gray-900">{item.description}</div>
                                  <div className="text-base text-gray-600 capitalize mt-1">{item.item_type}</div>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-center font-medium">{item.quantity}</td>
                              <td className="py-4 px-4 text-right">KSh {new Intl.NumberFormat().format(item.unit_price)}</td>
                              <td className="py-4 px-4 text-right font-semibold">KSh {new Intl.NumberFormat().format(item.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Totals */}
                    <div className="grid grid-cols-2 gap-12">
                      <div>
                        {payments.length > 0 && (
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Payment History</h3>
                            <div className="space-y-3">
                              {payments.map((payment) => (
                                <div key={payment.id} className="flex justify-between text-base bg-gray-50 p-3 rounded">
                                  <span className="font-medium">{payment.method} - {new Date(payment.created_at).toLocaleDateString()}</span>
                                  <span className="font-semibold">KSh {new Intl.NumberFormat().format(payment.amount)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="bg-gray-50 p-6 rounded-lg">
                          <h3 className="text-xl font-semibold text-gray-900 mb-4">Payment Summary</h3>
                          <div className="space-y-3 text-lg">
                            <div className="flex justify-between">
                              <span className="font-medium">Subtotal:</span>
                              <span className="font-semibold">KSh {new Intl.NumberFormat().format(invoice.total_amount)}</span>
                            </div>
                            {invoice.discount > 0 && (
                              <div className="flex justify-between text-green-600">
                                <span className="font-medium">Discount:</span>
                                <span className="font-semibold">-KSh {new Intl.NumberFormat().format(invoice.discount)}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="font-medium">Net Amount:</span>
                              <span className="font-semibold">KSh {new Intl.NumberFormat().format(invoice.net_amount || invoice.total_amount)}</span>
                            </div>
                            <div className="flex justify-between text-green-600">
                              <span className="font-medium">Amount Paid:</span>
                              <span className="font-semibold">KSh {new Intl.NumberFormat().format(invoice.paid_amount)}</span>
                            </div>
                            <div className="flex justify-between text-2xl font-bold border-t-2 border-gray-300 pt-4 mt-4">
                              <span>Balance Due:</span>
                              <span className={invoice.balance > 0 ? 'text-red-600' : 'text-green-600'}>
                                KSh {new Intl.NumberFormat().format(invoice.balance)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-12 pt-8 border-t-2 border-gray-300 text-center">
                      <p className="text-lg text-gray-700 font-medium">Thank you for choosing MediCare Hospital</p>
                      <p className="text-base text-gray-600 mt-2">Generated on {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PDF Preview Modal */}
        {showPdfPreview && pdfBlob && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[95vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">PDF Preview</h3>
                  <p className="text-sm text-gray-500">Invoice #{invoice.id} - {invoice.patient_name}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleDownloadFromPreview}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={closePdfPreview}
                    className="flex items-center justify-center w-10 h-10 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* PDF Viewer */}
              <div className="flex-1 p-4 overflow-hidden">
                <div className="w-full h-full bg-gray-100 rounded-lg overflow-hidden">
                  <iframe
                    src={URL.createObjectURL(pdfBlob)}
                    className="w-full h-full border-0"
                    title="Invoice Preview"
                    style={{ minHeight: '600px' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}



        {/* Coming Soon Modal */}
        {showComingSoon && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wrench className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon!</h3>
                <p className="text-gray-600 mb-2">{comingSoonFeature}</p>
                <p className="text-sm text-gray-500 mb-6">
                  This feature is currently under development. We're working hard to bring you the best hospital management experience.
                </p>
                <button
                  onClick={closeComingSoon}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </HMSLayout>
  );
}