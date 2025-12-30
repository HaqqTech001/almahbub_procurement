import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { apiClient } from '@/lib/api';
import { formatDateTime, getTimeAgo } from '@/lib/utils';
import {
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Trash2,
  Bot,
  Brain,
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Upload,
  Save,
  X,
  Eye,
  BarChart3,
  Users,
  Zap,
  HelpCircle,
} from 'lucide-react';

interface KnowledgeBase {
  id: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
  status: 'active' | 'inactive' | 'draft';
  confidence_score: number;
  usage_count: number;
  success_rate: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface AIResponse {
  id: number;
  query: string;
  response: string;
  confidence: number;
  category: string;
  user_rating: number;
  was_helpful: boolean;
  feedback: string;
  created_at: string;
  response_time: number;
}

interface AIModel {
  id: number;
  name: string;
  version: string;
  status: 'active' | 'training' | 'disabled';
  accuracy: number;
  total_queries: number;
  avg_response_time: number;
  last_trained: string;
}

const AIAssistantPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'knowledge' | 'responses' | 'models' | 'analytics'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  
  // Knowledge Base state
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase[]>([]);
  const [filteredKnowledge, setFilteredKnowledge] = useState<KnowledgeBase[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedKB, setSelectedKB] = useState<KnowledgeBase | null>(null);

  // AI Responses state
  const [aiResponses, setAiResponses] = useState<AIResponse[]>([]);
  const [selectedResponse, setSelectedResponse] = useState<AIResponse | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    tags: '',
    status: 'active' as 'active' | 'inactive' | 'draft',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Mock knowledge base data
      const mockKB: KnowledgeBase[] = [
        {
          id: 1,
          title: 'Order Processing Workflow',
          content: 'The order processing workflow begins when a customer submits an order through our platform. The system automatically validates the order details, checks inventory availability, and assigns a unique order number. Orders then proceed through approval, processing, and fulfillment stages...',
          category: 'Requests',
          tags: ['workflow', 'processing', 'orders'],
          status: 'active',
          confidence_score: 95,
          usage_count: 1247,
          success_rate: 92,
          created_by: 'Admin Team',
          created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
          updated_at: new Date(Date.now() - 86400000 * 7).toISOString(),
        },
        {
          id: 2,
          title: 'Return Policy Guidelines',
          content: 'Our return policy allows customers to return items within 30 days of purchase for a full refund. Items must be in original condition and packaging. Special orders and customized items may have different return policies. Return shipping is provided for defective items...',
          category: 'Returns',
          tags: ['returns', 'policy', 'refunds'],
          status: 'active',
          confidence_score: 88,
          usage_count: 892,
          success_rate: 89,
          created_by: 'Support Team',
          created_at: new Date(Date.now() - 86400000 * 45).toISOString(),
          updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        },
        {
          id: 3,
          title: 'Shipping Options and Delivery',
          content: 'We offer multiple shipping options to meet our customers\' needs. Standard shipping (5-7 business days), expedited shipping (2-3 business days), and overnight delivery are available. International shipping is available to most countries with varying delivery times...',
          category: 'Shipping',
          tags: ['shipping', 'delivery', 'logistics'],
          status: 'active',
          confidence_score: 91,
          usage_count: 634,
          success_rate: 94,
          created_by: 'Operations Team',
          created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
          updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        },
        {
          id: 4,
          title: 'Account Management Features',
          content: 'Users can manage their accounts through the customer portal. Features include order history, saved addresses, payment methods, account settings, and notification preferences. Users can also track their orders and download invoices...',
          category: 'Account',
          tags: ['account', 'profile', 'settings'],
          status: 'active',
          confidence_score: 87,
          usage_count: 445,
          success_rate: 91,
          created_by: 'Development Team',
          created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
          updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
        {
          id: 5,
          title: 'Payment Methods and Security',
          content: 'We accept major credit cards, PayPal, bank transfers, and purchase orders for business customers. All transactions are secured with SSL encryption and PCI DSS compliance. Payment information is never stored on our servers...',
          category: 'Payments',
          tags: ['payments', 'security', 'methods'],
          status: 'draft',
          confidence_score: 78,
          usage_count: 156,
          success_rate: 85,
          created_by: 'Finance Team',
          created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
          updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        },
      ];
      
      // Mock AI responses data
      const mockResponses: AIResponse[] = [
        {
          id: 1,
          query: 'How do I track my order?',
          response: 'You can track your order by logging into your account and visiting the "My Orders" section. There you will find all your recent orders with their current status and tracking information. You can also use your order number on our tracking page.',
          confidence: 94,
          category: 'Requests',
          user_rating: 4,
          was_helpful: true,
          feedback: 'Very clear and helpful explanation',
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          response_time: 1.2,
        },
        {
          id: 2,
          query: 'What is your return policy?',
          response: 'Our return policy allows you to return items within 30 days of purchase for a full refund. Items must be in original condition and packaging. To initiate a return, please contact our customer service team or use the return portal in your account.',
          confidence: 91,
          category: 'Returns',
          user_rating: 5,
          was_helpful: true,
          feedback: 'Comprehensive answer that covered all my concerns',
          created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
          response_time: 1.8,
        },
        {
          id: 3,
          query: 'Do you ship internationally?',
          response: 'Yes, we ship to most countries worldwide. International shipping times vary by destination, typically 7-14 business days. Additional customs fees and taxes may apply depending on your country.',
          confidence: 88,
          category: 'Shipping',
          user_rating: 4,
          was_helpful: true,
          feedback: 'Good information about international shipping',
          created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
          response_time: 1.5,
        },
      ];

      // Mock AI models data
      const mockModels: AIModel[] = [
        {
          id: 1,
          name: 'Customer Support AI',
          version: 'v2.1.3',
          status: 'active',
          accuracy: 92,
          total_queries: 12450,
          avg_response_time: 1.4,
          last_trained: new Date(Date.now() - 86400000 * 7).toISOString(),
        },
        {
          id: 2,
          name: 'Order Processing AI',
          version: 'v1.8.2',
          status: 'active',
          accuracy: 89,
          total_queries: 8920,
          avg_response_time: 0.8,
          last_trained: new Date(Date.now() - 86400000 * 14).toISOString(),
        },
        {
          id: 3,
          name: 'Product Recommendation AI',
          version: 'v3.0.1',
          status: 'training',
          accuracy: 85,
          total_queries: 5670,
          avg_response_time: 2.1,
          last_trained: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
      ];
      
      setKnowledgeBase(mockKB);
      setFilteredKnowledge(mockKB);
      setAiResponses(mockResponses);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    filterKnowledgeBase();
  }, [knowledgeBase, searchTerm, categoryFilter]);

  const filterKnowledgeBase = () => {
    let filtered = knowledgeBase;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(kb =>
        kb.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        kb.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        kb.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(kb => kb.category === categoryFilter);
    }

    setFilteredKnowledge(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      };

      if (selectedKB) {
        // Update existing knowledge base entry
        setKnowledgeBase(prev => prev.map(kb => 
          kb.id === selectedKB.id ? { ...kb, ...submitData } : kb
        ));
        setShowEditModal(false);
      } else {
        // Create new knowledge base entry
        const newKB: KnowledgeBase = {
          ...submitData,
          id: Date.now(),
          confidence_score: 0,
          usage_count: 0,
          success_rate: 0,
          created_by: 'Admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        setKnowledgeBase(prev => [...prev, newKB]);
        setShowCreateModal(false);
      }
      
      resetForm();
    } catch (error) {
      console.error('Failed to save knowledge base entry:', error);
    }
  };

  const handleDelete = async (kbId: number) => {
    if (window.confirm('Are you sure you want to delete this knowledge base entry?')) {
      try {
        setKnowledgeBase(prev => prev.filter(kb => kb.id !== kbId));
      } catch (error) {
        console.error('Failed to delete knowledge base entry:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: '',
      tags: '',
      status: 'active',
    });
    setSelectedKB(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (kb: KnowledgeBase) => {
    setSelectedKB(kb);
    setFormData({
      title: kb.title,
      content: kb.content,
      category: kb.category,
      tags: kb.tags.join(', '),
      status: kb.status,
    });
    setShowEditModal(true);
  };

  const openResponseModal = (response: AIResponse) => {
    setSelectedResponse(response);
    setShowResponseModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'training':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'disabled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
        ★
      </span>
    ));
  };

  // Calculate stats
  const stats = {
    totalQueries: aiResponses.length,
    avgConfidence: aiResponses.reduce((sum, r) => sum + r.confidence, 0) / aiResponses.length || 0,
    avgResponseTime: aiResponses.reduce((sum, r) => sum + r.response_time, 0) / aiResponses.length || 0,
    successRate: (aiResponses.filter(r => r.was_helpful).length / aiResponses.length) * 100 || 0,
    totalKBEntries: knowledgeBase.length,
    activeKBEntries: knowledgeBase.filter(kb => kb.status === 'active').length,
    totalUsage: knowledgeBase.reduce((sum, kb) => sum + kb.usage_count, 0),
    avgAccuracy: 89.5, // Mock data
  };

  const categories = Array.from(new Set(knowledgeBase.map(kb => kb.category)));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Assistant</h1>
          <p className="text-muted-foreground">
            Manage AI knowledge base and monitor assistant performance
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            Add Knowledge
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {[
            { key: 'overview', label: 'Overview', icon: BarChart3 },
            { key: 'knowledge', label: 'Knowledge Base', icon: Brain },
            { key: 'responses', label: 'AI Responses', icon: MessageSquare },
            { key: 'models', label: 'AI Models', icon: Bot },
            { key: 'analytics', label: 'Analytics', icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalQueries}</div>
                <p className="text-xs text-muted-foreground">
                  Last 24 hours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Confidence</CardTitle>
                <Brain className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgConfidence.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Response accuracy
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
                <Zap className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgResponseTime.toFixed(1)}s</div>
                <p className="text-xs text-muted-foreground">
                  Response speed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  User satisfaction
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent AI Responses */}
          <Card>
            <CardHeader>
              <CardTitle>Recent AI Responses</CardTitle>
              <CardDescription>
                Latest interactions and user feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiResponses.slice(0, 5).map((response) => (
                  <div
                    key={response.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium">{response.query}</span>
                        <Badge variant="outline">{response.category}</Badge>
                        <Badge className={response.was_helpful ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {response.was_helpful ? 'Helpful' : 'Not Helpful'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {response.response}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                        <span>Confidence: {response.confidence}%</span>
                        <span>Rating: {getRatingStars(response.user_rating)}</span>
                        <span>{getTimeAgo(response.created_at)}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openResponseModal(response)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Knowledge Base Tab */}
      {activeTab === 'knowledge' && (
        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search knowledge base..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Knowledge Base List */}
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Base ({filteredKnowledge.length})</CardTitle>
              <CardDescription>
                Manage AI training data and responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredKnowledge.map((kb) => (
                  <div
                    key={kb.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-sm font-medium">{kb.title}</h4>
                        <Badge className={getStatusColor(kb.status)}>
                          {kb.status}
                        </Badge>
                        <Badge variant="outline">{kb.category}</Badge>
                        <span className={`text-xs font-medium ${getConfidenceColor(kb.confidence_score)}`}>
                          {kb.confidence_score}% confidence
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {kb.content}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>Used {kb.usage_count} times</span>
                        <span>{kb.success_rate}% success rate</span>
                        <span>Updated {getTimeAgo(kb.updated_at)}</span>
                      </div>
                      
                      {kb.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {kb.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(kb)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(kb.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Responses Tab */}
      {activeTab === 'responses' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Response History</CardTitle>
              <CardDescription>
                Monitor AI responses and user feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiResponses.map((response) => (
                  <div
                    key={response.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-sm font-medium">{response.query}</h4>
                        <Badge variant="outline">{response.category}</Badge>
                        <Badge className={response.was_helpful ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {response.was_helpful ? 'Helpful' : 'Not Helpful'}
                        </Badge>
                        <span className={`text-xs font-medium ${getConfidenceColor(response.confidence)}`}>
                          {response.confidence}% confidence
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {response.response}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>Rating: {getRatingStars(response.user_rating)}</span>
                        <span>Response time: {response.response_time}s</span>
                        <span>{getTimeAgo(response.created_at)}</span>
                      </div>
                      
                      {response.feedback && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          "{response.feedback}"
                        </p>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openResponseModal(response)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Models Tab */}
      {activeTab === 'models' && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { name: 'Customer Support AI', version: 'v2.1.3', status: 'active', accuracy: 92, queries: 12450, time: 1.4 },
              { name: 'Order Processing AI', version: 'v1.8.2', status: 'active', accuracy: 89, queries: 8920, time: 0.8 },
              { name: 'Product Recommendation AI', version: 'v3.0.1', status: 'training', accuracy: 85, queries: 5670, time: 2.1 },
            ].map((model, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{model.name}</CardTitle>
                    <Badge className={getStatusColor(model.status)}>
                      {model.status}
                    </Badge>
                  </div>
                  <CardDescription>Version {model.version}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Accuracy</span>
                      <p className="font-medium">{model.accuracy}%</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Queries</span>
                      <p className="font-medium">{model.queries.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Avg. Time</span>
                      <p className="font-medium">{model.time}s</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status</span>
                      <p className="font-medium capitalize">{model.status}</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                    {model.status === 'training' ? (
                      <Button variant="outline" size="sm" className="flex-1">
                        <Clock className="h-4 w-4 mr-2" />
                        Training
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="flex-1">
                        <Brain className="h-4 w-4 mr-2" />
                        Retrain
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">
                {selectedKB ? 'Edit Knowledge Base Entry' : 'Add Knowledge Base Entry'}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter knowledge base title"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Category *
                  </label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g., Orders, Shipping"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Content *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter detailed knowledge base content"
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  rows={8}
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Tags (comma-separated)
                </label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="orders, shipping, support"
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  {selectedKB ? 'Update' : 'Add Entry'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Response Detail Modal */}
      {showResponseModal && selectedResponse && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">AI Response Details</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowResponseModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium">Query</label>
                <p className="text-sm mt-1">{selectedResponse.query}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium">AI Response</label>
                <p className="text-sm mt-1 p-3 bg-muted rounded">{selectedResponse.response}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Confidence</label>
                  <p className="text-sm mt-1">{selectedResponse.confidence}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium">User Rating</label>
                  <p className="text-sm mt-1">{getRatingStars(selectedResponse.user_rating)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Response Time</label>
                  <p className="text-sm mt-1">{selectedResponse.response_time}s</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Feedback</label>
                <p className="text-sm mt-1">{selectedResponse.feedback}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium">Created</label>
                <p className="text-sm mt-1">{formatDateTime(selectedResponse.created_at)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistantPage;