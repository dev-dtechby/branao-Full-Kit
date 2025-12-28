const { PrismaClient } = require("@prisma/client");

// MySQL ke liye adapter ki zarurat nahi hoti
const prisma = new PrismaClient();

module.exports = prisma;
