'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import UsersTable from '@/components/UsersTable';
import CreateUserDialog from '@/components/CreateUserDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/common/page-shell';
import { Users, UserCheck, Shield, Phone, UserPlus, KeyRound } from 'lucide-react';
import { api_client } from '@/lib/api-client';
import { toast } from 'sonner';

interface DashboardStats {
  totalUsers: number;
  onlineUsers: number;
  subAdmins: number;
  callAccess: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    onlineUsers: 0,
    subAdmins: 0,
    callAccess: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await api_client.getDashboardStats();

      if (response.success && response.data) {
        setStats(response.data);
      } else {
        toast.error('Failed to fetch dashboard statistics');
      }
    } catch (error) {
      toast.error('Failed to fetch dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    (async () => {
      const res = await api_client.getUserPermissions();
      if (res.success && res.data) setIsSuperAdmin(res.data.role === 'admin');
    })();
  }, []);

  const statsCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      title: 'Online Users',
      value: stats.onlineUsers,
      icon: UserCheck,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    {
      title: 'Sub Admins',
      value: stats.subAdmins,
      icon: Shield,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
    {
      title: 'Call Access',
      value: stats.callAccess,
      icon: Phone,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
    },
  ];

  return (
    <PageShell className="py-8">
        {/* Dashboard Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {statsCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card key={index} className={`${card.bgColor} border-0 shadow-sm`}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className={`text-sm font-medium ${card.textColor}`}>
                    {card.title}
                  </CardTitle>
                  <div className={`${card.color} p-2 rounded-lg`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${card.textColor}`}>
                    {loading ? '...' : card.value}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    Live
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Super-admin user-management toolbar */}
        {isSuperAdmin && (
          <div className="flex flex-wrap items-center justify-end gap-3 mb-4">
            <Link href="/dashboard/pin-reset-requests">
              <Button variant="outline" className="flex items-center gap-2">
                <KeyRound className="h-4 w-4" />
                Reset-PIN Requests
              </Button>
            </Link>
            <Button className="flex items-center gap-2" onClick={() => setCreateOpen(true)}>
              <UserPlus className="h-4 w-4" />
              Create New User
            </Button>
          </div>
        )}

        {/* Users Table with Search */}
        <UsersTable
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          isSuperAdmin={isSuperAdmin}
        />

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(name) => {
          fetchDashboardStats();
          // The list is oldest-first, so a fresh user is on the last page — filter
          // the table to their name so the admin sees the account they just made.
          setSearchTerm(name);
        }}
      />
    </PageShell>
  );
}
