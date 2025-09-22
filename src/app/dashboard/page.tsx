'use client';

import React, { useState, useEffect } from 'react';
import UsersTable from '@/components/UsersTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Shield, Phone } from 'lucide-react';
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Dashboard Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card key={index} className={`${card.bgColor} border-0 shadow-sm`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
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

        {/* Users Table with Search */}
        <UsersTable searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      </div>
    </div>
  );
}
