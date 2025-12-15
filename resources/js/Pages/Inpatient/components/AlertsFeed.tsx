import React, { useState, useEffect } from 'react';

interface Alert {
  id: number;
  type: 'admission' | 'vitals' | 'lab' | 'medication' | 'discharge' | 'emergency';
  title: string;
  message: string;
  patientName?: string;
  bedNumber?: string;
  timestamp: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  read: boolean;
}

interface Props {
  alerts: Alert[];
  maxItems?: number;
  autoRefresh?: boolean;
  onAlertClick?: (alert: Alert) => void;
}

export default function AlertsFeed({ alerts, maxItems = 10, autoRefresh = true, onAlertClick }: Props) {
  const [displayAlerts, setDisplayAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Sort alerts by timestamp (newest first) and limit display
    const sortedAlerts = [...alerts]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, maxItems);
    
    setDisplayAlerts(sortedAlerts);
    setUnreadCount(alerts.filter(alert => !alert.read).length);
  }, [alerts, maxItems]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'admission': return '🏥';
      case 'vitals': return '📊';
      case 'lab': return '🧪';
      case 'medication': return '💊';
      case 'discharge': return '🚪';
      case 'emergency': return '🚨';
      default: return '📋';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-l-red-500 bg-red-50';
      case 'high': return 'border-l-orange-500 bg-orange-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-blue-500 bg-blue-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const handleAlertClick = (alert: Alert) => {
    if (onAlertClick) {
      onAlertClick(alert);
    }
  };

  if (displayAlerts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">🔔</div>
        <p className="text-sm">No recent alerts</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-gray-900">Recent Alerts</h4>
        {unreadCount > 0 && (
          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            {unreadCount} new
          </span>
        )}
      </div>

      {/* Alerts List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {displayAlerts.map((alert) => (
          <div
            key={alert.id}
            onClick={() => handleAlertClick(alert)}
            className={`
              border-l-4 p-3 rounded-r-lg cursor-pointer transition-all hover:shadow-sm
              ${getPriorityColor(alert.priority)}
              ${!alert.read ? 'ring-2 ring-blue-200' : ''}
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="text-lg">{getAlertIcon(alert.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h5 className="font-medium text-sm text-gray-900 truncate">
                      {alert.title}
                    </h5>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadge(alert.priority)}`}>
                      {alert.priority}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                  
                  {alert.patientName && (
                    <div className="text-xs text-gray-600">
                      Patient: {alert.patientName}
                      {alert.bedNumber && ` • Bed ${alert.bedNumber}`}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-xs text-gray-500 ml-2 flex-shrink-0">
                {formatTimestamp(alert.timestamp)}
              </div>
            </div>
            
            {!alert.read && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
          </div>
        ))}
      </div>

      {/* View All Link */}
      {alerts.length > maxItems && (
        <div className="text-center pt-2 border-t border-gray-200">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View all {alerts.length} alerts
          </button>
        </div>
      )}
    </div>
  );
}