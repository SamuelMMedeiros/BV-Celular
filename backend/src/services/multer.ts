import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './cloudinary';

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req:any, file:any) ({
    folder: 'martins-tech',
    allowed_formats: ['jpg','jpeg','png','webp'],
    transformation: [{ width: 1200, crop: 'limit' })]
  }
});

export const upload = multer({ storage, limits: { files: 3 } });
