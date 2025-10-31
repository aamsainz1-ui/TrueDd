import type { Transaction, TransferHistory } from '../types';

export const mockTransactions: Transaction[] = [
  {
    id: 'TXN001',
    type: 'income',
    category: 'รับโอนเงิน',
    amount: 1500.00,
    sender: 'สมชาย ใจดี',
    datetime: '2025-10-31T06:30:00',
    status: 'completed',
    description: 'ค่าอาหารกลางวัน'
  },
  {
    id: 'TXN002',
    type: 'expense',
    category: 'ช้อปปิ้งออนไลน์',
    amount: 850.00,
    recipient: 'Shopee Thailand',
    datetime: '2025-10-30T18:45:00',
    status: 'completed',
    description: 'ซื้อเสื้อผ้า'
  },
  {
    id: 'TXN003',
    type: 'income',
    category: 'เติมเงิน',
    amount: 2000.00,
    datetime: '2025-10-30T14:20:00',
    status: 'completed',
    description: 'เติมเงินผ่าน 7-Eleven'
  },
  {
    id: 'TXN004',
    type: 'expense',
    category: 'โอนเงิน',
    amount: 500.00,
    recipient: 'วิภา สุขสันต์',
    datetime: '2025-10-30T10:15:00',
    status: 'completed',
    description: 'ค่าของฝาก'
  },
  {
    id: 'TXN005',
    type: 'expense',
    category: 'ชำระบิล',
    amount: 1200.00,
    recipient: 'AIS Mobile',
    datetime: '2025-10-29T16:30:00',
    status: 'completed',
    description: 'ค่าโทรศัพท์ประจำเดือน'
  },
  {
    id: 'TXN006',
    type: 'income',
    category: 'รับโอนเงิน',
    amount: 3000.00,
    sender: 'บริษัท ABC จำกัด',
    datetime: '2025-10-29T09:00:00',
    status: 'completed',
    description: 'ค่าจ้างงานพิเศษ'
  },
  {
    id: 'TXN007',
    type: 'expense',
    category: 'ช้อปปิ้งออนไลน์',
    amount: 450.00,
    recipient: 'Lazada Thailand',
    datetime: '2025-10-28T20:10:00',
    status: 'completed',
    description: 'ซื้ออุปกรณ์ไอที'
  },
  {
    id: 'TXN008',
    type: 'income',
    category: 'เติมเงิน',
    amount: 1000.00,
    datetime: '2025-10-28T12:00:00',
    status: 'completed',
    description: 'เติมเงินผ่านแอป'
  },
];

export const mockTransferHistory: TransferHistory[] = [
  {
    id: 'TRF001',
    fromName: 'สมชาย ใจดี',
    amount: 1500.00,
    datetime: '2025-10-31T06:30:00',
    status: 'completed',
    reference: 'REF20251031063000'
  },
  {
    id: 'TRF002',
    fromName: 'บริษัท ABC จำกัด',
    amount: 3000.00,
    datetime: '2025-10-29T09:00:00',
    status: 'completed',
    reference: 'REF20251029090000'
  },
  {
    id: 'TRF003',
    fromName: 'นางสาว สุดา รักดี',
    amount: 800.00,
    datetime: '2025-10-28T15:30:00',
    status: 'completed',
    reference: 'REF20251028153000'
  },
  {
    id: 'TRF004',
    fromName: 'นาย ประยุทธ์ มั่นคง',
    amount: 2500.00,
    datetime: '2025-10-27T11:20:00',
    status: 'completed',
    reference: 'REF20251027112000'
  },
  {
    id: 'TRF005',
    fromName: 'ร้านค้า XYZ',
    amount: 1200.00,
    datetime: '2025-10-26T14:45:00',
    status: 'completed',
    reference: 'REF20251026144500'
  },
];
