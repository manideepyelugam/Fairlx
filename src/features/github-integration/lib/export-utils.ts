import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { jsPDF } from "jspdf";
import { marked } from "marked";

/**
 * Normalize directory tree characters for better rendering
 * Converts Unicode box-drawing characters to ASCII equivalents
 */
function normalizeDirectoryTree(text: string): string {
  return text
    // Replace Unicode tree characters with ASCII
    .replace(/├/g, '|')
    .replace(/└/g, '|')
    .replace(/─/g, '-')
    .replace(/│/g, '|')
    .replace(/\u2502/g, '|')
    .replace(/\u251C/g, '|')
    .replace(/\u2514/g, '|')
    .replace(/\u2500/g, '-');
}

/**
 * Prepare HTML from markdown for consistent rendering
 */
async function prepareHTMLContent(markdown: string): Promise<HTMLElement> {
  const html = await marked(markdown);
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  return tempDiv;
}

/**
 * Export documentation to Word (.docx) format
 */
export async function exportToWord(
  content: string,
  fileName: string = "documentation"
): Promise<void> {
  try {
    // Convert markdown to HTML first for consistent parsing
    const htmlContainer = await prepareHTMLContent(content);
    const paragraphs = htmlToDocxParagraphs(htmlContainer);
    
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440, // 1 inch
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          children: paragraphs,
        },
      ],
    });

    // Generate blob and trigger download
    const blob = await Packer.toBlob(doc);
    downloadBlob(blob, `${fileName}.docx`);
  } catch {
    throw new Error("Failed to export to Word document");
  }
}

/**
 * Convert HTML element to docx paragraphs
 */
function htmlToDocxParagraphs(container: HTMLElement): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  const processNode = (node: HTMLElement): void => {
    const tagName = node.tagName?.toLowerCase();
    const text = node.textContent || "";

    switch (tagName) {
      case "h1":
        paragraphs.push(
          new Paragraph({
            text: text.trim(),
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
          })
        );
        break;
      case "h2":
        paragraphs.push(
          new Paragraph({
            text: text.trim(),
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );
        break;
      case "h3":
        paragraphs.push(
          new Paragraph({
            text: text.trim(),
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 160, after: 80 },
          })
        );
        break;
      case "h4":
      case "h5":
      case "h6":
        paragraphs.push(
          new Paragraph({
            text: text.trim(),
            heading: HeadingLevel.HEADING_4,
            spacing: { before: 120, after: 60 },
          })
        );
        break;
      case "p":
        if (text.trim()) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun(text.trim())],
              spacing: { after: 120 },
            })
          );
        }
        break;
      case "pre":
      case "code":
        if (text.trim()) {
          const normalizedText = normalizeDirectoryTree(text);
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: normalizedText,
                  font: "Courier New",
                  size: 18,
                }),
              ],
              spacing: { before: 120, after: 120 },
              shading: {
                fill: "F5F5F5",
              },
            })
          );
        }
        break;
      case "ul":
        Array.from(node.children).forEach((child) => {
          const itemText = child.textContent || "";
          if (itemText.trim()) {
            paragraphs.push(
              new Paragraph({
                text: itemText.trim(),
                bullet: {
                  level: 0,
                },
                spacing: { after: 60 },
              })
            );
          }
        });
        break;
      case "ol":
        Array.from(node.children).forEach((child, index) => {
          const itemText = child.textContent || "";
          if (itemText.trim()) {
            paragraphs.push(
              new Paragraph({
                text: `${index + 1}. ${itemText.trim()}`,
                spacing: { after: 60 },
              })
            );
          }
        });
        break;
      case "strong":
      case "b":
        if (text.trim()) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: text.trim(), bold: true })],
              spacing: { after: 60 },
            })
          );
        }
        break;
      case "em":
      case "i":
        if (text.trim()) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: text.trim(), italics: true })],
              spacing: { after: 60 },
            })
          );
        }
        break;
      default:
        if (node.children && node.children.length > 0) {
          Array.from(node.children).forEach((child) => {
            processNode(child as HTMLElement);
          });
        } else if (text.trim()) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun(text.trim())],
              spacing: { after: 60 },
            })
          );
        }
    }
  };

  Array.from(container.children).forEach((child) => {
    processNode(child as HTMLElement);
  });

  return paragraphs;
}

/**
 * Export documentation to PDF format
 */
export async function exportToPDF(
  content: string,
  fileName: string = "documentation"
): Promise<void> {
  try {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Convert markdown to HTML
    const htmlContainer = await prepareHTMLContent(content);

    // Set up PDF styling
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = margin;
    const lineHeight = 7;

    // Function to add new page if needed
    const checkPageBreak = () => {
      if (yPosition > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Function to add text with word wrap
    const addText = (text: string, fontSize: number, isBold: boolean = false, useMonospace: boolean = false) => {
      pdf.setFontSize(fontSize);
      if (useMonospace) {
        pdf.setFont("courier", "normal");
      } else if (isBold) {
        pdf.setFont("helvetica", "bold");
      } else {
        pdf.setFont("helvetica", "normal");
      }
      
      const lines = pdf.splitTextToSize(text, maxWidth);
      lines.forEach((line: string) => {
        checkPageBreak();
        pdf.text(line, margin, yPosition);
        yPosition += lineHeight;
      });
    };

    // Parse HTML elements and add to PDF
    const processNode = (node: HTMLElement) => {
      const tagName = node.tagName.toLowerCase();
      const text = node.textContent || "";

      switch (tagName) {
        case "h1":
          yPosition += 5;
          addText(text, 18, true);
          yPosition += 3;
          break;
        case "h2":
          yPosition += 4;
          addText(text, 16, true);
          yPosition += 2;
          break;
        case "h3":
          yPosition += 3;
          addText(text, 14, true);
          yPosition += 2;
          break;
        case "h4":
        case "h5":
        case "h6":
          yPosition += 2;
          addText(text, 12, true);
          yPosition += 1;
          break;
        case "p":
          if (text.trim()) {
            addText(text, 10, false);
            yPosition += 2;
          }
          break;
        case "pre":
        case "code":
          if (text.trim()) {
            checkPageBreak();
            pdf.setFont("courier", "normal");
            pdf.setFontSize(9);
            
            const normalizedText = normalizeDirectoryTree(text);
            
            const codeLines = pdf.splitTextToSize(normalizedText, maxWidth - 4);
            codeLines.forEach((line: string) => {
              checkPageBreak();
              pdf.text(line, margin + 2, yPosition);
              yPosition += 6;
            });
            yPosition += 2;
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(10);
          }
          break;
        case "ul":
        case "ol":
          Array.from(node.children).forEach((child, index) => {
            const bullet = tagName === "ul" ? "• " : `${index + 1}. `;
            const itemText = child.textContent || "";
            if (itemText.trim()) {
              addText(bullet + itemText, 10, false);
            }
          });
          yPosition += 2;
          break;
        case "strong":
        case "b":
          if (text.trim()) {
            addText(text, 10, true);
          }
          break;
        default:
          if (text.trim() && node.children.length === 0) {
            addText(text, 10, false);
          } else {
            Array.from(node.children).forEach((child) => {
              processNode(child as HTMLElement);
            });
          }
      }
    };

    // Process all child nodes
    Array.from(htmlContainer.children).forEach((child) => {
      processNode(child as HTMLElement);
    });

    // Save PDF
    pdf.save(`${fileName}.pdf`);
  } catch {
    throw new Error("Failed to export to PDF document");
  }
}

/**
 * Trigger file download
 */
function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
