import bcrypt from 'bcrypt';
import User from '../models/users.js';

interface SeedUser {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'analyst';
}

const defaultSeedUsers: SeedUser[] = [
  {
    name: process.env.DEFAULT_ADMIN_NAME || 'Admin User',
    email: (process.env.DEFAULT_ADMIN_EMAIL || 'admin@kitchen.local').toLowerCase(),
    password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123',
    role: 'admin',
  },
  {
    name: process.env.DEFAULT_ANALYST_NAME || 'Analyst User',
    email: (process.env.DEFAULT_ANALYST_EMAIL || 'analyst@kitchen.local').toLowerCase(),
    password: process.env.DEFAULT_ANALYST_PASSWORD || 'analyst123',
    role: 'analyst',
  },
];

export const ensureDefaultUsers = async () => {
  if (process.env.SEED_DEFAULT_USERS === 'false') {
    return;
  }

  const shouldSyncPasswords =
    process.env.NODE_ENV !== 'production' && process.env.SYNC_DEFAULT_USER_PASSWORDS !== 'false';

  for (const seedUser of defaultSeedUsers) {
    const existingUser = await User.findOne({ email: seedUser.email });

    if (existingUser) {
      let needsSave = false;

      if (existingUser.role !== seedUser.role) {
        existingUser.role = seedUser.role;
        needsSave = true;
      }

      if (existingUser.status !== 'active') {
        existingUser.status = 'active';
        needsSave = true;
      }

      if (shouldSyncPasswords) {
        const isPasswordMatch = await bcrypt.compare(seedUser.password, existingUser.password);
        if (!isPasswordMatch) {
          existingUser.password = await bcrypt.hash(seedUser.password, 10);
          needsSave = true;
        }
      }

      if (needsSave) {
        await existingUser.save();
      }
      continue;
    }

    const hashedPassword = await bcrypt.hash(seedUser.password, 10);

    await User.create({
      name: seedUser.name,
      email: seedUser.email,
      password: hashedPassword,
      role: seedUser.role,
      status: 'active',
    });
  }

  if (process.env.NODE_ENV !== 'production') {
    const [adminSeed, analystSeed] = defaultSeedUsers;

    if (!adminSeed || !analystSeed) {
      return;
    }

    console.log('Seeded default users for local login:');
    console.log(`Admin   -> ${adminSeed.email} / ${adminSeed.password}`);
    console.log(`Analyst -> ${analystSeed.email} / ${analystSeed.password}`);
  }
};
