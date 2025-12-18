import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";

interface AddNewTestModalProps {
  open: boolean;
  onClose: () => void;
}

// Minimal placeholder modal to satisfy imports; can be expanded with real form later.
export default function AddNewTestModal({ open, onClose }: AddNewTestModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Test (placeholder)</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-gray-600">This modal is pending full implementation.</div>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
