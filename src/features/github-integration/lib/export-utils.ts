import {
  AlignmentType,
  Document,
  HeadingLevel,
  NumberFormat,
  Packer,
  Paragraph,
  TextRun,
  BorderStyle,
} from "docx";
import { jsPDF } from "jspdf";
import { marked } from "marked";

/**
 * Normalize directory tree characters for better PDF rendering
 * Converts Unicode box-drawing characters to ASCII equivalents
 */
function normalizeDirectoryTree(text: string): string {
  return text
    // Replace Unicode tree characters with ASCII
    .replace(/[├└]/g, '|')      // Box drawing characters to pipe
    .replace(/[─]/g, '--')       // Horizontal line to double dash
    .replace(/[│]/g, '|')        // Vertical line to pipe
    .replace(/[┌┐┘]/g, '+')      // Corner characters to plus
    // Also handle other common tree drawing patterns
    .replace(/[├│└]/g, '|')
    .replace(/[─┬┴┼]/g, '-')
    // Handle special spacing issues
    .replace(/\u2502/g, '|')     // Box drawings light vertical
    .replace(/\u251C/g, '|')     // Box drawings light vertical and right
    .replace(/\u2514/g, '|')     // Box drawings light up and right
    .replace(/\u2500/g, '-')     // Box drawings light horizontal
    .replace(/\u252C/g, '+')     // Box drawings light down and horizontal
    .replace(/\u2534/g, '+')     // Box drawings light up and horizontal
    .replace(/\u253C/g, '+');    // Box drawings light vertical and horizontal
}

/**
 * Detect if text contains a directory structure
 */
function isDirectoryStructure(text: string): boolean {
  const patterns = [
    /[├└│─]/,                    // Unicode box-drawing characters
    /\|--\s+/,                   // ASCII tree pattern
    /[│┌┐└├]/,                   // More box-drawing chars
    /^\s*[|+`]\s*[-`]\s*\w+/m,   // Tree-like patterns
  ];
  
  return patterns.some(pattern => pattern.test(text));
}

/**
 * Convert directory structure to clean ASCII format
 */
function formatDirectoryStructure(text: string): string {
  // First normalize the tree characters
  const formatted = normalizeDirectoryTree(text);
  
  // Split into lines and process each
  const lines = formatted.split('\n');
  const formattedLines = lines.map(line => {
    // Ensure consistent indentation
    return line
      .replace(/^([|\s]+)(--|\+)\s*/, (match, prefix, connector) => {
        // Clean up spacing
        const cleanPrefix = prefix.replace(/\s+/g, ' ');
        return `${cleanPrefix}${connector} `;
      });
  });
  
  return formattedLines.join('\n');
}

/**
 * Export documentation to Word (.docx) format
 */
export async function exportToWord(
  content: string,
  fileName: string = "documentation"
): Promise<void> {
  try {
    // Parse markdown and create document
    const paragraphs = parseMarkdownToDocx(content);
    
    const doc = new Document({
      numbering: {
        config: [
          {
            reference: "numbered-list",
            levels: [
              {
                level: 0,
                format: NumberFormat.DECIMAL,
                text: "%1.",
                alignment: AlignmentType.START,
              },
            ],
          },
          {
            reference: "bullet-list",
            levels: [
              {
                level: 0,
                format: NumberFormat.BULLET,
                text: "•",
                alignment: AlignmentType.START,
              },
            ],
          },
        ],
      },
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
  } catch (error) {
    console.error("Error exporting to Word:", error);
    throw new Error("Failed to export to Word document");
  }
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
    const html = await marked(content);
    
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

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
            
            // Check if this is a directory structure and format accordingly
            const normalizedText = isDirectoryStructure(text) 
              ? formatDirectoryStructure(text)
              : normalizeDirectoryTree(text);
            
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
    Array.from(tempDiv.children).forEach((child) => {
      processNode(child as HTMLElement);
    });

    // Save PDF
    pdf.save(`${fileName}.pdf`);
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    throw new Error("Failed to export to PDF document");
  }
}

/**
 * Parse markdown content to docx paragraphs
 */
function parseMarkdownToDocx(markdown: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const lines = markdown.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (!line.trim()) {
      paragraphs.push(new Paragraph({ text: "" }));
      i++;
      continue;
    }

    // Handle headers (# Header)
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const text = headerMatch[2].trim();
      
      const headingLevels = [
        HeadingLevel.HEADING_1,
        HeadingLevel.HEADING_2,
        HeadingLevel.HEADING_3,
        HeadingLevel.HEADING_4,
        HeadingLevel.HEADING_5,
        HeadingLevel.HEADING_6,
      ];

      paragraphs.push(
        new Paragraph({
          text: text,
          heading: headingLevels[level - 1],
          spacing: { before: 240, after: 120 },
        })
      );
      i++;
      continue;
    }

    // Handle code blocks (```...```)
    if (line.trim().startsWith("```")) {
      const codeLines: string[] = [];
      i++; // Skip the opening ```
      
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      
      if (i < lines.length) i++; // Skip the closing ```
      
      // Format code content - apply special formatting for directory structures
      const codeContent = codeLines.join("\n");
      const normalizedContent = isDirectoryStructure(codeContent)
        ? formatDirectoryStructure(codeContent)
        : normalizeDirectoryTree(codeContent);
      
      // Add code block as monospace paragraph
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: normalizedContent,
              font: "Courier New",
              size: 18,
            }),
          ],
          spacing: { before: 120, after: 120 },
          border: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
            left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
            right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          },
        })
      );
      continue;
    }

    // Handle bullet points (- item or * item)
    const bulletMatch = line.match(/^[\*\-]\s+(.+)$/);
    if (bulletMatch) {
      const text = bulletMatch[1].trim();
      paragraphs.push(
        new Paragraph({
          children: parseInlineFormatting(text),
          numbering: { reference: "bullet-list", level: 0 },
          indent: { left: 720 },
          spacing: { after: 60 },
        })
      );
      i++;
      continue;
    }

    // Handle numbered lists (1. item)
    const numberedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (numberedMatch) {
      const text = numberedMatch[1].trim();
      paragraphs.push(
        new Paragraph({
          children: parseInlineFormatting(text),
          numbering: { reference: "numbered-list", level: 0 },
          indent: { left: 720 },
          spacing: { after: 60 },
        })
      );
      i++;
      continue;
    }

    // Handle regular paragraphs with inline formatting
    const textRuns = parseInlineFormatting(line);
    
    paragraphs.push(
      new Paragraph({
        children: textRuns,
        spacing: { after: 120 },
      })
    );
    i++;
  }

  return paragraphs;
}

/**
 * Parse inline formatting (bold, italic, code) in a line of text
 */
function parseInlineFormatting(text: string): TextRun[] {
  const runs: TextRun[] = [];
  let currentPos = 0;
  
  // Regex patterns for inline formatting
  const patterns = [
    { regex: /\*\*(.+?)\*\*/g, format: "bold" },           // **bold**
    { regex: /\*(.+?)\*/g, format: "italic" },             // *italic*
    { regex: /__(.+?)__/g, format: "bold" },               // __bold__
    { regex: /_(.+?)_/g, format: "italic" },               // _italic_
    { regex: /`(.+?)`/g, format: "code" },                 // `code`
  ];

  // Find all matches
  const matches: Array<{ start: number; end: number; text: string; format: string }> = [];
  
  patterns.forEach(({ regex, format }) => {
    let match;
    const re = new RegExp(regex);
    while ((match = re.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[1],
        format,
      });
    }
  });

  // Sort matches by position
  matches.sort((a, b) => a.start - b.start);

  // Build text runs
  matches.forEach((match) => {
    // Add plain text before this match
    if (match.start > currentPos) {
      const plainText = text.substring(currentPos, match.start);
      if (plainText) {
        runs.push(new TextRun(plainText));
      }
    }

    // Add formatted text
    const runOptions: { text: string; bold?: boolean; italics?: boolean; font?: string; size?: number } = { 
      text: match.text 
    };
    if (match.format === "bold") {
      runOptions.bold = true;
    } else if (match.format === "italic") {
      runOptions.italics = true;
    } else if (match.format === "code") {
      runOptions.font = "Courier New";
      runOptions.size = 18;
    }
    runs.push(new TextRun(runOptions));

    currentPos = match.end;
  });

  // Add remaining plain text
  if (currentPos < text.length) {
    const plainText = text.substring(currentPos);
    if (plainText) {
      runs.push(new TextRun(plainText));
    }
  }

  // If no formatting was found, return plain text
  if (runs.length === 0) {
    runs.push(new TextRun(text));
  }

  return runs;
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
