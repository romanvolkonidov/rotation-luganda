import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, Save, Printer, Eye, Edit2, Users, Calendar, RotateCw, X, Check, Upload, History, Clock } from 'lucide-react';
import { initializeFirebase, saveScheduleToFirebase, loadScheduleFromFirebase } from '../services/firebase';
import { parseEpubFile } from '../services/epubParser';
import { AlertModal, ConfirmModal, PromptModal, Toast } from './Modal';
import './slips.css';

const MeetingScheduler = () => {
  // No more hardcoded participant lists - everything comes from Firebase

  // State management
  const [weeks, setWeeks] = useState([]);
  const [participantLists, setParticipantLists] = useState(null); // Start with null to detect if we need to load data
  const [previousAssignments, setPreviousAssignments] = useState([]);
  const [scheduleHistory, setScheduleHistory] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editingHistoryId, setEditingHistoryId] = useState(null);
  const [editingList, setEditingList] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processingPdf, setProcessingPdf] = useState(false);
  const [savingLists, setSavingLists] = useState(false);
  // Add slips state
  const [showSlips, setShowSlips] = useState(false);
  const [slipsData, setSlipsData] = useState([]);
  const printRef = useRef();
  const [rotationIndices, setRotationIndices] = useState({});
  const [printContent, setPrintContent] = useState(null);
  // Add state for tracking changes and current schedule
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentScheduleId, setCurrentScheduleId] = useState(null);
  // Add state for unsaved changes modal
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [pendingHistoryLoad, setPendingHistoryLoad] = useState(null);
  
  // Modal states
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'warning' });
  const [promptModal, setPromptModal] = useState({ isOpen: false, title: '', message: '', defaultValue: '', onSubmit: null });
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'info' });
  
  // Initialize Firebase and load data
// Add this state after the other useState declarations:

// Update the useEffect for loading data to include rotation indices:
useEffect(() => {
  const initData = async () => {
    try {
      await initializeFirebase();
      const data = await loadScheduleFromFirebase();
      
      // Only load from Firebase - no more fallback to hardcoded data
      if (data && data.participantLists) {
        console.log('✅ Loading participant lists from Firebase');
        setParticipantLists(data.participantLists);
        
        // Load other data if available
        if (data.previousAssignments) setPreviousAssignments(data.previousAssignments);
        if (data.scheduleHistory) setScheduleHistory(data.scheduleHistory);
        if (data.rotationIndices) setRotationIndices(data.rotationIndices);
        // Note: We intentionally don't load data.weeks to start with an empty schedule
      } else {
        // No data in Firebase - show error and instructions
        console.error('❌ No participant lists found in Firebase');
        setParticipantLists(null);
        
        // Show error message to user
        setTimeout(() => {
          showAlert(
            'No participant data found in Firebase. Please contact the administrator to set up the initial participant lists.',
            'error',
            'No Data Found'
          );
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Error loading data from Firebase:', error);
      setParticipantLists(null);
      
      // Show Firebase connection error
      setTimeout(() => {
        showAlert(
          `Error connecting to Firebase: ${error.message}. Please check your internet connection and try again.`,
          'error',
          'Firebase Connection Error'
        );
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  initData();
}, []);

// Helper functions for modals and toasts
const showAlert = (message, type = 'info', title = 'Alert') => {
  setAlertModal({ isOpen: true, title, message, type });
};

const showConfirm = (message, onConfirm, title = 'Confirm', type = 'warning') => {
  setConfirmModal({ isOpen: true, title, message, onConfirm, type });
};

const showPrompt = (message, onSubmit, defaultValue = '', title = 'Input Required') => {
  setPromptModal({ isOpen: true, title, message, defaultValue, onSubmit });
};

const showToast = (message, type = 'info') => {
  setToast({ isVisible: true, message, type });
};

const closeAlert = () => setAlertModal({ ...alertModal, isOpen: false });
const closeConfirm = () => setConfirmModal({ ...confirmModal, isOpen: false });
const closePrompt = () => setPromptModal({ ...promptModal, isOpen: false });
const closeToast = () => setToast({ ...toast, isVisible: false });

// Test function to verify Firebase participant data (no more hardcoded references)
const testFirebaseParticipantCounts = () => {
  console.log('\n=== FIREBASE PARTICIPANT DATA TEST (Firebase-Only Mode) ===');
  
  if (!participantLists) {
    console.error('❌ No participant lists loaded from Firebase');
    console.log('💡 This app now relies entirely on Firebase data - no hardcoded fallbacks');
    return;
  }

  console.log('✅ Successfully loaded participant lists from Firebase');
  console.log('🗂️ Available participant lists:');
  
  // Show all available lists from Firebase
  Object.entries(participantLists).forEach(([key, list]) => {
    console.log(`📋 ${list.name}: ${list.participants.length} participants`);
  });

  // Show essential lists for auto-assign
  const essentialLists = ['chairmen', 'sisters', 'prayers'];
  console.log('\n🔑 Essential lists for auto-assign:');
  
  let allEssentialPresent = true;
  essentialLists.forEach(listKey => {
    const list = participantLists[listKey];
    if (list && list.participants && list.participants.length > 0) {
      console.log(`✅ ${list.name}: ${list.participants.length} participants`);
    } else {
      console.error(`❌ ${listKey}: Missing or empty`);
      allEssentialPresent = false;
    }
  });

  if (allEssentialPresent) {
    console.log('\n🎉 ALL ESSENTIAL LISTS PRESENT - Auto-assign should work correctly!');
  } else {
    console.log('\n⚠️ Some essential lists are missing - Auto-assign may not work properly');
  }

  // Show detailed breakdown
  console.log('\n=== DETAILED PARTICIPANT LISTS FROM FIREBASE ===');
  Object.entries(participantLists).forEach(([key, list]) => {
    console.log(`\n📋 ${list.name} (${list.participants.length}):`);
    list.participants.forEach((participant, index) => {
      console.log(`  ${index + 1}. ${participant}`);
    });
  });

  console.log('\n🔒 Note: This app now uses ONLY Firebase data - no hardcoded participant lists as fallback');
};

// Make the test function available globally for console access
window.testFirebaseParticipantCounts = testFirebaseParticipantCounts;

// Enhanced saveToDatabase function to create historical records:
const saveToDatabase = async () => {
  if (weeks.length === 0) {
    showAlert('No weeks to save!', 'warning');
    return;
  }

  // First confirm the save action
  showConfirm(
    'This will save your current schedule to history. Do you want to continue?',
    (confirmed) => {
      if (!confirmed) return;
      
      setSaving(true);
      
      // Prompt user for schedule title
      showPrompt(
        'Enter a title for this schedule (e.g., "January 2025", "Service Meeting - Week 1-8"):',
        async (title) => {
          if (!title) {
            setSaving(false);
            return; // User cancelled
          }

          try {
            // Create historical record
            const historyRecord = {
              id: Date.now(),
              title: title.trim(),
              savedAt: new Date().toISOString(),
              weeks: JSON.parse(JSON.stringify(weeks)), // Deep copy
              participantLists: JSON.parse(JSON.stringify(participantLists)), // Deep copy
              rotationState: JSON.parse(JSON.stringify(rotationIndices)), // Rotation state when saved
              weekCount: weeks.length,
              assignmentCounts: calculateAssignmentCounts(weeks) // Summary of who got what
            };

            // Add to history
            const newHistory = [...scheduleHistory, historyRecord];
            setScheduleHistory(newHistory);

            // Save everything to Firebase
            const data = {
              weeks,
              participantLists,
              previousAssignments: [...previousAssignments, ...weeks],
              scheduleHistory: newHistory,
              rotationIndices,
              savedAt: new Date().toISOString()
            };
            
            await saveScheduleToFirebase(data);
            
            showToast(`Schedule "${title.trim()}" saved successfully to history!`, 'success');
            
            // Set the current schedule as saved
            setCurrentScheduleId(historyRecord.id);
            setHasUnsavedChanges(false);
            
            // Optionally clear current schedule after saving
            showConfirm(
              'Would you like to clear the current schedule to start working on a new one?',
              (confirmed) => {
                if (confirmed) {
                  clearCurrentSchedule();
                }
                setSaving(false);
              },
              'Clear Current Schedule?'
            );
            
          } catch (error) {
            console.error('Error saving data:', error);
            showAlert('Error saving schedule: ' + error.message, 'error');
            setSaving(false);
          }
        }
      );
    },
    'Save Schedule',
    'info'
  );
};

// Function to generate slips data from TIEGRI section assignments
// Function to generate slips data from TIEGRI section assignments
const generateSlipsData = () => {
  const slips = [];
  
  weeks.forEach(week => {
    // Find the TIEGRI section
    const tiegriSection = week.sections.find(section => section.type === 'tiegri');
    
    if (tiegriSection && tiegriSection.items.length > 0) {
      tiegriSection.items.forEach((item, itemIndex) => {
        if (item.assignedName && item.assignedName.trim()) {
          // Parse the assignment - could be single name or pair
          const assignedNames = item.assignedName.includes(' / ') 
            ? item.assignedName.split(' / ').map(name => name.trim())
            : [item.assignedName.trim()];
          
          const slip = {
            id: `${week.id}-${item.id}`,
            name: assignedNames[0], // First name
            assistant: assignedNames.length > 1 ? assignedNames[1] : '—', // Second name or dash
            date: week.dateRange || week.title || `Week ${weeks.indexOf(week) + 1}`,
            partNumber: `${itemIndex + 4}. ${item.description || 'Assignment'}`, // Part numbers start from 4 in TIEGRI
            hall: 'Main hall' // Always Main hall as specified
          };
          
          slips.push(slip);
        }
      });
    }
  });
  
  return slips;
};
// Function to show slips preview
const showSlipsPreview = () => {
  const slips = generateSlipsData();
  
  if (slips.length === 0) {
    showAlert('No TIEGRI assignments found to generate slips for. Please add assignments to the TIEGRI NE TIJ LENDO section first.', 'warning');
    return;
  }
  
  setSlipsData(slips);
  setShowSlips(true);
};

// Function to print slips


// Enhanced priority-based auto-assign: fair rotation with spacing and variety preferences
// 
// HARD CONSTRAINTS (always enforced):
// 1. No sister is student more than once per schedule
// 2. No sister is assistant more than once per schedule  
// 3. No sister appears more than twice per schedule
// 4. Sisters must alternate roles between schedules (student ↔ assistant)
//
// SOFT PREFERENCES (used as tiebreakers):
// 1. Maximize spacing between any sister's reappearances (prioritize sisters who haven't appeared recently)
// 2. Rotate sisters through different TIEGRI points as students (encourage variety)
// 3. Avoid repeating the same sister partnerships until all other pairings have occurred (partner variety)
//
// This system ensures fair rotation while preventing anyone from being sidelined.
const performRotation = () => {
  if (weeks.length === 0) {
    showAlert('No weeks found to assign participants to. Please add some weeks first.', 'warning', 'No Weeks Available');
    return;
  }

  // Enhanced safety check: Ensure participant lists are loaded from Firebase
  if (!participantLists || Object.keys(participantLists).length === 0) {
    showAlert(
      'Participant lists are not available. Please ensure Firebase data is loaded and try again.',
      'error',
      'Data Not Available'
    );
    return;
  }

  // Verify we have the essential lists from Firebase
  const requiredLists = ['chairmen', 'sisters', 'prayers'];
  const missingLists = requiredLists.filter(listKey => !participantLists[listKey] || !participantLists[listKey].participants || participantLists[listKey].participants.length === 0);
  
  if (missingLists.length > 0) {
    showAlert(
      `Missing required participant lists from Firebase: ${missingLists.join(', ')}. Please contact the administrator.`,
      'error',
      'Incomplete Data'
    );
    return;
  }

  console.log('✅ All participant data loaded from Firebase - proceeding with auto-assign');

  // Always allow auto-assign - it will replace existing assignments with new ones
  showConfirm(
    'Auto-assign will assign participants to all roles based on fair rotation. Any existing assignments will be replaced. Do you want to continue?',
    (confirmed) => {
      if (!confirmed) return;
      
      // Mark as changed since we're about to modify assignments
      markAsChanged();
      
      // Perform the actual rotation
      executeRotation();
    },
    'Auto-Assign Participants',
    'info'
  );
};

// Extracted the actual rotation logic into a separate function
const executeRotation = () => {
  // Enhanced safety check: Ensure participant lists are loaded from Firebase
  if (!participantLists || Object.keys(participantLists).length === 0) {
    showAlert(
      'Cannot proceed with auto-assign: participant lists not available from Firebase.',
      'error',
      'Data Not Available'
    );
    return;
  }

  console.log('🚀 Starting auto-assign with Firebase data only - no hardcoded fallbacks');
  console.log('📊 Available participant lists:', Object.keys(participantLists));

  // STEP 1: Clear ALL existing assignments to ensure clean slate
  console.log('🧹 Clearing all existing assignments...');
  weeks.forEach(week => {
    // Clear week-level assignments
    week.chairman = '';
    week.openingPrayer = '';
    week.closingPrayer = '';
    
    // Clear all section item assignments
    week.sections.forEach(section => {
      section.items.forEach(item => {
        item.assignedName = '';
        item.assignedSecondary = '';
      });
    });
  });

  // First, fix any existing sister assignments
  fixSisterAssignments();
  
  // Initialize rotation tracking - use existing indices or start from 0
  const currentRotationIndices = { ...rotationIndices };
  
  // Track sisters assigned in current schedule - MOVED OUTSIDE WEEK LOOP
  const scheduleStudentTracker = new Set();
  const scheduleAssistantTracker = new Set();
  
  // Build historical assignment data from all saved schedules
  const historicalAssignments = buildHistoricalAssignmentData();
  
  // Get last role for each sister from most recent saved schedule for alternation
  const getLastRoleForSister = (sisterName) => {
    const data = historicalAssignments[sisterName];
    if (!data || !data.recentAssignments || data.recentAssignments.length === 0) {
      return null;
    }
    
    const sisterPairAssignments = data.recentAssignments.filter(assignment => 
      assignment.type === 'sister_pair' && assignment.position
    );
    
    if (sisterPairAssignments.length === 0) {
      return null;
    }
    
    const mostRecentAssignment = sisterPairAssignments.reduce((latest, current) => {
      if (current.schedule > latest.schedule) return current;
      if (current.schedule === latest.schedule && current.week > latest.week) return current;
      return latest;
    });
    
    return mostRecentAssignment.position;
  };
  
  // Build sister last role tracking for alternation
  const sisterLastRoles = {};
  participantLists.sisters?.participants.forEach(sister => {
    sisterLastRoles[sister] = getLastRoleForSister(sister);
  });
  
  console.log('=== SIMPLE PRIORITY-BASED AUTO-ASSIGN ===');
  const sistersWithLastRole = participantLists.sisters?.participants.filter(sister => sisterLastRoles[sister]) || [];
  if (sistersWithLastRole.length > 0) {
    console.log('Sisters who must alternate roles:');
    sistersWithLastRole.forEach(sister => {
      const lastRole = sisterLastRoles[sister];
      const shouldBe = lastRole === 'student' ? 'assistant' : 'student';
      console.log(`  • ${sister}: was ${lastRole} → should be ${shouldBe}`);
    });
  }
  
  // Initialize rotation indices
  Object.keys(participantLists).forEach(listKey => {
    if (currentRotationIndices[listKey] === undefined) {
      currentRotationIndices[listKey] = 0;
    }
  });
  
  // Initialize sister rotation if not present
  if (currentRotationIndices.sisters === undefined) {
    currentRotationIndices.sisters = 0;
  }
  
  // Initialize sister rotation index outside the week loop
  let sisterRotationIndex = currentRotationIndices.sisters || 0;
  
  // Initialize appearance tracking outside the week loop
  const scheduleAppearanceCount = new Map(); // Track total appearances per sister (max 2)
  
  // Process each week
  weeks.forEach((week, weekIndex) => {
    const weekAssignments = {}; // Track who's assigned this week
    
    // Priority order for assignments
    const priorityAssignments = [];
    
    // Priority 1: Chairman (Jacom) - always assign since we cleared everything
    if (participantLists.chairmen) {
      priorityAssignments.push({
        priority: 1,
        type: 'chairman',
        listKey: 'chairmen',
        assignTo: (name) => { week.chairman = name; }
      });
    }
    
    // Collect all section items with their priorities
    week.sections.forEach(section => {
      section.items.forEach(item => {
        if (!item.participantList || !participantLists[item.participantList]) return;
        
        // Priority 2: Puonjruok Muma conductor
        if (item.type === 'puonjruok' && item.participantList === 'puonjruok_muma') {
          priorityAssignments.push({
            priority: 2,
            type: 'puonjruok_muma',
            listKey: 'puonjruok_muma',
            item: item,
            assignTo: (name) => { item.assignedName = name; }
          });
          
          // Priority 7: Puonjruok reader (secondary)
          if (item.secondaryList && participantLists[item.secondaryList]) {
            priorityAssignments.push({
              priority: 7,
              type: 'puonjruok_reader',
              listKey: item.secondaryList,
              item: item,
              assignTo: (name) => { item.assignedSecondary = name; }
            });
          }
        }
        // Priority 3: Other NGIMAWA section items
        else if (section.type === 'ngimawa' && item.participantList === 'ngimawa') {
          priorityAssignments.push({
            priority: 3,
            type: 'ngimawa',
            listKey: item.participantList,
            item: item,
            assignTo: (name) => { item.assignedName = name; }
          });
        }
        // Handle other manually added items in NGIMAWA section
        else if (section.type === 'ngimawa' && item.participantList && item.participantList !== 'puonjruok_muma') {
          // All manually added NGIMAWA items should use priority 3.5 (before Puonjruok Muma)
          // and use the ngimawa list for rotation
          priorityAssignments.push({
            priority: 3.5,
            type: 'ngimawa_manual',
            listKey: 'ngimawa', // Always use ngimawa list for manually added NGIMAWA items
            item: item,
            isDouble: false, // NGIMAWA items are always single assignments
            assignTo: (name) => { item.assignedName = name; }
          });
        }
        // Priority 4: Twak
        else if (item.participantList === 'twak') {
          priorityAssignments.push({
            priority: 4,
            type: 'twak',
            listKey: 'twak',
            item: item,
            assignTo: (name) => { item.assignedName = name; }
          });
        }
        // Priority 5: Assignment 1
        else if (item.participantList === 'assignment1') {
          priorityAssignments.push({
            priority: 5,
            type: 'assignment1',
            listKey: 'assignment1',
            item: item,
            assignTo: (name) => { item.assignedName = name; }
          });
        }
        // Priority 6: Assignment 2
        else if (item.participantList === 'assignment2') {
          priorityAssignments.push({
            priority: 6,
            type: 'assignment2',
            listKey: 'assignment2',
            item: item,
            assignTo: (name) => { item.assignedName = name; }
          });
        }
        // Priority 8: Assignment 3
        else if (item.participantList === 'assignment3') {
          priorityAssignments.push({
            priority: 8,
            type: 'assignment3',
            listKey: 'assignment3',
            item: item,
            assignTo: (name) => { item.assignedName = name; }
          });
        }
        // Handle sisters (TIEGRI) - special case with per-point rotation and schedule constraints
        else if (item.participantList === 'sisters' && item.isDouble) {
          // Determine which TIEGRI point this is within the week
          const tiegriSection = week.sections.find(sec => sec.type === 'tiegri');
          const tiegriItemIndex = tiegriSection ? tiegriSection.items.findIndex(tiegriItem => tiegriItem.id === item.id) : -1;
          const pointKey = `point${tiegriItemIndex + 1}`;
          
          priorityAssignments.push({
            priority: 10, // Lower priority
            type: 'sisters',
            listKey: 'sisters',
            item: item,
            isDouble: true,
            pointKey: pointKey, // NEW: Track which point this is
            tiegriItemIndex: tiegriItemIndex,
            assignTo: (names) => { item.assignedName = names; }
          });
        }
      });
    });
    
    // Priority 9: Opening Prayer - always assign since we cleared everything
    if (participantLists.prayers) {
      priorityAssignments.push({
        priority: 9,
        type: 'opening_prayer',
        listKey: 'prayers',
        assignTo: (name) => { week.openingPrayer = name; }
      });
    }
    
    // Priority 9: Closing Prayer (same priority as opening) - always assign since we cleared everything
    if (participantLists.prayers) {
      priorityAssignments.push({
        priority: 9,
        type: 'closing_prayer',
        listKey: 'prayers',
        assignTo: (name) => { week.closingPrayer = name; },
        needsDifferentFrom: () => week.openingPrayer // Ensure different from opening prayer
      });
    }
    
    // Sort by priority
    priorityAssignments.sort((a, b) => a.priority - b.priority);
    
    // Helper functions for constraints
    const canBeStudent = (sister) => {
      const currentAppearances = scheduleAppearanceCount.get(sister) || 0;
      const wasStudent = scheduleStudentTracker.has(sister);
      const wasAssistant = scheduleAssistantTracker.has(sister);
      const lastRole = sisterLastRoles[sister];
      
      // Cannot be student if already was student this schedule
      if (wasStudent) {
        console.log(`❌ ${sister} cannot be student - already student this schedule`);
        return false;
      }
      
      // For first appearance: enforce alternation
      if (currentAppearances === 0) {
        if (lastRole === 'student') {
          console.log(`❌ ${sister} cannot be student for 1st appearance - was student last schedule (alternation)`);
          return false;
        }
      }
      
      // For second appearance: can be student if was assistant for first appearance
      if (currentAppearances === 1) {
        if (!wasAssistant) {
          console.log(`❌ ${sister} cannot be student for 2nd appearance - was not assistant for 1st appearance`);
          return false;
        }
        console.log(`✅ ${sister} can be student for 2nd appearance - was assistant for 1st appearance`);
      }
      
      return true;
    };
    
    const canBeAssistant = (sister) => {
      const currentAppearances = scheduleAppearanceCount.get(sister) || 0;
      const wasStudent = scheduleStudentTracker.has(sister);
      const wasAssistant = scheduleAssistantTracker.has(sister);
      const lastRole = sisterLastRoles[sister];
      
      // Cannot be assistant if already was assistant this schedule  
      if (wasAssistant) {
        console.log(`❌ ${sister} cannot be assistant - already assistant this schedule`);
        return false;
      }
      
      // For first appearance: enforce alternation
      if (currentAppearances === 0) {
        if (lastRole === 'assistant') {
          console.log(`❌ ${sister} cannot be assistant for 1st appearance - was assistant last schedule (alternation)`);
          return false;
        }
      }
      
      // For second appearance: can be assistant if was student for first appearance
      if (currentAppearances === 1) {
        if (!wasStudent) {
          console.log(`❌ ${sister} cannot be assistant for 2nd appearance - was not student for 1st appearance`);
          return false;
        }
        console.log(`✅ ${sister} can be assistant for 2nd appearance - was student for 1st appearance`);
      }
      
      return true;
    };
    
    const canAppearAgain = (sister) => {
      const currentCount = (scheduleAppearanceCount.get(sister) || 0);
      return currentCount < 2; // Max 2 appearances per schedule
    };
    
    const assignSister = (sister, role) => {
      console.log(`📝 Assigning ${sister} as ${role}`);
      if (role === 'student') {
        if (scheduleStudentTracker.has(sister)) {
          console.error(`🚨 CONSTRAINT VIOLATION: ${sister} already assigned as student this schedule!`);
        }
        scheduleStudentTracker.add(sister);
      } else {
        if (scheduleAssistantTracker.has(sister)) {
          console.error(`🚨 CONSTRAINT VIOLATION: ${sister} already assigned as assistant this schedule!`);
        }
        scheduleAssistantTracker.add(sister);
      }
      scheduleAppearanceCount.set(sister, (scheduleAppearanceCount.get(sister) || 0) + 1);
      console.log(`📊 ${sister} total appearances this schedule: ${scheduleAppearanceCount.get(sister)}`);
    };
    
    // Process assignments in priority order
    priorityAssignments.forEach(assignment => {
      if (assignment.isDouble) {
        // Handle sister pairs with simple rotation
        const listData = participantLists[assignment.listKey];
        if (!listData || !listData.participants) {
          console.warn(`⚠️ Participant list '${assignment.listKey}' not found or empty, skipping assignment`);
          return;
        }
        const list = listData.participants;
        console.log(`\n🎯 Assigning sisters for Week ${weekIndex + 1}, TIEGRI item: "${assignment.item.title}"`);
        
        let student = null;
        let assistant = null;
        
        // Find student: rotate through list until we find someone who can be student
        // With soft preferences for both spacing and TIEGRI point rotation
        const historicalData = buildHistoricalAssignmentData();
        const itemTitle = assignment.item.title || assignment.item.description || `TIEGRI Point ${assignment.tiegriItemIndex + 1}`;
        
        // Helper function to calculate weeks since last appearance for spacing preference
        const getWeeksSinceLastAppearance = (sisterName) => {
          // First, check if sister appeared in CURRENT schedule (being built)
          // Look through already processed weeks in current schedule
          let mostRecentWeekInCurrentSchedule = -1;
          for (let prevWeekIndex = 0; prevWeekIndex < weekIndex; prevWeekIndex++) {
            const prevWeek = weeks[prevWeekIndex];
            if (prevWeek.sections) {
              prevWeek.sections.forEach(section => {
                if (section.items) {
                  section.items.forEach(item => {
                    if (item.isDouble && item.assignedName && item.assignedName.includes(' / ')) {
                      const sisters = item.assignedName.split(' / ').map(name => name.trim());
                      if (sisters.includes(sisterName)) {
                        mostRecentWeekInCurrentSchedule = Math.max(mostRecentWeekInCurrentSchedule, prevWeekIndex);
                      }
                    }
                  });
                }
              });
            }
          }
          
          // If sister appeared in current schedule, return weeks since that appearance
          if (mostRecentWeekInCurrentSchedule >= 0) {
            return weekIndex - mostRecentWeekInCurrentSchedule;
          }
          
          // If not in current schedule, check historical data
          const sisterHistory = historicalData[sisterName];
          if (!sisterHistory || !sisterHistory.recentAssignments || sisterHistory.recentAssignments.length === 0) {
            return Infinity; // Never appeared before - highest priority
          }
          
          // Find the most recent sister pair assignment in historical data
          const sisterPairAssignments = sisterHistory.recentAssignments.filter(assignment => assignment.type === 'sister_pair');
          if (sisterPairAssignments.length === 0) {
            return Infinity; // Never appeared in sister pairs - highest priority  
          }
          
          const mostRecentAssignment = sisterPairAssignments.reduce((latest, current) => {
            // Compare by schedule first, then by week
            if (current.schedule > latest.schedule) return current;
            if (current.schedule === latest.schedule && current.week > latest.week) return current;
            return latest;
          });
          
          // Calculate actual distance in weeks from most recent historical assignment to current position
          const currentScheduleIndex = scheduleHistory.length; // Current schedule is after all saved schedules
          const currentWeekIndex = weekIndex;
          
          // Sister appeared in previous schedule - calculate total weeks gap
          // This is a rough estimate: weeks since end of last schedule + position in current schedule
          const weeksSinceLastSchedule = (currentScheduleIndex - mostRecentAssignment.schedule) * 8; // Assume 8 weeks per schedule
          const weeksFromLastAssignmentToEndOfSchedule = 8 - mostRecentAssignment.week; // Weeks from assignment to end of that schedule
          return weeksFromLastAssignmentToEndOfSchedule + weeksSinceLastSchedule + currentWeekIndex;
        };
        
        // Create candidates list sorted by preference
        const candidatesWithScores = list.map(candidate => {
          if (weekAssignments[candidate]) return null; // Already assigned this week
          if (!canAppearAgain(candidate)) return null; // Already appeared twice
          if (!canBeStudent(candidate)) return null; // Cannot be student
          
          const candidateHistory = historicalData[candidate] || { tiegriPoints: [] };
          const weeksSinceLastAppearance = getWeeksSinceLastAppearance(candidate);
          const hasNotDoneThisPoint = !candidateHistory.tiegriPoints.includes(itemTitle);
          
          // Scoring: prioritize by spacing (higher = better), then by point variety as tiebreaker
          let score = weeksSinceLastAppearance;
          
          // Heavy penalty for very recent appearances to discourage consecutive assignments
          if (weeksSinceLastAppearance < 3) {
            score -= 1000; // Heavy penalty for appearing within last 3 weeks
          }
          
          if (hasNotDoneThisPoint) {
            score += 100; // Moderate bonus for not having done this point (much smaller than before)
          }
          
          return {
            name: candidate,
            score: score,
            weeksSinceLastAppearance: weeksSinceLastAppearance,
            hasNotDoneThisPoint: hasNotDoneThisPoint
          };
        }).filter(Boolean); // Remove null entries
        
        // Sort by score (highest first) 
        candidatesWithScores.sort((a, b) => b.score - a.score);
        
        if (candidatesWithScores.length > 0) {
          const bestCandidate = candidatesWithScores[0];
          student = bestCandidate.name;
          
          const spacingText = bestCandidate.weeksSinceLastAppearance === Infinity 
            ? "never appeared before" 
            : `${bestCandidate.weeksSinceLastAppearance} weeks since last appearance`;
          const pointText = bestCandidate.hasNotDoneThisPoint 
            ? `hasn't done "${itemTitle}" before` 
            : `has done "${itemTitle}" before`;
          
          console.log(`🎯 Best student candidate: ${student} (${spacingText}, ${pointText})`);
          
          // Log top 3 candidates for debugging
          if (candidatesWithScores.length > 1) {
            console.log(`📊 Top student candidates for spacing/variety:`);
            candidatesWithScores.slice(0, 3).forEach((candidate, index) => {
              const spacingText = candidate.weeksSinceLastAppearance === Infinity 
                ? "never" 
                : `${candidate.weeksSinceLastAppearance}w`;
              const pointText = candidate.hasNotDoneThisPoint ? "new point" : "repeat point";
              console.log(`  ${index + 1}. ${candidate.name} (${spacingText}, ${pointText}, score: ${candidate.score})`);
            });
          }
        }
        
        // Find assistant: consider spacing preference while maintaining rotation
        if (student) {
          const studentIndex = list.indexOf(student);
          
          // Create candidates list for assistant, sorted by spacing preference and partnership variety
          const assistantCandidatesWithScores = list.map(candidate => {
            if (candidate === student) return null; // Can't be same as student
            if (weekAssignments[candidate]) return null; // Already assigned this week
            if (!canAppearAgain(candidate)) return null; // Already appeared twice
            if (!canBeAssistant(candidate)) return null; // Cannot be assistant
            
            const weeksSinceLastAppearance = getWeeksSinceLastAppearance(candidate);
            let score = weeksSinceLastAppearance;
            
            // Add partnership variety bonus/penalty
            const candidateHistory = historicalData[candidate] || { partnerships: [] };
            const hasBeenPairedWithStudent = candidateHistory.partnerships?.includes(student);
            
            if (hasBeenPairedWithStudent) {
              score -= 15; // Moderate penalty for having been paired before
              console.log(`⚖️ Partnership variety: ${candidate} has been paired with ${student} before (-15 points)`);
            } else {
              score += 10; // Bonus for new partnership
              console.log(`✨ Partnership variety: ${candidate} and ${student} would be a new pairing (+10 points)`);
            }
            
            return {
              name: candidate,
              score: score,
              weeksSinceLastAppearance: weeksSinceLastAppearance,
              isNewPartnership: !hasBeenPairedWithStudent
            };
          }).filter(Boolean); // Remove null entries
          
          // Sort by spacing score (highest first)
          assistantCandidatesWithScores.sort((a, b) => b.score - a.score);
          
          if (assistantCandidatesWithScores.length > 0) {
            const bestAssistantCandidate = assistantCandidatesWithScores[0];
            assistant = bestAssistantCandidate.name;
            
            const spacingText = bestAssistantCandidate.weeksSinceLastAppearance === Infinity 
              ? "never appeared before" 
              : `${bestAssistantCandidate.weeksSinceLastAppearance} weeks since last appearance`;
            const partnershipText = bestAssistantCandidate.isNewPartnership ? "new partnership" : "repeat partnership";
            
            console.log(`🎯 Best assistant candidate: ${assistant} (${spacingText}, ${partnershipText})`);
            
            // Log top 3 assistant candidates for debugging
            if (assistantCandidatesWithScores.length > 1) {
              console.log(`📊 Top assistant candidates for spacing and partnership variety:`);
              assistantCandidatesWithScores.slice(0, 3).forEach((candidate, index) => {
                const spacingText = candidate.weeksSinceLastAppearance === Infinity 
                  ? "never" 
                  : `${candidate.weeksSinceLastAppearance}w`;
                const partnershipText = candidate.isNewPartnership ? "new" : "repeat";
                console.log(`  ${index + 1}. ${candidate.name} (${spacingText}, ${partnershipText} partnership, score: ${candidate.score})`);
              });
            }
          }
        }
        
        // If we found both, assign them
        if (student && assistant) {
          console.log(`✅ Assigned: ${student} (student) / ${assistant} (assistant)`);
          assignment.assignTo(`${student} / ${assistant}`);
          
          weekAssignments[student] = true;
          weekAssignments[assistant] = true;
          
          assignSister(student, 'student');
          assignSister(assistant, 'assistant');
          
          // Update rotation index based on assigned sisters for future reference
          // Use the assistant's position + 1 to continue rotation
          if (assistant) {
            sisterRotationIndex = (list.indexOf(assistant) + 1) % list.length;
          } else if (student) {
            sisterRotationIndex = (list.indexOf(student) + 1) % list.length;
          }
        } else {
          console.warn(`⚠️ Could not find valid pair. Student: ${student}, Assistant: ${assistant}`);
          // Fallback: try to assign any two available sisters with constraint checking and spacing preference
          const available = list.filter(sister => !weekAssignments[sister]);
          
          if (available.length >= 2) {
            let fallbackStudent = null;
            let fallbackAssistant = null;
            
            // Create scoring for all available sisters for fallback assignment
            const availableWithScores = available.map(sister => ({
              name: sister,
              score: getWeeksSinceLastAppearance(sister),
              canBeStudent: canBeStudent(sister) && canAppearAgain(sister),
              canBeAssistant: canBeAssistant(sister) && canAppearAgain(sister)
            })).sort((a, b) => b.score - a.score); // Sort by spacing (highest first)
            
            // Try to find a valid student with best spacing
            for (const sisterData of availableWithScores) {
              if (sisterData.canBeStudent) {
                fallbackStudent = sisterData.name;
                break;
              }
            }
            
            // Try to find a valid assistant with best spacing and partnership variety (excluding chosen student)
            if (fallbackStudent) {
              // Enhance available sisters scoring for assistant selection with partnership variety
              const assistantCandidates = availableWithScores
                .filter(sisterData => sisterData.name !== fallbackStudent && sisterData.canBeAssistant)
                .map(sisterData => {
                  let score = sisterData.score; // Start with spacing score
                  
                  // Add partnership variety consideration
                  const candidateHistory = historicalData[sisterData.name] || { partnerships: [] };
                  const hasBeenPairedWithStudent = candidateHistory.partnerships?.includes(fallbackStudent);
                  
                  if (hasBeenPairedWithStudent) {
                    score -= 15; // Penalty for repeat partnership
                  } else {
                    score += 10; // Bonus for new partnership
                  }
                  
                  return {
                    ...sisterData,
                    score: score,
                    isNewPartnership: !hasBeenPairedWithStudent
                  };
                })
                .sort((a, b) => b.score - a.score); // Re-sort by updated score
              
              if (assistantCandidates.length > 0) {
                fallbackAssistant = assistantCandidates[0].name;
              }
            }
            
            if (fallbackStudent && fallbackAssistant) {
              const studentSpacing = getWeeksSinceLastAppearance(fallbackStudent);
              const assistantSpacing = getWeeksSinceLastAppearance(fallbackAssistant);
              const studentSpacingText = studentSpacing === Infinity ? "never appeared" : `${studentSpacing}w ago`;
              const assistantSpacingText = assistantSpacing === Infinity ? "never appeared" : `${assistantSpacing}w ago`;
              
              console.log(`✅ Fallback assignment with spacing consideration: ${fallbackStudent} (student, ${studentSpacingText}) / ${fallbackAssistant} (assistant, ${assistantSpacingText})`);
              assignment.assignTo(`${fallbackStudent} / ${fallbackAssistant}`);
              weekAssignments[fallbackStudent] = true;
              weekAssignments[fallbackAssistant] = true;
              assignSister(fallbackStudent, 'student');
              assignSister(fallbackAssistant, 'assistant');
            } else {
              console.error(`🚨 CONSTRAINT VIOLATION: Could not assign valid pair, constraints would be violated`);
              // Emergency fallback - but still avoid same role twice in schedule and prefer better spacing
              if (available.length >= 2) {
                let emergencyStudent = null;
                let emergencyAssistant = null;
                
                // Sort available by spacing for emergency assignment
                const emergencyWithScores = available.map(sister => ({
                  name: sister,
                  score: getWeeksSinceLastAppearance(sister),
                  canBeStudent: !scheduleStudentTracker.has(sister),
                  canBeAssistant: !scheduleAssistantTracker.has(sister)
                })).sort((a, b) => b.score - a.score);
                
                // At minimum, don't assign same role twice in same schedule, and prefer better spacing
                for (const sisterData of emergencyWithScores) {
                  if (sisterData.canBeStudent) {
                    emergencyStudent = sisterData.name;
                    break;
                  }
                }
                
                for (const sisterData of emergencyWithScores) {
                  if (sisterData.name !== emergencyStudent && sisterData.canBeAssistant) {
                    emergencyAssistant = sisterData.name;
                    break;
                  }
                }
                
                if (emergencyStudent && emergencyAssistant) {
                  const studentSpacing = getWeeksSinceLastAppearance(emergencyStudent);
                  const assistantSpacing = getWeeksSinceLastAppearance(emergencyAssistant);
                  const studentSpacingText = studentSpacing === Infinity ? "never appeared" : `${studentSpacing}w ago`;
                  const assistantSpacingText = assistantSpacing === Infinity ? "never appeared" : `${assistantSpacing}w ago`;
                  
                  assignment.assignTo(`${emergencyStudent} / ${emergencyAssistant}`);
                  weekAssignments[emergencyStudent] = true;
                  weekAssignments[emergencyAssistant] = true;
                  assignSister(emergencyStudent, 'student');
                  assignSister(emergencyAssistant, 'assistant');
                  console.error(`🚨 Emergency assignment with spacing consideration (alternation rule relaxed): ${emergencyStudent} (${studentSpacingText}) / ${emergencyAssistant} (${assistantSpacingText})`);
                } else {
                  // Absolute last resort - use best spacing available
                  const bestSpacingCandidates = available
                    .map(sister => ({ name: sister, score: getWeeksSinceLastAppearance(sister) }))
                    .sort((a, b) => b.score - a.score);
                  
                  const absoluteStudent = bestSpacingCandidates[0]?.name || available[0];
                  const absoluteAssistant = bestSpacingCandidates[1]?.name || available[1];
                  
                  assignment.assignTo(`${absoluteStudent} / ${absoluteAssistant}`);
                  weekAssignments[absoluteStudent] = true;
                  weekAssignments[absoluteAssistant] = true;
                  assignSister(absoluteStudent, 'student');
                  assignSister(absoluteAssistant, 'assistant');
                  console.error(`🚨 CRITICAL: Absolute emergency assignment with best available spacing (may violate ALL constraints): ${absoluteStudent} / ${absoluteAssistant}`);
                }
              }
            }
          }
        }
      } else {
        // Handle single assignments with historical consideration
        const listData = participantLists[assignment.listKey];
        if (!listData || !listData.participants) {
          console.warn(`⚠️ Participant list '${assignment.listKey}' not found or empty, skipping assignment`);
          return;
        }
        const list = listData.participants;
        let assigned = false;
        let attempts = 0;
        const maxAttempts = list.length;
        
        // Get historical data for this assignment type
        const historicalData = buildHistoricalAssignmentData();
        
        while (!assigned && attempts < maxAttempts) {
          const currentIndex = currentRotationIndices[assignment.listKey];
          const name = list[currentIndex % list.length];
          
          // Check if this person is already assigned this week
          let canAssign = !weekAssignments[name];
          
          // Check for additional constraints
          if (canAssign && assignment.needsDifferentFrom) {
            canAssign = name !== assignment.needsDifferentFrom();
          }
             // Consider historical data - prefer people with fewer recent assignments
        if (canAssign && historicalData[name]) {
          const recentAssignmentCount = historicalData[name].recentAssignments.length;
          const totalHistoricalCount = historicalData[name].total;
          
          // If this person has significantly more assignments than others, try to skip
          if (attempts < maxAttempts / 2) { // Only try alternatives for first half of attempts
            const avgAssignments = Object.values(historicalData)
              .filter(h => list.includes(Object.keys(historicalData).find(k => historicalData[k] === h)))
              .reduce((sum, h) => sum + h.total, 0) / list.length;
            
            if (totalHistoricalCount > avgAssignments + 2) {
              canAssign = false; // Skip this person and try next
            }
          }
        }
          
          if (canAssign) {
            assignment.assignTo(name);
            weekAssignments[name] = true;
            currentRotationIndices[assignment.listKey] = (currentIndex + 1) % list.length;
            assigned = true;
          } else {
            // Skip to next person in this list
            currentRotationIndices[assignment.listKey] = (currentIndex + 1) % list.length;
            attempts++;
          }
        }
        
        // If we couldn't find anyone after going through the whole list,
        // assign the next person anyway (this handles cases where everyone is already assigned)
        if (!assigned) {
          const currentIndex = currentRotationIndices[assignment.listKey];
          const name = list[currentIndex % list.length];
          assignment.assignTo(name);
          weekAssignments[name] = true;
          currentRotationIndices[assignment.listKey] = (currentIndex + 1) % list.length;
        }
      }
    });
  });
  
  // Update state with new rotation indices
  // Save the current rotation indices including sister rotation
  currentRotationIndices.sisters = sisterRotationIndex;
  setRotationIndices(currentRotationIndices);
  setWeeks([...weeks]);
  markAsChanged();
  
  // Enhanced debug output to show new tracking systems
  console.log('\n=== AUTO-ASSIGN COMPLETED - ENHANCED ROTATION SYSTEM ===');
  console.log(`📊 Schedule Summary: ${scheduleStudentTracker.size} sisters were students, ${scheduleAssistantTracker.size} were assistants`);
  
  // Show spacing analysis for all sisters
  console.log('\n📅 SPACING ANALYSIS - Weeks since last appearance for all sisters:');
  const spacingAnalysis = participantLists.sisters?.participants.map(sister => {
    const sisterHistory = historicalAssignments[sister];
    let weeksSinceLastAppearance = Infinity;
    
    if (sisterHistory && sisterHistory.recentAssignments && sisterHistory.recentAssignments.length > 0) {
      const sisterPairAssignments = sisterHistory.recentAssignments.filter(assignment => assignment.type === 'sister_pair');
      if (sisterPairAssignments.length > 0) {
        const mostRecentAssignment = sisterPairAssignments.reduce((latest, current) => {
          // Compare by schedule first, then by week
          if (current.schedule > latest.schedule) return current;
          if (current.schedule === latest.schedule && current.week > latest.week) return current;
          return latest;
        });
        
        const currentScheduleIndex = scheduleHistory.length;
        
        if (mostRecentAssignment.schedule === currentScheduleIndex) {
          // Sister appeared in current schedule - she shouldn't be considered for spacing
          weeksSinceLastAppearance = 0;
        } else {
          // Sister appeared in previous schedule - calculate total weeks gap
          const weeksSinceLastSchedule = (currentScheduleIndex - mostRecentAssignment.schedule) * 8;
          const weeksFromLastAssignmentToEndOfSchedule = 8 - mostRecentAssignment.week;
          weeksSinceLastAppearance = weeksFromLastAssignmentToEndOfSchedule + weeksSinceLastSchedule;
        }
      }
    }
    
    return { 
      name: sister, 
      spacing: weeksSinceLastAppearance,
      assignedThisSchedule: scheduleStudentTracker.has(sister) || scheduleAssistantTracker.has(sister)
    };
  }).sort((a, b) => b.spacing - a.spacing) || [];
  
  spacingAnalysis.forEach(data => {
    const spacingText = data.spacing === Infinity ? "Never appeared" : `${data.spacing} weeks ago`;
    const assignedText = data.assignedThisSchedule ? " ✅ ASSIGNED" : "";
    console.log(`  • ${data.name}: ${spacingText}${assignedText}`);
  });
  
  // Show TIEGRI point variety analysis
  console.log('\n🎯 TIEGRI POINT VARIETY ANALYSIS:');
  participantLists.sisters?.participants.forEach(sister => {
    const sisterHistory = historicalAssignments[sister] || { tiegriPoints: [] };
    const pointsText = sisterHistory.tiegriPoints.length > 0 
      ? sisterHistory.tiegriPoints.join(', ')
      : 'No TIEGRI points as student yet';
    console.log(`  • ${sister}: [${pointsText}]`);
  });
  
  // Show partnership variety analysis
  console.log('\n🤝 PARTNERSHIP VARIETY ANALYSIS:');
  participantLists.sisters?.participants.forEach(sister => {
    const sisterHistory = historicalAssignments[sister] || { partnerships: [] };
    const partnersText = sisterHistory.partnerships.length > 0 
      ? sisterHistory.partnerships.join(', ')
      : 'No partnerships yet';
    console.log(`  • ${sister}: [${partnersText}]`);
  });
  
  // Show current schedule partnerships
  console.log('\n🤝 CURRENT SCHEDULE PARTNERSHIPS:');
  const currentSchedulePartnerships = [];
  weeks.forEach((week, weekIndex) => {
    week.sections.forEach(section => {
      if (section.type === 'tiegri') {
        section.items.forEach(item => {
          if (item.isDouble && item.assignedName && item.assignedName.includes(' / ')) {
            const [student, assistant] = item.assignedName.split(' / ').map(name => name.trim());
            currentSchedulePartnerships.push(`${student} & ${assistant}`);
          }
        });
      }
    });
  });
  
  if (currentSchedulePartnerships.length > 0) {
    currentSchedulePartnerships.forEach((partnership, index) => {
      console.log(`  ${index + 1}. ${partnership}`);
    });
  } else {
    console.log('  No partnerships in current schedule yet');
  }
  
  // CONSTRAINT COMPLIANCE CHECK
  const studentsThisSchedule = Array.from(scheduleStudentTracker);
  const assistantsThisSchedule = Array.from(scheduleAssistantTracker);
  console.log(`✅ Students this schedule (max 1 each): ${studentsThisSchedule.join(', ')}`);
  console.log(`📝 Assistants this schedule: ${assistantsThisSchedule.join(', ')}`);
  
  // Check constraint violations
  let constraintViolations = 0;
  const allParticipants = [...new Set([...studentsThisSchedule, ...assistantsThisSchedule])];
  
  allParticipants.forEach(name => {
    const studentCount = scheduleStudentTracker.has(name) ? 1 : 0;
    const assistantCount = scheduleAssistantTracker.has(name) ? 1 : 0;
    const totalAppearances = studentCount + assistantCount;
    
    if (studentCount > 1) {
      console.error(`🚨 CONSTRAINT VIOLATION: ${name} was student ${studentCount} times (max 1)`);
      constraintViolations++;
    }
    if (totalAppearances > 2) {
      console.error(`🚨 CONSTRAINT VIOLATION: ${name} appeared ${totalAppearances} times (max 2)`);
      constraintViolations++;
    }
  });
  
  if (constraintViolations === 0) {
    console.log('✅ ALL CONSTRAINTS SATISFIED: No more than once student + no more than twice total');
  } else {
    console.error(`🚨 ${constraintViolations} constraint violation(s) detected!`);
  }
  
  console.log('\n📈 Schedule summary:');
  console.log(`Students this schedule: ${scheduleStudentTracker.size}`);
  console.log(`Assistants this schedule: ${scheduleAssistantTracker.size}`);
  console.log(`Total sister assignments: ${scheduleStudentTracker.size + scheduleAssistantTracker.size}`);
  
  // Show appearance counts
  console.log('\n👥 Sister appearance counts:');
  scheduleAppearanceCount.forEach((count, sister) => {
    const roles = [];
    if (scheduleStudentTracker.has(sister)) roles.push('student');
    if (scheduleAssistantTracker.has(sister)) roles.push('assistant');
    console.log(`${sister}: ${count} time(s) - ${roles.join(', ')}`);
  });
  
  // Show success message
  showToast('Auto-assignment completed successfully!', 'success');
};

// Add this function after the performRotation function:

  // Save to Firebase

  // Predefined week template with simplified assignment logic
  const createWeekTemplate = () => {
    const weekNumber = weeks.length + 1;
    
    return {
      id: Date.now(),
      title: `NGECHE ${weekNumber}`,
      dateRange: '',
      chairman: '',
      openingSong: '',
      openingPrayer: '',
      middleSong: '', // Song before NGIMAWA section
      sections: [
        {
          id: Date.now() + 1,
          name: 'MWANDU MA YUDORE E WACH NYASAYE',
          type: 'mwandu',
          items: [
            {
              id: Date.now() + 4,
              description: '',
              type: 'regular',
              participantList: 'assignment1', // Point 1 always uses Assignment 1
              secondaryList: null,
              assignedName: '',
              assignedSecondary: '',
              isDouble: false
            },
            {
              id: Date.now() + 5,
              description: 'Puonj Manie Wach Nyasaye (Dak. 10)',
              type: 'regular',
              participantList: 'assignment2', // Point 2 always uses Assignment 2
              secondaryList: null,
              assignedName: '',
              assignedSecondary: '',
              isDouble: false
            },
            {
              id: Date.now() + 6,
              description: 'Somo Muma (Dak. 4)',
              type: 'regular',
              participantList: 'assignment3', // Point 3 always uses Assignment 3
              secondaryList: null,
              assignedName: '',
              assignedSecondary: '',
              isDouble: false
            }
          ]
        },
        {
          id: Date.now() + 2,
          name: 'TIEGRI NE TIJ LENDO',
          type: 'tiegri',
          items: [] // No auto-assignment for TIEGRI - user must manually add and assign
        },
        {
          id: Date.now() + 3,
          name: 'NGIMAWA KAKA JOKRISTO',
          type: 'ngimawa',
          items: [
            {
              id: Date.now() + 7,
              description: 'Puonjruok Muma e Kanyakla (Dak. 30)',
              type: 'puonjruok',
              participantList: 'puonjruok_muma', // Uses dedicated Puonjruok Muma list
              secondaryList: 'puonjruok_readers',
              assignedName: '', // Will be auto-assigned from Puonjruok Muma list
              assignedSecondary: '',
              isDouble: false
            }
          ]
        }
      ],
      closingSong: '',
      closingPrayer: ''
    };
  };

  // Add a new week with template
  const addWeek = () => {
    const newWeek = createWeekTemplate();
    setWeeks([...weeks, newWeek]);
    markAsChanged();
  };

  // Add a section to a week
  const addSection = (weekId) => {
    setWeeks(weeks.map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          sections: [...week.sections, {
            id: Date.now(),
            name: '',
            type: 'custom',
            items: []
          }]
        };
      }
      return week;
    }));
    markAsChanged();
  };

  // Add an item to a section
  const addItem = (weekId, sectionId) => {
    setWeeks(weeks.map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          sections: week.sections.map(section => {
            if (section.id === sectionId) {
              // Default list selection based on section type
              let defaultList = null;
              let defaultDouble = false;
              
              if (section.type === 'tiegri') {
                defaultList = 'sisters';
                defaultDouble = true; // Sisters are usually double
              } else if (section.type === 'ngimawa') {
                defaultList = 'ngimawa'; // Always use Ngimawa (Elders) list for NGIMAWA section
                defaultDouble = false;
              }
              
              const newItem = {
                id: Date.now(),
                description: '',
                type: 'regular',
                participantList: defaultList,
                assignedName: '',
                isDouble: defaultDouble
              };
              
              // For NGIMAWA section, insert before Puonjruok Muma (keep it last)
              if (section.type === 'ngimawa') {
                const puonjruokIndex = section.items.findIndex(item => 
                  item.type === 'puonjruok' && item.participantList === 'puonjruok_muma'
                );
                
                if (puonjruokIndex !== -1) {
                  // Insert before Puonjruok Muma
                  const newItems = [...section.items];
                  newItems.splice(puonjruokIndex, 0, newItem);
                  return {
                    ...section,
                    items: newItems
                  };
                }
              }
              
              // For other sections or if no Puonjruok Muma found, add at the end
              return {
                ...section,
                items: [...section.items, newItem]
              };
            }
            return section;
          })
        };
      }
      return week;
    }));
    markAsChanged();
  };

  // Update functions
  const updateWeek = (weekId, field, value) => {
    setWeeks(weeks.map(week => 
      week.id === weekId ? { ...week, [field]: value } : week
    ));
    markAsChanged();
  };

  const updateSection = (weekId, sectionId, field, value) => {
    setWeeks(weeks.map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          sections: week.sections.map(section => 
            section.id === sectionId ? { ...section, [field]: value } : section
          )
        };
      }
      return week;
    }));
    markAsChanged();
  };

  const updateItem = (weekId, sectionId, itemId, field, value) => {
    setWeeks(weeks.map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          sections: week.sections.map(section => {
            if (section.id === sectionId) {
              return {
                ...section,
                items: section.items.map(item => {
                  if (item.id === itemId) {
                    const updates = { [field]: value };
                    // Automatically set isDouble to true when Sisters list is selected
                    if (field === 'participantList' && value === 'sisters') {
                      updates.isDouble = true;
                    }
                    // Automatically set isDouble to false when non-Sisters list is selected
                    if (field === 'participantList' && value !== 'sisters') {
                      updates.isDouble = false;
                    }
                    return { ...item, ...updates };
                  }
                  return item;
                })
              };
            }
            return section;
          })
        };
      }
      return week;
    }));
    markAsChanged();
  };

  // Delete functions
  const deleteWeek = (weekId) => {
    setWeeks(weeks.filter(week => week.id !== weekId));
    markAsChanged();
  };

  const deleteSection = (weekId, sectionId) => {
    setWeeks(weeks.map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          sections: week.sections.filter(section => section.id !== sectionId)
        };
      }
      return week;
    }));
    markAsChanged();
  };

  const deleteItem = (weekId, sectionId, itemId) => {
    setWeeks(weeks.map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          sections: week.sections.map(section => {
            if (section.id === sectionId) {
              return {
                ...section,
                items: section.items.filter(item => item.id !== itemId)
              };
            }
            return section;
          })
        };
      }
      return week;
    }));
    markAsChanged();
  };

  // Edit participant list - Firebase-only mode
  const updateParticipantList = async (key, participants) => {
    // Safety check: ensure we have existing participant lists
    if (!participantLists) {
      showAlert('Cannot update participant lists: No data loaded from Firebase.', 'error');
      return;
    }

    setSavingLists(true);
    
    const updatedLists = {
      ...participantLists,
      [key]: {
        ...participantLists[key],
        participants
      }
    };
    
    setParticipantLists(updatedLists);
    
    // Auto-save participant list changes to Firebase
    try {
      const data = {
        weeks,
        participantLists: updatedLists,
        previousAssignments,
        savedAt: new Date().toISOString()
      };
      
      await saveScheduleToFirebase(data);
      console.log('✅ Participant lists auto-saved to Firebase (Firebase-only mode)');
      showToast('Participant list updated and saved to Firebase', 'success');
    } catch (error) {
      console.error('❌ Error auto-saving participant lists:', error);
      showAlert(`Error saving to Firebase: ${error.message}`, 'error');
    } finally {
      setSavingLists(false);
    }
  };

  // Rotation algorithm


// Add this new helper function for finding sister pairs with position tracking:
const findNextAvailableSisterPairWithPositioning = (list, weekAssignments, startIndex, usedPairs, positionTracking, currentWeek, historicalData = {}) => {
  const availableIndices = [];
  
  // Find all available people (not assigned this week)
  list.forEach((name, index) => {
    if (!weekAssignments[name]) {
      availableIndices.push(index);
    }
  });
  
  // If we need at least 2 people for a pair
  if (availableIndices.length < 2) {
    // Fall back to rotation-based assignment
    const idx1 = startIndex % list.length;
    const idx2 = (startIndex + 1) % list.length;
    return {
      names: [list[idx1], list[idx2]],
      nextIndex: (startIndex + 2) % list.length
    };
  }
  
  // Get available sisters
  const availableSisters = availableIndices.map(idx => list[idx]);
  
  // Sort sisters by total assignments (least assigned first)
  const sortedByAssignments = availableSisters.sort((a, b) => {
    const countA = positionTracking[a]?.totalAssignments || 0;
    const countB = positionTracking[b]?.totalAssignments || 0;
    if (countA !== countB) return countA - countB;
    return a.localeCompare(b); // Alphabetical for consistency
  });
  
  // CRITICAL: Try to find pairs that haven't been used together in current schedule
  let bestPair = null;
  let bestScore = -1;
  
  for (let i = 0; i < sortedByAssignments.length - 1; i++) {
    for (let j = i + 1; j < sortedByAssignments.length; j++) {
      const sister1 = sortedByAssignments[i];
      const sister2 = sortedByAssignments[j];
      const pairKey = [sister1, sister2].sort().join('|');
      
      // STRICT RULE: Skip pairs that were already used in this current schedule
      if (usedPairs.has(pairKey)) {
        console.log(`⚠️ Skipping pair ${sister1} / ${sister2} - already used in current schedule`);
        continue;
      }
      
      // Calculate score based on position balance and spacing
      const score = calculatePairScore(sister1, sister2, positionTracking, currentWeek, historicalData);
      
      if (score > bestScore) {
        bestScore = score;
        bestPair = [sister1, sister2];
      }
    }
  }
  
  // If no unused pair found from sorted list, try ALL available combinations
  if (!bestPair) {
    console.log(`⚠️ No unused pairs found in sorted list, checking all available combinations...`);
    for (let i = 0; i < availableSisters.length - 1; i++) {
      for (let j = i + 1; j < availableSisters.length; j++) {
        const sister1 = availableSisters[i];
        const sister2 = availableSisters[j];
        const pairKey = [sister1, sister2].sort().join('|');
        
        if (!usedPairs.has(pairKey)) {
          bestPair = [sister1, sister2];
          console.log(`✅ Found unused pair: ${sister1} / ${sister2}`);
          break;
        }
      }
      if (bestPair) break;
    }
  }
  
  // Last resort: if ALL pairs have been used, take the least recently used pair
  if (!bestPair) {
    console.log(`⚠️ All pairs have been used - taking least assigned sisters as last resort`);
    bestPair = sortedByAssignments.slice(0, 2);
  }
  
  // Determine optimal order based on position balance
  const orderedPair = getOptimalPairOrder(bestPair, positionTracking, currentWeek, historicalData);
  
  // Calculate next index (advance by 2 for pairs)
  const nextIndex = (startIndex + 2) % list.length;
  
  return {
    names: orderedPair,
    nextIndex: nextIndex
  };
};

// Helper function to calculate pair score based on position balance and spacing
const calculatePairScore = (sister1, sister2, positionTracking, currentWeek, historicalData = {}) => {
  let score = 100; // Start with base score
  
  const track1 = positionTracking[sister1] || { firstPositions: [], secondPositions: [], totalAssignments: 0, historicalData: { total: 0, sisterPairs: 0, firstPosition: 0, secondPosition: 0 } };
  const track2 = positionTracking[sister2] || { firstPositions: [], secondPositions: [], totalAssignments: 0, historicalData: { total: 0, sisterPairs: 0, firstPosition: 0, secondPosition: 0 } };
  
  // Use actual historical data if available, otherwise fall back to tracking data
  const historical1 = historicalData[sister1] || track1.historicalData || { total: 0, sisterPairs: 0, firstPosition: 0, secondPosition: 0, partnerships: [] };
  const historical2 = historicalData[sister2] || track2.historicalData || { total: 0, sisterPairs: 0, firstPosition: 0, secondPosition: 0, partnerships: [] };
  
  // CORE RULE 1: Heavy penalty for sisters who haven't been assigned yet this session
  // They should get priority over sisters who already have assignments
  const hasFirstAssignment1 = track1.firstPositions.length > 0;
  const hasSecondAssignment1 = track1.secondPositions.length > 0;
  const hasFirstAssignment2 = track2.firstPositions.length > 0;
  const hasSecondAssignment2 = track2.secondPositions.length > 0;
  
  const hasAnyAssignment1 = hasFirstAssignment1 || hasSecondAssignment1;
  const hasAnyAssignment2 = hasFirstAssignment2 || hasSecondAssignment2;
  
  // Massive bonus for completely unassigned sisters (this session)
  if (!hasAnyAssignment1) score += 500;
  if (!hasAnyAssignment2) score += 500;
  
  // CORE RULE 2: Heavy penalty for repeated assignments within current session
  // Sisters with fewer total assignments should be heavily preferred
  score -= (track1.totalAssignments + track2.totalAssignments) * 100;
  
  // CORE RULE 3: Historical balance - prefer sisters with fewer historical assignments
  // Heavy preference for sisters with fewer historical sister pair assignments
  score -= (historical1.sisterPairs + historical2.sisterPairs) * 50;
  
  // CORE RULE 4: Strict historical position balance
  // Sisters who have never been in student position should get massive priority
  if (historical1.firstPosition === 0) score += 1000;
  if (historical2.firstPosition === 0) score += 1000;
  
  // Heavy preference for balancing historical first/second positions
  const historicalBalance1 = historical1.secondPosition - historical1.firstPosition;
  const historicalBalance2 = historical2.secondPosition - historical2.firstPosition;
  
  // Penalize severe historical imbalances
  if (Math.abs(historicalBalance1) > 2) score -= Math.abs(historicalBalance1) * 200;
  if (Math.abs(historicalBalance2) > 2) score -= Math.abs(historicalBalance2) * 200;
  
  // CORE RULE 5: Natural spacing bonus - encourage good spacing without hard constraints
  const getMinSpacing = (positions) => {
    if (positions.length === 0) return 999;
    return Math.min(...positions.map(pos => currentWeek - pos));
  };
  
  const spacing1 = Math.min(getMinSpacing(track1.firstPositions), getMinSpacing(track1.secondPositions));
  const spacing2 = Math.min(getMinSpacing(track2.firstPositions), getMinSpacing(track2.secondPositions));
  
  // Soft bonus for good spacing (no hard constraints)
  score += Math.min(spacing1, spacing2) * 15;
  
  // CORE RULE 6: Encourage variety within current session
  // Bonus for sisters who haven't had any assignments this session
  if (!hasAnyAssignment1) score += 200;
  if (!hasAnyAssignment2) score += 200;
  
  // Smaller bonus for sisters with only one type of assignment (encouraging variety)
  if ((hasFirstAssignment1 && !hasSecondAssignment1) || (!hasFirstAssignment1 && hasSecondAssignment1)) score += 50;
  if ((hasFirstAssignment2 && !hasSecondAssignment2) || (!hasFirstAssignment2 && hasSecondAssignment2)) score += 50;
  
  // CORE RULE 7: Partnership variety - encourage new pairings
  // Check if these sisters have been paired together before
  const partnerships1 = historical1.partnerships || [];
  const partnerships2 = historical2.partnerships || [];
  
  if (partnerships1.includes(sister2)) {
    // These sisters have been paired before - give a moderate penalty
    // This is a soft preference, not a hard constraint
    score -= 30;
    console.log(`⚖️ Partnership variety: ${sister1} and ${sister2} have been paired before (-30 points)`);
  } else {
    // These sisters have never been paired - give a bonus
    score += 20;
    console.log(`✨ Partnership variety: ${sister1} and ${sister2} are a new pairing (+20 points)`);
  }
  
  return score;
};

// NEW: Per-point sister pair finder with schedule constraints
// This enforces "no sister is student more than once per schedule" and uses per-point rotation
const findNextAvailableSisterPairForPoint = (
  list, 
  weekAssignments, 
  pointRotation, 
  scheduleStudentTracker, 
  scheduleAssistantTracker, 
  currentWeek, 
  historicalData = {},
  sisterLastRoles = {} // NEW: Last roles from previous schedule for alternation
) => {
  console.log(`🔍 Finding pair for point with ${scheduleStudentTracker.size} sisters already students this schedule`);
  
  // Find all available people (not assigned this week)
  const availableSisters = list.filter(name => !weekAssignments[name]);
  
  if (availableSisters.length < 2) {
    console.warn(`⚠️ Only ${availableSisters.length} sisters available, using fallback assignment`);
    // Fallback: use any two sisters
    const idx1 = pointRotation.rotationIndex % list.length;
    const idx2 = (pointRotation.rotationIndex + 1) % list.length;
    return {
      names: [list[idx1], list[idx2]],
      nextIndex: (pointRotation.rotationIndex + 2) % list.length
    };
  }
  
  // Helper function to get total appearances for a sister this schedule
  const getTotalAppearances = (name) => {
    let count = 0;
    if (scheduleStudentTracker.has(name)) count++;
    if (scheduleAssistantTracker.has(name)) count++;
    return count;
  };
  
  // PRIORITY 1: Sisters who haven't appeared at all this schedule (can be student or assistant)
  const neverAssignedThisSchedule = availableSisters.filter(name => 
    getTotalAppearances(name) === 0
  );
  
  // PRIORITY 2: Sisters who have been assistant but NEVER student this schedule (can be student)
  const assistantOnlyThisSchedule = availableSisters.filter(name => 
    !scheduleStudentTracker.has(name) && scheduleAssistantTracker.has(name)
  );
  
  // PRIORITY 3: Sisters who have been student but never assistant this schedule (can only be assistant)
  const studentOnlyThisSchedule = availableSisters.filter(name => 
    scheduleStudentTracker.has(name) && !scheduleAssistantTracker.has(name)
  );
  
  // CONSTRAINT CHECK: Remove sisters who would violate the rules
  const canBeStudent = (name) => {
    // Rule 1: Max 1 student role per schedule
    if (scheduleStudentTracker.has(name)) return false;
    
    // Rule 2: STRICT alternation - cannot be student if was student last schedule
    const lastRole = sisterLastRoles[name];
    if (lastRole === 'student') {
      console.log(`🚫 ${name} cannot be student - was student last schedule (alternation rule)`);
      return false;
    }
    
    return true;
  };
  
  const canBeAssistant = (name) => {
    // Rule 1: Max 1 assistant role per schedule  
    if (scheduleAssistantTracker.has(name)) return false;
    
    // Rule 2: STRICT alternation - cannot be assistant if was assistant last schedule
    const lastRole = sisterLastRoles[name];
    if (lastRole === 'assistant') {
      console.log(`🚫 ${name} cannot be assistant - was assistant last schedule (alternation rule)`);
      return false;
    }
    
    return true;
  };
  
  // Filter each group to only include sisters who can still be assigned
  const validNeverAssigned = neverAssignedThisSchedule.filter(name => canBeStudent(name) && canBeAssistant(name));
  const validAssistantOnly = assistantOnlyThisSchedule.filter(name => canBeStudent(name)); // Already assistant, can only be student
  const validStudentOnly = studentOnlyThisSchedule.filter(name => canBeAssistant(name)); // Already student, can only be assistant
  
  console.log(`📊 Available categories: Never assigned: ${validNeverAssigned.length}, Assistant-only: ${validAssistantOnly.length}, Student-only: ${validStudentOnly.length}`);
  
  let bestPair = null;
  let bestScore = -1;
  
  // Function to try pairs from two groups
  const tryPairCombination = (group1, group2, group1CanBeStudent, group2CanBeStudent) => {
    for (let i = 0; i < group1.length; i++) {
      for (let j = 0; j < group2.length; j++) {
        if (group1 === group2 && i >= j) continue; // Avoid duplicates within same group
        
        const sister1 = group1[i];
        const sister2 = group2[j];
        const pairKey = [sister1, sister2].sort().join('|');
        
        // Skip if this pair was already used in this point
        if (pointRotation.usedPairs.has(pairKey)) {
          console.log(`⚠️ Skipping pair ${sister1}/${sister2} - already used in this point`);
          continue;
        }
        
        // CRITICAL: PRE-CHECK CONSTRAINTS before considering this pair
        // Check if assigning roles would violate per-schedule constraints
        const sister1CanBeStudent = group1CanBeStudent && canBeStudent(sister1);
        const sister2CanBeStudent = group2CanBeStudent && canBeStudent(sister2);
        const sister1CanBeAssistant = canBeAssistant(sister1);
        const sister2CanBeAssistant = canBeAssistant(sister2);
        
        // Skip pairs where nobody can be student
        if (!sister1CanBeStudent && !sister2CanBeStudent) {
          console.log(`⚠️ Skipping pair ${sister1}/${sister2} - neither can be student`);
          continue;
        }
        
        // Skip pairs where we can't assign assistant role
        if (!sister1CanBeAssistant && !sister2CanBeAssistant) {
          console.log(`⚠️ Skipping pair ${sister1}/${sister2} - neither can be assistant`);
          continue;
        }
        
        // CONSTRAINT COMPLIANCE: This pair is valid, calculate score
        const score = calculatePointPairScore(
          sister1, sister2, pointRotation, scheduleStudentTracker, 
          scheduleAssistantTracker, currentWeek, historicalData, sisterLastRoles
        );
        
        if (score > bestScore) {
          bestScore = score;
          
          // NEW: Determine optimal order based on alternation rule first, then other factors
          const lastRole1 = sisterLastRoles[sister1];
          const lastRole2 = sisterLastRoles[sister2];
          const isAssistantOnly1 = scheduleAssistantTracker.has(sister1) && !scheduleStudentTracker.has(sister1);
          const isAssistantOnly2 = scheduleAssistantTracker.has(sister2) && !scheduleStudentTracker.has(sister2);
          
          if (sister1CanBeStudent && sister2CanBeStudent) {
            // Both can be student - apply priority rules in order:
            
            // 1. HIGHEST PRIORITY: Cross-schedule alternation
            if (lastRole1 === 'assistant' && lastRole2 !== 'assistant') {
              bestPair = [sister1, sister2]; // Sister1 was assistant → becomes student
            } else if (lastRole2 === 'assistant' && lastRole1 !== 'assistant') {
              bestPair = [sister2, sister1]; // Sister2 was assistant → becomes student
            } else if (lastRole1 === 'student' && lastRole2 !== 'student') {
              bestPair = [sister2, sister1]; // Sister1 was student → becomes assistant, Sister2 becomes student
            } else if (lastRole2 === 'student' && lastRole1 !== 'student') {
              bestPair = [sister1, sister2]; // Sister2 was student → becomes assistant, Sister1 becomes student
              
            // 2. SECOND PRIORITY: Assistant-only sisters become students (per-schedule balance)
            } else if (isAssistantOnly1 && !isAssistantOnly2) {
              bestPair = [sister1, sister2]; // Assistant-only becomes student
            } else if (isAssistantOnly2 && !isAssistantOnly1) {
              bestPair = [sister2, sister1]; // Assistant-only becomes student
              
            // 3. DEFAULT: Keep original order
            } else {
              bestPair = [sister1, sister2];
            }
          } else if (sister1CanBeStudent) {
            bestPair = [sister1, sister2]; // Sister1 becomes student
          } else {
            bestPair = [sister2, sister1]; // Sister2 becomes student
          }
          
          console.log(`✅ Valid pair found: ${bestPair[0]} (student) / ${bestPair[1]} (assistant) - score: ${score}`);
        }
      }
    }
  };
  
  // Try combinations in priority order
  // 1. Never assigned + Never assigned (both can be student)
  if (validNeverAssigned.length >= 2) {
    tryPairCombination(validNeverAssigned, validNeverAssigned, true, true);
  }
  
  // 2. Never assigned + Assistant-only (both can be student, but assistant-only gets priority)
  if (validNeverAssigned.length >= 1 && validAssistantOnly.length >= 1) {
    tryPairCombination(validAssistantOnly, validNeverAssigned, true, true);
  }
  
  // 3. Assistant-only + Assistant-only (both can be student)
  if (!bestPair && validAssistantOnly.length >= 2) {
    tryPairCombination(validAssistantOnly, validAssistantOnly, true, true);
  }
  
  // 4. Never assigned + Student-only (never assigned becomes student, student-only becomes assistant)
  if (!bestPair && validNeverAssigned.length >= 1 && validStudentOnly.length >= 1) {
    tryPairCombination(validNeverAssigned, validStudentOnly, true, false);
  }
  
  // 5. Assistant-only + Student-only (assistant-only becomes student, student-only becomes assistant)
  if (!bestPair && validAssistantOnly.length >= 1 && validStudentOnly.length >= 1) {
    tryPairCombination(validAssistantOnly, validStudentOnly, true, false);
  }
  
  // 6. Last resort: Student-only + Student-only (both already students - VIOLATION but emergency)
  if (!bestPair && validStudentOnly.length >= 2) {
    console.warn(`⚠️ CONSTRAINT VIOLATION: Using emergency pairing - both sisters already students this schedule`);
    tryPairCombination(validStudentOnly, validStudentOnly, false, false);
  }
  
  // Final fallback: use any available pair
  if (!bestPair && availableSisters.length >= 2) {
    console.warn(`⚠️ Using final fallback pairing`);
    bestPair = [availableSisters[0], availableSisters[1]];
  }
  
  // If still no pair, use rotation-based assignment (should never happen)
  if (!bestPair) {
    console.error(`🚨 No pair found - using rotation fallback`);
    const idx1 = pointRotation.rotationIndex % list.length;
    const idx2 = (pointRotation.rotationIndex + 1) % list.length;
    bestPair = [list[idx1], list[idx2]];
  }
  
  // Update rotation index for this point
  const nextIndex = (pointRotation.rotationIndex + 2) % list.length;
  pointRotation.rotationIndex = nextIndex;
  
  return {
    names: bestPair,
    nextIndex: nextIndex
  };
};

// Helper function to calculate pair score for a specific point
const calculatePointPairScore = (
  sister1, 
  sister2, 
  pointRotation, 
  scheduleStudentTracker, 
  scheduleAssistantTracker, 
  currentWeek, 
  historicalData = {},
  sisterLastRoles = {} // NEW: Last roles from previous schedule for alternation
) => {
  let score = 100;
  
  const pointRoles1 = pointRotation.sisterRoles[sister1] || { student: 0, assistant: 0, lastWeek: -999 };
  const pointRoles2 = pointRotation.sisterRoles[sister2] || { student: 0, assistant: 0, lastWeek: -999 };
  
  // Helper to get total appearances
  const getTotalAppearances = (name) => {
    let count = 0;
    if (scheduleStudentTracker.has(name)) count++;
    if (scheduleAssistantTracker.has(name)) count++;
    return count;
  };
  
  // CRITICAL: Hard constraint checks - if ANY constraint would be violated, return very low score
  // Check max 1 student per schedule constraint
  const alreadyStudent1 = scheduleStudentTracker.has(sister1);
  const alreadyStudent2 = scheduleStudentTracker.has(sister2);
  
  // Check max 1 assistant per schedule constraint  
  const alreadyAssistant1 = scheduleAssistantTracker.has(sister1);
  const alreadyAssistant2 = scheduleAssistantTracker.has(sister2);
  
  if (alreadyStudent1 && alreadyStudent2) {
    console.log(`🚨 CONSTRAINT VIOLATION in scoring: Both ${sister1} and ${sister2} are already students`);
    return -10000; // Very low score to prevent this pair
  }
  
  if (alreadyAssistant1 && alreadyAssistant2) {
    console.log(`🚨 CONSTRAINT VIOLATION in scoring: Both ${sister1} and ${sister2} are already assistants`);
    return -10000; // Very low score to prevent this pair
  }
  
  // NEW: CORE RULE 0: Cross-schedule alternation - HIGHEST PRIORITY
  // Sisters who must alternate roles from previous schedule get massive bonus
  const lastRole1 = sisterLastRoles[sister1];
  const lastRole2 = sisterLastRoles[sister2];
  const canBeStudent1 = !alreadyStudent1;
  const canBeStudent2 = !alreadyStudent2;
  
  // If sister1 was student last time and can be assistant this time: HUGE bonus
  if (lastRole1 === 'student' && !alreadyAssistant1) {
    score += 3000; // Must become assistant to alternate
    console.log(`🔄 ${sister1} was student last schedule → +3000 bonus to be assistant`);
  }
  // If sister1 was assistant last time and can be student this time: HUGE bonus  
  if (lastRole1 === 'assistant' && canBeStudent1) {
    score += 3000; // Must become student to alternate
    console.log(`🔄 ${sister1} was assistant last schedule → +3000 bonus to be student`);
  }
  
  // Same for sister2
  if (lastRole2 === 'student' && !alreadyAssistant2) {
    score += 3000; // Must become assistant to alternate
    console.log(`🔄 ${sister2} was student last schedule → +3000 bonus to be assistant`);
  }
  if (lastRole2 === 'assistant' && canBeStudent2) {
    score += 3000; // Must become student to alternate
    console.log(`🔄 ${sister2} was assistant last schedule → +3000 bonus to be student`);
  }
  
  // PENALTY: Sisters getting same role twice in a row (violates alternation)
  if (lastRole1 === 'student' && canBeStudent1 && !canBeStudent2) {
    score -= 2000; // Would make sister1 student again
    console.log(`⚠️ ${sister1} would be student twice in a row → -2000 penalty`);
  }
  if (lastRole1 === 'assistant' && !canBeStudent1) {
    score -= 2000; // Would make sister1 assistant again
    console.log(`⚠️ ${sister1} would be assistant twice in a row → -2000 penalty`);
  }
  if (lastRole2 === 'student' && canBeStudent2 && !canBeStudent1) {
    score -= 2000; // Would make sister2 student again
    console.log(`⚠️ ${sister2} would be student twice in a row → -2000 penalty`);
  }
  if (lastRole2 === 'assistant' && !canBeStudent2) {
    score -= 2000; // Would make sister2 assistant again
    console.log(`⚠️ ${sister2} would be assistant twice in a row → -2000 penalty`);
  }
  
  // CORE RULE 1: MASSIVE bonus for constraint compliance
  // Sisters who haven't appeared at all this schedule get highest priority
  const appearances1 = getTotalAppearances(sister1);
  const appearances2 = getTotalAppearances(sister2);
  if (appearances1 === 0) score += 2000; // Never appeared this schedule
  if (appearances2 === 0) score += 2000;
  
  // CORE RULE 2: Heavy bonus for sisters who were assistants but never students this schedule
  if (canBeStudent1 && alreadyAssistant1) score += 1500; // Assistant-only, can become student
  if (canBeStudent2 && alreadyAssistant2) score += 1500;
  
  // CORE RULE 3: Ensure we can still assign both roles
  if (!canBeStudent1 && !canBeStudent2) score -= 5000; // Both already students - major penalty
  
  // CORE RULE 4: Point-specific role balance (lower weight than constraints)
  const pointBalance1 = pointRoles1.assistant - pointRoles1.student;
  const pointBalance2 = pointRoles2.assistant - pointRoles2.student;
  
  // Prefer sisters who need to be students in this specific point
  if (pointBalance1 > 0 && canBeStudent1) score += pointBalance1 * 50;
  if (pointBalance2 > 0 && canBeStudent2) score += pointBalance2 * 50;
  
  // CORE RULE 5: Spacing within this point (lower weight)
  const spacing1 = currentWeek - pointRoles1.lastWeek;
  const spacing2 = currentWeek - pointRoles2.lastWeek;
  score += Math.min(spacing1, spacing2) * 10;
  
  // CORE RULE 6: Historical balance (lowest weight since constraints are most important)
  const historical1 = historicalData[sister1] || { total: 0, firstPosition: 0, secondPosition: 0 };
  const historical2 = historicalData[sister2] || { total: 0, firstPosition: 0, secondPosition: 0 };
  
  const historicalBalance1 = historical1.secondPosition - historical1.firstPosition;
  const historicalBalance2 = historical2.secondPosition - historical2.firstPosition;
  
  if (historicalBalance1 > 0 && canBeStudent1) score += historicalBalance1 * 25;
  if (historicalBalance2 > 0 && canBeStudent2) score += historicalBalance2 * 25;
  
  return score;
};

// Helper function to determine optimal order for a pair
const getOptimalPairOrder = (pair, positionTracking, currentWeek, historicalData = {}) => {
  const [sister1, sister2] = pair;
  const track1 = positionTracking[sister1] || { firstPositions: [], secondPositions: [], totalAssignments: 0, historicalData: { total: 0, sisterPairs: 0, firstPosition: 0, secondPosition: 0 } };
  const track2 = positionTracking[sister2] || { firstPositions: [], secondPositions: [], totalAssignments: 0, historicalData: { total: 0, sisterPairs: 0, firstPosition: 0, secondPosition: 0 } };
  
  // Use actual historical data if available, otherwise fall back to tracking data
  const historical1 = historicalData[sister1] || track1.historicalData || { total: 0, sisterPairs: 0, firstPosition: 0, secondPosition: 0, partnerships: [] };
  const historical2 = historicalData[sister2] || track2.historicalData || { total: 0, sisterPairs: 0, firstPosition: 0, secondPosition: 0, partnerships: [] };
  
  // Calculate combined balance scores (current session + historical)
  const totalFirst1 = track1.firstPositions.length + historical1.firstPosition;
  const totalSecond1 = track1.secondPositions.length + historical1.secondPosition;
  const totalFirst2 = track2.firstPositions.length + historical2.firstPosition;
  const totalSecond2 = track2.secondPositions.length + historical2.secondPosition;
  
  const balance1 = totalSecond1 - totalFirst1; // negative = more student, positive = more assistant
  const balance2 = totalSecond2 - totalFirst2;
  
  // CORE RULE 1: Sisters who have NEVER been students get absolute priority
  const hasNeverBeenStudent1 = totalFirst1 === 0;
  const hasNeverBeenStudent2 = totalFirst2 === 0;
  const hasNeverBeenAssistant1 = totalSecond1 === 0;
  const hasNeverBeenAssistant2 = totalSecond2 === 0;
  
  // Perfect match: one never student, other never assistant
  if (hasNeverBeenStudent1 && hasNeverBeenAssistant2) return [sister1, sister2];
  if (hasNeverBeenStudent2 && hasNeverBeenAssistant1) return [sister2, sister1];
  
  // If one has never been student, she gets priority for student position
  if (hasNeverBeenStudent1 && !hasNeverBeenStudent2) return [sister1, sister2];
  if (hasNeverBeenStudent2 && !hasNeverBeenStudent1) return [sister2, sister1];
  
  // If one has never been assistant, she gets priority for assistant position
  if (hasNeverBeenAssistant1 && !hasNeverBeenAssistant2) return [sister2, sister1];
  if (hasNeverBeenAssistant2 && !hasNeverBeenAssistant1) return [sister1, sister2];
  
  // CORE RULE 2: Current session rotation rule
  // If a sister was student in current session, she should be assistant next (if possible)
  const wasStudentThisSession1 = track1.firstPositions.length > 0;
  const wasAssistantThisSession1 = track1.secondPositions.length > 0;
  const wasStudentThisSession2 = track2.firstPositions.length > 0;
  const wasAssistantThisSession2 = track2.secondPositions.length > 0;
  
  // If one was student this session but not assistant, prefer her as assistant
  if (wasStudentThisSession1 && !wasAssistantThisSession1 && !(wasStudentThisSession2 && !wasAssistantThisSession2)) {
    return [sister2, sister1]; // sister1 as assistant
  }
  if (wasStudentThisSession2 && !wasAssistantThisSession2 && !(wasStudentThisSession1 && !wasAssistantThisSession1)) {
    return [sister1, sister2]; // sister2 as assistant
  }
  
  // CORE RULE 3: Natural spacing preference - consider recent assignments for better distribution
  const getLastAssignmentWeek = (firstPositions, secondPositions) => {
    const allPositions = [...firstPositions, ...secondPositions];
    return allPositions.length > 0 ? Math.max(...allPositions) : -999;
  };
  
  const lastAssignment1 = getLastAssignmentWeek(track1.firstPositions, track1.secondPositions);
  const lastAssignment2 = getLastAssignmentWeek(track2.firstPositions, track2.secondPositions);
  
  const spacing1 = currentWeek - lastAssignment1;
  const spacing2 = currentWeek - lastAssignment2;
  
  // Prefer sister with better spacing (natural rotation)
  if (Math.abs(spacing1 - spacing2) > 2) {
    return spacing1 >= spacing2 ? [sister1, sister2] : [sister2, sister1];
  }
  
  // CORE RULE 4: Historical balance - PRIORITY: Recent position-based rotation
  // If a sister was primarily assistant in historical data, she should be student now
  const recentlyAssistant1 = historical1.secondPosition > historical1.firstPosition;
  const recentlyAssistant2 = historical2.secondPosition > historical2.firstPosition;
  
  // Debug log the decision with comprehensive details
  console.log(`\n📋 DETAILED POSITION DECISION for ${sister1} vs ${sister2}:`);
  console.log(`${sister1}: Historical (${historical1.firstPosition}S/${historical1.secondPosition}A), Current (${track1.firstPositions.length}S/${track1.secondPositions.length}A), Balance: ${balance1}`);
  console.log(`${sister2}: Historical (${historical2.firstPosition}S/${historical2.secondPosition}A), Current (${track2.firstPositions.length}S/${track2.secondPositions.length}A), Balance: ${balance2}`);
  console.log(`${sister1} Recently Assistant: ${recentlyAssistant1} (${historical1.secondPosition} > ${historical1.firstPosition})`);
  console.log(`${sister2} Recently Assistant: ${recentlyAssistant2} (${historical2.secondPosition} > ${historical2.firstPosition})`);
  
  // STRONGEST RULE: If one sister was predominantly assistant, she should be student now
  if (recentlyAssistant1 && !recentlyAssistant2) {
    console.log(`🎯 DECISION: ${sister1} was predominantly assistant (${historical1.secondPosition}A > ${historical1.firstPosition}S), making her student now`);
    return [sister1, sister2];
  }
  if (recentlyAssistant2 && !recentlyAssistant1) {
    console.log(`🎯 DECISION: ${sister2} was predominantly assistant (${historical2.secondPosition}A > ${historical2.firstPosition}S), making her student now`);
    return [sister2, sister1];
  }
  
  // Both were equally assistant/student historically, or both were predominantly one role
  if (recentlyAssistant1 && recentlyAssistant2) {
    console.log(`ℹ️ Both sisters were predominantly assistants historically, implementing rotation logic`);
    // When both were assistants, BOTH should get a chance to be students
    // Use alternating logic based on their names or other consistent criteria
    
    // Prefer sister who has never been student at all
    if (totalFirst1 === 0 && totalFirst2 > 0) {
      console.log(`🎯 DECISION: ${sister1} has never been student (${totalFirst1}S vs ${totalFirst2}S), making her student now`);
      return [sister1, sister2];
    }
    if (totalFirst2 === 0 && totalFirst1 > 0) {
      console.log(`🎯 DECISION: ${sister2} has never been student (${totalFirst2}S vs ${totalFirst1}S), making her student now`);
      return [sister2, sister1];
    }
    
    // If both have been students before or neither has, prefer the one with fewer total student experiences
    if (totalFirst1 !== totalFirst2) {
      const result = totalFirst1 < totalFirst2 ? [sister1, sister2] : [sister2, sister1];
      console.log(`🎯 DECISION: ${result[0]} has fewer student experiences (${totalFirst1}S vs ${totalFirst2}S), making her student now`);
      return result;
    }
    
    // If equal student experiences, prefer the one with more assistant experiences (stronger rotation need)
    if (totalSecond1 !== totalSecond2) {
      const result = totalSecond1 > totalSecond2 ? [sister1, sister2] : [sister2, sister1];
      console.log(`🎯 DECISION: ${result[0]} has more assistant experiences (${totalSecond1}A vs ${totalSecond2}A), making her student now`);
      return result;
    }
    
    // If everything is equal, use alternating logic based on current week to ensure both get student turns
    // This ensures that when both were assistants, they both get fair student opportunities
    const alternatingChoice = currentWeek % 2 === 0 ? 
      (sister1.localeCompare(sister2) < 0 ? [sister1, sister2] : [sister2, sister1]) :
      (sister1.localeCompare(sister2) < 0 ? [sister2, sister1] : [sister1, sister2]);
    console.log(`🎯 DECISION: Both equal assistant history, using alternating rotation (week ${currentWeek}): ${alternatingChoice[0]} (student) / ${alternatingChoice[1]} (assistant)`);
    return alternatingChoice;
    
  } else if (!recentlyAssistant1 && !recentlyAssistant2) {
    console.log(`ℹ️ Both sisters were predominantly students historically, using detailed balance comparison`);
    // When both were students, prefer the one who needs more assistant experience
    
    // Prefer sister who has never been assistant at all
    if (totalSecond1 === 0 && totalSecond2 > 0) {
      console.log(`🎯 DECISION: ${sister1} has never been assistant (${totalSecond1}A vs ${totalSecond2}A), making her assistant now`);
      return [sister2, sister1];
    }
    if (totalSecond2 === 0 && totalSecond1 > 0) {
      console.log(`🎯 DECISION: ${sister2} has never been assistant (${totalSecond2}A vs ${totalSecond1}A), making her assistant now`);
      return [sister1, sister2];
    }
    
    // Prefer the one with fewer assistant experiences
    if (totalSecond1 !== totalSecond2) {
      const result = totalSecond1 < totalSecond2 ? [sister2, sister1] : [sister1, sister2];
      console.log(`🎯 DECISION: ${result[1]} has fewer assistant experiences (${totalSecond1}A vs ${totalSecond2}A), making her assistant now`);
      return result;
    }
  }
  
  // If both or neither were predominantly assistants, use balance calculation
  if (Math.abs(balance1 - balance2) > 0) { // Any difference matters
    // Sister with more positive balance (more assistant assignments) should be student now
    const result = balance1 > balance2 ? [sister1, sister2] : [sister2, sister1];
    console.log(`🎯 DECISION: Using balance rule (${balance1} vs ${balance2}): ${result[0]} (student) / ${result[1]} (assistant)`);
    console.log(`  - ${sister1} total: ${totalFirst1}S + ${totalSecond1}A = balance ${balance1}`);
    console.log(`  - ${sister2} total: ${totalFirst2}S + ${totalSecond2}A = balance ${balance2}`);
    return result;
  }
  
  // CORE RULE 5: Consider recent position usage for better spacing
  const recentFirst1 = track1.firstPositions.length > 0 ? currentWeek - Math.max(...track1.firstPositions) : 999;
  const recentSecond1 = track1.secondPositions.length > 0 ? currentWeek - Math.max(...track1.secondPositions) : 999;
  const recentFirst2 = track2.firstPositions.length > 0 ? currentWeek - Math.max(...track2.firstPositions) : 999;
  const recentSecond2 = track2.secondPositions.length > 0 ? currentWeek - Math.max(...track2.secondPositions) : 999;
  
  // Prefer putting sister first if she hasn't been first recently
  if (Math.abs(recentFirst1 - recentFirst2) > 2) {
    return recentFirst1 > recentFirst2 ? [sister1, sister2] : [sister2, sister1];
  }
  
  // CORE RULE 6: Final tiebreaker - prefer sister with fewer total assignments first
  const totalAssignments1 = track1.totalAssignments + historical1.total;
  const totalAssignments2 = track2.totalAssignments + historical2.total;
  
  if (totalAssignments1 !== totalAssignments2) {
    return totalAssignments1 < totalAssignments2 ? [sister1, sister2] : [sister2, sister1];
  }
  
  // Ultimate fallback: alphabetical order for consistency
  console.log(`🎯 DECISION: All criteria equal, using alphabetical order: ${sister1.localeCompare(sister2) < 0 ? [sister1, sister2] : [sister2, sister1]}`);
  return sister1.localeCompare(sister2) < 0 ? [sister1, sister2] : [sister2, sister1];
};

// Keep the original function for backward compatibility
const findNextAvailableSisterPair = (list, weekAssignments, startIndex, usedPairs) => {
  const availableIndices = [];
  
  // Find all available people (not assigned this week)
  list.forEach((name, index) => {
    if (!weekAssignments[name]) {
      availableIndices.push(index);
    }
  });
  
  // If we need at least 2 people for a pair
  if (availableIndices.length < 2) {
    // Fall back to just using the next two in rotation
    const idx1 = startIndex % list.length;
    const idx2 = (startIndex + 1) % list.length;
    return {
      names: [list[idx1], list[idx2]],
      nextIndex: (startIndex + 2) % list.length
    };
  }
  
  // Try to find a pair starting from the current rotation index
  let currentIdx = startIndex;
  let found = false;
  let pair = [];
  let attempts = 0;
  
  while (!found && attempts < list.length) {
    const person1 = list[currentIdx % list.length];
    
    if (!weekAssignments[person1]) {
      // Find a partner for person1
      for (let i = 1; i < list.length; i++) {
        const partnerIdx = (currentIdx + i) % list.length;
        const person2 = list[partnerIdx];
        
        if (!weekAssignments[person2] && person1 !== person2) {
          const pairKey = [person1, person2].sort().join('|');
          
          // Prefer pairs that haven't been used together
          if (!usedPairs.has(pairKey) || availableIndices.length <= 2) {
            pair = [person1, person2];
            found = true;
            break;
          }
        }
      }
    }
    
    if (!found) {
      currentIdx = (currentIdx + 1) % list.length;
      attempts++;
    }
  }
  
  // If no unused pair found, just take the next two available
  if (!found && availableIndices.length >= 2) {
    const idx1 = availableIndices[0];
    const idx2 = availableIndices[1];
    pair = [list[idx1], list[idx2]];
  }
  
  // Calculate next index (advance by 2 for pairs)
  const nextIndex = (startIndex + 2) % list.length;
  
  return {
    names: pair,
    nextIndex: nextIndex
  };
};

  // Enhanced helper function to find next available with conflict checking
  const findNextAvailableWithConflictCheck = (list, weekAssignments, allAssignments, lastUsed, currentList) => {
    // Filter out people already assigned this week
    const available = list.filter(name => !weekAssignments[name]);
    
    if (available.length === 0) {
      // If everyone is assigned this week, fall back to the full list
      return findNextAvailable(list, {}, allAssignments, lastUsed);
    }

    // Sort by assignment count (least assigned first), then by list-specific rotation
    const sorted = available.sort((a, b) => {
      const countA = allAssignments[a]?.length || 0;
      const countB = allAssignments[b]?.length || 0;
      
      if (countA !== countB) {
        return countA - countB; // Least assigned first
      }
      
      // Check list-specific assignment counts for better rotation within each list
      const listCountA = allAssignments[a]?.filter(assignment => assignment.list === currentList)?.length || 0;
      const listCountB = allAssignments[b]?.filter(assignment => assignment.list === currentList)?.length || 0;
      
      if (listCountA !== listCountB) {
        return listCountA - listCountB; // Least assigned to this specific list first
      }
      
      // If same assignment count, prefer someone who wasn't used last time for this list
      if (lastUsed) {
        if (a === lastUsed && b !== lastUsed) return 1;
        if (b === lastUsed && a !== lastUsed) return -1;
      }
      
      // Finally, sort alphabetically for consistency
      return a.localeCompare(b);
    });

    return sorted[0];
  };

  // Helper function to process regular (non-MWANDU) items
  const processRegularItem = (item, weekAssignments, assignments, lastAssignments, sisterPairs) => {
    if (item.participantList && participantLists[item.participantList]) {
      const list = participantLists[item.participantList].participants;
      let assigned = '';

      if (item.isDouble) {
        // Handle sister pairs
        let pair = findSisterPair(list, weekAssignments, sisterPairs, assignments);
        assigned = pair.join(' / ');
        pair.forEach(name => {
          weekAssignments[name] = true;
          assignments[name].push({ week: Date.now(), type: 'assignment', count: assignments[name].length });
        });
        sisterPairs.add(pair.sort().join('|'));
      } else {
        // Single assignment with list-specific tracking
        const listKey = `${item.participantList}_last`;
        const name = findNextAvailable(list, weekAssignments, assignments, lastAssignments[listKey]);
        assigned = name;
        weekAssignments[name] = true;
        assignments[name].push({ week: Date.now(), type: 'assignment', list: item.participantList, count: assignments[name].length });
        lastAssignments[listKey] = name;
      }

      item.assignedName = assigned;
      
      // Handle secondary assignment (for Puonjruok)
      if (item.secondaryList && participantLists[item.secondaryList]) {
        const listKey = `${item.secondaryList}_last`;
        const secondaryName = findNextAvailable(
          participantLists[item.secondaryList].participants, 
          weekAssignments, 
          assignments, 
          lastAssignments[listKey]
        );
        item.assignedSecondary = secondaryName;
        weekAssignments[secondaryName] = true;
        assignments[secondaryName].push({ week: Date.now(), type: 'secondary', list: item.secondaryList, count: assignments[secondaryName].length });
        lastAssignments[listKey] = secondaryName;
      }
    }
  };

  // Helper function to find next available person
  const findNextAvailable = (list, weekAssignments, allAssignments, lastUsed) => {
    // Filter out people already assigned this week
    const available = list.filter(name => !weekAssignments[name]);
    
    if (available.length === 0) {
      // If everyone is assigned this week, fall back to the full list
      return list[0];
    }

    // Sort by assignment count (least assigned first), then alphabetically for consistency
    const sorted = available.sort((a, b) => {
      const countA = allAssignments[a]?.length || 0;
      const countB = allAssignments[b]?.length || 0;
      
      if (countA !== countB) {
        return countA - countB; // Least assigned first
      }
      
      // If same assignment count, prefer someone who wasn't used last time
      if (lastUsed) {
        if (a === lastUsed && b !== lastUsed) return 1;
        if (b === lastUsed && a !== lastUsed) return -1;
      }
      
      // Finally, sort alphabetically for consistency
      return a.localeCompare(b);
    });

    return sorted[0];
  };

  // Helper function to find sister pairs
  const findSisterPair = (list, weekAssignments, usedPairs, allAssignments) => {
    const available = list.filter(name => !weekAssignments[name]);
    
    if (available.length < 2) {
      // Not enough available people, fall back to least assigned
      const sorted = list.sort((a, b) => {
        const countA = allAssignments[a]?.length || 0;
        const countB = allAssignments[b]?.length || 0;
        return countA - countB;
      });
      return sorted.slice(0, 2);
    }

    // Sort available people by assignment count (least assigned first)
    const sortedAvailable = available.sort((a, b) => {
      const countA = allAssignments[a]?.length || 0;
      const countB = allAssignments[b]?.length || 0;
      if (countA !== countB) return countA - countB;
      return a.localeCompare(b); // Alphabetical for consistency
    });

    // Try to find a pair that hasn't been used together before
    for (let i = 0; i < sortedAvailable.length - 1; i++) {
      for (let j = i + 1; j < sortedAvailable.length; j++) {
        const pairKey = [sortedAvailable[i], sortedAvailable[j]].sort().join('|');
        if (!usedPairs.has(pairKey)) {
          return [sortedAvailable[i], sortedAvailable[j]];
        }
      }
    }

    // If all pairs have been used, pick the two with least assignments
    return sortedAvailable.slice(0, 2);
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // File Upload and Processing (PDF and EPUB)
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    // Check if it's a supported file type
    if (fileType !== 'application/pdf' && !fileName.endsWith('.epub')) {
      showAlert('Please select a valid PDF or EPUB file.', 'warning', 'Invalid File Type');
      return;
    }

    setProcessingPdf(true);
    
    try {
      let newWeeks = [];

      if (fileType === 'application/pdf') {
        // Handle PDF import (existing functionality)
        const base64 = await fileToBase64(file);
        
        const response = await fetch('https://aibot3.fly.dev/process-schedule-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pdf_data: base64,
            filename: file.name
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to process PDF');
        }

        const scheduleData = await response.json();
        console.log('Raw PDF API response:', scheduleData);
        
        if (!scheduleData.success) {
          throw new Error(scheduleData.error || 'API returned success: false');
        }
        
        if (!scheduleData.weeks || !Array.isArray(scheduleData.weeks)) {
          throw new Error('Invalid response format: weeks array missing');
        }
        
        // Check if any weeks have errors
        const weekErrors = scheduleData.weeks.filter(week => week.error);
        if (weekErrors.length > 0) {
          console.error('Week processing errors:', weekErrors);
          throw new Error(`Processing errors: ${weekErrors.map(w => w.error).join(', ')}`);
        }
        
        // Convert the AI response to your app's format
        newWeeks = processScheduleFromAI({ weeks: scheduleData.weeks });

      } else if (fileName.endsWith('.epub')) {
        // Handle EPUB import (new functionality)
        console.log('Processing EPUB file:', file.name);
        
        const epubResult = await parseEpubFile(file);
        
        if (!epubResult.success) {
          throw new Error(epubResult.error || 'Failed to parse EPUB file');
        }

        console.log('EPUB parsing result:', epubResult);
        newWeeks = epubResult.weeks || [];
      }

      console.log('Processed weeks:', newWeeks);
      
      if (newWeeks.length === 0) {
        const fileTypeText = fileName.endsWith('.epub') ? 'EPUB' : 'PDF';
        throw new Error(`No weeks were extracted from the ${fileTypeText}. Please check the file format.`);
      }
      
      // Replace current weeks with the new ones
      setWeeks(newWeeks);
      markAsChanged();
      
      const fileTypeText = fileName.endsWith('.epub') ? 'EPUB' : 'PDF';
      showToast(`Successfully imported ${newWeeks.length} weeks from ${fileTypeText}! You can now use "Auto Assign" to assign participants.`, 'success');
      
    } catch (error) {
      console.error('Error processing file:', error);
      showAlert('Error processing file: ' + error.message, 'error', 'Import Error');
    } finally {
      setProcessingPdf(false);
      // Reset the file input
      event.target.value = '';
    }
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]; // Remove data:application/pdf;base64, prefix
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  // Process AI response and convert to app format
  const processScheduleFromAI = (aiResponse) => {
    const weeks = [];
    
    if (aiResponse.weeks && Array.isArray(aiResponse.weeks)) {
      aiResponse.weeks.forEach((weekData, index) => {
        const week = {
          id: Date.now() + index,
          title: weekData.title || `NGECHE ${index + 1}`,
          dateRange: weekData.dateRange || '',
          chairman: weekData.chairman || '',
          openingSong: weekData.openingSong || '',
          openingPrayer: '',
          closingSong: weekData.closingSong || '',
          closingPrayer: '',
          sections: []
        };

        // Process sections
        if (weekData.sections) {
          weekData.sections.forEach((sectionData, sectionIndex) => {
            const section = {
              id: Date.now() + index * 1000 + sectionIndex,
              name: sectionData.name || '',
              type: determineSectionType(sectionData.name),
              items: []
            };

            // Process items
            if (sectionData.items) {
              sectionData.items.forEach((itemData, itemIndex) => {
                const participantList = determineParticipantList(itemData.description, sectionData.name, itemIndex);
                const item = {
                  id: Date.now() + index * 1000 + sectionIndex * 100 + itemIndex,
                  description: itemData.description || '',
                  type: itemData.type || 'regular',
                  participantList: participantList,
                  secondaryList: itemData.type === 'puonjruok' ? 'puonjruok_readers' : null,
                  assignedName: '',
                  assignedSecondary: '',
                  isDouble: determineIfDouble(itemData.description, sectionData.name, participantList)
                };
                section.items.push(item);
              });
            }

            week.sections.push(section);
          });
        }

        weeks.push(week);
      });
    }

    return weeks;
  };

  // Helper function to determine section type
  const determineSectionType = (sectionName) => {
    if (!sectionName) return 'custom';
    const name = sectionName.toLowerCase();
    if (name.includes('mwandu')) return 'mwandu';
    if (name.includes('tiegri')) return 'tiegri';
    if (name.includes('ngimawa')) return 'ngimawa';
    return 'custom';
  };

  // Helper function to determine participant list with simplified logic
  const determineParticipantList = (description, sectionName, itemIndex = 0) => {
    if (!description) return null;
    
    const section = sectionName?.toLowerCase() || '';
    const desc = description.toLowerCase();
    
    // MWANDU section - auto-assign based on position
    if (section.includes('mwandu')) {
      // Point 1: Assignment 1, Point 2: Assignment 2, Point 3: Assignment 3
      if (itemIndex === 0) return 'assignment1';
      if (itemIndex === 1) return 'assignment2';
      if (itemIndex === 2) return 'assignment3';
      // For any additional items, cycle through assignment lists
      return ['assignment1', 'assignment2', 'assignment3'][itemIndex % 3];
    }
    
    // TIEGRI section - default to Sisters list (user can change if needed)
    if (section.includes('tiegri')) {
      return 'sisters';
    }
    
    // NGIMAWA section - determine based on content
    if (section.includes('ngimawa')) {
      // Puonjruok Muma uses dedicated list
      if (desc.includes('puonjruok muma')) {
        return 'puonjruok_muma';
      }
      // Other NGIMAWA items use Elders
      return 'ngimawa';
    }
    
    // For other sections, try to determine based on description
    
    // Twak assignments
    if (desc.includes('twak')) {
      return 'twak';
    }
    
    return null;
  };

  // Helper function to determine if assignment should be double (sister pairs)
  const determineIfDouble = (description, sectionName, participantList) => {
    // If Sisters list is assigned, it should be double
    if (participantList === 'sisters') {
      return true;
    }
    
    // TIEGRI section with typical sister assignment descriptions
    const section = sectionName?.toLowerCase() || '';
    if (section.includes('tiegri') && description) {
      const desc = description.toLowerCase();
      // Common sister assignment patterns
      if (desc.includes('chako mbaka') || 
          desc.includes('dok limbe') || 
          desc.includes('lero yieni') ||
          desc.includes('sister') ||
          desc.includes('nyiri')) {
        return true;
      }
    }
    
    return false;
  };

  const getSectionHeaderClass = (type) => {
    switch(type) {
      case 'mwandu': return 'section-header-mwandu';
      case 'tiegri': return 'section-header-tiegri';
      case 'ngimawa': return 'section-header-ngimawa';
      default: return 'section-header-default';
    }
  };

  // Helper function to determine if list selection should be disabled
  const isListSelectionDisabled = (item, sectionType) => {
    // MWANDU section items are pre-assigned and not changeable
    if (sectionType === 'mwandu') return true;
    
    // NGIMAWA section items are pre-assigned and not changeable
    if (sectionType === 'ngimawa') return true;
    
    // TIEGRI section allows manual selection
    if (sectionType === 'tiegri') return false;
    
    // Chairman and prayers are pre-assigned at week level
    return false;
  };

  // Helper function to get available lists for selection
  const getAvailableListsForItem = (item, sectionType) => {
    // If selection is disabled, return all lists (but will be disabled anyway)
    if (isListSelectionDisabled(item, sectionType)) {
      return Object.entries(participantLists);
    }
    
    // For TIEGRI section, return all lists for manual selection
    return Object.entries(participantLists);
  };

  // Helper function to calculate input width based on content
  const getInputWidthClass = (value) => {
    if (!value) return 'w-32'; // Default width for empty inputs
    
    const length = value.length;
    if (length > 25) return 'w-64'; // Very long names/pairs
    if (length > 18) return 'w-52'; // Long names
    if (length > 12) return 'w-44'; // Medium-long names
    if (length > 8) return 'w-36';  // Medium names
    return 'w-32'; // Short names
  };

  // Helper function to fix existing items with Sisters list
  const fixSisterAssignments = () => {
    setWeeks(weeks.map(week => ({
      ...week,
      sections: week.sections.map(section => ({
        ...section,
        items: section.items.map(item => {
          // If item has Sisters list but isDouble is false, fix it
          if (item.participantList === 'sisters' && !item.isDouble) {
            return { ...item, isDouble: true };
          }
          // If item doesn't have Sisters list but isDouble is true, fix it
          if (item.participantList !== 'sisters' && item.isDouble) {
            return { ...item, isDouble: false };
          }
          return item;
        })
      }))
    })));
  };

  // Helper function to build historical assignment data from all saved schedules
const buildHistoricalAssignmentData = () => {
  const historicalData = {};
  
  // Initialize data for all participants
  Object.values(participantLists).forEach(list => {
    list.participants.forEach(name => {
      if (!historicalData[name]) {
        historicalData[name] = {
          total: 0,
          assignments: {},
          sisterPairs: 0,
          firstPosition: 0,
          secondPosition: 0,
          recentAssignments: [], // Track recent assignments for better rotation
          lastAssignmentWeek: -999,
          tiegriPoints: [], // Track which TIEGRI points this sister has been student for
          partnerships: [] // Track who this sister has been paired with for partner variety
        };
      }
    });
  });
  
  // Process all historical schedules
  scheduleHistory.forEach((schedule, scheduleIndex) => {
    if (!schedule.weeks || !Array.isArray(schedule.weeks)) return;
    
    schedule.weeks.forEach((week, weekIndex) => {
      // Process chairman
      if (week.chairman && historicalData[week.chairman]) {
        historicalData[week.chairman].total++;
        historicalData[week.chairman].assignments.chairman = (historicalData[week.chairman].assignments.chairman || 0) + 1;
        historicalData[week.chairman].recentAssignments.push({ 
          type: 'chairman', 
          week: weekIndex, 
          schedule: scheduleIndex,
          scheduleTitle: schedule.title 
        });
        historicalData[week.chairman].lastAssignmentWeek = Math.max(historicalData[week.chairman].lastAssignmentWeek, weekIndex);
      }
      
      // Process prayers
      if (week.openingPrayer && historicalData[week.openingPrayer]) {
        historicalData[week.openingPrayer].total++;
        historicalData[week.openingPrayer].assignments.opening_prayer = (historicalData[week.openingPrayer].assignments.opening_prayer || 0) + 1;
        historicalData[week.openingPrayer].recentAssignments.push({ 
          type: 'opening_prayer', 
          week: weekIndex, 
          schedule: scheduleIndex,
          scheduleTitle: schedule.title 
        });
        historicalData[week.openingPrayer].lastAssignmentWeek = Math.max(historicalData[week.openingPrayer].lastAssignmentWeek, weekIndex);
      }
      
      if (week.closingPrayer && historicalData[week.closingPrayer]) {
        historicalData[week.closingPrayer].total++;
        historicalData[week.closingPrayer].assignments.closing_prayer = (historicalData[week.closingPrayer].assignments.closing_prayer || 0) + 1;
        historicalData[week.closingPrayer].recentAssignments.push({ 
          type: 'closing_prayer', 
          week: weekIndex, 
          schedule: scheduleIndex,
          scheduleTitle: schedule.title 
        });
        historicalData[week.closingPrayer].lastAssignmentWeek = Math.max(historicalData[week.closingPrayer].lastAssignmentWeek, weekIndex);
      }
      
      // Process section items
      if (week.sections && Array.isArray(week.sections)) {
        week.sections.forEach(section => {
          if (section.items && Array.isArray(section.items)) {
            section.items.forEach(item => {
              // Handle primary assignments
              if (item.assignedName && item.assignedName.trim()) {
                if (item.isDouble && item.assignedName.includes(' / ')) {
                  // Sister pairs - this is the key fix for your issue!
                  const sisters = item.assignedName.split(' / ').map(name => name.trim());
                  
                  // Track partnerships between these sisters
                  if (sisters.length === 2) {
                    const [sister1, sister2] = sisters;
                    if (historicalData[sister1] && historicalData[sister2]) {
                      // Add each other to their partnership history
                      if (!historicalData[sister1].partnerships.includes(sister2)) {
                        historicalData[sister1].partnerships.push(sister2);
                      }
                      if (!historicalData[sister2].partnerships.includes(sister1)) {
                        historicalData[sister2].partnerships.push(sister1);
                      }
                    }
                  }
                  
                  sisters.forEach((sister, index) => {
                    if (historicalData[sister]) {
                      historicalData[sister].total++;
                      historicalData[sister].sisterPairs++;
                      
                      // Track position (first = student, second = assistant)
                      if (index === 0) {
                        historicalData[sister].firstPosition++;
                        
                        // Track TIEGRI points for students (only first position)
                        if (section.title === 'TIEGRI' && item.title && !historicalData[sister].tiegriPoints.includes(item.title)) {
                          historicalData[sister].tiegriPoints.push(item.title);
                        }
                      } else {
                        historicalData[sister].secondPosition++;
                      }
                      
                      historicalData[sister].assignments.sister_pair = (historicalData[sister].assignments.sister_pair || 0) + 1;
                      historicalData[sister].recentAssignments.push({ 
                        type: 'sister_pair', 
                        position: index === 0 ? 'student' : 'assistant',
                        week: weekIndex, 
                        schedule: scheduleIndex,
                        scheduleTitle: schedule.title,
                        itemTitle: item.title // Track which item/point this was for
                      });
                      historicalData[sister].lastAssignmentWeek = Math.max(historicalData[sister].lastAssignmentWeek, weekIndex);
                    }
                  });
                } else {
                  // Single assignments
                  const name = item.assignedName.trim();
                  if (historicalData[name]) {
                    historicalData[name].total++;
                    const assignmentType = item.participantList || 'assignment';
                    historicalData[name].assignments[assignmentType] = (historicalData[name].assignments[assignmentType] || 0) + 1;
                    historicalData[name].recentAssignments.push({ 
                      type: assignmentType, 
                      week: weekIndex, 
                      schedule: scheduleIndex,
                      scheduleTitle: schedule.title 
                    });
                    historicalData[name].lastAssignmentWeek = Math.max(historicalData[name].lastAssignmentWeek, weekIndex);
                  }
                }
              }
              
              // Handle secondary assignments (like Puonjruok readers)
              if (item.assignedSecondary && item.assignedSecondary.trim()) {
                const name = item.assignedSecondary.trim();
                if (historicalData[name]) {
                  historicalData[name].total++;
                  const assignmentType = item.secondaryList || 'secondary';
                  historicalData[name].assignments[assignmentType] = (historicalData[name].assignments[assignmentType] || 0) + 1;
                  historicalData[name].recentAssignments.push({ 
                    type: assignmentType, 
                    week: weekIndex, 
                    schedule: scheduleIndex,
                    scheduleTitle: schedule.title 
                  });
                  historicalData[name].lastAssignmentWeek = Math.max(historicalData[name].lastAssignmentWeek, weekIndex);
                }
              }
            });
          }
        });
      }
    });
  });
  
  // Debug output - only log sisters with assignments to reduce noise
  console.log('Historical data processed from', scheduleHistory.length, 'saved schedules:');
  Object.entries(historicalData)
    .filter(([name, data]) => data.sisterPairs > 0) // Only sisters with sister pair assignments
    .forEach(([name, data]) => {
      const pointsText = data.tiegriPoints && data.tiegriPoints.length > 0 
        ? `, TIEGRI points as student: [${data.tiegriPoints.join(', ')}]`
        : '';
      console.log(`${name}: ${data.total} total assignments, Student: ${data.firstPosition}, Assistant: ${data.secondPosition}${pointsText}`);
    });
  
  return historicalData;
};

  // Helper function to calculate assignment counts for history
const calculateAssignmentCounts = (weeksData) => {
  const counts = {};
  
  // Initialize counts for all participants
  Object.values(participantLists).forEach(list => {
    list.participants.forEach(name => {
      if (!counts[name]) {
        counts[name] = {
          total: 0,
          chairman: 0,
          prayer: 0,
          assignments: {},
          sisterPairs: 0,
          firstPosition: 0,
          secondPosition: 0
        };
      }
    });
  });
  
  weeksData.forEach(week => {
    // Count chairman assignments
    if (week.chairman) {
      if (counts[week.chairman]) {
        counts[week.chairman].chairman++;
        counts[week.chairman].total++;
      }
    }
    
    // Count prayers
    if (week.openingPrayer && counts[week.openingPrayer]) {
      counts[week.openingPrayer].prayer++;
      counts[week.openingPrayer].total++;
    }
    if (week.closingPrayer && counts[week.closingPrayer]) {
      counts[week.closingPrayer].prayer++;
      counts[week.closingPrayer].total++;
    }
    
    // Count section assignments
    week.sections.forEach(section => {
      section.items.forEach(item => {
        if (item.assignedName) {
          if (item.isDouble && item.assignedName.includes(' / ')) {
            // Sister pair
            const [first, second] = item.assignedName.split(' / ');
            if (counts[first]) {
              counts[first].sisterPairs++;
              counts[first].firstPosition++;
              counts[first].total++;
            }
            if (counts[second]) {
              counts[second].sisterPairs++;
              counts[second].secondPosition++;
              counts[second].total++;
            }
          } else {
            // Single assignment
            if (counts[item.assignedName]) {
              const listKey = item.participantList || 'unknown';
              if (!counts[item.assignedName].assignments[listKey]) {
                counts[item.assignedName].assignments[listKey] = 0;
              }
              counts[item.assignedName].assignments[listKey]++;
              counts[item.assignedName].total++;
            }
          }
        }
        
        // Count secondary assignments (readers)
        if (item.assignedSecondary && counts[item.assignedSecondary]) {
          const listKey = item.secondaryList || 'secondary';
          if (!counts[item.assignedSecondary].assignments[listKey]) {
            counts[item.assignedSecondary].assignments[listKey] = 0;
          }
          counts[item.assignedSecondary].assignments[listKey]++;
          counts[item.assignedSecondary].total++;
        }
      });
    });
  });
  
  return counts;
};

// Delete a schedule from history
const deleteHistoryItem = async (historyId) => {
  showConfirm(
    'Are you sure you want to delete this schedule from history? This will also remove it from future auto-assignment considerations.',
    async (confirmed) => {
      if (!confirmed) return;
      
      try {
        const newHistory = scheduleHistory.filter(item => item.id !== historyId);
        setScheduleHistory(newHistory);
        
        // Update Firebase
        const data = {
          weeks,
          participantLists,
          previousAssignments,
          scheduleHistory: newHistory,
          rotationIndices,
          savedAt: new Date().toISOString()
        };
        
        await saveScheduleToFirebase(data);
        showToast('Schedule deleted from history successfully!', 'success');
      } catch (error) {
        console.error('Error deleting history item:', error);
        showAlert('Error deleting schedule: ' + error.message, 'error');
      }
    },
    'Delete Schedule',
    'danger'
  );
};

// Load a historical schedule for editing
const loadHistoryForEditing = (historyId) => {
  const historyItem = scheduleHistory.find(item => item.id === historyId);
  if (!historyItem) return;
  
  if (hasUnsavedChanges) {
    // Show custom modal instead of confirm dialog
    setPendingHistoryLoad({ historyItem, historyId });
    setShowUnsavedChangesModal(true);
    return;
  }
  
  loadScheduleForEditing(historyItem, historyId);
};

// Handle the modal actions
const handleSaveAndLoad = async () => {
  if (editingHistoryId) {
    await updateHistoryItem();
  } else {
    await saveToDatabase();
  }
  
  const { historyItem, historyId } = pendingHistoryLoad;
  loadScheduleForEditing(historyItem, historyId);
  setShowUnsavedChangesModal(false);
  setPendingHistoryLoad(null);
};

const handleDontSaveAndLoad = () => {
  const { historyItem, historyId } = pendingHistoryLoad;
  loadScheduleForEditing(historyItem, historyId);
  setShowUnsavedChangesModal(false);
  setPendingHistoryLoad(null);
};

const handleCancelLoad = () => {
  setShowUnsavedChangesModal(false);
  setPendingHistoryLoad(null);
};

// Helper function to load schedule for editing
const loadScheduleForEditing = (historyItem, historyId) => {
  setWeeks(JSON.parse(JSON.stringify(historyItem.weeks))); // Deep copy
  setEditingHistoryId(historyId);
  setCurrentScheduleId(historyId);
  setHasUnsavedChanges(false);
  setShowHistory(false);
  showToast(`Loaded "${historyItem.title}" for editing.`, 'success');
};

// Update an existing history item
const updateHistoryItem = async () => {
  if (!editingHistoryId) return;
  
  const historyItem = scheduleHistory.find(item => item.id === editingHistoryId);
  if (!historyItem) return;
  
  // Confirm the update action
  showConfirm(
    `Are you sure you want to update the saved schedule "${historyItem.title}"? This will overwrite the previously saved version.`,
    async (confirmed) => {
      if (!confirmed) return;
      
      try {
        const newHistory = scheduleHistory.map(item => {
          if (item.id === editingHistoryId) {
            return {
              ...item,
              weeks: JSON.parse(JSON.stringify(weeks)),
              participantLists: JSON.parse(JSON.stringify(participantLists)),
              assignmentCounts: calculateAssignmentCounts(weeks),
              lastModified: new Date().toISOString()
            };
          }
          return item;
        });
        
        setScheduleHistory(newHistory);
        
        // Update Firebase
        const data = {
          weeks,
          participantLists,
          previousAssignments,
          scheduleHistory: newHistory,
          rotationIndices,
          savedAt: new Date().toISOString()
        };
        
        await saveScheduleToFirebase(data);
        
        const updatedHistoryItem = newHistory.find(item => item.id === editingHistoryId);
        showToast(`Updated "${updatedHistoryItem.title}" successfully!`, 'success');
        setEditingHistoryId(null);
        setCurrentScheduleId(null);
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('Error updating history item:', error);
        showAlert('Error updating schedule: ' + error.message, 'error');
      }
    },
    'Update Schedule',
    'warning'
  );
};

// Function to print slips
const printSlips = () => {
  // Clone the slips grid
  const slipsGrid = document.querySelector('.slips-grid');
  if (!slipsGrid) {
    showAlert('No slips to print!', 'warning');
    return;
  }
  
  // Create iframe for printing
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.top = '-10000px';
  iframe.style.left = '-10000px';
  iframe.style.width = '0';
  iframe.style.height = '0';
  document.body.appendChild(iframe);
  
  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
  
  // Write the content
  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Assignment Slips</title>
      <style>
        @page {
          size: letter;
          margin: 0.5in;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
        }
        
        .slips-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5in;
        }
        
        .slip-form {
          width: 3.5in;
          height: 4.5in;
          padding: 0.25in;
          border: 1px solid #000;
          page-break-inside: avoid;
          box-sizing: border-box;
        }
        
        .border-b {
          border-bottom: 1px solid black;
        }
        
        .border-black {
          border-color: black;
        }
        
        .border-2 {
          border-width: 2px;
        }
        
        .flex {
          display: flex;
        }
        
        .flex-1 {
          flex: 1;
        }
        
        .gap-2 {
          gap: 0.5rem;
        }
        
        .font-bold {
          font-weight: bold;
        }
        
        .text-center {
          text-align: center;
        }
        
        .text-sm {
          font-size: 0.875rem;
        }
        
        .text-xs {
          font-size: 0.75rem;
        }
        
        .mb-4 {
          margin-bottom: 1rem;
        }
        
        .mb-2 {
          margin-bottom: 0.5rem;
        }
        
        .mt-4 {
          margin-top: 1rem;
        }
        
        .pb-1 {
          padding-bottom: 0.25rem;
        }
        
        .min-w-\\[80px\\] {
          min-width: 80px;
        }
        
        .w-4 {
          width: 1rem;
        }
        
        .h-4 {
          height: 1rem;
        }
        
        .space-y-3 > * + * {
          margin-top: 0.75rem;
        }
        
        .space-y-1 > * + * {
          margin-top: 0.25rem;
        }
        
        .items-center {
          align-items: center;
        }
        
        .justify-center {
          justify-content: center;
        }
        
        .leading-tight {
          line-height: 1.25;
        }
        
        .text-gray-700 {
          color: #374151;
        }
        
        .text-gray-500 {
          color: #6b7280;
        }
      </style>
    </head>
    <body>
      ${slipsGrid.outerHTML}
    </body>
    </html>
  `);
  iframeDoc.close();
  
  // Wait a moment for styles to apply, then print
  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    
    // Remove iframe after printing
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 250);
};

  // Function to start a new schedule
  const startNewSchedule = () => {
    if (hasUnsavedChanges) {
      // Create a custom dialog with three options
      const dialog = document.createElement('div');
      dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      dialog.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
          <h3 class="text-lg font-bold mb-4">Unsaved Changes</h3>
          <p class="mb-6">You have unsaved changes in your current schedule. What would you like to do?</p>
          <div class="flex gap-3 justify-end">
            <button id="cancel-btn" class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
              Cancel
            </button>
            <button id="dont-save-btn" class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
              Don't Save
            </button>
            <button id="save-btn" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Save
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(dialog);

      // Handle button clicks
      dialog.querySelector('#cancel-btn').onclick = () => {
        document.body.removeChild(dialog);
        // Do nothing - stay in current schedule
      };

      dialog.querySelector('#dont-save-btn').onclick = () => {
        document.body.removeChild(dialog);
        clearCurrentSchedule();
      };

      dialog.querySelector('#save-btn').onclick = () => {
        document.body.removeChild(dialog);
        // If editing existing schedule, update it
        if (editingHistoryId) {
          updateHistoryItem().then(() => {
            clearCurrentSchedule();
          });
        } else {
          // If new schedule, save as new
          saveToDatabase().then(() => {
            clearCurrentSchedule();
          });
        }
      };

      // Close dialog when clicking outside
      dialog.onclick = (e) => {
        if (e.target === dialog) {
          document.body.removeChild(dialog);
        }
      };

      return;
    }
    
    clearCurrentSchedule();
  };

  // Function to clear current schedule and start fresh
  const clearCurrentSchedule = () => {
    setWeeks([]);
    setEditingHistoryId(null);
    setCurrentScheduleId(null);
    setHasUnsavedChanges(false);
    setShowHistory(false);
  };

  // Function to mark changes as made
  const markAsChanged = () => {
    setHasUnsavedChanges(true);
  };

  // Enhanced save function that handles both new and existing schedules
  const saveCurrentSchedule = async () => {
    if (editingHistoryId) {
      // Update existing schedule
      await updateHistoryItem();
    } else {
      // Save as new schedule
      await saveToDatabase();
    }
    setHasUnsavedChanges(false);
  };

  if (processingPdf) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl">Processing PDF with AI... Please wait...</div>
      </div>
    );
  }

  // Show loading spinner while Firebase data is being loaded
  if (loading || !participantLists) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-gray-700 mb-2">Loading from Firebase...</div>
          <div className="text-sm text-gray-500">
            Connecting to Firebase database to load participant lists and schedules.
            <br />
            This app now uses only Firebase data - no local fallbacks.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="mb-6 flex justify-between items-center no-print">
        <h1 className="text-3xl font-bold text-gray-800">Meeting Schedule Manager</h1>
        {/* Enhanced button group with New Schedule and History */}
        <div className="flex gap-2">
          <button
            onClick={startNewSchedule}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
            title="Start a new schedule"
          >
            <Plus size={20} />
            New Schedule
          </button>
          <label className="btn-primary cursor-pointer">
            <Upload size={20} />
            Import PDF/EPUB
            <input
              type="file"
              accept=".pdf,.epub"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <button
            onClick={() => {
              if (showPreview) {
                // If in preview mode, automatically switch to edit mode and show history
                setShowPreview(false);
                setShowHistory(true);
              } else {
                setShowHistory(!showHistory);
              }
            }}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 flex items-center gap-2"
            title="View and manage saved schedules"
          >
            <History size={20} />
            History ({scheduleHistory.length})
          </button>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="btn-primary"
          >
            <Eye size={20} />
            {showPreview ? 'Edit Mode' : 'Preview'}
          </button>
          <button
            onClick={performRotation}
            className="btn-success"
          >
            <RotateCw size={20} />
            Auto Assign
          </button>
          <button
            onClick={showSlipsPreview}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
            title="Generate assignment slips for TIEGRI section"
          >
            <Calendar size={20} />
            Slips
          </button>
          <button
            onClick={saveCurrentSchedule}
            disabled={saving}
            className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 ${
              editingHistoryId 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-purple-500 hover:bg-purple-600'
            } ${hasUnsavedChanges ? 'ring-2 ring-yellow-400' : ''}`}
            title={hasUnsavedChanges ? 'You have unsaved changes' : ''}
          >
            <Save size={20} />
            {saving ? 'Saving...' : editingHistoryId ? 'Update' : 'Save'}
            {hasUnsavedChanges && <span className="text-xs">*</span>}
          </button>
          {showPreview && (
            <button
              onClick={handlePrint}
              className="btn-secondary"
            >
              <Printer size={20} />
              Print
            </button>
          )}
        </div>
      </div>

      {/* Current Schedule Status */}
      {(editingHistoryId || hasUnsavedChanges) && (
        <div className="mb-4 p-3 rounded-lg border no-print">
          {editingHistoryId ? (
            <div className="flex items-center justify-between bg-blue-50 border-blue-200 text-blue-800 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Edit2 size={16} />
                <span className="font-medium">
                  Editing: {scheduleHistory.find(h => h.id === editingHistoryId)?.title}
                </span>
                {hasUnsavedChanges && (
                  <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    Unsaved changes
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  if (hasUnsavedChanges) {
                    showConfirm(
                      'Cancel editing? Any unsaved changes will be lost.',
                      (confirmed) => {
                        if (confirmed) {
                          clearCurrentSchedule();
                        }
                      },
                      'Cancel Editing',
                      'warning'
                    );
                  } else {
                    clearCurrentSchedule();
                  }
                }}
                className="text-blue-600 hover:text-blue-800"
                title="Cancel editing"
              >
                <X size={16} />
              </button>
            </div>
          ) : hasUnsavedChanges ? (
            <div className="bg-yellow-50 border-yellow-200 text-yellow-800 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span className="font-medium">New Schedule (Unsaved changes)</span>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Participant Lists Management */}
      {!showPreview && !showHistory && (
        <div className="mb-6 p-4 card no-print">
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <Users size={20} />
            Participant Lists
            {savingLists && (
              <span className="text-sm text-blue-600 font-normal">Saving...</span>
            )}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(participantLists).map(([key, list]) => (
              <div key={key} className="p-3 bg-gray-50 rounded-lg border">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-gray-800">{list.name}</h3>
                    <p className="text-sm text-gray-600">{list.participants.length} participants</p>
                  </div>
                  <button
                    onClick={() => setEditingList(editingList === key ? null : key)}
                    className="text-blue-500 hover:text-blue-700 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
                {editingList === key && (
                  <div className="mt-4 space-y-3">
                    {/* Search and Sort Controls */}
                    <div className="flex gap-2 items-center">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          placeholder="Search participants..."
                          value={searchFilter}
                          onChange={(e) => setSearchFilter(e.target.value)}
                          className="w-full p-2 pl-8 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <svg className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <button
                        onClick={() => {
                          const sortedParticipants = [...list.participants].sort((a, b) => a.localeCompare(b));
                          updateParticipantList(key, sortedParticipants);
                          showToast('Participants sorted alphabetically', 'success');
                        }}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                        title="Sort alphabetically"
                      >
                        A-Z
                      </button>
                    </div>

                    {/* Current Participants */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Current Participants: 
                        <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          {searchFilter ? 
                            `${list.participants.filter(p => p.toLowerCase().includes(searchFilter.toLowerCase())).length} / ${list.participants.length}` 
                            : list.participants.length
                          }
                        </span>
                      </h4>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {list.participants
                          .filter(participant => !searchFilter || participant.toLowerCase().includes(searchFilter.toLowerCase()))
                          .map((participant, index, filteredArray) => {
                            const originalIndex = list.participants.indexOf(participant);
                            return (
                              <div key={originalIndex} className="flex items-center justify-between bg-white p-2 rounded border hover:bg-gray-50 transition-colors">
                                <span className="text-sm text-gray-800">{participant}</span>
                                <button
                                  onClick={() => {
                                    showConfirm(
                                      `Are you sure you want to remove "${participant}" from "${list.name}"?`,
                                      (confirmed) => {
                                        if (confirmed) {
                                          const updatedParticipants = list.participants.filter((_, i) => i !== originalIndex);
                                          updateParticipantList(key, updatedParticipants);
                                          showToast(`Removed ${participant}`, 'success');
                                        }
                                      },
                                      'Remove Participant',
                                      'warning'
                                    );
                                  }}
                                  className="text-red-500 hover:text-red-700 transition-colors p-1"
                                  title="Remove participant"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            );
                          })}
                        {searchFilter && list.participants.filter(p => p.toLowerCase().includes(searchFilter.toLowerCase())).length === 0 && (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            No participants found matching "{searchFilter}"
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Add New Participant */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter new participant name..."
                        className="flex-1 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && e.target.value.trim()) {
                            const newName = e.target.value.trim();
                            if (!list.participants.includes(newName)) {
                              updateParticipantList(key, [...list.participants, newName]);
                              e.target.value = '';
                              showToast(`Added ${newName}`, 'success');
                            } else {
                              showToast('Participant already exists in this list', 'warning');
                            }
                          }
                        }}
                      />
                      <button
                        onClick={(e) => {
                          const input = e.target.closest('button').previousElementSibling;
                          const newName = input.value.trim();
                          if (newName) {
                            if (!list.participants.includes(newName)) {
                              updateParticipantList(key, [...list.participants, newName]);
                              input.value = '';
                              showToast(`Added ${newName}`, 'success');
                            } else {
                              showToast('Participant already exists in this list', 'warning');
                            }
                          }
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium flex items-center justify-center min-w-[44px]"
                        title="Add participant"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-xs text-gray-500">
                        {list.participants.length} participant{list.participants.length !== 1 ? 's' : ''}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            showConfirm(
                              `Are you sure you want to clear all participants from "${list.name}"?`,
                              (confirmed) => {
                                if (confirmed) {
                                  updateParticipantList(key, []);
                                  showToast('All participants cleared', 'success');
                                }
                              },
                              'Clear All Participants',
                              'warning'
                            );
                          }}
                          className="text-xs text-red-600 hover:text-red-800 font-medium"
                        >
                          Clear All
                        </button>
                        <button
                          onClick={() => {
                            setEditingList(null);
                            setSearchFilter('');
                          }}
                          className="text-xs text-green-600 hover:text-green-800 font-medium px-3 py-1 bg-green-50 rounded"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      {!showHistory && (
        <div className={showPreview ? 'schedule-preview' : ''} ref={printRef}>
        {showPreview ? (
          // Preview Mode
          <div className="schedule-preview" ref={printRef}>
            <div>
              {weeks.map((week, index) => (
                <div key={week.id}>
                  <h2>{week.dateRange} {week.title}</h2>
                  
                  {week.chairman && (
                    <div className="chairman">JAKOM: {week.chairman}</div>
                  )}
                  
                  {week.openingSong && (
                    <div className="song-prayer">Wer {week.openingSong}</div>
                  )}
                  
                  {week.openingPrayer && (
                    <div className="schedule-item prayer">
                      <span className="item-description">Lamo:</span>
                      <span className="item-name">{week.openingPrayer}</span>
                    </div>
                  )}
                  
                  <div className="song-prayer">Weche Michakogo (Dak. 1)</div>
                  
                  {week.sections.map((section, sectionIndex) => {
                    let itemCounter = 0;
                    return (
                      <div key={section.id}>
                        {section.name && (
                          <div className={`section-header ${getSectionHeaderClass(section.type)}`}>
                            {section.name}
                          </div>
                        )}
                        
                        {/* Add song after the red section (NGIMAWA) header */}
                        {sectionIndex === 2 && week.middleSong && (
                          <div className="song-prayer">Wer {week.middleSong}</div>
                        )}
                        
                        <div className="indent">
                          {section.items.map((item) => {
                            itemCounter++;
                            // Calculate global item number across all previous sections
                            let globalItemNumber = 0;
                            for (let i = 0; i < week.sections.indexOf(section); i++) {
                              globalItemNumber += week.sections[i].items.length;
                            }
                            globalItemNumber += section.items.indexOf(item) + 1;
                            
                            return (
                              <div key={item.id} className="schedule-item">
                                <div className="item-description">
                                  {globalItemNumber}. {item.description}
                                </div>
                                <div className="item-name">
                                  {item.assignedName}
                                  {item.assignedSecondary && ` / ${item.assignedSecondary}`}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="song-prayer">Weche Mitiekogo (Dak. 3)</div>
                  
                  {week.closingSong && (
                    <div className="song-prayer">Wer {week.closingSong}</div>
                  )}
                  
                  {week.closingPrayer && (
                    <div className="schedule-item prayer">
                      <span className="item-description">Lamo:</span>
                      <span className="item-name">{week.closingPrayer}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Edit Mode
          <div className="space-y-6 edit-mode">
            {weeks.map((week, weekIndex) => (
              <div key={week.id} className="card p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex gap-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium">
                        Week {weekIndex + 1}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={week.title}
                      onChange={(e) => updateWeek(week.id, 'title', e.target.value)}
                      className="input-field font-semibold"
                      placeholder="Week title (e.g., NGECHE 21)"
                    />
                    <input
                      type="text"
                      value={week.dateRange}
                      onChange={(e) => updateWeek(week.id, 'dateRange', e.target.value)}
                      className="input-field"
                      placeholder="Date range (e.g., JULY 7-13)"
                    />
                  </div>
                  <button
                    onClick={() => deleteWeek(week.id)}
                    className="text-red-500 hover:text-red-700 transition-colors p-2"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                {/* Week Details */}
               
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
  <div className="flex gap-2 items-center">
    <label className="font-medium">Chairman:</label>
    <select
      value={week.chairman || ''}
      onChange={(e) => updateWeek(week.id, 'chairman', e.target.value)}
      className="flex-1 input-field"
    >
      <option value="">Select...</option>
      {participantLists.chairmen?.participants.map(name => (
        <option key={name} value={name}>{name}</option>
      ))}
    </select>
  </div>
  <div className="flex gap-2 items-center">
    <label className="font-medium">Opening Song:</label>
    <input
      type="text"
      value={week.openingSong || ''}
      onChange={(e) => updateWeek(week.id, 'openingSong', e.target.value)}
      className="flex-1 input-field"
      placeholder="Song number..."
    />
  </div>
  <div className="flex gap-2 items-center">
    <label className="font-medium">Opening Prayer:</label>
    <select
      value={week.openingPrayer || ''}
      onChange={(e) => updateWeek(week.id, 'openingPrayer', e.target.value)}
      className="flex-1 input-field"
    >
      <option value="">Select...</option>
      {participantLists.prayers?.participants.map(name => (
        <option key={name} value={name}>{name}</option>
      ))}
    </select>
  </div>
</div>                {/* Sections */}
                <div className="space-y-4">
                  {week.sections.map((section, sectionIndex) => {
                    // Determine section background color
                    let sectionBgColor = '';
                    if (sectionIndex === 0) {
                      sectionBgColor = 'bg-gray-200'; // First section - more distinct pale gray
                    } else if (sectionIndex === 1) {
                      sectionBgColor = 'bg-yellow-100'; // Second section - pale yellow
                    } else if (sectionIndex === week.sections.length - 1) {
                      sectionBgColor = 'bg-red-100'; // Last section - pale red
                    }
                    
                    return (
                      <div key={`section-wrapper-${section.id}`}>
                        <div key={section.id} className={`border-l-4 border-blue-500 pl-4 p-3 rounded ${sectionBgColor}`}>
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex gap-2 flex-1">
                              <input
                                type="text"
                                value={section.name}
                                onChange={(e) => updateSection(week.id, section.id, 'name', e.target.value)}
                                className="input-field font-medium"
                                placeholder="Section name"
                              />
                              <select
                                value={section.type}
                                onChange={(e) => updateSection(week.id, section.id, 'type', e.target.value)}
                                className="input-field"
                              >
                                <option value="custom">Custom</option>
                                <option value="mwandu">Mwandu</option>
                                <option value="tiegri">Tiegri</option>
                                <option value="ngimawa">Ngimawa</option>
                              </select>
                            </div>
                            <button
                              onClick={() => deleteSection(week.id, section.id)}
                              className="text-red-500 hover:text-red-700 transition-colors p-2"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                          {/* Items */}
                          <div className="space-y-2 section-items">
                            {section.items.map(item => (
                              <div key={item.id} className="ml-4 flex gap-2 items-center bg-white p-2 rounded border schedule-item-edit">
                                <input
                                  type="text"
                                  value={item.description}
                                  onChange={(e) => updateItem(week.id, section.id, item.id, 'description', e.target.value)}
                                  className="flex-1 input-field text-sm"
                                  placeholder="Item description"
                                />
                                {!isListSelectionDisabled(item, section.type) && (
                                  <select
                                    value={item.participantList || ''}
                                    onChange={(e) => updateItem(week.id, section.id, item.id, 'participantList', e.target.value)}
                                    className="input-field text-sm"
                                  >
                                    <option value="">Select list...</option>
                                    {getAvailableListsForItem(item, section.type).map(([key, list]) => (
                                      <option key={key} value={key}>{list.name}</option>
                                    ))}
                                  </select>
                                )}
                                {item.type === 'puonjruok' && !isListSelectionDisabled(item, section.type) && (
                                  <select
                                    value={item.secondaryList || ''}
                                    onChange={(e) => updateItem(week.id, section.id, item.id, 'secondaryList', e.target.value)}
                                    className="input-field text-sm"
                                  >
                                    <option value="">Reader list...</option>
                                    {Object.entries(participantLists).map(([key, list]) => (
                                      <option key={key} value={key}>{list.name}</option>
                                    ))}
                                  </select>
                                )}
                                <input
                                  type="text"
                                  value={item.assignedName}
                                  onChange={(e) => updateItem(week.id, section.id, item.id, 'assignedName', e.target.value)}
                                  className={`input-field text-sm ${getInputWidthClass(item.assignedName)}`}
                                  placeholder="Assigned..."
                                />
                                {item.secondaryList && (
                                  <input
                                    type="text"
                                    value={item.assignedSecondary || ''}
                                    onChange={(e) => updateItem(week.id, section.id, item.id, 'assignedSecondary', e.target.value)}
                                    className={`input-field text-sm ${getInputWidthClass(item.assignedSecondary)}`}
                                    placeholder="Reader..."
                                  />
                                )}
                                <button
                                  onClick={() => deleteItem(week.id, section.id, item.id)}
                                  className="text-red-500 hover:text-red-700 transition-colors p-1"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ))}

                            {sectionIndex !== 0 && (
                              <button
                                onClick={() => addItem(week.id, section.id)}
                                className="mt-2 text-blue-500 hover:text-blue-700 text-sm flex items-center gap-1 transition-colors"
                              >
                                <Plus size={16} /> Add Item
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Middle Song between yellow (TIEGRI) and red (NGIMAWA) sections */}
                        {sectionIndex === 1 && (
                          <div className="my-4 p-3 bg-blue-50 border-l-4 border-blue-300 rounded">
                            <div className="flex gap-2 items-center text-sm">
                              <label className="font-medium min-w-fit">Middle Song:</label>
                              <input
                                type="text"
                                value={week.middleSong || ''}
                                onChange={(e) => updateWeek(week.id, 'middleSong', e.target.value)}
                                className="flex-1 input-field"
                                placeholder="Song number..."
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Closing Prayer */}
                <div className="mt-4 flex gap-2 items-center text-sm">
                  <label className="font-medium min-w-fit">Closing Prayer:</label>
                  <input
                    type="text"
                    value={week.closingPrayer || ''}
                    onChange={(e) => updateWeek(week.id, 'closingPrayer', e.target.value)}
                    className="flex-1 input-field"
                    placeholder="Prayer name..."
                  />
                </div>

                {/* Closing Song */}
                <div className="mt-4 flex gap-2 items-center text-sm">
                  <label className="font-medium min-w-fit">Closing Song:</label>
                  <input
                    type="text"
                    value={week.closingSong || ''}
                    onChange={(e) => updateWeek(week.id, 'closingSong', e.target.value)}
                    className="flex-1 input-field"
                    placeholder="Song number..."
                  />
                </div>
              </div>
            ))}

            <button
              onClick={addWeek}
              className="btn-primary"
            >
              <Plus size={20} /> Add Week
            </button>
          </div>
        )}
      </div>
      )}

      {/* Schedule History Management */}
      {!showPreview && showHistory && (
        <div className="mb-6 p-4 card no-print">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <History size={20} />
              Schedule History ({scheduleHistory.length} saved)
            </h2>
            <button
              onClick={() => setShowHistory(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>

          {scheduleHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No saved schedules yet. Create and save a schedule to see it here!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {scheduleHistory
                .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))
                .map((historyItem) => (
                  <div key={historyItem.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-800">{historyItem.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(historyItem.savedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span>{historyItem.weekCount} weeks</span>
                          {historyItem.lastModified && (
                            <span className="text-blue-600">
                              (Modified: {new Date(historyItem.lastModified).toLocaleDateString()})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setWeeks(JSON.parse(JSON.stringify(historyItem.weeks))); // Deep copy for preview
                            setShowHistory(false);
                            setShowPreview(true);
                          }}
                          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm flex items-center gap-1"
                          title="Preview this schedule"
                        >
                          <Eye size={14} />
                          Preview
                        </button>
                        <button
                          onClick={() => loadHistoryForEditing(historyItem.id)}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm flex items-center gap-1"
                          title="Load this schedule for editing"
                        >
                          <Edit2 size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => deleteHistoryItem(historyItem.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm flex items-center gap-1"
                          title="Delete this schedule from history"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Assignment Summary */}
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Assignment Summary:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        {Object.entries(historyItem.assignmentCounts || {})
                          .filter(([name, counts]) => counts.total > 0)
                          .sort(([, a], [, b]) => b.total - a.total)
                          .slice(0, 8) // Show top 8 most assigned
                          .map(([name, counts]) => (
                            <div key={name} className="bg-white p-2 rounded border">
                              <div className="font-medium truncate" title={name}>{name}</div>
                              <div className="text-gray-600">
                                {counts.total} total
                                {counts.sisterPairs > 0 && (
                                  <span className="block">
                                    {counts.firstPosition} first, {counts.secondPosition} second
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Week Titles Preview */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Weeks:</h4>
                      <div className="flex flex-wrap gap-1 text-xs">
                        {historyItem.weeks.slice(0, 4).map((week, idx) => (
                          <span key={idx} className="bg-white px-2 py-1 rounded border text-gray-600">
                            {week.title || `Week ${idx + 1}`}
                            {week.dateRange && ` (${week.dateRange})`}
                          </span>
                        ))}
                        {historyItem.weeks.length > 4 && (
                          <span className="px-2 py-1 text-gray-500">
                            +{historyItem.weeks.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Assignment Slips Preview Modal */}
{/* Assignment Slips Preview Modal */}
{showSlips && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 slips-modal-container">
    <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col slips-modal-content">
      <div className="flex justify-between items-center p-4 border-b slips-modal-header">
        <h2 className="text-xl font-semibold">Assignment Slips - TIEGRI Section</h2>
        <div className="flex gap-2">
          <button
            onClick={printSlips}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <Printer size={16} />
            Print Slips
          </button>
          <button
            onClick={() => setShowSlips(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 slips-container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 slips-grid">
          {slipsData.map((slip, index) => (
            <div key={slip.id} className="border border-gray-300 p-4 bg-white slip-form">
              {/* Rest of slip content remains the same */}
                    <div className="text-center font-bold text-sm mb-4 leading-tight">
                      OUR CHRISTIAN LIFE AND MINISTRY<br />
                      MEETING ASSIGNMENT
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex">
                        <span className="font-bold min-w-[80px]">Name:</span>
                        <span className="border-b border-black flex-1 pb-1">{slip.name}</span>
                      </div>
                      
                      <div className="flex">
                        <span className="font-bold min-w-[80px]">Assistant:</span>
                        <span className="border-b border-black flex-1 pb-1">{slip.assistant}</span>
                      </div>
                      
                      <div className="flex">
                        <span className="font-bold min-w-[80px]">Date:</span>
                        <span className="border-b border-black flex-1 pb-1">{slip.date}</span>
                      </div>
                      
                      <div className="flex">
                        <span className="font-bold min-w-[80px]">Part no.:</span>
                        <span className="border-b border-black flex-1 pb-1">{slip.partNumber}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="font-bold text-sm mb-2">To be given in:</div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-black flex items-center justify-center">
                            <span className="text-xs font-bold">✓</span>
                          </div>
                          <span>Main hall</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-black"></div>
                          <span>Auxiliary classroom 1</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-black"></div>
                          <span>Auxiliary classroom 2</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-xs text-gray-700 leading-tight">
                      <strong>Note to student:</strong> The source material and study point for your assignment can be found in the Life and Ministry Meeting Workbook. Please review the instructions for the part as outlined in Instructions for Our Christian Life and Ministry Meeting (S-38).
                    </div>
                    
                    <div className="mt-4 text-xs text-gray-500">
                      S-89-E 11/23
                    </div>
                  </div>
                ))}
              </div>
              
              {slipsData.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No TIEGRI assignments found to generate slips for.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Modal */}
      {showUnsavedChangesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Unsaved Changes</h3>
              <p className="text-gray-600 mb-6">
                You have unsaved changes. What would you like to do before loading the selected schedule?
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSaveAndLoad}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  Save Changes and Load Schedule
                </button>
                <button
                  onClick={handleDontSaveAndLoad}
                  className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Don't Save - Load Schedule
                </button>
                <button
                  onClick={handleCancelLoad}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancel - Keep Current Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Components */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={closeAlert}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
      
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        type={confirmModal.type}
      />
      
      <PromptModal
        isOpen={promptModal.isOpen}
        onClose={closePrompt}
        title={promptModal.title}
        message={promptModal.message}
        defaultValue={promptModal.defaultValue}
        onSubmit={promptModal.onSubmit}
      />
      
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={closeToast}
      />
    </div>
  );
};

export default MeetingScheduler;
