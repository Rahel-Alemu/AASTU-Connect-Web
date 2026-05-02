import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  doc, 
  getDoc, 
  collection, 
  onSnapshot, 
  orderBy, 
  query, 
  addDoc, 
  serverTimestamp, 
  updateDoc,
  increment
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase.ts';
import { useAuthState } from 'react-firebase-hooks/auth';
import { 
  ChevronLeft, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Lock, 
  Send,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { verifySolution } from '../lib/gemini.ts';
import { motion, AnimatePresence } from 'motion/react';

export const AssignmentDetails = () => {
  const { id } = useParams();
  const [user] = useAuthState(auth);
  const [assignment, setAssignment] = React.useState<any>(null);
  const [solutions, setSolutions] = React.useState<any[]>([]);
  const [newSolution, setNewSolution] = React.useState('');
  const [solutionImage, setSolutionImage] = React.useState<string | null>(null);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [unlockedSolutions, setUnlockedSolutions] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!id) return;

    const unsubAssignment = onSnapshot(doc(db, 'assignments', id), (doc) => {
      setAssignment({ id: doc.id, ...doc.data() });
      setLoading(false);
    });

    const q = query(collection(db, 'assignments', id, 'solutions'), orderBy('createdAt', 'desc'));
    const unsubSolutions = onSnapshot(q, (snapshot) => {
      setSolutions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubAssignment();
      unsubSolutions();
    };
  }, [id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSolutionImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const submitSolution = async () => {
    if (!id || !user || !assignment) return;
    setIsVerifying(true);

    try {
      // 1. AI Verification
      const aiResult = await verifySolution(
        assignment.title,
        assignment.description,
        assignment.imageUrl,
        newSolution,
        solutionImage
      );

      // 2. Add Solution to Firestore
      await addDoc(collection(db, 'assignments', id, 'solutions'), {
        assignmentId: id,
        solverId: user.uid,
        solverName: user.displayName,
        content: newSolution,
        imageUrl: solutionImage,
        aiVerificationResult: aiResult.status,
        aiFeedback: aiResult.feedback,
        status: aiResult.status === 'Correct' ? 'accepted' : 'pending',
        createdAt: serverTimestamp(),
      });

      // 3. (Optional) Auto-reward if correct
      if (aiResult.status === 'Correct' && assignment.authorId !== user.uid) {
        // Here we would ideally do a transaction
        // Simplify for prototype:
        await updateDoc(doc(db, 'assignments', id), { status: 'solved' });
        await updateDoc(doc(db, 'users', user.uid), { balance: increment(assignment.rewardAmount) });
        await updateDoc(doc(db, 'users', assignment.authorId), { balance: increment(-assignment.rewardAmount) });
      }

      setNewSolution('');
      setSolutionImage(null);
      alert(aiResult.status === 'Correct' ? 'Success! Your solution was verified as correct and you received the reward.' : 'Solution posted! AI marked it as ' + aiResult.status);
    } catch (err) {
      console.error(err);
      alert('Failed to submit solution');
    } finally {
      setIsVerifying(false);
    }
  };

  const unlockSolution = async (solution: any) => {
    if (!user) return;
    const FEE = 5; // Fixed fee to unlock

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if ((userDoc.data()?.balance || 0) < FEE) {
        alert('Insufficient balance. You need at least 5 ETB to unlock this solution.');
        return;
      }

      // Update balances
      await updateDoc(doc(db, 'users', user.uid), { balance: increment(-FEE) });
      await updateDoc(doc(db, 'users', solution.solverId), { balance: increment(FEE) });
      
      setUnlockedSolutions(prev => [...prev, solution.id]);
    } catch (err) {
      console.error(err);
      alert('Failed to unlock solution');
    }
  };

  if (loading) return <div className="animate-pulse flex space-y-4 flex-col pt-20"><div className="h-8 bg-gray-200 rounded w-1/2"></div><div className="h-32 bg-gray-200 rounded"></div></div>;
  if (!assignment) return <div>Assignment not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link to="/" className="flex items-center gap-1 text-blue-600 font-medium hover:underline">
        <ChevronLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase">
              <Clock className="w-3 h-3" />
              <span>Posted Recently</span>
              <span className="text-gray-300">•</span>
              <span>{assignment.department}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{assignment.title}</h1>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">{assignment.rewardAmount} ETB</div>
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Reward</div>
          </div>
        </div>

        <div className="markdown-body prose prose-blue max-w-none text-gray-700 mb-8">
          <ReactMarkdown>{assignment.description}</ReactMarkdown>
        </div>

        {assignment.imageUrl && (
          <div className="rounded-2xl overflow-hidden border border-gray-100 mb-8">
            <img src={assignment.imageUrl} alt="Assignment" className="w-full" />
          </div>
        )}

        <div className="flex items-center justify-between pt-6 border-t border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              {assignment.authorName?.[0] || 'S'}
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900">{assignment.authorName || 'Anonymous Student'}</div>
              <div className="text-xs text-gray-400">Assignment Author</div>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-tight shadow-sm ${
            assignment.status === 'solved' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
          }`}>
            {assignment.status}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-gray-400" />
            Solutions ({solutions.length})
          </h2>
        </div>

        {/* Post Solution Section */}
        {assignment.authorId !== user?.uid && assignment.status !== 'solved' && (
          <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6">
            <h3 className="font-bold text-blue-800 mb-4">You can solve this!</h3>
            <textarea 
              className="w-full bg-white border border-blue-200 rounded-2xl p-4 min-h-[150px] outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm mb-4"
              placeholder="Write your explanation or step-by-step solution..."
              value={newSolution}
              onChange={(e) => setNewSolution(e.target.value)}
            />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <input 
                  type="file" 
                  id="solution-img" 
                  className="hidden" 
                  onChange={handleImageChange}
                />
                <label 
                  htmlFor="solution-img"
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-xl text-sm font-semibold cursor-pointer hover:bg-blue-100 transition-all"
                >
                  {solutionImage ? 'Image Attached' : 'Attach Solution Image'}
                </label>
                {solutionImage && (
                  <button onClick={() => setSolutionImage(null)} className="text-red-500 text-xs hover:underline">Remove</button>
                )}
              </div>
              <button 
                disabled={isVerifying || !newSolution}
                onClick={submitSolution}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
              >
                {isVerifying ? (
                  <><Sparkles className="w-4 h-4 animate-pulse" /> AI Verifying...</>
                ) : (
                  <><Send className="w-4 h-4" /> Submit Solution</>
                )}
              </button>
            </div>
            {isVerifying && (
              <p className="mt-3 text-xs text-blue-600 font-medium animate-pulse">
                Gemini AI is currently analyzing your solution against the assignment model/text...
              </p>
            )}
          </div>
        )}

        {/* Solutions List */}
        <div className="space-y-4">
          {solutions.map((sol) => {
            const isSolver = sol.solverId === user?.uid;
            const isAuthor = assignment.authorId === user?.uid;
            const isUnlocked = unlockedSolutions.includes(sol.id);
            const canSee = isSolver || isAuthor || isUnlocked;

            return (
              <motion.div 
                key={sol.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`w-4 h-4 ${sol.aiVerificationResult === 'Correct' ? 'text-green-500' : 'text-yellow-500'}`} />
                    <span className="text-sm font-bold text-gray-900">{sol.solverName}</span>
                    <span className="text-xs text-gray-400 font-medium uppercase px-2 py-0.5 bg-gray-50 rounded">Solution</span>
                  </div>
                  {sol.aiVerificationResult && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                      <Sparkles className="w-3 h-3" />
                      AI: {sol.aiVerificationResult}
                    </div>
                  )}
                </div>

                <div className={`relative ${!canSee ? 'h-24' : ''}`}>
                  <div className={!canSee ? 'blur-md select-none' : ''}>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{sol.content}</p>
                    {sol.imageUrl && canSee && (
                      <div className="mt-4 rounded-xl overflow-hidden border border-gray-100">
                        <img src={sol.imageUrl} alt="Solution" className="max-h-96 w-auto mx-auto" />
                      </div>
                    )}
                  </div>

                  {!canSee && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                      <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-gray-200 shadow-xl flex flex-col items-center gap-3">
                        <Lock className="w-6 h-6 text-blue-600" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-900 uppercase tracking-wider">Solution Locked</p>
                          <p className="text-[10px] text-gray-500">Pay a small fee to the solver to access this answer.</p>
                        </div>
                        <button 
                          onClick={() => unlockSolution(sol)}
                          className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                          Unlock for 5 ETB
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {sol.aiFeedback && canSee && (
                  <div className="mt-4 p-3 bg-purple-50 rounded-xl text-xs text-purple-700 border border-purple-100">
                    <div className="font-bold flex items-center gap-1 mb-1">
                      <Sparkles className="w-3 h-3" />
                      AI Feedback:
                    </div>
                    {sol.aiFeedback}
                  </div>
                )}
              </motion.div>
            );
          })}
          {solutions.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              No solutions yet. Be the first to solve it!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
