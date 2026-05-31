'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  User,
  Building,
  Palette,
  Database,
  Lock,
  Trash2,
  Save,
  Download,
  Upload,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Monitor,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [userSettings, setUserSettings] = useState({
    name: '',
    email: '',
    role: '',
    theme: 'light' as 'light' | 'dark' | 'system',
  });

  const [farmSettings, setFarmSettings] = useState({
    name: 'Dream Nest Aviary',
    owner: '',
    email: '',
    phone: '',
    address: '',
    description: '',
    currency: 'USD',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && session?.user) {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'light';
      setUserSettings({
        name: session.user.name || '',
        email: session.user.email || '',
        role: session.user.role || 'user',
        theme: savedTheme,
      });
      setFarmSettings(prev => ({
        ...prev,
        owner: session.user.name || '',
        email: session.user.email || '',
      }));
    }
  }, [mounted, session]);

  const saveUserSettings = async () => {
    if (!userSettings.name || !userSettings.email) {
      toast.error('Missing information', {
        description: 'Please fill in all required fields.',
      });
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (userSettings.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (userSettings.theme === 'light') {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('theme', userSettings.theme);
      
      toast.success('Profile settings updated successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const saveFarmSettings = async () => {
    if (!farmSettings.name) {
      toast.error('Missing information', {
        description: 'Please enter your farm name.',
      });
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Farm information updated successfully!');
    } catch (error) {
      toast.error('Failed to save farm settings');
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Password mismatch', {
        description: 'New passwords do not match.',
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Password too short', {
        description: 'Password must be at least 6 characters.',
      });
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Password changed successfully!');
      setShowPasswordDialog(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const updateTheme = (theme: 'light' | 'dark' | 'system') => {
    setUserSettings(prev => ({ ...prev, theme }));
    localStorage.setItem('theme', theme);
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    
    toast.success('Theme updated', {
      description: `Theme changed to ${theme}`,
    });
  };

  if (!mounted) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <div className="h-8 w-48 bg-gray-200 rounded mb-4 animate-pulse" />
        <div className="h-4 w-96 bg-gray-200 rounded mb-8 animate-pulse" />
        <div className="h-10 bg-gray-200 rounded mb-6 animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your account, farm information, and preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="farm" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span className="hidden sm:inline">Farm Info</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Data</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={userSettings.name}
                        onChange={(e) => setUserSettings({ ...userSettings, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userSettings.email}
                        onChange={(e) => setUserSettings({ ...userSettings, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Input id="role" value={userSettings.role} disabled className="bg-gray-50 dark:bg-gray-900" />
                    <p className="text-xs text-gray-500 mt-1">Role cannot be changed</p>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={saveUserSettings} disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Manage your password</CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Lock className="mr-2 h-4 w-4" />
                      Change Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                      <DialogDescription>Enter your current password and choose a new one</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Current Password</Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <Label>New Password</Label>
                        <Input
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Confirm New Password</Label>
                        <Input
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
                      <Button onClick={changePassword} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Change Password
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Farm Tab */}
        <TabsContent value="farm">
          <Card>
            <CardHeader>
              <CardTitle>Farm Information</CardTitle>
              <CardDescription>Update your farm's public information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="farmName">Farm Name *</Label>
                    <Input
                      id="farmName"
                      value={farmSettings.name}
                      onChange={(e) => setFarmSettings({ ...farmSettings, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="owner">Owner Name</Label>
                    <Input
                      id="owner"
                      value={farmSettings.owner}
                      onChange={(e) => setFarmSettings({ ...farmSettings, owner: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="farmEmail">Farm Email</Label>
                    <Input
                      id="farmEmail"
                      type="email"
                      value={farmSettings.email}
                      onChange={(e) => setFarmSettings({ ...farmSettings, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={farmSettings.phone}
                      onChange={(e) => setFarmSettings({ ...farmSettings, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={farmSettings.address}
                    onChange={(e) => setFarmSettings({ ...farmSettings, address: e.target.value })}
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Farm Description</Label>
                  <Textarea
                    id="description"
                    value={farmSettings.description}
                    onChange={(e) => setFarmSettings({ ...farmSettings, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Currency</Label>
                  <Select
                    value={farmSettings.currency}
                    onValueChange={(value) => setFarmSettings({ ...farmSettings, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end">
                  <Button onClick={saveFarmSettings} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Save Farm Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how the application looks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">Theme</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      onClick={() => updateTheme('light')}
                      className={`p-4 border rounded-lg text-center transition-all ${
                        userSettings.theme === 'light' 
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Sun className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm font-medium">Light</p>
                    </button>
                    <button
                      onClick={() => updateTheme('dark')}
                      className={`p-4 border rounded-lg text-center transition-all ${
                        userSettings.theme === 'dark' 
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Moon className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm font-medium">Dark</p>
                    </button>
                    <button
                      onClick={() => updateTheme('system')}
                      className={`p-4 border rounded-lg text-center transition-all ${
                        userSettings.theme === 'system' 
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Monitor className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm font-medium">System</p>
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Import / Export</CardTitle>
                <CardDescription>Backup or restore your farm data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg text-center">
                    <Download className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
                    <h3 className="font-semibold mb-1">Export Data</h3>
                    <p className="text-sm text-gray-500 mb-3">Download all your farm data as JSON</p>
                    <Button variant="outline">Export Data</Button>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
                    <h3 className="font-semibold mb-1">Import Data</h3>
                    <p className="text-sm text-gray-500 mb-3">Restore data from a JSON file</p>
                    <Button variant="outline">Import Data</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Danger Zone</CardTitle>
                <CardDescription>Irreversible actions - proceed with caution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50 dark:bg-red-950/10">
                  <div className="flex items-start gap-3">
                    <Trash2 className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-900 dark:text-red-400">Delete Account</h3>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        Once you delete your account, there is no going back.
                      </p>
                      <Button variant="destructive" className="mt-3" onClick={() => setShowDeleteDialog(true)}>
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700">Delete Account</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}