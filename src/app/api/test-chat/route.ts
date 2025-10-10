import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    console.log('🧪 Test chat endpoint called');
    
    const { message, agentType = 'general' } = await req.json();
    
    console.log('🧪 Test parameters:', { message, agentType });
    
    // Create test messages
    const testMessages = [
      { role: 'user' as const, content: message || 'Hello, test message' }
    ];
    
    console.log('🧪 About to call generateAIResponse');
    
    const aiResponse = await generateAIResponse(testMessages, agentType as any);
    
    console.log('🧪 AI Response received:', {
      model: aiResponse.model,
      responseLength: aiResponse.response.length,
      responsePreview: aiResponse.response.substring(0, 100) + '...'
    });
    
    return NextResponse.json({
      status: 'ok',
      response: aiResponse.response,
      model: aiResponse.model,
      tokens: aiResponse.tokens
    });
    
  } catch (error) {
    console.error('🧪 Test chat error:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
