async function testUsage() {
    try {
        const pdfModule = await import('pdf-parse');
        const PdfParser = pdfModule.default || pdfModule.PDFParse || pdfModule;
        
        console.log('Testing as function...');
        try {
            await PdfParser(Buffer.from([]));
            console.log('Success as function');
        } catch (e) {
            console.log('Failed as function:', e.message);
        }
        
        console.log('Testing as class...');
        try {
            const parser = new PdfParser();
            console.log('Success as class');
        } catch (e) {
            console.log('Failed as class:', e.message);
        }
    } catch (e) {
        console.error(e);
    }
}
testUsage();
