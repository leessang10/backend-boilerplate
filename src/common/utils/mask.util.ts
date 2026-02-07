/**
 * Mask sensitive information in logs
 */
export class MaskUtil {
  private static readonly SENSITIVE_FIELDS = [
    'password',
    'token',
    'secret',
    'authorization',
    'cookie',
    'api_key',
    'apiKey',
    'accessToken',
    'refreshToken',
    'creditCard',
    'ssn',
  ];

  /**
   * Mask sensitive fields in an object
   */
  static maskObject(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.maskObject(item));
    }

    const masked: any = {};

    for (const [key, value] of Object.entries(obj)) {
      if (this.isSensitiveField(key)) {
        masked[key] = this.maskValue(value);
      } else if (typeof value === 'object') {
        masked[key] = this.maskObject(value);
      } else {
        masked[key] = value;
      }
    }

    return masked;
  }

  /**
   * Check if field name is sensitive
   */
  private static isSensitiveField(fieldName: string): boolean {
    const lowerField = fieldName.toLowerCase();
    return this.SENSITIVE_FIELDS.some((sensitive) =>
      lowerField.includes(sensitive.toLowerCase()),
    );
  }

  /**
   * Mask a value
   */
  private static maskValue(value: any): string {
    if (!value) return '***';

    const strValue = String(value);
    if (strValue.length <= 4) {
      return '***';
    }

    // Show first 2 and last 2 characters
    return `${strValue.substring(0, 2)}***${strValue.substring(strValue.length - 2)}`;
  }

  /**
   * Mask email address
   */
  static maskEmail(email: string): string {
    if (!email || !email.includes('@')) return '***';

    const [localPart, domain] = email.split('@');
    const maskedLocal =
      localPart.length > 2
        ? `${localPart[0]}***${localPart[localPart.length - 1]}`
        : '***';

    return `${maskedLocal}@${domain}`;
  }

  /**
   * Mask phone number
   */
  static maskPhone(phone: string): string {
    if (!phone) return '***';

    const digits = phone.replace(/\D/g, '');
    if (digits.length < 4) return '***';

    return `***${digits.substring(digits.length - 4)}`;
  }
}
