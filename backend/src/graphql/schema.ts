import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import type { Application } from 'express';
import express from 'express';
import mongoose from 'mongoose';
import { protect } from '../middleware/authMiddleware.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import FinanceRecord from '../models/financeRecord.js';
import User from '../models/users.js';
import { getFinanceAnalyticsPayload } from '../controllers/financeController.js';
import AnalystPermission from '../models/analystPermission.js';

interface GraphQLContext {
  req: AuthRequest;
}

const typeDefs = `#graphql
  type UserBasic {
    userId: String!
    name: String
    email: String
  }

  type DashboardSummary {
    totalIncome: Float!
    totalExpense: Float!
    netBalance: Float!
    totalRecords: Int!
    totalUsers: Int!
    averageAmount: Float!
    minAmount: Float!
    maxAmount: Float!
  }

  type FinanceNode {
    id: String!
    userId: String!
    category: String!
    type: String!
    amount: Float!
    date: String!
    note: String
    paymentMethod: String!
    merchant: String!
  }

  type FinancePage {
    data: [FinanceNode!]!
    page: Int!
    limit: Int!
    total: Int!
    totalPages: Int!
  }

  type Query {
    dashboardSummary(userId: String): DashboardSummary!
    accessibleUsers: [UserBasic!]!
    financeRecords(page: Int = 1, limit: Int = 20, userId: String): FinancePage!
  }
`;

const getAllowedUserIds = async (req: AuthRequest) => {
  if (!req.user) {
    return [] as string[];
  }

  if (req.user.role === 'admin' || req.user.role === 'viewer') {
    const allUsers = await User.find().select('_id');
    return allUsers.map((entry) => String(entry._id));
  }

  const approved = await AnalystPermission.find({ analystId: req.user.id, status: 'approved' }).select('scope userId');
  if (approved.some((entry) => entry.scope === 'all_users')) {
    const allUsers = await User.find().select('_id');
    return allUsers.map((entry) => String(entry._id));
  }

  return Array.from(
    new Set(
      approved
        .filter((entry) => entry.scope === 'single_user' && entry.userId)
        .map((entry) => String(entry.userId))
    )
  );
};

const resolvers = {
  Query: {
    dashboardSummary: async (_parent: unknown, args: { userId?: string }, context: GraphQLContext) => {
      const analytics = await getFinanceAnalyticsPayload({
        ...context.req,
        query: {
          ...context.req.query,
          ...(args.userId ? { userId: args.userId } : {}),
        },
      } as AuthRequest);

      return analytics.summary;
    },
    accessibleUsers: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      const allowedUserIds = await getAllowedUserIds(context.req);
      if (allowedUserIds.length === 0) {
        return [];
      }

      const users = await User.find({ _id: { $in: allowedUserIds.map((id) => new mongoose.Types.ObjectId(id)) } })
        .select('_id name email')
        .sort({ name: 1 });

      return users.map((item) => ({ userId: String(item._id), name: item.name, email: item.email }));
    },
    financeRecords: async (
      _parent: unknown,
      args: { page?: number; limit?: number; userId?: string },
      context: GraphQLContext
    ) => {
      const page = Math.max(1, args.page ?? 1);
      const limit = Math.min(100, Math.max(1, args.limit ?? 20));
      const skip = (page - 1) * limit;

      const allowedUserIds = await getAllowedUserIds(context.req);
      if (allowedUserIds.length === 0) {
        return { data: [], page, limit, total: 0, totalPages: 0 };
      }

      let userScope = allowedUserIds;
      if (args.userId) {
        userScope = allowedUserIds.includes(args.userId) ? [args.userId] : [];
      }

      const query = { userId: { $in: userScope.map((id) => new mongoose.Types.ObjectId(id)) } };
      const [records, total] = await Promise.all([
        FinanceRecord.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
        FinanceRecord.countDocuments(query),
      ]);

      return {
        data: records.map((record) => ({
          id: String(record._id),
          userId: String(record.userId),
          category: record.category,
          type: record.type,
          amount: record.amount,
          date: record.date.toISOString(),
          note: record.note,
          paymentMethod: record.paymentMethod,
          merchant: record.merchant,
        })),
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      };
    },
  },
};

export const attachGraphQL = async (app: Application) => {
  const server = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    csrfPrevention: false,
  });
  await server.start();

  app.use('/api/graphql', protect, express.json(), expressMiddleware(server, {
    context: async ({ req }) => ({ req: req as AuthRequest }),
  }));
};
