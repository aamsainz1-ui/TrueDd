import type { Transaction } from '../types';

// Supabase configuration
const SUPABASE_URL = 'https://kmloseczqatswwczqajs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttbG9zZWN6cWF0c3d3Y3pxYWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NjQyMzAsImV4cCI6MjA3NzM0MDIzMH0.tc3oZrRBDhbQXfwerLPjTbsNMDwSP0gHhhmd96bPd9I';

export class ClearHistoryService {
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor() {
    this.supabaseUrl = SUPABASE_URL;
    this.supabaseKey = SUPABASE_ANON_KEY;
  }

  /**
   * ลบรายการประวัติที่เกิดจากการค้นหาโอนเงิน
   * @param searchTerm - ข้อความที่ใช้ค้นหา (เช่น เบอร์โทรศัพท์)
   * @returns Promise<boolean> - ผลลัพธ์การลบ
   */
  async clearTransferSearchHistory(searchTerm?: string): Promise<{success: boolean, deletedCount: number, message: string}> {
    try {
      const requestBody: any = {
        sourceType: 'transfer_search'
      };
      
      // ถ้ามี searchTerm ระบุ ให้ลบเฉพาะรายการที่มี description นั้น
      if (searchTerm) {
        requestBody.searchTerm = searchTerm;
      }

      console.log('Clearing transfer search history with data:', requestBody);

      const response = await fetch(`${this.supabaseUrl}/functions/v1/clear-transfer-search-history`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Clear history response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Clear history API error:', response.status, response.statusText, errorText);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Clear history result:', result);
      
      if (result.error) {
        console.error('Clear history business error:', result.error);
        throw new Error(result.error.message);
      }

      return {
        success: true,
        deletedCount: result.deletedCount || 0,
        message: result.message || 'ลบรายการสำเร็จแล้ว'
      };
    } catch (error) {
      console.error('Failed to clear transfer search history:', error);
      return {
        success: false,
        deletedCount: 0,
        message: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบรายการ'
      };
    }
  }

  /**
   * ลบรายการประวัติทั้งหมดที่เกิดจากการค้นหาโอนเงิน
   * @returns Promise<boolean> - ผลลัพธ์การลบ
   */
  async clearAllTransferSearchHistory(): Promise<{success: boolean, deletedCount: number, message: string}> {
    return this.clearTransferSearchHistory();
  }

  /**
   * ลบรายการประวัติของเบอร์โทรศัพท์เฉพาะ
   * @param phoneNumber - เบอร์โทรศัพท์ที่ต้องการลบ
   * @returns Promise<boolean> - ผลลัพธ์การลบ
   */
  async clearHistoryForPhoneNumber(phoneNumber: string): Promise<{success: boolean, deletedCount: number, message: string}> {
    return this.clearTransferSearchHistory(phoneNumber);
  }

  /**
   * ดูตัวอย่างรายการที่จะถูกลบ
   * @param searchTerm - ข้อความค้นหา (เช่น เบอร์โทรศัพท์)
   * @returns Promise<Transaction[]> - รายการที่จะถูกลบ
   */
  async previewDeleteHistory(searchTerm?: string): Promise<Transaction[]> {
    try {
      const params = new URLSearchParams();
      
      if (searchTerm) {
        params.append('searchTerm', searchTerm);
        params.append('sourceType', 'transfer_search');
      } else {
        params.append('sourceType', 'transfer_search');
      }

      const url = `${this.supabaseUrl}/functions/v1/preview-delete-history?${params.toString()}`;
      
      console.log('Previewing delete history with URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Preview delete history result:', result);
      
      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data || [];
    } catch (error) {
      console.error('Failed to preview delete history:', error);
      throw error;
    }
  }
}

export const clearHistoryService = new ClearHistoryService();