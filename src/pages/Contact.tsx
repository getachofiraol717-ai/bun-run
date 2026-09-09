import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import GalaxyBackground from '@/components/GalaxyBackground';
import SEO from '@/components/SEO';
import { Mail, Phone, Send, CheckCircle } from 'lucide-react';

const Contact = () => {
  const { t } = useLanguage();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <div className="min-h-screen relative pt-20 pb-10 px-4">
      <SEO
        title="Contact — Knowledge Universe"
        description="Get in touch with the Knowledge Universe team for support, partnerships, or school onboarding."
        path="/contact"
      />
      <GalaxyBackground />
      <div className="max-w-4xl mx-auto relative z-10">
        <h2 className="sr-only">Contact information and form</h2>
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="font-orbitron text-3xl font-bold text-foreground mb-2">{t('contact')}</h1>
          <p className="text-muted-foreground font-poppins">Get in touch with Knowledge Universe</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Info */}
          <div className="space-y-6 animate-slide-up">
            <div className="glass rounded-2xl p-6 neon-glow">
              <Mail className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-orbitron text-sm font-semibold text-foreground mb-1">Email</h3>
              <a href="mailto:firaaevi83@gmail.com" className="text-sm text-primary font-poppins hover:underline">firaaevi83@gmail.com</a>
            </div>
            <div className="glass rounded-2xl p-6">
              <Phone className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-orbitron text-sm font-semibold text-foreground mb-1">Phone</h3>
              <a href="tel:+251978299738" className="text-sm text-primary font-poppins hover:underline block">+251 978 299 738</a>
              <a href="tel:+251982812278" className="text-sm text-primary font-poppins hover:underline block mt-1">+251 982 812 278</a>
            </div>
            <div className="glass rounded-2xl p-6">
              <h3 className="font-orbitron text-sm font-semibold text-foreground mb-2">Developer</h3>
              <p className="text-sm text-muted-foreground font-poppins">Firee Getacho</p>
              <p className="text-xs text-muted-foreground font-poppins mt-1">Empowering students in Oromiya through digital education technology.</p>
            </div>
          </div>

          {/* Form */}
          <div className="glass-strong rounded-2xl p-6 neon-glow animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {sent ? (
              <div className="text-center py-10 animate-slide-up">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="font-orbitron text-lg font-bold text-foreground">Message Sent!</p>
                <p className="text-sm text-muted-foreground font-poppins mt-1">We'll get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground font-poppins">{t('name')}</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                    className="w-full mt-1 px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground focus:border-primary outline-none font-poppins" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground font-poppins">{t('email')}</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
                    className="w-full mt-1 px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground focus:border-primary outline-none font-poppins" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground font-poppins">Message</label>
                  <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required rows={4}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground focus:border-primary outline-none font-poppins resize-none" />
                </div>
                <button type="submit" className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-orbitron font-bold text-sm neon-glow hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                  <Send className="h-4 w-4" /> {t('sendMessage')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
