# PAIDEDIT

## Current State
New project with no existing code.

## Requested Changes (Diff)

### Add
- Landing page with PAIDEDIT brand, hero section, features, and pricing (100 Rs per short video)
- Video order submission form: upload video file, describe editing requirements, contact info
- User orders dashboard: list of submitted orders with status (Pending, In Progress, Completed)
- Admin panel: view all orders, update order status, view order details
- Payment summary showing 100 Rs per video on order form
- Role-based access: regular users vs admin

### Modify
- N/A

### Remove
- N/A

## Implementation Plan
1. Backend:
   - Order data model: id, userId, videoFileId, description, contactName, contactEmail, contactPhone, status, createdAt, updatedAt
   - submitOrder(description, contactName, contactEmail, contactPhone, videoFileId) -> OrderId
   - getMyOrders() -> [Order]
   - getAllOrders() -> [Order] (admin only)
   - updateOrderStatus(orderId, status) -> Result (admin only)
   - getOrder(orderId) -> ?Order

2. Frontend:
   - Landing page: hero, features section, pricing card (100 Rs), CTA to submit order
   - Order form page: video upload via blob-storage, editing description, contact details, payment summary
   - My Orders page: table/list of user's orders with status badges
   - Admin panel page: all orders table, status update controls
   - Navigation with login/logout
