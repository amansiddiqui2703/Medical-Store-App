/**
 * Formatting and utility helpers for RefillDesk by Automindz Digital Labs
 */

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function daysDifference(targetDateStr: string): number {
  if (!targetDateStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDateStr + 'T00:00:00');
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getRelativeDaysLabel(targetDateStr: string): { label: string; urgency: 'critical' | 'warning' | 'normal' | 'past' } {
  const days = daysDifference(targetDateStr);
  if (days < 0) {
    return { label: `${Math.abs(days)}d overdue`, urgency: 'past' };
  }
  if (days === 0) {
    return { label: 'Due Today', urgency: 'critical' };
  }
  if (days === 1) {
    return { label: 'Tomorrow', urgency: 'critical' };
  }
  if (days <= 3) {
    return { label: `In ${days} days`, urgency: 'warning' };
  }
  if (days <= 7) {
    return { label: `In ${days} days`, urgency: 'normal' };
  }
  return { label: `In ${days} days`, urgency: 'normal' };
}

export function cleanPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return '91' + cleaned;
  }
  return cleaned;
}

export function buildWhatsAppUrl(phone: string, text: string): string {
  const sanitizedPhone = cleanPhone(phone);
  return `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(text)}`;
}

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][], title?: string) {
  const lines: string[] = [];
  
  if (title) {
    lines.push(`"${title.replace(/"/g, '""')}"`);
    lines.push(`"Generated on: ${new Date().toLocaleString('en-IN')} | RefillDesk by Automindz Digital Labs"`);
    lines.push('');
  }

  lines.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

  for (const row of rows) {
    lines.push(row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','));
  }

  const csvContent = lines.join('\r\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Creates an authentic-looking doctor prescription image as a Data URL for instant testing
 */
export function generateSampleRxSvg(patientName: string, doctorName: string, medsList: string[]): string {
  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const medsRows = medsList
    .map((med, i) => `<text x="50" y="${230 + i * 36}" font-family="sans-serif" font-size="14" fill="#1e293b" font-weight="600">${i + 1}. ${med}</text><text x="60" y="${248 + i * 36}" font-family="sans-serif" font-size="12" fill="#64748b">1 tab daily after meals - 30 days course</text>`)
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750" width="100%" height="100%">
    <defs>
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="600" height="750" fill="#ffffff" rx="8" stroke="#cbd5e1" stroke-width="2"/>
    <rect width="600" height="750" fill="url(#grid)" />
    
    <!-- Clinic Header -->
    <rect width="600" height="110" fill="#0f766e" rx="6"/>
    <text x="30" y="42" font-family="sans-serif" font-size="22" font-weight="bold" fill="#ffffff">DR. ${doctorName.toUpperCase()}</text>
    <text x="30" y="66" font-family="sans-serif" font-size="13" fill="#ccfbf1">MBBS, MD (Medicine) · Reg No: MH-49201</text>
    <text x="30" y="86" font-family="sans-serif" font-size="12" fill="#99f6e4">City Care Polyclinic, Station Road · Ph: +91 98200 12345</text>
    <text x="500" y="70" font-family="serif" font-size="44" font-weight="bold" fill="#ffffff" opacity="0.4">Rx</text>
    
    <!-- Patient Info Bar -->
    <rect x="25" y="125" width="550" height="50" fill="#f8fafc" stroke="#e2e8f0" rx="6"/>
    <text x="40" y="148" font-family="sans-serif" font-size="12" fill="#64748b">PATIENT NAME</text>
    <text x="40" y="165" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">${patientName.toUpperCase()}</text>
    <text x="360" y="148" font-family="sans-serif" font-size="12" fill="#64748b">DATE</text>
    <text x="360" y="165" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">${dateStr}</text>
    
    <!-- Rx Symbol -->
    <text x="40" y="210" font-family="serif" font-size="32" font-style="italic" font-weight="bold" fill="#0f766e">℞</text>
    
    <!-- Medicines -->
    ${medsRows}
    
    <!-- Footer advice & stamp -->
    <line x1="40" y1="580" x2="560" y2="580" stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="4"/>
    <text x="40" y="605" font-family="sans-serif" font-size="12" fill="#64748b">Special Advice: Check BP weekly &amp; report if systolic &gt; 140 mmHg.</text>
    
    <!-- Doctor signature stamp -->
    <g transform="translate(380, 620)">
      <path d="M10,25 Q30,5 60,30 T110,20 T150,35" fill="none" stroke="#0f766e" stroke-width="2"/>
      <text x="30" y="52" font-family="sans-serif" font-size="12" font-weight="600" fill="#334155">Dr. ${doctorName}</text>
      <text x="30" y="68" font-family="sans-serif" font-size="10" fill="#64748b">Authorized Signatory</text>
    </g>
    
    <text x="30" y="730" font-family="sans-serif" font-size="10" fill="#94a3b8">Digitally logged via RefillDesk · Automindz Digital Labs</text>
  </svg>`;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
