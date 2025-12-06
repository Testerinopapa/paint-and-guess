import { WhiteboardProvider } from "./whiteboard/state/WhiteboardContext";
import WhiteboardLobby from "./whiteboard/WhiteboardLobby";
import { Routes, Route, Navigate } from "react-router-dom";
import WhiteboardRoom from "./whiteboard/WhiteboardRoom";

export default function Whiteboard() {
  return (
    <WhiteboardProvider>
      <Routes>
        <Route index element={<WhiteboardLobby />} />
        <Route path="room/:roomId" element={<WhiteboardRoom />} />
        <Route path="*" element={<Navigate to="/hub/whiteboard" replace />} />
      </Routes>
    </WhiteboardProvider>
  );
}
