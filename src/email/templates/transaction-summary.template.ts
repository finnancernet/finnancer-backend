import { Transaction } from '../../transaction/schemas/transaction.schema';
import { Account } from '../../account/schemas/account.schema';
import { BudgetWithStatus } from '../../budget/budget.service';

interface CategoryGroup {
  category: string;
  transactions: Transaction[];
  total: number;
}

export class TransactionSummaryTemplate {
  static generate(
    account: Account,
    transactions: Transaction[],
    date: Date,
    budgets: BudgetWithStatus[] = [],
  ): string {
    const groupedByCategory = this.groupByCategory(transactions);
    const totalSpent = this.calculateTotal(transactions);
    const dateString = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Transaction Summary</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 3px solid #4CAF50;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    h1 {
      color: #2c3e50;
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .account-info {
      color: #7f8c8d;
      font-size: 14px;
      margin-top: 10px;
    }
    .summary {
      background-color: #f8f9fa;
      border-left: 4px solid #4CAF50;
      padding: 15px 20px;
      margin-bottom: 30px;
      border-radius: 4px;
    }
    .summary-item {
      display: flex;
      justify-content: space-between;
      margin: 8px 0;
      font-size: 16px;
    }
    .summary-label {
      font-weight: 600;
      color: #555;
    }
    .summary-value {
      color: #2c3e50;
      font-weight: 700;
    }
    .category-section {
      margin-bottom: 30px;
    }
    .category-header {
      background-color: #ecf0f1;
      padding: 12px 15px;
      border-radius: 6px;
      margin-bottom: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .category-name {
      font-weight: 600;
      color: #2c3e50;
      font-size: 16px;
    }
    .category-total {
      color: #e74c3c;
      font-weight: 700;
      font-size: 16px;
    }
    .transaction {
      background-color: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      padding: 15px;
      margin-bottom: 10px;
      transition: box-shadow 0.2s;
    }
    .transaction:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .transaction-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .transaction-name {
      font-weight: 600;
      color: #2c3e50;
      font-size: 15px;
    }
    .transaction-amount {
      color: #e74c3c;
      font-weight: 700;
      font-size: 16px;
    }
    .transaction-amount.income {
      color: #27ae60;
    }
    .transaction-details {
      color: #7f8c8d;
      font-size: 13px;
      margin-top: 5px;
    }
    .merchant {
      color: #555;
      margin-right: 15px;
    }
    .date-time {
      color: #95a5a6;
    }
    .pending-badge {
      display: inline-block;
      background-color: #f39c12;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      margin-left: 10px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      color: #95a5a6;
      font-size: 13px;
    }
    .no-transactions {
      text-align: center;
      padding: 40px;
      color: #95a5a6;
      font-size: 16px;
    }
    .budget-section {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #e0e0e0;
    }
    .budget-section h2 {
      color: #2c3e50;
      font-size: 22px;
      margin: 0 0 20px 0;
    }
    .budget-card {
      background-color: #f8f9fa;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 12px;
    }
    .budget-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .budget-name {
      font-weight: 600;
      color: #2c3e50;
      font-size: 15px;
    }
    .budget-period {
      font-size: 12px;
      color: #7f8c8d;
      background-color: #ecf0f1;
      padding: 2px 8px;
      border-radius: 10px;
    }
    .budget-amounts {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: #555;
      margin-bottom: 8px;
    }
    .budget-progress-bar {
      width: 100%;
      height: 12px;
      background-color: #e0e0e0;
      border-radius: 6px;
      overflow: hidden;
    }
    .budget-progress-fill {
      height: 100%;
      border-radius: 6px;
      transition: width 0.3s;
    }
    .budget-percentage {
      text-align: right;
      font-size: 13px;
      font-weight: 600;
      margin-top: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💳 Daily Transaction Summary</h1>
      <div class="account-info">
        <strong>${account.name}</strong> (${account.mask ? '****' + account.mask : 'N/A'})
        <br>
        ${dateString}
      </div>
    </div>

    ${transactions.length === 0 ? this.generateNoTransactions() : this.generateSummary(transactions, totalSpent, groupedByCategory)}
    ${budgets.length > 0 ? this.generateBudgetSection(budgets) : ''}
  </div>
</body>
</html>
    `;
  }

  private static generateNoTransactions(): string {
    return `
    <div class="no-transactions">
      <p>🎉 No transactions recorded for yesterday!</p>
      <p>Your account had no activity.</p>
    </div>
    `;
  }

  private static generateSummary(
    transactions: Transaction[],
    totalSpent: number,
    groupedByCategory: CategoryGroup[],
  ): string {
    return `
    <div class="summary">
      <div class="summary-item">
        <span class="summary-label">Total Transactions:</span>
        <span class="summary-value">${transactions.length}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Total Amount:</span>
        <span class="summary-value">$${Math.abs(totalSpent).toFixed(2)}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Categories:</span>
        <span class="summary-value">${groupedByCategory.length}</span>
      </div>
    </div>

    ${groupedByCategory.map((group) => this.generateCategorySection(group)).join('')}

    <div class="footer">
      <p>This is an automated summary from Plaid Financcer</p>
      <p>Generated on ${new Date().toLocaleString()}</p>
    </div>
    `;
  }

  private static generateCategorySection(group: CategoryGroup): string {
    return `
    <div class="category-section">
      <div class="category-header">
        <span class="category-name">${group.category}</span>
        <span class="category-total">$${Math.abs(group.total).toFixed(2)}</span>
      </div>
      ${group.transactions.map((txn) => this.generateTransaction(txn)).join('')}
    </div>
    `;
  }

  private static generateTransaction(transaction: Transaction): string {
    const isIncome = transaction.amount < 0;
    const amountClass = isIncome ? 'income' : '';
    const formattedAmount = isIncome
      ? `+$${Math.abs(transaction.amount).toFixed(2)}`
      : `$${transaction.amount.toFixed(2)}`;

    const date = new Date(transaction.date);
    const dateString = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const timeString = transaction.authorizedDate
      ? new Date(transaction.authorizedDate).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Time N/A';

    return `
    <div class="transaction">
      <div class="transaction-header">
        <div class="transaction-name">
          ${transaction.name}
          ${transaction.pending ? '<span class="pending-badge">PENDING</span>' : ''}
        </div>
        <div class="transaction-amount ${amountClass}">
          ${formattedAmount}
        </div>
      </div>
      <div class="transaction-details">
        ${transaction.merchantName ? `<span class="merchant">🏪 ${transaction.merchantName}</span>` : ''}
        <span class="date-time">📅 ${dateString} at ${timeString}</span>
      </div>
    </div>
    `;
  }

  private static generateBudgetSection(budgets: BudgetWithStatus[]): string {
    return `
    <div class="budget-section">
      <h2>📊 Budget Overview</h2>
      ${budgets.map((b) => this.generateBudgetCard(b)).join('')}
    </div>
    `;
  }

  private static generateBudgetCard(item: BudgetWithStatus): string {
    const { budget, spent, remaining, percentage } = item;
    const progressColor = percentage >= 90 ? '#e74c3c' : percentage >= 75 ? '#f39c12' : '#27ae60';
    const remainingColor = remaining >= 0 ? '#27ae60' : '#e74c3c';
    const remainingText = remaining >= 0
      ? `$${remaining.toFixed(2)} remaining`
      : `$${Math.abs(remaining).toFixed(2)} over budget`;
    const periodLabel = budget.period.charAt(0).toUpperCase() + budget.period.slice(1);

    return `
    <div class="budget-card">
      <div class="budget-card-header">
        <span class="budget-name">${budget.name}</span>
        <span class="budget-period">${periodLabel}</span>
      </div>
      <div class="budget-amounts">
        <span>$${spent.toFixed(2)} spent of $${budget.amount.toFixed(2)}</span>
        <span style="color: ${remainingColor}; font-weight: 600;">${remainingText}</span>
      </div>
      <div class="budget-progress-bar">
        <div class="budget-progress-fill" style="width: ${Math.min(percentage, 100)}%; background-color: ${progressColor};"></div>
      </div>
      <div class="budget-percentage" style="color: ${progressColor};">${percentage}%</div>
    </div>
    `;
  }

  private static groupByCategory(
    transactions: Transaction[],
  ): CategoryGroup[] {
    const groups = new Map<string, Transaction[]>();

    transactions.forEach((txn) => {
      const category =
        txn.category && txn.category.length > 0
          ? txn.category[0]
          : 'Uncategorized';

      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category).push(txn);
    });

    return Array.from(groups.entries())
      .map(([category, txns]) => ({
        category,
        transactions: txns,
        total: txns.reduce((sum, txn) => sum + txn.amount, 0),
      }))
      .sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
  }

  private static calculateTotal(transactions: Transaction[]): number {
    return transactions
      .filter((txn) => txn.amount > 0)
      .reduce((sum, txn) => sum + txn.amount, 0);
  }
}
