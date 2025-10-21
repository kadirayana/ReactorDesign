import { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import jsPDF and html2canvas to avoid SSR issues
const jsPDF = dynamic(() => import('jspdf').then(mod => mod.jsPDF), { ssr: false });
const html2canvas = dynamic(() => import('html2canvas'), { ssr: false });

export default function CVDownloadButton() {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      
      // Dynamically import the libraries
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      
      const element = document.querySelector('.cv-page');
      
      if (!element) {
        alert('Error generating file.');
        setIsDownloading(false);
        return;
      }

      // Hide all download buttons temporarily
      const downloadBtns = element.querySelectorAll('.cv-download-btn');
      downloadBtns.forEach(b => b.style.display = 'none');

      try {
        // Create canvas from the element
        const canvas = await html2canvas(element, {
          allowTaint: true,
          useCORS: true,
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false,
          useCORS: true,
          windowHeight: 1122, // A4 height at 96 DPI (210mm / 25.4 * 96)
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
          compress: true,
        });

        const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
        const pageWidth = pdf.internal.pageSize.getWidth();   // 210mm
        const margin = 10; // 10mm margins
        const availableWidth = pageWidth - (2 * margin);
        const availableHeight = pageHeight - (2 * margin);
        
        // Calculate image height to fit available width with aspect ratio
        const imgHeight = (canvas.height * availableWidth) / canvas.width;
        
        let heightLeft = imgHeight;
        let position = margin;

        // Add image to PDF, handling multiple pages if needed
        pdf.addImage(imgData, 'PNG', margin, position, availableWidth, imgHeight);
        heightLeft -= availableHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight + margin;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', margin, position, availableWidth, imgHeight);
          heightLeft -= availableHeight;
        }

        pdf.save('KadirAyanaCV.pdf');
      } finally {
        // Show the download buttons again
        downloadBtns.forEach(b => b.style.display = 'inline-block');
        setIsDownloading(false);
      }
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating file.');
      setIsDownloading(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
      <button 
        onClick={handleDownload} 
        disabled={isDownloading}
        className="cv-download-btn"
        style={{
          backgroundColor: isDownloading ? '#999' : '#00539C',
          color: 'white',
          padding: '12px 24px',
          border: 'none',
          borderRadius: '6px',
          cursor: isDownloading ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: '600',
          transition: 'all 0.3s ease',
          opacity: isDownloading ? 0.7 : 1,
        }}
        onMouseOver={(e) => {
          if (!isDownloading) {
            e.target.style.backgroundColor = '#003458';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 12px rgba(0, 83, 156, 0.15)';
          }
        }}
        onMouseOut={(e) => {
          if (!isDownloading) {
            e.target.style.backgroundColor = '#00539C';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }
        }}
      >
        📥 {isDownloading ? 'Download CV as PDF...' : 'Download CV as PDF'}
      </button>

      <button
        onClick={async () => {
          try {
            setIsDownloading(true);
            const element = document.querySelector('.cv-page');
            if (!element) {
              alert('Error generating file.');
              setIsDownloading(false);
              return;
            }
            // Hide buttons while generating
            const downloadBtns = element.querySelectorAll('.cv-download-btn');
            downloadBtns.forEach(b => b.style.display = 'none');

                  // Collect critical CSS from the page and inline it to improve Word fidelity
                  const gatherStyles = () => {
                    let css = '';
                    for (const sheet of Array.from(document.styleSheets)) {
                      try {
                        if (!sheet.cssRules) continue;
                        for (const rule of Array.from(sheet.cssRules)) {
                          css += rule.cssText + '\n';
                        }
                      } catch (e) {
                        // Ignore cross-origin stylesheets
                      }
                    }
                    return css;
                  };

                  const criticalCSS = gatherStyles();

                  const html = `<!doctype html><html><head><meta charset="utf-8"><title>KadirAyanaCV</title><style>${criticalCSS}</style></head><body>${element.innerHTML}</body></html>`;

                  // POST the HTML to our server-side API which uses html-to-docx
                  try {
                    const response = await fetch('/api/generate-docx', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ html }),
                    });

                    if (!response.ok) {
                      const text = await response.text();
                      throw new Error('Server error generating docx: ' + text);
                    }

                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'KadirAyanaCV.docx';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                  } catch (serverErr) {
                    console.error('Server-side docx generation failed:', serverErr);
                    alert('Error generating file.');
                  }

            // restore buttons
            downloadBtns.forEach(b => b.style.display = 'inline-block');
          } catch (err) {
            console.error('Error generating Word:', err);
            alert('Error generating file.');
          } finally {
            setIsDownloading(false);
          }
        }}
        disabled={isDownloading}
        className="cv-download-btn"
        style={{
          backgroundColor: isDownloading ? '#999' : '#28a745',
          color: 'white',
          padding: '12px 24px',
          border: 'none',
          borderRadius: '6px',
          cursor: isDownloading ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: '600',
          transition: 'all 0.3s ease',
          opacity: isDownloading ? 0.7 : 1,
        }}
      >
        📝 Download CV as Word
      </button>
    </div>
  );
}
