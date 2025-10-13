/**
 * AI-powered intent recognition and workflow processing
 */
import { EventSource, Intent, UserContext, WorkflowResult } from './types';
import { generateAIResponse } from '../openai';

export class AIWorkflowProcessor {
  private systemPrompt = `You are an AI assistant that analyzes events and determines appropriate actions for a personal concierge service.

Your job is to:
1. Analyze incoming events (emails, voicemails, notifications)
2. Extract intent and entities
3. Determine if automated action is appropriate
4. Generate structured responses for workflow execution

Available actions:
- appointment: Schedule or manage appointments
- prescription: Handle prescription refills or management
- claim: Process insurance claims
- payment: Handle payment-related tasks
- notification: Send notifications or updates
- general: General assistance or information

Always consider:
- User preferences and permissions
- Risk level of the action
- Whether approval is required
- Confidence in your analysis

Respond with a JSON object containing your analysis.`;

  async analyzeEvent(event: EventSource, context: UserContext): Promise<Intent> {
    try {
      const prompt = `
Event Type: ${event.type}
Event Content: ${event.content}
Event Metadata: ${JSON.stringify(event.metadata)}
User Context: ${JSON.stringify(context.preferences)}

Analyze this event and determine:
1. What is the user trying to accomplish?
2. What type of action is needed?
3. What entities can you extract?
4. How confident are you in this analysis?
5. Does this require user approval?

Respond with JSON:
{
  "type": "appointment|prescription|claim|payment|notification|general",
  "confidence": 0.0-1.0,
  "entities": {
    "provider": "Dr. Smith",
    "date": "2024-01-15",
    "medication": "Lisinopril",
    "amount": "$250"
  },
  "action": "schedule_appointment|refill_prescription|file_claim|process_payment|send_notification",
  "parameters": {
    "provider": "Dr. Smith",
    "date": "2024-01-15",
    "time": "2:00 PM"
  },
  "requiresApproval": true|false,
  "estimatedImpact": "low|medium|high",
  "reasoning": "Explanation of your analysis"
}`;

      const response = await generateAIResponse(prompt, 'general');
      
      // Parse the AI response
      const analysis = this.parseAIResponse(response);
      
      return {
        id: `intent_${Date.now()}`,
        type: analysis.type,
        confidence: analysis.confidence,
        entities: analysis.entities,
        action: analysis.action,
        parameters: analysis.parameters,
        requiresApproval: analysis.requiresApproval,
        estimatedImpact: analysis.estimatedImpact
      };
    } catch (error) {
      console.error('Error analyzing event:', error);
      throw new Error('Failed to analyze event with AI');
    }
  }

  private parseAIResponse(response: string): any {
    try {
      // Extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      // Fallback to basic analysis
      return {
        type: 'general',
        confidence: 0.5,
        entities: {},
        action: 'send_notification',
        parameters: {},
        requiresApproval: true,
        estimatedImpact: 'medium'
      };
    }
  }

  async determineWorkflow(intent: Intent, context: UserContext): Promise<string | null> {
    // Map intents to workflow IDs
    const workflowMap: Record<string, string> = {
      'appointment': 'schedule-appointment',
      'prescription': 'manage-prescription',
      'claim': 'process-insurance-claim',
      'payment': 'process-payment',
      'notification': 'send-notification',
      'general': 'general-assistance'
    };

    const workflowId = workflowMap[intent.type];
    
    if (!workflowId) {
      return null;
    }

    // Check if user has permissions for this workflow
    if (!this.hasPermission(intent.type, context.permissions)) {
      return null;
    }

    // Check if auto-execution is allowed
    if (intent.requiresApproval && !this.canAutoExecute(intent.type, context.preferences)) {
      return null;
    }

    return workflowId;
  }

  private hasPermission(actionType: string, permissions: any): boolean {
    switch (actionType) {
      case 'appointment':
        return permissions.canScheduleAppointments;
      case 'prescription':
        return permissions.canManagePrescriptions;
      case 'claim':
        return permissions.canFileClaims;
      case 'payment':
        return permissions.canAccessFinancialData;
      default:
        return true;
    }
  }

  private canAutoExecute(actionType: string, preferences: any): boolean {
    switch (actionType) {
      case 'appointment':
        return preferences.autoApproveAppointments;
      case 'prescription':
        return preferences.autoApprovePrescriptions;
      case 'claim':
        return preferences.autoApproveClaims;
      default:
        return false;
    }
  }

  async generateApprovalMessage(intent: Intent, workflowId: string): Promise<string> {
    const prompt = `
Generate a user-friendly approval message for the following AI-determined action:

Intent: ${intent.type}
Action: ${intent.action}
Parameters: ${JSON.stringify(intent.parameters)}
Workflow: ${workflowId}
Confidence: ${intent.confidence}

Create a clear, concise message that explains:
1. What the AI wants to do
2. Why it thinks this is the right action
3. What the user needs to approve
4. Any risks or considerations

Keep it under 200 words and make it easy to understand.`;

    try {
      const response = await generateAIResponse(prompt, 'general');
      return response;
    } catch (error) {
      console.error('Error generating approval message:', error);
      return `The AI assistant wants to perform the following action: ${intent.action}. Please review and approve if this is correct.`;
    }
  }
}
