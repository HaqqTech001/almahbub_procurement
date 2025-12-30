import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Settings,
  Bell,
  Shield,
  Users,
  Mail,
  Database,
  Palette,
  Globe,
  Lock,
  Key,
  Server,
  Monitor,
  Save,
  RefreshCw,
  Upload,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface SystemSettings {
  // General Settings
  site_name: string;
  site_description: string;
  timezone: string;
  language: string;
  date_format: string;
  currency: string;
  maintenance_mode: boolean;
  
  // Email Settings
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  
  // Notification Settings
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  order_notifications: boolean;
  user_notifications: boolean;
  system_notifications: boolean;
  
  // Security Settings
  two_factor_enabled: boolean;
  password_min_length: number;
  session_timeout: number;
  max_login_attempts: number;
  ip_whitelist: string[];
  
  // API Settings
  api_enabled: boolean;
  api_rate_limit: number;
  api_key_required: boolean;
  
  // Backup Settings
  auto_backup: boolean;
  backup_frequency: string;
  backup_retention: number;
  backup_location: string;
}

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>({
    // General Settings
    site_name: 'Almahbub International',
    site_description: 'Procurement & Service Management Platform',
    timezone: 'America/New_York',
    language: 'en',
    date_format: 'MM/DD/YYYY',
    currency: 'USD',
    maintenance_mode: false,
    
    // Email Settings
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    from_email: 'noreply@almahbub.com',
    from_name: 'Almahbub Platform',
    
    // Notification Settings
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    order_notifications: true,
    user_notifications: true,
    system_notifications: true,
    
    // Security Settings
    two_factor_enabled: false,
    password_min_length: 8,
    session_timeout: 30,
    max_login_attempts: 5,
    ip_whitelist: [],
    
    // API Settings
    api_enabled: true,
    api_rate_limit: 1000,
    api_key_required: true,
    
    // Backup Settings
    auto_backup: true,
    backup_frequency: 'daily',
    backup_retention: 30,
    backup_location: '/backups',
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Load settings from API
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      // In a real app, this would load from your API
      // For now, we use the default values
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      // In a real app, this would save to your API
      console.log('Saving settings:', settings);
      setHasChanges(false);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to default values? This action cannot be undone.')) {
      // Reset to default values
      setSettings({
        site_name: 'Almahbub International',
        site_description: 'Procurement & Service Management Platform',
        timezone: 'America/New_York',
        language: 'en',
        date_format: 'MM/DD/YYYY',
        currency: 'USD',
        maintenance_mode: false,
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_username: '',
        smtp_password: '',
        from_email: 'noreply@almahbub.com',
        from_name: 'Almahbub Platform',
        email_notifications: true,
        push_notifications: true,
        sms_notifications: false,
        order_notifications: true,
        user_notifications: true,
        system_notifications: true,
        two_factor_enabled: false,
        password_min_length: 8,
        session_timeout: 30,
        max_login_attempts: 5,
        ip_whitelist: [],
        api_enabled: true,
        api_rate_limit: 1000,
        api_key_required: true,
        auto_backup: true,
        backup_frequency: 'daily',
        backup_retention: 30,
        backup_location: '/backups',
      });
      setHasChanges(true);
    }
  };

  const updateSetting = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const testEmailSettings = async () => {
    try {
      setIsLoading(true);
      // Simulate email test
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Test email sent successfully!');
    } catch (error) {
      alert('Failed to send test email. Please check your settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'almahbub-settings.json';
    link.click();
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          setSettings(imported);
          setHasChanges(true);
          alert('Settings imported successfully!');
        } catch (error) {
          alert('Invalid settings file. Please check the format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const clearCache = async () => {
    try {
      setIsLoading(true);
      // Simulate cache clearing
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Cache cleared successfully!');
    } catch (error) {
      alert('Failed to clear cache.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure system settings and preferences
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {hasChanges && (
            <Badge variant="destructive" className="animate-pulse">
              Unsaved Changes
            </Badge>
          )}
          <Button variant="outline" onClick={exportSettings}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => document.getElementById('import-settings')?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <input
            id="import-settings"
            type="file"
            accept=".json"
            onChange={importSettings}
            className="hidden"
          />
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure basic site information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="site-name">Site Name</Label>
                  <Input
                    id="site-name"
                    value={settings.site_name}
                    onChange={(e) => updateSetting('site_name', e.target.value)}
                    placeholder="Enter site name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    value={settings.currency}
                    onChange={(e) => updateSetting('currency', e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="site-description">Site Description</Label>
                <Textarea
                  id="site-description"
                  value={settings.site_description}
                  onChange={(e) => updateSetting('site_description', e.target.value)}
                  placeholder="Enter site description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    value={settings.timezone}
                    onChange={(e) => updateSetting('timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                  >
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <select
                    id="language"
                    value={settings.language}
                    onChange={(e) => updateSetting('language', e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-format">Date Format</Label>
                  <select
                    id="date-format"
                    value={settings.date_format}
                    onChange={(e) => updateSetting('date_format', e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="maintenance-mode"
                  checked={settings.maintenance_mode}
                  onCheckedChange={(checked) => updateSetting('maintenance_mode', checked)}
                />
                <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                <Badge variant="outline">
                  {settings.maintenance_mode ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how and when notifications are sent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Notification Channels</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={settings.email_notifications}
                      onCheckedChange={(checked) => updateSetting('email_notifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive push notifications in browser
                      </p>
                    </div>
                    <Switch
                      checked={settings.push_notifications}
                      onCheckedChange={(checked) => updateSetting('push_notifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via SMS (additional charges may apply)
                      </p>
                    </div>
                    <Switch
                      checked={settings.sms_notifications}
                      onCheckedChange={(checked) => updateSetting('sms_notifications', checked)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Notification Types</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Procurement Request Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        New requests, status updates, and request-related events
                      </p>
                    </div>
                    <Switch
                      checked={settings.order_notifications}
                      onCheckedChange={(checked) => updateSetting('order_notifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>User Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        User registrations, profile updates, and account events
                      </p>
                    </div>
                    <Switch
                      checked={settings.user_notifications}
                      onCheckedChange={(checked) => updateSetting('user_notifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>System Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        System alerts, maintenance notifications, and security events
                      </p>
                    </div>
                    <Switch
                      checked={settings.system_notifications}
                      onCheckedChange={(checked) => updateSetting('system_notifications', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security policies and authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="password-min-length">Minimum Password Length</Label>
                  <Input
                    id="password-min-length"
                    type="number"
                    value={settings.password_min_length}
                    onChange={(e) => updateSetting('password_min_length', parseInt(e.target.value))}
                    min="6"
                    max="32"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    value={settings.session_timeout}
                    onChange={(e) => updateSetting('session_timeout', parseInt(e.target.value))}
                    min="5"
                    max="1440"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-login-attempts">Maximum Login Attempts</Label>
                <Input
                  id="max-login-attempts"
                  type="number"
                  value={settings.max_login_attempts}
                  onChange={(e) => updateSetting('max_login_attempts', parseInt(e.target.value))}
                  min="3"
                  max="10"
                />
                <p className="text-sm text-muted-foreground">
                  Number of failed login attempts before account is temporarily locked
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Require 2FA for admin accounts
                    </p>
                  </div>
                  <Switch
                    checked={settings.two_factor_enabled}
                    onCheckedChange={(checked) => updateSetting('two_factor_enabled', checked)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ip-whitelist">IP Whitelist</Label>
                <Textarea
                  id="ip-whitelist"
                  value={settings.ip_whitelist.join('\n')}
                  onChange={(e) => updateSetting('ip_whitelist', e.target.value.split('\n').filter(ip => ip.trim()))}
                  placeholder="Enter IP addresses, one per line"
                  rows={4}
                />
                <p className="text-sm text-muted-foreground">
                  Only allow admin access from these IP addresses (leave empty to allow all)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>
                Configure SMTP settings for sending emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input
                    id="smtp-host"
                    value={settings.smtp_host}
                    onChange={(e) => updateSetting('smtp_host', e.target.value)}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <Input
                    id="smtp-port"
                    type="number"
                    value={settings.smtp_port}
                    onChange={(e) => updateSetting('smtp_port', parseInt(e.target.value))}
                    placeholder="587"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="smtp-username">SMTP Username</Label>
                  <Input
                    id="smtp-username"
                    value={settings.smtp_username}
                    onChange={(e) => updateSetting('smtp_username', e.target.value)}
                    placeholder="your-email@gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-password">SMTP Password</Label>
                  <div className="relative">
                    <Input
                      id="smtp-password"
                      type={showPassword ? 'text' : 'password'}
                      value={settings.smtp_password}
                      onChange={(e) => updateSetting('smtp_password', e.target.value)}
                      placeholder="Your app password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="from-email">From Email</Label>
                  <Input
                    id="from-email"
                    value={settings.from_email}
                    onChange={(e) => updateSetting('from_email', e.target.value)}
                    placeholder="noreply@almahbub.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from-name">From Name</Label>
                  <Input
                    id="from-name"
                    value={settings.from_name}
                    onChange={(e) => updateSetting('from_name', e.target.value)}
                    placeholder="Almahbub Platform"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={testEmailSettings} disabled={isLoading}>
                  <Mail className="h-4 w-4 mr-2" />
                  {isLoading ? 'Sending...' : 'Send Test Email'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Settings */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                Configure API access and rate limiting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable API Access</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow external applications to access the API
                    </p>
                  </div>
                  <Switch
                    checked={settings.api_enabled}
                    onCheckedChange={(checked) => updateSetting('api_enabled', checked)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="api-rate-limit">Rate Limit (requests/hour)</Label>
                  <Input
                    id="api-rate-limit"
                    type="number"
                    value={settings.api_rate_limit}
                    onChange={(e) => updateSetting('api_rate_limit', parseInt(e.target.value))}
                    min="100"
                    max="10000"
                  />
                  <p className="text-sm text-muted-foreground">
                    Maximum API requests per hour per client
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api-key-required">API Key Requirement</Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="api-key-required"
                        checked={settings.api_key_required}
                        onCheckedChange={(checked) => updateSetting('api_key_required', checked)}
                      />
                      <Label htmlFor="api-key-required">Require API Key</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Require valid API key for all requests
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup Settings */}
        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Backup Configuration</CardTitle>
              <CardDescription>
                Configure automated backup settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Automatic Backups</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable automated database backups
                    </p>
                  </div>
                  <Switch
                    checked={settings.auto_backup}
                    onCheckedChange={(checked) => updateSetting('auto_backup', checked)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="backup-frequency">Backup Frequency</Label>
                  <select
                    id="backup-frequency"
                    value={settings.backup_frequency}
                    onChange={(e) => updateSetting('backup_frequency', e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backup-retention">Retention Period (days)</Label>
                  <Input
                    id="backup-retention"
                    type="number"
                    value={settings.backup_retention}
                    onChange={(e) => updateSetting('backup_retention', parseInt(e.target.value))}
                    min="7"
                    max="365"
                  />
                  <p className="text-sm text-muted-foreground">
                    How long to keep backup files
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backup-location">Backup Location</Label>
                <Input
                  id="backup-location"
                  value={settings.backup_location}
                  onChange={(e) => updateSetting('backup_location', e.target.value)}
                  placeholder="/backups"
                />
                <p className="text-sm text-muted-foreground">
                  Directory path where backup files will be stored
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Maintenance</CardTitle>
              <CardDescription>
                System maintenance and optimization tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Cache Management</h4>
                  <Button onClick={clearCache} variant="outline" className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Clear All Cache
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Clear system cache to improve performance
                  </p>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">System Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Version:</span>
                      <span>v1.0.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Database:</span>
                      <span>MySQL 8.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Node.js:</span>
                      <span>18.x</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Backup:</span>
                      <span>2 hours ago</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Important Notice
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      System settings affect all users. Please test changes in a development environment before applying to production.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;