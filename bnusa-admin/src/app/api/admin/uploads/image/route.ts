import { NextRequest } from 'next/server';
import { withAuth, successResponse, errorResponse } from '@/lib/api-auth';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';

// Max file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024; 

// Allowed MIME types for images
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
];

// Backblaze B2 configuration
const B2_KEY_ID = process.env.B2_KEY_ID;
const B2_APP_KEY = process.env.B2_APP_KEY;
const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME || 'bnusa-images';

// Calculate SHA1 hash for B2 upload
function calculateSha1(buffer: Buffer): string {
  return createHash('sha1').update(buffer).digest('hex');
}

// Get B2 authorization
async function getB2Auth() {
  try {
    // Step 1: Get authorization token
    const authUrl = 'https://api.backblazeb2.com/b2api/v2/b2_authorize_account';
    const authResponse = await fetch(authUrl, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${B2_KEY_ID}:${B2_APP_KEY}`).toString('base64')}`
      }
    });
    
    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error('B2 authorization failed:', errorText);
      throw new Error(`B2 authentication failed (${authResponse.status}): ${errorText}`);
    }
    
    const authData = await authResponse.json();
    
    // Step 2: Get bucket ID
    const listBucketsUrl = `${authData.apiUrl}/b2api/v2/b2_list_buckets`;
    const listBucketsResponse = await fetch(listBucketsUrl, {
      method: 'POST',
      headers: {
        'Authorization': authData.authorizationToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        accountId: authData.accountId
      })
    });
    
    if (!listBucketsResponse.ok) {
      const errorText = await listBucketsResponse.text();
      console.error('Failed to list buckets:', errorText);
      throw new Error(`Failed to list buckets (${listBucketsResponse.status}): ${errorText}`);
    }
    
    const bucketsData = await listBucketsResponse.json();
    const bucket = bucketsData.buckets.find((b: any) => b.bucketName === B2_BUCKET_NAME);
    
    if (!bucket) {
      throw new Error(`Bucket '${B2_BUCKET_NAME}' not found`);
    }
    
    return {
      authToken: authData.authorizationToken,
      apiUrl: authData.apiUrl,
      downloadUrl: authData.downloadUrl,
      bucketId: bucket.bucketId
    };
  } catch (error) {
    console.error('Error getting B2 auth:', error);
    throw error;
  }
}

async function uploadImage(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    // Validate file exists
    if (!file) {
      return errorResponse('No file provided', 400);
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse(`File size exceeds the limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`, 400);
    }
    
    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return errorResponse(`File type '${file.type}' is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`, 400);
    }
    
    // Extract file extension
    const originalName = file.name;
    const ext = originalName.split('.').pop() || '';
    
    // Generate a unique filename
    const fileName = `${uuidv4()}.${ext}`;
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Get B2 authentication and bucket info
    const { authToken, apiUrl, downloadUrl, bucketId } = await getB2Auth();
    
    // Get upload URL
    const getUploadUrlUrl = `${apiUrl}/b2api/v2/b2_get_upload_url`;
    const getUploadUrlResponse = await fetch(getUploadUrlUrl, {
      method: 'POST',
      headers: {
        'Authorization': authToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bucketId: bucketId
      })
    });
    
    if (!getUploadUrlResponse.ok) {
      const errorText = await getUploadUrlResponse.text();
      console.error('Failed to get upload URL:', errorText);
      throw new Error(`Failed to get upload URL (${getUploadUrlResponse.status}): ${errorText}`);
    }
    
    const uploadUrlData = await getUploadUrlResponse.json();
    
    // Calculate SHA1 hash of the file
    const sha1Hash = calculateSha1(buffer);
    
    // Upload the file
    const uploadResponse = await fetch(uploadUrlData.uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': uploadUrlData.authorizationToken,
        'X-Bz-File-Name': fileName,
        'Content-Type': file.type,
        'X-Bz-Content-Sha1': sha1Hash,
        'X-Bz-Info-Author': 'bnusa-admin'
      },
      body: buffer
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Failed to upload file to B2:', errorText);
      throw new Error(`Failed to upload file (${uploadResponse.status}): ${errorText}`);
    }
    
    const uploadData = await uploadResponse.json();
    const imageUrl = `${downloadUrl}/file/${B2_BUCKET_NAME}/${fileName}`;
    
    return successResponse({
      url: imageUrl,
      fileName,
      originalName,
      fileType: file.type,
      fileSize: file.size
    });
  } catch (error: any) {
    console.error('Error uploading image:', error);
    return errorResponse(error.message || 'Failed to upload image', 500);
  }
}

// Apply authentication to the upload endpoint
export const POST = withAuth(uploadImage);