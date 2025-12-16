import { Head } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import { useState, useEffect } from "react";
import { Wifi, WifiOff, Send, Activity } from "lucide-react";
import axios from "axios";

export default function RealtimeTest() {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    // Check Echo connection
    if (window.Echo) {
      window.Echo.connector.pusher.connection.bind('connected', () => {
        setIsConnected(true);
        addMessage('✅ Connected to real-time server', 'success');
      });

      window.Echo.connector.pusher.connection.bind('disconnected', () => {
        setIsConnected(false);
        addMessage('⚠️ Disconnected from real-time server', 'warning');
      });

      // Listen for appointment updates
      window.Echo.channel('appointments')
        .listen('.appointment.updated', (e: any) => {
          addMessage(`📅 Appointment ${e.action}: ${e.appointment.title}`, 'info');
        })
        .listen('.opd-appointment.updated', (e: any) => {
          addMessage(`🏥 OPD Appointment ${e.action}: ${e.appointment.title}`, 'info');
        });

      // Check initial connection state
      if (window.Echo.connector.pusher.connection.state === 'connected') {
        setIsConnected(true);
        addMessage('✅ Already connected to real-time server', 'success');
      }
    } else {
      addMessage('❌ Echo not available', 'error');
    }

    return () => {
      window.Echo?.leaveChannel('appointments');
    };
  }, []);

  const addMessage = (text: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const message = {
      id: Date.now(),
      text,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [message, ...prev].slice(0, 20)); // Keep last 20 messages
  };

  const testBroadcast = async () => {
    setIsSending(true);
    try {
      const response = await axios.post('/appointments/test-broadcast');
      addMessage(`📡 Test broadcast sent: ${response.data.message}`, 'success');
    } catch (error: any) {
      addMessage(`❌ Broadcast failed: ${error.response?.data?.message || error.message}`, 'error');
    } finally {
      setIsSending(false);
    }
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-700 bg-green-50 border-green-200';
      case 'error': return 'text-red-700 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'info': return 'text-blue-700 bg-blue-50 border-blue-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  return (
    <HMSLayout user={{ name: "System Admin", email: "", role: "Administrator" }}>
      <Head title="Real-time Test - MediCare HMS" />
      
      <div className="max-w-4xl mx-auto py-10 px-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-6">
          <Activity className="text-blue-600 w-7 h-7" />
          Real-time Broadcasting Test
        </h1>

        {/* Connection Status */}
        <div className={`flex items-center gap-3 p-4 rounded-lg mb-6 ${
          isConnected 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {isConnected ? (
            <>
              <Wifi className="w-5 h-5" />
              <span className="font-medium">Real-time connection active</span>
            </>
          ) : (
            <>
              <WifiOff className="w-5 h-5" />
              <span className="font-medium">Real-time connection inactive</span>
            </>
          )}
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Test Controls</h2>
          <div className="flex gap-4">
            <button
              onClick={testBroadcast}
              disabled={isSending || !isConnected}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              {isSending ? 'Sending...' : 'Test Broadcast'}
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            This will broadcast a test appointment update that should appear in the messages below.
          </p>
        </div>

        {/* Messages */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Real-time Messages</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No messages yet. Try testing the broadcast or create/update an appointment.
              </p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg border ${getMessageColor(message.type)}`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-medium">{message.text}</span>
                    <span className="text-xs opacity-75">{message.timestamp}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">How to Test</h3>
          <ul className="text-blue-700 space-y-2">
            <li>1. Make sure the Reverb server is running: <code className="bg-blue-100 px-2 py-1 rounded">php artisan reverb:start</code></li>
            <li>2. Click "Test Broadcast" to send a test message</li>
            <li>3. Open the appointments calendar in another tab and create/update appointments</li>
            <li>4. Watch for real-time updates in the messages above</li>
          </ul>
        </div>
      </div>
    </HMSLayout>
  );
}
