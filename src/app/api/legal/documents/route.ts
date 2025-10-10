import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/connection';
import LegalDocument from '@/lib/db/models/LegalDocument';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');
    const documentType = searchParams.get('documentType');
    const category = searchParams.get('category');

    // Build query
    const query: any = { userId: session.user.id, isLatestVersion: true };
    if (caseId) query.caseId = caseId;
    if (documentType) query.documentType = documentType;
    if (category) query.category = category;
    
    const documents = await LegalDocument.find(query)
      .populate('caseId')
      .sort({ documentDate: -1 });

    // Calculate summary statistics
    const totalSize = documents.reduce((sum, d) => sum + (d.fileSize || 0), 0);
    const confidentialDocs = documents.filter(d => d.confidential || d.privileged);

    return NextResponse.json({ 
      status: 'ok',
      documents,
      summary: {
        totalDocuments: documents.length,
        totalSize,
        confidentialDocuments: confidentialDocs.length
      }
    });
  } catch (error) {
    console.error('Error fetching legal documents:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const body = await request.json();
    const {
      caseId,
      title,
      description,
      documentType,
      category,
      fileName,
      fileSize,
      fileType,
      filePath,
      fileUrl,
      documentDate,
      receivedDate,
      sentDate,
      fromParty,
      toParty,
      confidential,
      privileged,
      courtFiled,
      filingDate,
      caseNumber,
      docketNumber,
      accessLevel,
      tags,
      notes
    } = body;

    // Create new legal document
    const document = new LegalDocument({
      userId: session.user.id,
      caseId: caseId || undefined,
      title,
      description: description || '',
      documentType,
      category: category || 'LEGAL',
      fileName,
      fileSize: parseInt(fileSize) || 0,
      fileType,
      filePath: filePath || '',
      fileUrl: fileUrl || '',
      documentDate: new Date(documentDate),
      receivedDate: receivedDate ? new Date(receivedDate) : undefined,
      sentDate: sentDate ? new Date(sentDate) : undefined,
      fromParty: fromParty || '',
      toParty: toParty || '',
      confidential: confidential || false,
      privileged: privileged || false,
      courtFiled: courtFiled || false,
      filingDate: filingDate ? new Date(filingDate) : undefined,
      caseNumber: caseNumber || '',
      docketNumber: docketNumber || '',
      accessLevel: accessLevel || 'CONFIDENTIAL',
      tags: tags || [],
      notes: notes || '',
      version: 1,
      isLatestVersion: true
    });

    await document.save();

    return NextResponse.json({ 
      status: 'ok',
      document,
      message: 'Document added successfully'
    });
  } catch (error) {
    console.error('Error creating legal document:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    const document = await LegalDocument.findOneAndDelete({
      _id: documentId,
      userId: session.user.id
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      status: 'ok',
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
