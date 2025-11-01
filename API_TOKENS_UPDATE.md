# API Token ใหม่ - True Wallet Dashboard

## อัปเดตเมื่อ: 1 พฤศจิกายน 2568 เวลา 09:14

### Token ใหม่ที่ทดสอบแล้ว:

✅ **Balance API Token:**
```
5627a2c2088405f97c0608e09f827e2d
```

✅ **Transaction API Token:**
```
fa52cb89ccde1818855aad656cc20f8b
```

✅ **Search Transfer API Token:**
```
cd58e01134106a58919ff1e89184cb4c
```

## วิธีการใช้งาน:

### 1. เข้าสู่หน้าตั้งค่า
- เปิดแดชบอร์ด True Wallet Dashboard
- ไปที่แท็บ "การตั้งค่า"

### 2. รีเซ็ตเป็นค่าเริ่มต้น
- กดปุ่ม "รีเซ็ตเป็นค่าเริ่มต้น"
- ระบบจะโหลด token ใหม่ทั้งหมดอัตโนมัติ

### 3. ทดสอบการเชื่อมต่อ
- **Balance API:** กดปุ่ม "ทดสอบ" เพื่อตรวจสอบยอดเงิน
- **Transaction API:** กดปุ่ม "ทดสอบ" เพื่อตรวจสอบประวัติธุรกรรม
- **Search Transfer API:** กดปุ่ม "ทดสอบ" เพื่อตรวจสอบการค้นหาโอนเงิน

### 4. บันทึกการตั้งค่า
- กดปุ่ม "บันทึกการตั้งค่าทั้งหมด"
- ข้อมูลจะถูกบันทึกใน localStorage และแจ้งเตือน component อื่นๆ

## ข้อมูลเพิ่มเติม:

### Supabase Configuration:
- **URL:** `https://dltmbajfuvbnipnfvcrl.supabase.co`
- **Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsdG1iYWpmdXZibmlwbmZ2Y3JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NDI1MjUsImV4cCI6MjA3NzUxODUyNX0.vgmFY5TRjzrLHCKLPf2cTgrLFKcNbItzC6_StDu9xPI`

### True Wallet API Endpoints:
- **Balance:** `https://apis.truemoneyservices.com/account/v1/balance`
- **Transactions:** `https://apis.truemoneyservices.com/account/v1/my-last-receive`
- **Transfer Search:** `https://apis.truemoneyservices.com/account/v1/my-receive`

### การแก้ไขปัญหา:
- หากเกิด CORS Error ให้ใช้ Extension หรือ Proxy
- หาก API ไม่ตอบสนอง ให้ตรวจสอบ token และการเชื่อมต่ออินเทอร์เน็ต
- รีเฟรชหน้าเว็บแล้วลองใหม่หากมีปัญหา

---
**พัฒนาโดย:** MiniMax Agent  
**เวอร์ชัน:** 2.0