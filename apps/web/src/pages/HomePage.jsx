
import React from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header.jsx';
import { ShieldCheck, Zap, Users, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/30">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto text-center"
            >
              <div className="inline-flex items-center px-3 py-1 mb-8 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium tracking-wide">
                <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                Next Generation Mobility Management
              </div>
              
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground mb-8 text-balance leading-[1.1]">
                Manage Your Mobility Association with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Absolute Control</span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed text-balance">
                Secure, multi-tenant platform designed for transport associations. Streamline member payments, track parkings, and boost revenue collection instantly.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link 
                  to="/login" 
                  className="w-full sm:w-auto px-8 py-4 rounded-full bg-primary text-primary-foreground font-bold text-lg hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  Enter Portal <ArrowRight className="w-5 h-5" />
                </Link>
                <a 
                  href="#features" 
                  className="w-full sm:w-auto px-8 py-4 rounded-full bg-secondary/10 text-secondary hover:bg-secondary/20 font-bold text-lg transition-all flex items-center justify-center"
                >
                  Learn More
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section - Zig Zag Layout */}
        <section id="features" className="py-24 bg-card/50 border-y border-border/50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 text-balance">
                Engineered for Performance and Security
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Everything you need to run a modern transport association, built into one seamless, ultra-secure platform.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center mb-24">
              <div className="order-2 md:order-1">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Multi-Tenant Architecture</h3>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  Complete data isolation for every association. Your members, payments, and parkings are cryptographically separated from other tenants, ensuring absolute privacy and security.
                </p>
              </div>
              <div className="order-1 md:order-2 relative">
                <div className="aspect-square md:aspect-[4/3] rounded-3xl bg-gradient-to-br from-primary/20 to-background border border-border overflow-hidden flex items-center justify-center p-8 relative shadow-2xl">
                  {/* Abstract visualization */}
                  <div className="w-full h-full border border-primary/30 rounded-xl relative overflow-hidden backdrop-blur-sm bg-background/50">
                     <div className="absolute top-4 left-4 right-4 h-8 bg-card rounded flex items-center px-3 gap-2">
                        <div className="w-3 h-3 rounded-full bg-destructive/80"></div>
                        <div className="w-3 h-3 rounded-full bg-primary/80"></div>
                        <div className="w-3 h-3 rounded-full bg-secondary/80"></div>
                     </div>
                     <div className="absolute top-16 left-4 right-4 bottom-4 flex gap-4">
                        <div className="w-1/3 bg-card rounded-lg border border-border"></div>
                        <div className="w-2/3 bg-card rounded-lg border border-border opacity-50"></div>
                     </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center">
              <div className="relative">
                <div className="aspect-square md:aspect-[4/3] rounded-3xl bg-gradient-to-bl from-secondary/20 to-background border border-border overflow-hidden flex items-center justify-center p-8 relative shadow-2xl">
                   {/* Abstract visualization */}
                   <div className="w-full h-full flex flex-col gap-3 justify-center">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 w-full bg-card rounded-xl border border-border flex items-center px-4 gap-4">
                          <div className="w-8 h-8 rounded-full bg-secondary/20"></div>
                          <div className="h-4 w-32 bg-muted rounded"></div>
                          <div className="h-4 w-16 bg-muted rounded ml-auto"></div>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
              <div>
                <div className="w-16 h-16 rounded-2xl bg-secondary/20 flex items-center justify-center mb-6">
                  <Zap className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Instant QR Collection</h3>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  Equip your agents with lightning-fast mobile scanning. Process daily payments in seconds, generating immutable digital receipts instantly on the spot.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-background border-t border-border py-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <span className="font-bold text-primary-foreground text-xs">A</span>
            </div>
            <span className="font-bold text-foreground">Alika Mobility</span>
          </div>
          <p className="text-muted-foreground text-sm">
            © 2026 Alika Mobility. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
