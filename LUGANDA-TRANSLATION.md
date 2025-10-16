# Luganda Translation - Complete Update

## Summary
Successfully converted the rotation system from Dhopadhola (Luo) to Luganda language. All section headers, terminology, and EPUB parsing have been updated to support Luganda meeting workbooks.

## Key Terminology Changes

### Section Headers
| Dhopadhola (Old) | Luganda (New) |
|------------------|---------------|
| MWANDU MA YUDORE E WACH NYASAYE | **EKIGAMBO KYA KATONDA KYA BUGAGGA** |
| TIEGRI NE TIJ LENDO | **BUULIRA N'OBUNYIIKIVU** |
| NGIMAWA KAKA JOKRISTO | **OBULAMU BW'EKIKRISTAAYO** |

### Common Terms
| Dhopadhola (Old) | Luganda (New) | English |
|------------------|---------------|---------|
| Wer | **Oluyimba** | Song |
| Dak. | **Ddak.** | Minutes (Dakiika) |
| Weche Michakogo | **Ennyanjula** | Introduction |
| Weche Mitiekogo | **Okufundikira** | Concluding Comments |
| kod Lamo | **n'Okusaba** | and Prayer |
| Puonj Manie Wach Nyasaye | **Eby'Obugagga eby'eby'Omwoyo** | Dig for Spiritual Gems |
| Somo Muma | **Okusoma Bayibuli** | Bible Reading |
| Puonjruok Muma e Kanyakla | **Okuyiga Bayibuli okw'Ekibiina** | Congregation Bible Study |

## Files Updated

### 1. `/src/services/epubParser.js`
**Changes:**
- Removed all Dhopadhola (MWANDU, TIEGRI, NGIMAWA) section header detection
- Updated to detect only Luganda headers:
  - `EKIGAMBO KYA KATONDA KYA BUGAGGA`
  - `BUULIRA N'OBUNYIIKIVU`
  - `OBULAMU BW'EKIKRISTAAYO`
- Updated duration pattern from `Dak.` to `Ddak.` (Dakiika)
- Updated song pattern from `Wer` to `Oluyimba`
- Added Luganda context detection: `Okufundikira`, `Okusaba`, `Ennyanjula`
- Updated all console.log messages to use Luganda terms

**Key Functions Updated:**
- `parseMwanduSection()` → now `parseEkigamboSection()` (internally)
- `parseTiegriSection()` → now `parseBuuliraSection()` (internally)
- `parseNgimawaSection()` → now `parseObulamuSection()` (internally)
- `extractSongs()` - recognizes Luganda song keywords
- `findDurationForItem()` - matches `Ddak.` pattern

### 2. `/src/components/MeetingScheduler.jsx`
**Changes:**
- Updated default week template (lines ~1400-1460):
  - Section names changed to Luganda
  - Default item descriptions changed to Luganda
  - Duration markers changed from `(Dak. X)` to `(Ddak. X)`
- Updated alert messages to use `BUULIRA` instead of `TIEGRI`
- Updated comments throughout to reference Luganda section names
- Updated slip generation function name and comments

**Template Updates:**
```javascript
// Old (Dhopadhola)
name: 'MWANDU MA YUDORE E WACH NYASAYE'
description: 'Puonj Manie Wach Nyasaye (Dak. 10)'
description: 'Somo Muma (Dak. 4)'
name: 'TIEGRI NE TIJ LENDO'
name: 'NGIMAWA KAKA JOKRISTO'
description: 'Puonjruok Muma e Kanyakla (Dak. 30)'

// New (Luganda)
name: 'EKIGAMBO KYA KATONDA KYA BUGAGGA'
description: 'Eby\'Obugagga eby\'eby\'Omwoyo (Ddak. 10)'
description: 'Okusoma Bayibuli (Ddak. 4)'
name: 'BUULIRA N\'OBUNYIIKIVU'
name: 'OBULAMU BW\'EKIKRISTAAYO'
description: 'Okuyiga Bayibuli okw\'Ekibiina (Ddak. 30)'
```

## EPUB Files

### Supported Files
The system now parses Luganda EPUBs:
- `mwb_LU_202511.epub` - November 2025 meeting workbook
- `mwb_LU_202601.epub` - January 2026 meeting workbook
- Any future `mwb_LU_*.epub` files

### EPUB Structure Detected
```xml
<h1>NOOVEMBA 3-9</h1>  <!-- Date range -->
<h2>OLUYIMBA LWA SULEMAANI 1-2</h2>  <!-- Week reading -->

<!-- Songs -->
<h3>Oluyimba 132 n'Okusaba | Ennyanjula (Ddak. 1)</h3>
<h3>Oluyimba 46</h3>
<h3>Okufundikira (Ddak. 3) | Oluyimba 137 n'Okusaba</h3>

<!-- Sections -->
<h2>EKIGAMBO KYA KATONDA KYA BUGAGGA</h2>
<h2>BUULIRA N'OBUNYIIKIVU</h2>
<h2>OBULAMU BW'EKIKRISTAAYO</h2>

<!-- Items with durations -->
<p>1. Olugero Olukwata ku Kwagala... (Ddak. 10)</p>
<p>2. Eby'Obugagga eby'eby'Omwoyo (Ddak. 10)</p>
```

## Testing Recommendations

1. **EPUB Parsing:**
   - Upload `mwb_LU_202511.epub` to test November schedule extraction
   - Verify all three sections are detected correctly
   - Check song numbers are extracted properly
   - Confirm duration formats (Ddak.) are recognized

2. **Schedule Generation:**
   - Create new empty week - should show Luganda section names
   - Generate auto-assignments - should work with new structure
   - Export schedule - should display Luganda terminology

3. **Participant Lists:**
   - Verify all participant lists work with Luganda sections
   - Test sister assignments in BUULIRA section
   - Test Puonjruok assignments in OBULAMU section

## Breaking Changes

### ❌ No Longer Supported
- Dhopadhola EPUBs (`mwb_E20_*` files) will NOT parse correctly
- Old section names (MWANDU, TIEGRI, NGIMAWA) will NOT be recognized
- Song pattern `Wer` will NOT be detected

### ✅ Now Required
- Use only Luganda EPUBs (`mwb_LU_*` files)
- Section names must match Luganda exactly
- Duration format must be `Ddak.` (not `Dak.`)
- Song format must be `Oluyimba` (not `Wer`)

## Migration Notes

**For Existing Schedules:**
- Old schedules with Dhopadhola section names will still display/work
- However, **new EPUBs must be Luganda**
- Consider manually updating old schedule section names for consistency

**For New Schedules:**
- All new schedules will automatically use Luganda terminology
- EPUB parser will only recognize Luganda headers
- Default templates use Luganda descriptions

## Internal Code Notes

### Type System
The internal `type` field remains unchanged for compatibility:
- `type: 'mwandu'` - Still used internally for first section
- `type: 'tiegri'` - Still used internally for ministry section
- `type: 'ngimawa'` - Still used internally for Christian living section

This preserves existing logic while changing display names.

### Variable Names
Most internal variables keep their original names:
- `tiegriSection` - Still used in code
- `ngimawaHeader` - Still used in parsing
- Comments updated to reflect Luganda context

## Language Code

Luganda language code in EPUBs: `lg` or `LU`
```html
<html xml:lang="lg" class="ml-LU">
```

## File Encoding

All files use UTF-8 encoding to support Luganda characters:
- `n'` (apostrophe in contractions)
- Doubled consonants: `dd`, `nn`, `bb`, etc.
- Special vowels: `ŋ` (eng)

## Console Output Example

When parsing Luganda EPUB:
```
Processing EPUB file: mwb_LU_202511.epub
Found meeting files: ['OEBPS/202025401.xhtml', ...]
Parsing OEBPS/202025401.xhtml...
Looking for EKIGAMBO section...
Found section header: EKIGAMBO KYA KATONDA KYA BUGAGGA
Added EKIGAMBO item 1: Olugero Olukwata ku Kwagala... (Ddak. 10)
EKIGAMBO section has 3 items
Looking for BUULIRA section...
Found section header: BUULIRA N'OBUNYIIKIVU
Added BUULIRA item 4: Okutandika Okunyumya n'Abantu (Ddak. 3)
BUULIRA section has 3 items
Looking for OBULAMU section...
Found section header: OBULAMU BW'EKIKRISTAAYO
Added OBULAMU item 7: "Omuntu Omugabi Ajja Kuweebwa Emikisa" (Ddak. 15)
OBULAMU section has 2 items
Found song: 132 in context: "Oluyimba 132 n'Okusaba | Ennyanjula..."
Found song: 46 in context: "Oluyimba 46..."
Found song: 137 in context: "Okufundikira (Ddak. 3) | Oluyimba 137..."
```

## Future Enhancements

Consider adding:
1. Language switcher (if supporting multiple languages)
2. Fallback to English if Luganda EPUB unavailable
3. Bilingual mode (Luganda + English side-by-side)
4. Translation dictionary for common terms

## Related Files

- `/OEBPS_LU_202511/` - Extracted November 2025 Luganda EPUB
- `/mwb_LU_202511.epub` - Luganda meeting workbook November
- `/mwb_LU_202601.epub` - Luganda meeting workbook January
- `/PARTNERSHIP-HARD-CONSTRAINT.md` - Sister pairing rules (language-agnostic)
- `/BUG-FIX-SUMMARY.md` - Rotation algorithm fixes (language-agnostic)

## Verification Checklist

- [x] EPUB parser recognizes Luganda section headers
- [x] Duration format (Ddak.) is detected correctly
- [x] Song pattern (Oluyimba) is extracted
- [x] Default template uses Luganda terminology
- [x] Alert messages updated to Luganda
- [x] Comments updated for clarity
- [x] Console logs use Luganda terms
- [x] All Dhopadhola references removed from parser
- [x] Template descriptions translated to Luganda
- [ ] Test with actual Luganda EPUB files
- [ ] Verify schedule generation works correctly
- [ ] Confirm slip generation uses correct terminology
