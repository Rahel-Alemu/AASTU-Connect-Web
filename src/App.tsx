import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from './lib/firebase.ts';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Navbar } from './components/Navbar.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { AssignmentDetails } from './pages/AssignmentDetails.tsx';
import { STARTING_BALANCE } from './constants.ts';

export default function App() {
  const [user, loading] = useAuthState(auth);

  React.useEffect(() => {
    if (user) {
      const syncUser = async () => {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            balance: STARTING_BALANCE,
            createdAt: serverTimestamp(),
          });
        }
      };
      syncUser();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/assignment/:id" element={<AssignmentDetails />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        
        <footer className="bg-white border-t border-gray-200 py-8 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} AASTU Connect - Empowering Engineering Students</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}
