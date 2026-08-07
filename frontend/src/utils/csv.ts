export function exportToCsv(filename: string, headers: string[], data: any[][]) {
  const csvContent =
    'data:text/csv;charset=utf-8,\uFEFF' +
    headers.join(',') +
    '\n' +
    data
      .map((row) =>
        row
          .map((cell) =>
            cell !== null && cell !== undefined ? `"${String(cell).replace(/"/g, '""')}"` : '',
          )
          .join(','),
      )
      .join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
