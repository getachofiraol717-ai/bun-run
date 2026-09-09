import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Smartphone, 
  Download, 
  Check, 
  Sparkles, 
  Terminal, 
  Layers, 
  ExternalLink,
  ShieldCheck,
  Copy,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import JSZip from 'jszip';

interface AndroidInstallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AndroidInstallModal({ open, onOpenChange }: AndroidInstallModalProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      toast.success('App installed successfully on your Android device!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) {
      toast.info('To install on Android: Tap your browser menu (⋮) -> "Add to Home screen" or "Install App".');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      toast.success('Installing application to Android home screen...');
    }
    setDeferredPrompt(null);
  };

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    toast.success('Command copied to clipboard!');
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  const downloadApkBuildPackage = async () => {
    try {
      const zip = new JSZip();
      
      const capConfig = `import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zipmerge.harmony',
  appName: 'Knowledge Universe',
  webDir: 'dist',
  server: {
    cleartext: true,
  },
};

export default config;
`;
      zip.file('capacitor.config.ts', capConfig);
      
      const instructions = `# Android APK Build Guide (Capacitor & Android Studio)

Follow these steps on your local machine to build an installable .apk for Android:

## Prerequisites
- Node.js installed
- Android Studio installed with Android SDK (API level 33+)

## Steps:
1. Extract this folder into your project root.
2. Run Capacitor Android sync:
   \`\`\`bash
   npm run build
   npx cap add android
   npx cap sync android
   \`\`\`
3. Open the native Android project in Android Studio:
   \`\`\`bash
   npx cap open android
   \`\`\`
4. In Android Studio:
   - Click **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**
   - The compiled \`app-debug.apk\` will be created in \`android/app/build/outputs/apk/debug/\`.
5. Transfer and install \`app-debug.apk\` on any Android phone!
`;
      zip.file('ANDROID_APK_BUILD_GUIDE.md', instructions);

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'KnowledgeUniverse_Android_APK_Source.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Downloaded Android APK build configuration zip!');
    } catch (e) {
      toast.error('Failed to generate APK config file.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-background border-border sm:rounded-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold font-orbitron">
                  Install on Android Device
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Run natively on your Android smartphone or tablet.
                </DialogDescription>
              </div>
            </div>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-xs">
              Android Compatible
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="pwa" className="mt-2 space-y-4">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="pwa" className="text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 mr-1.5 text-cyan-400" />
              1-Click PWA App
            </TabsTrigger>
            <TabsTrigger value="apk" className="text-xs font-semibold">
              <Terminal className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
              Build Native .APK
            </TabsTrigger>
          </TabsList>

          {/* PWA Direct Installation */}
          <TabsContent value="pwa" className="space-y-4 pt-1">
            <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
                <ShieldCheck className="h-5 w-5" />
                <span>Instant Android App Installation</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Installs directly to your Android Home Screen and App Drawer without downloading external files. Includes offline mode, fast launching, and full screen experience.
              </p>

              {isInstalled ? (
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                  <Check className="h-4 w-4" /> App is already installed on this device!
                </div>
              ) : (
                <Button
                  onClick={handleInstallPwa}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs py-2.5"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Install App to Android Home Screen
                </Button>
              )}
            </div>

            <div className="space-y-2 text-xs text-muted-foreground bg-muted/30 p-3.5 rounded-xl border border-border">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Info className="h-4 w-4 text-cyan-400" />
                Manual Android Chrome / Edge Installation Steps:
              </div>
              <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] leading-relaxed">
                <li>Open this app URL in <strong>Google Chrome</strong> or <strong>Samsung Internet</strong> on Android.</li>
                <li>Tap the <strong>three dots menu (⋮)</strong> at top right.</li>
                <li>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                <li>Launch Knowledge Universe directly from your phone's home screen!</li>
              </ol>
            </div>
          </TabsContent>

          {/* Native APK Compilation Guide */}
          <TabsContent value="apk" className="space-y-4 pt-1">
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                This project comes pre-configured with <strong>Capacitor 8</strong> for Android. You can generate a native <code className="text-emerald-400 font-mono">.apk</code> file in 3 simple commands:
              </p>

              <div className="space-y-2 font-mono text-xs">
                {[
                  { label: '1. Build Web Assets & Sync Capacitor', cmd: 'npm run cap:build' },
                  { label: '2. Add Android Platform Target', cmd: 'npx cap add android' },
                  { label: '3. Open in Android Studio & Compile APK', cmd: 'npx cap open android' },
                ].map((item, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-black/50 border border-border flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-muted-foreground font-sans mb-0.5">{item.label}</div>
                      <span className="text-emerald-400">{item.cmd}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyCommand(item.cmd)}
                      className="h-7 text-xs"
                    >
                      {copiedCmd === item.cmd ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-between">
                <Button
                  onClick={downloadApkBuildPackage}
                  variant="outline"
                  className="w-full text-xs border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Android Studio Project Zip Config
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="border-t border-border pt-3">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
