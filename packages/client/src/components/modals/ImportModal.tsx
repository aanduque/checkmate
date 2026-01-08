import React, { useState, useRef } from 'react';
import { useStore } from 'statux';
import { api } from '../../services/rpcClient';

export function ImportModal() {
  const [isOpen, setIsOpen] = useStore<boolean>('ui.modals.import');
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mergeMode, setMergeMode] = useState<'replace' | 'merge'>('merge');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setIsOpen(false);
    setSelectedFile(null);
    setMergeMode('merge');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/json') {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setImporting(true);
    try {
      const text = await selectedFile.text();
      const data = JSON.parse(text);

      // Validate the data structure
      if (!data.tasks && !data.tags && !data.routines && !data.sprints) {
        throw new Error('Invalid backup file format');
      }

      if (mergeMode === 'replace') {
        await api.data.reset();
      }

      await api.data.import({ data, merge: mergeMode === 'merge' });
      alert('Import successful!');
      window.location.reload();
    } catch (error: any) {
      console.error('Import failed:', error);
      alert(`Import failed: ${error.message || 'Unknown error'}`);
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Import Backup</h3>
          <button onClick={handleClose} className="btn btn-ghost btn-sm btn-square">
            <ion-icon name="close-outline" class="text-xl"></ion-icon>
          </button>
        </div>

        {/* Drop Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            selectedFile
              ? 'border-success bg-success/10'
              : 'border-base-300 hover:border-primary'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
          {selectedFile ? (
            <>
              <ion-icon name="document-outline" class="text-4xl text-success mb-2"></ion-icon>
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-base-content/60">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </>
          ) : (
            <>
              <ion-icon name="cloud-upload-outline" class="text-4xl text-base-content/40 mb-2"></ion-icon>
              <p className="font-medium">Click or drop a backup file here</p>
              <p className="text-sm text-base-content/60">JSON format only</p>
            </>
          )}
        </div>

        {/* Import Mode */}
        {selectedFile && (
          <div className="form-control mt-4">
            <label className="label">
              <span className="label-text font-medium">Import Mode</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 bg-base-200 rounded-lg cursor-pointer">
                <input
                  type="radio"
                  name="mergeMode"
                  value="merge"
                  checked={mergeMode === 'merge'}
                  onChange={() => setMergeMode('merge')}
                  className="radio radio-primary mt-0.5"
                />
                <div>
                  <p className="font-medium">Merge</p>
                  <p className="text-sm text-base-content/60">
                    Add imported data to existing data (duplicates will be skipped)
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 bg-base-200 rounded-lg cursor-pointer">
                <input
                  type="radio"
                  name="mergeMode"
                  value="replace"
                  checked={mergeMode === 'replace'}
                  onChange={() => setMergeMode('replace')}
                  className="radio radio-error mt-0.5"
                />
                <div>
                  <p className="font-medium text-error">Replace All</p>
                  <p className="text-sm text-base-content/60">
                    Delete all existing data and replace with imported data
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        {mergeMode === 'replace' && selectedFile && (
          <div className="alert alert-warning mt-4">
            <ion-icon name="warning-outline" class="text-xl"></ion-icon>
            <span className="text-sm">
              This will permanently delete all your current data before importing.
            </span>
          </div>
        )}

        <div className="modal-action">
          <button onClick={handleClose} className="btn btn-ghost">
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!selectedFile || importing}
            className="btn btn-primary"
          >
            {importing ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <>
                <ion-icon name="cloud-upload-outline"></ion-icon>
                Import
              </>
            )}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={handleClose}></div>
    </div>
  );
}
