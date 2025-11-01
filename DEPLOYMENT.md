# คู่มือการ Deploy - True Wallet Dashboard

## ข้อมูลโปรเจกต์

- **Repository**: GitHub (private)
- **Hosting**: MiniMax Space (https://space.minimax.io)
- **Backend**: Supabase (Project ID: dltmbajfuvbnipnfvcrl)
- **Stack**: React + TypeScript + Vite + Tailwind CSS

## Prerequisites

### 1. ติดตั้ง Tools
```bash
# Node.js (v18+)
node --version

# pnpm
npm install -g pnpm

# Supabase CLI
brew install supabase/tap/supabase
# หรือ
npm install -g supabase
```

### 2. Environment Variables
ตรวจสอบให้แน่ใจว่ามี environment variables เหล่านี้:

**Supabase:**
- `SUPABASE_URL`: https://dltmbajfuvbnipnfvcrl.supabase.co
- `SUPABASE_ANON_KEY`: [ดูใน Supabase Dashboard > Settings > API]
- `SUPABASE_SERVICE_ROLE_KEY`: [ดูใน Supabase Dashboard > Settings > API]
- `SUPABASE_ACCESS_TOKEN`: [ดูใน Supabase Account Settings > Access Tokens]
- `SUPABASE_PROJECT_ID`: dltmbajfuvbnipnfvcrl

**GitHub:**
- `GITHUB_TOKEN`: [สร้างใน GitHub Settings > Developer Settings > Personal Access Tokens]

## การ Deploy Frontend

### 1. Build โปรเจกต์
```bash
cd /workspace/true-wallet-dashboard

# ติดตั้ง dependencies
pnpm install

# Build production
pnpm run build

# ตรวจสอบไฟล์ที่ build แล้ว
ls -lh dist/
```

### 2. Deploy ไปยัง MiniMax Space
```bash
# Deploy แบบอัตโนมัติ (ผ่าน MiniMax Agent)
# ระบบจะ deploy ไฟล์จากโฟลเดอร์ dist/ โดยอัตโนมัติ

# หลัง deploy จะได้ URL เช่น:
# https://xxxxxxxxxxxxx.space.minimax.io
```

### 3. ตรวจสอบการ Deploy
```bash
# ทดสอบ API endpoint
curl "https://dltmbajfuvbnipnfvcrl.supabase.co/functions/v1/daily-income-summary" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# เปิดเว็บไซต์ในเบราว์เซอร์
# ตรวจสอบว่าข้อมูลแสดงผลถูกต้อง
```

## การ Deploy Edge Functions

### 1. เข้าสู่ระบบ Supabase
```bash
# Login ด้วย Access Token
supabase login

# หรือตั้ง environment variable
export SUPABASE_ACCESS_TOKEN="sbp_oauth_eaa01f4e7433141ff425ddcc5bf08a7af6b006ab"

# Link กับโปรเจกต์
supabase link --project-ref dltmbajfuvbnipnfvcrl
```

### 2. Deploy Functions
```bash
cd /workspace/supabase

# Deploy ทั้งหมด
supabase functions deploy

# หรือ Deploy ทีละตัว
supabase functions deploy daily-income-summary
supabase functions deploy get-transaction-history
```

### 3. ตรวจสอบ Function Logs
```bash
# ดู logs แบบ real-time
supabase functions logs daily-income-summary --follow

# ดู logs ล่าสุด 100 บรรทัด
supabase functions logs get-transaction-history --limit 100
```

### 4. ทดสอบ Functions
```bash
# ทดสอบ daily-income-summary
curl -X POST \
  "https://dltmbajfuvbnipnfvcrl.supabase.co/functions/v1/daily-income-summary" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{}'

# ทดสอบ get-transaction-history
curl -X POST \
  "https://dltmbajfuvbnipnfvcrl.supabase.co/functions/v1/get-transaction-history" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"limit": 10, "offset": 0}'
```

## การ Push Code ไปยัง GitHub

### 1. ตรวจสอบ Repository
```bash
cd /workspace/true-wallet-dashboard

# ตรวจสอบ remote
git remote -v

# ควรแสดง:
# origin  https://github.com/[username]/true-wallet-dashboard.git
```

### 2. Commit และ Push
```bash
# เพิ่มไฟล์ที่เปลี่ยนแปลง
git add .

# Commit พร้อมข้อความที่ชัดเจน
git commit -m "แก้ไข: [อธิบายการเปลี่ยนแปลง]"

# ตัวอย่าง:
# git commit -m "แก้ไข: เชื่อมต่อไปที่ Supabase Project ใหม่"
# git commit -m "แก้ไข: BalanceTrendChart ให้ใช้ dynamic dates"
# git commit -m "แก้ไข: Timezone issue ใน Edge Functions"

# Push ไปยัง main branch
git push origin main
```

### 3. ตรวจสอบการ Push
```bash
# ตรวจสอบ log ล่าสุด
git log --oneline -5

# ตรวจสอบใน GitHub
# เปิด https://github.com/[username]/true-wallet-dashboard
```

## Deployment Checklist

### ก่อน Deploy
- [ ] ตรวจสอบว่า code ทำงานถูกต้องใน local environment
- [ ] ตรวจสอบว่าไม่มี TypeScript errors (`pnpm run build`)
- [ ] ตรวจสอบว่า Supabase URL และ API keys ถูกต้อง
- [ ] ตรวจสอบว่า Edge Functions ทำงานปกติ
- [ ] Commit และ Push code ไปยัง GitHub

### หลัง Deploy
- [ ] ตรวจสอบว่า Frontend แสดงผลถูกต้อง
- [ ] ทดสอบการดึงข้อมูลจาก API
- [ ] ตรวจสอบ Console logs ว่าไม่มี errors
- [ ] ทดสอบ features หลัก:
  - ✓ แสดงยอดเงิน
  - ✓ แสดง Transaction History
  - ✓ กราฟแสดงผลถูกต้อง
  - ✓ Auto-refresh ทำงาน
  - ✓ ส่งออก Excel
  - ✓ Settings (เปลี่ยน API Tokens)
- [ ] บันทึก URL และ Version ใน deployment_history.md

## การแก้ไขปัญหาที่พบบ่อย

### 1. Frontend แสดงข้อมูลไม่ถูกต้อง
```bash
# ตรวจสอบว่า Supabase URL ถูกต้องหรือไม่
grep -r "SUPABASE_URL" src/

# ควรเป็น: https://dltmbajfuvbnipnfvcrl.supabase.co
```

### 2. Edge Function ไม่ทำงาน
```bash
# ดู logs
supabase functions logs [function-name] --follow

# ตรวจสอบว่า deploy สำเร็จหรือไม่
supabase functions list

# Re-deploy
supabase functions deploy [function-name]
```

### 3. Git Push Failed
```bash
# ตรวจสอบ authentication
git config --list | grep user

# ตั้งค่า GitHub token
git remote set-url origin https://[TOKEN]@github.com/[username]/true-wallet-dashboard.git

# หรือใช้ SSH
git remote set-url origin git@github.com:[username]/true-wallet-dashboard.git
```

### 4. Build Failed
```bash
# ลบ node_modules และ reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# ลบ cache และ build ใหม่
rm -rf dist/
pnpm run build
```

### 5. Timezone ผิดพลาด
```bash
# ตรวจสอบใน Edge Function ว่าใช้ Bangkok timezone
# ใน daily-income-summary/index.ts:
const bangkokTime = new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
```

## การติดตาม Deployment History

บันทึกทุกครั้งที่ deploy ใน `deployment_history.md`:

```markdown
## Version X - [Title] (YYYY-MM-DD HH:MM:SS)
**URL**: https://xxxxxxxxxxxxx.space.minimax.io
**Changes**:
- ✅ [การเปลี่ยนแปลงที่สำคัญ]
- Push code commit [hash] ไป GitHub สำเร็จ
- **Status**: [ผลลัพธ์]
```

## ข้อมูลติดต่อ

- **Supabase Dashboard**: https://supabase.com/dashboard/project/dltmbajfuvbnipnfvcrl
- **GitHub Repository**: https://github.com/[username]/true-wallet-dashboard
- **Production URL**: https://as47qg96pigb.space.minimax.io (Version 10)

## เวอร์ชันปัจจุบัน

- **Frontend**: Version 10 (2025-11-02)
- **Edge Functions**: 
  - daily-income-summary: Version 10
  - get-transaction-history: Version 8
- **GitHub**: Commits 2f7a420, d2f25f6, 3dcb565
