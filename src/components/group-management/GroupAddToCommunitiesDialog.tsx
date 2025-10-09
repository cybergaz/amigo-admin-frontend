'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api_client, type Community, type CommunityGroup, type StandaloneGroup } from '@/lib/api-client';
import { toast } from 'sonner';
import BouncingBalls from '../ui/bouncing-balls';

interface GroupAddToCommunitiesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  group: CommunityGroup | StandaloneGroup | null;
  onSave: () => void;
}

export default function GroupAddToCommunitiesDialog({ isOpen, onClose, group, onSave }: GroupAddToCommunitiesDialogProps) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunities, setSelectedCommunities] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [communitiesLoading, setCommunitiesLoading] = useState(false);

  useEffect(() => {
    if (isOpen && group) {
      setSelectedCommunities([]);
      fetchCommunities();
    }
  }, [isOpen, group]);

  const fetchCommunities = async () => {
    try {
      setCommunitiesLoading(true);
      const response = await api_client.getCommunities();
      
      if (response.success && response.data) {
        setCommunities(response.data);
      } else {
        setCommunities([]);
        toast.error('Failed to load communities');
      }
    } catch (error) {
      console.error('Error fetching communities:', error);
      toast.error('Failed to load communities');
      setCommunities([]);
    } finally {
      setCommunitiesLoading(false);
    }
  };

  const handleToggleCommunity = (communityId: number) => {
    setSelectedCommunities(prev =>
      prev.includes(communityId)
        ? prev.filter(id => id !== communityId)
        : [...prev, communityId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCommunities.length === communities.length) {
      setSelectedCommunities([]);
    } else {
      setSelectedCommunities(communities.map(c => c.id));
    }
  };

  const handleSubmit = async () => {
    if (!group || selectedCommunities.length === 0) return;

    try {
      setLoading(true);
      const response = await api_client.addGroupToCommunities(group.id, selectedCommunities);

      if (response.success) {
        const data = response.data;
        if (data?.errors && data.errors.length > 0) {
          toast.warning(`Added to ${data.added_to_communities} communities with some warnings`, {
            description: data.errors.join(', ')
          });
        } else {
          toast.success(`Group added to ${data?.added_to_communities || selectedCommunities.length} ${data?.added_to_communities === 1 ? 'community' : 'communities'}`);
        }
        onSave();
        onClose();
      } else {
        toast.error(response.message || 'Failed to add group to communities');
      }
    } catch (error) {
      toast.error('Failed to add group to communities');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add "{group?.title}" to Communities</DialogTitle>
          <DialogDescription>
            Select the communities you want to add this group to.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Select All Button */}
          {communities.length > 0 && (
            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="font-medium">Select All Communities</span>
                {selectedCommunities.length > 0 && (
                  <Badge variant="outline">
                    {selectedCommunities.length} selected
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={communitiesLoading}
              >
                {selectedCommunities.length === communities.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          )}

          {/* Communities List */}
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {communitiesLoading ? (
              <div className="flex flex-col items-center justify-center h-48">
                <BouncingBalls balls={4} className="fill-black stroke-black" animation="animate-bounce-md" />
                <p className="mt-3 text-sm text-muted-foreground">Loading communities...</p>
              </div>
            ) : communities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
                  <span className="text-2xl">🏘️</span>
                </div>
                <p className="text-sm">No communities available</p>
              </div>
            ) : (
              communities.map((community) => (
                <div
                  key={community.id}
                  className={`flex items-center justify-between p-4 border rounded-lg transition-all cursor-pointer ${
                    selectedCommunities.includes(community.id)
                      ? 'bg-primary/10 border-primary shadow-sm'
                      : 'bg-background hover:bg-muted/50'
                  }`}
                  onClick={() => handleToggleCommunity(community.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      selectedCommunities.includes(community.id)
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground'
                    }`}>
                      {selectedCommunities.includes(community.id) && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{community.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {community.group_ids?.length || 0} {community.group_ids?.length === 1 ? 'group' : 'groups'}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(community.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Selected Summary */}
          {selectedCommunities.length > 0 && (
            <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="font-medium text-green-700 dark:text-green-400">
                  Selected {selectedCommunities.length} {selectedCommunities.length === 1 ? 'community' : 'communities'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedCommunities.map(communityId => {
                  const community = communities.find(c => c.id === communityId);
                  return (
                    <Badge 
                      key={communityId} 
                      variant="outline" 
                      className="text-green-700 border-green-300 bg-white dark:bg-green-950/30"
                    >
                      {community?.name || `Community ${communityId}`}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || selectedCommunities.length === 0}
          >
            {loading ? 'Adding...' : `Add to ${selectedCommunities.length} ${selectedCommunities.length === 1 ? 'Community' : 'Communities'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

