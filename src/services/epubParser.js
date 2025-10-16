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
  console.log('Looking for EKIGAMBO section...');
  
  // Luganda section header only
  const mwanduHeader = Array.from(doc.querySelectorAll('h2')).find(h2 => {
    const text = h2.textContent.trim();
    return text === 'EKIGAMBO KYA KATONDA KYA BUGAGGA';
  });
  
  if (!mwanduHeader) {
    console.log('No EKIGAMBO header found');
    return null;
  }

  const sectionName = mwanduHeader.textContent.trim();
  console.log('Found section header:', sectionName);

  const section = {
    id: Date.now() + 1 + Math.random(),
    name: sectionName,
    type: 'mwandu',
    items: []
  };

  // Find the section content boundaries - from header until the next main section header
  const sectionItems = findItemsInSection(doc, mwanduHeader, [
    'BUULIRA N\'OBUNYIIKIVU'
  ]);
  
  console.log(`Found ${sectionItems.length} total items in EKIGAMBO section`);
  
  for (const item of sectionItems) {
    // Accept all items in this section based on their position
    let participantList = 'assignment1';
    
    // Assign based on item position in section
    if (section.items.length === 0) {
      participantList = 'assignment1';
    } else if (section.items.length === 1) {
      participantList = 'assignment2';
    } else if (section.items.length === 2) {
      participantList = 'puonjruokReaders'; // Bible reading (3rd item)
    } else {
      participantList = 'assignment3'; // Additional items if any
    }
    
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
    
    console.log(`Added EKIGAMBO item ${item.number}: ${item.description} -> ${participantList}`);
  }

  console.log(`EKIGAMBO section has ${section.items.length} items`);
  return section.items.length > 0 ? section : null;
}

function parseTiegriSection(doc) {
  console.log('Looking for BUULIRA section...');
  
  // Luganda section header only
  const tiegriHeader = Array.from(doc.querySelectorAll('h2')).find(h2 => {
    const text = h2.textContent.trim();
    return text === 'BUULIRA N\'OBUNYIIKIVU';
  });
  
  if (!tiegriHeader) {
    console.log('No BUULIRA header found');
    return null;
  }

  const sectionName = tiegriHeader.textContent.trim();
  console.log('Found section header:', sectionName);

  const section = {
    id: Date.now() + 2 + Math.random(),
    name: sectionName,
    type: 'tiegri',
    items: []
  };

  // Find the section content boundaries - from header until the next main section header
  const sectionItems = findItemsInSection(doc, tiegriHeader, [
    'OBULAMU BW\'EKIKRISTAAYO'
  ]);
  
  console.log(`Found ${sectionItems.length} total items in BUULIRA section`);
  
  for (const item of sectionItems) {
    // Accept all items in this section - they're all sister assignments
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
    
    console.log(`Added BUULIRA item ${item.number}: ${item.description}`);
  }

  console.log(`BUULIRA section has ${section.items.length} items`);
  return section.items.length > 0 ? section : null;
}

function parseNgimawaSection(doc) {
  console.log('Looking for OBULAMU section...');
  
  // Luganda section header only
  const ngimawaHeader = Array.from(doc.querySelectorAll('h2')).find(h2 => {
    const text = h2.textContent.trim();
    return text === 'OBULAMU BW\'EKIKRISTAAYO';
  });
  
  if (!ngimawaHeader) {
    console.log('No OBULAMU header found');
    return null;
  }

  const sectionName = ngimawaHeader.textContent.trim();
  console.log('Found section header:', sectionName);

  const section = {
    id: Date.now() + 3 + Math.random(),
    name: sectionName,
    type: 'ngimawa',
    items: []
  };

  // Find the section content boundaries - from header to end of document
  const sectionItems = findItemsInSection(doc, ngimawaHeader, []);
  
  console.log(`Found ${sectionItems.length} total items in OBULAMU section`);
  
  for (const item of sectionItems) {
    // Accept all items in this section
    // Check if this is a Puonjruok item (Bible Study)
    let participantList = 'ngimawa';
    let secondaryList = null;
    let type = 'regular';
    
    // Check if description contains "Okusoma kwa Bayibuli" (Bible Study)
    if (item.description.toLowerCase().includes('okusoma kwa bayibuli') ||
        item.description.toLowerCase().includes('bible study') ||
        item.description.toLowerCase().includes('okubiri')) {
      participantList = 'puonjruokMuma';
      secondaryList = 'puonjruokReaders';
      type = 'puonjruok';
    }
    
    section.items.push({
      id: Date.now() + item.number + Math.random(),
      title: item.description,
      description: item.description,
      type: type,
      participantList: participantList,
      secondaryList: secondaryList,
      assignedName: '',
      assignedSecondary: '',
      isDouble: false
    });
    
    console.log(`Added OBULAMU item ${item.number}: ${item.description} -> ${participantList}`);
  }

  console.log(`OBULAMU section has ${section.items.length} items`);
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
  // Luganda uses "Ddak." (Dakiika = minutes)
  const elementDurationMatch = element.textContent.match(/\(Ddak\.\s*\d+\)/);
  if (elementDurationMatch) {
    return elementDurationMatch[0];
  }
  
  // Look for the next sibling div that contains duration information
  let nextElement = element.nextElementSibling;
  
  while (nextElement) {
    if (nextElement.tagName === 'DIV') {
      // Look for duration pattern in this div and its children
      // Luganda uses "Ddak." (Dakiika = minutes)
      const durationMatch = nextElement.textContent.match(/\(Ddak\.\s*\d+\)/);
      if (durationMatch) {
        return durationMatch[0];
      }
      
      // Also check nested p elements
      const pElements = nextElement.querySelectorAll('p');
      for (const p of pElements) {
        // Luganda uses "Ddak." (Dakiika = minutes)
        const pDurationMatch = p.textContent.match(/\(Ddak\.\s*\d+\)/);
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
    
    // Look for "Oluyimba" (Luganda for "Song") pattern
    const songMatch = text.match(/Oluyimba\s+(\d+)/i);
    if (songMatch) {
      const songNumber = songMatch[1];
      
      // Determine which song this is based on context and position
      // Luganda: "Okufundikira" = closing/concluding comments, "Okusaba" = prayer, "Ennyanjula" = introduction
      if (text.includes('Okufundikira')) {
        // Closing song (contains concluding comments)
        songs.closing = songNumber;
      } else if (text.includes('Okusaba') || text.includes('Ennyanjula')) {
        // Opening song (contains prayer or introduction context)
        if (!songs.opening) {
          songs.opening = songNumber;
        }
      } else {
        // Middle song (usually standalone song reference, not opening or closing)
        if (!songs.middle && !songs.opening) {
          // If we haven't found opening yet, this might be opening
          songs.opening = songNumber;
        } else if (!songs.middle) {
          // This is likely the middle song
          songs.middle = songNumber;
        }
      }
      
      console.log(`Found song: ${songNumber} in context: "${text.substring(0, 50)}..."`);
    }
  }

  return songs;
}
