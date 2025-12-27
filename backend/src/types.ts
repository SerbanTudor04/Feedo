// types.ts
export interface TokenPayload {
  session_id: number;
  nickname: string;
  role: 'teacher' | 'student';
  room_code: string;
  room_id: number;
}