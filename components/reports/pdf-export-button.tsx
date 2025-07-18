"use client";

import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FileDown } from 'lucide-react';
import { toast } from 'sonner';

type PDFExportButtonProps = {
  contentRef: React.RefObject<HTMLDivElement>;
  fileName?: string;
  companyName?: string;
  statementType?: string;
};

export function PDFExportButton({ 
  contentRef, 
  fileName = 'financial-statement.pdf',
  companyName = '',
  statementType = 'Financial Statement'
}: PDFExportButtonProps) {
  const [isExporting, setIsExporting] = React.useState(false);

  const prepareElementForCapture = (element: HTMLElement) => {
    // Store original styles to restore later
    const originalStyles = {
      position: element.style.position,
      left: element.style.left,
      top: element.style.top,
      overflow: element.style.overflow,
      width: element.style.width,
      height: element.style.height
    };

    // Temporarily modify styles for better capture
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.style.top = '0';
    element.style.overflow = 'visible';
    element.style.width = 'auto';
    element.style.height = 'auto';

    return originalStyles;
  };

  const restoreElementStyles = (element: HTMLElement, originalStyles: any) => {
    Object.keys(originalStyles).forEach(key => {
      element.style[key as any] = originalStyles[key] || '';
    });
  };

  const applyFinancialStatementStyles = (clonedDoc: Document) => {
    // Remove existing stylesheets
    const existingStyles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
    existingStyles.forEach(style => style.remove());
    
    // Ensure all containers are properly sized
    const body = clonedDoc.body;
    if (body) {
      body.style.width = 'auto';
      body.style.minWidth = 'max-content';
      body.style.overflow = 'visible';
    }

    // Handle all tables to ensure columns are visible
    const tables = clonedDoc.querySelectorAll('table');
    tables.forEach(table => {
      if (table instanceof HTMLElement) {
        table.style.width = 'auto';
        table.style.minWidth = 'max-content';
        table.style.whiteSpace = 'nowrap';
        table.style.overflow = 'visible';
      }
    });

    // Handle all container divs
    const containers = clonedDoc.querySelectorAll('div');
    containers.forEach(div => {
      if (div instanceof HTMLElement) {
        div.style.overflow = 'visible';
        div.style.width = 'auto';
        div.style.minWidth = 'max-content';
      }
    });
    
    const style = clonedDoc.createElement('style');
    style.textContent = `
      /* Professional Financial Statement Styles */
      * {
        box-sizing: border-box;
        font-family: 'Times New Roman', serif !important;
        color: #000000 !important;
        background: transparent !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        text-shadow: none !important;
        overflow: visible !important;
      }
      
      body, html {
        background: #ffffff !important;
        font-size: 14px;
        line-height: 1.5;
        padding: 20px;
        width: auto !important;
        min-width: max-content !important;
        overflow: visible !important;
      }
      
      /* Ensure all containers can expand and center content */
      div, section, main {
        overflow: visible !important;
        width: auto !important;
        min-width: max-content !important;
        margin: 0 auto !important;
        text-align: center !important;
      }
      
      /* Headers */
      h1, h2, h3 {
        text-align: center;
        font-weight: bold;
        margin: 15px 0 10px 0;
        white-space: nowrap;
      }
      
      h1 { font-size: 20px; }
      h2 { font-size: 18px; }
      h3 { font-size: 16px; }
      
      /* Tables - Essential for financial statements */
      table {
        border-collapse: collapse;
        margin: 15px auto;
        font-size: 13px;
        width: auto !important;
        min-width: max-content !important;
        white-space: nowrap !important;
        overflow: visible !important;
      }
      
      th, td {
        padding: 8px 15px;
        text-align: left;
        border: none;
        vertical-align: top;
        white-space: nowrap !important;
        overflow: visible !important;
      }
      
      th {
        font-weight: bold;
        border-bottom: 2px solid #000000;
        text-align: center;
      }
      
      /* Financial statement specific styling */
      .currency, .amount, [class*="text-right"] {
        text-align: right !important;
        font-family: 'Times New Roman', serif !important;
      }
      
      .total-row, .subtotal-row {
        border-top: 1px solid #000000;
        font-weight: bold;
      }
      
      .grand-total {
        border-top: 2px solid #000000;
        border-bottom: 2px solid #000000;
        font-weight: bold;
      }
      
      /* Remove unwanted visual elements */
      .bg-*, [class*="bg-"] {
        background: transparent !important;
      }
      
      /* Ensure proper spacing */
      p {
        margin: 8px 0;
        white-space: nowrap;
        font-size: 14px;
        text-align: center;
      }
      
      /* Hide interactive elements */
      button, input, select, textarea {
        display: none !important;
      }
      
      /* Force visibility of all content */
      .overflow-hidden, .overflow-x-auto, .overflow-y-auto {
        overflow: visible !important;
      }
    `;
    clonedDoc.head.appendChild(style);
  };

  const exportToPDF = async () => {
    if (!contentRef.current) {
      toast.error("No content available for export");
      return;
    }
    
    setIsExporting(true);
    toast.loading("Generating PDF...", { id: 'pdf-export' });

    try {
      const element = contentRef.current;
      
      // Reset scroll position to ensure full capture
      window.scrollTo(0, 0);
      element.scrollTo?.(0, 0);
      
      // Wait for scroll to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Generate canvas with optimized settings for wide tables
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        // Use actual dimensions to capture full width
        width: Math.max(element.scrollWidth, element.offsetWidth),
        height: Math.max(element.scrollHeight, element.offsetHeight),
        scrollX: 0,
        scrollY: 0,
        windowWidth: Math.max(element.scrollWidth, window.innerWidth),
        windowHeight: Math.max(element.scrollHeight, window.innerHeight),
        onclone: (clonedDoc, clonedElement) => {
          applyFinancialStatementStyles(clonedDoc);
          
          // Ensure the cloned element captures full width
          if (clonedElement instanceof HTMLElement) {
            clonedElement.style.width = `${Math.max(element.scrollWidth, element.offsetWidth)}px`;
            clonedElement.style.overflow = 'visible';
          }
        }
      });

      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error("Failed to generate content");
      }

      const imgData = canvas.toDataURL('image/png');
      
      // Determine PDF orientation based on content width
      const isWideContent = canvas.width > canvas.height;
      // const orientation = isWideContent ? 'landscape' : 'portrait';
      const orientation = 'portrait';
      
      // Create PDF with appropriate orientation
      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: 'a4'
      });

      const imgProperties = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.width;
      const pdfHeight = pdf.internal.pageSize.height;

      const margin = 10;
      const headerSpace = companyName ? (statementType ? 25 : 15) : 0;
      const availableWidth = pdfWidth - (margin * 2);
      const availableHeight = pdfHeight - (margin * 2) - headerSpace - 15; // Space for footer
      
      // Calculate image dimensions maintaining aspect ratio
      const imgAspectRatio = canvas.height / canvas.width;
      let imgWidth = availableWidth;
      let imgHeight = availableWidth * imgAspectRatio;
      
      // If image is too tall, scale down to fit
      if (imgHeight > availableHeight) {
        imgHeight = availableHeight;
        imgWidth = availableHeight / imgAspectRatio;
      }
      
      // Center the image horizontally and position with header space
      const xPosition = (pdfWidth - imgWidth) / 2;
      const yPosition = margin + headerSpace;
      
      // Add header if company name provided
      if (companyName) {
        pdf.setFontSize(16);
        pdf.setFont('times', 'bold');
        pdf.text(companyName, pdfWidth / 2, margin - 5, { align: 'center' });
        
        // Add statement type
        if (statementType) {
          pdf.setFontSize(14);
          pdf.setFont('times', 'normal');
          pdf.text(statementType, pdfWidth / 2, margin + 5, { align: 'center' });
        }
      }
      
      // Add the financial statement
      pdf.addImage(imgData, 'PNG', xPosition, yPosition, imgWidth, imgHeight);
      
      // Add footer with generation date
      pdf.setFontSize(10);
      pdf.setFont('times', 'normal');
      pdf.text(
        `Generated on ${new Date().toLocaleDateString()} - Page 1 of 1`,
        pdfWidth / 2,
        pdfHeight - 10,
        { align: 'center' }
      );

      pdf.save(fileName);
      
      toast.dismiss('pdf-export');
      toast.success("PDF exported successfully");
      
    } catch (error) {
      console.error("PDF export failed:", error);
      toast.dismiss('pdf-export');
      toast.error("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={exportToPDF}
      disabled={isExporting}
      className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
    >
      {isExporting ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Generating PDF...
        </>
      ) : (
        <>
          <FileDown className="w-4 h-4" />
          Export PDF
        </>
      )}
    </button>
  );
}