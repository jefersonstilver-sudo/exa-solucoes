import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export class ContractPDFExporter {
  private pdf: jsPDF;
  private pageHeight: number;
  private pageWidth: number;
  private margin: number;
  private contentWidth: number;
  private contentHeight: number;
  private currentY: number;

  constructor() {
    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    this.pageWidth = 210;
    this.pageHeight = 297;
    this.margin = 15;
    this.contentWidth = this.pageWidth - (this.margin * 2);
    this.contentHeight = this.pageHeight - (this.margin * 2);
    this.currentY = this.margin;
  }

  async exportFromElement(elementId: string, filename: string = 'contrato'): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    // Clone the element to avoid modifying the original
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Apply print-ready styles to clone
    clone.style.width = '210mm';
    clone.style.padding = '15mm 20mm';
    clone.style.backgroundColor = '#ffffff';
    clone.style.boxShadow = 'none';
    clone.style.border = 'none';

    // Remove any contenteditable styling hints
    const editableFields = clone.querySelectorAll('[contenteditable]');
    editableFields.forEach((field) => {
      const el = field as HTMLElement;
      el.style.backgroundColor = 'transparent';
      el.style.outline = 'none';
      el.removeAttribute('contenteditable');
    });

    // Create temporary container
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '210mm';
    tempContainer.style.backgroundColor = '#ffffff';
    tempContainer.appendChild(clone);
    document.body.appendChild(tempContainer);

    try {
      // Render with html2canvas at high quality
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: clone.scrollWidth,
        height: clone.scrollHeight,
        windowWidth: clone.scrollWidth,
        windowHeight: clone.scrollHeight,
      });

      // Calculate dimensions
      const imgWidth = this.contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Calculate how many pages we need
      const totalPages = Math.ceil(imgHeight / this.contentHeight);
      
      // Generate PDF with intelligent page breaks
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          this.pdf.addPage();
        }

        // Calculate which portion of the image to render
        const sourceY = page * (canvas.height / totalPages);
        const sourceHeight = canvas.height / totalPages;
        
        // Create a new canvas for this page section
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;
        
        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            canvas,
            0, sourceY, canvas.width, sourceHeight,
            0, 0, canvas.width, sourceHeight
          );
        }

        const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
        const pageImgHeight = (sourceHeight * imgWidth) / canvas.width;
        
        this.pdf.addImage(
          pageImgData,
          'JPEG',
          this.margin,
          this.margin,
          imgWidth,
          pageImgHeight
        );

        // Add page number footer
        this.addPageFooter(page + 1, totalPages);
      }

      // Save the PDF
      this.pdf.save(`${filename}.pdf`);
      
    } finally {
      // Clean up
      document.body.removeChild(tempContainer);
    }
  }

  private addPageFooter(currentPage: number, totalPages: number): void {
    const footerY = this.pageHeight - 8;
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(128, 128, 128);
    this.pdf.text(
      `Página ${currentPage} de ${totalPages}`,
      this.pageWidth / 2,
      footerY,
      { align: 'center' }
    );
  }

  // Alternative method: Smart page break detection
  async exportWithSmartBreaks(elementId: string, filename: string = 'contrato'): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    // Get all sections that should not be broken
    const noBreakSections = element.querySelectorAll('.no-break');
    const sections: HTMLElement[] = [];
    
    if (noBreakSections.length > 0) {
      noBreakSections.forEach(section => sections.push(section as HTMLElement));
    } else {
      // Fallback: treat the whole document as one section
      sections.push(element as HTMLElement);
    }

    let pageNumber = 1;
    let currentPageHeight = 0;
    const maxPageHeight = this.contentHeight;

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      
      // Clone and prepare section
      const clone = section.cloneNode(true) as HTMLElement;
      this.prepareElementForPdf(clone);

      // Render section
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgWidth = this.contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Check if we need a new page
      if (currentPageHeight + imgHeight > maxPageHeight && currentPageHeight > 0) {
        this.addPageFooter(pageNumber, -1); // -1 = unknown total
        this.pdf.addPage();
        pageNumber++;
        currentPageHeight = 0;
      }

      // Add section to PDF
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      this.pdf.addImage(
        imgData,
        'JPEG',
        this.margin,
        this.margin + currentPageHeight,
        imgWidth,
        imgHeight
      );

      currentPageHeight += imgHeight + 2; // 2mm gap between sections
    }

    // Add final page footer
    this.addPageFooter(pageNumber, pageNumber);

    // Save
    this.pdf.save(`${filename}.pdf`);
  }

  private prepareElementForPdf(element: HTMLElement): void {
    element.style.backgroundColor = '#ffffff';
    element.style.boxShadow = 'none';
    element.style.border = 'none';

    // Remove editable styling
    const editables = element.querySelectorAll('[contenteditable]');
    editables.forEach((el) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.backgroundColor = 'transparent';
      htmlEl.removeAttribute('contenteditable');
    });
  }
}

// Utility function for quick export
export async function exportContractToPDF(elementId: string = 'contract-preview', filename?: string): Promise<void> {
  const exporter = new ContractPDFExporter();
  const finalFilename = filename || `contrato-${new Date().toISOString().split('T')[0]}`;
  await exporter.exportFromElement(elementId, finalFilename);
}
