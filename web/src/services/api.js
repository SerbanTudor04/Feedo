// specific url for your backend
const API_URL = 'http://localhost:3000/api';
// const API_URL = 'https://99dfh2dj-3000.euw.devtunnels.ms/api';



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

export const getReport = async (roomCode, token) => {
  const res = await fetch(`${API_URL}/report/${roomCode}`, {
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': token // Pass the JWT token for security
    }
  });
  return res.json();
};