import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import MediaUpload from '@/components/ui/MediaUpload';
import {
  ArrowLeft,
  Save,
  Upload,
  X,
  Info,
  AlertTriangle,
  Clock,
  Star,
  CheckCircle,
} from 'lucide-react';

const CreateAnnouncementPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    type: 'info' as 'info' | 'maintenance' | 'update' | 'urgent' | 'promotion',
    status: 'draft' as 'draft' | 'published' | 'scheduled',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    target_audience: 'all' as 'all' | 'customers' | 'admins' | 'users',
    scheduled_for: '',
    expires_at: '',
    pinned: false,
    tags: '',
  });

  const [mediaFiles, setMediaFiles] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.content.trim()) {
      setError('Content is required');
      return;
    }

    if (!formData.summary.trim()) {
      setError('Summary is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        summary: formData.summary.trim(),
        type: formData.type,
        status: formData.status,
        priority: formData.priority,
        target_audience: formData.target_audience,
        scheduled_for: formData.scheduled_for || undefined,
        expires_at: formData.expires_at || undefined,
        pinned: formData.pinned,
        tags: formData.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        media: mediaFiles.length > 0 ? mediaFiles : undefined,
      };

      await apiClient.createAnnouncement(submitData);
      navigate('/announcements');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMediaChange = (files: File[]) => {
    setMediaFiles(files);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'update':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'promotion':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/announcements')}
          className="flex-shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Announcement</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Create a new announcement to communicate with your audience
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-900/20">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Announcement Details</CardTitle>
                <CardDescription>
                  Fill in the main content of your announcement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Enter announcement title"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Summary <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.summary}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, summary: e.target.value }))
                    }
                    placeholder="Brief summary of the announcement"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, content: e.target.value }))
                    }
                    placeholder="Full announcement content"
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm min-h-[150px] sm:min-h-[200px] resize-y"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Media upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Media Attachments
                </CardTitle>
                <CardDescription>
                  Upload images, videos, or documents to attach to your announcement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MediaUpload
                  onFilesSelected={handleMediaChange}
                  maxFiles={5}
                  maxSizeMB={10}
                  accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish settings */}
            <Card>
              <CardHeader>
                <CardTitle>Publish Settings</CardTitle>
                <CardDescription>
                  Configure how and when to publish this announcement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: e.target.value as any,
                      }))
                    }
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>

                {(formData.status === 'scheduled' || formData.status === 'published') && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      {formData.status === 'scheduled' ? 'Schedule For' : 'Publish Date'}
                    </label>
                    <Input
                      type="datetime-local"
                      value={formData.scheduled_for}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          scheduled_for: e.target.value,
                        }))
                      }
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-2 block">Expiration Date</label>
                  <Input
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        expires_at: e.target.value,
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Categorization */}
            <Card>
              <CardHeader>
                <CardTitle>Categorization</CardTitle>
                <CardDescription>
                  Categorize and prioritize your announcement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Type</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { value: 'info', icon: Info, label: 'Info' },
                      { value: 'update', icon: CheckCircle, label: 'Update' },
                      { value: 'maintenance', icon: Clock, label: 'Maintenance' },
                      { value: 'urgent', icon: AlertTriangle, label: 'Urgent' },
                      { value: 'promotion', icon: Star, label: 'Promotion' },
                    ].map(({ value, icon: Icon, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            type: value as any,
                          }))
                        }
                        className={`
                          flex items-center justify-center gap-2 p-2 rounded-md border text-sm transition-colors
                          ${
                            formData.type === value
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-input hover:border-primary/50'
                          }
                        `}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        priority: e.target.value as any,
                      }))
                    }
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Target Audience</label>
                  <select
                    value={formData.target_audience}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        target_audience: e.target.value as any,
                      }))
                    }
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="all">Everyone</option>
                    <option value="customers">Customers</option>
                    <option value="admins">Admins</option>
                    <option value="users">Users</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Additional options */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="pinned"
                    checked={formData.pinned}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        pinned: e.target.checked,
                      }))
                    }
                    className="rounded"
                  />
                  <label htmlFor="pinned" className="text-sm font-medium">
                    Pin this announcement
                  </label>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Tags (comma-separated)
                  </label>
                  <Input
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, tags: e.target.value }))
                    }
                    placeholder="important, update, system"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Creating...' : 'Create Announcement'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/announcements')}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateAnnouncementPage;
