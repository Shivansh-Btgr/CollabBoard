'use client';

import { useEffect, useState } from 'react';
import Cookies from 'universal-cookie';
import { getBoards, createBoard, BoardWithMembers, BoardResponse } from '@/api/board';
import Board from '@/components/board';
import WidthContainer from '@/components/widthContainer';
import { COOKIE_NAME_JWT_TOKEN, FOOTER_HEIGHT, NAVBAR_HEIGHT } from '@/constants';

// ...metadata export removed to allow use client

export default function DashboardPage() {
  const [boards, setBoards] = useState<BoardWithMembers[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch boards on mount
  useEffect(() => {
    async function fetchBoards() {
      try {
        const cookies = new Cookies();
        const jwtToken = cookies.get(COOKIE_NAME_JWT_TOKEN);
        if (jwtToken) {
          const data = await getBoards(jwtToken);
          setBoards(data.owned);
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
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ minHeight: `calc(100vh - ${NAVBAR_HEIGHT} - ${FOOTER_HEIGHT})` }}>
      <WidthContainer>
        <h1 className="text-4xl font-bold mt-10 mb-10">Dashboard</h1>
        <form className="mb-8" onSubmit={handleCreateBoard}>
          <h2 className="text-xl font-semibold mb-2">Create a Board</h2>
          <input
            type="text"
            placeholder="Board Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input input-bordered mr-2"
            required
          />
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input input-bordered mr-2"
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Board'}
          </button>
          {error && <div className="text-red-500 mt-2">{error}</div>}
        </form>
        <div className="space-y-8 my-8">
          <div>
            <h2 className="text-2xl font-bold">My Boards</h2>
            <div className="divider" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 place-items-center">
              {boards.map((board) => {
                return <Board key={board.id} board={board} />;
              })}
            </div>
          </div>
          {/* ...existing code... */}
        </div>
      </WidthContainer>
    </div>
  );
}
