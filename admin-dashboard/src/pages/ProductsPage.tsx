// import React, { useEffect, useState } from 'react';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Badge } from '@/components/ui/badge';
// import { apiClient } from '@/lib/api';
// import { formatDateTime, formatNumber, getTimeAgo } from '@/lib/utils';
// import {
//   Search,
//   Filter,
//   Download,
//   Plus,
//   Edit,
//   Trash2,
//   Package,
//   Eye,
//   Star,
//   DollarSign,
//   X,
//   Save,
//   Upload,
// } from 'lucide-react';

// interface Product {
//   id: number;
//   name: string;
//   description: string;
//   sku: string;
//   category_id: number;
//   category_name: string;
//   price: number;
//   compare_at_price?: number;
//   cost?: number;
//   stock_quantity: number;
//   min_stock_level: number;
//   status: 'active' | 'inactive' | 'discontinued';
//   featured: boolean;
//   images: string[];
//   specifications: Record<string, any>;
//   weight?: number;
//   dimensions?: string;
//   tags: string[];
//   created_at: string;
//   updated_at: string;
//   total_orders: number;
//   total_revenue: number;
// }

// const ProductsPage: React.FC = () => {
//   const [products, setProducts] = useState<Product[]>([]);
//   const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [categoryFilter, setCategoryFilter] = useState('all');
//   const [statusFilter, setStatusFilter] = useState('all');
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [showViewModal, setShowViewModal] = useState(false);
//   const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // Form state
//   const [formData, setFormData] = useState({
//     name: '',
//     description: '',
//     sku: '',
//     category_id: '',
//     price: '',
//     compare_at_price: '',
//     cost: '',
//     stock_quantity: '',
//     min_stock_level: '',
//     status: 'active' as 'active' | 'inactive' | 'discontinued',
//     featured: false,
//     weight: '',
//     dimensions: '',
//     tags: '',
//   });

//   useEffect(() => {
//     fetchProducts();
//     fetchCategories();
//   }, []);

//   useEffect(() => {
//     filterProducts();
//   }, [products, searchTerm, categoryFilter, statusFilter]);

//   const fetchProducts = async () => {
//     try {
//       setIsLoading(true);
//       const response = await apiClient.getProducts();
      
//       if (response.success) {
//         setProducts(response.data.products);
//       }
//     } catch (error) {
//       console.error('Failed to fetch products:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const fetchCategories = async () => {
//     try {
//       const response = await apiClient.getCategories();
//       // Categories are already fetched in the main effect
//     } catch (error) {
//       console.error('Failed to fetch categories:', error);
//     }
//   };

//   const filterProducts = () => {
//     let filtered = products;

//     // Search filter
//     if (searchTerm) {
//       filtered = filtered.filter(product =>
//         product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
//       );
//     }

//     // Category filter
//     if (categoryFilter !== 'all') {
//       filtered = filtered.filter(product => product.category_id.toString() === categoryFilter);
//     }

//     // Status filter
//     if (statusFilter !== 'all') {
//       filtered = filtered.filter(product => product.status === statusFilter);
//     }

//     setFilteredProducts(filtered);
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSubmitting(true);

//     try {
//       const submitData = {
//         ...formData,
//         price: parseFloat(formData.price) || 0,
//         compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
//         cost: formData.cost ? parseFloat(formData.cost) : null,
//         stock_quantity: parseInt(formData.stock_quantity) || 0,
//         min_stock_level: parseInt(formData.min_stock_level) || 0,
//         weight: formData.weight ? parseFloat(formData.weight) : null,
//         category_id: parseInt(formData.category_id) || null,
//         tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
//       };

//       if (selectedProduct) {
//         // Update existing product
//         const response = await apiClient.updateProduct(selectedProduct.id, submitData);
//         if (response.success) {
//           setProducts(prev => prev.map(prod => 
//             prod.id === selectedProduct.id ? { ...prod, ...submitData } : prod
//           ));
//           setShowEditModal(false);
//         }
//       } else {
//         // Create new product
//         const response = await apiClient.createProduct(submitData);
//         if (response.success) {
//           setProducts(prev => [...prev, {
//             ...submitData,
//             id: Date.now(), // Temporary ID
//             category_name: 'Unknown', // Will be updated by API
//             images: [],
//             specifications: {},
//             total_orders: 0,
//             total_revenue: 0,
//             created_at: new Date().toISOString(),
//             updated_at: new Date().toISOString(),
//           }]);
//           setShowCreateModal(false);
//         }
//       }
      
//       resetForm();
//     } catch (error) {
//       console.error('Failed to save product:', error);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleDelete = async (productId: number) => {
//     if (window.confirm('Are you sure you want to delete this product?')) {
//       try {
//         const response = await apiClient.deleteProduct(productId);
//         if (response.success) {
//           setProducts(prev => prev.filter(prod => prod.id !== productId));
//         }
//       } catch (error) {
//         console.error('Failed to delete product:', error);
//       }
//     }
//   };

//   const handleFeaturedToggle = async (productId: number, featured: boolean) => {
//     try {
//       const response = await apiClient.updateProduct(productId, { featured });
//       if (response.success) {
//         setProducts(prev => prev.map(prod => 
//           prod.id === productId ? { ...prod, featured } : prod
//         ));
//       }
//     } catch (error) {
//       console.error('Failed to update product featured status:', error);
//     }
//   };

//   const resetForm = () => {
//     setFormData({
//       name: '',
//       description: '',
//       sku: '',
//       category_id: '',
//       price: '',
//       compare_at_price: '',
//       cost: '',
//       stock_quantity: '',
//       min_stock_level: '',
//       status: 'active',
//       featured: false,
//       weight: '',
//       dimensions: '',
//       tags: '',
//     });
//     setSelectedProduct(null);
//   };

//   const openCreateModal = () => {
//     resetForm();
//     setShowCreateModal(true);
//   };

//   const openEditModal = (product: Product) => {
//     setSelectedProduct(product);
//     setFormData({
//       name: product.name,
//       description: product.description,
//       sku: product.sku,
//       category_id: product.category_id.toString(),
//       price: product.price.toString(),
//       compare_at_price: product.compare_at_price?.toString() || '',
//       cost: product.cost?.toString() || '',
//       stock_quantity: product.stock_quantity.toString(),
//       min_stock_level: product.min_stock_level.toString(),
//       status: product.status,
//       featured: product.featured,
//       weight: product.weight?.toString() || '',
//       dimensions: product.dimensions || '',
//       tags: product.tags.join(', '),
//     });
//     setShowEditModal(true);
//   };

//   const openViewModal = (product: Product) => {
//     setSelectedProduct(product);
//     setShowViewModal(true);
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'active':
//         return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
//       case 'inactive':
//         return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
//       case 'discontinued':
//         return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
//       default:
//         return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
//     }
//   };

//   const getStockStatus = (product: Product) => {
//     if (product.stock_quantity === 0) {
//       return { text: 'Out of Stock', color: 'text-red-600' };
//     } else if (product.stock_quantity <= product.min_stock_level) {
//       return { text: 'Low Stock', color: 'text-yellow-600' };
//     } else {
//       return { text: 'In Stock', color: 'text-green-600' };
//     }
//   };

//   const stats = {
//     total: products.length,
//     active: products.filter(p => p.status === 'active').length,
//     lowStock: products.filter(p => p.stock_quantity <= p.min_stock_level).length,
//     outOfStock: products.filter(p => p.stock_quantity === 0).length,
//     totalRevenue: products.reduce((sum, p) => sum + p.total_revenue, 0),
//   };

//   // Mock categories for the filter dropdown
//   const categories = [
//     { id: 1, name: 'Electronics' },
//     { id: 2, name: 'Office Supplies' },
//     { id: 3, name: 'Furniture' },
//     { id: 4, name: 'Software' },
//     { id: 5, name: 'Hardware' },
//   ];

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight">Products</h1>
//           <p className="text-muted-foreground">
//             Manage your product catalog and inventory
//           </p>
//         </div>
//         <Button onClick={openCreateModal}>
//           <Plus className="h-4 w-4 mr-2" />
//           Add Product
//         </Button>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid gap-4 md:grid-cols-5">
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Total Products</CardTitle>
//             <Package className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{stats.total}</div>
//             <p className="text-xs text-muted-foreground">
//               All products
//             </p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Active</CardTitle>
//             <Package className="h-4 w-4 text-green-500" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{stats.active}</div>
//             <p className="text-xs text-muted-foreground">
//               Currently available
//             </p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
//             <Package className="h-4 w-4 text-yellow-500" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{stats.lowStock}</div>
//             <p className="text-xs text-muted-foreground">
//               Need restocking
//             </p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
//             <Package className="h-4 w-4 text-red-500" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{stats.outOfStock}</div>
//             <p className="text-xs text-muted-foreground">
//               Zero inventory
//             </p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
//             <DollarSign className="h-4 w-4 text-blue-500" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">${formatNumber(stats.totalRevenue)}</div>
//             <p className="text-xs text-muted-foreground">
//               From all products
//             </p>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Filters */}
//       <Card>
//         <CardContent className="pt-6">
//           <div className="flex flex-col sm:flex-row gap-4">
//             <div className="relative flex-1">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//               <Input
//                 placeholder="Search products by name, description, SKU, or tags..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="pl-10"
//               />
//             </div>
//             <div className="flex gap-2">
//               <select
//                 value={categoryFilter}
//                 onChange={(e) => setCategoryFilter(e.target.value)}
//                 className="px-3 py-2 border border-input bg-background rounded-md text-sm"
//               >
//                 <option value="all">All Categories</option>
//                 {categories.map(category => (
//                   <option key={category.id} value={category.id.toString()}>
//                     {category.name}
//                   </option>
//                 ))}
//               </select>
//               <select
//                 value={statusFilter}
//                 onChange={(e) => setStatusFilter(e.target.value)}
//                 className="px-3 py-2 border border-input bg-background rounded-md text-sm"
//               >
//                 <option value="all">All Status</option>
//                 <option value="active">Active</option>
//                 <option value="inactive">Inactive</option>
//                 <option value="discontinued">Discontinued</option>
//               </select>
//               <Button variant="outline" size="icon">
//                 <Filter className="h-4 w-4" />
//               </Button>
//               <Button variant="outline" size="icon">
//                 <Download className="h-4 w-4" />
//               </Button>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Products Table */}
//       <Card>
//         <CardHeader>
//           <CardTitle>All Products ({filteredProducts.length})</CardTitle>
//           <CardDescription>
//             Manage your product catalog and inventory levels
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-4">
//             {filteredProducts.length > 0 ? (
//               filteredProducts.map((product) => {
//                 const stockStatus = getStockStatus(product);
//                 return (
//                   <div
//                     key={product.id}
//                     className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
//                   >
//                     <div className="flex items-center space-x-4 flex-1">
//                       <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
//                         {product.images.length > 0 ? (
//                           <img
//                             src={product.images[0]}
//                             alt={product.name}
//                             className="w-full h-full object-cover rounded-lg"
//                           />
//                         ) : (
//                           <Package className="h-8 w-8 text-gray-400" />
//                         )}
//                       </div>
                      
//                       <div className="flex-1 min-w-0">
//                         <div className="flex items-center space-x-2 mb-1">
//                           <h4 className="text-sm font-medium truncate">
//                             {product.name}
//                           </h4>
//                           {product.featured && (
//                             <Star className="h-4 w-4 text-yellow-500 fill-current" />
//                           )}
//                           <Badge className={getStatusColor(product.status)}>
//                             {product.status}
//                           </Badge>
//                         </div>
                        
//                         <div className="flex items-center space-x-4 text-sm text-muted-foreground">
//                           <span>SKU: {product.sku}</span>
//                           <span>•</span>
//                           <span>{product.category_name}</span>
//                           <span>•</span>
//                           <span>${formatNumber(product.price)}</span>
//                         </div>
                        
//                         <p className="text-sm text-muted-foreground mt-1 truncate">
//                           {product.description}
//                         </p>
                        
//                         <div className="flex items-center space-x-4 mt-2">
//                           <span className={`text-sm ${stockStatus.color}`}>
//                             {stockStatus.text} ({product.stock_quantity})
//                           </span>
//                           <span className="text-sm text-muted-foreground">
//                             {product.total_orders} orders
//                           </span>
//                           <span className="text-sm text-muted-foreground">
//                             ${formatNumber(product.total_revenue)} revenue
//                           </span>
//                         </div>
//                       </div>
//                     </div>
                    
//                     <div className="flex items-center space-x-2">
//                       <Button
//                         variant="ghost"
//                         size="icon"
//                         onClick={() => openViewModal(product)}
//                       >
//                         <Eye className="h-4 w-4" />
//                       </Button>
                      
//                       <Button
//                         variant="ghost"
//                         size="icon"
//                         onClick={() => openEditModal(product)}
//                       >
//                         <Edit className="h-4 w-4" />
//                       </Button>
                      
//                       <Button
//                         variant="ghost"
//                         size="icon"
//                         onClick={() => handleFeaturedToggle(product.id, !product.featured)}
//                       >
//                         <Star className={`h-4 w-4 ${product.featured ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
//                       </Button>
                      
//                       <Button
//                         variant="ghost"
//                         size="icon"
//                         onClick={() => handleDelete(product.id)}
//                       >
//                         <Trash2 className="h-4 w-4" />
//                       </Button>
//                     </div>
//                   </div>
//                 );
//               })
//             ) : (
//               <div className="text-center py-8 text-muted-foreground">
//                 {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
//                   ? 'No products match your search criteria'
//                   : 'No products found'
//                 }
//               </div>
//             )}
//           </div>
//         </CardContent>
//       </Card>

//       {/* View Product Modal */}
//       {showViewModal && selectedProduct && (
//         <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
//           <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
//             <div className="flex items-center justify-between p-6 border-b">
//               <h2 className="text-xl font-semibold">Product Details</h2>
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 onClick={() => setShowViewModal(false)}
//               >
//                 <X className="h-4 w-4" />
//               </Button>
//             </div>
            
//             <div className="p-6">
//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                 {/* Product Images */}
//                 <div>
//                   <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-4">
//                     {selectedProduct.images.length > 0 ? (
//                       <img
//                         src={selectedProduct.images[0]}
//                         alt={selectedProduct.name}
//                         className="w-full h-full object-cover rounded-lg"
//                       />
//                     ) : (
//                       <Package className="h-16 w-16 text-gray-400" />
//                     )}
//                   </div>
//                   {selectedProduct.images.length > 1 && (
//                     <div className="grid grid-cols-4 gap-2">
//                       {selectedProduct.images.slice(1, 5).map((image, index) => (
//                         <div key={index} className="aspect-square bg-gray-100 rounded flex items-center justify-center">
//                           <img
//                             src={image}
//                             alt={`${selectedProduct.name} ${index + 2}`}
//                             className="w-full h-full object-cover rounded"
//                           />
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
                
//                 {/* Product Info */}
//                 <div className="space-y-4">
//                   <div>
//                     <h3 className="text-2xl font-bold">{selectedProduct.name}</h3>
//                     <p className="text-muted-foreground">{selectedProduct.description}</p>
//                   </div>
                  
//                   <div className="flex items-center space-x-4">
//                     <Badge className={getStatusColor(selectedProduct.status)}>
//                       {selectedProduct.status}
//                     </Badge>
//                     {selectedProduct.featured && (
//                       <Star className="h-4 w-4 text-yellow-500 fill-current" />
//                     )}
//                   </div>
                  
//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <label className="text-sm font-medium">Price</label>
//                       <p className="text-lg font-semibold">${formatNumber(selectedProduct.price)}</p>
//                     </div>
//                     <div>
//                       <label className="text-sm font-medium">SKU</label>
//                       <p className="text-sm">{selectedProduct.sku}</p>
//                     </div>
//                     <div>
//                       <label className="text-sm font-medium">Stock</label>
//                       <p className="text-sm">{selectedProduct.stock_quantity} units</p>
//                     </div>
//                     <div>
//                       <label className="text-sm font-medium">Category</label>
//                       <p className="text-sm">{selectedProduct.category_name}</p>
//                     </div>
//                   </div>
                  
//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <label className="text-sm font-medium">Orders</label>
//                       <p className="text-sm">{selectedProduct.total_orders}</p>
//                     </div>
//                     <div>
//                       <label className="text-sm font-medium">Revenue</label>
//                       <p className="text-sm">${formatNumber(selectedProduct.total_revenue)}</p>
//                     </div>
//                   </div>
                  
//                   {selectedProduct.tags.length > 0 && (
//                     <div>
//                       <label className="text-sm font-medium">Tags</label>
//                       <div className="flex flex-wrap gap-1 mt-1">
//                         {selectedProduct.tags.map((tag, index) => (
//                           <Badge key={index} variant="outline" className="text-xs">
//                             {tag}
//                           </Badge>
//                         ))}
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Create/Edit Modal */}
//       {(showCreateModal || showEditModal) && (
//         <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
//           <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
//             <div className="flex items-center justify-between p-6 border-b">
//               <h2 className="text-xl font-semibold">
//                 {selectedProduct ? 'Edit Product' : 'Create Product'}
//               </h2>
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 onClick={() => {
//                   setShowCreateModal(false);
//                   setShowEditModal(false);
//                   resetForm();
//                 }}
//               >
//                 <X className="h-4 w-4" />
//               </Button>
//             </div>
            
//             <form onSubmit={handleSubmit} className="p-6 space-y-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="text-sm font-medium mb-2 block">
//                     Product Name *
//                   </label>
//                   <Input
//                     value={formData.name}
//                     onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
//                     placeholder="Enter product name"
//                     required
//                   />
//                 </div>
                
//                 <div>
//                   <label className="text-sm font-medium mb-2 block">
//                     SKU *
//                   </label>
//                   <Input
//                     value={formData.sku}
//                     onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
//                     placeholder="Enter SKU"
//                     required
//                   />
//                 </div>
//               </div>
              
//               <div>
//                 <label className="text-sm font-medium mb-2 block">
//                   Description
//                 </label>
//                 <textarea
//                   value={formData.description}
//                   onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
//                   placeholder="Enter product description"
//                   className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
//                   rows={3}
//                 />
//               </div>
              
//               <div className="grid grid-cols-3 gap-4">
//                 <div>
//                   <label className="text-sm font-medium mb-2 block">
//                     Price *
//                   </label>
//                   <Input
//                     type="number"
//                     step="0.01"
//                     value={formData.price}
//                     onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
//                     placeholder="0.00"
//                     required
//                   />
//                 </div>
                
//                 <div>
//                   <label className="text-sm font-medium mb-2 block">
//                     Compare at Price
//                   </label>
//                   <Input
//                     type="number"
//                     step="0.01"
//                     value={formData.compare_at_price}
//                     onChange={(e) => setFormData(prev => ({ ...prev, compare_at_price: e.target.value }))}
//                     placeholder="0.00"
//                   />
//                 </div>
                
//                 <div>
//                   <label className="text-sm font-medium mb-2 block">
//                     Cost
//                   </label>
//                   <Input
//                     type="number"
//                     step="0.01"
//                     value={formData.cost}
//                     onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
//                     placeholder="0.00"
//                   />
//                 </div>
//               </div>
              
//               <div className="grid grid-cols-3 gap-4">
//                 <div>
//                   <label className="text-sm font-medium mb-2 block">
//                     Stock Quantity *
//                   </label>
//                   <Input
//                     type="number"
//                     value={formData.stock_quantity}
//                     onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: e.target.value }))}
//                     placeholder="0"
//                     required
//                   />
//                 </div>
                
//                 <div>
//                   <label className="text-sm font-medium mb-2 block">
//                     Min Stock Level
//                   </label>
//                   <Input
//                     type="number"
//                     value={formData.min_stock_level}
//                     onChange={(e) => setFormData(prev => ({ ...prev, min_stock_level: e.target.value }))}
//                     placeholder="0"
//                   />
//                 </div>
                
//                 <div>
//                   <label className="text-sm font-medium mb-2 block">
//                     Status
//                   </label>
//                   <select
//                     value={formData.status}
//                     onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' | 'discontinued' }))}
//                     className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
//                   >
//                     <option value="active">Active</option>
//                     <option value="inactive">Inactive</option>
//                     <option value="discontinued">Discontinued</option>
//                   </select>
//                 </div>
//               </div>
              
//               <div>
//                 <label className="text-sm font-medium mb-2 block">
//                   Tags (comma-separated)
//                 </label>
//                 <Input
//                   value={formData.tags}
//                   onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
//                   placeholder="electronics, office, supplies"
//                 />
//               </div>
              
//               <div className="flex items-center space-x-2">
//                 <input
//                   type="checkbox"
//                   id="featured"
//                   checked={formData.featured}
//                   onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
//                   className="rounded"
//                 />
//                 <label htmlFor="featured" className="text-sm font-medium">
//                   Featured Product
//                 </label>
//               </div>
              
//               <div className="flex justify-end space-x-2 pt-4">
//                 <Button
//                   type="button"
//                   variant="outline"
//                   onClick={() => {
//                     setShowCreateModal(false);
//                     setShowEditModal(false);
//                     resetForm();
//                   }}
//                 >
//                   Cancel
//                 </Button>
//                 <Button type="submit" disabled={isSubmitting}>
//                   <Save className="h-4 w-4 mr-2" />
//                   {isSubmitting ? 'Saving...' : (selectedProduct ? 'Update' : 'Create')}
//                 </Button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ProductsPage;


import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { formatDateTime, formatNumber, getTimeAgo } from '@/lib/utils';
import {
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Trash2,
  Package,
  Eye,
  Star,
  DollarSign,
  X,
  Save,
  Upload,
} from 'lucide-react';

interface Product {
  id: number;
  name: string;
  description: string;
  sku: string;
  category_id: number;
  category_name: string;
  price: number;
  compare_at_price?: number;
  cost?: number;
  stock_quantity: number;
  min_stock_level: number;
  status: 'active' | 'inactive' | 'discontinued';
  featured: boolean;
  images: string[];
  specifications: Record<string, any>;
  weight?: number;
  dimensions?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  total_orders: number;
  total_revenue: number;
}

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    category_id: '',
    price: '',
    compare_at_price: '',
    cost: '',
    stock_quantity: '',
    min_stock_level: '',
    status: 'active' as 'active' | 'inactive' | 'discontinued',
    featured: false,
    weight: '',
    dimensions: '',
    tags: '',
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, categoryFilter, statusFilter]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getProducts();
      
      if (response.success) {
        setProducts(response.data.products);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiClient.getCategories();
      // Categories are already fetched in the main effect
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category_id.toString() === categoryFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(product => product.status === statusFilter);
    }

    setFilteredProducts(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        min_stock_level: parseInt(formData.min_stock_level) || 0,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        category_id: parseInt(formData.category_id) || null,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      };

      if (selectedProduct) {
        // Update existing product
        const response = await apiClient.updateProduct(selectedProduct.id, submitData);
        if (response.success) {
          setProducts(prev => prev.map(prod => 
            prod.id === selectedProduct.id ? { ...prod, ...submitData } : prod
          ));
          setShowEditModal(false);
        }
      } else {
        // Create new product
        const response = await apiClient.createProduct(submitData);
        if (response.success) {
          setProducts(prev => [...prev, {
            ...submitData,
            id: Date.now(), // Temporary ID
            category_name: 'Unknown', // Will be updated by API
            images: [],
            specifications: {},
            total_orders: 0,
            total_revenue: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }]);
          setShowCreateModal(false);
        }
      }
      
      resetForm();
    } catch (error) {
      console.error('Failed to save product:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (productId: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await apiClient.deleteProduct(productId);
        if (response.success) {
          setProducts(prev => prev.filter(prod => prod.id !== productId));
        }
      } catch (error) {
        console.error('Failed to delete product:', error);
      }
    }
  };

  const handleFeaturedToggle = async (productId: number, featured: boolean) => {
    try {
      const response = await apiClient.updateProduct(productId, { featured });
      if (response.success) {
        setProducts(prev => prev.map(prod => 
          prod.id === productId ? { ...prod, featured } : prod
        ));
      }
    } catch (error) {
      console.error('Failed to update product featured status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sku: '',
      category_id: '',
      price: '',
      compare_at_price: '',
      cost: '',
      stock_quantity: '',
      min_stock_level: '',
      status: 'active',
      featured: false,
      weight: '',
      dimensions: '',
      tags: '',
    });
    setSelectedProduct(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      sku: product.sku,
      category_id: product.category_id.toString(),
      price: product.price.toString(),
      compare_at_price: product.compare_at_price?.toString() || '',
      cost: product.cost?.toString() || '',
      stock_quantity: product.stock_quantity.toString(),
      min_stock_level: product.min_stock_level.toString(),
      status: product.status,
      featured: product.featured,
      weight: product.weight?.toString() || '',
      dimensions: product.dimensions || '',
      tags: product.tags.join(', '),
    });
    setShowEditModal(true);
  };

  const openViewModal = (product: Product) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'discontinued':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.stock_quantity === 0) {
      return { text: 'Out of Stock', color: 'text-red-600' };
    } else if (product.stock_quantity <= product.min_stock_level) {
      return { text: 'Low Stock', color: 'text-yellow-600' };
    } else {
      return { text: 'In Stock', color: 'text-green-600' };
    }
  };

  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    lowStock: products.filter(p => p.stock_quantity <= p.min_stock_level).length,
    outOfStock: products.filter(p => p.stock_quantity === 0).length,
    totalRevenue: products.reduce((sum, p) => sum + p.total_revenue, 0),
  };

  // Mock categories for the filter dropdown
  const categories = [
    { id: 1, name: 'Electronics' },
    { id: 2, name: 'Office Supplies' },
    { id: 3, name: 'Furniture' },
    { id: 4, name: 'Software' },
    { id: 5, name: 'Hardware' },
  ];

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
          <h1 className="text-3xl font-bold tracking-tight">Products & Services</h1>
          <p className="text-muted-foreground">
            Manage your procurement catalog and inventory
          </p>
        </div>
        <Button onClick={openCreateModal} className='text-white'>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All products
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Currently available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <Package className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lowStock}</div>
            <p className="text-xs text-muted-foreground">
              Need restocking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <Package className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.outOfStock}</div>
            <p className="text-xs text-muted-foreground">
              Zero inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${formatNumber(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              From all products
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products/services by name, description, SKU, or tags..."
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
                  <option key={category.id} value={category.id.toString()}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="discontinued">Discontinued</option>
              </select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Products ({filteredProducts.length})</CardTitle>
          <CardDescription>
            Manage your product catalog and inventory levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product);
                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        {product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-sm font-medium truncate">
                            {product.name}
                          </h4>
                          {product.featured && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                          <Badge className={getStatusColor(product.status)}>
                            {product.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>SKU: {product.sku}</span>
                          <span>•</span>
                          <span>{product.category_name}</span>
                          <span>•</span>
                          <span>${formatNumber(product.price)}</span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          {product.description}
                        </p>
                        
                        <div className="flex items-center space-x-4 mt-2">
                          <span className={`text-sm ${stockStatus.color}`}>
                            {stockStatus.text} ({product.stock_quantity})
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {product.total_orders} orders
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ${formatNumber(product.total_revenue)} revenue
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openViewModal(product)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleFeaturedToggle(product.id, !product.featured)}
                      >
                        <Star className={`h-4 w-4 ${product.featured ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                  ? 'No products match your search criteria'
                  : 'No products found'
                }
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Product Modal */}
      {showViewModal && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Product Details</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowViewModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Product Images */}
                <div>
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    {selectedProduct.images.length > 0 ? (
                      <img
                        src={selectedProduct.images[0]}
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Package className="h-16 w-16 text-gray-400" />
                    )}
                  </div>
                  {selectedProduct.images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {selectedProduct.images.slice(1, 5).map((image, index) => (
                        <div key={index} className="aspect-square bg-gray-100 rounded flex items-center justify-center">
                          <img
                            src={image}
                            alt={`${selectedProduct.name} ${index + 2}`}
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Product Info */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold">{selectedProduct.name}</h3>
                    <p className="text-muted-foreground">{selectedProduct.description}</p>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <Badge className={getStatusColor(selectedProduct.status)}>
                      {selectedProduct.status}
                    </Badge>
                    {selectedProduct.featured && (
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Price</label>
                      <p className="text-lg font-semibold">${formatNumber(selectedProduct.price)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">SKU</label>
                      <p className="text-sm">{selectedProduct.sku}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Stock</label>
                      <p className="text-sm">{selectedProduct.stock_quantity} units</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Category</label>
                      <p className="text-sm">{selectedProduct.category_name}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Orders</label>
                      <p className="text-sm">{selectedProduct.total_orders}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Revenue</label>
                      <p className="text-sm">${formatNumber(selectedProduct.total_revenue)}</p>
                    </div>
                  </div>
                  
                  {selectedProduct.tags.length > 0 && (
                    <div>
                      <label className="text-sm font-medium">Tags</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedProduct.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">
                {selectedProduct ? 'Edit Product' : 'Create Product'}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Product/Service Name *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter product/service name"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    SKU *
                  </label>
                  <Input
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    placeholder="Enter SKU"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter product description"
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Price *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Compare at Price
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.compare_at_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, compare_at_price: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Cost
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Stock Quantity *
                  </label>
                  <Input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: e.target.value }))}
                    placeholder="0"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Min Stock Level
                  </label>
                  <Input
                    type="number"
                    value={formData.min_stock_level}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_stock_level: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' | 'discontinued' }))}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="discontinued">Discontinued</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Tags (comma-separated)
                </label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="procurement, services, office, supplies"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="featured" className="text-sm font-medium">
                  Featured Item
                </label>
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
                <Button type="submit" disabled={isSubmitting}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Saving...' : (selectedProduct ? 'Update' : 'Create')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;