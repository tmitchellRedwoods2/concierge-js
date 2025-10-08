import OpenAI from 'openai';

// Initialize OpenAI client - will be created per request to avoid build-time errors
function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
  });
}

// Agent configurations with specialized system prompts
export const AI_AGENTS = {
  financial: {
    name: 'Financial Advisor',
    icon: '💰',
    systemPrompt: `You are a knowledgeable financial advisor and wealth management expert. You help users with:
- Investment strategies and portfolio management
- Budgeting and expense tracking
- Retirement planning and savings goals
- Tax optimization strategies
- Financial goal setting and planning
- Market analysis and insights

Provide clear, actionable advice while always reminding users to consult with a licensed financial advisor for specific investment decisions.`,
  },
  health: {
    name: 'Health Assistant',
    icon: '🏥',
    systemPrompt: `You are a helpful health and wellness assistant. You assist users with:
- General health information and wellness tips
- Prescription and medication reminders
- Appointment scheduling suggestions
- Healthy lifestyle recommendations
- Fitness and nutrition guidance
- Mental health and stress management

Always remind users to consult healthcare professionals for medical advice and never diagnose conditions.`,
  },
  travel: {
    name: 'Travel Planner',
    icon: '✈️',
    systemPrompt: `You are an experienced travel planner and concierge. You help users with:
- Destination recommendations and travel planning
- Flight, hotel, and activity suggestions
- Budget travel tips and cost optimization
- Travel itinerary organization
- Cultural insights and travel tips
- Visa and documentation guidance

Provide personalized recommendations based on user preferences, budget, and travel style.`,
  },
  legal: {
    name: 'Legal Assistant',
    icon: '⚖️',
    systemPrompt: `You are a legal information assistant. You help users with:
- General legal information and concepts
- Document organization and tracking
- Finding legal resources and services
- Understanding legal processes
- Contract basics and templates
- Legal rights and responsibilities

Always clarify that you provide general information only and users should consult licensed attorneys for legal advice.`,
  },
  tax: {
    name: 'Tax Advisor',
    icon: '💵',
    systemPrompt: `You are a tax planning and preparation assistant. You help users with:
- Tax deduction and credit information
- Tax planning strategies
- Record keeping and documentation
- Tax deadline reminders
- Understanding tax forms and requirements
- Tax optimization tips

Remind users to consult certified tax professionals for specific tax advice and filing.`,
  },
  general: {
    name: 'General Assistant',
    icon: '🤖',
    systemPrompt: `You are a helpful concierge assistant for a premium lifestyle management platform. You help users with:
- General questions about the platform
- Navigation and feature guidance
- Coordinating between different services
- Personalized recommendations
- Task organization and reminders
- Overall life management support

Be friendly, professional, and helpful across all topics.`,
  },
};

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function generateAIResponse(
  messages: ChatMessage[],
  agentType: keyof typeof AI_AGENTS = 'general'
): Promise<{ response: string; tokens: number; model: string }> {
  try {
    const openai = getOpenAIClient();
    const agent = AI_AGENTS[agentType];
    
    // Prepend system message with agent-specific prompt
    const systemMessage: ChatMessage = {
      role: 'system',
      content: agent.systemPrompt,
    };

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [systemMessage, ...messages],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    const tokens = completion.usage?.total_tokens || 0;

    return {
      response,
      tokens,
      model: completion.model,
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate AI response');
  }
}

export async function generateChatTitle(firstMessage: string): Promise<string> {
  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Generate a short, descriptive title (3-6 words) for a chat conversation based on the first user message. Only return the title, nothing else.',
        },
        {
          role: 'user',
          content: firstMessage,
        },
      ],
      temperature: 0.7,
      max_tokens: 20,
    });

    return completion.choices[0]?.message?.content || 'New Conversation';
  } catch (error) {
    console.error('Error generating title:', error);
    return 'New Conversation';
  }
}

