'use client';
import { FaChevronDown } from 'react-icons/fa';

import { COOKIE_NAME_JWT_TOKEN } from '@/constants';
import { User, deleteCurrentUser } from '@/api';
import Cookies from 'universal-cookie';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AccountMenu({ user, avatar }: { user: User; avatar: React.ReactNode }) {
  const cookies = new Cookies();
  const router = useRouter();

  const handleLogout = async () => {
    // If user is a guest, delete their account before logging out
    if (user.is_guest) {
      try {
        const token = cookies.get(COOKIE_NAME_JWT_TOKEN);
        if (token) {
          await deleteCurrentUser(token);
        }
      } catch (error) {
        console.error('Failed to delete guest user:', error);
        // Continue with logout even if deletion fails
      }
    }
    
    cookies.remove(COOKIE_NAME_JWT_TOKEN);
    router.push('/');
    router.refresh();
  };

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} className="btn btn-ghost normal-case">
        <div className="w-10">{avatar}</div>
        <span>{user?.name}</span>
        <FaChevronDown />
      </div>
      <div className="right-0 mt-3 p-2 shadow menu menu-compact dropdown-content bg-base-100 rounded-box w-52">
        <ul className="menu menu-compact gap-1 p-3">
          <li>
            <button>Profile</button>
          </li>
          <li>
            <button onClick={handleLogout}>Logout</button>
          </li>
        </ul>
      </div>
    </div>
  );
}
