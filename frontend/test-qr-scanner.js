// Test script to verify QR scanner is working
// Run this in the browser console to test QR scanner functionality

async function testQrScanner() {
  console.log('Testing QR Scanner...');
  
  try {
    // Check if QrScanner is available
    if (typeof QrScanner === 'undefined') {
      throw new Error('QrScanner not loaded');
    }
    
    console.log('✓ QrScanner library is loaded');
    console.log('QrScanner:', QrScanner);
    
    // Check if scanImage method exists
    if (typeof QrScanner.scanImage !== 'function') {
      throw new Error('scanImage method not available');
    }
    
    console.log('✓ scanImage method is available');
    
    // Test camera availability
    try {
      const hasCamera = await QrScanner.hasCamera();
      console.log('✓ Camera availability check:', hasCamera);
    } catch (e) {
      console.log('⚠ Camera check failed:', e.message);
    }
    
    // Create a test QR code data URL
    const testAddress = "0x1234567890abcdef1234567890abcdef12345678";
    
    // Generate a test QR code using QRCode library if available
    if (typeof QRCode !== 'undefined') {
      const qrDataUrl = await new Promise((resolve, reject) => {
        QRCode.toDataURL(testAddress, (err, url) => {
          if (err) reject(err);
          else resolve(url);
        });
      });
      
      console.log('✓ Test QR code generated');
      
      // Convert data URL to blob
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      const file = new File([blob], "test-qr.png", { type: "image/png" });
      
      console.log('✓ Test file created:', file);
      
      // Try to scan the test QR code
      const result = await QrScanner.scanImage(file);
      console.log('✓ QR scan result:', result);
      
      if (result === testAddress) {
        console.log('✅ QR Scanner test PASSED - Successfully scanned test QR code');
        return true;
      } else {
        console.log('❌ QR Scanner test FAILED - Result does not match expected value');
        console.log('Expected:', testAddress);
        console.log('Got:', result);
        return false;
      }
    } else {
      console.log('⚠ QRCode library not available for generating test QR');
      return 'partial';
    }
    
  } catch (error) {
    console.error('❌ QR Scanner test FAILED:', error);
    return false;
  }
}

// Run the test
testQrScanner().then(result => {
  if (result === true) {
    console.log('🎉 All QR Scanner tests passed!');
  } else if (result === 'partial') {
    console.log('⚠ Partial test completed - QR Scanner library appears to be loaded');
  } else {
    console.log('💥 QR Scanner tests failed - check the errors above');
  }
});