import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, Save, Printer, Eye, Edit2, Users, Calendar, RotateCw, X, Check } from 'lucide-react';
import { AlertModal, ConfirmModal, PromptModal, Toast } from './src/components/Modal';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB_VsLZaaQ_m3WNVlPjfhy715BXo8ax004",
  authDomain: "tracking-budget-app.firebaseapp.com",
  databaseURL: "https://tracking-budget-app-default-rtdb.firebaseio.com/",
  projectId: "tracking-budget-app",
  storageBucket: "tracking-budget-app.appspot.com",
  messagingSenderId: "912992088190",
  appId: "1:912992088190:web:d5ea1a3157722b8feb282f"
};

// Import Firebase SDK from CDN
const loadFirebase = async () => {
  if (typeof window !== 'undefined' && !window.firebase) {
    const script1 = document.createElement('script');
    script1.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js';
    document.head.appendChild(script1);
    
    const script2 = document.createElement('script');
    script2.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js';
    document.head.appendChild(script2);
    
    await new Promise(resolve => {
      script2.onload = resolve;
    });
    
    window.firebase.initializeApp(firebaseConfig);
  }
  return window.firebase;
};

const MeetingScheduler = () => {
  // State management
  const [weeks, setWeeks] = useState([]);
  const [participantLists, setParticipantLists] = useState({
    chairmen: { name: 'Chairmen', participants: ['Tom Oyoo', 'Pius Omondi', 'James Otieno', 'George Radak'] },
    assignment1: { name: 'Assignment 1', participants: ['Tom Oyoo', 'Pius Omondi', 'James Otieno', 'George Radak', 'Benson Otieno', 'Steve Ouma', 'Cosmas Were', 'Austin Ngode', 'Caleb Onyango'] },
    assignment2: { name: 'Assignment 2', participants: ['Tom Oyoo', 'Pius Omondi', 'James Otieno', 'George Radak', 'Benson Otieno', 'Steve Ouma', 'Cosmas Were', 'Austin Ngode', 'Caleb Onyango'] },
    assignment3: { name: 'Assignment 3', participants: ['Paul Oduor', 'Roman Volkonidov', 'Wesley Omondi', 'Brian Oduor', 'Eliam Odhiambo', 'John Paul'] },
    sisters: { name: 'Sisters', participants: ['Neriah Ochimbo', 'Ruth Otieno', 'Susan Omondi', 'Benita Ogwel', 'Pheny Achieng', 'Faith Otieno', 'Leah Omollo', 'Saffron Omollo', 'Elcie Natija', 'Irene Oyoo', 'Pendo Oyoo', 'Nyarieko Oyoo', 'Jane Oyombra', 'Millicent Anyango', 'Monique Owiti', 'Rosemary Otieno', 'Jane Gumbo', 'Josephine Otieno', 'Valine Adhiambo', 'Jacklin Otieno', 'Violet Volkonidov', 'Emma Oyugi', 'Everlin Radak', 'Grace Onyango', 'Dorcas Achieng', 'Grace Atieno', 'Consolata Were', 'Winnie Oduor', 'Michell Oduor', 'Monica Nyang\'wera', 'Helen Odwar', 'Caren Akumu', 'Lucy Anyango', 'Vinril Ngode', 'Susan Otieno', 'Everline Atieno', 'Maximilla Auma'] },
    twak: { name: 'Twak', participants: ['Paul Oduor', 'Benedict Olweny', 'George Ochimbo'] },
    ngimawa: { name: 'Ngimawa (Elders)', participants: ['Tom Oyoo', 'Pius Omondi', 'James Otieno', 'George Radak', 'Benson Otieno'] },
    puonjruok_readers: { name: 'Puonjruok Readers', participants: ['Brian Oduor', 'Wesley Omondi', 'Paul Oduor', 'John Paul', 'Eliam Odhiambo'] },
    prayers: { name: 'Prayers (Lamo)', participants: ['Steve Ouma', 'Cosmas Were', 'Austin Ngode', 'Caleb Onyango', 'Benedict Olweny', 'Tom Oyoo', 'Pius Omondi', 'James Otieno', 'George Radak', 'Benson Otieno', 'Roman Volkonidov', 'Paul Oduor'] }
  });
  const [previousAssignments, setPreviousAssignments] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [newListName, setNewListName] = useState('');
  const [newParticipants, setNewParticipants] = useState('');
  const [firebase, setFirebase] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const printRef = useRef();

  // Modal states
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'warning' });
  const [promptModal, setPromptModal] = useState({ isOpen: false, title: '', message: '', defaultValue: '', onSubmit: null });
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'info' });

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

  // Initialize Firebase
  useEffect(() => {
    loadFirebase().then(fb => {
      setFirebase(fb);
      loadFromFirebase(fb);
    });
  }, []);

  // Load from Firebase
  const loadFromFirebase = async (fb) => {
    try {
      const database = fb.database();
      const snapshot = await database.ref('meetingSchedule').once('value');
      const data = snapshot.val();
      
      if (data) {
        if (data.weeks) setWeeks(data.weeks);
        if (data.participantLists) setParticipantLists(data.participantLists);
        if (data.previousAssignments) setPreviousAssignments(data.previousAssignments);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save to Firebase
  const saveToDatabase = async () => {
    if (!firebase) {
      showAlert('Firebase not initialized', 'error');
      return;
    }
    
    setSaving(true);
    try {
      const database = firebase.database();
      const data = {
        weeks,
        participantLists,
        previousAssignments: [...previousAssignments, ...weeks],
        savedAt: new Date().toISOString()
      };
      
      await database.ref('meetingSchedule').set(data);
      showToast('Schedule saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving data:', error);
      showAlert('Error saving schedule: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Predefined week template
  const createWeekTemplate = () => {
    const weekNumber = weeks.length + 1;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + (weekNumber - 1) * 7);
    
    return {
      id: Date.now(),
      title: `NGECHE ${weekNumber}`,
      dateRange: '',
      chairman: '',
      openingSong: '',
      openingPrayer: '',
      sections: [
        {
          id: Date.now() + 1,
          name: 'MWANDU MA YUDORE E WACH NYASAYE',
          type: 'mwandu',
          items: []
        },
        {
          id: Date.now() + 2,
          name: 'TIEGRI NE TIJ LENDO',
          type: 'tiegri',
          items: []
        },
        {
          id: Date.now() + 3,
          name: 'NGIMAWA KAKA JOKRISTO',
          type: 'ngimawa',
          items: [
            {
              id: Date.now() + 4,
              description: 'Puonjruok Muma e Kanyakla (Dak. 30)',
              type: 'puonjruok',
              participantList: 'ngimawa',
              secondaryList: 'puonjruok_readers',
              assignedName: '',
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
  };

  // Add an item to a section
  const addItem = (weekId, sectionId) => {
    setWeeks(weeks.map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          sections: week.sections.map(section => {
            if (section.id === sectionId) {
              return {
                ...section,
                items: [...section.items, {
                  id: Date.now(),
                  description: '',
                  type: 'regular',
                  participantList: null,
                  assignedName: '',
                  isDouble: false
                }]
              };
            }
            return section;
          })
        };
      }
      return week;
    }));
  };

  // Update functions
  const updateWeek = (weekId, field, value) => {
    setWeeks(weeks.map(week => 
      week.id === weekId ? { ...week, [field]: value } : week
    ));
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
                    if (field === 'participantList' && value === 'sisters') {
                      updates.isDouble = true;
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
  };

  // Delete functions
  const deleteWeek = (weekId) => {
    setWeeks(weeks.filter(week => week.id !== weekId));
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
  };

  // Edit participant list
  const updateParticipantList = (key, participants) => {
    setParticipantLists({
      ...participantLists,
      [key]: {
        ...participantLists[key],
        participants
      }
    });
  };

  // Rotation algorithm
  const performRotation = () => {
    const assignments = {};
    const sisterPairs = new Set();
    const lastAssignments = {};

    weeks.forEach(week => {
      const weekAssignments = {};
      
      // Assign chairman
      if (!week.chairman && participantLists.chairmen) {
        week.chairman = findNextAvailable(participantLists.chairmen.participants, weekAssignments, assignments, lastAssignments.chairmen);
        lastAssignments.chairmen = week.chairman;
      }
      
      // Assign prayers
      if (!week.openingPrayer && participantLists.prayers) {
        week.openingPrayer = findNextAvailable(participantLists.prayers.participants, weekAssignments, assignments, lastAssignments.openingPrayer);
        weekAssignments[week.openingPrayer] = true;
      }
      
      week.sections.forEach(section => {
        section.items.forEach(item => {
          if (item.participantList && participantLists[item.participantList]) {
            const list = participantLists[item.participantList].participants;
            let assigned = '';

            if (item.isDouble) {
              // Handle sister pairs
              let pair = findSisterPair(list, weekAssignments, sisterPairs, lastAssignments);
              assigned = pair.join(' / ');
              pair.forEach(name => {
                weekAssignments[name] = true;
                if (!assignments[name]) assignments[name] = [];
                assignments[name].push({ week: week.id, count: assignments[name].length });
              });
              sisterPairs.add(pair.sort().join('|'));
            } else {
              // Single assignment
              const name = findNextAvailable(list, weekAssignments, assignments, lastAssignments[item.participantList]);
              assigned = name;
              weekAssignments[name] = true;
              if (!assignments[name]) assignments[name] = [];
              assignments[name].push({ week: week.id, count: assignments[name].length });
              lastAssignments[item.participantList] = name;
            }

            item.assignedName = assigned;
            
            // Handle secondary assignment (for Puonjruok)
            if (item.secondaryList && participantLists[item.secondaryList]) {
              const secondaryName = findNextAvailable(
                participantLists[item.secondaryList].participants, 
                weekAssignments, 
                assignments, 
                lastAssignments[item.secondaryList]
              );
              item.assignedSecondary = secondaryName;
              weekAssignments[secondaryName] = true;
              lastAssignments[item.secondaryList] = secondaryName;
            }
          }
        });
      });
      
      // Assign closing prayer
      if (!week.closingPrayer && participantLists.prayers) {
        week.closingPrayer = findNextAvailable(
          participantLists.prayers.participants.filter(p => p !== week.openingPrayer), 
          weekAssignments, 
          assignments, 
          lastAssignments.closingPrayer
        );
      }
    });

    setWeeks([...weeks]);
  };

  // Helper function to find next available person
  const findNextAvailable = (list, weekAssignments, allAssignments, lastUsed) => {
    const sorted = list.sort((a, b) => {
      const countA = allAssignments[a]?.length || 0;
      const countB = allAssignments[b]?.length || 0;
      return countA - countB;
    });

    for (const name of sorted) {
      if (!weekAssignments[name] && name !== lastUsed) {
        return name;
      }
    }

    return sorted[0];
  };

  // Helper function to find sister pairs
  const findSisterPair = (list, weekAssignments, usedPairs, allAssignments) => {
    const available = list.filter(name => !weekAssignments[name]);
    
    for (let i = 0; i < available.length - 1; i++) {
      for (let j = i + 1; j < available.length; j++) {
        const pairKey = [available[i], available[j]].sort().join('|');
        if (!usedPairs.has(pairKey)) {
          return [available[i], available[j]];
        }
      }
    }

    if (available.length >= 2) {
      return [available[0], available[1]];
    }

    return list.slice(0, 2);
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  const getSectionHeaderClass = (type) => {
    switch(type) {
      case 'mwandu': return 'bg-gray-600 text-white';
      case 'tiegri': return 'bg-yellow-700 text-white';
      case 'ngimawa': return 'bg-red-800 text-white';
      default: return 'bg-gray-300';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Meeting Schedule Manager</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <Eye size={20} />
            {showPreview ? 'Edit Mode' : 'Preview'}
          </button>
          <button
            onClick={performRotation}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            <RotateCw size={20} />
            Auto Assign
          </button>
          <button
            onClick={saveToDatabase}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            <Printer size={20} />
            Print
          </button>
        </div>
      </div>

      {/* Participant Lists Management */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <Users size={20} />
          Participant Lists
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(participantLists).map(([key, list]) => (
            <div key={key} className="p-3 bg-white rounded shadow">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium">{list.name}</h3>
                  <p className="text-sm text-gray-600">{list.participants.length} participants</p>
                </div>
                <button
                  onClick={() => setEditingList(editingList === key ? null : key)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <Edit2 size={16} />
                </button>
              </div>
              {editingList === key && (
                <div className="mt-2">
                  <textarea
                    value={list.participants.join(', ')}
                    onChange={(e) => {
                      const participants = e.target.value.split(',').map(p => p.trim()).filter(p => p);
                      updateParticipantList(key, participants);
                    }}
                    className="w-full p-2 border rounded text-sm"
                    rows="3"
                  />
                  <button
                    onClick={() => setEditingList(null)}
                    className="mt-2 text-sm text-green-600 hover:text-green-800"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className={showPreview ? 'preview-mode' : ''} ref={printRef}>
        {showPreview ? (
          // Preview Mode
          <div className="bg-white p-8 rounded shadow schedule-preview">
            {weeks.map(week => (
              <div key={week.id} className="mb-8 page-break">
                <h2 className="text-2xl font-bold mb-2">{week.dateRange} {week.title}</h2>
                {week.chairman && <div className="font-bold mb-2">JAKOM: {week.chairman}</div>}
                {week.openingSong && <div className="mb-1">Wer {week.openingSong}</div>}
                {week.openingPrayer && <div className="mb-3">Lamo: {week.openingPrayer}</div>}
                
                {week.sections.map(section => (
                  <div key={section.id} className="mb-6">
                    {section.name && (
                      <div className={`p-3 mb-3 -mx-8 ${getSectionHeaderClass(section.type)}`}>
                        {section.name}
                      </div>
                    )}
                    <div className="ml-4">
                      {section.items.map(item => (
                        <div key={item.id} className="flex justify-between mb-2">
                          <span>{item.description}</span>
                          <span className="font-bold">
                            {item.assignedName}
                            {item.assignedSecondary && ` / ${item.assignedSecondary}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {week.closingSong && <div className="mt-4">Wer {week.closingSong}</div>}
                {week.closingPrayer && <div>Lamo: {week.closingPrayer}</div>}
              </div>
            ))}
          </div>
        ) : (
          // Edit Mode
          <div>
            {weeks.map(week => (
              <div key={week.id} className="mb-6 p-4 border rounded">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex gap-2 flex-1">
                    <input
                      type="text"
                      value={week.title}
                      onChange={(e) => updateWeek(week.id, 'title', e.target.value)}
                      className="px-3 py-2 border rounded font-semibold"
                      placeholder="Week title (e.g., NGECHE 21)"
                    />
                    <input
                      type="text"
                      value={week.dateRange}
                      onChange={(e) => updateWeek(week.id, 'dateRange', e.target.value)}
                      className="px-3 py-2 border rounded"
                      placeholder="Date range (e.g., JULY 7-13)"
                    />
                  </div>
                  <button
                    onClick={() => deleteWeek(week.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                {/* Week Details */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="flex gap-2 items-center">
                    <label className="font-medium">Jakom:</label>
                    <select
                      value={week.chairman || ''}
                      onChange={(e) => updateWeek(week.id, 'chairman', e.target.value)}
                      className="flex-1 px-2 py-1 border rounded"
                    >
                      <option value="">Select chairman...</option>
                      {participantLists.chairmen.participants.map(name => (
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
                      className="w-20 px-2 py-1 border rounded"
                      placeholder="e.g., 98"
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    <label className="font-medium">Opening Prayer:</label>
                    <select
                      value={week.openingPrayer || ''}
                      onChange={(e) => updateWeek(week.id, 'openingPrayer', e.target.value)}
                      className="flex-1 px-2 py-1 border rounded"
                    >
                      <option value="">Select...</option>
                      {participantLists.prayers.participants.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2 items-center">
                    <label className="font-medium">Closing Song:</label>
                    <input
                      type="text"
                      value={week.closingSong || ''}
                      onChange={(e) => updateWeek(week.id, 'closingSong', e.target.value)}
                      className="w-20 px-2 py-1 border rounded"
                      placeholder="e.g., 72"
                    />
                  </div>
                </div>

                {/* Sections */}
                {week.sections.map(section => (
                  <div key={section.id} className="mb-4 ml-4 p-3 bg-gray-50 rounded">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex gap-2 flex-1">
                        <input
                          type="text"
                          value={section.name}
                          onChange={(e) => updateSection(week.id, section.id, 'name', e.target.value)}
                          className="px-3 py-2 border rounded font-medium"
                          placeholder="Section name"
                        />
                        <select
                          value={section.type}
                          onChange={(e) => updateSection(week.id, section.id, 'type', e.target.value)}
                          className="px-3 py-2 border rounded"
                        >
                          <option value="custom">Custom</option>
                          <option value="mwandu">Mwandu</option>
                          <option value="tiegri">Tiegri</option>
                          <option value="ngimawa">Ngimawa</option>
                        </select>
                      </div>
                      <button
                        onClick={() => deleteSection(week.id, section.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {/* Items */}
                    {section.items.map(item => (
                      <div key={item.id} className="mb-2 ml-4 flex gap-2 items-center">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(week.id, section.id, item.id, 'description', e.target.value)}
                          className="flex-1 px-2 py-1 border rounded text-sm"
                          placeholder="Item description"
                        />
                        <select
                          value={item.participantList || ''}
                          onChange={(e) => updateItem(week.id, section.id, item.id, 'participantList', e.target.value)}
                          className="px-2 py-1 border rounded text-sm"
                        >
                          <option value="">Select list...</option>
                          {Object.entries(participantLists).map(([key, list]) => (
                            <option key={key} value={key}>{list.name}</option>
                          ))}
                        </select>
                        {item.type === 'puonjruok' && (
                          <select
                            value={item.secondaryList || ''}
                            onChange={(e) => updateItem(week.id, section.id, item.id, 'secondaryList', e.target.value)}
                            className="px-2 py-1 border rounded text-sm"
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
                          className="px-2 py-1 border rounded text-sm w-32"
                          placeholder="Assigned..."
                        />
                        {item.secondaryList && (
                          <input
                            type="text"
                            value={item.assignedSecondary || ''}
                            onChange={(e) => updateItem(week.id, section.id, item.id, 'assignedSecondary', e.target.value)}
                            className="px-2 py-1 border rounded text-sm w-32"
                            placeholder="Reader..."
                          />
                        )}
                        <button
                          onClick={() => deleteItem(week.id, section.id, item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={() => addItem(week.id, section.id)}
                      className="mt-2 text-blue-500 hover:text-blue-700 text-sm flex items-center gap-1"
                    >
                      <Plus size={16} /> Add Item
                    </button>
                  </div>
                ))}

                {/* Closing Prayer */}
                <div className="mt-4 flex gap-2 items-center text-sm">
                  <label className="font-medium">Closing Prayer:</label>
                  <select
                    value={week.closingPrayer || ''}
                    onChange={(e) => updateWeek(week.id, 'closingPrayer', e.target.value)}
                    className="flex-1 px-2 py-1 border rounded"
                  >
                    <option value="">Select...</option>
                    {participantLists.prayers.participants.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => addSection(week.id)}
                  className="mt-4 text-green-500 hover:text-green-700 flex items-center gap-1"
                >
                  <Plus size={18} /> Add Section
                </button>
              </div>
            ))}

            <button
              onClick={addWeek}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
            >
              <Plus size={20} /> Add Week
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .schedule-preview, .schedule-preview * {
            visibility: visible;
          }
          .schedule-preview {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .page-break {
            page-break-before: always;
          }
          .page-break:first-child {
            page-break-before: avoid;
          }
        }
      `}</style>

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