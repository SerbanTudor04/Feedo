import { useLocation, Navigate, useParams } from 'react-router';
import TeacherDashboard from './TeacherDashboard';
import StudentRoom from './StudentRoom';
export default function RoomDispatcher() {
  const location = useLocation();
  const { roomCode } = useParams();
  
  // Retrieve state passed from Home.jsx
  const { token, isTeacher, nickname } = location.state || {};

  // 1. Security Check: If no token (e.g., user refreshed the page), kick them back to Home
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // 2. Render the correct view based on Role
  if (isTeacher) {
    return <TeacherDashboard />;
  } else {
    return <StudentRoom />;
  }
}