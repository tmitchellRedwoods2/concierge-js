import { NextRequest, NextResponse } from 'next/server';
import { healthEmailParserService } from '@/lib/services/health-email-parser';
import { prescriptionRefillAutomationService } from '@/lib/services/prescription-refill-automation';
import { emailTriggerService } from '@/lib/services/email-trigger';

/**
 * Health Email Webhook Endpoint
 * Receives health-related emails and automatically processes them
 * 
 * This endpoint should be public (no auth) as it receives webhooks from email services
 * Security is handled via webhook secret verification
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const webhookSecret = request.headers.get('x-webhook-secret');
    const expectedSecret = process.env.HEALTH_EMAIL_WEBHOOK_SECRET || process.env.EMAIL_WEBHOOK_SECRET;
    
    if (expectedSecret && webhookSecret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Support multiple email service formats
    let emailData: {
      from: string;
      subject: string;
      body: string;
      userId?: string;
      to?: string;
    };

    // SendGrid format
    if (body.from && body.subject && (body.text || body.html)) {
      emailData = {
        from: body.from,
        subject: body.subject,
        body: body.text || body.html || '',
        to: body.to
      };
    }
    // Mailgun format
    else if (body['sender'] && body['subject'] && body['body-plain']) {
      emailData = {
        from: body['sender'],
        subject: body['subject'],
        body: body['body-plain'] || body['body-html'] || '',
        to: body.recipient
      };
    }
    // Generic format
    else if (body.from && body.subject && body.body) {
      emailData = {
        from: body.from,
        subject: body.subject,
        body: body.body,
        to: body.to
      };
    } else {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get userId from payload or lookup by email
    let userId = body.userId;
    if (!userId && emailData.to) {
      // TODO: Look up user by email address
      // For now, we'll require userId in the webhook payload
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    console.log(`📧 Received health email from ${emailData.from} for user ${userId}`);

    // Parse health email
    const parsedHealthEmail = healthEmailParserService.parseHealthEmail({
      from: emailData.from,
      subject: emailData.subject,
      body: emailData.body
    });

    if (!parsedHealthEmail) {
      console.log('⚠️ Email does not appear to contain health-related information');
      
      // Still process through email trigger system for other automation rules
      await emailTriggerService.processEmail({
        from: emailData.from,
        subject: emailData.subject,
        body: emailData.body,
        userId
      });

      return NextResponse.json({
        success: true,
        message: 'Email processed, but no health information detected',
        healthDataProcessed: false
      });
    }

    console.log(`✅ Parsed health email type: ${parsedHealthEmail.type}`);

    // Process based on type
    let result: any = {};

    switch (parsedHealthEmail.type) {
      case 'prescription_refill':
        const refillResult = await prescriptionRefillAutomationService.processRefillRequest(
          parsedHealthEmail,
          userId,
          body.autoRequest || false // Allow auto-request flag in webhook
        );
        result = {
          type: 'prescription_refill',
          refillRequested: refillResult.refillRequested,
          prescriptionId: refillResult.prescriptionId,
          message: refillResult.message,
          estimatedReadyDate: refillResult.estimatedReadyDate
        };
        break;

      case 'lab_results':
        // TODO: Implement lab results processing
        result = {
          type: 'lab_results',
          message: 'Lab results detected - processing not yet implemented',
          labName: parsedHealthEmail.labName,
          testDate: parsedHealthEmail.testDate
        };
        break;

      case 'medical_bill':
        // TODO: Implement medical bill processing
        result = {
          type: 'medical_bill',
          message: 'Medical bill detected - processing not yet implemented',
          provider: parsedHealthEmail.provider,
          amount: parsedHealthEmail.amount
        };
        break;

      case 'appointment_availability':
        // TODO: Implement appointment availability processing
        result = {
          type: 'appointment_availability',
          message: 'Appointment availability detected - processing not yet implemented',
          doctorName: parsedHealthEmail.doctorName,
          availableTimes: parsedHealthEmail.availableTimes.length
        };
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Unknown health email type'
        }, { status: 400 });
    }

    // Also process through email trigger system for other automation rules
    await emailTriggerService.processEmail({
      from: emailData.from,
      subject: emailData.subject,
      body: emailData.body,
      userId
    });

    return NextResponse.json({
      success: true,
      message: 'Health email processed successfully',
      healthDataProcessed: true,
      parsedData: parsedHealthEmail,
      result
    });

  } catch (error) {
    console.error('❌ Error processing health email webhook:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process health email'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for webhook verification
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Health email webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}

