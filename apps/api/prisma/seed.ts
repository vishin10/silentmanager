import { prisma } from "../src/utils/prisma.js";
import { hashPassword, generateDeviceKey, generateStoreAccessToken } from "../src/utils/auth.js";

const run = async () => {
  const email = "test@example.com";
  const password = "Password123!";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Seed user already exists.");
    return;
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(password)
    }
  });

  const storeAccess = generateStoreAccessToken();
  const store = await prisma.store.create({
    data: {
      ownerId: user.id,
      name: "Demo Station",
      timezone: "America/New_York",
      storeAccessTokenHash: storeAccess.storeAccessTokenHash,
      storeAccessTokenLast4: storeAccess.storeAccessTokenLast4,
      storeAccessTokenCreatedAt: new Date()
    }
  });

  const { apiKey, apiKeyHash, apiKeyLast4 } = generateDeviceKey();
  const device = await prisma.device.create({
    data: {
      storeId: store.id,
      name: "Front Office PC",
      apiKeyHash,
      apiKeyLast4
    }
  });

  console.log("Seeded user:", email);
  console.log("Password:", password);
  console.log("Store ID:", store.id);
  console.log("Store Access Token (save this):", storeAccess.storeAccessToken);
  console.log("Device ID:", device.id);
  console.log("Device API key (save this):", apiKey);
};

run()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
