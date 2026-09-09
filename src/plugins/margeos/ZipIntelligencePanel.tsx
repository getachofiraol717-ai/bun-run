// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import { PanelProps } from "./MargeOSShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  FileArchive, 
  Search, 
  Cpu, 
  FolderTree, 
  Bug, 
  BookOpen, 
  Sparkles, 
  Lightbulb, 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle,
  Code2,
  Send,
  Layers,
  ArrowRight,
  Download,
  Sliders
} from "lucide-react";
import JSZip from "jszip";
import { toast } from "sonner";

import zipIntelligenceEngine from "./zip-intelligence/core/ZipIntelligenceEngine";
import { Project } from "./zip-intelligence/models/ProjectModel";
import { AnalysisReport } from "./zip-intelligence/models/AnalysisReport";
import { BugReport } from "./zip-intelligence/models/BugReport";
import { Documentation } from "./zip-intelligence/models/Documentation";
import codebaseExplainer from "./zip-intelligence/core/CodebaseExplainer";
import projectSearchService from "./zip-intelligence/services/ProjectSearchService";
import ZipCompressionPanel, { ZipCompressionSettings } from "./zip-intelligence/components/ZipCompressionPanel";
import { FileSystemService } from "./vscode-workspace/services/FileSystemService";
import { useWorkspaceStore } from "./vscode-workspace/store/workspaceStore";

export default function ZipIntelligencePanel({ workspace }: PanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisReport, setAnalysisReport] = useState<AnalysisReport | null>(null);
  const [bugReport, setBugReport] = useState<BugReport | null>(null);
  const [documentation, setDocumentation] = useState<Documentation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  // Compression Settings Configuration
  const [compressionSettings, setCompressionSettings] = useState<ZipCompressionSettings>({
    compressionMethod: "DEFLATE",
    compressionLevel: 6,
    includeSummaryReport: true,
    excludeJunkFiles: true,
    customFilename: "",
  });

  // AI Explainer Chat
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    { sender: "ai", text: "Hello! Upload a ZIP archive to analyze its codebase, architecture, dependencies, bugs, and documentation." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadConsolidatedZip = async () => {
    if (!project || project.files.length === 0) {
      toast.error("No active project files to consolidate");
      return;
    }

    setIsDownloading(true);
    try {
      const zip = new JSZip();

      // Filter junk files if setting enabled
      const filesToInclude = compressionSettings.excludeJunkFiles
        ? project.files.filter(f => !/node_modules|\.git|\.DS_Store|dist|build/i.test(f.path))
        : project.files;

      // Add project files to ZIP
      for (const fileItem of filesToInclude) {
        if (fileItem.content !== undefined) {
          const cleanPath = fileItem.path.replace(/^\//, "");
          zip.file(cleanPath, fileItem.content || "");
        }
      }

      // Add consolidated summary report inside the archive if enabled
      if (compressionSettings.includeSummaryReport) {
        const reportMarkdown = `# ${project.name} - Consolidated Project Archive\n\n` +
          `Generated: ${new Date().toLocaleString()}\n` +
          `Total Files: ${filesToInclude.length}\n` +
          `Compression Method: ${compressionSettings.compressionMethod}\n` +
          `Compression Level: ${compressionSettings.compressionMethod === 'STORE' ? 'Stored (Level 0)' : `Deflated (Level ${compressionSettings.compressionLevel})`}\n` +
          `Primary Architecture: ${project.architecture?.pattern?.name || "Modular Structure"}\n` +
          `Languages: ${project.techProfile.languages.map(l => `${l.name} (${l.percentage}%)`).join(", ")}\n\n` +
          `---\nExported from MargeOS ZIP Intelligence Engine`;

        zip.file("CONSOLIDATED_PROJECT_SUMMARY.md", reportMarkdown);
      }

      const zipOptions: any = {
        type: "blob",
        compression: compressionSettings.compressionMethod,
      };

      if (compressionSettings.compressionMethod === "DEFLATE") {
        zipOptions.compressionOptions = {
          level: compressionSettings.compressionLevel,
        };
      }

      const blob = await zip.generateAsync(zipOptions);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      let filename = compressionSettings.customFilename.trim();
      if (!filename) {
        filename = `${project.name.toLowerCase().replace(/\s+/g, "_")}_${compressionSettings.compressionMethod.toLowerCase()}_L${compressionSettings.compressionLevel}.zip`;
      } else if (!filename.endsWith(".zip")) {
        filename += ".zip";
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${filename} (${compressionSettings.compressionMethod} L${compressionSettings.compressionLevel})`);
    } catch (err) {
      console.error("ZIP creation error:", err);
      toast.error("Failed to generate ZIP file");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;
    setFile(uploaded);
    await processArchive(uploaded);
  };

  const processArchive = async (targetFile: File) => {
    setIsAnalyzing(true);
    try {
      const arrayBuffer = await targetFile.arrayBuffer();
      const loadedProject = await zipIntelligenceEngine.loadProjectFromArchive(
        targetFile.name.replace(/\.[^/.]+$/, ""),
        arrayBuffer
      );
      setProject(loadedProject);

      const analysis = await zipIntelligenceEngine.analyzeProject(loadedProject);
      setAnalysisReport(analysis);

      const bugs = await zipIntelligenceEngine.detectBugs(loadedProject);
      setBugReport(bugs);

      const docs = await zipIntelligenceEngine.generateDocumentation(loadedProject);
      setDocumentation(docs);

      // Sync extracted project files to Canonical Workspace
      const activeWs = workspace || useWorkspaceStore.getState().activeWorkspace;
      if (activeWs && loadedProject.files.length > 0) {
        const fsService = FileSystemService.getInstance();
        for (const fileItem of loadedProject.files) {
          if (fileItem.content !== undefined) {
            const cleanPath = fileItem.path.replace(/^\//, '');
            const fileName = fileItem.name || cleanPath.split('/').pop() || 'file';
            try {
              fsService.createFile(activeWs.id, fileName, cleanPath, fileItem.content || '');
            } catch {
              fsService.updateFile(activeWs.id, cleanPath, fileItem.content || '');
            }
          }
        }
      }

      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `Successfully extracted, imported into workspace, and analyzed project "${loadedProject.name}". Found ${loadedProject.files.length} files across ${loadedProject.techProfile.languages.length} programming languages.`
        }
      ]);
    } catch (err: any) {
      console.error("ZIP analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!chatInput.trim()) return;
    const q = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: "user", text: q }]);
    setChatInput("");

    if (!project) {
      setChatMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Please upload a project ZIP archive first so I can analyze its codebase and answer your questions." }
      ]);
      return;
    }

    const answer = await codebaseExplainer.explainQuestion(project, q);
    setChatMessages((prev) => [...prev, { sender: "ai", text: answer }]);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!project || !query.trim()) {
      setSearchResults([]);
      return;
    }
    const results = projectSearchService.search(project, query);
    setSearchResults(results);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/30 p-4 rounded-lg border border-border">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileArchive className="h-6 w-6 text-primary" />
            ZIP / Project Intelligence Engine
          </h2>
          <p className="text-sm text-muted-foreground">
            Automated software engineering mentor for project comprehension, architectural analysis, bug detection & documentation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,.tar,.gz"
            className="hidden"
            onChange={handleFileUpload}
          />
          {project && (
            <Button
              onClick={handleDownloadConsolidatedZip}
              disabled={isDownloading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? "Consolidating ZIP..." : "Download Consolidated ZIP"}
            </Button>
          )}
          <Button onClick={() => fileInputRef.current?.click()} disabled={isAnalyzing} variant={project ? "outline" : "default"}>
            <UploadCloud className="h-4 w-4 mr-2" />
            {isAnalyzing ? "Analyzing..." : "Upload Project ZIP"}
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {!project ? (
        <Card className="p-12 text-center border-dashed">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
              <FileArchive className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">No Project Loaded</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-6">
              Upload a programming project archive (.zip) to extract files, detect technologies, analyze architecture, and ask questions.
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              Select ZIP Archive
            </Button>
          </div>
        </Card>
      ) : (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="overview"><Cpu className="h-4 w-4 mr-2" /> Overview</TabsTrigger>
            <TabsTrigger value="compression"><Sliders className="h-4 w-4 mr-2 text-cyan-400" /> Compression Config</TabsTrigger>
            <TabsTrigger value="architecture"><Layers className="h-4 w-4 mr-2" /> Architecture</TabsTrigger>
            <TabsTrigger value="explainer"><Sparkles className="h-4 w-4 mr-2" /> AI Explainer</TabsTrigger>
            <TabsTrigger value="bugs"><Bug className="h-4 w-4 mr-2" /> Bug Analysis</TabsTrigger>
            <TabsTrigger value="docs"><BookOpen className="h-4 w-4 mr-2" /> Documentation</TabsTrigger>
            <TabsTrigger value="search"><Search className="h-4 w-4 mr-2" /> Search</TabsTrigger>
          </TabsList>

          {/* COMPRESSION CONFIG TAB */}
          <TabsContent value="compression" className="space-y-4">
            <ZipCompressionPanel
              project={project}
              settings={compressionSettings}
              onSettingsChange={setCompressionSettings}
              onDownload={handleDownloadConsolidatedZip}
              isDownloading={isDownloading}
            />
          </TabsContent>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <p className="text-xs text-muted-foreground">Files</p>
                <p className="text-2xl font-bold">{project.files.length}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground">Languages</p>
                <p className="text-2xl font-bold">{project.techProfile.languages.length}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground">Frameworks</p>
                <p className="text-2xl font-bold">{project.techProfile.frameworks.length}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground">Quality Score</p>
                <p className="text-2xl font-bold text-emerald-500">
                  {analysisReport?.metrics.codeQualityScore || 85}%
                </p>
              </Card>
            </div>

            {/* Download Consolidated ZIP Trigger Banner */}
            <Card className="p-4 bg-emerald-500/10 border-emerald-500/30 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" /> Consolidation Process Complete
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  All {project.files.length} project files have been processed and indexed. You can now save the newly consolidated ZIP package locally.
                </p>
              </div>
              <Button onClick={handleDownloadConsolidatedZip} disabled={isDownloading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Download className="h-4 w-4 mr-2" />
                {isDownloading ? "Generating ZIP..." : "Save Consolidated ZIP Locally"}
              </Button>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Technology Profile</CardTitle>
                <CardDescription>Detected tech stack, build tools, and languages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Languages</h4>
                  <div className="flex flex-wrap gap-2">
                    {project.techProfile.languages.map((lang) => (
                      <Badge key={lang.name} variant="secondary">
                        {lang.name} ({lang.percentage}%)
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Frameworks & Libraries</h4>
                  <div className="flex flex-wrap gap-2">
                    {project.techProfile.frameworks.map((f) => (
                      <Badge key={f.name} variant="outline" className="border-primary/50">
                        {f.name} {f.version && `v${f.version}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ARCHITECTURE TAB */}
          <TabsContent value="architecture" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Project Architecture</CardTitle>
                <CardDescription>Pattern: {project.architecture.pattern.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{project.architecture.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-3 border rounded-md">
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-2 text-emerald-500">
                      <CheckCircle2 className="h-4 w-4" /> Architectural Strengths
                    </h4>
                    <ul className="text-xs space-y-1 list-disc list-inside">
                      {project.architecture.strengths.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 border rounded-md">
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-2 text-amber-500">
                      <AlertTriangle className="h-4 w-4" /> Opportunities & Weaknesses
                    </h4>
                    <ul className="text-xs space-y-1 list-disc list-inside">
                      {project.architecture.weaknesses.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI EXPLAINER TAB */}
          <TabsContent value="explainer" className="space-y-4">
            <Card className="flex flex-col h-[400px]">
              <CardHeader className="py-3 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Codebase Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 text-sm ${
                        msg.sender === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </CardContent>
              <div className="p-3 border-t flex gap-2">
                <Input
                  placeholder="Ask a question about this project..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAskQuestion()}
                />
                <Button onClick={handleAskQuestion}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* BUGS TAB */}
          <TabsContent value="bugs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Bug & Vulnerability Analysis</CardTitle>
                <CardDescription>Potential issues and logic concerns identified in codebase</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {bugReport && bugReport.bugs.length > 0 ? (
                  bugReport.bugs.map((bug) => (
                    <div key={bug.id} className="p-3 border rounded-md space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge variant={bug.severity === "high" ? "destructive" : "secondary"}>
                          {bug.severity.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{bug.filePath}</span>
                      </div>
                      <p className="text-sm font-medium">{bug.title}</p>
                      <p className="text-xs text-muted-foreground">{bug.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No critical bugs found in initial pass.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* DOCS TAB */}
          <TabsContent value="docs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{documentation?.title || "Generated Documentation"}</CardTitle>
                <CardDescription>Automated developer documentation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{documentation?.overview}</p>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Setup & Installation</h4>
                  <pre className="p-3 bg-muted text-xs rounded-md font-mono whitespace-pre-wrap">
                    {documentation?.setupInstructions?.join("\n")}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEARCH TAB */}
          <TabsContent value="search" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Intelligent Search</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search functions, classes, or files..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  {searchResults.map((res, i) => (
                    <div key={i} className="p-3 border rounded-md">
                      <p className="text-sm font-medium">{res.fileName}</p>
                      <p className="text-xs text-muted-foreground">{res.filePath}</p>
                      <p className="text-xs font-mono bg-muted p-2 rounded mt-1">{res.preview}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
