import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function toWords(num) {
  if (num === 0) return 'Zero';
  const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const fn = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n/10)] + (n%10 ? ' ' + a[n%10] : '');
    if (n < 1000) return a[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' ' + fn(n%100) : '');
    return '';
  };
  const whole = Math.floor(num);
  const frac = Math.round((num - whole) * 100);
  let result = fn(whole);
  if (frac > 0) result += ' and ' + fn(frac) + '/100';
  return result + ' Only';
}

export function getBillHtml(bill) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  @page { margin: 15mm 10mm; }
  body { font-family: 'Courier New', monospace; font-size: 12px; color: #1e293b; margin: 0; padding: 0; }
  .header { text-align: center; border-bottom: 2px dashed #1e293b; padding-bottom: 12px; margin-bottom: 16px; }
  .header h1 { font-size: 20px; margin: 0; letter-spacing: 2px; }
  .header p { font-size: 11px; color: #64748b; margin: 2px 0; }
  .title { text-align: center; font-size: 14px; font-weight: bold; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 3px; }
  .info-table { width: 100%; margin-bottom: 12px; }
  .info-table td { padding: 2px 4px; font-size: 11px; }
  .info-table .label { color: #64748b; width: 100px; }
  .info-table .value { font-weight: bold; }
  table.items { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  table.items th { background: #1e293b; color: #fff; padding: 6px 8px; font-size: 10px; text-align: left; text-transform: uppercase; }
  table.items td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
  table.items tr:last-child td { border-bottom: none; }
  .amount { text-align: right; font-weight: bold; }
  .right { text-align: right; }
  .totals { margin-left: auto; width: 250px; }
  .totals td { padding: 3px 8px; font-size: 12px; }
  .totals .total-row td { border-top: 2px solid #1e293b; font-weight: bold; font-size: 14px; }
  .grand-total { text-align: center; margin-top: 16px; font-size: 16px; font-weight: bold; padding: 8px; border: 2px solid #1e293b; }
  .footer { text-align: center; margin-top: 24px; font-size: 10px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 8px; }
  .status { display: inline-block; padding: 3px 10px; font-weight: bold; font-size: 11px; }
  .status-paid { color: #059669; }
  .status-pending { color: #d97706; }
</style>
</head>
<body>
  <div class="header">
    <h1>CLINIC FLOW</h1>
    <p>123 Healthcare Avenue, Medical District</p>
    <p>Phone: +91-9876543210 | Email: info@clinicflow.com</p>
  </div>
  <div class="title">Tax Invoice</div>
  <table class="info-table">
    <tr><td class="label">Bill No:</td><td class="value">${bill.billNumber || '-'}</td></tr>
    <tr><td class="label">Date:</td><td class="value">${formatDate(bill.createdAt)}</td></tr>
    <tr><td class="label">Patient:</td><td class="value">${bill.patientName || `ID: ${bill.patientId}`}</td></tr>
    ${bill.patientPhone ? `<tr><td class="label">Phone:</td><td class="value">${bill.patientPhone}</td></tr>` : ''}
    <tr><td class="label">Payment:</td><td class="value">${bill.paymentMethod || '-'} <span class="status status-${(bill.paymentStatus || '').toLowerCase()}">[${bill.paymentStatus}]</span></td></tr>
  </table>
  <table class="items">
    <thead><tr><th>#</th><th>Item</th><th class="right">Qty</th><th class="right">Rate</th><th class="right">Amount</th></tr></thead>
    <tbody>
      ${(bill.items || []).map((item, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${item.itemName}</td>
          <td class="amount">${Number(item.quantity)}</td>
          <td class="amount">${Number(item.sellingPrice).toFixed(2)}</td>
          <td class="amount">${Number(item.lineTotal).toFixed(2)}</td>
        </tr>`).join('')}
    </tbody>
  </table>
  <table class="totals">
    <tr><td>Subtotal</td><td class="amount">${Number(bill.subtotal).toFixed(2)}</td></tr>
    ${Number(bill.discount) > 0 ? `<tr><td>Discount</td><td class="amount">-${Number(bill.discount).toFixed(2)}</td></tr>` : ''}
    ${Number(bill.tax) > 0 ? `<tr><td>Tax</td><td class="amount">+${Number(bill.tax).toFixed(2)}</td></tr>` : ''}
    <tr class="total-row"><td>Total</td><td class="amount">${Number(bill.totalAmount).toFixed(2)}</td></tr>
  </table>
  <div class="grand-total">Rupees ${toWords(Number(bill.totalAmount))}</div>
  <div class="footer">This is a computer-generated invoice. No signature required.</div>
</body>
</html>`;
}

export function getPrescriptionHtml(consultation, patientName, letterhead) {
  const lh = letterhead || {};
  const clinicName = lh.clinicName || 'CLINIC FLOW';
  const clinicAddress = lh.clinicAddress || '123 Healthcare Avenue, Medical District';
  const clinicPhone = lh.clinicPhone ? `Phone: ${lh.clinicPhone}` : '';
  const clinicEmail = lh.clinicEmail ? `Email: ${lh.clinicEmail}` : '';
  const contactParts = [clinicPhone, clinicEmail].filter(Boolean);
  const contactLine = contactParts.length ? contactParts.join(' | ') : '';
  const regInfo = [lh.gstNumber ? `GST: ${lh.gstNumber}` : '', lh.registrationNumber ? `Reg: ${lh.registrationNumber}` : ''].filter(Boolean).join(' | ');

  const clinicInitials = clinicName.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 3);
  const logoHtml = lh.clinicLogoUrl
    ? `<img src="${lh.clinicLogoUrl}" style="max-height:50px; max-width:200px; margin-bottom:6px;" />`
    : `<div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 22px; background: #1e3a8a; color: #ffffff; font-weight: 800; font-size: 16px; margin-bottom: 6px; text-align: center; letter-spacing: 0.5px;">${clinicInitials}</div>`;

  const doctorName = consultation.doctorName || 'Authorized Signatory';
  const signatureHtml = lh.signatureUrl
    ? `<img src="${lh.signatureUrl}" style="max-height:40px; max-width:160px; margin-bottom:2px;" />`
    : `<div style="font-family: 'Brush Script MT', 'Reenie Beanie', 'Caveat', cursive, serif; font-style: italic; font-size: 20px; color: #1e3a8a; font-weight: 500; margin-bottom: 2px;">Dr. ${doctorName.replace(/^Dr\.\s+/i, '')}</div>`;

  // Determine modes
  const isSystemGenerated = lh.useSystemGenerated;
  const isPlainNotepad = !isSystemGenerated && lh.templateStyle === 'PLAIN';
  const isUploadedBackground = !isSystemGenerated && (lh.templateStyle === 'BACKGROUND' || lh.letterheadDesignUrl);

  let headerHtml = '';
  let containerPadding = '0px';
  let bodyBackground = '';

  if (isSystemGenerated) {
    // Template specific styling
    let headerStyle = 'text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 16px;';
    let nameStyle = 'font-size: 22px; margin: 0; letter-spacing: 1px; color: #1e3a8a; font-weight: bold;';
    
    if (lh.templateStyle === 'TEMPLATE_B') {
      headerStyle = 'text-align: center; border-bottom: 2px dashed #0f766e; padding-bottom: 12px; margin-bottom: 16px; border-top: 4px solid #0f766e; padding-top: 8px;';
      nameStyle = 'font-size: 22px; margin: 0; letter-spacing: 1px; color: #0f766e; font-family: "Georgia", serif; font-weight: bold;';
    } else if (lh.templateStyle === 'TEMPLATE_C') {
      headerStyle = 'text-align: left; padding: 12px 16px; margin-bottom: 16px; background-color: #1f2937; border-left: 6px solid #eab308; border-radius: 4px;';
      nameStyle = 'font-size: 22px; margin: 0; letter-spacing: 1px; color: #eab308; font-weight: bold;';
    }

    headerHtml = `
      <div class="header" style="${headerStyle}">
        ${logoHtml}
        <h1 style="${nameStyle}">${clinicName}</h1>
        ${clinicAddress ? `<p>${clinicAddress}</p>` : ''}
        ${contactLine ? `<p>${contactLine}</p>` : ''}
        ${regInfo ? `<p style="font-size:10px;color:#94a3b8;margin-top:4px;">${regInfo}</p>` : ''}
      </div>
    `;
  } else if (isUploadedBackground) {
    containerPadding = '45mm 0px 0px 0px';
    if (lh.letterheadDesignUrl) {
      bodyBackground = `background-image: url('${lh.letterheadDesignUrl}'); background-repeat: no-repeat; background-position: center; background-size: cover;`;
    }
  } else if (isPlainNotepad) {
    containerPadding = '35mm 0px 0px 0px';
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  @page { margin: 15mm 12mm; }
  body { 
    font-family: 'Georgia', serif; 
    font-size: 13px; 
    color: #1e293b; 
    margin: 0; 
    padding: ${containerPadding}; 
    ${bodyBackground}
  }
  .header p { font-size: 11px; color: #64748b; margin: 2px 0; }
  .title { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 4px; }
  .info-table { width: 100%; margin-bottom: 16px; }
  .info-table td { padding: 3px 6px; font-size: 12px; }
  .info-table .label { color: #64748b; width: 120px; }
  .info-table .value { font-weight: bold; }
  .section { margin-bottom: 16px; }
  .section-title { font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px; }
  .vitals-grid { display: flex; flex-wrap: wrap; gap: 4px; }
  .vital-item { width: 30%; padding: 3px 0; font-size: 12px; }
  .vital-label { color: #64748b; }
  .vital-value { font-weight: bold; }
  .notes { background: #f8fafc; padding: 10px; border-radius: 4px; font-size: 12px; line-height: 1.6; min-height: 60px; }
  .rx-symbol { font-size: 24px; font-weight: bold; color: #1e293b; margin-bottom: 8px; }
  table.medicines { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  table.medicines th { background: #1e293b; color: #fff; padding: 6px 8px; font-size: 10px; text-align: left; text-transform: uppercase; }
  table.medicines td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
  table.medicines tr:last-child td { border-bottom: none; }
  .med-name { font-weight: bold; }
  .med-instruction { font-size: 11px; color: #64748b; margin-top: 2px; }
  .footer { text-align: center; margin-top: 32px; padding-top: 12px; border-top: 1px dashed #cbd5e1; font-size: 10px; color: #94a3b8; }
  .signature { text-align: right; margin-top: 24px; }
  .signature-line { width: 180px; margin-left: auto; padding-top: 4px; font-size: 11px; }
</style>
</head>
<body>
  ${headerHtml}
  <div class="title">Medical Prescription</div>
  <table class="info-table">
    <tr><td class="label">Patient Name:</td><td class="value">${patientName || '-'}</td></tr>
    <tr><td class="label">Date:</td><td class="value">${formatDate(consultation.createdAt)}</td></tr>
    ${consultation.diagnosis ? `<tr><td class="label">Diagnosis:</td><td class="value">${consultation.diagnosis}</td></tr>` : ''}
    ${consultation.followUpDate ? `<tr><td class="label">Follow-Up:</td><td class="value">${consultation.followUpDate}</td></tr>` : ''}
  </table>
  ${consultation.symptoms ? `
  <div class="section">
    <div class="section-title">Symptoms</div>
    <div class="notes">${consultation.symptoms}</div>
  </div>` : ''}
  <div class="section">
    <div class="rx-symbol">Rx</div>
    <div class="section-title">Medicines</div>
    ${consultation.medicines && consultation.medicines.length > 0 ? `
    <table class="medicines">
      <thead><tr><th>#</th><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Qty</th></tr></thead>
      <tbody>
        ${consultation.medicines.map((m, i) => `
          <tr>
            <td>${i + 1}</td>
            <td><div class="med-name">${m.medicineName}</div>${m.instructions ? `<div class="med-instruction">${m.instructions}</div>` : ''}</td>
            <td>${m.dosage || '-'}</td>
            <td>${m.frequency || '-'}</td>
            <td>${m.duration || '-'}</td>
            <td>${m.quantity || 1}</td>
          </tr>`).join('')}
      </tbody>
    </table>` : `
    <div class="notes">${consultation.doctorNotes || 'No prescription recorded.'}</div>`}
  </div>
  ${consultation.bloodPressure || consultation.bloodSugar || consultation.pulseRate || consultation.weight || consultation.temperature || consultation.oxygenLevel ? `
  <div class="section">
    <div class="section-title">Vitals</div>
    <div class="vitals-grid">
      ${consultation.bloodPressure ? `<div class="vital-item"><span class="vital-label">BP: </span><span class="vital-value">${consultation.bloodPressure} mmHg</span></div>` : ''}
      ${consultation.bloodSugar ? `<div class="vital-item"><span class="vital-label">Sugar: </span><span class="vital-value">${consultation.bloodSugar} mg/dL</span></div>` : ''}
      ${consultation.pulseRate ? `<div class="vital-item"><span class="vital-label">Pulse: </span><span class="vital-value">${consultation.pulseRate} bpm</span></div>` : ''}
      ${consultation.weight ? `<div class="vital-item"><span class="vital-label">Weight: </span><span class="vital-value">${consultation.weight} kg</span></div>` : ''}
      ${consultation.temperature ? `<div class="vital-item"><span class="vital-label">Temp: </span><span class="vital-value">${consultation.temperature} °F</span></div>` : ''}
      ${consultation.oxygenLevel ? `<div class="vital-item"><span class="vital-label">SpO2: </span><span class="vital-value">${consultation.oxygenLevel}%</span></div>` : ''}
    </div>
  </div>` : ''}
  <div class="signature">
    ${signatureHtml}
    <div class="signature-line">Doctor's Signature</div>
  </div>
  <div class="footer">This is a computer-generated prescription.</div>
</body>
</html>`;
}

export async function generatePdf(html) {
  const { uri } = await Print.printToFileAsync({ html, width: 595, height: 842 });
  return uri;
}

export async function sharePdf(uri) {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share PDF' });
  }
}

export async function shareBill(bill) {
  const html = getBillHtml(bill);
  const uri = await generatePdf(html);
  await sharePdf(uri);
}

export async function sharePrescription(consultation, patientName, letterhead) {
  const html = getPrescriptionHtml(consultation, patientName, letterhead);
  const uri = await generatePdf(html);
  await sharePdf(uri);
}

export async function downloadBill(bill) {
  const html = getBillHtml(bill);
  return await generatePdf(html);
}

export async function downloadPrescription(consultation, patientName, letterhead) {
  const html = getPrescriptionHtml(consultation, patientName, letterhead);
  return await generatePdf(html);
}
