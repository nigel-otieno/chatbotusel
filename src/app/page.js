'use client';

import ChatBox from '../components/ChatBox'; // Adjust path if needed

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6">Welcome to USEL Youth Robotics</h1>
      <ChatBox />
    </main>
  );
}
