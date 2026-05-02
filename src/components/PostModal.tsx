import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Info } from 'lucide-react';
import { db, auth } from '../lib/firebase.ts';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ALL_DEPARTMENTS } from '../constants.ts';

export const PostModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    department: ALL_DEPARTMENTS[0] as string,
    rewardAmount: 50,
  });
  const [image, setImage] = React.useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setLoading(true);

    try {
      await addDoc(collection(db, 'assignments'), {
        ...formData,
        imageUrl: image,
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName,
        status: 'open',
        createdAt: serverTimestamp(),
      });
      onClose();
      setFormData({ title: '', description: '', department: ALL_DEPARTMENTS[0], rewardAmount: 50 });
      setImage(null);
    } catch (err) {
      console.error(err);
      alert('Failed to post assignment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl w-full max-w-xl shadow-2xl relative overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Post New Assignment</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Assignment Title</label>
            <input 
              required
              type="text" 
              placeholder="e.g. Mechanical Engineering-1 Chapter 3 Drawing"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Department</label>
              <select 
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                {ALL_DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Reward (ETB)</label>
              <input 
                required
                type="number" 
                min="10"
                value={formData.rewardAmount}
                onChange={(e) => setFormData({ ...formData, rewardAmount: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Description</label>
            <textarea 
              required
              rows={4}
              placeholder="Describe the problem details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Upload Image (Optional)</label>
            <div className="relative border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors group">
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {image ? (
                <div className="relative group">
                  <img src={image} alt="Preview" className="max-h-40 mx-auto rounded-lg shadow-md" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                    <span className="text-white text-xs font-bold">Change Image</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto group-hover:text-blue-500" />
                  <p className="text-sm text-gray-500">Click or drag image of the question</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-blue-50 bg-opacity-50 rounded-xl flex gap-3 text-sm text-blue-700">
            <Info className="w-5 h-5 flex-shrink-0" />
            <p>The reward will be deducted from your balance once you accept a solution.</p>
          </div>

          <button 
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            {loading ? 'Posting...' : 'Create Assignment'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
