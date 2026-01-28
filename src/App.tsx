import { useState, useEffect } from 'react';
import { Plus, Zap, ChevronDown, Keyboard, LayoutGrid, Calendar, List } from 'lucide-react';
import DashboardOverview from './components/DashboardOverview';
import ApplicationsList from './components/ApplicationsList';
import CalendarView from './components/CalendarView';
import ApplicationForm from './components/ApplicationForm';
import ApplicationDetail from './components/ApplicationDetail';
import QuickAddModal from './components/QuickAddModal';
import type { ApplicationWithRelations } from './lib/database.types';
import { supabase } from './lib/supabase';
import { applicationApi } from './lib/api';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

type ViewType = 'dashboard' | 'applications' | 'calendar';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [showForm, setShowForm] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithRelations | null>(null);
  const [editingApplication, setEditingApplication] = useState<ApplicationWithRelations | null>(null);
  const [recentApplications, setRecentApplications] = useState<ApplicationWithRelations[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      (() => {
        setIsAuthenticated(!!session);
      })();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadRecentApplications();
    }
  }, [isAuthenticated, refreshTrigger]);

  useKeyboardShortcuts({
    onQuickAdd: () => {
      if (isAuthenticated && !showForm && !selectedApplication) {
        setShowQuickAdd(true);
      }
    },
    onFullAdd: () => {
      if (isAuthenticated && !showQuickAdd && !selectedApplication) {
        setShowForm(true);
      }
    },
    onEscape: () => {
      if (showKeyboardHelp) {
        setShowKeyboardHelp(false);
      } else if (showQuickAdd) {
        setShowQuickAdd(false);
      } else if (showForm) {
        handleCloseForm();
      } else if (selectedApplication) {
        handleCloseDetail();
      }
    },
  });

  async function loadRecentApplications() {
    try {
      const apps = await applicationApi.getAll();
      setRecentApplications(apps.slice(0, 10));
    } catch (error) {
      console.error('Error loading recent applications:', error);
    }
  }

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert('Account created successfully! Please sign in.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
  }

  function handleRefresh() {
    setRefreshTrigger((prev) => prev + 1);
  }

  function handleSelectApplication(application: ApplicationWithRelations) {
    setSelectedApplication(application);
  }

  function handleEditApplication(application: ApplicationWithRelations) {
    setSelectedApplication(null);
    setEditingApplication(application);
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditingApplication(null);
    setShowAddDropdown(false);
  }

  function handleCloseQuickAdd() {
    setShowQuickAdd(false);
    setShowAddDropdown(false);
  }

  function handleCloseDetail() {
    setSelectedApplication(null);
  }

  function handleFormSuccess() {
    handleRefresh();
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Tracker</h1>
            <p className="text-gray-600">Track your job applications with ease</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {authLoading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>

            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-sm text-blue-600 hover:text-blue-700 hover:underline transition-all duration-150"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-900">Job Tracker</h1>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowAddDropdown(!showAddDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Add Application</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showAddDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <button
                      onClick={() => {
                        setShowQuickAdd(true);
                        setShowAddDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left border-b border-gray-100"
                    >
                      <Zap className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-900">Quick Add</div>
                        <div className="text-xs text-gray-500">⌘K • Just essentials</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setShowForm(true);
                        setShowAddDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left"
                    >
                      <Plus className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-900">Full Form</div>
                        <div className="text-xs text-gray-500">⇧⌘A • All details</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowKeyboardHelp(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                title="Keyboard shortcuts"
              >
                <Keyboard className="w-5 h-5" />
              </button>

              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                currentView === 'dashboard'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView('applications')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                currentView === 'applications'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <List className="w-5 h-5" />
              Applications
            </button>
            <button
              onClick={() => setCurrentView('calendar')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                currentView === 'calendar'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calendar className="w-5 h-5" />
              Calendar
            </button>
          </div>
        </div>

        {currentView === 'dashboard' && (
          <DashboardOverview
            refreshTrigger={refreshTrigger}
          />
        )}

        {currentView === 'applications' && (
          <ApplicationsList
            onSelectApplication={handleSelectApplication}
            onEditApplication={handleEditApplication}
            refreshTrigger={refreshTrigger}
          />
        )}

        {currentView === 'calendar' && (
          <CalendarView
            refreshTrigger={refreshTrigger}
          />
        )}
      </main>

      {showQuickAdd && (
        <QuickAddModal
          onClose={handleCloseQuickAdd}
          onSuccess={handleFormSuccess}
        />
      )}

      {showForm && (
        <ApplicationForm
          application={editingApplication || undefined}
          recentApplications={recentApplications}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}

      {selectedApplication && (
        <ApplicationDetail
          application={selectedApplication}
          onClose={handleCloseDetail}
          onEdit={() => handleEditApplication(selectedApplication)}
          onRefresh={handleRefresh}
        />
      )}

      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Keyboard Shortcuts</h3>
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Quick Add</span>
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono">⌘K</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Full Form</span>
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono">⇧⌘A</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Close Modal</span>
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono">Esc</kbd>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              On Windows/Linux, use Ctrl instead of ⌘
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
