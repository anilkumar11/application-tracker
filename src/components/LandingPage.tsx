import { Briefcase, Calendar, BarChart3, Zap, Moon, Shield, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export default function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  const features = [
    {
      icon: Briefcase,
      title: 'Track Applications',
      description: 'Organize and manage all your job applications in one central location with detailed status tracking.',
    },
    {
      icon: Calendar,
      title: 'Calendar View',
      description: 'Never miss an interview with integrated calendar views showing all your upcoming events and deadlines.',
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Gain insights into your job search with visual analytics and success metrics to optimize your strategy.',
    },
    {
      icon: Zap,
      title: 'Quick Add',
      description: 'Rapidly add new applications with keyboard shortcuts and smart forms that learn from your history.',
    },
    {
      icon: Moon,
      title: 'Dark Mode',
      description: 'Work comfortably at any time with seamless light and dark theme support throughout the application.',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is encrypted and stored securely with industry-standard authentication and privacy protection.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Briefcase className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Application Tracker</h1>
            </div>
            <button
              onClick={onSignIn}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 font-medium"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Streamline Your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400">
                Job Search Journey
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 leading-relaxed">
              Stay organized, track progress, and land your dream job with our comprehensive application management platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={onGetStarted}
                className="group flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold text-lg"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={onSignIn}
                className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-600 dark:hover:border-blue-400 hover:scale-105 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg font-semibold text-lg"
              >
                Sign In
              </button>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to Succeed
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Powerful features designed to help you manage your applications efficiently and effectively.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 hover:-translate-y-1"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <div className="bg-gradient-to-br from-blue-600 to-cyan-600 dark:from-blue-700 dark:to-cyan-700 rounded-2xl p-12 md:p-16 text-center shadow-2xl">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Take Control of Your Job Search?
            </h3>
            <p className="text-xl text-blue-50 mb-8 max-w-2xl mx-auto">
              Join thousands of job seekers who are staying organized and landing their dream positions.
            </p>
            <button
              onClick={onGetStarted}
              className="group flex items-center gap-2 mx-auto px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold text-lg"
            >
              Start Tracking Today
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-gray-900 dark:text-white">Application Tracker</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your job search, organized and simplified.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
