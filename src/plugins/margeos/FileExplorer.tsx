import { useEffect, useState } from "react";
import { files } from "@/integrations/margeosBridge";
import type { WorkspaceFile } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import type { PanelProps } from "./MargeOSShell";
import { 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown, 
  FileCode2, 
  FileText, 
  FileJson,
  File as FileIcon,
  Trash2,
  Save,
  Plus
} from "lucide-react";

interface TreeNode {
  name: string;
  fullPath: string;
  isFolder: boolean;
  children: TreeNode[];
  file?: WorkspaceFile;
}

function buildTree(fileList: WorkspaceFile[]): TreeNode[] {
  const root: TreeNode[] = [];

  fileList.forEach(item => {
    const cleanPath = item.path.replace(/^\//, "");
    const parts = cleanPath.split("/").filter(Boolean);
    let currentLevel = root;

    parts.forEach((part, idx) => {
      const isLast = idx === parts.length - 1;
      const fullPath = "/" + parts.slice(0, idx + 1).join("/");
      let existing = currentLevel.find(n => n.name === part);

      if (!existing) {
        existing = {
          name: part,
          fullPath,
          isFolder: isLast ? item.kind === "folder" : true,
          children: [],
          file: isLast ? item : undefined
        };
        currentLevel.push(existing);
      }

      if (!isLast) {
        currentLevel = existing.children;
      }
    });
  });

  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach(n => {
      if (n.isFolder) sortNodes(n.children);
    });
  };

  sortNodes(root);
  return root;
}

function getIconForFile(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["ts", "tsx", "js", "jsx"].includes(ext)) {
    return <FileCode2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />;
  }
  if (["json", "yaml", "yml"].includes(ext)) {
    return <FileJson className="h-3.5 w-3.5 text-amber-400 shrink-0" />;
  }
  if (["md", "txt", "pdf"].includes(ext)) {
    return <FileText className="h-3.5 w-3.5 text-emerald-400 shrink-0" />;
  }
  return <FileIcon className="h-3.5 w-3.5 text-primary/80 shrink-0" />;
}

function TreeItem({
  node,
  depth = 0,
  selectedId,
  onSelect
}: {
  node: TreeNode;
  depth?: number;
  selectedId?: string;
  onSelect: (file: WorkspaceFile) => void;
}) {
  const [open, setOpen] = useState(true);

  if (node.isFolder) {
    return (
      <div>
        <div
          className="flex items-center gap-1.5 px-2 py-1 text-xs cursor-pointer hover:bg-muted/60 rounded select-none text-foreground/80 font-medium"
          style={{ paddingLeft: `${depth * 12 + 6}px` }}
          onClick={() => setOpen(!open)}
        >
          {open ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
          )}
          {open ? (
            <FolderOpen className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          ) : (
            <Folder className="h-3.5 w-3.5 text-amber-400/80 shrink-0" />
          )}
          <span className="truncate flex-1 font-mono">{node.name}</span>
        </div>
        {open && (
          <div>
            {node.children.map(child => (
              <TreeItem
                key={child.fullPath}
                node={child}
                depth={depth + 1}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isSelected = node.file?.id === selectedId;

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 text-xs cursor-pointer rounded transition-colors select-none ${
        isSelected
          ? "bg-primary/20 text-primary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
      }`}
      style={{ paddingLeft: `${depth * 12 + 18}px` }}
      onClick={() => node.file && onSelect(node.file)}
    >
      {getIconForFile(node.name)}
      <span className="truncate flex-1 font-mono">{node.name}</span>
    </div>
  );
}

export default function FileExplorer({ workspace }: PanelProps) {
  const [list, setList] = useState<WorkspaceFile[]>([]);
  const [sel, setSel] = useState<WorkspaceFile | null>(null);
  const [content, setContent] = useState("");
  const [newPath, setNewPath] = useState("/notes.md");

  const refresh = () => workspace ? files.list(workspace.id).then(setList).catch(() => void 0) : setList([]);
  useEffect(() => { refresh(); setSel(null); }, [workspace?.id]);
  useEffect(() => { setContent(sel?.content ?? ""); }, [sel?.id]);

  async function create() {
    if (!workspace || !newPath.trim()) return;
    const name = newPath.split("/").pop()!;
    try {
      const f = await files.upsert({ workspace_id: workspace.id, path: newPath, name, kind: "file", content: "" });
      await refresh(); setSel(f);
    } catch (e: any) { toast.error(e.message); }
  }

  async function save() {
    if (!sel || !workspace) return;
    try {
      const f = await files.upsert({
        workspace_id: workspace.id, path: sel.path, name: sel.name, kind: "file", content,
      });
      await refresh(); setSel(f); toast.success("Saved");
    } catch (e: any) { toast.error(e.message); }
  }

  if (!workspace) return <p className="text-sm text-muted-foreground">Select a workspace first.</p>;

  const treeNodes = buildTree(list);

  return (
    <div className="grid md:grid-cols-[18rem_1fr] gap-3">
      <Card className="p-2 space-y-2 max-h-[28rem] overflow-auto">
        <div className="flex gap-1">
          <Input 
            value={newPath} 
            onChange={(e) => setNewPath(e.target.value)} 
            placeholder="/src/index.ts"
            className="text-xs font-mono"
          />
          <Button size="sm" onClick={create} title="Create File">
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="space-y-0.5 pt-1">
          {treeNodes.map((node) => (
            <TreeItem
              key={node.fullPath}
              node={node}
              selectedId={sel?.id}
              onSelect={(fileItem) => setSel(fileItem)}
            />
          ))}
          {!list.length && <p className="text-xs text-muted-foreground p-2">Empty workspace.</p>}
        </div>
      </Card>
      <Card className="p-3 space-y-2">
        {sel ? (
          <>
            <div className="flex items-center justify-between border-b pb-2">
              <div className="text-xs font-mono font-medium flex items-center gap-1.5 text-foreground">
                {getIconForFile(sel.name)}
                {sel.path}
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" variant="default" onClick={save} className="h-7 text-xs px-2.5">
                  <Save className="h-3 w-3 mr-1" /> Save
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={async () => { await files.remove(sel.id); setSel(null); refresh(); }}
                  className="h-7 text-xs px-2.5 text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Delete
                </Button>
              </div>
            </div>
            <Textarea 
              rows={16} 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              className="font-mono text-xs leading-relaxed"
            />
          </>
        ) : (
          <div className="h-full min-h-[16rem] flex items-center justify-center text-xs text-muted-foreground">
            Select a file to edit content.
          </div>
        )}
      </Card>
    </div>
  );
}

