import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Wallet } from 'lucide-react';

interface AddressQRCodeProps {
  publicKey: string;
}

export const AddressQRCode: React.FC<AddressQRCodeProps> = ({ publicKey }) => (
  <div className="bg-white p-6 rounded-lg border border-gray-700">
    <div className="w-48 h-48 flex items-center justify-center relative mx-auto rounded">
      <QRCodeSVG value={publicKey} size={176} level="H" includeMargin={true} />
      {/* Center logo overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="bg-orange-500 p-2 rounded">
          <Wallet className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
    <div className="mt-4 text-center text-xs text-muted-foreground">Scan to get public key</div>
  </div>
);