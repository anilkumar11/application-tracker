import { useState, useEffect } from 'react';
import { Plus, Zap, ChevronDown, Keyboard, LayoutGrid, Calendar, List, BarChart3, Moon, Sun, Tag, Archive } from 'lucide-react';
import DashboardOverview from './components/DashboardOverview';
import ApplicationsList from './components/ApplicationsList';
import CalendarView from './components/CalendarView';
import Analytics from './components/Analytics';
import TagsManagement from './components/TagsManagement';
import ArchiveView from './components/ArchiveView';
import ApplicationForm from './components/ApplicationForm';
import ApplicationDetail from './components/ApplicationDetail';
import QuickAddModal from './components/QuickAddModal';
import LandingPage from './components/LandingPage';
import LoginForm from './components/LoginForm';
import SignUpForm from './components/SignUpForm';
import type { ApplicationWithRelations } from './lib/database.types';
import { supabase } from './lib/supabase';
import { applicationApi } from './lib/api';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useTheme } from './contexts/ThemeContext';

type ViewType = 'dashboard' | 'applications' | 'calendar' | 'analytics' | 'tags' | 'archive';
type AuthView = 'landing' | 'login' | 'signup';

function App() {
  const { theme, toggleTheme } = useTheme();
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
  const [authView, setAuthView] = useState<AuthView>('landing');

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

  async function handleSignOut() {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setAuthView('landing');
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
    if (authView === 'landing') {
      return (
        <LandingPage
          onGetStarted={() => setAuthView('signup')}
          onSignIn={() => setAuthView('login')}
        />
      );
    }

    if (authView === 'login') {
      return (
        <LoginForm
          onBack={() => setAuthView('landing')}
          onSwitchToSignUp={() => setAuthView('signup')}
        />
      );
    }

    if (authView === 'signup') {
      return (
        <SignUpForm
          onBack={() => setAuthView('landing')}
          onSwitchToLogin={() => setAuthView('login')}
        />
      );
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Application Tracker</h1>
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
                onClick={toggleTheme}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setShowKeyboardHelp(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                title="Keyboard shortcuts"
              >
                <Keyboard className="w-5 h-5" />
              </button>

              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                currentView === 'dashboard'
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300'
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView('applications')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                currentView === 'applications'
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300'
              }`}
            >
              <List className="w-5 h-5" />
              Applications
            </button>
            <button
              onClick={() => setCurrentView('calendar')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                currentView === 'calendar'
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300'
              }`}
            >
              <Calendar className="w-5 h-5" />
              Calendar
            </button>
            <button
              onClick={() => setCurrentView('analytics')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                currentView === 'analytics'
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Analytics
            </button>
            <button
              onClick={() => setCurrentView('tags')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                currentView === 'tags'
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300'
              }`}
            >
              <Tag className="w-5 h-5" />
              Tags
            </button>
            <button
              onClick={() => setCurrentView('archive')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                currentView === 'archive'
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300'
              }`}
            >
              <Archive className="w-5 h-5" />
              Archive
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

        {currentView === 'analytics' && (
          <Analytics />
        )}

        {currentView === 'tags' && (
          <TagsManagement />
        )}

        {currentView === 'archive' && (
          <ArchiveView refreshTrigger={refreshTrigger} />
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
