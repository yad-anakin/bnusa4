import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get API base URL from environment or use default
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';
    
    // Create the full API URL to forward the request
    const apiUrl = `${API_BASE_URL}/api/books/${params.id}`;

    console.log(`Proxying request to: ${apiUrl}`);
    
    // Forward the request to the backend API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Ensure we don't cache the response
    });
    
    if (!response.ok) {
      throw new Error(`Backend API returned ${response.status}`);
    }

    // Get the response data
    const data = await response.json();

    // Return the response from the backend
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error proxying book detail request:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch book details' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get API base URL from environment or use default
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';
    
    // Create the full API URL to forward the request
    const apiUrl = `${API_BASE_URL}/api/books/${params.id}?download=true`;

    console.log(`Proxying download request to: ${apiUrl}`);
    
    // Forward the request to the backend API
    const response = await fetch(apiUrl, {
      method: 'GET', // Using GET with a query param instead of PUT to match backend implementation
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Backend API returned ${response.status}`);
    }

    // Get the response data
    const data = await response.json();

    // Return the response from the backend
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error proxying book download request:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to record download' },
      { status: 500 }
    );
  }
} 