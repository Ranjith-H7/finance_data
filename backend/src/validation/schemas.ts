import { z } from 'zod';

const userRoleSchema = z.enum(['viewer', 'analyst', 'admin']);
const userStatusSchema = z.enum(['active', 'inactive']);

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerBodySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export const createUserBodySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: userRoleSchema.optional(),
  status: userStatusSchema.optional(),
});

export const updateUserBodySchema = z.object({
  role: userRoleSchema.optional(),
  status: userStatusSchema.optional(),
}).refine((value) => value.role !== undefined || value.status !== undefined, {
  message: 'At least one of role or status must be provided',
});

export const mongoIdParamSchema = z.object({
  id: z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id format'),
});

export const financeBodySchema = z.object({
  userId: z.string().regex(/^[a-f0-9]{24}$/i).optional(),
  amount: z.coerce.number().positive(),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1),
  date: z.string().min(1),
  note: z.string().optional(),
  paymentMethod: z.enum(['UPI', 'CASH', 'CARD']),
  merchant: z.string().min(1),
});

export const financeQuerySchema = z.object({
  userId: z.string().optional(),
  type: z.enum(['income', 'expense']).optional(),
  category: z.string().optional(),
  paymentMethod: z.enum(['UPI', 'CASH', 'CARD']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['createdAt', 'date', 'amount', 'category', 'type']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
}).passthrough();

export const permissionRequestBodySchema = z.object({
  scope: z.enum(['single_user', 'all_users']),
  userId: z.string().optional(),
  reason: z.string().optional(),
}).refine((value) => value.scope === 'all_users' || Boolean(value.userId), {
  message: 'userId is required for single_user scope',
  path: ['userId'],
});

export const permissionReviewBodySchema = z.object({
  status: z.enum(['approved', 'rejected']),
});
