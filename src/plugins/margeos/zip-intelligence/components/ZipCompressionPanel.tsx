// @ts-nocheck
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Zap, 
  Sliders, 
  FileArchive, 
  Download, 
  Check, 
  ShieldCheck, 
  Layers, 
  FileText,
  HelpCircle,
  Archive
} from 'lucide-react';
import { Project } from '../models/ProjectModel';

export interface ZipCompressionSettings {
  compressionMethod: 'STORE' | 'DEFLATE';
  compressionLevel: number; // 1 to 9
  includeSummaryReport: boolean;
  excludeJunkFiles: boolean;
  customFilename: string;
}

interface ZipCompressionPanelProps {
  project: Project | null;
  settings: ZipCompressionSettings;
  onSettingsChange: (newSettings: ZipCompressionSettings) => void;
  onDownload: () => void;
  isDownloading: boolean;
}

export const PRESET_CONFIGS = [
  {
    id: 'stored',
    name: 'Stored (No Compression)',
    method: 'STORE' as const,
    level: 1,
    icon: Zap,
    desc: '⚡ Ultra-fast archiving. Files are packaged raw without CPU compression overhead.',
    badge: 'Fastest'
  },
  {
    id: 'deflate-balanced',
    name: 'Deflated (Standard - L6)',
    method: 'DEFLATE' as const,
    level: 6,
    icon: Layers,
    desc: '⚖️ Standard zip compression balance between speed and small file size (~65% reduction).',
    badge: 'Recommended'
  },
  {
    id: 'deflate-max',
    name: 'Deflated (Maximum - L9)',
    method: 'DEFLATE' as const,
    level: 9,
    icon: Archive,
    desc: '📦 Maximum compression ratio (~75%+ reduction). Ideal for distribution and archival.',
    badge: 'Smallest Size'
  }
];

export default function ZipCompressionPanel({
  project,
  settings,
  onSettingsChange,
  onDownload,
  isDownloading
}: ZipCompressionPanelProps) {
  const updateSetting = <K extends keyof ZipCompressionSettings>(
    key: K,
    value: ZipCompressionSettings[K]
  ) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  const applyPreset = (preset: typeof PRESET_CONFIGS[number]) => {
    onSettingsChange({
      ...settings,
      compressionMethod: preset.method,
      compressionLevel: preset.level
    });
  };

  const fileCount = project ? project.files.length : 0;
  const filteredCount = project && settings.excludeJunkFiles
    ? project.files.filter(f => !/node_modules|\.git|\.DS_Store|dist|build/i.test(f.path)).length
    : fileCount;

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2 font-orbitron">
                <Sliders className="h-5 w-5 text-cyan-400" />
                ZIP Merge & Compression Level Configurator
              </CardTitle>
              <CardDescription className="text-xs">
                Configure zip algorithms, compression level (Stored vs Deflated L1–L9), and payload parameters prior to archive consolidation.
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10">
              JSZip Engine Active
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Quick Presets */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Compression Presets
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {PRESET_CONFIGS.map((p) => {
                const Icon = p.icon;
                const isSelected =
                  settings.compressionMethod === p.method &&
                  (p.method === 'STORE' || settings.compressionLevel === p.level);

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className={`p-3.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gradient-to-br from-cyan-500/15 to-blue-500/10 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/30'
                        : 'bg-muted/30 border-border hover:border-cyan-500/30 hover:bg-muted/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm flex items-center gap-1.5 text-foreground">
                          <Icon className="h-4 w-4 text-cyan-400" />
                          {p.name}
                        </span>
                        <Badge
                          variant={isSelected ? 'default' : 'secondary'}
                          className={isSelected ? 'bg-cyan-500 text-black text-[10px] font-bold' : 'text-[10px]'}
                        >
                          {p.badge}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {p.desc}
                      </p>
                    </div>

                    {isSelected && (
                      <div className="mt-3 text-[11px] text-cyan-400 flex items-center gap-1 font-mono">
                        <Check className="h-3 w-3" /> Selected Preset
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-border/60 pt-5 space-y-5">
            {/* Compression Algorithm Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider block">
                  Compression Algorithm Method
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updateSetting('compressionMethod', 'STORE')}
                    className={`py-2.5 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                      settings.compressionMethod === 'STORE'
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/60 font-bold'
                        : 'bg-muted/30 text-muted-foreground border-border hover:text-foreground'
                    }`}
                  >
                    STORE (Raw / 0%)
                  </button>

                  <button
                    type="button"
                    onClick={() => updateSetting('compressionMethod', 'DEFLATE')}
                    className={`py-2.5 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                      settings.compressionMethod === 'DEFLATE'
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/60 font-bold'
                        : 'bg-muted/30 text-muted-foreground border-border hover:text-foreground'
                    }`}
                  >
                    DEFLATE (Compressed)
                  </button>
                </div>
              </div>

              {/* Compression Level Slider (When DEFLATE) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider block">
                    Deflate Compression Ratio Level (1 – 9)
                  </Label>
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                    {settings.compressionMethod === 'STORE'
                      ? 'Level 0 (Stored)'
                      : `Level ${settings.compressionLevel} (${
                          settings.compressionLevel <= 3
                            ? 'Fast'
                            : settings.compressionLevel <= 6
                            ? 'Balanced'
                            : 'Maximum'
                        })`}
                  </span>
                </div>

                <div className="space-y-2">
                  <input
                    type="range"
                    min="1"
                    max="9"
                    step="1"
                    disabled={settings.compressionMethod === 'STORE'}
                    value={settings.compressionLevel}
                    onChange={(e) => updateSetting('compressionLevel', parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-40"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                    <span>L1 (Fastest)</span>
                    <span>L5 (Standard)</span>
                    <span>L9 (Smallest File)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Archive Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/20 border border-border/50">
                <Switch
                  id="include-summary"
                  checked={settings.includeSummaryReport}
                  onCheckedChange={(val) => updateSetting('includeSummaryReport', val)}
                  className="mt-0.5"
                />
                <div className="space-y-0.5">
                  <Label htmlFor="include-summary" className="text-xs font-semibold cursor-pointer flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-cyan-400" />
                    Inject Consolidated Summary MD
                  </Label>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Automatically includes <code className="text-cyan-400 font-mono">CONSOLIDATED_PROJECT_SUMMARY.md</code> with tech stack metadata inside the archive.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/20 border border-border/50">
                <Switch
                  id="exclude-junk"
                  checked={settings.excludeJunkFiles}
                  onCheckedChange={(val) => updateSetting('excludeJunkFiles', val)}
                  className="mt-0.5"
                />
                <div className="space-y-0.5">
                  <Label htmlFor="exclude-junk" className="text-xs font-semibold cursor-pointer flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    Clean Package Output
                  </Label>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Automatically filters out <code className="font-mono text-muted-foreground">node_modules</code>, <code className="font-mono text-muted-foreground">.git</code>, and build cache artifacts.
                  </p>
                </div>
              </div>
            </div>

            {/* Custom Filename */}
            <div className="space-y-2 pt-1">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Custom Output Archive Name
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder={
                    project
                      ? `${project.name.toLowerCase().replace(/\s+/g, '_')}_consolidated.zip`
                      : 'my_archive.zip'
                  }
                  value={settings.customFilename}
                  onChange={(e) => updateSetting('customFilename', e.target.value)}
                  className="font-mono text-xs h-9 bg-muted/30"
                />
                {settings.customFilename && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => updateSetting('customFilename', '')}
                    className="text-xs text-muted-foreground"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>

        {/* Footer with summary and action */}
        {project && (
          <div className="p-4 bg-cyan-500/5 border-t border-cyan-500/20 rounded-b-xl flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-2 font-mono text-foreground font-semibold">
                <span>Output Scope: {filteredCount} files</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-cyan-400">
                  {settings.compressionMethod === 'STORE'
                    ? 'Stored (No Compression)'
                    : `Deflated (Level ${settings.compressionLevel})`}
                </span>
              </div>
              <p className="text-muted-foreground text-[11px]">
                Ready to compile archive with customized algorithm parameters.
              </p>
            </div>

            <Button
              onClick={onDownload}
              disabled={isDownloading}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs px-5 shadow-lg shadow-cyan-500/20"
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? 'Merging & Compressing ZIP...' : 'Download Configured ZIP'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
