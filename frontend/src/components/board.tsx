'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaShare } from 'react-icons/fa';

import { BoardWithMembers } from '@/api/board';
import MemberList from './memberlist';
import toast from 'react-hot-toast';

const Board = ({ board }: { board: BoardWithMembers }) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/boards/${board.id}`);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(board.share_code);
      toast.success(`Share code copied: ${board.share_code}`);
    } catch (error) {
      toast.error('Failed to copy share code');
    }
  };

  const BoardName = () => (
    <div>
      <h3 className="text-lg font-bold">{board.name}</h3>
    </div>
  );

  const ShareButton = () => (
    <button 
      onClick={handleShare}
      className="btn btn-ghost btn-sm btn-circle"
      title="Copy share code"
    >
      <FaShare className="text-lg" />
    </button>
  );

  const TopSection = () => (
    <div className="flex justify-between items-center">
      <BoardName />
      <ShareButton />
    </div>
  );

  const MidSection = () => (
    <div>
      <p className="text-xs text-gray-400">Description</p>
      <p className="text-sm text-gray-600 max-h-[100px] overflow-auto">{board.description}</p>
    </div>
  );

  const BottomSection = () => (
    <>
      <div className="flex justify-between items-center">
        <button onClick={handleClick} className="btn btn-secondary btn-sm btn-outline">
          Open
        </button>
      </div>
      <div className="mt-2 overflow-x-auto">
        <MemberList members={board.members}/>
      </div>
    </>
  );

  return (
    <div className="card card-bordered bg-gray-50 w-[325px]">
      <div className="card-body">
        <TopSection />
        <MidSection />
        <BottomSection />
      </div>
    </div>
  );
};

export default Board;
