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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Search,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatString } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import BouncingBalls from './ui/bouncing-balls';

const COUNTRY_CODES = [
  { dialCode: '+93', flag: '🇦🇫', name: 'Afghanistan' },
  { dialCode: '+355', flag: '🇦🇱', name: 'Albania' },
  { dialCode: '+213', flag: '🇩🇿', name: 'Algeria' },
  { dialCode: '+376', flag: '🇦🇩', name: 'Andorra' },
  { dialCode: '+244', flag: '🇦🇴', name: 'Angola' },
  { dialCode: '+1268', flag: '🇦🇬', name: 'Antigua and Barbuda' },
  { dialCode: '+54', flag: '🇦🇷', name: 'Argentina' },
  { dialCode: '+374', flag: '🇦🇲', name: 'Armenia' },
  { dialCode: '+61', flag: '🇦🇺', name: 'Australia' },
  { dialCode: '+43', flag: '🇦🇹', name: 'Austria' },
  { dialCode: '+994', flag: '🇦🇿', name: 'Azerbaijan' },
  { dialCode: '+1242', flag: '🇧🇸', name: 'Bahamas' },
  { dialCode: '+973', flag: '🇧🇭', name: 'Bahrain' },
  { dialCode: '+880', flag: '🇧🇩', name: 'Bangladesh' },
  { dialCode: '+1246', flag: '🇧🇧', name: 'Barbados' },
  { dialCode: '+375', flag: '🇧🇾', name: 'Belarus' },
  { dialCode: '+32', flag: '🇧🇪', name: 'Belgium' },
  { dialCode: '+501', flag: '🇧🇿', name: 'Belize' },
  { dialCode: '+229', flag: '🇧🇯', name: 'Benin' },
  { dialCode: '+975', flag: '🇧🇹', name: 'Bhutan' },
  { dialCode: '+591', flag: '🇧🇴', name: 'Bolivia' },
  { dialCode: '+387', flag: '🇧🇦', name: 'Bosnia and Herzegovina' },
  { dialCode: '+267', flag: '🇧🇼', name: 'Botswana' },
  { dialCode: '+55', flag: '🇧🇷', name: 'Brazil' },
  { dialCode: '+673', flag: '🇧🇳', name: 'Brunei' },
  { dialCode: '+359', flag: '🇧🇬', name: 'Bulgaria' },
  { dialCode: '+226', flag: '🇧🇫', name: 'Burkina Faso' },
  { dialCode: '+257', flag: '🇧🇮', name: 'Burundi' },
  { dialCode: '+855', flag: '🇰🇭', name: 'Cambodia' },
  { dialCode: '+237', flag: '🇨🇲', name: 'Cameroon' },
  { dialCode: '+1', flag: '🇨🇦', name: 'Canada' },
  { dialCode: '+238', flag: '🇨🇻', name: 'Cape Verde' },
  { dialCode: '+236', flag: '🇨🇫', name: 'Central African Republic' },
  { dialCode: '+235', flag: '🇹🇩', name: 'Chad' },
  { dialCode: '+56', flag: '🇨🇱', name: 'Chile' },
  { dialCode: '+86', flag: '🇨🇳', name: 'China' },
  { dialCode: '+57', flag: '🇨🇴', name: 'Colombia' },
  { dialCode: '+269', flag: '🇰🇲', name: 'Comoros' },
  { dialCode: '+242', flag: '🇨🇬', name: 'Congo' },
  { dialCode: '+243', flag: '🇨🇩', name: 'DR Congo' },
  { dialCode: '+506', flag: '🇨🇷', name: 'Costa Rica' },
  { dialCode: '+385', flag: '🇭🇷', name: 'Croatia' },
  { dialCode: '+53', flag: '🇨🇺', name: 'Cuba' },
  { dialCode: '+357', flag: '🇨🇾', name: 'Cyprus' },
  { dialCode: '+420', flag: '🇨🇿', name: 'Czech Republic' },
  { dialCode: '+45', flag: '🇩🇰', name: 'Denmark' },
  { dialCode: '+253', flag: '🇩🇯', name: 'Djibouti' },
  { dialCode: '+1767', flag: '🇩🇲', name: 'Dominica' },
  { dialCode: '+1809', flag: '🇩🇴', name: 'Dominican Republic' },
  { dialCode: '+670', flag: '🇹🇱', name: 'East Timor' },
  { dialCode: '+593', flag: '🇪🇨', name: 'Ecuador' },
  { dialCode: '+20', flag: '🇪🇬', name: 'Egypt' },
  { dialCode: '+503', flag: '🇸🇻', name: 'El Salvador' },
  { dialCode: '+240', flag: '🇬🇶', name: 'Equatorial Guinea' },
  { dialCode: '+291', flag: '🇪🇷', name: 'Eritrea' },
  { dialCode: '+372', flag: '🇪🇪', name: 'Estonia' },
  { dialCode: '+268', flag: '🇸🇿', name: 'Eswatini' },
  { dialCode: '+251', flag: '🇪🇹', name: 'Ethiopia' },
  { dialCode: '+679', flag: '🇫🇯', name: 'Fiji' },
  { dialCode: '+358', flag: '🇫🇮', name: 'Finland' },
  { dialCode: '+33', flag: '🇫🇷', name: 'France' },
  { dialCode: '+241', flag: '🇬🇦', name: 'Gabon' },
  { dialCode: '+220', flag: '🇬🇲', name: 'Gambia' },
  { dialCode: '+995', flag: '🇬🇪', name: 'Georgia' },
  { dialCode: '+49', flag: '🇩🇪', name: 'Germany' },
  { dialCode: '+233', flag: '🇬🇭', name: 'Ghana' },
  { dialCode: '+30', flag: '🇬🇷', name: 'Greece' },
  { dialCode: '+1473', flag: '🇬🇩', name: 'Grenada' },
  { dialCode: '+502', flag: '🇬🇹', name: 'Guatemala' },
  { dialCode: '+224', flag: '🇬🇳', name: 'Guinea' },
  { dialCode: '+245', flag: '🇬🇼', name: 'Guinea-Bissau' },
  { dialCode: '+592', flag: '🇬🇾', name: 'Guyana' },
  { dialCode: '+509', flag: '🇭🇹', name: 'Haiti' },
  { dialCode: '+504', flag: '🇭🇳', name: 'Honduras' },
  { dialCode: '+36', flag: '🇭🇺', name: 'Hungary' },
  { dialCode: '+354', flag: '🇮🇸', name: 'Iceland' },
  { dialCode: '+91', flag: '🇮🇳', name: 'India' },
  { dialCode: '+62', flag: '🇮🇩', name: 'Indonesia' },
  { dialCode: '+98', flag: '🇮🇷', name: 'Iran' },
  { dialCode: '+964', flag: '🇮🇶', name: 'Iraq' },
  { dialCode: '+353', flag: '🇮🇪', name: 'Ireland' },
  { dialCode: '+972', flag: '🇮🇱', name: 'Israel' },
  { dialCode: '+39', flag: '🇮🇹', name: 'Italy' },
  { dialCode: '+225', flag: '🇨🇮', name: 'Ivory Coast' },
  { dialCode: '+1876', flag: '🇯🇲', name: 'Jamaica' },
  { dialCode: '+81', flag: '🇯🇵', name: 'Japan' },
  { dialCode: '+962', flag: '🇯🇴', name: 'Jordan' },
  { dialCode: '+7', flag: '🇰🇿', name: 'Kazakhstan' },
  { dialCode: '+254', flag: '🇰🇪', name: 'Kenya' },
  { dialCode: '+686', flag: '🇰🇮', name: 'Kiribati' },
  { dialCode: '+965', flag: '🇰🇼', name: 'Kuwait' },
  { dialCode: '+996', flag: '🇰🇬', name: 'Kyrgyzstan' },
  { dialCode: '+856', flag: '🇱🇦', name: 'Laos' },
  { dialCode: '+371', flag: '🇱🇻', name: 'Latvia' },
  { dialCode: '+961', flag: '🇱🇧', name: 'Lebanon' },
  { dialCode: '+266', flag: '🇱🇸', name: 'Lesotho' },
  { dialCode: '+231', flag: '🇱🇷', name: 'Liberia' },
  { dialCode: '+218', flag: '🇱🇾', name: 'Libya' },
  { dialCode: '+423', flag: '🇱🇮', name: 'Liechtenstein' },
  { dialCode: '+370', flag: '🇱🇹', name: 'Lithuania' },
  { dialCode: '+352', flag: '🇱🇺', name: 'Luxembourg' },
  { dialCode: '+261', flag: '🇲🇬', name: 'Madagascar' },
  { dialCode: '+265', flag: '🇲🇼', name: 'Malawi' },
  { dialCode: '+60', flag: '🇲🇾', name: 'Malaysia' },
  { dialCode: '+960', flag: '🇲🇻', name: 'Maldives' },
  { dialCode: '+223', flag: '🇲🇱', name: 'Mali' },
  { dialCode: '+356', flag: '🇲🇹', name: 'Malta' },
  { dialCode: '+692', flag: '🇲🇭', name: 'Marshall Islands' },
  { dialCode: '+222', flag: '🇲🇷', name: 'Mauritania' },
  { dialCode: '+230', flag: '🇲🇺', name: 'Mauritius' },
  { dialCode: '+52', flag: '🇲🇽', name: 'Mexico' },
  { dialCode: '+691', flag: '🇫🇲', name: 'Micronesia' },
  { dialCode: '+373', flag: '🇲🇩', name: 'Moldova' },
  { dialCode: '+377', flag: '🇲🇨', name: 'Monaco' },
  { dialCode: '+976', flag: '🇲🇳', name: 'Mongolia' },
  { dialCode: '+382', flag: '🇲🇪', name: 'Montenegro' },
  { dialCode: '+212', flag: '🇲🇦', name: 'Morocco' },
  { dialCode: '+258', flag: '🇲🇿', name: 'Mozambique' },
  { dialCode: '+95', flag: '🇲🇲', name: 'Myanmar' },
  { dialCode: '+264', flag: '🇳🇦', name: 'Namibia' },
  { dialCode: '+674', flag: '🇳🇷', name: 'Nauru' },
  { dialCode: '+977', flag: '🇳🇵', name: 'Nepal' },
  { dialCode: '+31', flag: '🇳🇱', name: 'Netherlands' },
  { dialCode: '+64', flag: '🇳🇿', name: 'New Zealand' },
  { dialCode: '+505', flag: '🇳🇮', name: 'Nicaragua' },
  { dialCode: '+227', flag: '🇳🇪', name: 'Niger' },
  { dialCode: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { dialCode: '+850', flag: '🇰🇵', name: 'North Korea' },
  { dialCode: '+389', flag: '🇲🇰', name: 'North Macedonia' },
  { dialCode: '+47', flag: '🇳🇴', name: 'Norway' },
  { dialCode: '+968', flag: '🇴🇲', name: 'Oman' },
  { dialCode: '+92', flag: '🇵🇰', name: 'Pakistan' },
  { dialCode: '+680', flag: '🇵🇼', name: 'Palau' },
  { dialCode: '+507', flag: '🇵🇦', name: 'Panama' },
  { dialCode: '+675', flag: '🇵🇬', name: 'Papua New Guinea' },
  { dialCode: '+595', flag: '🇵🇾', name: 'Paraguay' },
  { dialCode: '+51', flag: '🇵🇪', name: 'Peru' },
  { dialCode: '+63', flag: '🇵🇭', name: 'Philippines' },
  { dialCode: '+48', flag: '🇵🇱', name: 'Poland' },
  { dialCode: '+351', flag: '🇵🇹', name: 'Portugal' },
  { dialCode: '+974', flag: '🇶🇦', name: 'Qatar' },
  { dialCode: '+40', flag: '🇷🇴', name: 'Romania' },
  { dialCode: '+7', flag: '🇷🇺', name: 'Russia' },
  { dialCode: '+250', flag: '🇷🇼', name: 'Rwanda' },
  { dialCode: '+1869', flag: '🇰🇳', name: 'Saint Kitts and Nevis' },
  { dialCode: '+1758', flag: '🇱🇨', name: 'Saint Lucia' },
  { dialCode: '+1784', flag: '🇻🇨', name: 'Saint Vincent and the Grenadines' },
  { dialCode: '+685', flag: '🇼🇸', name: 'Samoa' },
  { dialCode: '+378', flag: '🇸🇲', name: 'San Marino' },
  { dialCode: '+239', flag: '🇸🇹', name: 'São Tomé and Príncipe' },
  { dialCode: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { dialCode: '+221', flag: '🇸🇳', name: 'Senegal' },
  { dialCode: '+381', flag: '🇷🇸', name: 'Serbia' },
  { dialCode: '+248', flag: '🇸🇨', name: 'Seychelles' },
  { dialCode: '+232', flag: '🇸🇱', name: 'Sierra Leone' },
  { dialCode: '+65', flag: '🇸🇬', name: 'Singapore' },
  { dialCode: '+421', flag: '🇸🇰', name: 'Slovakia' },
  { dialCode: '+386', flag: '🇸🇮', name: 'Slovenia' },
  { dialCode: '+677', flag: '🇸🇧', name: 'Solomon Islands' },
  { dialCode: '+252', flag: '🇸🇴', name: 'Somalia' },
  { dialCode: '+27', flag: '🇿🇦', name: 'South Africa' },
  { dialCode: '+82', flag: '🇰🇷', name: 'South Korea' },
  { dialCode: '+211', flag: '🇸🇸', name: 'South Sudan' },
  { dialCode: '+34', flag: '🇪🇸', name: 'Spain' },
  { dialCode: '+94', flag: '🇱🇰', name: 'Sri Lanka' },
  { dialCode: '+249', flag: '🇸🇩', name: 'Sudan' },
  { dialCode: '+597', flag: '🇸🇷', name: 'Suriname' },
  { dialCode: '+46', flag: '🇸🇪', name: 'Sweden' },
  { dialCode: '+41', flag: '🇨🇭', name: 'Switzerland' },
  { dialCode: '+963', flag: '🇸🇾', name: 'Syria' },
  { dialCode: '+886', flag: '🇹🇼', name: 'Taiwan' },
  { dialCode: '+992', flag: '🇹🇯', name: 'Tajikistan' },
  { dialCode: '+255', flag: '🇹🇿', name: 'Tanzania' },
  { dialCode: '+66', flag: '🇹🇭', name: 'Thailand' },
  { dialCode: '+228', flag: '🇹🇬', name: 'Togo' },
  { dialCode: '+676', flag: '🇹🇴', name: 'Tonga' },
  { dialCode: '+1868', flag: '🇹🇹', name: 'Trinidad and Tobago' },
  { dialCode: '+216', flag: '🇹🇳', name: 'Tunisia' },
  { dialCode: '+90', flag: '🇹🇷', name: 'Turkey' },
  { dialCode: '+993', flag: '🇹🇲', name: 'Turkmenistan' },
  { dialCode: '+688', flag: '🇹🇻', name: 'Tuvalu' },
  { dialCode: '+256', flag: '🇺🇬', name: 'Uganda' },
  { dialCode: '+380', flag: '🇺🇦', name: 'Ukraine' },
  { dialCode: '+971', flag: '🇦🇪', name: 'United Arab Emirates' },
  { dialCode: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { dialCode: '+1', flag: '🇺🇸', name: 'United States' },
  { dialCode: '+598', flag: '🇺🇾', name: 'Uruguay' },
  { dialCode: '+998', flag: '🇺🇿', name: 'Uzbekistan' },
  { dialCode: '+678', flag: '🇻🇺', name: 'Vanuatu' },
  { dialCode: '+379', flag: '🇻🇦', name: 'Vatican City' },
  { dialCode: '+58', flag: '🇻🇪', name: 'Venezuela' },
  { dialCode: '+84', flag: '🇻🇳', name: 'Vietnam' },
  { dialCode: '+967', flag: '🇾🇪', name: 'Yemen' },
  { dialCode: '+260', flag: '🇿🇲', name: 'Zambia' },
  { dialCode: '+263', flag: '🇿🇼', name: 'Zimbabwe' },
];

interface CountryCodeSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export const CountryCodeSelect: React.FC<CountryCodeSelectProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = React.useRef<HTMLDivElement>(null);

  const filtered = search.trim()
    ? COUNTRY_CODES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dialCode.includes(search)
      )
    : COUNTRY_CODES;

  const selected = COUNTRY_CODES.find(c => c.dialCode === value) ?? COUNTRY_CODES[0];

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative w-28 shrink-0">
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setSearch(''); }}
        className="flex items-center gap-1 w-full h-9 px-2 rounded-md border border-input bg-background text-sm hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <span>{selected.flag}</span>
        <span className="font-mono text-xs">{selected.dialCode}</span>
        <span className="ml-auto text-gray-400 text-xs">▾</span>
      </button>

      {open && (
        <div className="absolute z-50 top-10 left-0 w-64 rounded-md border border-input bg-background shadow-lg">
          <div className="p-2 border-b">
            <input
              autoFocus
              className="w-full text-sm px-2 py-1 rounded border border-input outline-none focus:ring-2 focus:ring-ring bg-background"
              placeholder="Search country or code..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-500">No results</li>
            )}
            {filtered.map(c => (
              <li
                key={`${c.name}-${c.dialCode}`}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-accent',
                  c.dialCode === value && c.name === selected.name ? 'bg-accent font-medium' : ''
                )}
                onMouseDown={() => {
                  onChange(c.dialCode);
                  setOpen(false);
                  setSearch('');
                }}
              >
                <span>{c.flag}</span>
                <span className="font-mono text-xs w-10 shrink-0">{c.dialCode}</span>
                <span className="truncate">{c.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

interface UsersTableProps {
  className?: string;
  searchTerm?: string;
  onSearchChange?: (search: string) => void;
  // Super-admin only capabilities (change a user's password PIN). The backend
  // enforces this too (403) — this just hides the control for sub-admins.
  isSuperAdmin?: boolean;
}

interface LocationInfo {
  country: string;
  state: string;
  city: string;
  address?: string;
}

const UsersTable: React.FC<UsersTableProps> = ({ className, searchTerm = '', onSearchChange, isSuperAdmin = false }) => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [phoneCountryCode, setPhoneCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [updatingPhone, setUpdatingPhone] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [updatingPin, setUpdatingPin] = useState(false);
  const [showAdminPinInput, setShowAdminPinInput] = useState(false);
  const [newAdminPin, setNewAdminPin] = useState('');
  const [updatingAdminPin, setUpdatingAdminPin] = useState(false);

  const fetchUsers = async (page: number = 1, search?: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api_client.getUsers(page, 20, search);

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
    setPhoneNumber('');
    setPhoneCountryCode('+1');
    setShowPinInput(false);
    setNewPin('');
    setShowAdminPinInput(false);
    setNewAdminPin('');
    setRoleDialogOpen(true);
  };

  const updateUserAdminPin = async () => {
    if (!selectedUser || newAdminPin.length !== 4) return;
    try {
      setUpdatingAdminPin(true);
      const response = await api_client.updateUserAdminPin(selectedUser.id, newAdminPin);
      if (response.success) {
        toast.success("User's admin PIN updated");
        setNewAdminPin('');
        setShowAdminPinInput(false);
      } else {
        toast.error(response.message || 'Failed to update admin PIN');
      }
    } catch {
      toast.error('Failed to update admin PIN');
    } finally {
      setUpdatingAdminPin(false);
    }
  };

  const updateUserPasswordPin = async () => {
    if (!selectedUser || newPin.length !== 4) return;
    try {
      setUpdatingPin(true);
      const response = await api_client.updateUserPasswordPin(selectedUser.id, newPin);
      if (response.success) {
        toast.success("User's password PIN updated. They'll set their own on next login.");
        setNewPin('');
        setShowPinInput(false);
      } else {
        toast.error(response.message || 'Failed to update PIN');
      }
    } catch {
      toast.error('Failed to update PIN');
    } finally {
      setUpdatingPin(false);
    }
  };

  const updateUserPhoneNumber = async () => {
    if (!selectedUser || !phoneNumber.trim()) return;
    const fullPhone = `${phoneCountryCode}${phoneNumber.trim()}`;
    try {
      setUpdatingPhone(true);
      const response = await api_client.updateUserPhoneNumber(selectedUser.id, fullPhone);
      if (response.success) {
        toast.success('Phone number updated successfully');
        setPhoneNumber('');
        fetchUsers(pagination.currentPage, searchTerm);
      } else {
        toast.error(response.message || 'Failed to update phone number');
      }
    } catch {
      toast.error('Failed to update phone number');
    } finally {
      setUpdatingPhone(false);
    }
  };

  const handleDeleteClick = (user: UserType) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setDeleting(true);
      const response = await api_client.deleteUser(selectedUser.id);

      if (response.success) {
        toast.success(`User "${selectedUser.name}" has been permanently deleted`);
        setDeleteDialogOpen(false);
        fetchUsers(pagination.currentPage, searchTerm);
      } else {
        toast.error(response.message || 'Failed to delete user');
      }
    } catch (error) {
      toast.error('Failed to delete user');
    } finally {
      setDeleting(false);
    }
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
        return 'destructiveLite';
      case 'sub_admin':
        return 'blue';
      case 'staff':
        return 'positive';
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
                  <TableHead>Version</TableHead>
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
                      <Badge variant={getRoleBadgeVariant(user.role)} >
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
                      <Badge variant="blue">
                        {user.app_version || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className='flex gap-2'>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRoleEdit(user)}
                        className="flex items-center space-x-1"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(user)}
                        className="flex items-center space-x-1 bg-red-500 hover:bg-red-600 border-red-500 hover:border-red-600"
                      >
                        <Trash2 className="h-4 w-4 text-white" />
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
                        <span className="text-right max-w-[200px]">{locationInfo.address}</span>
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
            <div className="bg-black/3 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Current Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Role</span>
                  <Badge variant={getRoleBadgeVariant(selectedUser?.role || '')} >
                    {formatString(selectedUser?.role)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Call Access</span>
                  <Badge variant={selectedUser?.call_access ? 'default' : 'secondary'}>
                    {selectedUser?.call_access ? 'Access' : 'No Access'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Role Management</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Role</label>
                <Select
                  value={selectedUser?.role}
                  onValueChange={(value: string) => updateUserRole(value)}
                  disabled={updating}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="sub_admin">Sub Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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

            <div className="space-y-2">
              <h3 className="font-semibold">Update Phone Number</h3>
              <p className="text-xs text-gray-500">Current: {selectedUser?.phone || 'N/A'}</p>
              <div className="flex gap-2">
                <CountryCodeSelect value={phoneCountryCode} onChange={setPhoneCountryCode} />
                <Input
                  placeholder="Phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  className="flex-1"
                />
              </div>
              <Button
                onClick={updateUserPhoneNumber}
                disabled={updatingPhone || !phoneNumber.trim()}
                variant="outline"
                className="w-full flex items-center justify-center space-x-2"
              >
                <Phone className="h-4 w-4" />
                <span>{updatingPhone ? 'Updating...' : 'Update Phone Number'}</span>
              </Button>
            </div>

            {/* Change Password PIN — super-admin only. Reveals an inline input. */}
            {isSuperAdmin && (
              <div className="space-y-2">
                <h3 className="font-semibold">Password PIN</h3>
                {!showPinInput ? (
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center space-x-2"
                    onClick={() => { setNewPin(''); setShowPinInput(true); }}
                  >
                    <Shield className="h-4 w-4" />
                    <span>Change user&apos;s password PIN</span>
                  </Button>
                ) : (
                  <>
                    <p className="text-xs text-gray-500">
                      Sets a new login PIN. The user is forced to change it to their own on next login.
                    </p>
                    <div className="flex gap-2">
                      <Input
                        autoFocus
                        placeholder="New 4-digit PIN"
                        inputMode="numeric"
                        maxLength={4}
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="flex-1 tracking-[0.3em] font-mono"
                      />
                      <Button
                        onClick={updateUserPasswordPin}
                        disabled={updatingPin || newPin.length !== 4}
                        className="flex items-center justify-center space-x-2"
                      >
                        <Shield className="h-4 w-4" />
                        <span>{updatingPin ? 'Saving...' : 'Save'}</span>
                      </Button>
                    </div>
                    <button
                      type="button"
                      className="text-xs text-gray-500 hover:underline"
                      onClick={() => { setShowPinInput(false); setNewPin(''); }}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Change / override Admin PIN — super-admin only. */}
            {isSuperAdmin && (
              <div className="space-y-2">
                <h3 className="font-semibold">Admin PIN (decoy)</h3>
                {!showAdminPinInput ? (
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center space-x-2"
                    onClick={() => { setNewAdminPin(''); setShowAdminPinInput(true); }}
                  >
                    <Shield className="h-4 w-4" />
                    <span>Set / override user&apos;s admin PIN</span>
                  </Button>
                ) : (
                  <>
                    <p className="text-xs text-gray-500">
                      The app-lock decoy PIN. Must differ from the user&apos;s login PIN.
                    </p>
                    <div className="flex gap-2">
                      <Input
                        autoFocus
                        placeholder="New 4-digit admin PIN"
                        inputMode="numeric"
                        maxLength={4}
                        value={newAdminPin}
                        onChange={(e) => setNewAdminPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="flex-1 tracking-[0.3em] font-mono"
                      />
                      <Button
                        onClick={updateUserAdminPin}
                        disabled={updatingAdminPin || newAdminPin.length !== 4}
                        className="flex items-center justify-center space-x-2"
                      >
                        <Shield className="h-4 w-4" />
                        <span>{updatingAdminPin ? 'Saving...' : 'Save'}</span>
                      </Button>
                    </div>
                    <button
                      type="button"
                      className="text-xs text-gray-500 hover:underline"
                      onClick={() => { setShowAdminPinInput(false); setNewAdminPin(''); }}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 text-sm">
            <span>App Version : </span>
            <Badge variant="blue" className="ml-2">
              {selectedUser?.app_version || 'N/A'}
            </Badge>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              <span>PERMANENT DELETE WARNING</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Extreme Warning Section */}
            <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4">
              <h3 className="font-bold text-red-700 mb-2 text-lg">⚠️ CRITICAL ACTION</h3>
              <p className="text-red-700 font-semibold mb-2">
                This action is PERMANENT and IRREVERSIBLE!
              </p>
              <ul className="list-disc list-inside text-red-600 text-sm space-y-1">
                <li>User will be completely removed from the database</li>
                <li>All user data will be permanently deleted</li>
                <li>This action CANNOT be undone</li>
                <li>No recovery option will be available</li>
              </ul>
            </div>

            {/* User Info Section */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold mb-3">User to be deleted:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Name:</span>
                  <span className="font-bold">{selectedUser?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Phone:</span>
                  <span>{selectedUser?.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Email:</span>
                  <span>{selectedUser?.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Role:</span>
                  <Badge variant={getRoleBadgeVariant(selectedUser?.role || '')}>
                    {formatString(selectedUser?.role)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">User ID:</span>
                  <span className="font-mono">{selectedUser?.id}</span>
                </div>
              </div>
            </div>

            {/* Final Warning */}
            <div className="bg-yellow-50 border border-yellow-400 rounded-lg p-3">
              <p className="text-yellow-800 text-sm font-medium text-center">
                🛑 Please confirm you understand this action is permanent and cannot be reversed
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
              className="w-full sm:w-auto"
            >
              Cancel (Safe Option)
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deleting}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 font-bold"
            >
              {deleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Yes, Permanently Delete User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersTable;
