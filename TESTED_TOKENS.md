# True Wallet API Tokens - ทดสอบสำเร็จ

## ✅ Token ที่ทำงานได้

### Balance API
- **Token**: `5627a2c2088405f97c0608e09f827e2d`
- **URL**: `https://apis.truemoneyservices.com/account/v1/balance`
- **Method**: GET
- **Response**:
```json
{
  "status": "ok",
  "data": {
    "balance": "7018725",
    "mobile_no": "0962617914",
    "updated_at": "2025-11-01 05:12:24"
  }
}
```

### Transfer Search API
- **Token**: `fa52cb89ccde1818855aad656cc20f8b`
- **URL**: `https://apis.truemoneyservices.com/account/v1/my-receive`
- **Method**: GET
- **Response**:
```json
{
  "status": "ok",
  "data": {
    "event_type": "P2P",
    "amount": 4600,
    "sender_mobile": "0967484089",
    "receiver_mobile": "0962617914",
    "received_time": "2025-11-01 05:14:44",
    "transaction_id": "50047371025368",
    "message": ""
  }
}
```

## ❌ Transaction API
- **URL**: `https://apis.truemoneyservices.com/account/v1/my-last-receive`
- **Status**: ไม่ทำงาน (Not Found) กับ token ใดๆ
- **ต้องการ**: ขอ token อื่นหรือ URL ที่ถูกต้อง

## ข้อสังเกต
- API ต่างกันต้องใช้ token ต่างกัน
- ทุก API ใช้ GET method
- ทุก API ใช้ Authorization: Bearer token