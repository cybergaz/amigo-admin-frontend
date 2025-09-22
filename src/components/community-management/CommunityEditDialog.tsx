'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { api_client, type Community, type CommunityGroup } from '@/lib/api-client';
import { toast } from 'sonner';

interface CommunityEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  community: Community | null;
  onSave: () => void;
}

export default function CommunityEditDialog({ isOpen, onClose, community, onSave }: CommunityEditDialogProps) {
  const [communityName, setCommunityName] = useState('');
  const [availableGroups, setAvailableGroups] = useState<CommunityGroup[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && community) {
      setCommunityName(community.name);
      setSelectedGroups(community.group_ids || []);
      fetchAvailableGroups();
    }
  }, [isOpen, community]);

  const fetchAvailableGroups = async () => {
    try {
      setGroupsLoading(true);
      const response = await api_client.getAvailableGroups();
      if (response.success && response.data) {
        setAvailableGroups(response.data);
      }
    } catch (error) {
      toast.error('Failed to load available groups');
    } finally {
      setGroupsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!community) return;

    try {
      setLoading(true);

      // Update community name if changed
      if (communityName !== community.name) {
        await api_client.updateCommunity(community.id, { name: communityName });
      }

      // Update groups if changed
      const currentGroupIds = community.group_ids || [];
      const groupsToAdd = selectedGroups.filter(id => !currentGroupIds.includes(id));
      const groupsToRemove = currentGroupIds.filter(id => !selectedGroups.includes(id));

      if (groupsToAdd.length > 0) {
        await api_client.addCommunityGroups(community.id, groupsToAdd);
      }

      if (groupsToRemove.length > 0) {
        await api_client.removeCommunityGroups(community.id, groupsToRemove);
      }

      toast.success('Community updated successfully');
      onSave();
      onClose();
    } catch (error) {
      toast.error('Failed to update community');
    } finally {
      setLoading(false);
    }
  };

  const handleGroupToggle = (groupId: number) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const getGroupTitle = (groupId: number) => {
    const group = availableGroups.find(g => g.id === groupId);
    return group ? group.title : `Group ${groupId}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Community</DialogTitle>
          <DialogDescription>
            Update the community name and manage which groups belong to this community.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Community Name */}
          <div className='flex flex-col gap-2'>
            <Label htmlFor="community-name">Community Name</Label>
            <Input
              id="community-name"
              value={communityName}
              onChange={(e) => setCommunityName(e.target.value)}
              placeholder="Enter community name"
            />
          </div>

          {/* Groups Management */}
          <div className='flex flex-col gap-2'>
            <Label>Community Groups</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Select which groups should belong to this community. Currently selected: {selectedGroups.length}
            </p>

            {groupsLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading groups...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto border rounded-xl p-3">
                {availableGroups.map((group) => {
                  const isSelected = selectedGroups.includes(group.id);
                  return (
                    <div
                      key={group.id}
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-primary/5 border-primary' : 'hover:bg-muted'
                        }`}
                      onClick={() => handleGroupToggle(group.id)}
                    >
                      <div>
                        <span className="font-medium">{group.title}</span>
                        <div className="text-sm text-muted-foreground">
                          Created: {new Date(group.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant={isSelected ? "default" : "outline"}>
                        {isSelected ? "Selected" : "Available"}
                      </Badge>
                    </div>
                  );
                })}
                {availableGroups.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-muted-foreground">
                    No groups available
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected Groups Summary */}
          {selectedGroups.length > 0 && (
            <div className="p-4 border rounded-lg bg-muted">
              <h4 className="font-medium mb-2">Selected Groups ({selectedGroups.length}):</h4>
              <div className="flex flex-wrap gap-2">
                {selectedGroups.map(groupId => (
                  <Badge key={groupId} variant="secondary">
                    {getGroupTitle(groupId)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || !communityName.trim()}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
