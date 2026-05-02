import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Tag, User, Banknote, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export const AssignmentCard = ({ assignment }: { assignment: any }) => {
  const isSolved = assignment.status === 'solved';
  
  return (
    <Link to={`/assignment/${assignment.id}`}>
      <motion.div 
        whileHover={{ y: -4 }}
        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all group h-full flex flex-col"
      >
        <div className="flex items-center justify-between mb-3">
          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
            isSolved ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {assignment.status}
          </span>
          <div className="flex items-center gap-1 text-sm font-bold text-gray-900">
            <Banknote className="w-4 h-4 text-green-600" />
            <span>{assignment.rewardAmount} ETB</span>
          </div>
        </div>

        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-1">
          {assignment.title}
        </h3>
        
        <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-1">
          {assignment.description}
        </p>

        {assignment.imageUrl && (
          <div className="w-full h-32 bg-gray-50 rounded-xl mb-4 overflow-hidden border border-gray-100">
            <img 
              src={assignment.imageUrl} 
              alt="Assignment" 
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
            />
          </div>
        )}

        <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Tag className="w-3 h-3" />
            <span>{assignment.department.split(' ')[0]}</span>
          </div>
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>{assignment.authorName || 'Student'}</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};
