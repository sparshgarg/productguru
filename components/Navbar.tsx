import React from 'react';
import { User } from '../types';
import { LogOut, Award, User as UserIcon, BrainCircuit } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">Product Guru</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {user && (
              <>
                <div className="hidden md:flex flex-col items-end mr-2">
                  <span className="text-sm font-medium text-slate-900">{user.name}</span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Award className="w-3 h-3 text-orange-500" />
                    Streak: {user.streak}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
