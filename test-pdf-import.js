const path = require('path');
const fs = require('fs');

async function testImport() {
    try {
        console.log('Testing pdf-parse import...');
        const pdfModule = await import('pdf-parse');
        console.log('Keys:', Object.keys(pdfModule));
        const PdfParser = pdfModule.default || pdfModule.PDFParse || pdfModule;
        console.log('Parser type:', typeof PdfParser);
        
        if (typeof PdfParser === 'function') {
            console.log('Success: PdfParser is a function/class');
            try {
                const parser = new PdfParser();
                console.log('Success: Can instantiate as class');
            } catch (e) {
                console.log('Failed to instantiate as class, might be plain function');
            }
        } else {
            console.log('Failed: PdfParser is not a function');
        }
    } catch (e) {
        console.error('Import failed:', e.message);
    }
}

testImport();
