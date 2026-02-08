# Testing Auto-Connect Feature

## How to Test the Automatic Connection

### Scenario 1: Viewer joins first, broadcaster comes online later

1. **Open Browser Tab 1** (Viewer)
   - Go to http://localhost:5173/
   - Keep the default room ID: `baby-room-1`
   - Click "Watch Stream"
   - You should see: "Waiting for broadcaster to start in room baby-room-1. Will auto-connect when live!"

2. **Open Browser Tab 2** (Broadcaster)
   - Go to http://localhost:5173/
   - Use the SAME room ID: `baby-room-1`
   - Click "Start Broadcasting"
   - Allow camera/microphone permissions

3. **Result**:
   - Tab 2 should show your camera feed
   - Tab 1 (Viewer) should **automatically** start showing the stream within 1-2 seconds
   - No need to refresh or click anything!

### Scenario 2: Broadcaster goes offline and comes back online

1. With both tabs from Scenario 1 still open
2. In Tab 2 (Broadcaster), click "Stop Broadcasting"
3. Tab 1 (Viewer) should show "Broadcaster has disconnected" and go back to waiting
4. In Tab 2, click "Start Broadcasting" again
5. Tab 1 should **automatically reconnect** and show the stream again

### Scenario 3: Broadcaster is already streaming when viewer joins

1. **Open Browser Tab 1** (Broadcaster first this time)
   - Go to http://localhost:5173/
   - Room ID: `baby-room-1`
   - Click "Start Broadcasting"

2. **Open Browser Tab 2** (Viewer)
   - Go to http://localhost:5173/
   - Same room ID: `baby-room-1`
   - Click "Watch Stream"
   - Should immediately connect and show the stream

### Multiple Viewers

You can open multiple viewer tabs, and they will all automatically receive the broadcast when it starts!

## Expected Behavior

✅ Viewer automatically connects when broadcaster comes online
✅ Viewer automatically reconnects if broadcaster restarts
✅ Clear status messages showing connection state
✅ No manual refresh needed
✅ Works across different devices on the same network
