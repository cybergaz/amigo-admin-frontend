'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api_client, type UserType, type PaginatedUsersResponse } from '@/lib/api-client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  MapPin,
  User,
  Phone,
  Shield,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Settings,
  Eye,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatString } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import BouncingBalls from './ui/bouncing-balls';

interface UsersTableProps {
  className?: string;
  searchTerm?: string;
  onSearchChange?: (search: string) => void;
}

interface LocationInfo {
  country: string;
  state: string;
  city: string;
  address?: string;
}

const UsersTable: React.FC<UsersTableProps> = ({ className, searchTerm = '', onSearchChange }) => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchUsers = async (page: number = 1, search?: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api_client.getUsers(page, 10, search);

      if (response.success && response.data) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      } else {
        setError(response.message || 'Failed to fetch users');
        toast.error('Failed to fetch users');
      }
    } catch (err) {
      const errorMessage = 'Failed to fetch users';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationInfo = async (lat: number, lng: number) => {
    try {
      // Using Google Maps Geocoding API
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const addressComponents = result.address_components;

        let country = '';
        let state = '';
        let city = '';
        let address = result.formatted_address;

        addressComponents.forEach((component: any) => {
          if (component.types.includes('country')) {
            country = component.long_name;
          } else if (component.types.includes('administrative_area_level_1')) {
            state = component.long_name;
          } else if (component.types.includes('locality')) {
            city = component.long_name;
          }
        });

        setLocationInfo({ country, state, city, address });
      } else {
        setLocationInfo({
          country: 'Unknown',
          state: 'Unknown',
          city: 'Unknown',
          address: 'Location not found'
        });
      }
    } catch (error) {
      console.error('Error fetching location info:', error);
      setLocationInfo({
        country: 'Unknown',
        state: 'Unknown',
        city: 'Unknown',
        address: 'Failed to fetch location'
      });
    }
  };

  const handleLocationClick = async (user: UserType) => {
    setSelectedUser(user);
    setLocationDialogOpen(true);

    if (user.location) {
      await fetchLocationInfo(user.location.latitude, user.location.longitude);
    } else {
      setLocationInfo({
        country: 'Unknown',
        state: 'Unknown',
        city: 'Unknown',
        address: 'No location data available'
      });
    }
  };

  const handleRoleEdit = (user: UserType) => {
    setSelectedUser(user);
    setRoleDialogOpen(true);
  };

  const updateUserRole = async (role: string) => {
    if (!selectedUser) return;

    try {
      setUpdating(true);
      const response = await api_client.updateUserRole(selectedUser.id, role);

      if (response.success) {
        toast.success('User role updated successfully');
        setRoleDialogOpen(false);
        fetchUsers(pagination.currentPage, searchTerm);
      } else {
        toast.error(response.message || 'Failed to update user role');
      }
    } catch (error) {
      toast.error('Failed to update user role');
    } finally {
      setUpdating(false);
    }
  };

  const updateUserCallAccess = async (callAccess: boolean) => {
    if (!selectedUser) return;

    try {
      setUpdating(true);
      const response = await api_client.updateUserCallAccess(selectedUser.id, callAccess);

      if (response.success) {
        toast.success(`Call access ${callAccess ? 'granted' : 'revoked'} successfully`);
        setRoleDialogOpen(false);
        fetchUsers(pagination.currentPage, searchTerm);
      } else {
        toast.error(response.message || 'Failed to update call access');
      }
    } catch (error) {
      toast.error('Failed to update call access');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'sub_admin':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const openInMaps = () => {
    if (selectedUser?.location) {
      const { latitude, longitude } = selectedUser.location;
      window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
    }
  };

  // Debounce search function
  const debounce = useCallback((func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }, []);

  const debouncedSearch = useCallback(
    debounce((searchValue: string) => {
      fetchUsers(1, searchValue);
    }, 500),
    []
  );

  useEffect(() => {
    if (searchTerm) {
      debouncedSearch(searchTerm);
    } else {
      fetchUsers(1, '');
    }
  }, [searchTerm, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className={`${className} relative bg-black/3 p-8 max-sm:p-2 max-sm:py-4 rounded-xl`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Users Management</h2>
        <Button
          onClick={() => fetchUsers(pagination.currentPage, searchTerm)}
          variant="outline"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 max-sm:mr-0 ${loading ? 'animate-spin' : ''}`} />
          <span className='max-sm:hidden'>
            Refresh
          </span>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search users by name or phone number..."
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && users.length === 0 && (
        <div className="flex items-center justify-center p-8">
          <BouncingBalls balls={4} className=" fill-black stroke-black" animation="animate-bounce-md" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center p-8">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => fetchUsers()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      )}

      {/* Users Table - Show even when loading if we have existing data */}
      {(!loading || users.length > 0) && !error && (

        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='pl-5 max-sm:pl-2'>User Name</TableHead>
                  <TableHead>Online Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Call Access</TableHead>
                  <TableHead>Joined At</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className=''>
                    <TableCell className='pl-5 max-sm:pl-2'>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          {user.phone && (
                            <p className="text-sm text-gray-500">{user.phone}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.online_status ? 'default' : 'secondary'} className={cn(user.online_status ? 'bg-green-400/20 text-green-800' : 'bg-gray-100 text-gray-800')}>
                        {user.online_status ? 'Online' : 'Offline'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)} className={cn(user.role === 'admin' ? 'bg-indigo-400/20 text-indigo-800' : user.role === 'sub_admin' ? 'bg-blue-400/20 text-blue-800' : 'bg-gray-100 text-gray-800')}>
                        {formatString(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.call_access ? 'default' : 'secondary'} className={cn(user.call_access ? 'bg-green-400/20 text-green-800' : 'bg-gray-100 text-gray-800')}>
                        {user.call_access ? 'Access' : 'No Access'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell>{formatDate(user.last_seen)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLocationClick(user)}
                        className="flex items-center space-x-1"
                      >
                        <MapPin className="h-4 w-4" />
                        <span>View</span>
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRoleEdit(user)}
                        className="flex items-center space-x-1"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Edit Role</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-gray-500">
              Showing {users.length} of {pagination.totalCount} users
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchUsers(pagination.currentPage - 1, searchTerm)}
                disabled={!pagination.hasPrevPage}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchUsers(pagination.currentPage + 1, searchTerm)}
                disabled={!pagination.hasNextPage}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Loading overlay for pagination/refresh when data exists */}
      {loading && users.length > 0 && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm">Updating...</span>
          </div>
        </div>
      )}

      {/* Location Dialog */}
      <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedUser?.name}'s Location</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {locationInfo && (
              <>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold">Current Location</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Country:</span>
                      <span>{locationInfo.country}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>State:</span>
                      <span>{locationInfo.state}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>City:</span>
                      <span>{locationInfo.city}</span>
                    </div>
                    {locationInfo.address && (
                      <div className="flex justify-between">
                        <span>Address:</span>
                        <span className="text-right max-w-[200px] truncate">{locationInfo.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold">Coordinates</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Latitude:</span>
                      <span>{selectedUser?.location?.latitude}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Longitude:</span>
                      <span>{selectedUser?.location?.longitude}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IP Address:</span>
                      <span>{selectedUser?.ip_address || 'Unknown'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold">Status</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Online Status:</span>
                      <span>{selectedUser?.online_status ? 'Online' : 'Offline'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Location Update:</span>
                      <span>{selectedUser?.last_seen ? formatDate(selectedUser.last_seen) : 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Seen:</span>
                      <span>{selectedUser?.last_seen ? formatDate(selectedUser.last_seen) : 'Unknown'}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="flex space-x-2">
            <Button onClick={openInMaps} className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Open in Maps</span>
            </Button>
            <Button variant="outline" onClick={() => setLocationDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Management Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage {selectedUser?.name}'s Role</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Current Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Role:</span>
                  <Badge variant={getRoleBadgeVariant(selectedUser?.role || '')} >
                    {formatString(selectedUser?.role)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Call Access:</span>
                  <Badge variant={selectedUser?.call_access ? 'default' : 'secondary'}>
                    {selectedUser?.call_access ? 'Access' : 'No Access'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Role Management</h3>
              <Button
                onClick={() => updateUserRole('sub_admin')}
                disabled={updating || selectedUser?.role === 'sub_admin'}
                className="w-full flex items-center justify-center space-x-2"
              >
                <Shield className="h-4 w-4" />
                <span>Make Sub Admin</span>
              </Button>
              <Button
                onClick={() => updateUserCallAccess(true)}
                disabled={updating || selectedUser?.call_access}
                variant="outline"
                className="w-full flex items-center justify-center space-x-2"
              >
                <Phone className="h-4 w-4" />
                <span>Grant Call Access</span>
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersTable;
