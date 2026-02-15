# Bar & Stock Management System - Backend API

A production-ready backend for managing inventory, purchases, sales (POS), cash flow, and daily reports for a bar business.

## 🎯 Features

- **Inventory Management**: Track stock in smallest sellable units with full traceability
- **Purchase Management**: Buy in boxes, automatically convert to units
- **Point of Sale (POS)**: Process sales with automatic stock deduction
- **Cash Register**: Track cash flow with CASH and MOBILE_MONEY payments
- **Daily Reports**: Sales, profit, and stock valuation reports
- **Economic Accuracy**: Profit calculation based on actual unit costs

## 🛠 Tech Stack

- **Node.js** with Express
- **Sequelize ORM** with MySQL2
- **Database**: MySQL
- **Environment**: dotenv

## 📁 Project Structure

```
api/
├── src/
│   ├── config/
│   │   └── database.js          # Database configuration
│   ├── models/
│   │   ├── User.js              # User & Role models
│   │   ├── Product.js           # Product & Category models
│   │   ├── Stock.js             # Stock & StockMovement models
│   │   ├── Purchase.js          # Purchase, PurchaseItem, Supplier
│   │   ├── Sale.js              # Sale & SaleItem models
│   │   ├── Cash.js              # CashRegister, CashMovement, Expense
│   │   └── index.js             # Model associations
│   ├── services/
│   │   ├── StockService.js      # Stock movement logic
│   │   ├── PurchaseService.js   # Purchase processing
│   │   ├── SaleService.js       # POS logic
│   │   ├── CashService.js       # Cash register management
│   │   └── ReportService.js     # Reporting queries
│   ├── controllers/
│   │   ├── index.js             # Main controllers
│   │   └── CashController.js    # Cash operations
│   └── routes/
│       └── api.js               # API routes
├── app.js                       # Application entry point
├── verify_logic.js              # Test script
├── .env                         # Environment variables
└── package.json
```

## 🚀 Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Update `.env` with your database credentials:

```env
DB_NAME=bar_stock_db
DB_USER=yvart
DB_PASS=burundi123?
DB_HOST=127.0.0.1
PORT=3000
```

### 3. Create Database

```bash
mysql -u yvart -p'burundi123?' -e "CREATE DATABASE IF NOT EXISTS bar_stock_db;"
```

### 4. Start Server

```bash
npm start
```

Server will run on `http://localhost:3000`

## 📡 API Endpoints

### Products & Categories

- `GET /api/products` - List all products with stock
- `POST /api/products` - Create new product
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category

**Example Product Creation:**
```json
POST /api/products
{
  "CategoryId": "uuid",
  "name": "Heineken 33cl",
  "purchaseUnit": "BOX",
  "baseUnit": "UNIT",
  "unitsPerBox": 24,
  "purchasePrice": 24000,
  "sellingPrice": 1500
}
```

### Suppliers

- `GET /api/suppliers` - List suppliers
- `POST /api/suppliers` - Create supplier

### Purchases

- `POST /api/purchases` - Record purchase (creates stock IN movement)
- `GET /api/purchases` - List purchases

**Example Purchase:**
```json
POST /api/purchases
{
  "supplierId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "quantityBoxes": 5,
      "unitPriceBox": 24000
    }
  ],
  "notes": "Monthly stock"
}
```

### Sales (POS)

- `POST /api/sales` - Process sale (creates stock OUT movement)
- `GET /api/sales` - List sales

**Example Sale:**
```json
POST /api/sales
{
  "items": [
    {
      "productId": "uuid",
      "quantity": 3
    }
  ],
  "paymentMethod": "CASH",
  "userId": "uuid"
}
```

### Cash Management

- `GET /api/cash/balance` - Get current cash balance
- `GET /api/cash/movements?startDate=2026-01-30&endDate=2026-01-30` - Get cash movements
- `POST /api/cash/expenses` - Record expense

**Example Expense:**
```json
POST /api/cash/expenses
{
  "description": "Electricity bill",
  "amount": 50000
}
```

### Reports

- `GET /api/reports/daily?date=2026-01-30` - Daily sales & profit report
- `GET /api/reports/stock-value` - Current stock valuation

**Daily Report Response:**
```json
{
  "date": "2026-01-30T00:00:00.000Z",
  "totalRevenue": 45000,
  "totalProfit": 15000,
  "transactionCount": 12,
  "itemsSold": 30
}
```

## 🧠 Business Logic

### Stock Management

- Stock is **NEVER** updated directly
- All changes go through `StockMovement`
- Stock cannot go negative
- All movements are logged with reason and reference

### Unit Conversion

Products are purchased in **boxes** but sold in **units**:
- `purchasePrice` = price of 1 box
- `sellingPrice` = price of 1 unit
- `unitsPerBox` = conversion factor
- Stock stored as total units

**Example:**
- Buy 1 box of beer (24 bottles) for 24,000
- Stock increases by 24 units
- Unit cost = 24,000 / 24 = 1,000
- Sell 1 bottle for 1,500
- Profit = 1,500 - 1,000 = 500

### Profit Calculation

```
Unit Cost = purchasePrice / unitsPerBox
Profit = (sellingPrice - unitCost) × quantity
```

Cost is **snapshotted** at sale time in `SaleItem.unitCostSnapshot`

## ✅ Testing

Run the verification script:

```bash
node verify_logic.js
```

This will:
1. Create a test product (Beer)
2. Purchase 1 box (24 units)
3. Sell 2 units
4. Verify stock = 22 units
5. Confirm all logic works

## 🔒 Security Notes

- Add authentication middleware before production
- Implement role-based access control using `User` and `Role` models
- Validate all inputs
- Use HTTPS in production
- Secure `.env` file (never commit to git)

## 📊 Database Schema

Key relationships:
- Product → Stock (1:1)
- Product → Category (N:1)
- Stock → StockMovement (1:N)
- Purchase → PurchaseItem (1:N)
- Sale → SaleItem (1:N)
- Product → PurchaseItem (1:N)
- Product → SaleItem (1:N)

## 🎓 Next Steps

1. Add authentication (JWT, sessions)
2. Implement user management endpoints
3. Add pagination to list endpoints
4. Create database migrations
5. Add input validation middleware
6. Implement rate limiting
7. Add logging (Winston, Morgan)
8. Create automated tests
9. Add API documentation (Swagger)
10. Deploy to production

## 📝 License

MIT
