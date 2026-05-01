const fs = require('fs');

let dashPath = 'd:/webmaa/src/app/dashboard/orders/page.js';
let pt = fs.readFileSync(dashPath, 'utf8');

// Inject pdfState
if (!pt.includes('pdfState')) {
  pt = pt.replace('const [downloadingPdf, setDownloadingPdf] = useState(null);', 
                  `const [downloadingPdf, setDownloadingPdf] = useState(null);\n  const [pdfProgress, setPdfProgress] = useState(0);\n  const [pdfState, setPdfState] = useState('');`);
}

// Modify the old generatePDF
const oldPdfStartStr = `const generatePDF = async (order) => {`;
if (pt.includes(oldPdfStartStr)) {
  pt = pt.replace(`const generatePDF = async (order) => {
    try {
      setDownloadingPdf(order.id);
      const toastId = toast.loading('PDF রেন্ডার করার প্রস্তুতি...');`, 
`const generatePDF = async (order) => {
    if (downloadingPdf) return;
    try {
      setDownloadingPdf(order.id);
      setPdfState('Preparing...');
      setPdfProgress(10);
      const toastId = toast.loading('Preparing...');`);

  pt = pt.replace(`setPdfProgress(50);
      toast.loading('PDF রেন্ডার হচ্ছে... (50%)', { id: toastId });`,
`setPdfState('Downloading (50%)');
      setPdfProgress(50);
      toast.loading('Downloading (50%)...', { id: toastId });`);

  pt = pt.replace(`setPdfProgress(90);
      toast.loading('PDF সেভ হচ্ছে... (90%)', { id: toastId });`,
`setPdfState('Downloading (90%)');
      setPdfProgress(90);
      toast.loading('Downloading (90%)...', { id: toastId });`);

  pt = pt.replace(`pdf.save(\`Invoice_\${order.orderNumber || order.orderIdVisual || order.id.slice(-6)}.pdf\`);
      setPdfProgress(100);
      toast.success('PDF সফলভাবে ডাউনলোড হয়েছে! 📄', { id: toastId });
    } catch (err) {
      toast.error('PDF ডাউনলোড ব্যর্থ হয়েছে!', { id: toastId });
      console.error(err);
    } finally {
      setTimeout(() => {
        setDownloadingPdf(null);
        setPdfProgress(0);
      }, 500);
    }`,
`pdf.save(\`Invoice_\${order.orderNumber || order.orderIdVisual || order.id.slice(-6)}.pdf\`);
      setPdfState('Completed');
      setPdfProgress(100);
      toast.success('PDF Downloaded successfully!', { id: toastId });
    } catch (err) {
      toast.error('PDF download failed. Please try again.', { id: toastId });
      console.error(err);
      setPdfState('');
    } finally {
      setTimeout(() => {
        setDownloadingPdf(null);
        setPdfProgress(0);
        setPdfState('');
      }, 2000);
    }`);
}

// Replace the download button
let oldBtnRegex = /<button onClick=\{\(\) => generatePDF\(order\)\}.*?<\/button>/s;
if (oldBtnRegex.test(pt)) {
  pt = pt.replace(oldBtnRegex, `<button onClick={() => generatePDF(order)} disabled={downloadingPdf === order.id} className="min-w-[46px] h-[46px] px-3 bg-white border border-slate-200 text-slate-700 rounded-xl flex items-center justify-center hover:bg-slate-900 hover:border-slate-900 hover:text-white transition-colors shadow-sm tooltip relative overflow-hidden" title="Download Invoice">
                                  {downloadingPdf === order.id && <div className="absolute left-0 top-0 bottom-0 bg-purple-500/20 transition-all duration-300" style={{ width: \`\${pdfProgress}%\` }} />}
                                  <span className="relative z-10 flex items-center gap-2">
                                    {downloadingPdf === order.id ? <><Loader2 size={16} className="animate-spin text-purple-600"/> <span className="text-[10px] font-black">{pdfState}</span></> : <Download size={18} strokeWidth={2.5}/>}
                                  </span>
                               </button>`);
  console.log('Fixed Button');
} else {
  console.log('Button not found');
}

fs.writeFileSync(dashPath, pt);
