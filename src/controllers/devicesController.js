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
        },
        create: {
          deviceId,
          model,
          os,
          osVersion,
          totalDiskSpace,
          freeDiskSpace,
        },
      });
  
 
      const log = await prisma.log.create({
        data: {
          message,
          batteryLevel,
          batteryState,
          syncCount,
          timestamp: timestamp ? new Date(timestamp) : new Date(),
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