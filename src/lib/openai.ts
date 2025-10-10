import Anthropic from '@anthropic-ai/sdk';

// Initialize Claude AI
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY || '',
});

// Mock AI responses for fallback - no API costs!
const MOCK_RESPONSES = {
  financial: [
    "I'd be happy to help you create a monthly budget! Let's start by listing your income sources and fixed expenses.",
    "For a $5000 monthly income, I recommend the 50/30/20 rule: 50% needs, 30% wants, 20% savings.",
    "Consider tracking your expenses for a month to see where your money actually goes.",
    "Emergency funds should cover 3-6 months of expenses. Start with $1000 if you're building from scratch.",
    "High-yield savings accounts are great for emergency funds - they offer better returns than regular savings."
  ],
  investment: [
    "I can help you with investment strategies and portfolio management. What's your investment goal?",
    "Diversification is key - don't put all your eggs in one basket.",
    "Consider your risk tolerance and time horizon when choosing investments.",
    "Index funds and ETFs are great for long-term, low-cost investing.",
    "Regular portfolio rebalancing helps maintain your target asset allocation."
  ],
  insurance: [
    "I'm here to help you understand insurance options and coverage needs.",
    "Review your insurance policies annually to ensure adequate coverage.",
    "Life insurance needs change with major life events - marriage, children, home purchase.",
    "Umbrella policies provide additional liability protection beyond your primary policies.",
    "Compare quotes from multiple providers to get the best rates and coverage."
  ],
  health: [
    "I'm here to help with your health and wellness questions. What specific area would you like guidance on?",
    "Regular exercise and a balanced diet are the foundation of good health.",
    "Don't forget to stay hydrated - aim for 8 glasses of water per day.",
    "Sleep is crucial for health - adults need 7-9 hours per night.",
    "Regular check-ups with your healthcare provider are important for preventive care."
  ],
  travel: [
    "I'd love to help you plan your trip! Where are you thinking of going?",
    "For budget travel, consider off-season timing and flexible dates.",
    "Don't forget to check visa requirements and passport expiration dates.",
    "Travel insurance is worth considering for international trips.",
    "Research local customs and learn a few key phrases in the local language."
  ],
  legal: [
    "I can provide general legal information, but always consult a licensed attorney for specific advice.",
    "Keep important legal documents organized and in a safe place.",
    "Review contracts carefully before signing - don't hesitate to ask questions.",
    "Consider having a will and power of attorney documents prepared.",
    "Many legal issues can be prevented with good documentation and clear communication."
  ],
  tax: [
    "I can help with general tax planning strategies and information.",
    "Keep all receipts and documents organized throughout the year.",
    "Consider contributing to retirement accounts for tax benefits.",
    "Track deductible expenses like home office, business meals, and charitable donations.",
    "Always consult a tax professional for complex situations."
  ],
  general: [
    "Hello! I'm your AI assistant. How can I help you today?",
    "I'm here to assist with various aspects of your life management.",
    "Feel free to ask me questions about any of our service areas.",
    "I can help coordinate between different aspects of your lifestyle management.",
    "What would you like to know more about?"
  ]
};

// Agent configurations with specialized system prompts
export const AI_AGENTS = {
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
  investment: {
    name: 'Investment Advisor',
    icon: '📈',
    systemPrompt: `You are an expert investment advisor specializing in portfolio management. You help users with:
- Stock and ETF analysis
- Portfolio diversification strategies
- Risk assessment and management
- Asset allocation recommendations
- Market trends and insights
- Long-term wealth building

Provide data-driven insights while reminding users to do their own research and consult financial professionals.`,
  },
  insurance: {
    name: 'Insurance Advisor',
    icon: '🛡️',
    systemPrompt: `You are an insurance specialist helping users understand coverage options. You help users with:
- Life, health, auto, and home insurance
- Coverage needs assessment
- Policy comparison and selection
- Claims process guidance
- Risk management strategies
- Insurance cost optimization

Provide clear explanations while recommending users consult licensed insurance agents for specific policies.`,
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
    console.log('Generating AI response:', { 
      agentType, 
      messageCount: messages.length,
      hasApiKey: !!process.env.CLAUDE_API_KEY,
      apiKeyLength: process.env.CLAUDE_API_KEY?.length || 0,
      apiKeyPrefix: process.env.CLAUDE_API_KEY?.substring(0, 10) || 'none'
    });
    
    // Check if we have a Claude API key
    if (!process.env.CLAUDE_API_KEY) {
      console.log('❌ No Claude API key found, using mock responses');
      console.log('Environment variables available:', Object.keys(process.env).filter(key => key.includes('CLAUDE') || key.includes('API')));
      return await generateMockResponse(messages, agentType);
    }
    
    console.log('✅ Claude API key found, attempting real AI response');
    
    // Get the agent configuration
    const agent = AI_AGENTS[agentType];
    
    // Get the last user message
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) {
      throw new Error('No user message found');
    }
    
    console.log('Sending to Claude:', {
      agentType,
      userMessage: lastUserMessage.content.substring(0, 100) + '...'
    });
    
    // Create the full prompt with system message
    const fullPrompt = `${agent.systemPrompt}\n\nHuman: ${lastUserMessage.content}\n\nAssistant:`;
    
    console.log('Attempting to generate content with prompt length:', fullPrompt.length);
    
    // Use Claude Haiku (cheapest model)
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: fullPrompt
        }
      ]
    });
    
    console.log('Claude response received');
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    console.log('Text extracted, length:', text.length);
    
    console.log('Claude response received:', text.substring(0, 100) + '...');
    
    return {
      response: text,
      tokens: response.usage?.output_tokens || Math.floor(text.length / 4),
      model: 'claude-3-haiku-20240307',
    };
    
  } catch (error) {
    console.error('❌ Claude AI error:', error);
    console.log('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    console.log('🔄 Falling back to mock response');
    return await generateMockResponse(messages, agentType);
  }
}

// Fallback mock response function
async function generateMockResponse(
  messages: ChatMessage[],
  agentType: keyof typeof AI_AGENTS
): Promise<{ response: string; tokens: number; model: string }> {
  try {
    // Get the last user message
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    const userMessage = lastUserMessage?.content || '';
    
    // Get appropriate responses for this agent type
    const responses = MOCK_RESPONSES[agentType];
    
    // Simple keyword matching for more relevant responses
    let selectedResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Customize response based on user message
    if (userMessage.toLowerCase().includes('budget') || userMessage.toLowerCase().includes('money')) {
      selectedResponse = responses[0]; // Usually budget-related
    } else if (userMessage.toLowerCase().includes('help') || userMessage.toLowerCase().includes('how')) {
      selectedResponse = responses[1] || responses[0];
    } else if (userMessage.toLowerCase().includes('plan') || userMessage.toLowerCase().includes('planning')) {
      selectedResponse = responses[2] || responses[0];
    }
    
    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    return {
      response: selectedResponse,
      tokens: Math.floor(selectedResponse.length / 4),
      model: 'mock-ai-v1',
    };
  } catch (error) {
    console.error('Mock AI error:', error);
    throw new Error(`AI failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateChatTitle(firstMessage: string): Promise<string> {
  try {
    // Simple title generation based on keywords
    const message = firstMessage.toLowerCase();
    
    if (message.includes('budget') || message.includes('money')) {
      return 'Budget Planning';
    } else if (message.includes('health') || message.includes('wellness')) {
      return 'Health Discussion';
    } else if (message.includes('travel') || message.includes('trip')) {
      return 'Travel Planning';
    } else if (message.includes('legal') || message.includes('law')) {
      return 'Legal Questions';
    } else if (message.includes('tax') || message.includes('taxes')) {
      return 'Tax Planning';
    } else {
      return 'New Conversation';
    }
  } catch (error) {
    console.error('Error generating title:', error);
    return 'New Conversation';
  }
}

