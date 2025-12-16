import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/Components/ui/dialog';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import { User, Bed as BedIcon, Building2, Calendar, Phone, Droplet, X, Edit, Save } from 'lucide-react';

interface Ward {
  id: number;
  wardid: string;
  name: string;
  code?: string;
  ward_type?: string; // Dynamic - can be any ward type from database
  total_beds: number;
  beds_occupied?: number;
  floor_number?: number;
  description?: string;
  status?: string; // Dynamic - can be any status from database
  department?: {
    id: number;
    name: string;
  };
  beds?: BedData[];
  occupancy_rate?: number;
  available_beds?: number;
}

interface BedData {
  id: number | string; // Allow both for generated IDs
  bed_number: string;
  bed_type: string; // Dynamic - can be any bed type from database
  status: string; // Dynamic - can be any status from database
  last_occupied_at?: string;
  maintenance_notes?: string;
}

interface BedMatrixProps {
  wards: Ward[];
  onBedUpdate: (bedId: number | string, data: Partial<BedData>) => void;
  onWardUpdate: (wardId: number, data: Partial<Ward>) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

interface BedDetails {
  bed: {
    id: number;
    bed_number: string;
    bed_type: string;
    status: string;
    last_occupied_at?: string;
    maintenance_notes?: string;
  };
  ward: {
    id: string;
    name: string;
    code: string;
    ward_type: string;
    floor_number?: number;
    department?: {
      id: string;
      name: string;
    };
  };
  patient?: {
    id: number;
    patient_number: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender: string;
    blood_group?: string;
    phone?: string;
  };
  assignment?: {
    id: number;
    assigned_at: string;
    assignment_notes?: string;
    encounter_id: number;
  };
}

interface BedEditForm {
  status: string;
  maintenance_notes: string;
}

export default function BedMatrix({ wards, onBedUpdate }: BedMatrixProps) {
  const [selectedBedDetails, setSelectedBedDetails] = useState<BedDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<BedEditForm>({
    status: '',
    maintenance_notes: '',
  });

  const fetchBedDetails = async (bedId: number | string) => {
    // Only fetch for real bed IDs (numeric), not generated ones
    if (typeof bedId === 'string' && bedId.includes('-bed-')) {
      console.log('Skipping generated bed ID:', bedId);
      return; // Skip generated bed IDs
    }

    console.log('Fetching details for bed ID:', bedId);
    setIsLoadingDetails(true);
    setShowDetailsModal(true);
    
    try {
      const response = await fetch(`/admin/beds/${bedId}/details`, {
        headers: { 
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Bed details:', data);
        setSelectedBedDetails(data);
        setEditForm({
          status: data.bed.status,
          maintenance_notes: data.bed.maintenance_notes || '',
        });
        setIsEditing(false);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch bed details:', response.status, errorText);
        setShowDetailsModal(false);
      }
    } catch (error) {
      console.error('Error fetching bed details:', error);
      setShowDetailsModal(false);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleSaveBedDetails = async () => {
    if (!selectedBedDetails) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/admin/beds/${selectedBedDetails.bed.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        // Refresh bed details
        await fetchBedDetails(selectedBedDetails.bed.id);
        setIsEditing(false);
        // Trigger parent refresh
        onBedUpdate(selectedBedDetails.bed.id, editForm);
      } else {
        console.error('Failed to update bed');
        alert('Failed to update bed details');
      }
    } catch (error) {
      console.error('Error updating bed:', error);
      alert('Error updating bed details');
    } finally {
      setIsSaving(false);
    }
  };

  // Generate bed representations from aggregate data with realistic status distribution
  const generateBedRepresentations = (ward: Ward) => {
    const beds = [];
    const totalBeds = ward.total_beds || 0;
    const occupiedBeds = ward.beds_occupied || 0;
    const availableBeds = totalBeds - occupiedBeds;

    // Calculate realistic distribution for non-occupied beds
    const maintenanceBeds = Math.floor(totalBeds * 0.02); // 2% in maintenance
    const cleaningBeds = Math.floor(totalBeds * 0.01); // 1% cleaning
    const criticalBeds = Math.floor(occupiedBeds * 0.1); // 10% of occupied are critical
    const isolationBeds = Math.floor(occupiedBeds * 0.05); // 5% of occupied are isolation
    
    let bedCounter = 1;

    // Create occupied bed representations (mix of regular, critical, isolation)
    for (let i = 1; i <= occupiedBeds; i++) {
      let status = 'occupied';
      if (i <= criticalBeds) {
        status = 'critical';
      } else if (i <= criticalBeds + isolationBeds) {
        status = 'isolation';
      }

      beds.push({
        id: `${ward.wardid}-bed-${bedCounter}`,
        bed_number: `${bedCounter.toString().padStart(3, '0')}`,
        bed_type: ward.ward_type || 'STANDARD',
        status: status
      });
      bedCounter++;
    }

    // Create maintenance beds
    for (let i = 1; i <= maintenanceBeds; i++) {
      beds.push({
        id: `${ward.wardid}-bed-${bedCounter}`,
        bed_number: `${bedCounter.toString().padStart(3, '0')}`,
        bed_type: ward.ward_type || 'STANDARD',
        status: 'maintenance'
      });
      bedCounter++;
    }

    // Create cleaning beds
    for (let i = 1; i <= cleaningBeds; i++) {
      beds.push({
        id: `${ward.wardid}-bed-${bedCounter}`,
        bed_number: `${bedCounter.toString().padStart(3, '0')}`,
        bed_type: ward.ward_type || 'STANDARD',
        status: 'cleaning'
      });
      bedCounter++;
    }

    // Fill remaining with available beds
    while (bedCounter <= totalBeds) {
      beds.push({
        id: `${ward.wardid}-bed-${bedCounter}`,
        bed_number: `${bedCounter.toString().padStart(3, '0')}`,
        bed_type: ward.ward_type || 'STANDARD',
        status: 'available'
      });
      bedCounter++;
    }

    return beds;
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-700">Ward & Bed Matrix</h2>
        <p className="text-gray-500 mt-2">
          {wards.length} wards • {wards.reduce((acc, ward) => acc + (ward.total_beds || 0), 0)} beds total
        </p>
        
        {/* Legend */}
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-50 border-2 border-green-200 rounded"></div>
            <span className="text-sm text-gray-600">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-50 border-2 border-blue-200 rounded"></div>
            <span className="text-sm text-gray-600">Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-50 border-2 border-red-200 rounded"></div>
            <span className="text-sm text-gray-600">Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-50 border-2 border-yellow-200 rounded"></div>
            <span className="text-sm text-gray-600">Isolation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-50 border-2 border-amber-200 rounded"></div>
            <span className="text-sm text-gray-600">Cleaning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border-2 border-gray-200 rounded"></div>
            <span className="text-sm text-gray-600">Maintenance</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">Click on beds to cycle through statuses</p>
      </div>

      {wards.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No wards found. Please add some wards to get started.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {wards.map((ward) => (
            <div key={ward.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{ward.name}</h3>
                  <p className="text-sm text-gray-500">{ward.wardid} • {ward.ward_type || 'General'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {(ward.total_beds || 0) - (ward.beds_occupied || 0)} available / {ward.total_beds} total
                  </p>
                  <p className="text-xs text-gray-500">
                    {ward.occupancy_rate ? `${ward.occupancy_rate}% occupied` : '0% occupied'}
                  </p>
                  {(() => {
                    const bedsToShow = ward.beds && ward.beds.length > 0 ? ward.beds : generateBedRepresentations(ward);
                    const statusCounts = bedsToShow.reduce((acc, bed) => {
                      acc[bed.status] = (acc[bed.status] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>);
                    
                    return (
                      <div className="flex flex-wrap gap-1 mt-1 text-xs">
                        {statusCounts.available && <span className="bg-green-100 text-green-700 px-1 rounded">✓{statusCounts.available}</span>}
                        {statusCounts.occupied && <span className="bg-blue-100 text-blue-700 px-1 rounded">👤{statusCounts.occupied}</span>}
                        {statusCounts.critical && <span className="bg-red-100 text-red-700 px-1 rounded">🚨{statusCounts.critical}</span>}
                        {statusCounts.isolation && <span className="bg-yellow-100 text-yellow-700 px-1 rounded">🔒{statusCounts.isolation}</span>}
                        {statusCounts.cleaning && <span className="bg-amber-100 text-amber-700 px-1 rounded">🧹{statusCounts.cleaning}</span>}
                        {statusCounts.maintenance && <span className="bg-gray-100 text-gray-700 px-1 rounded">🔧{statusCounts.maintenance}</span>}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {(() => {
                const bedsToShow = ward.beds && ward.beds.length > 0 ? ward.beds : generateBedRepresentations(ward);
                return bedsToShow.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    {bedsToShow.map((bed) => (
                      <div
                        key={bed.id}
                        className={`
                          p-2 rounded text-center text-xs font-medium cursor-pointer transition-colors border-2
                          ${bed.status === 'available' ? 'bg-green-50 text-green-800 border-green-200 hover:bg-green-100' : ''}
                          ${bed.status === 'occupied' ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100' : ''}
                          ${bed.status === 'critical' ? 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100' : ''}
                          ${bed.status === 'isolation' ? 'bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100' : ''}
                          ${bed.status === 'cleaning' ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100' : ''}
                          ${bed.status === 'maintenance' ? 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200' : ''}
                        `}
                        onClick={(e) => {
                          e.preventDefault();
                          console.log('Bed clicked:', bed.id, 'Type:', typeof bed.id);
                          
                          // Check if it's a real bed (has numeric ID) or generated
                          if (typeof bed.id === 'number') {
                            // Real bed - show details
                            console.log('Opening modal for real bed:', bed.id);
                            fetchBedDetails(bed.id);
                          } else {
                            // Generated bed - cycle status
                            console.log('Cycling status for generated bed:', bed.id);
                            const statuses = ['available', 'occupied', 'critical', 'isolation', 'cleaning', 'maintenance'];
                            const currentIndex = statuses.indexOf(bed.status);
                            const nextStatus = statuses[(currentIndex + 1) % statuses.length];
                            onBedUpdate(bed.id, { status: nextStatus });
                          }
                        }}
                      >
                        <div className="flex items-center justify-center mb-1">
                          {bed.status === 'available' && <span className="text-green-600">✓</span>}
                          {bed.status === 'occupied' && <span className="text-blue-600">👤</span>}
                          {bed.status === 'critical' && <span className="text-red-600">🚨</span>}
                          {bed.status === 'isolation' && <span className="text-yellow-600">🔒</span>}
                          {bed.status === 'cleaning' && <span className="text-amber-600">🧹</span>}
                          {bed.status === 'maintenance' && <span className="text-gray-600">🔧</span>}
                        </div>
                        <div className="text-xs font-semibold">{bed.bed_number}</div>
                        <div className="text-xs opacity-75">{bed.bed_type}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <div className="text-gray-500">
                      <p className="font-medium">Ward Summary</p>
                      <p className="text-sm mt-1">
                        {ward.total_beds} total beds • {(ward.total_beds || 0) - (ward.beds_occupied || 0)} available
                      </p>
                      {ward.occupancy_rate !== undefined && (
                        <p className="text-xs mt-1 text-gray-400">
                          {Math.round(ward.occupancy_rate)}% occupancy rate
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      )}

      {/* Bed Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <BedIcon className="h-5 w-5 text-blue-600" />
              Bed Details
            </DialogTitle>
            <DialogDescription>
              Complete information about the bed and current patient
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="py-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading bed details...</p>
            </div>
          ) : selectedBedDetails ? (
            <div className="space-y-6">
              {/* Bed Information */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BedIcon className="h-4 w-4" />
                    Bed Information
                  </span>
                  {!selectedBedDetails.patient && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditing(!isEditing)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      {isEditing ? 'Cancel' : 'Edit'}
                    </Button>
                  )}
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Bed Number:</span>
                    <p className="font-semibold text-gray-900">{selectedBedDetails.bed.bed_number}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Bed Type:</span>
                    <p className="font-semibold text-gray-900">{selectedBedDetails.bed.bed_type}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-gray-600 text-sm">Status:</Label>
                    {isEditing ? (
                      <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="occupied">Occupied</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="reserved">Reserved</SelectItem>
                          <SelectItem value="cleaning">Cleaning</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={`mt-1 ${
                        selectedBedDetails.bed.status === 'available' ? 'bg-green-100 text-green-800' : ''
                      }${
                        selectedBedDetails.bed.status === 'occupied' ? 'bg-blue-100 text-blue-800' : ''
                      }${
                        selectedBedDetails.bed.status === 'maintenance' ? 'bg-gray-100 text-gray-800' : ''
                      }${
                        selectedBedDetails.bed.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' : ''
                      }${
                        selectedBedDetails.bed.status === 'cleaning' ? 'bg-amber-100 text-amber-800' : ''
                      }`}>
                        {selectedBedDetails.bed.status.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  {selectedBedDetails.bed.last_occupied_at && (
                    <div className="col-span-2">
                      <span className="text-gray-600">Last Occupied:</span>
                      <p className="font-semibold text-gray-900">
                        {new Date(selectedBedDetails.bed.last_occupied_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <Label className="text-gray-600 text-sm">Maintenance Notes:</Label>
                  {isEditing ? (
                    <Textarea
                      value={editForm.maintenance_notes}
                      onChange={(e) => setEditForm({ ...editForm, maintenance_notes: e.target.value })}
                      placeholder="Add maintenance notes..."
                      className="mt-1"
                      rows={3}
                    />
                  ) : (
                    <p className="text-gray-900 text-sm mt-1">
                      {selectedBedDetails.bed.maintenance_notes || 'No maintenance notes'}
                    </p>
                  )}
                </div>
              </div>

              {/* Ward Information */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Ward Information
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Ward Name:</span>
                    <p className="font-semibold text-gray-900">{selectedBedDetails.ward.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Ward Code:</span>
                    <p className="font-semibold text-gray-900">{selectedBedDetails.ward.code}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Ward Type:</span>
                    <p className="font-semibold text-gray-900">{selectedBedDetails.ward.ward_type}</p>
                  </div>
                  {selectedBedDetails.ward.floor_number && (
                    <div>
                      <span className="text-gray-600">Floor:</span>
                      <p className="font-semibold text-gray-900">Floor {selectedBedDetails.ward.floor_number}</p>
                    </div>
                  )}
                  {selectedBedDetails.ward.department && (
                    <div className="col-span-2">
                      <span className="text-gray-600">Department:</span>
                      <p className="font-semibold text-gray-900">{selectedBedDetails.ward.department.name}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Patient Information */}
              {selectedBedDetails.patient ? (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Current Patient
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Patient Number:</span>
                      <p className="font-semibold text-gray-900">{selectedBedDetails.patient.patient_number}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <p className="font-semibold text-gray-900">
                        {selectedBedDetails.patient.first_name} {selectedBedDetails.patient.last_name}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Gender:</span>
                      <p className="font-semibold text-gray-900">{selectedBedDetails.patient.gender}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Date of Birth:</span>
                      <p className="font-semibold text-gray-900">
                        {new Date(selectedBedDetails.patient.date_of_birth).toLocaleDateString()}
                      </p>
                    </div>
                    {selectedBedDetails.patient.blood_group && (
                      <div className="flex items-center gap-2">
                        <Droplet className="h-4 w-4 text-red-600" />
                        <div>
                          <span className="text-gray-600">Blood Group:</span>
                          <p className="font-semibold text-gray-900">{selectedBedDetails.patient.blood_group}</p>
                        </div>
                      </div>
                    )}
                    {selectedBedDetails.patient.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-blue-600" />
                        <div>
                          <span className="text-gray-600">Phone:</span>
                          <p className="font-semibold text-gray-900">{selectedBedDetails.patient.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedBedDetails.assignment && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-green-600" />
                        <span className="text-gray-600">Admitted:</span>
                        <p className="font-semibold text-gray-900">
                          {new Date(selectedBedDetails.assignment.assigned_at).toLocaleString()}
                        </p>
                      </div>
                      {selectedBedDetails.assignment.assignment_notes && (
                        <div className="mt-2">
                          <span className="text-gray-600 text-sm">Notes:</span>
                          <p className="text-gray-900 text-sm mt-1">{selectedBedDetails.assignment.assignment_notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 text-center">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 font-medium">No Patient Assigned</p>
                  <p className="text-gray-500 text-sm mt-1">This bed is currently {selectedBedDetails.bed.status}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsModal(false)}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              <p>No details available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
