import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get the URL from the request
    const url = new URL(request.url);
    // Extract the search params
    const searchParams = url.searchParams;

    // Get API base URL from environment or use default
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';
    
    // Create the full API URL to forward the request
    const apiUrl = `${API_BASE_URL}/api/books?${searchParams.toString()}`;

    console.log(`Proxying request to: ${apiUrl}`);
    
    // Forward the request to the backend API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Ensure we don't cache the response
    });

    // Get the response data
    const data = await response.json();

    // Return the response from the backend
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error proxying books request:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch books' },
      { status: 500 }
    );
  }
} 