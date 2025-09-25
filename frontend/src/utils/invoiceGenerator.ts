// Invoice Generation Utility for Transaction NFTs

export interface InvoiceData {
  transactionHash: string;
  from: string;
  to: string;
  amount: string;
  timestamp: Date;
  type: 'sent' | 'received';
  status: 'confirmed' | 'pending' | 'failed';
  note?: string;
}

export const generateInvoiceImage = (transaction: InvoiceData): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // Set canvas size for NFT-like square format
    canvas.width = 800;
    canvas.height = 800;
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0f0f23');
    gradient.addColorStop(0.5, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add subtle grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // Main border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
    
    // Title section
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(40, 40, canvas.width - 80, 100);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TRANSACTION INVOICE', canvas.width / 2, 100);
    
    // Transaction type badge
    const typeColor = transaction.type === 'sent' ? '#ef4444' : '#22c55e';
    ctx.fillStyle = typeColor;
    ctx.fillRect(canvas.width / 2 - 60, 110, 120, 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillText(transaction.type.toUpperCase(), canvas.width / 2, 130);
    
    // Main content area
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(40, 180, canvas.width - 80, 450);
    
    // Transaction details
    const details = [
      { label: 'Amount', value: `${transaction.amount} APT` },
      { label: 'From', value: `${transaction.from.slice(0, 20)}...${transaction.from.slice(-10)}` },
      { label: 'To', value: `${transaction.to.slice(0, 20)}...${transaction.to.slice(-10)}` },
      { label: 'Transaction Hash', value: `${transaction.transactionHash.slice(0, 30)}...${transaction.transactionHash.slice(-15)}` },
      { label: 'Date', value: transaction.timestamp.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) },
      { label: 'Status', value: transaction.status.toUpperCase() },
    ];
    
    if (transaction.note) {
      details.push({ label: 'Note', value: transaction.note });
    }
    
    let yPos = 220;
    ctx.textAlign = 'left';
    
    details.forEach((detail, index) => {
      // Alternating background for rows
      if (index % 2 === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.fillRect(60, yPos - 25, canvas.width - 120, 50);
      }
      
      // Label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '18px Arial, sans-serif';
      ctx.fillText(detail.label + ':', 80, yPos);
      
      // Value
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px Arial, sans-serif';
      const labelWidth = ctx.measureText(detail.label + ':').width;
      ctx.fillText(detail.value, 80 + labelWidth + 20, yPos);
      
      yPos += 55;
    });
    
    // Footer section
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(40, 660, canvas.width - 80, 100);
    
    // NFT-like serial number
    const serialNumber = `#${transaction.transactionHash.slice(-8).toUpperCase()}`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '16px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Invoice NFT ${serialNumber}`, canvas.width / 2, 690);
    
    // Timestamp
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '14px Arial, sans-serif';
    ctx.fillText(`Generated on ${new Date().toLocaleString()}`, canvas.width / 2, 715);
    
    // Aptos branding
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillText('APTOS WALLET', canvas.width / 2, 745);
    
    // Add decorative corner elements
    const cornerSize = 30;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 3;
    
    // Top-left corner
    ctx.beginPath();
    ctx.moveTo(40, 40 + cornerSize);
    ctx.lineTo(40, 40);
    ctx.lineTo(40 + cornerSize, 40);
    ctx.stroke();
    
    // Top-right corner
    ctx.beginPath();
    ctx.moveTo(canvas.width - 40 - cornerSize, 40);
    ctx.lineTo(canvas.width - 40, 40);
    ctx.lineTo(canvas.width - 40, 40 + cornerSize);
    ctx.stroke();
    
    // Bottom-left corner
    ctx.beginPath();
    ctx.moveTo(40, canvas.height - 40 - cornerSize);
    ctx.lineTo(40, canvas.height - 40);
    ctx.lineTo(40 + cornerSize, canvas.height - 40);
    ctx.stroke();
    
    // Bottom-right corner
    ctx.beginPath();
    ctx.moveTo(canvas.width - 40 - cornerSize, canvas.height - 40);
    ctx.lineTo(canvas.width - 40, canvas.height - 40);
    ctx.lineTo(canvas.width - 40, canvas.height - 40 - cornerSize);
    ctx.stroke();
    
    // Convert to data URL
    const dataURL = canvas.toDataURL('image/png');
    resolve(dataURL);
  });
};

export const downloadInvoice = async (transaction: InvoiceData) => {
  try {
    const imageDataURL = await generateInvoiceImage(transaction);
    
    // Create download link
    const link = document.createElement('a');
    link.download = `invoice-${transaction.transactionHash.slice(-8)}-${new Date().toISOString().split('T')[0]}.png`;
    link.href = imageDataURL;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error('Error generating invoice:', error);
    return false;
  }
};

// Preview invoice in modal
export const previewInvoice = async (transaction: InvoiceData): Promise<string> => {
  return await generateInvoiceImage(transaction);
};