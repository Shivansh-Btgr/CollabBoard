'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface ImportBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (shareCode: string) => Promise<void>;
}

export default function ImportBoardModal({ isOpen, onClose, onImport }: ImportBoardModalProps) {
  const [shareCode, setShareCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onImport(shareCode.trim().toUpperCase());
      setShareCode('');
      onClose();
    } catch (error) {
      // Error is already handled in parent
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setShareCode('');
    onClose();
  };

  return (
    <>
      {/* Modal backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={handleClose} />

      {/* Modal content */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Import Board</h2>
            <button onClick={handleClose} className="btn btn-sm btn-circle btn-ghost">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Share Code</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full uppercase"
                placeholder="Enter 8-character code"
                value={shareCode}
                onChange={(e) => setShareCode(e.target.value.toUpperCase())}
                required
                minLength={6}
                maxLength={10}
                autoFocus
              />
              <label className="label">
                <span className="label-text-alt text-gray-500">
                  Enter the share code from a board to add it to your workspace
                </span>
              </label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <button type="button" onClick={handleClose} className="btn btn-ghost" disabled={isLoading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? 'Importing...' : 'Import Board'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
