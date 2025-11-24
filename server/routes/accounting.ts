import { RequestHandler } from "express";
import {
  ChartOfAccount,
  JournalEntry,
  Expense,
  ExpenseCategory,
  POSItem,
  POSTransaction,
  POSTransactionItem,
  AccountingSummary,
} from "@shared/api";

// In-memory storage for demo purposes
let chartOfAccounts: ChartOfAccount[] = [];
let journalEntries: JournalEntry[] = [];
let expenses: Expense[] = [];
let expenseCategories: ExpenseCategory[] = [];
let posItems: POSItem[] = [];
let posTransactions: POSTransaction[] = [];
let accountingSummary: AccountingSummary | null = null;

// Initialize default chart of accounts
function initializeChartOfAccounts() {
  if (chartOfAccounts.length > 0) return;

  const defaultAccounts: ChartOfAccount[] = [
    {
      id: "1000",
      accountCode: "1000",
      accountName: "Cash",
      type: "Asset",
      category: "Cash",
      balance: 0,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "1100",
      accountCode: "1100",
      accountName: "Accounts Receivable",
      type: "Asset",
      category: "Receivable",
      balance: 0,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "2000",
      accountCode: "2000",
      accountName: "Accounts Payable",
      type: "Liability",
      category: "Payable",
      balance: 0,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "3000",
      accountCode: "3000",
      accountName: "Equity",
      type: "Equity",
      category: "Capital",
      balance: 0,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "4000",
      accountCode: "4000",
      accountName: "Revenue",
      type: "Revenue",
      category: "Sales",
      balance: 0,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "5000",
      accountCode: "5000",
      accountName: "Cost of Goods Sold",
      type: "Expense",
      category: "COGS",
      balance: 0,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "6000",
      accountCode: "6000",
      accountName: "Operating Expenses",
      type: "Expense",
      category: "Operating",
      balance: 0,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  chartOfAccounts = defaultAccounts;
}

// Chart of Accounts - CRUD
export const getChartOfAccounts: RequestHandler = (req, res) => {
  try {
    initializeChartOfAccounts();
    return res.json(chartOfAccounts);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch chart of accounts",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const createChartOfAccount: RequestHandler = (req, res) => {
  try {
    const { accountCode, accountName, type, category, description } = req.body;

    if (!accountCode || !accountName || !type) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        error: "accountCode, accountName, and type are required",
      });
    }

    const newAccount: ChartOfAccount = {
      id: `ACC-${Date.now()}`,
      accountCode,
      accountName,
      type: type as ChartOfAccount["type"],
      category,
      description,
      balance: 0,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    chartOfAccounts.push(newAccount);

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      account: newAccount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create account",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const updateChartOfAccount: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const { accountName, type, category, description, enabled } = req.body;

    const account = chartOfAccounts.find((a) => a.id === id);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
        error: "Invalid account ID",
      });
    }

    if (accountName) account.accountName = accountName;
    if (type) account.type = type;
    if (category) account.category = category;
    if (description !== undefined) account.description = description;
    if (enabled !== undefined) account.enabled = enabled;
    account.updatedAt = new Date().toISOString();

    return res.json({
      success: true,
      message: "Account updated successfully",
      account,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update account",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// General Ledger - Journal Entries
export const getJournalEntries: RequestHandler = (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    let filtered = journalEntries;

    if (startDate || endDate) {
      filtered = filtered.filter((entry) => {
        const date = new Date(entry.entryDate);
        if (startDate && date < new Date(startDate as string)) return false;
        if (endDate && date > new Date(endDate as string)) return false;
        return true;
      });
    }

    if (status) {
      filtered = filtered.filter((entry) => entry.status === status);
    }

    return res.json(filtered);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch journal entries",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const createJournalEntry: RequestHandler = (req, res) => {
  try {
    const {
      description,
      referenceNo,
      debitAccountCode,
      creditAccountCode,
      amount,
    } = req.body;

    if (!description || !debitAccountCode || !creditAccountCode || !amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        error:
          "description, debitAccountCode, creditAccountCode, and amount are required",
      });
    }

    // Validate accounts exist
    const debit = chartOfAccounts.find(
      (a) => a.accountCode === debitAccountCode,
    );
    const credit = chartOfAccounts.find(
      (a) => a.accountCode === creditAccountCode,
    );

    if (!debit || !credit) {
      return res.status(400).json({
        success: false,
        message: "Invalid account code",
        error: "One or both accounts do not exist",
      });
    }

    const newEntry: JournalEntry = {
      id: `JE-${Date.now()}`,
      entryNumber: `JE-${journalEntries.length + 1}`,
      description,
      referenceNo,
      debitAccountCode,
      creditAccountCode,
      amount,
      entryDate: new Date().toISOString(),
      status: "posted",
      createdBy: "system",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    journalEntries.push(newEntry);

    // Update account balances
    debit.balance += amount;
    credit.balance -= amount;

    return res.status(201).json({
      success: true,
      message: "Journal entry created successfully",
      entry: newEntry,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create journal entry",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const reverseJournalEntry: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;

    const entry = journalEntries.find((e) => e.id === id);
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: "Journal entry not found",
        error: "Invalid entry ID",
      });
    }

    if (entry.status === "reversed") {
      return res.status(400).json({
        success: false,
        message: "Entry already reversed",
        error: "Cannot reverse an already reversed entry",
      });
    }

    // Create reverse entry
    const reverseEntry: JournalEntry = {
      id: `JE-${Date.now()}`,
      entryNumber: `JE-${journalEntries.length + 1}`,
      description: `Reverse of ${entry.entryNumber}: ${entry.description}`,
      referenceNo: entry.referenceNo,
      debitAccountCode: entry.creditAccountCode,
      creditAccountCode: entry.debitAccountCode,
      amount: entry.amount,
      entryDate: new Date().toISOString(),
      status: "posted",
      createdBy: "system",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    journalEntries.push(reverseEntry);

    // Update original entry status
    entry.status = "reversed";
    entry.reversedBy = reverseEntry.id;
    entry.updatedAt = new Date().toISOString();

    // Reverse account balances
    const debit = chartOfAccounts.find(
      (a) => a.accountCode === entry.debitAccountCode,
    );
    const credit = chartOfAccounts.find(
      (a) => a.accountCode === entry.creditAccountCode,
    );

    if (debit) debit.balance -= entry.amount;
    if (credit) credit.balance += entry.amount;

    return res.json({
      success: true,
      message: "Journal entry reversed successfully",
      reverseEntry,
      originalEntry: entry,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to reverse journal entry",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Expenses
export const getExpenseCategories: RequestHandler = (req, res) => {
  try {
    return res.json(expenseCategories);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch expense categories",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const createExpenseCategory: RequestHandler = (req, res) => {
  try {
    const { name, code, type } = req.body;

    if (!name || !code || !type) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        error: "name, code, and type are required",
      });
    }

    const newCategory: ExpenseCategory = {
      id: `EXP-CAT-${Date.now()}`,
      name,
      code,
      type: type as ExpenseCategory["type"],
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expenseCategories.push(newCategory);

    return res.status(201).json({
      success: true,
      message: "Expense category created successfully",
      category: newCategory,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create expense category",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getExpenses: RequestHandler = (req, res) => {
  try {
    const { status, categoryId, startDate, endDate } = req.query;

    let filtered = expenses;

    if (status) {
      filtered = filtered.filter((e) => e.status === status);
    }

    if (categoryId) {
      filtered = filtered.filter((e) => e.categoryId === categoryId);
    }

    if (startDate || endDate) {
      filtered = filtered.filter((e) => {
        const date = new Date(e.expenseDate);
        if (startDate && date < new Date(startDate as string)) return false;
        if (endDate && date > new Date(endDate as string)) return false;
        return true;
      });
    }

    return res.json(filtered);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch expenses",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const createExpense: RequestHandler = (req, res) => {
  try {
    const {
      categoryId,
      description,
      amount,
      vendor,
      paymentMethod,
      referenceNo,
    } = req.body;

    if (!categoryId || !description || !amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        error: "categoryId, description, and amount are required",
      });
    }

    const newExpense: Expense = {
      id: `EXP-${Date.now()}`,
      expenseNumber: `EXP-${expenses.length + 1}`,
      categoryId,
      description,
      amount,
      vendor,
      paymentMethod: paymentMethod || "cash",
      referenceNo,
      status: "draft",
      expenseDate: new Date().toISOString(),
      createdBy: "user",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expenses.push(newExpense);

    return res.status(201).json({
      success: true,
      message: "Expense created successfully",
      expense: newExpense,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create expense",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const updateExpense: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const { status, approvedBy } = req.body;

    const expense = expenses.find((e) => e.id === id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
        error: "Invalid expense ID",
      });
    }

    if (status) {
      expense.status = status;
      if (status === "approved") {
        expense.approvedBy = approvedBy;
        expense.approvedAt = new Date().toISOString();
      } else if (status === "paid") {
        expense.paidAt = new Date().toISOString();
      }
    }

    expense.updatedAt = new Date().toISOString();

    return res.json({
      success: true,
      message: "Expense updated successfully",
      expense,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update expense",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// POS Routes
export const getPOSItems: RequestHandler = (req, res) => {
  try {
    return res.json(posItems);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch POS items",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const createPOSItem: RequestHandler = (req, res) => {
  try {
    const { sku, name, description, category, unitPrice, reorderLevel } =
      req.body;

    if (!sku || !name || unitPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        error: "sku, name, and unitPrice are required",
      });
    }

    const newItem: POSItem = {
      id: `POS-ITEM-${Date.now()}`,
      sku,
      name,
      description,
      category,
      unitPrice,
      quantity: 0,
      reorderLevel: reorderLevel || 10,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    posItems.push(newItem);

    return res.status(201).json({
      success: true,
      message: "POS item created successfully",
      item: newItem,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create POS item",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const createPOSTransaction: RequestHandler = (req, res) => {
  try {
    const {
      customerName,
      items,
      paymentMethod,
      taxAmount,
      discountAmount,
      cashier,
      notes,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        error: "At least one item is required",
      });
    }

    // Calculate subtotal
    let subtotal = 0;
    const transactionItems: POSTransactionItem[] = [];

    for (const item of items) {
      const posItem = posItems.find((p) => p.id === item.itemId);
      if (!posItem) {
        return res.status(400).json({
          success: false,
          message: "Invalid item",
          error: `Item ${item.itemId} not found`,
        });
      }

      const lineTotal = posItem.unitPrice * item.quantity;
      subtotal += lineTotal;

      transactionItems.push({
        id: `TXN-ITEM-${Date.now()}-${Math.random()}`,
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: posItem.unitPrice,
        lineTotal,
        discount: item.discount || 0,
        createdAt: new Date().toISOString(),
      });

      // Update inventory
      posItem.quantity -= item.quantity;
    }

    const totalTax = taxAmount || 0;
    const totalDiscount = discountAmount || 0;
    const totalAmount = subtotal + totalTax - totalDiscount;

    const newTransaction: POSTransaction = {
      id: `POS-TXN-${Date.now()}`,
      receiptNumber: `RCP-${posTransactions.length + 1}`,
      customerName,
      subtotal,
      taxAmount: totalTax,
      discountAmount: totalDiscount,
      totalAmount,
      paymentMethod: paymentMethod || "cash",
      paymentStatus: "completed",
      cashier,
      notes,
      items: transactionItems,
      transactionDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    posTransactions.push(newTransaction);

    // Create journal entries for the transaction
    if (totalAmount > 0) {
      const cashAccount = chartOfAccounts.find((a) => a.accountCode === "1000");
      const revenueAccount = chartOfAccounts.find(
        (a) => a.accountCode === "4000",
      );

      if (cashAccount && revenueAccount) {
        const journalEntry: JournalEntry = {
          id: `JE-${Date.now()}`,
          entryNumber: `JE-${journalEntries.length + 1}`,
          description: `POS Transaction - ${newTransaction.receiptNumber}`,
          referenceNo: newTransaction.receiptNumber,
          debitAccountCode: "1000",
          creditAccountCode: "4000",
          amount: totalAmount,
          entryDate: new Date().toISOString(),
          status: "posted",
          createdBy: "POS",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        journalEntries.push(journalEntry);
        cashAccount.balance += totalAmount;
        revenueAccount.balance -= totalAmount;
      }
    }

    return res.status(201).json({
      success: true,
      message: "POS transaction created successfully",
      transaction: newTransaction,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create POS transaction",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getPOSTransactions: RequestHandler = (req, res) => {
  try {
    const { startDate, endDate, paymentStatus } = req.query;

    let filtered = posTransactions;

    if (startDate || endDate) {
      filtered = filtered.filter((t) => {
        const date = new Date(t.transactionDate);
        if (startDate && date < new Date(startDate as string)) return false;
        if (endDate && date > new Date(endDate as string)) return false;
        return true;
      });
    }

    if (paymentStatus) {
      filtered = filtered.filter((t) => t.paymentStatus === paymentStatus);
    }

    return res.json(filtered);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch POS transactions",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Financial Summary
export const getAccountingSummary: RequestHandler = (req, res) => {
  try {
    let summary: AccountingSummary = {
      id: "summary",
      summaryDate: new Date().toISOString(),
      totalAssets: 0,
      totalLiabilities: 0,
      totalEquity: 0,
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Calculate totals
    chartOfAccounts.forEach((account) => {
      if (account.type === "Asset") summary.totalAssets += account.balance;
      if (account.type === "Liability")
        summary.totalLiabilities += account.balance;
      if (account.type === "Equity") summary.totalEquity += account.balance;
      if (account.type === "Revenue") summary.totalRevenue += account.balance;
      if (account.type === "Expense") summary.totalExpenses += account.balance;
    });

    summary.netProfit = summary.totalRevenue - summary.totalExpenses;

    return res.json(summary);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch accounting summary",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getTrialBalance: RequestHandler = (req, res) => {
  try {
    initializeChartOfAccounts();

    const trialBalance = chartOfAccounts.map((account) => ({
      accountCode: account.accountCode,
      accountName: account.accountName,
      debit: account.balance > 0 ? account.balance : 0,
      credit: account.balance < 0 ? Math.abs(account.balance) : 0,
    }));

    const totalDebit = trialBalance.reduce((sum, row) => sum + row.debit, 0);
    const totalCredit = trialBalance.reduce((sum, row) => sum + row.credit, 0);

    return res.json({
      items: trialBalance,
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch trial balance",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
