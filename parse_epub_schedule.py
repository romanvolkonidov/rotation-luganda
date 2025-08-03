import zipfile
import xml.etree.ElementTree as ET
from io import BytesIO
import re
import json
from datetime import datetime

def parse_epub_schedule(epub_bytes):
    """
    Parse EPUB file and extract meeting schedule data
    """
    try:
        # Read EPUB as ZIP file
        with zipfile.ZipFile(BytesIO(epub_bytes), 'r') as epub_zip:
            # Get list of XHTML files in OEBPS directory
            xhtml_files = [f for f in epub_zip.namelist() 
                          if f.startswith('OEBPS/') and f.endswith('.xhtml') 
                          and not f.endswith('cover.xhtml') and not f.endswith('toc.xhtml')]
            
            # Filter for numbered pages (meeting content)
            meeting_files = [f for f in xhtml_files if re.search(r'\d+-', f)]
            meeting_files.sort()  # Sort by filename
            
            weeks_data = []
            
            for filename in meeting_files:
                try:
                    # Read and parse XHTML content
                    content = epub_zip.read(filename).decode('utf-8')
                    week_data = parse_week_content(content, filename)
                    
                    if week_data:
                        weeks_data.append(week_data)
                        
                except Exception as e:
                    print(f"Error parsing {filename}: {e}")
                    continue
            
            return {
                'success': True,
                'weeks': weeks_data,
                'message': f'Successfully parsed {len(weeks_data)} weeks from EPUB'
            }
            
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'message': 'Failed to parse EPUB file'
        }

def parse_week_content(html_content, filename):
    """
    Parse individual week's XHTML content and extract meeting data
    """
    try:
        # Clean HTML and prepare for parsing
        html_content = clean_html_content(html_content)
        
        # Parse with ElementTree
        root = ET.fromstring(html_content)
        
        # Define namespace
        ns = {'html': 'http://www.w3.org/1999/xhtml'}
        
        week_data = {
            'id': f"week_{datetime.now().timestamp()}_{filename}",
            'title': '',
            'dateRange': '',
            'chairman': '',
            'openingSong': '',
            'openingPrayer': '',
            'closingSong': '',
            'closingPrayer': '',
            'sections': []
        }
        
        # Extract week title and date range
        title_elements = root.findall('.//html:h1', ns) + root.findall('.//html:h2', ns)
        for title_elem in title_elements:
            text = title_elem.text or ''
            if any(month in text.upper() for month in ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
                                                      'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
                                                      'SEPTEMBA', 'OKTOBA', 'NOVEMBA', 'DESEMBA']):
                week_data['dateRange'] = text.strip()
                break
        
        # Extract main content from paragraphs and divs
        content_elements = root.findall('.//html:p', ns) + root.findall('.//html:div', ns)
        
        current_section = None
        current_section_items = []
        
        for elem in content_elements:
            text = get_element_text(elem).strip()
            if not text:
                continue
            
            # Check for section headers
            section_type = identify_section_type(text)
            if section_type:
                # Save previous section if it exists
                if current_section and current_section_items:
                    week_data['sections'].append({
                        'id': f"section_{len(week_data['sections'])}",
                        'type': current_section,
                        'items': current_section_items
                    })
                
                # Start new section
                current_section = section_type
                current_section_items = []
                continue
            
            # Parse meeting items
            if current_section:
                item = parse_meeting_item(text, current_section)
                if item:
                    current_section_items.append(item)
            
            # Extract songs and prayers at root level
            if 'wer' in text.lower() and any(char.isdigit() for char in text):
                song_match = re.search(r'wer\s*(\d+)', text.lower())
                if song_match:
                    if not week_data['openingSong']:
                        week_data['openingSong'] = song_match.group(1)
                    else:
                        week_data['closingSong'] = song_match.group(1)
            
            if 'lamo' in text.lower():
                # This is a prayer assignment
                if not week_data['openingPrayer']:
                    week_data['openingPrayer'] = ''  # Will be filled by user
                else:
                    week_data['closingPrayer'] = ''  # Will be filled by user
        
        # Add final section
        if current_section and current_section_items:
            week_data['sections'].append({
                'id': f"section_{len(week_data['sections'])}",
                'type': current_section,
                'items': current_section_items
            })
        
        return week_data
        
    except Exception as e:
        print(f"Error parsing week content: {e}")
        return None

def clean_html_content(html_content):
    """Clean HTML content for XML parsing"""
    # Add missing namespace if needed
    if 'xmlns=' not in html_content:
        html_content = html_content.replace('<html', '<html xmlns="http://www.w3.org/1999/xhtml"')
    
    # Fix common HTML issues
    html_content = re.sub(r'&(?!amp;|lt;|gt;|quot;|apos;)', '&amp;', html_content)
    
    return html_content

def get_element_text(element):
    """Extract all text from an element including nested elements"""
    text = element.text or ''
    for child in element:
        text += get_element_text(child)
        if child.tail:
            text += child.tail
    return text

def identify_section_type(text):
    """Identify section type based on text content"""
    text_lower = text.lower()
    
    # Common section identifiers
    if any(keyword in text_lower for keyword in ['treasures', 'mial', 'gima']):
        return 'TREASURES'
    elif any(keyword in text_lower for keyword in ['ministry', 'tiegri', 'kony']):
        return 'MINISTRY'
    elif any(keyword in text_lower for keyword in ['living', 'kwo', 'christian']):
        return 'LIVING'
    elif 'opening' in text_lower or 'wer' in text_lower:
        return 'OPENING'
    
    return None

def parse_meeting_item(text, section_type):
    """Parse individual meeting item from text"""
    # Clean text
    text = text.strip()
    if len(text) < 5:  # Skip very short texts
        return None
    
    # Basic item structure
    item = {
        'id': f"item_{datetime.now().timestamp()}_{hash(text)}",
        'description': text,
        'name': '',
        'assistant': '',
        'time': '',
        'notes': ''
    }
    
    # Extract time if present (e.g., "(5 min)")
    time_match = re.search(r'\((\d+)\s*min\)', text)
    if time_match:
        item['time'] = time_match.group(1)
        item['description'] = re.sub(r'\(\d+\s*min\)', '', text).strip()
    
    # Extract study point numbers
    study_match = re.search(r'(\d+)\.?\s*(.+)', item['description'])
    if study_match:
        item['description'] = study_match.group(2).strip()
    
    return item

if __name__ == "__main__":
    # Test with a sample EPUB file
    import sys
    if len(sys.argv) > 1:
        epub_path = sys.argv[1]
        with open(epub_path, 'rb') as f:
            epub_data = f.read()
        
        result = parse_epub_schedule(epub_data)
        print(json.dumps(result, indent=2, ensure_ascii=False))
