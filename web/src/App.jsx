import { AppBar } from '@mui/material';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import { Link, Route, Routes } from 'react-router';
import RoomDispatcher from './pages/RoomDispatcher.jsx';
import JoinActivity from './pages/JoinActivity.jsx';
import ActivityReport from './pages/ActivityReport.jsx';
import CreateActivity from './pages/CreateActivity.jsx';
import Home from './pages/Home.jsx';
import './App.css'
function App() {
  return (
    <>
      

        <Routes>

          {/* The unified Home page handles both Create and Join */}
          <Route path="/" element={<Home />} />
          <Route path="/join" element={<JoinActivity />} />
          <Route path="/create" element={<CreateActivity/>}/>
          {/* One Route to rule them all: The Dispatcher decides what to show */}
          <Route path="/room/:roomCode" element={<RoomDispatcher />} />
        <Route path="/report" element={<ActivityReport />} />
        </Routes>
  
    </>
  );
}

export default App
