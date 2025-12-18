import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import { AlertTriangle, Activity, Users, TrendingUp, CheckCircle } from 'lucide-react';

interface Alert {
    id: number;
    patient_id: number;
    patient_name: string;
    mrn: string;
    age: number;
    location: string;
    alert_type: 'ews' | 'fall_risk' | 'sepsis';
    severity: 'critical' | 'high' | 'medium' | 'low';
    score: number;
    title: string;
    description: string;
    triggered_at: string;
    status: 'active' | 'acknowledged' | 'resolved';
    actions_taken: string | null;
}

interface Statistics {
    active_alerts: number;
    critical: number;
    high: number;
    medium: number;
    ews_alerts: number;
    fall_risk_alerts: number;
    sepsis_alerts: number;
}

interface Props {
    alerts: Alert[];
    statistics: Statistics;
}

export default function SafetyAlerts({ alerts, statistics }: Props) {
    const [selectedTab, setSelectedTab] = useState<'all' | 'ews' | 'fall_risk' | 'sepsis'>('all');
    const [actionModal, setActionModal] = useState<{ show: boolean; alert: Alert | null }>({
        show: false,
        alert: null,
    });
    const [actionsTaken, setActionsTaken] = useState('');

    const filteredAlerts = alerts.filter(alert => {
        if (selectedTab === 'all') return true;
        return alert.alert_type === selectedTab;
    });

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-100 text-red-800 border-red-300';
            case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'low': return 'bg-green-100 text-green-800 border-green-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getAlertTypeLabel = (type: string) => {
        switch (type) {
            case 'ews': return 'Early Warning Score';
            case 'fall_risk': return 'Fall Risk';
            case 'sepsis': return 'Sepsis Screening';
            default: return type;
        }
    };

    const handleAcknowledge = (alert: Alert) => {
        setActionModal({ show: true, alert });
    };

    const submitAcknowledgement = () => {
        if (!actionModal.alert) return;

        router.post(`/nurse/alerts/${actionModal.alert.id}/acknowledge`, {
            actions_taken: actionsTaken,
        }, {
            onSuccess: () => {
                setActionModal({ show: false, alert: null });
                setActionsTaken('');
            },
        });
    };

    return (
        <HMSLayout>
            <Head title="Safety Alerts" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Safety Alerts</h1>
                        <p className="text-gray-600 mt-1">Monitor and respond to patient safety alerts</p>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Active Alerts</p>
                                <p className="text-3xl font-bold text-gray-900">{statistics.active_alerts}</p>
                            </div>
                            <AlertTriangle className="h-12 w-12 text-red-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">EWS Alerts</p>
                                <p className="text-3xl font-bold text-gray-900">{statistics.ews_alerts}</p>
                            </div>
                            <Activity className="h-12 w-12 text-blue-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Fall Risk</p>
                                <p className="text-3xl font-bold text-gray-900">{statistics.fall_risk_alerts}</p>
                            </div>
                            <Users className="h-12 w-12 text-orange-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Sepsis Alerts</p>
                                <p className="text-3xl font-bold text-gray-900">{statistics.sepsis_alerts}</p>
                            </div>
                            <TrendingUp className="h-12 w-12 text-purple-500" />
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            {[
                                { key: 'all', label: 'All Alerts' },
                                { key: 'ews', label: 'Early Warning Score' },
                                { key: 'fall_risk', label: 'Fall Risk' },
                                { key: 'sepsis', label: 'Sepsis' },
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setSelectedTab(tab.key as any)}
                                    className={`px-6 py-3 text-sm font-medium border-b-2 ${
                                        selectedTab === tab.key
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Alerts List */}
                    <div className="p-6 space-y-4">
                        {filteredAlerts.length === 0 ? (
                            <div className="text-center py-12">
                                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                                <p className="text-gray-600">No active alerts</p>
                            </div>
                        ) : (
                            filteredAlerts.map(alert => (
                                <div
                                    key={alert.id}
                                    className={`border-2 rounded-lg p-4 ${getSeverityColor(alert.severity)}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(alert.severity)}`}>
                                                    {alert.severity.toUpperCase()}
                                                </span>
                                                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium">
                                                    {getAlertTypeLabel(alert.alert_type)}
                                                </span>
                                                <span className="text-sm text-gray-600">
                                                    Score: {alert.score}
                                                </span>
                                            </div>

                                            <h3 className="text-lg font-bold mb-1">{alert.title}</h3>
                                            
                                            <div className="grid grid-cols-2 gap-4 mb-3">
                                                <div>
                                                    <p className="text-sm font-semibold">{alert.patient_name}</p>
                                                    <p className="text-sm text-gray-600">{alert.mrn} • Age {alert.age}</p>
                                                    <p className="text-sm text-gray-600">{alert.location}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">
                                                        Triggered: {new Date(alert.triggered_at).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>

                                            <p className="text-sm mb-3">{alert.description}</p>

                                            {alert.actions_taken && (
                                                <div className="bg-white bg-opacity-50 rounded p-3 mb-3">
                                                    <p className="text-sm font-semibold mb-1">Actions Taken:</p>
                                                    <p className="text-sm">{alert.actions_taken}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="ml-4">
                                            {alert.status === 'active' && (
                                                <button
                                                    onClick={() => handleAcknowledge(alert)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                                >
                                                    Acknowledge
                                                </button>
                                            )}
                                            {alert.status === 'acknowledged' && (
                                                <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                                                    Acknowledged
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Acknowledgement Modal */}
            {actionModal.show && actionModal.alert && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
                        <h2 className="text-2xl font-bold mb-4">Acknowledge Alert</h2>
                        
                        <div className="mb-4 p-4 bg-gray-50 rounded">
                            <p className="font-semibold">{actionModal.alert.patient_name}</p>
                            <p className="text-sm text-gray-600">{actionModal.alert.title}</p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Actions Taken *
                            </label>
                            <textarea
                                value={actionsTaken}
                                onChange={(e) => setActionsTaken(e.target.value)}
                                rows={4}
                                className="w-full border border-gray-300 rounded-lg p-3"
                                placeholder="Describe the actions taken in response to this alert..."
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setActionModal({ show: false, alert: null })}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitAcknowledgement}
                                disabled={!actionsTaken.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </HMSLayout>
    );
}
