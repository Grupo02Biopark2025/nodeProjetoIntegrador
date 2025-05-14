import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Função para salvar ou atualizar informações do dispositivo
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

// Função para listar todos os dispositivos, sem os logs, somente os dispositivos
export async function listDevices(req, res) {
    try {
      const devices = await prisma.device.findMany({
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
  
      return res.status(200).json(devices);
    } catch (error) {
      console.error('Erro ao listar dispositivos:', error);
      return res.status(500).json({ error: 'Erro ao listar dispositivos' });
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