/**
 * CSV Export utility
 */

export const exportToCSV = (data, filename = 'energy-report.csv') => {
  if (!data || !data.length) {
    alert('No data available to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const rows = data.map((obj) =>
    headers
      .map((header) => {
        let val = obj[header];
        if (typeof val === 'object' && val !== null) {
          val = JSON.stringify(val).replace(/"/g, '""');
        } else if (typeof val === 'string') {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val !== undefined && val !== null ? val : '';
      })
      .join(',')
  );

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
