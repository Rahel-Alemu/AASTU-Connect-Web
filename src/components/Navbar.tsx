import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, signIn, signOut } from '../lib/firebase.ts';
import { useAuthState } from 'react-firebase-hooks/auth';
import { 
  Users, 
  PlusCircle, 
  Wallet, 
  LogOut, 
  LogIn, 
  BookOpen,
  LayoutDashboard
} from 'lucide-react';
import { APP_NAME } from '../constants.ts';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase.ts';

export const Navbar = () => {
  const [user] = useAuthState(auth);
  const [balance, setBalance] = React.useState<number | null>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      const unsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
        if (doc.exists()) {
          setBalance(doc.data().balance);
        }
      });
      return () => unsub();
    }
  }, [user]);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-blue-600">
          <BookOpen className="w-6 h-6" />
          <span>{APP_NAME}</span>
        </Link>

        <div className="flex items-center gap-6 text-sm font-medium">
          <Link to="/" className="text-gray-600 hover:text-blue-600 flex items-center gap-1">
            <LayoutDashboard className="w-4 h-4" />
            <span>Feed</span>
          </Link>
          
          {user ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full border border-yellow-200">
                <Wallet className="w-4 h-4" />
                <span>{balance !== null ? `${balance} ETB` : '...'}</span>
              </div>
              <div className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 overflow-hidden border border-blue-200">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-4 h-4" />
                  )}
                </div>
                <span className="text-gray-700 max-w-[100px] truncate hidden sm:inline">
                  {user.displayName?.split(' ')[0]}
                </span>
                <button 
                  onClick={() => signOut()}
                  className="p-1 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <button 
              onClick={() => signIn()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
