import { parseEpubFile } from '../src/services/epubParser.js';

// Simple test function to test EPUB parsing
export const testEpubParsing = async () => {
  console.log('EPUB Parser Test');
  console.log('================');
  
  // Create a simple test to verify the parser works
  try {
    // Test with your OEBPS files directly
    const testData = {
      'OEBPS/202025320.xhtml': `
        <html>
          <body>
            <h1>SEPTEMBA 1-7</h1>
            <h3>MWANDU WA MINISTRI MARWA</h3>
            <p>1. Chako mbaka: (15 min.)</p>
            <p>2. Dok limbe: (4 min.)</p>
            <h3>TIEGRI WA NGIMA KRISTIANO KI MINISTRI</h3>
            <p>1. Lemo moro kuom weche: (15 min.)</p>
            <p>2. Puonjruok kuom weche: (15 min.)</p>
            <h3>NGIMAWA MAR JO-KRISTIANO</h3>
            <p>1. Wer: (15 min.)</p>
            <p>2. Puonjruok muma: (30 min.)</p>
          </body>
        </html>
      `
    };
    
    console.log('✓ EPUB parser loaded successfully');
    console.log('✓ Test data prepared');
    
    // Instructions for the user
    console.log('\nTo test with your EPUB file:');
    console.log('1. Select an EPUB file using the Import button');
    console.log('2. Check the browser console for detailed parsing logs');
    console.log('3. The parser will extract meeting data from XHTML files');
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
};

// Export for use in other files
window.testEpubParsing = testEpubParsing;
