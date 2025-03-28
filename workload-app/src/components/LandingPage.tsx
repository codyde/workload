import React, { useState } from 'react';
import { ArrowRight, Code2 } from 'lucide-react';
import { LoginDialog } from './LoginDialog';
import { useAuthStore } from '../store/authStore';

export function LandingPage() {
  const [showLogin, setShowLogin] = useState(false);
  const user = useAuthStore((state) => state.user);

  return (
    <div className="min-h-screen bg-background">
      <div 
        className="relative bg-cover bg-center"
        style={{
          backgroundImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.9)), url("https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80")',
          height: '100vh'
        }}
      >
        <header className="absolute top-0 left-0 right-0 z-10">
          <div className="container mx-auto px-4 py-6 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Code2 size={32} className="text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Workload</h1>
            </div>
            <button
              onClick={() => setShowLogin(true)}
              className="px-4 py-2 rounded-md bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors text-primary"
            >
              {user ? user.email : 'Login'}
            </button>
          </div>
        </header>

        <div className="container mx-auto px-4 h-full">
          <div className="h-full flex items-center">
            <div className="max-w-2xl">
              <h1 className="text-7xl font-bold mb-6 text-foreground">
                Master Your
                <span className="block mt-2 bg-gradient-to-r from-primary via-[#4F46E5] to-[#9333EA] text-transparent bg-clip-text">
                  Development Workflow
                </span>
              </h1>
              <p className="text-xl text-foreground/80 mb-12 max-w-xl">
                Take control of your development process with our powerful task tracking solution.
                Built by developers, for developers.
              </p>
              <div className="flex gap-6">
                <button
                  onClick={() => !user && setShowLogin(true)}
                  className="px-8 py-4 bg-primary text-primary-foreground rounded-md font-medium text-lg hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-lg shadow-primary/25"
                >
                  Get Started <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 py-24">
          <div className="bg-card/50 p-8 rounded-lg border border-border/50 backdrop-blur-sm">
            <h3 className="text-2xl font-semibold mb-4">Epic Management</h3>
            <p className="text-foreground/80 text-lg">
              Organize your projects into epics for better overview and management of
              related tasks.
            </p>
          </div>
          <div className="bg-card/50 p-8 rounded-lg border border-border/50 backdrop-blur-sm">
            <h3 className="text-2xl font-semibold mb-4">Task Tracking</h3>
            <p className="text-foreground/80 text-lg">
              Create and track tasks within epics, with rich text editing support for
              detailed descriptions.
            </p>
          </div>
          <div className="bg-card/50 p-8 rounded-lg border border-border/50 backdrop-blur-sm">
            <h3 className="text-2xl font-semibold mb-4">Modern Interface</h3>
            <p className="text-foreground/80 text-lg">
              Enjoy a beautiful, dark-themed interface designed for developer
              productivity.
            </p>
          </div>
        </div>
      </main>

      {showLogin && <LoginDialog onClose={() => setShowLogin(false)} />}
    </div>
  );
}