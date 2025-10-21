'use client';

import { useEffect, useState } from 'react';
import Cookies from 'universal-cookie';
import { getBoards, createBoard, importBoard, BoardWithMembers, BoardResponse } from '@/api/board';
import Board from '@/components/board';
import WidthContainer from '@/components/widthContainer';
import { COOKIE_NAME_JWT_TOKEN, FOOTER_HEIGHT, NAVBAR_HEIGHT } from '@/constants';
import ImportBoardModal from '@/components/modals/importBoard';
import toast from 'react-hot-toast';

// ...metadata export removed to allow use client

export default function DashboardPage() {
  const [boards, setBoards] = useState<BoardWithMembers[]>([]);
  const [sharedBoards, setSharedBoards] = useState<BoardWithMembers[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Fetch boards on mount
  useEffect(() => {
    async function fetchBoards() {
      try {
        const cookies = new Cookies();
        const jwtToken = cookies.get(COOKIE_NAME_JWT_TOKEN);
        if (jwtToken) {
          const data = await getBoards(jwtToken);
          setBoards(data.owned);
          setSharedBoards(data.shared);
        }
      } catch (err) {
        setError('Failed to load boards');
      }
    }
    fetchBoards();
  }, []);

  const handleCreateBoard = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const cookies = new Cookies();
      const jwtToken = cookies.get(COOKIE_NAME_JWT_TOKEN);
      if (!jwtToken) throw new Error('Please log in.');
      const newBoard = await createBoard({ name, description }, jwtToken);
      setBoards((prev) => [...prev, { ...newBoard, members: [], user_id: true }]);
      setName('');
      setDescription('');
      toast.success('Board created successfully!');
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleImportBoard = async (shareCode: string) => {
    try {
      const cookies = new Cookies();
      const jwtToken = cookies.get(COOKIE_NAME_JWT_TOKEN);
      if (!jwtToken) throw new Error('Please log in.');
      
      const importedBoard = await importBoard(shareCode, jwtToken);
      setSharedBoards((prev) => [...prev, importedBoard]);
      toast.success('Board imported successfully!');
    } catch (err) {
      toast.error(String(err));
      throw err; // Re-throw to keep modal open
    }
  };

  return (
    <div className="min-h-screen" style={{ minHeight: `calc(100vh - ${NAVBAR_HEIGHT} - ${FOOTER_HEIGHT})` }}>
      <WidthContainer>
        <h1 className="text-4xl font-bold mt-10 mb-10">Dashboard</h1>
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Manage Boards</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            <button 
              onClick={() => setIsImportModalOpen(true)} 
              className="btn btn-secondary"
            >
              Import Board
            </button>
          </div>
          
          <form onSubmit={handleCreateBoard} className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Board Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input input-bordered"
              required
            />
            <input
              type="text"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input input-bordered"
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Board'}
            </button>
          </form>
          {error && <div className="text-red-500 mt-2">{error}</div>}
        </div>
        <div className="space-y-8 my-8">
          <div>
            <h2 className="text-2xl font-bold">My Boards</h2>
            <div className="divider" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 place-items-center">
              {boards.length > 0 ? (
                boards.map((board) => <Board key={board.id} board={board} />)
              ) : (
                <p className="text-gray-500 col-span-full">No boards yet. Create one to get started!</p>
              )}
            </div>
          </div>

          {sharedBoards.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold">Shared With Me</h2>
              <div className="divider" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 place-items-center">
                {sharedBoards.map((board) => (
                  <Board key={board.id} board={board} />
                ))}
              </div>
            </div>
          )}
        </div>

        <ImportBoardModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleImportBoard}
        />
      </WidthContainer>
    </div>
  );
}
