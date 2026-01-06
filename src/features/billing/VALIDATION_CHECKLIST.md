# Billing System Validation Checklist

## Pre-Production Checklist

### Environment Configuration
- [ ] `RAZORPAY_KEY_ID` set in production
- [ ] `RAZORPAY_KEY_SECRET` set in production
- [ ] `RAZORPAY_WEBHOOK_SECRET` set in production
- [ ] `CRON_SECRET` set in production
- [ ] `BILLING_ACCOUNTS_ID` collection ID set
- [ ] `BILLING_AUDIT_LOGS_ID` collection ID set
- [ ] `EMAIL_API_KEY` set for reminder emails
- [ ] `NEXT_PUBLIC_APP_URL` set to production URL

### Razorpay Dashboard Configuration
- [ ] Webhook URL configured: `https://app.fairlx.com/api/webhooks/razorpay`
- [ ] Webhook events enabled:
  - [ ] `payment.captured`
  - [ ] `payment.failed`
  - [ ] `payment.authorized`
  - [ ] `refund.processed`
  - [ ] `refund.failed`
- [ ] Test mode verified before production

### Cron Jobs (Droplet)
- [ ] Cron script deployed to Droplet
- [ ] `process-cycle` scheduled for 1st of month
- [ ] `enforce-grace` scheduled daily at 1 AM UTC
- [ ] `send-reminders` scheduled daily at 9 AM UTC
- [ ] Log directory created: `/var/log/fairlx-billing/`

---

## Functional Tests

### Payment Flow
- [ ] **Create billing account** - Organization setup creates billing record
- [ ] **Add payment method** - Razorpay Checkout opens and captures card
- [ ] **Subscription created** - Razorpay subscription/mandate created
- [ ] **Webhook received** - payment.captured event processed
- [ ] **Account activated** - Status set to ACTIVE

### Billing Cycle
- [ ] **Usage aggregated** - Traffic, storage, compute summed correctly
- [ ] **Invoice generated** - Invoice document created with breakdown
- [ ] **Payment attempted** - Auto-debit via subscription
- [ ] **Success flow** - Invoice marked PAID, account ACTIVE
- [ ] **Failure flow** - Invoice marked FAILED, account DUE

### Grace Period
- [ ] **14-day countdown** - Grace period end calculated correctly
- [ ] **Warning banner** - Displays on all pages during DUE status
- [ ] **Day 1 email** - Initial payment failure notification sent
- [ ] **Day 7 email** - Reminder email sent
- [ ] **Day 13 email** - Final warning email sent
- [ ] **Day 14+ suspension** - Account status set to SUSPENDED

### Suspension
- [ ] **Writes blocked** - Cannot create projects, tasks, etc.
- [ ] **Reads allowed** - Can view existing data
- [ ] **Billing page accessible** - Can access billing settings
- [ ] **Other pages blocked** - Redirected to billing
- [ ] **Suspension UI** - Full-screen overlay displayed

### Recovery
- [ ] **Payment from suspended** - Can complete payment
- [ ] **Instant restoration** - Access restored immediately
- [ ] **Status updated** - Account back to ACTIVE
- [ ] **Audit logged** - Recovery event recorded

---

## Edge Cases

### Idempotency
- [ ] Duplicate webhooks ignored
- [ ] Multiple payment attempts handled
- [ ] No double charges

### Error Handling
- [ ] Invalid webhook signatures rejected
- [ ] Missing billing account handled gracefully
- [ ] Database errors logged and don't crash

### Data Integrity
- [ ] Invoice created BEFORE charge attempt
- [ ] Usage snapshots immutable after billing
- [ ] Audit trail complete for all events

---

## Security Checks

- [ ] Webhook signatures verified
- [ ] CRON_SECRET required for cron endpoints
- [ ] No sensitive data in client-side code
- [ ] Payment method details not stored (only last4)
- [ ] Admin client used for billing operations

---

## Performance

- [ ] Webhook responds within 5 seconds
- [ ] Cron jobs complete within 60 seconds
- [ ] Billing status cached appropriately
- [ ] No N+1 queries in aggregation

---

## Sign-Off

| Item | Date | Verified By |
|------|------|-------------|
| Dev Testing | | |
| Staging Testing | | |
| Production Deployment | | |
| First Billing Cycle | | |
