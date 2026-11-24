import React, { useState, useEffect, useCallback } from 'react';
import { timetableService } from '../../services/timetable.service';
import { facultyService } from '../../services/faculty.service';
import { sectionService } from '../../services/academic.service';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Spinner } from '../../components/common/Spinner';
import {
  Calendar,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  DoorOpen,
  Layers,
  Clock,
  BookOpen,
  GraduationCap,
  Building2,
  AlertCircle,
} from 'lucide-react';

const DAYS_OF_WEEK = [
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
  { value: 'SATURDAY', label: 'Saturday' },
];

export const AdminTimetableManagement = () => {
  const [activeTab, setActiveTab] = useState('timetable'); // 'timetable' | 'rooms'

  // Timetable State
  const [timetables, setTimetables] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedDayFilter, setSelectedDayFilter] = useState('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState('');

  // Timetable Modal State
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [isEditingSlot, setIsEditingSlot] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [allocationId, setAllocationId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('MONDAY');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [roomId, setRoomId] = useState('');
  const [slotError, setSlotError] = useState('');
  const [isSubmittingSlot, setIsSubmittingSlot] = useState(false);

  // Room Modal State
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isEditingRoom, setIsEditingRoom] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomNumber, setRoomNumber] = useState('');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('1');
  const [capacity, setCapacity] = useState('60');
  const [roomType, setRoomType] = useState('CLASSROOM');
  const [roomError, setRoomError] = useState('');
  const [isSubmittingRoom, setIsSubmittingRoom] = useState(false);

  // Delete State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState('slot'); // 'slot' | 'room'
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { success, error } = useToast();

  const fetchDependencies = useCallback(async () => {
    try {
      const [allocList, roomList, secList] = await Promise.all([
        facultyService.getAllAllocations(),
        timetableService.getRooms(),
        sectionService.getAll(),
      ]);
      setAllocations(allocList);
      setRooms(roomList);
      setSections(secList);
    } catch (err) {
      console.error('Failed to load dependencies:', err);
    }
  }, []);

  const fetchTimetables = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await timetableService.getTimetables({
        day_of_week: selectedDayFilter || undefined,
        section_id: selectedSectionFilter ? parseInt(selectedSectionFilter) : undefined,
        room_id: selectedRoomFilter ? parseInt(selectedRoomFilter) : undefined,
      });
      setTimetables(data);
    } catch (err) {
      error('Failed to load timetable entries.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDayFilter, selectedSectionFilter, selectedRoomFilter, error]);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  useEffect(() => {
    fetchTimetables();
  }, [fetchTimetables]);

  // Open Timetable Entry Modal
  const openCreateSlotModal = () => {
    setIsEditingSlot(false);
    setSelectedSlot(null);
    setAllocationId(allocations.length > 0 ? allocations[0].id.toString() : '');
    setDayOfWeek('MONDAY');
    setStartTime('09:00');
    setEndTime('10:00');
    setRoomId(rooms.length > 0 ? rooms[0].id.toString() : '');
    setSlotError('');
    setIsSlotModalOpen(true);
  };

  const openEditSlotModal = (slot) => {
    setIsEditingSlot(true);
    setSelectedSlot(slot);
    setAllocationId(slot.subject_allocation_id.toString());
    setDayOfWeek(slot.day_of_week);
    setStartTime(slot.start_time.substring(0, 5));
    setEndTime(slot.end_time.substring(0, 5));
    setRoomId(slot.room_id ? slot.room_id.toString() : '');
    setSlotError('');
    setIsSlotModalOpen(true);
  };

  const handleSaveSlot = async (e) => {
    e.preventDefault();
    setSlotError('');

    if (!allocationId || !dayOfWeek || !startTime || !endTime) {
      setSlotError('Please select Subject Allocation, Day, and Time Range.');
      return;
    }

    setIsSubmittingSlot(true);
    try {
      const payload = {
        subject_allocation_id: parseInt(allocationId),
        day_of_week: dayOfWeek,
        start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
        end_time: endTime.length === 5 ? `${endTime}:00` : endTime,
        room_id: roomId ? parseInt(roomId) : null,
      };

      if (isEditingSlot && selectedSlot) {
        await timetableService.updateTimetable(selectedSlot.id, payload);
        success('Timetable entry updated.');
      } else {
        await timetableService.createTimetable(payload);
        success('Class slot scheduled successfully.');
      }
      setIsSlotModalOpen(false);
      fetchTimetables();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save timetable slot.';
      setSlotError(msg);
      error(msg);
    } finally {
      setIsSubmittingSlot(false);
    }
  };

  // Open Room Modal
  const openCreateRoomModal = () => {
    setIsEditingRoom(false);
    setSelectedRoom(null);
    setRoomNumber(`LH-${Math.floor(100 + Math.random() * 899)}`);
    setBuilding('Main Academic Block');
    setFloor('1');
    setCapacity('60');
    setRoomType('CLASSROOM');
    setRoomError('');
    setIsRoomModalOpen(true);
  };

  const openEditRoomModal = (rm) => {
    setIsEditingRoom(true);
    setSelectedRoom(rm);
    setRoomNumber(rm.room_number);
    setBuilding(rm.building);
    setFloor(rm.floor.toString());
    setCapacity(rm.capacity.toString());
    setRoomType(rm.type);
    setRoomError('');
    setIsRoomModalOpen(true);
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    setRoomError('');

    if (!roomNumber.trim() || !building.trim() || !capacity) {
      setRoomError('Room Number, Building, and Capacity are required.');
      return;
    }

    setIsSubmittingRoom(true);
    try {
      const payload = {
        room_number: roomNumber.trim(),
        building: building.trim(),
        floor: parseInt(floor) || 1,
        capacity: parseInt(capacity) || 60,
        type: roomType,
        is_active: true,
      };

      if (isEditingRoom && selectedRoom) {
        await timetableService.updateRoom(selectedRoom.id, payload);
        success(`Room '${roomNumber}' updated.`);
      } else {
        await timetableService.createRoom(payload);
        success(`Room '${roomNumber}' created.`);
      }
      setIsRoomModalOpen(false);
      fetchDependencies();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save room.';
      setRoomError(msg);
      error(msg);
    } finally {
      setIsSubmittingRoom(false);
    }
  };

  // Delete Action
  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      if (deleteType === 'slot') {
        await timetableService.deleteTimetable(itemToDelete.id);
        success('Timetable entry removed.');
        fetchTimetables();
      } else {
        await timetableService.deleteRoom(itemToDelete.id);
        success(`Room '${itemToDelete.room_number}' deleted.`);
        fetchDependencies();
      }
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to delete item.';
      error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Columns for Timetable Table
  const slotColumns = [
    {
      header: 'Day & Timing',
      key: 'timing',
      render: (row) => (
        <div>
          <Badge variant="primary" size="sm" className="font-bold">
            {row.day_of_week}
          </Badge>
          <div className="text-xs font-mono font-bold text-white mt-1 flex items-center space-x-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{row.start_time.substring(0, 5)} – {row.end_time.substring(0, 5)}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Subject',
      key: 'subject',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-brand-400 text-xs">
            {row.allocation?.subject?.code}
          </span>
          <div className="font-bold text-white text-sm">{row.allocation?.subject?.name}</div>
        </div>
      ),
    },
    {
      header: 'Section & Faculty',
      key: 'section_faculty',
      render: (row) => (
        <div>
          <Badge variant="success" size="sm" className="font-mono">
            Sec {row.allocation?.section?.name}
          </Badge>
          <div className="text-xs text-slate-300 font-semibold mt-0.5">
            {row.allocation?.faculty ? `${row.allocation.faculty.first_name} ${row.allocation.faculty.last_name}` : 'Staff'}
          </div>
        </div>
      ),
    },
    {
      header: 'Room / Venue',
      key: 'room',
      render: (row) => (
        <div className="flex items-center space-x-1.5 text-xs text-slate-300">
          <DoorOpen className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-semibold">{row.room_number || row.room?.room_number || 'TBD'}</span>
        </div>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end space-x-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditSlotModal(row)}
            className="p-1.5"
            title="Edit Slot"
          >
            <Edit2 className="w-4 h-4 text-slate-300 hover:text-brand-400" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDeleteType('slot');
              setItemToDelete(row);
              setIsDeleteDialogOpen(true);
            }}
            className="p-1.5"
            title="Delete Slot"
          >
            <Trash2 className="w-4 h-4 text-rose-400 hover:text-rose-300" />
          </Button>
        </div>
      ),
    },
  ];

  // Columns for Rooms Table
  const roomColumns = [
    {
      header: 'Room Identifier',
      key: 'room_number',
      render: (row) => (
        <Badge variant="cyan" size="sm" className="font-mono font-bold text-xs">
          {row.room_number}
        </Badge>
      ),
    },
    {
      header: 'Building & Location',
      key: 'building',
      render: (row) => (
        <div>
          <div className="font-bold text-white text-xs">{row.building}</div>
          <div className="text-[11px] text-slate-400">Floor {row.floor}</div>
        </div>
      ),
    },
    {
      header: 'Capacity',
      key: 'capacity',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-200">
          {row.capacity} Seats
        </span>
      ),
    },
    {
      header: 'Type',
      key: 'type',
      render: (row) => (
        <Badge variant="primary" size="sm">{row.type}</Badge>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end space-x-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditRoomModal(row)}
            className="p-1.5"
            title="Edit Room"
          >
            <Edit2 className="w-4 h-4 text-slate-300 hover:text-brand-400" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDeleteType('room');
              setItemToDelete(row);
              setIsDeleteDialogOpen(true);
            }}
            className="p-1.5"
            title="Delete Room"
          >
            <Trash2 className="w-4 h-4 text-rose-400 hover:text-rose-300" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center space-x-2.5">
            <Calendar className="w-6 h-6 text-brand-400" />
            <span>Master Timetable & Scheduling Engine</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure weekly lecture routines, room bookings, and automated conflict prevention.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {activeTab === 'timetable' ? (
            <Button variant="primary" icon={Plus} onClick={openCreateSlotModal}>
              Add Class Slot
            </Button>
          ) : (
            <Button variant="primary" icon={Plus} onClick={openCreateRoomModal}>
              Add Campus Room
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('timetable')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'timetable'
              ? 'bg-brand-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Master Timetable Matrix ({timetables.length})
        </button>
        <button
          onClick={() => setActiveTab('rooms')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'rooms'
              ? 'bg-brand-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Classrooms & Venues ({rooms.length})
        </button>
      </div>

      {/* TAB 1: Timetable */}
      {activeTab === 'timetable' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <Card bodyClassName="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1">
                <div className="w-full sm:w-48">
                  <Select
                    options={[
                      { value: '', label: 'All Days' },
                      ...DAYS_OF_WEEK,
                    ]}
                    value={selectedDayFilter}
                    onChange={(e) => setSelectedDayFilter(e.target.value)}
                  />
                </div>
                <div className="w-full sm:w-56">
                  <Select
                    options={[
                      { value: '', label: 'All Lecture Sections' },
                      ...sections.map((s) => ({ value: s.id.toString(), label: `Section ${s.name} (${s.semester?.name})` })),
                    ]}
                    value={selectedSectionFilter}
                    onChange={(e) => setSelectedSectionFilter(e.target.value)}
                  />
                </div>
                <div className="w-full sm:w-48">
                  <Select
                    options={[
                      { value: '', label: 'All Rooms' },
                      ...rooms.map((r) => ({ value: r.id.toString(), label: r.room_number })),
                    ]}
                    value={selectedRoomFilter}
                    onChange={(e) => setSelectedRoomFilter(e.target.value)}
                  />
                </div>
              </div>
              <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchTimetables}>
                Refresh
              </Button>
            </div>
          </Card>

          {/* Timetable Table */}
          <Card bodyClassName="p-0">
            <Table
              columns={slotColumns}
              data={timetables}
              isLoading={isLoading}
              emptyMessage="No scheduled class slots found."
            />
          </Card>
        </div>
      )}

      {/* TAB 2: Rooms */}
      {activeTab === 'rooms' && (
        <Card bodyClassName="p-0">
          <Table
            columns={roomColumns}
            data={rooms}
            isLoading={false}
            emptyMessage="No campus rooms configured."
          />
        </Card>
      )}

      {/* Add/Edit Slot Modal */}
      <Modal
        isOpen={isSlotModalOpen}
        onClose={() => setIsSlotModalOpen(false)}
        title={isEditingSlot ? 'Edit Class Slot' : 'Schedule Class Slot'}
        subtitle="Automated conflict detection prevents overlapping faculty, room, and section bookings"
      >
        <form onSubmit={handleSaveSlot} className="space-y-4">
          {slotError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{slotError}</span>
            </div>
          )}

          <Select
            label="Assigned Subject & Instructor"
            options={allocations.map((a) => ({
              value: a.id.toString(),
              label: `${a.subject?.code} - ${a.subject?.name} (Sec ${a.section?.name} • ${a.faculty?.first_name} ${a.faculty?.last_name})`,
            }))}
            value={allocationId}
            onChange={(e) => setAllocationId(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Day of Week"
              options={DAYS_OF_WEEK}
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
              required
            />
            <Input
              label="Start Time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
            <Input
              label="End Time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>

          <Select
            label="Classroom / Hall Venue"
            options={rooms.map((r) => ({
              value: r.id.toString(),
              label: `${r.room_number} (${r.building} • Cap: ${r.capacity} • ${r.type})`,
            }))}
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsSlotModalOpen(false)} disabled={isSubmittingSlot}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmittingSlot}>
              {isEditingSlot ? 'Update Slot' : 'Confirm & Schedule'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add/Edit Room Modal */}
      <Modal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        title={isEditingRoom ? 'Edit Room Record' : 'Register Campus Room'}
        subtitle="Manage lecture theaters, computer labs, and seminar halls"
      >
        <form onSubmit={handleSaveRoom} className="space-y-4">
          {roomError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {roomError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Room Identifier"
              placeholder="e.g. LH-204"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              required
            />
            <Input
              label="Building / Wing"
              placeholder="e.g. Science Block"
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Floor Number"
              type="number"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              required
            />
            <Input
              label="Seating Capacity"
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              required
            />
            <Select
              label="Venue Type"
              options={[
                { value: 'CLASSROOM', label: 'Classroom' },
                { value: 'LABORATORY', label: 'Laboratory' },
                { value: 'SEMINAR_HALL', label: 'Seminar Hall' },
                { value: 'AUDITORIUM', label: 'Auditorium' },
                { value: 'OTHER', label: 'Other' },
              ]}
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsRoomModalOpen(false)} disabled={isSubmittingRoom}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmittingRoom}>
              {isEditingRoom ? 'Update Room' : 'Create Room'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title={deleteType === 'slot' ? 'Delete Timetable Slot' : 'Delete Room'}
        message={
          deleteType === 'slot'
            ? 'Are you sure you want to remove this scheduled class slot?'
            : `Are you sure you want to delete room '${itemToDelete?.room_number}'?`
        }
        confirmText="Confirm Delete"
        isLoading={isDeleting}
      />
    </div>
  );
};
