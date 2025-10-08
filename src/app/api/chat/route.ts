import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db/mongodb';
import Message from '@/lib/db/models/Message';
import ChatSession from '@/lib/db/models/ChatSession';
import { generateAIResponse, generateChatTitle } from '@/lib/openai';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { message, sessionId, agentType = 'general' } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Create or get session
    let chatSession;
    let newSessionId = sessionId;

    if (!sessionId) {
      // Create new session
      newSessionId = uuidv4();
      chatSession = await ChatSession.create({
        userId: session.user.id,
        sessionId: newSessionId,
        agentType,
        title: 'New Conversation',
      });
    } else {
      chatSession = await ChatSession.findOne({
        sessionId,
        userId: session.user.id,
      });

      if (!chatSession) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
    }

    // Save user message
    const userMessage = await Message.create({
      userId: session.user.id,
      sessionId: newSessionId,
      role: 'user',
      content: message,
      agentType,
    });

    // Get conversation history (last 10 messages for context)
    const history = await Message.find({
      userId: session.user.id,
      sessionId: newSessionId,
    })
      .sort({ createdAt: 1 })
      .limit(10)
      .lean();

    // Prepare messages for AI
    const aiMessages = history.map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

    // Generate AI response
    const { response, tokens, model } = await generateAIResponse(
      aiMessages,
      agentType as any
    );

    // Save AI response
    const assistantMessage = await Message.create({
      userId: session.user.id,
      sessionId: newSessionId,
      role: 'assistant',
      content: response,
      agentType,
      metadata: {
        tokens,
        model,
      },
    });

    // Update session
    chatSession.messageCount += 2;
    chatSession.lastMessageAt = new Date();

    // Generate title for first message
    if (chatSession.messageCount === 2 && chatSession.title === 'New Conversation') {
      const title = await generateChatTitle(message);
      chatSession.title = title;
    }

    await chatSession.save();

    return NextResponse.json({
      userMessage,
      assistantMessage,
      sessionId: newSessionId,
      sessionTitle: chatSession.title,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process message',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Get messages for session
    const messages = await Message.find({
      userId: session.user.id,
      sessionId,
    }).sort({ createdAt: 1 });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Failed to get messages' },
      { status: 500 }
    );
  }
}

