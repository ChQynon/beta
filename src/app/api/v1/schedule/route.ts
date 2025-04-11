import { NextResponse } from 'next/server'
import axios from 'axios'

// School system API endpoints - replace with actual endpoints
const SCHOOL_API_BASE_URL = 'https://school-system-api.example.com/api'
const LOGIN_URL = `${SCHOOL_API_BASE_URL}/auth/login`
const PROFILE_URL = `${SCHOOL_API_BASE_URL}/student/profile`
const GRADES_URL = `${SCHOOL_API_BASE_URL}/student/grades`

// Response interfaces
interface ResponseData {
  student: {
    id: string;
    fullName: string;
    class: string;
    school: string;
  };
  subjects: Array<{
    id: string;
    name: string;
    teacher: string;
    terms: Array<{
      term: string;
      mark: number | null;
      percentage: number | null;
    }>;
    current_percentage: number;
    current_mark: number;
    grades: Array<{
      date: string;
      value: number;
      comment: string;
    }>;
  }>;
  overall_average: {
    percentage: number;
    mark: number;
  };
  updated_at: string;
}

// Support both GET and POST methods
export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}

async function handleRequest(request: Request) {
  try {
    // Check for API key in Authorization header
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 401 })
    }
    
    const apiKey = authHeader.replace('Bearer ', '')
    
    // Verify the API key format
    if (!apiKey.startsWith('samga_')) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }
    
    // Get parameters from request
    let login: string | null = null;
    let password: string | null = null;
    let term: string | null = null;
    
    if (request.method === 'GET') {
      const url = new URL(request.url);
      login = url.searchParams.get('login');
      password = url.searchParams.get('password');
      term = url.searchParams.get('term');
    } else if (request.method === 'POST') {
      try {
        const body = await request.json();
        login = body.iin || body.login;
        password = body.password;
        term = body.term;
      } catch (error) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
      }
    }
    
    // Check if login credentials are provided
    if (!login || !password) {
      return NextResponse.json({ error: 'Login credentials are required' }, { status: 400 })
    }
    
    // Step 1: Login to the school system
    let schoolApiToken;
    try {
      const loginResponse = await axios.post(LOGIN_URL, { login, password })
      schoolApiToken = loginResponse.data.token
      
      if (!schoolApiToken) {
        throw new Error('Invalid login response')
      }
    } catch (error) {
      console.error('Login error:', error)
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }
    
    // Step 2: Get student profile
    let profileData;
    try {
      const profileResponse = await axios.get(PROFILE_URL, {
        headers: { Authorization: `Bearer ${schoolApiToken}` }
      })
      profileData = profileResponse.data
    } catch (error) {
      console.error('Profile error:', error)
      return NextResponse.json({ error: 'Failed to fetch student profile' }, { status: 500 })
    }
    
    // Step 3: Get grades data
    let gradesData;
    try {
      const gradesUrl = term ? `${GRADES_URL}?term=${term}` : GRADES_URL
      const gradesResponse = await axios.get(gradesUrl, {
        headers: { Authorization: `Bearer ${schoolApiToken}` }
      })
      gradesData = gradesResponse.data
    } catch (error) {
      console.error('Grades error:', error)
      return NextResponse.json({ error: 'Failed to fetch grades data' }, { status: 500 })
    }
    
    // Format response data
    const responseData: ResponseData = {
      student: {
        id: profileData.id,
        fullName: profileData.fullName,
        class: profileData.class,
        school: profileData.school
      },
      subjects: gradesData.subjects.map((subject: any) => ({
        id: subject.id,
        name: subject.name,
        teacher: subject.teacher,
        terms: subject.terms.map((term: any) => ({
          term: term.name,
          mark: term.mark,
          percentage: term.percentage
        })),
        current_percentage: subject.currentPercentage,
        current_mark: subject.currentMark,
        grades: subject.grades.map((grade: any) => ({
          date: grade.date,
          value: grade.value,
          comment: grade.comment
        }))
      })),
      overall_average: {
        percentage: gradesData.overallPercentage,
        mark: gradesData.overallMark
      },
      updated_at: gradesData.updatedAt
    }
    
    return NextResponse.json(responseData)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
} 