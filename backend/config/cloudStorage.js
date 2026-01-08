const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || 'your_api_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'your_api_secret'
});

// Helper function to get Cloudinary upload folder based on type
const getCloudinaryFolder = (type) => {
  const folders = {
    categories: 'almahbub-procurement/categories',
    requests: 'almahbub-procurement/requests',
    orders: 'almahbub-procurement/orders',
    chat: 'almahbub-procurement/chat',
    announcements: 'almahbub-procurement/announcements',
    products: 'almahbub-procurement/products',
    users: 'almahbub-procurement/users',
    announcements_media: 'almahbub-procurement/announcements/media'
  };
  return folders[type] || 'almahbub-procurement/misc';
};

// Create Cloudinary storage for different upload types
const createCloudinaryStorage = (folderType, allowedFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp']) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: getCloudinaryFolder(folderType),
      allowed_formats: allowedFormats,
      transformation: [
        { quality: 'auto:best' },
        { fetch_format: 'auto' }
      ]
    }
  });
};

// Legacy local storage for fallback
const createLocalStorage = (uploadPath) => {
  const path = require('path');
  const fs = require('fs');
  
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const fullPath = path.join(__dirname, '..', uploadPath);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
      cb(null, fullPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
};

// Check if Cloudinary is configured
const isCloudinaryConfigured = () => {
  return process.env.CLOUDINARY_CLOUD_NAME && 
         process.env.CLOUDINARY_API_KEY && 
         process.env.CLOUDINARY_API_SECRET &&
         process.env.CLOUDINARY_CLOUD_NAME !== 'demo';
};

// Create uploader based on configuration
const createUploader = (folderType, fieldName = 'image', maxFiles = 1, allowedFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp']) => {
  if (isCloudinaryConfigured()) {
    const storage = createCloudinaryStorage(folderType, allowedFormats);
    return multer({
      storage: storage,
      limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
      }
    })[maxFiles > 1 ? 'array' : 'single'](fieldName);
  } else {
    // Fallback to local storage
    const uploadPath = `uploads/${folderType}`;
    const storage = createLocalStorage(uploadPath);
    return multer({
      storage: storage,
      limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
      }
    })[maxFiles > 1 ? 'array' : 'single'](fieldName);
  }
};

// Helper to get file URL (handles both Cloudinary and local paths)
const getFileUrl = (filePath) => {
  if (!filePath) return null;
  
  // If it's already a full URL (Cloudinary), return as is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  
  // If it's a local path, return the full URL
  const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;
  return `${baseUrl}${filePath}`;
};

// Helper to delete file
const deleteFile = async (filePath) => {
  if (!filePath) return;
  
  // If it's a Cloudinary URL, extract public_id and delete
  if (filePath.includes('cloudinary.com')) {
    try {
      // Extract public_id from URL
      const publicIdMatch = filePath.match(/\/v\d+\/(.+?)(?:\.[^.]+)?$/);
      if (publicIdMatch && publicIdMatch[1]) {
        await cloudinary.uploader.destroy(publicIdMatch[1]);
      }
    } catch (error) {
      console.error('Error deleting file from Cloudinary:', error);
    }
  } 
  // If it's a local path, delete from filesystem
  else if (filePath.startsWith('/uploads/')) {
    try {
      const path = require('path');
      const fs = require('fs');
      const fullPath = path.join(__dirname, '..', filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (error) {
      console.error('Error deleting local file:', error);
    }
  }
};

module.exports = {
  cloudinary,
  createCloudinaryStorage,
  createLocalStorage,
  createUploader,
  getFileUrl,
  deleteFile,
  isCloudinaryConfigured,
  getCloudinaryFolder
};
