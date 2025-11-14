export const formatCurrency = (value: number | undefined | null): string => {
  if (value === null || typeof value === 'undefined' || value === 0) {
    return '-';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatDate = (dateString: string): string => {
  // Treat YYYY-MM-DD as a local date to avoid timezone issues.
  // Appending 'T00:00:00' makes `new Date()` parse it in the local timezone.
  const date = new Date(`${dateString}T00:00:00`);
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

// This function handles Excel's numeric date format and various string formats
export const safeFormatDateForImport = (dateValue: any): string => {
  let date;
  // Check for Excel's serial date number (and reasonably valid range)
  if (typeof dateValue === 'number' && dateValue > 1) {
    // Formula to convert Excel serial date to JS Date object
    // (dateValue - 25569) * 86400 * 1000 gives JS timestamp in UTC.
    // We add timezone offset to get the correct local date.
    const excelDate = new Date((dateValue - 25569) * 864e5);
    const tzOffset = excelDate.getTimezoneOffset() * 60 * 1000;
    date = new Date(excelDate.getTime() + tzOffset);
  } else {
    // Handle string dates
    date = new Date(dateValue);
  }

  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0]; // Return YYYY-MM-DD
  }

  // Fallback for invalid formats
  console.warn('Invalid date detected during import, falling back to today:', dateValue);
  return new Date().toISOString().split('T')[0];
};

const ones = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan'];
const teens = ['sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas', 'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas'];
const tens = ['', 'sepuluh', 'dua puluh', 'tiga puluh', 'empat puluh', 'lima puluh', 'enam puluh', 'tujuh puluh', 'delapan puluh', 'sembilan puluh'];
const thousands = ['', 'ribu', 'juta', 'miliar', 'triliun'];

const convertThreeDigits = (num: number): string => {
    let str = '';
    const hundred = Math.floor(num / 100);
    const rest = num % 100;

    if (hundred > 0) {
        str += hundred === 1 ? 'seratus' : `${ones[hundred]} ratus`;
    }

    if (rest > 0) {
        str += str ? ' ' : '';
        if (rest < 10) {
            str += ones[rest];
        } else if (rest < 20) {
            str += teens[rest - 10];
        } else {
            const ten = Math.floor(rest / 10);
            const one = rest % 10;
            str += tens[ten];
            if (one > 0) {
                str += ` ${ones[one]}`;
            }
        }
    }
    return str;
};

export const numberToWords = (num: number): string => {
    if (num === 0) return 'nol';

    let words = '';
    let i = 0;

    while (num > 0) {
        if (num % 1000 !== 0) {
            let chunk = num % 1000;
            if (i > 0) {
              if(chunk === 1 && i === 1){ // handle 'seribu'
                words = 'seribu ' + words;
              } else {
                words = `${convertThreeDigits(chunk)} ${thousands[i]} ` + words;
              }
            } else {
              words = convertThreeDigits(chunk) + words;
            }
        }
        num = Math.floor(num / 1000);
        i++;
    }

    return words.trim();
};