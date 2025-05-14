import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function syncDevice(req, res) {
    try {
      const {
        message,
        timestamp,
        os,
        os_version: osVersion,
        model,
        battery_level: batteryLevel,
        battery_state: batteryState,
        free_disk_space: freeDiskSpace,
        total_disk_space: totalDiskSpace,
        device_id: deviceId,
        sync_count: syncCount,
        latitude,
        longitude,
      } = req.body;
  
      // Atualiza ou cria o dispositivo
      const device = await prisma.device.upsert({
        where: { deviceId },
        update: {
          model,
          os,
          osVersion,
          totalDiskSpace,
          freeDiskSpace,
          latitude: latitude || null,
          longitude: longitude || null,
        },
        create: {
          deviceId,
          model,
          os,
          osVersion,
          totalDiskSpace,
          freeDiskSpace,
          latitude: latitude || null,
          longitude: longitude || null,
        },
      });
  
 
      const log = await prisma.log.create({
        data: {
          message,
          batteryLevel,
          batteryState,
          syncCount,
          timestamp: timestamp ? new Date(timestamp) : new Date(),
          latitude: latitude || null,
          longitude: longitude || null,
          device: {
            connect: { id: device.id },
          },
        },
      });
  
      return res.status(200).json({ message: 'Dispositivo sincronizado com sucesso!', device, log });
    } catch (error) {
      console.error('Erro ao sincronizar dispositivo:', error);
      return res.status(500).json({ error: 'Erro ao sincronizar dispositivo' });
    }
  }

export async function listDevices(req, res) {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;
    const take = parseInt(limit);

    const where = search
      ? {
          OR: [
            { model: { contains: search, mode: 'insensitive' } },
            { os: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const devices = await prisma.device.findMany({
      skip,
      take,
      where,
      select: {
        id: true,
        deviceId: true,
        model: true,
        os: true,
        osVersion: true,
        totalDiskSpace: true,
        freeDiskSpace: true,
      },
    });

    const totalDevices = await prisma.device.count({ where });
    const totalPages = Math.ceil(totalDevices / limit);

    return res.status(200).json({
      devices,
      currentPage: parseInt(page),
      totalPages,
      totalDevices,
    });
  } catch (error) {
    console.error('Erro ao listar dispositivos:', error);
    return res.status(500).json({ error: 'Erro ao listar dispositivos' });
  }
}

export async function getDeviceById(req, res) {
  try {
    const { id } = req.params;

    const device = await prisma.device.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        deviceId: true,
        model: true,
        os: true,
        osVersion: true,
        totalDiskSpace: true,
        freeDiskSpace: true,
      },
    });

    if (!device) {
      return res.status(404).json({ error: 'Dispositivo não encontrado' });
    }

    return res.status(200).json(device);
  } catch (error) {
    console.error('Erro ao buscar dispositivo por ID:', error);
    return res.status(500).json({ error: 'Erro ao buscar dispositivo' });
  }
}

// Função para listar os logs de um dispositivo específico
export async function listDeviceLogs(req, res) {
    const { deviceId } = req.params;
  
    try {
      const logs = await prisma.log.findMany({
        where: { deviceId },
        orderBy: { timestamp: 'desc' },
      });
  
      return res.status(200).json(logs);
    } catch (error) {
      console.error('Erro ao listar logs do dispositivo:', error);
      return res.status(500).json({ error: 'Erro ao listar logs do dispositivo' });
    }
  }