import { parseEpubFile } from '../src/services/epubParser.js';

// Simple test to check if parseEpubFile is working
console.log('Testing EPUB parser...');
console.log('parseEpubFile function:', parseEpubFile);

// Test with null to see if the function exists
try {
  const result = await parseEpubFile(null);
  console.log('Result:', result);
} catch (error) {
  console.log('Expected error for null input:', error.message);
}
