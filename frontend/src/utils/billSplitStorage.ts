// Bill splitting utilities for managing split bill requests and payments

import { createPaymentRequest, PaymentRequest } from './paymentRequestStorage';

export interface BillSplit {
  id: string;
  originalTransactionHash: string;
  createdBy: string;
  totalAmount: string;
  description: string;
  participants: BillParticipant[];
  timestamp: Date;
  status: 'pending' | 'completed' | 'partial';
}

export interface BillParticipant {
  address: string;
  amount: string;
  status: 'pending' | 'paid';
  paymentRequestId?: string;
  paidAt?: Date;
  transactionHash?: string;
}

// Generate unique bill split ID
const generateBillSplitId = (): string => {
  return 'split_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Create a bill split and send payment requests to all participants
export const createBillSplit = (
  originalTxHash: string,
  createdBy: string,
  totalAmount: string,
  description: string,
  participants: { address: string; amount: string }[]
): BillSplit => {
  const billSplit: BillSplit = {
    id: generateBillSplitId(),
    originalTransactionHash: originalTxHash,
    createdBy,
    totalAmount,
    description: `Bill Split: ${description}`,
    participants: participants.map(p => ({
      address: p.address,
      amount: p.amount,
      status: 'pending'
    })),
    timestamp: new Date(),
    status: 'pending'
  };

  // Create payment requests for each participant
  billSplit.participants = billSplit.participants.map(participant => {
    try {
      const paymentRequest = createPaymentRequest(
        createdBy,
        participant.address,
        participant.amount,
        `Bill Split: ${description} - Your share: ${participant.amount} APT`
      );
      
      return {
        ...participant,
        paymentRequestId: paymentRequest.id
      };
    } catch (error) {
      console.error(`Failed to create payment request for ${participant.address}:`, error);
      return participant;
    }
  });

  // Store the bill split
  const billSplitsKey = `bill_splits_${createdBy}`;
  const existingSplits = getStoredBillSplits(billSplitsKey);
  existingSplits.push(billSplit);
  localStorage.setItem(billSplitsKey, JSON.stringify(existingSplits));

  // Also store a reference for each participant
  billSplit.participants.forEach(participant => {
    const participantKey = `bill_splits_participant_${participant.address}`;
    const participantSplits = getStoredBillSplits(participantKey);
    participantSplits.push(billSplit);
    localStorage.setItem(participantKey, JSON.stringify(participantSplits));
  });

  console.log(`💰 Bill split created:`);
  console.log(`   ID: ${billSplit.id}`);
  console.log(`   Total: ${totalAmount} APT`);
  console.log(`   Participants: ${participants.length}`);
  console.log(`   Description: ${description}`);

  return billSplit;
};

// Get stored bill splits
const getStoredBillSplits = (key: string): BillSplit[] => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    // Convert timestamp strings back to Date objects
    return parsed.map((split: any) => ({
      ...split,
      timestamp: new Date(split.timestamp),
      participants: split.participants.map((p: any) => ({
        ...p,
        paidAt: p.paidAt ? new Date(p.paidAt) : undefined
      }))
    }));
  } catch (error) {
    console.error('Error loading bill splits:', error);
    return [];
  }
};

// Get bill splits created by user
export const getBillSplitsCreatedBy = (address: string): BillSplit[] => {
  const key = `bill_splits_${address}`;
  return getStoredBillSplits(key);
};

// Get bill splits user is participating in
export const getBillSplitsParticipatingIn = (address: string): BillSplit[] => {
  const key = `bill_splits_participant_${address}`;
  return getStoredBillSplits(key);
};

// Mark participant as paid when they fulfill the payment request
export const markParticipantAsPaid = (
  billSplitId: string,
  participantAddress: string,
  transactionHash: string
): boolean => {
  try {
    // Update in creator's bill splits
    const allCreatedSplits = getAllBillSplits();
    let updated = false;

    Object.keys(allCreatedSplits).forEach(creatorAddress => {
      const splits = allCreatedSplits[creatorAddress];
      const billSplit = splits.find(s => s.id === billSplitId);
      
      if (billSplit) {
        const participant = billSplit.participants.find(p => p.address === participantAddress);
        if (participant && participant.status === 'pending') {
          participant.status = 'paid';
          participant.paidAt = new Date();
          participant.transactionHash = transactionHash;
          updated = true;

          // Update bill split status
          const pendingCount = billSplit.participants.filter(p => p.status === 'pending').length;
          if (pendingCount === 0) {
            billSplit.status = 'completed';
          } else {
            billSplit.status = 'partial';
          }

          // Save updated splits
          const key = `bill_splits_${creatorAddress}`;
          localStorage.setItem(key, JSON.stringify(splits));

          // Update participant's copy
          const participantKey = `bill_splits_participant_${participantAddress}`;
          const participantSplits = getStoredBillSplits(participantKey);
          const participantSplit = participantSplits.find(s => s.id === billSplitId);
          if (participantSplit) {
            const participantRecord = participantSplit.participants.find(p => p.address === participantAddress);
            if (participantRecord) {
              participantRecord.status = 'paid';
              participantRecord.paidAt = new Date();
              participantRecord.transactionHash = transactionHash;
            }
            participantSplit.status = billSplit.status;
            localStorage.setItem(participantKey, JSON.stringify(participantSplits));
          }

          console.log(`✅ Participant ${participantAddress} marked as paid for bill split ${billSplitId}`);
        }
      }
    });

    return updated;
  } catch (error) {
    console.error('Error marking participant as paid:', error);
    return false;
  }
};

// Get all bill splits (helper function)
const getAllBillSplits = (): Record<string, BillSplit[]> => {
  const result: Record<string, BillSplit[]> = {};
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('bill_splits_') && !key.includes('participant_')) {
      const address = key.replace('bill_splits_', '');
      result[address] = getStoredBillSplits(key);
    }
  }
  
  return result;
};

// Calculate split amounts evenly
export const calculateEvenSplit = (totalAmount: string, participantCount: number): string => {
  const total = parseFloat(totalAmount);
  const perPerson = total / participantCount;
  return perPerson.toFixed(6);
};

// Calculate custom split amounts
export const calculateCustomSplit = (
  totalAmount: string,
  customAmounts: Record<string, string>
): { valid: boolean; remaining: string; participants: { address: string; amount: string }[] } => {
  const total = parseFloat(totalAmount);
  let allocated = 0;
  const participants: { address: string; amount: string }[] = [];

  Object.entries(customAmounts).forEach(([address, amount]) => {
    const amountNum = parseFloat(amount || '0');
    allocated += amountNum;
    participants.push({ address, amount: amountNum.toFixed(6) });
  });

  const remaining = total - allocated;
  const valid = Math.abs(remaining) < 0.000001; // Allow for small floating point errors

  return {
    valid,
    remaining: remaining.toFixed(6),
    participants
  };
};

// Cleanup old completed bill splits
export const cleanupOldBillSplits = (address: string, daysOld: number = 30): void => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  // Clean created splits
  const createdKey = `bill_splits_${address}`;
  const createdSplits = getStoredBillSplits(createdKey);
  const filteredCreated = createdSplits.filter(split => 
    split.status === 'pending' || split.status === 'partial' || new Date(split.timestamp) > cutoffDate
  );
  localStorage.setItem(createdKey, JSON.stringify(filteredCreated));

  // Clean participant splits
  const participantKey = `bill_splits_participant_${address}`;
  const participantSplits = getStoredBillSplits(participantKey);
  const filteredParticipant = participantSplits.filter(split => 
    split.status === 'pending' || split.status === 'partial' || new Date(split.timestamp) > cutoffDate
  );
  localStorage.setItem(participantKey, JSON.stringify(filteredParticipant));
};

// Get bill split statistics for a user
export const getBillSplitStats = (address: string) => {
  const created = getBillSplitsCreatedBy(address);
  const participating = getBillSplitsParticipatingIn(address);

  const createdStats = {
    total: created.length,
    completed: created.filter(s => s.status === 'completed').length,
    pending: created.filter(s => s.status === 'pending').length,
    partial: created.filter(s => s.status === 'partial').length
  };

  const participatingStats = {
    total: participating.length,
    paid: participating.filter(s => {
      const myParticipation = s.participants.find(p => p.address === address);
      return myParticipation?.status === 'paid';
    }).length,
    pending: participating.filter(s => {
      const myParticipation = s.participants.find(p => p.address === address);
      return myParticipation?.status === 'pending';
    }).length
  };

  return {
    created: createdStats,
    participating: participatingStats
  };
};