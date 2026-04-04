import type { Response } from 'express';
import mongoose from 'mongoose';
import FinanceRecord from '../models/financeRecord.js';
import User from '../models/users.js';
import AnalystPermission from '../models/analystPermission.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

const getRequestedUserId = (value: unknown): string | null => {
  if (!value) {
    return null;
  }

  const normalized = String(value).trim();
  if (!normalized || normalized === 'all') {
    return null;
  }

  return normalized;
};

const toObjectId = (value?: string | null) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) {
    return null;
  }

  return new mongoose.Types.ObjectId(value);
};

const toObjectIdList = (values: string[]) => {
  return values
    .filter((value) => mongoose.Types.ObjectId.isValid(value))
    .map((value) => new mongoose.Types.ObjectId(value));
};

const buildFinanceFilters = (query: AuthRequest['query'], requestedUserId?: string) => {
  const filters: Record<string, unknown> = {};

  if (query.type) filters.type = query.type;
  if (query.category) filters.category = query.category;
  if (query.paymentMethod) filters.paymentMethod = query.paymentMethod;

  if (query.startDate || query.endDate) {
    const dateFilter: Record<string, Date> = {};
    if (query.startDate) dateFilter.$gte = new Date(String(query.startDate));
    if (query.endDate) dateFilter.$lte = new Date(String(query.endDate));
    filters.date = dateFilter;
  }

  const requestedUserObjectId = toObjectId(requestedUserId);

  if (requestedUserObjectId) {
    filters.userId = requestedUserObjectId;
  }

  return filters;
};

const getAccessibleUserIds = async (req: AuthRequest) => {
  if (!req.user) {
    return [] as string[];
  }

  if (req.user.role === 'admin' || req.user.role === 'viewer') {
    const allUsers = await User.find().select('_id');
    return allUsers.map((user) => String(user._id));
  }

  const approvedRequests = await AnalystPermission.find({
    analystId: req.user.id,
    status: 'approved',
  }).select('scope userId');

  if (approvedRequests.some((request) => request.scope === 'all_users')) {
    const allUsers = await User.find().select('_id');
    return allUsers.map((user) => String(user._id));
  }

  const userIds = approvedRequests
    .filter((request) => request.scope === 'single_user' && request.userId)
    .map((request) => String(request.userId));

  return Array.from(new Set(userIds));
};

const buildAccessibleMatchStage = async (req: AuthRequest, requestedUserId?: string) => {
  if (!req.user) {
    return { _id: { $in: [] as string[] } };
  }

  const requestedUserObjectId = toObjectId(requestedUserId);

  if (req.user.role === 'admin' || req.user.role === 'viewer') {
    return requestedUserObjectId ? { userId: requestedUserObjectId } : {};
  }

  const allowedUserIds = await getAccessibleUserIds(req);

  if (allowedUserIds.length === 0) {
    return { _id: { $in: [] as string[] } };
  }

  if (requestedUserId) {
    if (!allowedUserIds.includes(requestedUserId)) {
      return { _id: { $in: [] as string[] } };
    }

    return requestedUserObjectId ? { userId: requestedUserObjectId } : { _id: { $in: [] as string[] } };
  }

  return { userId: { $in: toObjectIdList(allowedUserIds) } };
};

const buildTopSpendings = async (matchStage: Record<string, unknown>, sortDirection: 1 | -1) => {
  return FinanceRecord.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$userId',
        totalExpense: {
          $sum: {
            $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0],
          },
        },
        totalIncome: {
          $sum: {
            $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0],
          },
        },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: 0,
        userId: { $toString: '$_id' },
        name: '$user.name',
        email: '$user.email',
        totalExpense: 1,
        totalIncome: 1,
      },
    },
    { $sort: { totalExpense: sortDirection } },
    { $limit: 5 },
  ]);
};

const buildRecentActivity = async (matchStage: Record<string, unknown>) => {
  return FinanceRecord.aggregate([
    { $match: matchStage },
    { $sort: { createdAt: -1 } },
    { $limit: 8 },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'owner',
      },
    },
    {
      $unwind: {
        path: '$owner',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: { $toString: '$_id' },
        userId: { $toString: '$userId' },
        amount: 1,
        type: 1,
        category: 1,
        date: 1,
        note: 1,
        paymentMethod: 1,
        merchant: 1,
        createdAt: 1,
        updatedAt: 1,
        userName: '$owner.name',
        userEmail: '$owner.email',
      },
    },
  ]);
};

const buildUserBreakdown = async (matchStage: Record<string, unknown>) => {
  return FinanceRecord.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$userId',
        totalIncome: {
          $sum: {
            $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0],
          },
        },
        totalExpense: {
          $sum: {
            $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0],
          },
        },
        totalAmount: { $sum: '$amount' },
        totalRecords: { $sum: 1 },
        averageAmount: { $avg: '$amount' },
        minAmount: { $min: '$amount' },
        maxAmount: { $max: '$amount' },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'owner',
      },
    },
    {
      $unwind: {
        path: '$owner',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 0,
        userId: { $toString: '$_id' },
        name: '$owner.name',
        email: '$owner.email',
        totalIncome: 1,
        totalExpense: 1,
        totalAmount: 1,
        totalRecords: 1,
        averageAmount: 1,
        minAmount: 1,
        maxAmount: 1,
      },
    },
    { $sort: { totalAmount: -1 } },
  ]);
};

const buildAnalyticsPayload = async (req: AuthRequest) => {
  const requestedUserId = getRequestedUserId(req.query.userId);
  const accessMatchStage = await buildAccessibleMatchStage(req, requestedUserId ?? undefined);
  const queryFilters = buildFinanceFilters(req.query, requestedUserId ?? undefined);
  const analyticsMatchStage = { ...accessMatchStage, ...queryFilters };
  const accessibleUserIds = await getAccessibleUserIds(req);
  const isViewer = req.user?.role === 'viewer';
  const isAdmin = req.user?.role === 'admin';
  const isAnalyst = req.user?.role === 'analyst';
  const hasAccess = isAdmin || isViewer || accessibleUserIds.length > 0;

  if (!hasAccess) {
    return {
      summary: {
        totalIncome: 0,
        totalExpense: 0,
        totalRecords: 0,
        netBalance: 0,
        totalUsers: 0,
      },
      byType: [],
      byCategory: [],
      monthlyTrends: [],
      recentActivity: [],
      topSpenders: [],
      lowestSpenders: [],
      permissionRequired: true,
      accessScope: 'none' as const,
    };
  }

  const [summary, byType, byCategory, topSpenders, lowestSpenders] = await Promise.all([
    FinanceRecord.aggregate([
      { $match: analyticsMatchStage },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0],
            },
          },
          totalExpense: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0],
            },
          },
          totalRecords: { $sum: 1 },
          averageAmount: { $avg: '$amount' },
          minAmount: { $min: '$amount' },
          maxAmount: { $max: '$amount' },
        },
      },
    ]),
    FinanceRecord.aggregate([
      { $match: analyticsMatchStage },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]),
    FinanceRecord.aggregate([
      { $match: analyticsMatchStage },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]),
    buildTopSpendings(analyticsMatchStage, -1),
    buildTopSpendings(analyticsMatchStage, 1),
  ]);

  const userBreakdown = await buildUserBreakdown(analyticsMatchStage);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyTrends = await FinanceRecord.aggregate([
    {
      $match: {
        ...analyticsMatchStage,
        date: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          type: '$type',
        },
        totalAmount: { $sum: '$amount' },
      },
    },
    {
      $group: {
        _id: {
          year: '$_id.year',
          month: '$_id.month',
        },
        income: {
          $sum: {
            $cond: [{ $eq: ['$_id.type', 'income'] }, '$totalAmount', 0],
          },
        },
        expense: {
          $sum: {
            $cond: [{ $eq: ['$_id.type', 'expense'] }, '$totalAmount', 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        year: '$_id.year',
        month: '$_id.month',
        income: 1,
        expense: 1,
        net: { $subtract: ['$income', '$expense'] },
      },
    },
    { $sort: { year: -1, month: -1 } },
  ]);

  const recentActivity = await buildRecentActivity(analyticsMatchStage);
  const totalUsers = requestedUserId ? 1 : isAdmin || isViewer ? await User.countDocuments({}) : accessibleUserIds.length;

  return {
    summary: {
      totalIncome: summary?.[0]?.totalIncome ?? 0,
      totalExpense: summary?.[0]?.totalExpense ?? 0,
      totalRecords: summary?.[0]?.totalRecords ?? 0,
      netBalance: (summary?.[0]?.totalIncome ?? 0) - (summary?.[0]?.totalExpense ?? 0),
      totalUsers,
      averageAmount: summary?.[0]?.averageAmount ?? 0,
      minAmount: summary?.[0]?.minAmount ?? 0,
      maxAmount: summary?.[0]?.maxAmount ?? 0,
    },
    byType,
    byCategory,
    monthlyTrends,
    recentActivity,
    topSpenders,
    lowestSpenders,
    userBreakdown,
    permissionRequired: isAnalyst && !hasAccess,
    accessScope: isAdmin || isViewer ? 'all' : 'permitted',
  };
};

export const createFinanceRecord = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create finance records' });
    }

    const { amount, type, category, date, note, paymentMethod, merchant, userId } = req.body;

    if (
      amount === undefined ||
      !type ||
      !category ||
      !date ||
      !paymentMethod ||
      !merchant
    ) {
      return res.status(400).json({ message: 'Missing required finance fields' });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    const ownerId = userId ? String(userId) : req.user.id;
    const owner = await User.findById(ownerId).select('_id');

    if (!owner) {
      return res.status(404).json({ message: 'Target user not found' });
    }

    const financeRecord = await FinanceRecord.create({
      userId: owner._id,
      amount,
      type,
      category,
      date,
      note,
      paymentMethod,
      merchant,
    });

    res.status(201).json(financeRecord);
  } catch (error) {
    res.status(500).json({ message: 'Error creating finance record', error });
  }
};

export const getAllFinanceRecords = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'analyst') {
      return res.status(403).json({ message: 'Only admins and analysts can view finance records' });
    }

    const requestedUserId = getRequestedUserId(req.query.userId);
    const filters = buildFinanceFilters(req.query, req.user.role === 'admin' ? requestedUserId ?? undefined : undefined);
    const accessibleUserIds = await getAccessibleUserIds(req);

    if (req.user.role === 'analyst' && accessibleUserIds.length === 0) {
      return res.status(403).json({
        message: 'Data access permission required',
        permissionRequired: true,
      });
    }

    if (requestedUserId) {
      const targetUser = await User.findById(requestedUserId).select('_id');

      if (!targetUser) {
        return res.status(404).json({ message: 'Target user not found' });
      }

      if (req.user.role === 'analyst' && !accessibleUserIds.includes(requestedUserId)) {
        return res.status(403).json({
          message: 'You do not have permission to view this user records',
          permissionRequired: true,
        });
      }
    }

    const records = await FinanceRecord.find({
      ...filters,
      ...(req.user.role === 'admin'
        ? {}
        : requestedUserId
          ? { userId: requestedUserId }
          : { userId: { $in: accessibleUserIds } }),
    }).sort({ createdAt: -1 });

    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching finance records', error });
  }
};

export const getFinanceAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const payload = await buildAnalyticsPayload(req);
    res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching finance analytics', error });
  }
};

export const getMyFinanceRecords = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const filters = buildFinanceFilters(req.query);
    const records = await FinanceRecord.find({ userId: req.user.id, ...filters }).sort({ createdAt: -1 });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching your finance records', error });
  }
};

export const updateFinanceRecord = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update finance records' });
    }

    const { id } = req.params;
    const existingRecord = await FinanceRecord.findById(id);

    if (!existingRecord) {
      return res.status(404).json({ message: 'Finance record not found' });
    }

    const updatePayload = { ...req.body } as Record<string, unknown>;
    delete updatePayload.userId;

    const updatedRecord = await FinanceRecord.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });

    res.status(200).json(updatedRecord);
  } catch (error) {
    res.status(500).json({ message: 'Error updating finance record', error });
  }
};

export const deleteFinanceRecord = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete finance records' });
    }

    const { id } = req.params;
    const existingRecord = await FinanceRecord.findById(id);

    if (!existingRecord) {
      return res.status(404).json({ message: 'Finance record not found' });
    }

    await FinanceRecord.findByIdAndDelete(id);

    res.status(200).json({ message: 'Finance record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting finance record', error });
  }
};