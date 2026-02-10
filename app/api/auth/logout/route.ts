import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json({ success: true, message: 'Logged out' });
    response.cookies.delete('ai-code-mentor-auth');
    response.cookies.delete('ai-code-mentor-refresh');
    return response;
}
