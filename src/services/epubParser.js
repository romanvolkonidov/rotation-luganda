import JSZip from 'jszip';

export async function parseEpubFile(file) {
  try {
    console.log('Processing EPUB file:', file.name);
    
    const zip = new JSZip();
    const contents = await zip.loadAsync(file);
    
    // Find all XHTML files in OEBPS directory that contain meeting data
    const meetingFiles = Object.keys(contents.files).filter(name => 
      name.startsWith('OEBPS/') && 
      name.endsWith('.xhtml') && 
      !name.includes('-extracted') &&
      !name.includes('cover') &&
      !name.includes('toc') &&
      !name.includes('pagenav') &&
      /\d{9}\.xhtml$/.test(name) // Match files with 9 digits like 202025321.xhtml
    );

    console.log('Found meeting files:', meetingFiles);

    const weeks = [];

    for (const fileName of meetingFiles.sort()) {
      try {
        console.log(`Parsing ${fileName}...`);
        const fileContent = await contents.files[fileName].async('text');
        const weekData = parseWeekContent(fileContent, fileName);
        if (weekData) {
          weeks.push(weekData);
        }
      } catch (error) {
        console.error(`Error parsing ${fileName}:`, error);
      }
    }

    console.log(`Extracted ${weeks.length} weeks from EPUB`);

    if (weeks.length === 0) {
      return {
        success: false,
        error: 'No meeting data found in EPUB file'
      };
    }

    return {
      success: true,
      weeks: weeks
    };

  } catch (error) {
    console.error('Error parsing EPUB file:', error);
    return {
      success: false,
      error: `Failed to parse EPUB file: ${error.message}`
    };
  }
}

function parseWeekContent(htmlContent, fileName) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // Extract date range from h1 (e.g., "SEPTEMBA 1-7")
    const h1Element = doc.querySelector('h1');
    const dateRange = h1Element ? h1Element.textContent.trim() : '';
    
    // Extract week number from h2 with a link (e.g., "NGECHE 29")
    const weekNumberElement = doc.querySelector('h2 strong a');
    const weekTitle = weekNumberElement ? weekNumberElement.textContent.trim() : 'Unknown Week';
    
    // Extract songs
    const songs = extractSongs(doc);
    
    // Create week object matching expected structure
    const weekData = {
      id: Date.now() + Math.random(),
      title: weekTitle, // Use the week number (NGECHE 29) as title
      dateRange: dateRange, // Use the date range (SEPTEMBA 1-7) as dateRange
      chairman: '',
      openingSong: songs.opening || '',
      openingPrayer: '',
      middleSong: songs.middle || '',
      sections: [],
      closingSong: songs.closing || '',
      closingPrayer: ''
    };

    // Parse the three main sections
    const mwanduSection = parseMwanduSection(doc);
    if (mwanduSection) weekData.sections.push(mwanduSection);

    const tiegriSection = parseTiegriSection(doc);
    if (tiegriSection) weekData.sections.push(tiegriSection);

    const ngimawaSection = parseNgimawaSection(doc);
    if (ngimawaSection) weekData.sections.push(ngimawaSection);

    console.log(`Found ${weekData.sections.length} sections in ${fileName}`);
    console.log(`Week: ${weekTitle}, Date: ${dateRange}, Songs: ${songs.opening}/${songs.middle}/${songs.closing}`);

    return weekData.sections.length > 0 ? weekData : null;

  } catch (error) {
    console.error(`Error parsing week content from ${fileName}:`, error);
    return null;
  }
}

function parseMwanduSection(doc) {
  console.log('Looking for MWANDU section...');
  
  const mwanduHeader = Array.from(doc.querySelectorAll('h2')).find(h2 => 
    h2.textContent.trim() === 'MWANDU MA YUDORE E WACH NYASAYE'
  );
  
  if (!mwanduHeader) {
    console.log('No MWANDU header found');
    return null;
  }

  console.log('Found MWANDU header');

  const section = {
    id: Date.now() + 1 + Math.random(),
    name: 'MWANDU MA YUDORE E WACH NYASAYE',
    type: 'mwandu',
    items: []
  };

  // Find the section content boundaries - from MWANDU header until the next main section header
  const sectionItems = findItemsInSection(doc, mwanduHeader, ['TIEGRI NE TIJ LENDO']);
  
  for (const item of sectionItems) {
    if (item.number >= 1 && item.number <= 3) {
      // Determine participant list based on item number
      let participantList = 'assignment1';
      if (item.number === 2) participantList = 'assignment2';
      if (item.number === 3) participantList = 'assignment3';
      
      section.items.push({
        id: Date.now() + item.number + Math.random(),
        description: item.description,
        type: 'regular',
        participantList: participantList,
        secondaryList: null,
        assignedName: '',
        assignedSecondary: '',
        isDouble: false
      });
      
      console.log(`Added MWANDU item ${item.number}: ${item.description}`);
    }
  }

  console.log(`MWANDU section has ${section.items.length} items`);
  return section.items.length > 0 ? section : null;
}

function parseTiegriSection(doc) {
  console.log('Looking for TIEGRI section...');
  
  const tiegriHeader = Array.from(doc.querySelectorAll('h2')).find(h2 => 
    h2.textContent.trim() === 'TIEGRI NE TIJ LENDO'
  );
  
  if (!tiegriHeader) {
    console.log('No TIEGRI header found');
    return null;
  }

  console.log('Found TIEGRI header');

  const section = {
    id: Date.now() + 2 + Math.random(),
    name: 'TIEGRI NE TIJ LENDO',
    type: 'tiegri',
    items: []
  };

  // Find the section content boundaries - from TIEGRI header until the next main section header
  const sectionItems = findItemsInSection(doc, tiegriHeader, ['NGIMAWA KAKA JOKRISTO']);
  
  for (const item of sectionItems) {
    if (item.number >= 4 && item.number <= 10) {
      section.items.push({
        id: Date.now() + item.number + Math.random(),
        title: item.description,
        description: item.description,
        type: 'regular',
        participantList: 'sisters',
        secondaryList: null,
        assignedName: '',
        assignedSecondary: '',
        isDouble: true // Sisters work in pairs
      });
      
      console.log(`Added TIEGRI item ${item.number}: ${item.description}`);
    }
  }

  console.log(`TIEGRI section has ${section.items.length} items`);
  return section.items.length > 0 ? section : null;
}

function parseNgimawaSection(doc) {
  console.log('Looking for NGIMAWA section...');
  
  const ngimawaHeader = Array.from(doc.querySelectorAll('h2')).find(h2 => 
    h2.textContent.trim() === 'NGIMAWA KAKA JOKRISTO'
  );
  
  if (!ngimawaHeader) {
    console.log('No NGIMAWA header found');
    return null;
  }

  console.log('Found NGIMAWA header');

  const section = {
    id: Date.now() + 3 + Math.random(),
    name: 'NGIMAWA KAKA JOKRISTO',
    type: 'ngimawa',
    items: []
  };

  // Find the section content boundaries - from NGIMAWA header to end of document
  const sectionItems = findItemsInSection(doc, ngimawaHeader, []);
  
  for (const item of sectionItems) {
    if (item.number >= 7) {
      // Check if this is a Puonjruok item
      let participantList = 'ngimawa';
      let secondaryList = null;
      let type = 'regular';
      
      if (item.description.includes('Puonjruok')) {
        participantList = 'puonjruok_muma';
        secondaryList = 'puonjruok_readers';
        type = 'puonjruok';
      }
      
      section.items.push({
        id: Date.now() + item.number + Math.random(),
        description: item.description,
        type: type,
        participantList: participantList,
        secondaryList: secondaryList,
        assignedName: '',
        assignedSecondary: secondaryList ? '' : '',
        isDouble: false
      });
      
      console.log(`Added NGIMAWA item ${item.number}: ${item.description}`);
    }
  }

  console.log(`NGIMAWA section has ${section.items.length} items`);
  return section.items.length > 0 ? section : null;
}

// Helper function to find items within a specific section
function findItemsInSection(doc, sectionHeader, stopAtHeaders) {
  const items = [];
  
  // Start from the section header's parent div and look for sibling h3 elements
  let currentElement = sectionHeader.parentElement; // This is the div containing the section header
  
  // Navigate through sibling elements after the section header div
  while (currentElement && currentElement.nextElementSibling) {
    currentElement = currentElement.nextElementSibling;
    
    // Check if we've hit a stop header (next main section)
    if (currentElement.tagName === 'DIV') {
      const stopHeader = currentElement.querySelector('h2');
      if (stopHeader && stopAtHeaders.length > 0 && stopAtHeaders.some(stop => stopHeader.textContent.includes(stop))) {
        break;
      }
    }
    
    // Check if this element is an h3 or p with a numbered item (direct sibling)
    if (currentElement.tagName === 'H3' || currentElement.tagName === 'P') {
      const text = currentElement.textContent.trim();
      const numberMatch = text.match(/^(\d+)\.\s*(.+)/);
      
      if (numberMatch) {
        const itemNumber = parseInt(numberMatch[1]);
        let description = numberMatch[2];
        
        // Look for duration in the following div
        const duration = findDurationForItem(currentElement);
        if (duration) {
          description += ` ${duration}`;
        }
        
        items.push({
          number: itemNumber,
          description: description,
          element: currentElement
        });
      }
    }
    
    // Also check for h3 and p elements inside this div (nested items)
    if (currentElement.tagName === 'DIV') {
      // Check h3 elements
      const nestedH3Elements = currentElement.querySelectorAll('h3');
      for (const h3 of nestedH3Elements) {
        const text = h3.textContent.trim();
        const numberMatch = text.match(/^(\d+)\.\s*(.+)/);
        
        if (numberMatch) {
          const itemNumber = parseInt(numberMatch[1]);
          let description = numberMatch[2];
          
          // Look for duration in the following div
          const duration = findDurationForItem(h3);
          if (duration) {
            description += ` ${duration}`;
          }
          
          items.push({
            number: itemNumber,
            description: description,
            element: h3
          });
        }
      }
      
      // Also check p elements for numbered items
      const nestedPElements = currentElement.querySelectorAll('p');
      for (const p of nestedPElements) {
        const text = p.textContent.trim();
        const numberMatch = text.match(/^(\d+)\.\s*(.+)/);
        
        if (numberMatch) {
          const itemNumber = parseInt(numberMatch[1]);
          let description = numberMatch[2];
          
          // Look for duration in the following div
          const duration = findDurationForItem(p);
          if (duration) {
            description += ` ${duration}`;
          }
          
          items.push({
            number: itemNumber,
            description: description,
            element: p
          });
        }
      }
    }
  }
  
  console.log(`Found ${items.length} items for section:`, items.map(item => `${item.number}. ${item.description}`));
  return items;
}

// Helper function to find duration information for an item
function findDurationForItem(element) {
  // First, check if the duration is within the element itself (common for <p> elements)
  const elementDurationMatch = element.textContent.match(/\(Dak\.\s*\d+\)/);
  if (elementDurationMatch) {
    return elementDurationMatch[0];
  }
  
  // Look for the next sibling div that contains duration information
  let nextElement = element.nextElementSibling;
  
  while (nextElement) {
    if (nextElement.tagName === 'DIV') {
      // Look for duration pattern in this div and its children
      const durationMatch = nextElement.textContent.match(/\(Dak\.\s*\d+\)/);
      if (durationMatch) {
        return durationMatch[0];
      }
      
      // Also check nested p elements
      const pElements = nextElement.querySelectorAll('p');
      for (const p of pElements) {
        const pDurationMatch = p.textContent.match(/\(Dak\.\s*\d+\)/);
        if (pDurationMatch) {
          return pDurationMatch[0];
        }
      }
    }
    
    // Stop if we hit another h3, p with numbered content, or main section
    if (nextElement.tagName === 'H3' || nextElement.tagName === 'H2' || 
        (nextElement.tagName === 'P' && nextElement.textContent.match(/^\d+\.\s/))) {
      break;
    }
    
    nextElement = nextElement.nextElementSibling;
  }
  
  return null;
}

// Helper function to extract song numbers from the document
function extractSongs(doc) {
  const songs = {
    opening: '',
    middle: '',
    closing: ''
  };

  // Find all h3 elements that contain song information
  const h3Elements = doc.querySelectorAll('h3');
  
  for (let i = 0; i < h3Elements.length; i++) {
    const h3 = h3Elements[i];
    const text = h3.textContent.trim();
    
    // Look for "Wer" (song) pattern
    const songMatch = text.match(/Wer\s+(\d+)/);
    if (songMatch) {
      const songNumber = songMatch[1];
      
      // Determine which song this is based on context and position
      if (text.includes('Weche Mitiekogo')) {
        // Closing song (contains concluding comments)
        songs.closing = songNumber;
      } else if (text.includes('Weche Michakogo') || (i < 3 && text.includes('kod Lamo'))) {
        // Opening song (contains opening prayer context or early in document)
        if (!songs.opening) {
          songs.opening = songNumber;
        }
      } else {
        // Middle song (usually standalone Wer reference, not opening or closing)
        if (!songs.middle && !songs.opening) {
          // If we haven't found opening yet, this might be opening
          songs.opening = songNumber;
        } else if (!songs.middle) {
          // This is likely the middle song
          songs.middle = songNumber;
        }
      }
      
      console.log(`Found song: Wer ${songNumber} in context: "${text.substring(0, 50)}..."`);
    }
  }

  return songs;
}
