import React from 'react';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase.ts';
import { useAuthState } from 'react-firebase-hooks/auth';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Filter, Search, Tag } from 'lucide-react';
import { DEPARTMENTS, COLLEGES } from '../constants.ts';
import { AssignmentCard } from '../components/AssignmentCard.tsx';
import { PostModal } from '../components/PostModal.tsx';

export const Dashboard = () => {
  const [user] = useAuthState(auth);
  const [assignments, setAssignments] = React.useState<any[]>([]);
  const [selectedDept, setSelectedDept] = React.useState<string>('All');
  const [isPostModalOpen, setIsPostModalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    let q = query(collection(db, 'assignments'), orderBy('createdAt', 'desc'));
    
    if (selectedDept !== 'All') {
      q = query(collection(db, 'assignments'), where('department', '==', selectedDept), orderBy('createdAt', 'desc'));
    }

    const unsub = onSnapshot(q, (snapshot) => {
      setAssignments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [selectedDept]);

  const filteredAssignments = assignments.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg overflow-hidden relative">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-4 tracking-tight">Solve, Share, Earn.</h1>
          <p className="text-blue-100 text-lg max-w-2xl mb-6">
            The bridge between AASTU students. Post your hardest assignments and get high-quality solutions from your peers.
          </p>
          <button 
            onClick={() => user ? setIsPostModalOpen(true) : alert('Please sign in to post')}
            className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Post Assignment</span>
          </button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl overflow-x-auto no-scrollbar max-w-full">
          <button 
            onClick={() => setSelectedDept('All')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${selectedDept === 'All' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            All
          </button>
          {Object.entries(DEPARTMENTS).map(([college, depts]) => (
            <React.Fragment key={college}>
              {depts.map(dept => (
                <button 
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${selectedDept === dept ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {dept.split(' ')[0]}
                </button>
              ))}
            </React.Fragment>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search tasks..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredAssignments.map((assignment, index) => (
            <motion.div
              key={assignment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
            >
              <AssignmentCard assignment={assignment} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredAssignments.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">No assignments found</h3>
          <p className="text-gray-400">Try changing filters or search query.</p>
        </div>
      )}

      <PostModal isOpen={isPostModalOpen} onClose={() => setIsPostModalOpen(false)} />
    </div>
  );
};
