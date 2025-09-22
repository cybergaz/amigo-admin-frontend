'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api_client, type CommunityGroup, type StandaloneGroup } from '@/lib/api-client';
import { toast } from 'sonner';

interface GroupEditDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  group: CommunityGroup | StandaloneGroup | null;
  onSave: () => void;
}

export default function GroupEditDetailsDialog({ isOpen, onClose, group, onSave }: GroupEditDetailsDialogProps) {
  const [groupName, setGroupName] = useState('');
  const [startTime, setStartTime] = useState('13:00');
  const [endTime, setEndTime] = useState('15:00');
  const [loading, setLoading] = useState(false);

  // Check if this is a community group (has time slots)
  const isCommunityGroup = (group: CommunityGroup | StandaloneGroup | null): group is CommunityGroup => {
    return group !== null && 'active_time_slots' in group;
  };

  useEffect(() => {
    if (isOpen && group) {
      setGroupName(group.title || '');
      
      if (isCommunityGroup(group) && group.active_time_slots && group.active_time_slots.length > 0) {
        // Use the first time slot if available
        const firstSlot = group.active_time_slots[0];
        setStartTime(firstSlot.start_time || '13:00');
        setEndTime(firstSlot.end_time || '15:00');
      } else {
        // Default times for standalone groups or community groups without time slots
        setStartTime('13:00');
        setEndTime('15:00');
      }
    }
  }, [isOpen, group]);

  const handleSave = async () => {
    if (!group || !groupName.trim()) {
      toast.error('Group name is required');
      return;
    }

    try {
      setLoading(true);
      let response;

      if (isCommunityGroup(group)) {
        // Update community group with title and time slots
        response = await api_client.updateCommunityGroup(group.id, {
          title: groupName,
          active_time_slots: [{ start_time: startTime, end_time: endTime }]
        });
      } else {
        // Update standalone group title only
        response = await api_client.updateGroupTitle(group.id, groupName);
      }

      if (response.success) {
        toast.success('Group updated successfully');
        onSave();
        onClose();
      } else {
        toast.error(response.message || 'Failed to update group');
      }
    } catch (error) {
      console.error('Error updating group:', error);
      toast.error('Failed to update group');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Group Details</DialogTitle>
          <DialogDescription>
            Update the group name{isCommunityGroup(group) ? ' and time slots' : ''}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              disabled={loading}
            />
          </div>

          {isCommunityGroup(group) && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || !groupName.trim()}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
