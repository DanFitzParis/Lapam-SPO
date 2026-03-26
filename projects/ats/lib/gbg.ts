/**
 * GBG Identity Verification (IDVT) Integration
 * 
 * FULLY MOCKED - No real GBG account.
 * In production, replace with actual GBG API calls.
 */

export interface GbgCheckRequest {
  applicantId: string
  firstName: string
  lastName: string
  documentType: 'passport' | 'share_code'
  documentNumber?: string
}

export interface GbgCheckResponse {
  checkId: string
  status: 'pending' | 'completed'
  result?: 'PASS' | 'FAIL'
  redirectUrl?: string
}

/**
 * Initiate a GBG identity verification check
 * 
 * @param request - Check request details
 * @returns Check ID and redirect URL (for IDVT flow)
 */
export async function initiateGbgCheck(request: GbgCheckRequest): Promise<GbgCheckResponse> {
  // Mock implementation
  const checkId = `gbg_mock_${Date.now()}`;
  
  console.log('[GBG Mock] Initiating check:', { checkId, ...request });

  if (request.documentType === 'passport') {
    // IDVT flow - return redirect URL
    return {
      checkId,
      status: 'pending',
      redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/rtw/mock-idvt?checkId=${checkId}`,
    };
  }

  // Share code flow - simulate immediate pass
  return {
    checkId,
    status: 'completed',
    result: 'PASS',
  };
}

/**
 * Mock webhook callback payload
 * In production, GBG would POST this to /api/webhooks/gbg
 */
export interface GbgWebhookPayload {
  checkId: string
  applicantId: string
  result: 'PASS' | 'FAIL'
  documentType?: string
  completedAt: string
}

/**
 * Simulate GBG webhook callback (for testing)
 * In production, GBG sends this automatically
 */
export async function simulateGbgWebhook(checkId: string, result: 'PASS' | 'FAIL'): Promise<void> {
  // Mock webhook callback
  const payload: GbgWebhookPayload = {
    checkId,
    applicantId: checkId.replace('gbg_mock_', 'app_'),
    result,
    documentType: 'passport',
    completedAt: new Date().toISOString(),
  };

  console.log('[GBG Mock] Would send webhook:', payload);
  
  // In production, GBG would POST to our webhook endpoint
  // await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/gbg`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(payload),
  // });
}
