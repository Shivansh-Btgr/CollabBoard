'use client';

import { User, updateUser } from '@/api';
import Avatar from '@/components/avatar';
import { COOKIE_NAME_JWT_TOKEN } from '@/constants';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Cookies from 'universal-cookie';

interface ProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

// Generate avatar seeds for the grid (using different strings to get varied avatars)
const AVATAR_OPTIONS = [
  'avatar-1',
  'avatar-2',
  'avatar-3',
  'avatar-4',
  'avatar-5',
  'avatar-6',
  'avatar-7',
  'avatar-8',
];

export default function ProfileModal({ user, isOpen, onClose, onUpdate }: ProfileModalProps) {
  const [name, setName] = useState(user.name);
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar_seed || user.id);
  const [isLoading, setIsLoading] = useState(false);
  const cookies = new Cookies();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = cookies.get(COOKIE_NAME_JWT_TOKEN);
      if (!token) {
        throw new Error('Not authenticated');
      }

      await updateUser({
        name: name.trim(),
        avatar_seed: selectedAvatar,
      }, token);
      
      toast.success('Profile updated successfully');
      onUpdate();
      onClose();
    } catch (error) {
      toast.error(String(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Modal backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />

      {/* Modal content */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Edit Profile</h2>
            <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name input */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Name</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={1}
                maxLength={50}
              />
            </div>

            {/* Avatar selection */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Choose Avatar</span>
              </label>
              <div className="grid grid-cols-4 gap-3">
                {AVATAR_OPTIONS.map((avatarSeed) => (
                  <button
                    key={avatarSeed}
                    type="button"
                    onClick={() => setSelectedAvatar(avatarSeed)}
                    className={`p-2 rounded-lg border-2 transition-all hover:scale-105 ${
                      selectedAvatar === avatarSeed
                        ? 'border-primary shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Avatar id={avatarSeed} size={64} />
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Preview</span>
              </label>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Avatar id={selectedAvatar} size={48} />
                <span className="font-medium">{name || 'Your Name'}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <button type="button" onClick={onClose} className="btn btn-ghost" disabled={isLoading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
