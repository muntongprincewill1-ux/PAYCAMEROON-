export function isValidCameroonNumber(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    const num = cleaned.startsWith('237') ? cleaned.slice(3) : cleaned;
    if (num.length !== 9) return false;
    return /^[26]/.test(num);
}

export function isMTNNumber(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    const num = cleaned.startsWith('237') ? cleaned.slice(3) : cleaned;
    if (num.length !== 9) return false;
    return /^(65[0-4]|67[0-9]|68[0-3])/.test(num);
}

export function isOrangeNumber(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    const num = cleaned.startsWith('237') ? cleaned.slice(3) : cleaned;
    if (num.length !== 9) return false;
    return /^(65[5-9]|69[0-9])/.test(num);
}

export function isNexttelNumber(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    const num = cleaned.startsWith('237') ? cleaned.slice(3) : cleaned;
    if (num.length !== 9) return false;
    return /^66[0-9]/.test(num);
}

export function isCamtelNumber(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    const num = cleaned.startsWith('237') ? cleaned.slice(3) : cleaned;
    if (num.length !== 9) return false;
    return /^(22|23|24|62)/.test(num);
}

export function getOperator(phone: string): string {
    if (isMTNNumber(phone)) return 'MTN';
    if (isOrangeNumber(phone)) return 'Orange';
    if (isNexttelNumber(phone)) return 'Nexttel';
    if (isCamtelNumber(phone)) return 'Camtel';
    return 'Unknown';
}
