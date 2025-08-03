# Simplified A### 2. TIEGRI NE TIJ LENDO Section
- **Default assignment**: **Sisters** list (pre-selected)
- **Manual override available**: User can change to any other list if needed
- **Double assignment**: Automatically set to true for sister pairs
- **Full flexibility**: Only section where list selection remains enablednment Logic

## Overview
The Meeting Schedule Manager now uses a simplified assignment logic that automatically assigns the correct participant lists based on section type and position, reducing manual work.

## Assignment Rules

### 1. MWANDU MA YUDORE E WACH NYASAYE Section
- **Point 1**: Always uses **Assignment 1** list (LIST SELECTION HIDDEN)
- **Point 2**: Always uses **Assignment 2** list (LIST SELECTION HIDDEN)
- **Point 3**: Always uses **Assignment 3** list (LIST SELECTION HIDDEN)
- For additional items: Cycles through Assignment 1, 2, 3 lists
- **List selection is HIDDEN** - assignments are automatic, users can type different names

### 2. TIEGRI NE TIJ LENDO Section
- **Manual assignment required** - User must manually select participant lists
- This allows flexibility for sister assignments and special arrangements
- **List selection is VISIBLE** for full flexibility

### 3. NGIMAWA KAKA JOKRISTO Section
- **All items**: Always use **Elders (ngimawa)** list (LIST SELECTION HIDDEN)
- **Puonjruok Muma**: Uses dedicated **Puonjruok Muma** list (LIST SELECTION HIDDEN)
- **Secondary readers**: Use **Puonjruok Readers** list
- **List selection is HIDDEN** - assignments are automatic, users can type different names

### 4. Chairman & Prayers
- **Chairman**: Uses **Chairmen** list (LIST SELECTION HIDDEN)
- **Opening/Closing Prayers**: Use **Prayers (Lamo)** list (LIST SELECTION HIDDEN)
- Users can directly type different names if needed

## Item Numbering
- **Continuous numbering** across all sections within each week
- Numbers start at 1 for the first item and continue sequentially: 1, 2, 3, 4, 5, 6...
- Works in both edit mode and preview/print mode
- Flexible for varying numbers of items per section

## Participant Lists
- **Puonjruok Muma**: Dedicated list with Benson Otieno as first option (editable)
- **Assignment 1, 2, 3**: Brothers for MWANDU assignments
- **Sisters**: For TIEGRI section assignments
- **Elders**: For NGIMAWA general assignments
- **Chairmen**: For weekly chairmen
- **Prayers (Lamo)**: For opening/closing prayers

## Benefits
1. **Clean Interface**: No unnecessary list selectors cluttering the UI
2. **Reduced Manual Work**: Lists are pre-assigned behind the scenes
3. **Consistency**: Standardized assignment patterns that can't be accidentally changed
4. **Flexibility**: Users can still type different names if needed
5. **TIEGRI Exception**: Only TIEGRI section shows list selectors for full manual control
6. **Proper Numbering**: Continuous numbering matches official meeting format

## Manual Override
- **TIEGRI assignments**: Full manual control over list selection (only visible selectors)
- **All other assignments**: Can type different names directly, no need to change lists
- **Puonjruok Muma list**: Can be edited to add/remove elders in participant management

## PDF Import
When importing a PDF schedule, the AI will create all weeks and automatically apply these assignment rules, so you only need to:
1. Upload the PDF
2. Manually assign TIEGRI NE TIJ LENDO items (only section requiring manual lists)
3. Run "Auto Assign" to populate names
4. Make any manual name adjustments if needed
