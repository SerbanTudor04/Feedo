// specific url for your backend
const API_URL = 'http://localhost:3000/api';

export const createRoom = async (nickname) => {
  const res = await fetch(`${API_URL}/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname })
  });
  return res.json();
};

export const joinRoom = async (nickname, code) => {
  const res = await fetch(`${API_URL}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname, code })
  });
  return res.json();
};