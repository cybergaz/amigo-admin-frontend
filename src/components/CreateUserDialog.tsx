'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CountryCodeSelect } from '@/components/UsersTable';
import { api_client } from '@/lib/api-client';
import { toast } from 'sonner';
import { UserPlus, ArrowLeft, Loader2 } from 'lucide-react';

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Passed the created user's name so the caller can surface them (the users list
  // is ordered oldest-first, so a fresh user is otherwise on the last page).
  onCreated?: (name: string) => void;
}

type Phase = 'form' | 'confirm';

const CreateUserDialog: React.FC<CreateUserDialogProps> = ({ open, onOpenChange, onCreated }) => {
  const [phase, setPhase] = useState<Phase>('form');
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [creating, setCreating] = useState(false);

  const fullPhone = `${countryCode}${phone.trim()}`;

  const reset = () => {
    setPhase('form');
    setName('');
    setCountryCode('+91');
    setPhone('');
    setPin('');
    setCreating(false);
  };

  const handleClose = (next: boolean) => {
    if (creating) return; // don't allow closing mid-submit
    if (!next) reset();
    onOpenChange(next);
  };

  const goToConfirm = () => {
    if (!name.trim()) {
      toast.error('Please enter a name');
      return;
    }
    if (phone.trim().length < 4) {
      toast.error('Please enter a valid phone number');
      return;
    }
    if (pin.length !== 4) {
      toast.error('PIN must be exactly 4 digits');
      return;
    }
    setPhase('confirm');
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await api_client.createUser(name.trim(), fullPhone, pin);
      if (res.success) {
        toast.success(`User "${name.trim()}" created`);
        onCreated?.(name.trim());
        reset();
        onOpenChange(false);
      } else {
        toast.error(res.message || 'Failed to create user');
        // Stay on the confirm screen so the admin can go back and adjust.
        setCreating(false);
      }
    } catch {
      toast.error('Failed to create user');
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {phase === 'form' ? 'Create New User' : 'Confirm New User'}
          </DialogTitle>
          <DialogDescription>
            {phase === 'form'
              ? 'The user logs in with this phone + PIN, then is asked to set their own PIN.'
              : 'Review the details before creating the account.'}
          </DialogDescription>
        </DialogHeader>

        {phase === 'form' ? (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="cu-name">Name</Label>
              <Input
                id="cu-name"
                placeholder="Full name"
                value={name}
                maxLength={60}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Phone number</Label>
              <div className="flex gap-2">
                <CountryCodeSelect value={countryCode} onChange={setCountryCode} />
                <Input
                  placeholder="Phone number"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cu-pin">Password PIN (4 digits)</Label>
              <Input
                id="cu-pin"
                inputMode="numeric"
                maxLength={4}
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="tracking-[0.4em] font-mono"
              />
              <p className="text-xs text-gray-500">
                The user will be forced to change this to their own PIN on first login.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm border border-gray-200">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Name</span>
                <span className="font-semibold">{name.trim()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Phone</span>
                <span className="font-mono">{fullPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Password PIN</span>
                <span className="font-mono tracking-widest">{pin}</span>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-3">
              <p className="text-amber-800 text-xs">
                Share this phone + PIN with the user so they can log in. They&apos;ll be
                prompted to set their own PIN (and an Admin PIN) right after.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {phase === 'form' ? (
            <>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button onClick={goToConfirm}>Continue</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setPhase('form')} disabled={creating}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create user'
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;
