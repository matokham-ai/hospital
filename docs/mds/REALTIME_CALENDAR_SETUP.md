# Real-time Doctor's Schedule Calendar

The Doctor's Schedule calendar now supports live updates using Laravel Reverb WebSocket broadcasting. This means that when appointments are created, updated, or cancelled, all connected users will see the changes immediately without needing to refresh the page.

## Features Implemented

### 1. Real-time Appointment Updates
- **New appointments** appear instantly on all connected calendars
- **Status changes** (scheduled → in progress → completed) update live
- **Cancelled appointments** are removed from the calendar immediately
- **Doctor-specific schedules** update when viewing individual doctor calendars

### 2. Broadcasting Events
- `AppointmentUpdated` - Broadcasts regular appointment changes
- `OpdAppointmentUpdated` - Broadcasts OPD appointment changes
- Events are sent to multiple channels:
  - `appointments` - General appointment updates
  - `doctor-schedule.{doctor_id}` - Doctor-specific updates
  - `opd-appointments` - OPD-specific updates

### 3. Real-time Status Indicator
- Connection status indicator in bottom-right corner
- Shows "Live Updates Active" when connected
- Shows "Connecting..." when disconnected
- Displays last connection time

## Setup Instructions

### 1. Start the Reverb Server
```bash
# Option 1: Use the provided batch file (Windows)
start-reverb.bat

# Option 2: Run manually
php artisan reverb:start --host=0.0.0.0 --port=8080
```

### 2. Verify Configuration
The following environment variables should be set in your `.env` file:
```env
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=846932
REVERB_APP_KEY=hr2c2s55un1q3kwfyvsq
REVERB_APP_SECRET=zagdukivwiil7e8ztmw1
REVERB_HOST="localhost"
REVERB_PORT=8080
REVERB_SCHEME=http
```

### 3. Test the Setup
1. Visit `/appointments/realtime-test` to test the broadcasting
2. Open multiple browser tabs with the appointments calendar
3. Create, update, or cancel appointments in one tab
4. Watch the changes appear instantly in other tabs

## How It Works

### Backend Broadcasting
When appointments are modified, the system automatically broadcasts events:

```php
// Example: When an appointment status changes
$appointment->update(['status' => 'IN_PROGRESS']);
broadcast(new AppointmentUpdated($appointment, 'status_changed'));
```

### Frontend Listening
The calendar components listen for these broadcasts:

```javascript
// Listen for appointment updates
window.Echo.channel('appointments')
  .listen('.appointment.updated', (e) => {
    // Update the calendar with new data
    updateCalendarEvent(e.appointment);
  });
```

### Channels Used
- **`appointments`** - All appointment updates
- **`doctor-schedule.{doctor_id}`** - Updates for specific doctor's schedule
- **`opd-appointments`** - OPD-specific appointment updates

## Pages with Real-time Updates

### 1. Appointments Calendar (`/appointments/calendar`)
- Shows all appointments with live updates
- Real-time status changes (scheduled → in progress → completed)
- Instant addition/removal of appointments

### 2. Create Appointment (`/appointments/create`)
- Doctor's schedule updates live when selecting a doctor
- Shows real-time availability as other appointments are booked

### 3. Test Page (`/appointments/realtime-test`)
- Debug and test real-time functionality
- Send test broadcasts
- Monitor connection status and messages

## Troubleshooting

### Connection Issues
1. **Check Reverb Server**: Make sure `php artisan reverb:start` is running
2. **Port Conflicts**: Ensure port 8080 is available
3. **Firewall**: Check if Windows Firewall is blocking the connection
4. **Browser Console**: Check for WebSocket connection errors

### Broadcasting Not Working
1. **Queue Workers**: Make sure queue workers are running if using database queues
2. **Event Broadcasting**: Verify events implement `ShouldBroadcast`
3. **Channel Authorization**: Check if private channels need authentication

### Performance Considerations
- Real-time updates reduce server load by eliminating polling
- Fallback polling every 5 minutes ensures data consistency
- Connection automatically reconnects if dropped

## Development Notes

### Adding New Real-time Features
1. Create event classes that implement `ShouldBroadcast`
2. Define appropriate channels in the `broadcastOn()` method
3. Add frontend listeners in the relevant components
4. Test with multiple browser tabs

### Event Structure
All broadcast events follow this structure:
```json
{
  "action": "created|updated|completed|cancelled",
  "appointment": {
    "id": 123,
    "title": "Patient Name – Complaint",
    "start": "2024-01-15T10:00:00",
    "end": "2024-01-15T10:45:00",
    "color": "#3b82f6",
    "status": "SCHEDULED",
    "extendedProps": {
      "patient": {...},
      "appointment": {...}
    }
  }
}
```

## Security Notes
- All channels are currently public for simplicity
- In production, consider using private channels with authentication
- Validate user permissions before broadcasting sensitive data
- Monitor WebSocket connections for abuse

---

The real-time calendar provides a much better user experience by eliminating the need for manual refreshes and ensuring all staff see the most current appointment information instantly.