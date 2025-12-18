// resources/js/Pages/Inpatient/components/AlertDetailsModal.tsx
import React from "react";
import { Dialog } from "@headlessui/react";

interface Alert {
  id: number;
  title: string;
  message: string;
  type: string;
  priority: string;
  patientName?: string;
  bedNumber?: string;
  timestamp: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  alert: Alert | null;
}

export default function AlertDetailsModal({ open, onClose, alert }: Props) {
  if (!alert) return null;

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
          <Dialog.Title className="text-lg font-bold text-gray-900 mb-2">
            {alert.title}
          </Dialog.Title>
          <p className="text-sm text-gray-700 mb-3">{alert.message}</p>

          <div className="space-y-1 text-sm text-gray-600">
            <p><strong>Type:</strong> {alert.type}</p>
            <p><strong>Priority:</strong> {alert.priority}</p>
            {alert.patientName && (
              <p><strong>Patient:</strong> {alert.patientName}</p>
            )}
            {alert.bedNumber && <p><strong>Bed:</strong> {alert.bedNumber}</p>}
            <p><strong>Time:</strong> {new Date(alert.timestamp).toLocaleString()}</p>
          </div>

          <div className="mt-5 text-right">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
