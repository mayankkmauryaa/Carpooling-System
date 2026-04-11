const { PrismaClient } = require('@prisma/client');
const logger = require('../middleware/logger');
const { NotFoundException, BadRequestException } = require('../exceptions');

const prisma = new PrismaClient();

class DeviceService {
  async registerDevice(userId, data) {
    const { token, deviceType, deviceName, appVersion, fcmToken } = data;

    if (!token) {
      throw BadRequestException('Device token is required');
    }

    if (!deviceType) {
      throw BadRequestException('Device type is required (ANDROID, IOS, or WEB)');
    }

    const existing = await prisma.deviceToken.findUnique({
      where: { token }
    });

    if (existing) {
      if (existing.userId !== userId) {
        await prisma.deviceToken.update({
          where: { token },
          data: { userId, isActive: true, lastUsedAt: new Date() }
        });
        logger.info('Device token reassigned', { token: token.substring(0, 20), userId });
      } else {
        await prisma.deviceToken.update({
          where: { token },
          data: { 
            deviceType, 
            deviceName, 
            appVersion, 
            fcmToken: fcmToken || token,
            isActive: true, 
            lastUsedAt: new Date() 
          }
        });
      }
    } else {
      await prisma.deviceToken.create({
        data: {
          userId,
          token,
          deviceType,
          deviceName,
          appVersion,
          fcmToken: fcmToken || token,
          isActive: true,
          lastUsedAt: new Date()
        }
      });
      logger.info('Device token registered', { userId, deviceType });
    }

    return { success: true, message: 'Device registered successfully' };
  }

  async removeDevice(userId, token) {
    if (!token) {
      throw BadRequestException('Token is required');
    }

    const device = await prisma.deviceToken.findFirst({
      where: { token, userId }
    });

    if (!device) {
      throw NotFoundException('Device token not found');
    }

    await prisma.deviceToken.delete({
      where: { id: device.id }
    });

    logger.info('Device token removed', { userId });
    return { success: true, message: 'Device removed successfully' };
  }

  async getUserDevices(userId) {
    const devices = await prisma.deviceToken.findMany({
      where: { userId },
      orderBy: { lastUsedAt: 'desc' },
      select: {
        id: true,
        token: true,
        deviceType: true,
        deviceName: true,
        appVersion: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return devices;
  }

  async deactivateDevice(userId, token) {
    await prisma.deviceToken.updateMany({
      where: { token, userId },
      data: { isActive: false }
    });

    logger.info('Device deactivated', { userId });
    return { success: true, message: 'Device deactivated' };
  }

  async updateLastUsed(userId, token) {
    await prisma.deviceToken.updateMany({
      where: { token, userId },
      data: { lastUsedAt: new Date() }
    });
  }
}

module.exports = new DeviceService();