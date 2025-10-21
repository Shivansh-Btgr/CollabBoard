export * from './settings';
export * from './websocket';

// For browser clients (when running via Docker Compose with ports mapped to host)
// use localhost so the browser can reach the backend on the host port 8080.
const isServer = typeof window === 'undefined';
export const BASE_URL = isServer ? 'http://backend:8080' : 'http://localhost:8080';
export const COOKIE_NAME_JWT_TOKEN = 'jwt_token';
export const POST_WIDTH = 275;
export const POST_HEIGHT = 100;
export const BOARD_SPACE_ADD = 150;
export const POST_COLORS: { [key: string]: string } = {
  LIGHT_PINK: '#F5E6E8',
  LIGHT_GREEN: '#E7ECD9',
  LIGHT_LAVENDER: '#E5E1F1',
  LIGHT_PEACH: '#FCE6C9',
  LIGHT_AQUA: '#D8E2DC',
};
// WebSocket URL for browser clients
export const WS_URL = isServer ? 'ws://backend:8080/ws' : 'ws://localhost:8080/ws';
