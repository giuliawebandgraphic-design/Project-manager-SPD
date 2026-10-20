import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ExportPdfOptions {
  filename: string;
  elementId?: string;
  element?: HTMLElement | null;
  onStart?: () => void;
  onSuccess?: () => void;
  onError?: (err: any) => void;
}

/**
 * Exports a DOM element to an elegant, high-resolution A4 PDF document
 */
export async function exportElementToPdf(options: ExportPdfOptions): Promise<void> {
  const { filename, elementId, element: directElement, onStart, onSuccess, onError } = options;

  try {
    if (onStart) onStart();

    const target = directElement || (elementId ? document.getElementById(elementId) : null);
    if (!target) {
      throw new Error(`Elemento non trovato per l'esportazione PDF.`);
    }

    // Scroll to top temporarily to ensure full canvas capture
    const originalScrollY = window.scrollY;
    window.scrollTo(0, 0);

    // Create high-res canvas
    const canvas = await html2canvas(target, {
      scale: 2, // High resolution for crisp printing
      useCORS: true,
      logging: false,
      backgroundColor: '#FFFFFF',
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc) => {
        // Ensure all elements in clone are visible and unclipped
        const clonedTarget = directElement && directElement.id 
          ? clonedDoc.getElementById(directElement.id) 
          : elementId 
            ? clonedDoc.getElementById(elementId) 
            : null;
            
        if (clonedTarget) {
          clonedTarget.style.boxShadow = 'none';
          clonedTarget.style.margin = '0 auto';
          clonedTarget.style.maxWidth = '850px';
        }
      }
    });

    // Restore scroll
    window.scrollTo(0, originalScrollY);

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // A4 dimensions in mm: 210 x 297
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pdfWidth = 210;
    const pageHeight = 297;
    const margin = 8; // 8mm margin
    const contentWidth = pdfWidth - (margin * 2);
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    let heightLeft = contentHeight;
    let position = margin;
    let page = 1;

    // First page
    pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight, '', 'FAST');
    heightLeft -= (pageHeight - (margin * 2));

    // Handle subsequent pages if content overflows A4
    while (heightLeft > 0) {
      pdf.addPage();
      page++;
      position = margin - ((page - 1) * (pageHeight - (margin * 2)));
      pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight, '', 'FAST');
      heightLeft -= (pageHeight - (margin * 2));
    }

    // Sanitize filename
    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(cleanFilename);

    if (onSuccess) onSuccess();
  } catch (error) {
    console.error('Errore durante la generazione del PDF:', error);
    if (onError) onError(error);
    throw error;
  }
}
