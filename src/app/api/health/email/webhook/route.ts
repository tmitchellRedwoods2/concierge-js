import { NextRequest, NextResponse } from 'next/server';
import { pharmacyEmailParser } from '@/lib/services/pharmacy-email-parser';
import { prescriptionRefillAutomationService } from '@/lib/services/prescription-refill-automation';
import connectDB from '@/lib/db/mongodb';
import Prescription from '@/lib/db/models/Prescription';
import { NotificationService } from '@/lib/services/notification-service';

const notificationService = new NotificationService();

/**
 * POST /api/health/email/webhook
 * Webhook endpoint for receiving pharmacy emails
 * This can be called by email services (SendGrid, Mailgun, etc.) when emails are received
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract email data from webhook payload
    // Format depends on email service provider (SendGrid, Mailgun, etc.)
    const email = {
      subject: body.subject || body['Subject'] || '',
      body: body.text || body.body || body['TextBody'] || '',
      from: body.from || body['From'] || body.sender || '',
      text: body.text || body['TextBody'] || body.plain || '',
      html: body.html || body['HtmlBody'] || body['HTML'] || ''
    };

    if (!email.subject && !email.body) {
      return NextResponse.json(
        { error: 'Invalid email payload' },
        { status: 400 }
      );
    }

    // Parse the email
    const parsed = pharmacyEmailParser.parseEmail(email);

    // If we can't identify the type, log and return
    if (parsed.type === 'unknown') {
      console.log('Unknown pharmacy email type:', email.subject);
      return NextResponse.json({
        success: true,
        message: 'Email received but type not recognized',
        parsed
      });
    }

    // Find matching prescription(s) for the user
    await connectDB();

    // Try to find prescription by medication name or prescription number
    const query: any = {
      isActive: true
    };

    if (parsed.medicationName) {
      query.medicationName = { $regex: new RegExp(parsed.medicationName, 'i') };
    }

    if (parsed.prescriptionNumber) {
      query.$or = [
        { pharmacyRxNumber: parsed.prescriptionNumber },
        { _id: parsed.prescriptionNumber }
      ];
    }

    const prescriptions = await Prescription.find(query);

    if (prescriptions.length === 0) {
      console.log('No matching prescription found for:', parsed);
      return NextResponse.json({
        success: true,
        message: 'Email parsed but no matching prescription found',
        parsed
      });
    }

    // Update refill status for each matching prescription
    const results = [];

    for (const prescription of prescriptions) {
      const userId = prescription.userId;

      // Map parsed status to refill history status
      let refillStatus: 'requested' | 'processing' | 'ready' | 'picked_up' | 'cancelled' | 'failed' = 'processing';
      
      if (parsed.status === 'ready') {
        refillStatus = 'ready';
      } else if (parsed.status === 'cancelled') {
        refillStatus = 'cancelled';
      } else if (parsed.status === 'delayed') {
        refillStatus = 'processing';
      } else if (parsed.status === 'processing') {
        refillStatus = 'processing';
      }

      // Update refill status
      const updateResult = await prescriptionRefillAutomationService.updateRefillStatus(
        prescription._id.toString(),
        userId,
        new Date(), // Use current date as refill date
        refillStatus,
        {
          estimatedReady: parsed.estimatedReadyDate,
          actualReady: parsed.actualReadyDate,
          notes: parsed.message,
          confirmationNumber: parsed.confirmationNumber
        }
      );

      if (updateResult) {
        results.push({
          prescriptionId: prescription._id.toString(),
          medicationName: prescription.medicationName,
          status: refillStatus,
          success: true
        });

        // Send notification to user
        await notificationService.sendNotification(userId, {
          type: `prescription_refill_${refillStatus}`,
          title: parsed.type === 'refill_ready' 
            ? 'Prescription Ready for Pickup'
            : parsed.type === 'refill_processing'
            ? 'Prescription Being Processed'
            : parsed.type === 'refill_delayed'
            ? 'Prescription Delayed'
            : 'Prescription Status Update',
          message: parsed.message || `Your prescription status has been updated to: ${refillStatus}`,
          data: {
            prescriptionId: prescription._id.toString(),
            medicationName: prescription.medicationName,
            status: refillStatus,
            pharmacy: parsed.pharmacy,
            estimatedReady: parsed.estimatedReadyDate,
            actualReady: parsed.actualReadyDate,
            confirmationNumber: parsed.confirmationNumber
          }
        });
      } else {
        results.push({
          prescriptionId: prescription._id.toString(),
          medicationName: prescription.medicationName,
          success: false,
          error: 'Failed to update refill status'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} prescription(s)`,
      parsed,
      results
    });
  } catch (error: any) {
    console.error('Error processing pharmacy email webhook:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process email',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/health/email/webhook
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'pharmacy-email-webhook',
    message: 'Webhook endpoint is active'
  });
}

