
import './App.css'
import { useState } from 'react'
import Broadcaster from './components/Broadcaster'
import Viewer from './components/Viewer'

function App() {
  const [mode, setMode] = useState<'select' | 'broadcaster' | 'viewer'>('select')
  const [roomId, setRoomId] = useState('baby-room-1')
  if (mode === 'broadcaster') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
        <button 
          className="mb-4 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
          onClick={() => setMode('select')}
        >
          <i className="fa-solid fa-arrow-left"></i>
          Back to selection
        </button>
        <Broadcaster roomId={roomId} />
      </div>
    )
  }

  if (mode === 'viewer') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
        <button 
          className="mb-4 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
          onClick={() => setMode('select')}
        >
          <i className="fa-solid fa-arrow-left"></i>
          Back to selection
        </button>
        <Viewer roomId={roomId} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="flex flex-col gap-6 rounded-2xl bg-gray-800 p-8 max-w-md w-full shadow-2xl">
        <h1 className="text-4xl font-bold text-center text-white">
          <i className="fa-solid fa-video mr-2 text-blue-500"></i>
          Baby Watcher
        </h1>
        
        <p className="text-center text-gray-400">
          Peer-to-peer video streaming with WebRTC
        </p>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-700"></div>
          <span className="text-gray-500 text-sm font-semibold">SELECT MODE</span>
          <div className="flex-1 h-px bg-gray-700"></div>
        </div>

        <label className="w-full">
          <div className="mb-2">
            <span className="text-sm font-semibold text-gray-300">Room ID</span>
          </div>
          <input 
            type="text" 
            placeholder="Enter room ID" 
            className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <div className="mt-2">
            <span className="text-xs text-gray-500">Share this ID with other devices</span>
          </div>
        </label>        <div className="grid grid-cols-1 gap-4">
          <button 
            className="px-6 py-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
            onClick={() => setMode('broadcaster')}
            disabled={!roomId.trim()}
          >
            <i className="fa-solid fa-video text-xl"></i>
            <span className="flex-1 text-left">Start Broadcasting</span>
            <span className="px-3 py-1 text-xs bg-blue-800 rounded">Camera Device</span>
          </button>

          <button 
            className="px-6 py-4 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
            onClick={() => setMode('viewer')}
            disabled={!roomId.trim()}
          >
            <i className="fa-solid fa-eye text-xl"></i>
            <span className="flex-1 text-left">Watch Stream</span>
            <span className="px-3 py-1 text-xs bg-purple-800 rounded">Viewer Device</span>
          </button>
        </div>

        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 flex gap-3">
          <i className="fa-solid fa-circle-info text-blue-400 mt-1"></i>
          <div className="text-sm text-gray-300">
            <p className="font-semibold text-white mb-2">How to use:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Enter a room ID (or use default)</li>
              <li>On device 1: Click "Start Broadcasting"</li>
              <li>On device 2: Use same room ID and click "Watch Stream"</li>
            </ol>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-700"></div>
          <span className="text-gray-500 text-sm">OR</span>
          <div className="flex-1 h-px bg-gray-700"></div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-400 mb-2">Want to manage users?</p>
          <a className="text-blue-400 hover:text-blue-300 underline cursor-pointer">Go to Login</a>
        </div>
      </div>
    </div>
  )
}

export default App
