import { BASE_URL } from '@/constants';
import { sendGetRequest, sendPostRequest } from '.';

export type User = {
  id: string;
  name: string;
  email: string;
  is_guest: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateUserParams = {
  name: string;
  email?: string;
  password?: string;
  isGuest: boolean;
};

export type CreateUserResponse = {
  user: User;
  jwt_token: string;
};

export async function getUserByJwt(jwtToken: string): Promise<User> {
  const url = `${BASE_URL}/users/me`;
  return sendGetRequest<User>(url, jwtToken);
}

export async function createUser(params: CreateUserParams): Promise<CreateUserResponse> {
  const url = `${BASE_URL}/users`;
  // server expects snake_case for is_guest
  const body = {
    name: params.name,
    email: params.email,
    password: params.password,
    is_guest: params.isGuest,
  };
  return sendPostRequest<CreateUserResponse>(url, body);
}

export async function deleteCurrentUser(jwtToken: string): Promise<void> {
  const url = `${BASE_URL}/users/me`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwtToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete user');
  }
}
