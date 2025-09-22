
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Shield, CheckCircle, XCircle, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { api_client, type AdminUserType } from "@/lib/api-client";
import { toast } from "sonner";
import BouncingBalls from "@/components/ui/bouncing-balls";

const AVAILABLE_PERMISSIONS = [
  { key: "dashboard", label: "Dashboard", description: "View user statistics and management" },
  { key: "manage-chats", label: "Manage Chats", description: "View and manage chat conversations" },
  { key: "manage-groups", label: "Manage Groups", description: "Create and manage groups" },
  { key: "admin-management", label: "Admin Management", description: "Create and manage other admins" },
];

export default function AdminManagement() {
  const [admins, setAdmins] = useState<AdminUserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUserType | null>(null);

  // Create admin form state
  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    permissions: [] as string[]
  });

  // Edit admin form state
  const [editForm, setEditForm] = useState({
    permissions: [] as string[]
  });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await api_client.getAdmins();
      if (response.success && response.data) {
        setAdmins(response.data);
      } else {
        toast.error(response.message || "Failed to fetch admins");
      }
    } catch (error) {
      toast.error("Failed to fetch admins");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!createForm.email || !createForm.password || createForm.permissions.length === 0) {
      toast.error("Please fill all fields and select at least one permission");
      return;
    }

    try {
      const response = await api_client.createAdmin(
        createForm.email,
        createForm.password,
        createForm.permissions
      );

      if (response.success) {
        toast.success("Admin created successfully");
        setIsCreateDialogOpen(false);
        setCreateForm({ email: "", password: "", permissions: [] });
        fetchAdmins();
      } else {
        toast.error(response.message || "Failed to create admin");
      }
    } catch (error) {
      toast.error("Failed to create admin");
    }
  };

  const handleUpdatePermissions = async () => {
    if (!selectedAdmin || editForm.permissions.length === 0) {
      toast.error("Please select at least one permission");
      return;
    }

    try {
      const response = await api_client.updateAdminPermissions(
        selectedAdmin.id,
        editForm.permissions
      );

      if (response.success) {
        toast.success("Permissions updated successfully");
        setIsEditDialogOpen(false);
        setSelectedAdmin(null);
        setEditForm({ permissions: [] });
        fetchAdmins();
      } else {
        toast.error(response.message || "Failed to update permissions");
      }
    } catch (error) {
      toast.error("Failed to update permissions");
    }
  };

  const handleToggleStatus = async (admin: AdminUserType) => {
    if (admin.role === "admin") {
      toast.error("Cannot change super admin status");
      return;
    }

    try {
      const response = await api_client.updateAdminStatus(
        admin.id,
        !admin.online_status
      );

      if (response.success) {
        toast.success(`Admin ${!admin.online_status ? 'activated' : 'deactivated'} successfully`);
        fetchAdmins();
      } else {
        toast.error(response.message || "Failed to update admin status");
      }
    } catch (error) {
      toast.error("Failed to update admin status");
    }
  };

  const openEditDialog = (admin: AdminUserType) => {
    setSelectedAdmin(admin);
    setEditForm({
      permissions: admin.permissions || []
    });
    setIsEditDialogOpen(true);
  };

  const togglePermission = (permission: string, isCreate = false) => {
    if (isCreate) {
      setCreateForm(prev => ({
        ...prev,
        permissions: prev.permissions.includes(permission)
          ? prev.permissions.filter(p => p !== permission)
          : [...prev.permissions, permission]
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        permissions: prev.permissions.includes(permission)
          ? prev.permissions.filter(p => p !== permission)
          : [...prev.permissions, permission]
      }));
    }
  };

  const activeAdmins = admins.filter(admin => admin.online_status).length;
  const totalAdmins = admins.length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Admin Management</h1>
          <p className="text-gray-600">Create and manage admin accounts with role-based permissions</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Admin</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={createForm.password}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label>Role</Label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <Badge variant="secondary">Admin</Badge>
                </div>
              </div>
              <div>
                <Label>Permissions *</Label>
                <div className="space-y-3 mt-2">
                  {AVAILABLE_PERMISSIONS.map((permission) => (
                    <div key={permission.key} className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id={`create-${permission.key}`}
                        checked={createForm.permissions.includes(permission.key)}
                        onChange={() => togglePermission(permission.key, true)}
                        className="mt-1"
                      />
                      <div>
                        <label htmlFor={`create-${permission.key}`} className="font-medium text-sm">
                          {permission.label}
                        </label>
                        <p className="text-xs text-gray-500">{permission.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateAdmin} className="flex-1">
                  Create Admin
                </Button>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
            <Shield className="h-8 w-8 text-blue-600 bg-blue-100 p-2 rounded-lg" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAdmins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Admins</CardTitle>
            <CheckCircle className="h-8 w-8 text-green-600 bg-green-100 p-2 rounded-lg" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAdmins}</div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <BouncingBalls balls={4} className=" fill-black stroke-black" animation="animate-bounce-md" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ADMIN</TableHead>
                  <TableHead>ROLE</TableHead>
                  <TableHead>PERMISSIONS</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>CREATED</TableHead>
                  <TableHead>ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {admin.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{admin.email}</div>
                          <div className="text-sm text-gray-500">UID: {admin.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={admin.role === "admin" ? "default" : "secondary"}>
                        {admin.role === "admin" ? "Admin" : "Admin"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {admin.permissions?.slice(0, 3).map((permission) => (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {AVAILABLE_PERMISSIONS.find(p => p.key === permission)?.label || permission}
                          </Badge>
                        ))}
                        {admin.permissions && admin.permissions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{admin.permissions.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={admin.online_status ? "default" : "destructive"}>
                        {admin.online_status ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(admin.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(admin)}
                          disabled={admin.role === "admin"}
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>
                        {admin.role !== "admin" && (
                          <Button
                            size="sm"
                            variant={admin.online_status ? "destructive" : "default"}
                            onClick={() => handleToggleStatus(admin)}
                          >
                            {admin.online_status ? (
                              <>
                                <XCircle className="w-4 h-4 mr-1" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Activate
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Permissions Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Admin Permissions</DialogTitle>
          </DialogHeader>
          {selectedAdmin && (
            <div className="space-y-4">
              <div>
                <Label>Admin</Label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <div className="font-medium">{selectedAdmin.email}</div>
                  <div className="text-sm text-gray-500">UID: {selectedAdmin.id}</div>
                </div>
              </div>
              <div>
                <Label>Permissions *</Label>
                <div className="space-y-3 mt-2">
                  {AVAILABLE_PERMISSIONS.map((permission) => (
                    <div key={permission.key} className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id={`edit-${permission.key}`}
                        checked={editForm.permissions.includes(permission.key)}
                        onChange={() => togglePermission(permission.key, false)}
                        className="mt-1"
                      />
                      <div>
                        <label htmlFor={`edit-${permission.key}`} className="font-medium text-sm">
                          {permission.label}
                        </label>
                        <p className="text-xs text-gray-500">{permission.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleUpdatePermissions} className="flex-1">
                  Update Permissions
                </Button>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
