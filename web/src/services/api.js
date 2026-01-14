// specific url for your backend
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Automatically picks the right URL
export const API_URL = isLocal 
  ? 'http://localhost:3000/api' 
  : 'https://feedo.igbs.blog/api';



export const createRoom = async (nickname,name,description) => {
  const res = await fetch(`${API_URL}/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nickname,
      name,
      description
     })
  });
  return res.json();
};

export const joinRoom = async (nickname, code) => {
  console.log('Joining room with nickname:', nickname, 'and code:', code);
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