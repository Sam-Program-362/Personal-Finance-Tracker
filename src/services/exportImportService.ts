import { Budget, SavingsGoal, Transaction } from '../types/finance';

export const exportImportService = {
  /**
   * Export transactions to CSV
   */
  exportToCsv(transactions: Transaction[], filename = 'finance_transactions.csv'): void {
    const headers = ['Date', 'Type', 'Title', 'Amount', 'Category', 'Payment Method', 'Status', 'Recurring', 'Tags', 'Notes'];
    const rows = transactions.map((t) => [
      t.date,
      t.type,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      t.amount.toFixed(2),
      `"${(t.category || '').replace(/"/g, '""')}"`,
      `"${(t.paymentMethod || '').replace(/"/g, '""')}"`,
      t.status,
      t.isRecurring ? t.recurringFrequency || 'yes' : 'no',
      `"${(t.tags || []).join(', ')}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Parse CSV file text into Transaction objects
   */
  parseCsv(text: string): Partial<Transaction>[] {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
    const results: Partial<Transaction>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Regex to handle comma separation with quoted strings
      const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
      const cleanValues = values.map((v) => v.replace(/^"|"$/g, '').trim());

      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = cleanValues[idx] || '';
      });

      const date = row['date'] || new Date().toISOString().split('T')[0];
      const type = (row['type']?.toLowerCase() === 'income' ? 'income' : 'expense') as 'income' | 'expense';
      const title = row['title'] || row['description'] || 'Imported Transaction';
      const amount = Math.abs(parseFloat(row['amount'])) || 0;
      const category = (row['category'] || (type === 'income' ? 'Salary & Wages' : 'Food & Dining')) as any;
      const paymentMethod = (row['payment method'] || row['paymentmethod'] || 'Credit Card') as any;
      const notes = row['notes'] || '';
      const tags = row['tags'] ? row['tags'].split(',').map((s) => s.trim()) : [];

      if (amount > 0) {
        results.push({
          date,
          type,
          title,
          amount,
          category,
          paymentMethod,
          notes,
          tags,
          status: 'cleared',
        });
      }
    }

    return results;
  },

  /**
   * Export complete application state to JSON
   */
  exportBackupJson(data: { transactions: Transaction[]; budgets: Budget[]; goals: SavingsGoal[] }): void {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `finance_tracker_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },
};
