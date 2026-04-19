import { Request, Response, NextFunction } from 'express';

export interface ValidationSchema {
  [key: string]: {
    type: 'string' | 'email' | 'password' | 'number';
    required?: boolean;
    minLength?: number;
    maxLength?: number;
  };
}

export const loginSchema: ValidationSchema = {
  email: {
    type: 'email',
    required: true,
  },
  password: {
    type: 'password',
    required: true,
    minLength: 6,
  },
};

export const registerSchema: ValidationSchema = {
  email: {
    type: 'email',
    required: true,
  },
  password: {
    type: 'password',
    required: true,
    minLength: 6,
  },
  firstName: {
    type: 'string',
    required: true,
    minLength: 1,
    maxLength: 50,
  },
  lastName: {
    type: 'string',
    required: true,
    minLength: 1,
    maxLength: 50,
  },
};

export const validateRequest = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];

      if (rules.required && (!value || value.trim() === '')) {
        errors.push(`${field} is required`);
        continue;
      }

      if (value && rules.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push(`${field} must be a valid email`);
        }
      }

      if (value && rules.type === 'password') {
        if (value.length < (rules.minLength || 6)) {
          errors.push(`${field} must be at least ${rules.minLength || 6} characters long`);
        }
      }

      if (value && rules.type === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters long`);
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${field} must be no more than ${rules.maxLength} characters long`);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: errors.join(', '),
      });
    }

    return next();
  };
};
