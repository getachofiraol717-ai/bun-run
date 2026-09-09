import React from 'react';
import { X, FolderTree, Sparkles, Layers } from 'lucide-react';
import ZipFolderTreePreview, { TreeFileItem } from './ZipFolderTreePreview';

export interface ZipTreePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: (TreeFileItem | string)[];
  title?: string;
  sourceArchiveName?: string;
  bundleTitle?: string;
  onProceedToMerge?: () => void;
}

export const ZipTreePreviewModal: React.FC<ZipTreePreviewModalProps> = ({
  isOpen,
  onClose,
  files,
  title,
  sourceArchiveName,
  bundleTitle,
  onProceedToMerge,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="zip-tree-preview-modal-overlay"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in font-poppins"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="zip-tree-preview-modal-dialog"
        className="bg-card border border-border/80 rounded-2xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between gap-3 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary ring-1 ring-primary/30">
              <FolderTree className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-orbitron text-base sm:text-lg font-bold text-foreground">
                  {title || 'ZIP Directory Tree Structure Preview'}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">
                  {files.length} Files
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {sourceArchiveName
                  ? `Inspecting archive: ${sourceArchiveName}`
                  : `Previewing directory structure before merge into "${bundleTitle || 'Combined Archive'}"`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tree Component Body */}
        <div className="p-4 overflow-y-auto flex-1">
          <ZipFolderTreePreview
            files={files}
            sourceArchiveName={sourceArchiveName}
            defaultExpandedDepth={2}
            maxHeight="60vh"
            showSearch={true}
            showStats={true}
            showInspector={true}
          />
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-muted-foreground">
            Click any directory to expand/collapse. Select a file to view detailed metadata.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-muted/60 hover:bg-muted text-foreground text-xs font-semibold transition-colors border border-border/60"
            >
              Close
            </button>

            {onProceedToMerge && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onProceedToMerge();
                }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-orbitron text-xs font-bold hover:opacity-90 transition-all shadow-md flex items-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Proceed to Merge</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZipTreePreviewModal;
