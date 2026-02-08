import { useState } from 'react';
import Broadcaster from '../components/Broadcaster';
import Viewer from '../components/Viewer';

export default function MonitorPage() {
    const [mode, setMode] = useState<'select' | 'broadcaster' | 'viewer'>('select');
    const [roomId, setRoomId] = useState('baby-room-1');

    if (mode === 'broadcaster') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-charcoal p-4">
                <button
                    className="mb-4 px-4 py-2 rounded-lg text-white hover:bg-dark-gray transition-colors flex items-center gap-2 bg-transparent"
                    onClick={() => setMode('select')}
                >
                    ← Back to selection
                </button>
                <Broadcaster roomId={roomId} />
            </div>
        );
    }

    if (mode === 'viewer') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-charcoal p-4">
                <button
                    className="mb-4 px-4 py-2 rounded-lg text-white hover:bg-dark-gray transition-colors flex items-center gap-2 bg-transparent"
                    onClick={() => setMode('select')}
                >
                    ← Back to selection
                </button>
                <Viewer roomId={roomId} />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-warm-white p-4">
            <div className="flex flex-col gap-6 rounded-[24px] bg-white p-8 max-w-md w-full shadow-xl">
                <div className="text-center">
                    <span className="text-4xl mb-2 block">👶</span>
                    <h2 className="text-2xl font-extrabold text-charcoal">
                        Baby<span className="text-coral">Watcher</span>
                    </h2>
                    <p className="text-sm text-mid-gray mt-1">
                        Peer-to-peer video streaming with WebRTC
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-warm-cream" />
                    <span className="label-accent text-[0.65rem]">Select Mode</span>
                    <div className="flex-1 h-px bg-warm-cream" />
                </div>

                <label className="w-full">
                    <div className="mb-2">
                        <span className="text-sm font-semibold text-charcoal">Room ID</span>
                    </div>
                    <input
                        type="text"
                        placeholder="Enter room ID"
                        className="w-full px-4 py-3 rounded-xl bg-warm-white border border-warm-cream text-charcoal placeholder-light-gray focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                    />
                    <div className="mt-2">
                        <span className="text-xs text-light-gray">
                            Share this ID with other devices
                        </span>
                    </div>
                </label>

                <div className="grid grid-cols-1 gap-4">
                    <button
                        className="px-6 py-4 rounded-xl bg-coral hover:bg-coral-dark text-white font-bold text-base flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                        onClick={() => setMode('broadcaster')}
                        disabled={!roomId.trim()}
                    >
                        📹
                        <span className="flex-1 text-left">Start Broadcasting</span>
                        <span className="px-3 py-1 text-xs bg-coral-dark rounded-full">
                            Camera
                        </span>
                    </button>

                    <button
                        className="px-6 py-4 rounded-xl bg-soft-blue hover:bg-soft-blue/80 text-white font-bold text-base flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                        onClick={() => setMode('viewer')}
                        disabled={!roomId.trim()}
                    >
                        👀
                        <span className="flex-1 text-left">Watch Stream</span>
                        <span className="px-3 py-1 text-xs bg-soft-blue/60 rounded-full">
                            Viewer
                        </span>
                    </button>
                </div>

                <div className="bg-ice-blue rounded-xl p-4 flex gap-3">
                    <span className="text-lg mt-0.5">💡</span>
                    <div className="text-sm text-charcoal/80">
                        <p className="font-semibold text-charcoal mb-2">How to use:</p>
                        <ol className="list-decimal list-inside space-y-1 text-xs">
                            <li>Enter a room ID (or use default)</li>
                            <li>On device 1: Click "Start Broadcasting"</li>
                            <li>On device 2: Same room ID → "Watch Stream"</li>
                        </ol>
                    </div>
                </div>

                <div className="text-center">
                    <a href="/" className="text-sm text-coral hover:text-coral-dark no-underline">
                        ← Back to Home
                    </a>
                </div>
            </div>
        </div>
    );
}
