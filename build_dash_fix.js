const fs = require('fs');

let dashPath = 'd:/webmaa/src/app/dashboard/orders/page.js';
let pt = fs.readFileSync(dashPath, 'utf8');

// Replace downloadPdf state with downloadingPdf & pdfState
let stateDeclarations = pt.indexOf('const [downloadingPdf, setDownloadingPdf] = useState(null);');
if (stateDeclarations !== -1) {
  const newStates = `const [downloadingPdf, setDownloadingPdf] = useState(null);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [pdfState, setPdfState] = useState('');`;
  if (!pt.includes('pdfState')) {
    pt = pt.replace('const [downloadingPdf, setDownloadingPdf] = useState(null);', newStates);
  }
}

// Replace generatePDF
const oldGenPdfStart = pt.indexOf('const generatePDF = async (order) => {');
if (oldGenPdfStart !== -1) {
  let endGenPdf = pt.indexOf('};', oldGenPdfStart) + 2;
  
  // Actually, I can just replace the whole generatePDF block
  const newGeneratePdf = `  const generatePDF = async (order) => {
    if (downloadingPdf) return;
    try {
      setDownloadingPdf(order.id);
      setPdfState('Preparing...');
      setPdfProgress(10);
      
      const toastId = toast.loading('PDF জেনারেট হচ্ছে...');
      const invoiceElement = document.getElementById(\`invoice-\${order.id}\`);
      if (!invoiceElement) throw new Error('Invoice content not found');

      invoiceElement.style.display = 'block';

      setPdfState('Downloading (40%)');
      setPdfProgress(40);
      
      const canvas = await html2canvas(invoiceElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      invoiceElement.style.display = 'none';

      setPdfState('Downloading (70%)');
      setPdfProgress(70);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      let heightLeft = pdfHeight;
      let position = 0;
      
      setPdfState('Downloading (90%)');
      setPdfProgress(90);

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(\`Invoice_\${order.orderNumber || order.orderIdVisual || order.id.slice(-6)}.pdf\`);
      
      setPdfState('Completed');
      setPdfProgress(100);
      toast.success('PDF সফলভাবে ডাউনলোড হয়েছে! 📄', { id: toastId });
    } catch (err) {
      toast.error('PDF ডাউনলোড ব্যর্থ হয়েছে!');
      console.error(err);
      setPdfState('');
    } finally {
      setTimeout(() => {
        setDownloadingPdf(null);
        setPdfProgress(0);
        setPdfState('');
      }, 1000);
    }
  };`;
  
  // find the correct end
  let openBraces = 0;
  let pos = oldGenPdfStart;
  while(pos < pt.length) {
    if (pt[pos] === '{') openBraces++;
    else if (pt[pos] === '}') {
      openBraces--;
      if (openBraces === 0) {
        break;
      }
    }
    pos++;
  }
  
  pt = pt.substring(0, oldGenPdfStart) + newGeneratePdf + pt.substring(pos + 1);
  console.log('Fixed dashboard generatePDF');
}

// Replace the button
const oldButton = `<button onClick={() => generatePDF(order)} disabled={downloadingPdf === order.id} className="w-[46px] h-[46px] bg-white border border-slate-200 text-slate-700 rounded-xl flex items-center justify-center hover:bg-slate-900 hover:border-slate-900 hover:text-white transition-colors shadow-sm tooltip" title="Download Invoice">
                                  {downloadingPdf === order.id ? <Loader2 size={16} className="animate-spin text-purple-600"/> : <Download size={18} strokeWidth={2.5}/>}
                               </button>`;
const newButton = `<button onClick={() => generatePDF(order)} disabled={downloadingPdf === order.id} className="min-w-[46px] h-[46px] px-3 bg-white border border-slate-200 text-slate-700 rounded-xl flex items-center justify-center hover:bg-slate-900 hover:border-slate-900 hover:text-white transition-colors shadow-sm tooltip relative overflow-hidden" title="Download Invoice">
                                  {downloadingPdf === order.id && <div className="absolute left-0 top-0 bottom-0 bg-purple-500/20 transition-all duration-300" style={{ width: \`\${pdfProgress}%\` }} />}
                                  <span className="relative z-10 flex items-center gap-2">
                                    {downloadingPdf === order.id ? <><Loader2 size={16} className="animate-spin text-purple-600"/> <span className="text-[10px] font-black">{pdfState}</span></> : <Download size={18} strokeWidth={2.5}/>}
                                  </span>
                               </button>`;

if (pt.includes(oldButton)) {
  pt = pt.replace(oldButton, newButton);
  console.log('Fixed dashboard button');
} else {
  // try line matching
  let oldBtnRegex = /<button onClick=\{\(\) => generatePDF\(order\)\}.*?<\/button>/s;
  if (oldBtnRegex.test(pt)) {
    pt = pt.replace(oldBtnRegex, newButton);
    console.log('Fixed dashboard button (regex)');
  } else {
    console.log('NOT FOUND dashboard button');
  }
}

fs.writeFileSync(dashPath, pt);
