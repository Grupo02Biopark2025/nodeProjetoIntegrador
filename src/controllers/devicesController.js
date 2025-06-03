import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function syncDevice(req, res) {
    try {
      const {
        message,
        timestamp,
        model,
        os,
        os_version: osVersion,
        sdk_version: sdkVersion,
        manufacturer,
        brand,
        is_physical_device: isPhysicalDevice,
        free_disk_space: freeDiskSpace,
        total_disk_space: totalDiskSpace,
        disk_used_percentage: diskUsedPercentage,
        battery_level: batteryLevel,
        battery_state: batteryState,
        battery_drain_rate: batteryDrainRate,
        latitude,
        longitude,
        altitude,
        location_accuracy: locationAccuracy,
        speed,
        connection_type: connectionType,
        is_online: isOnline,
        wifi_name: wifiName,
        wifi_signal_strength: wifiSignalStrength,
        mobile_data_type: mobileDataType,
        total_apps_count: totalAppsCount,
        system_apps_count: systemAppsCount,
        user_apps_count: userAppsCount,
        is_device_rooted: isDeviceRooted,
        screen_time_minutes: screenTimeMinutes,
        device_id: deviceId,
        sync_count: syncCount,
        first_sync: firstSyncStr,
      } = req.body;
      
      const firstSync = firstSyncStr ? new Date(firstSyncStr) : null;
      const timestampDate = timestamp ? new Date(timestamp) : new Date();
  
      // Atualiza ou cria o dispositivo
      const device = await prisma.device.upsert({
        where: { deviceId },
        update: {
          model,
          os,
          osVersion,
          sdkVersion,
          manufacturer,
          brand,
          isPhysicalDevice: isPhysicalDevice === true,
          totalDiskSpace,
          freeDiskSpace,
          diskUsedPercentage: parseFloatOrNull(diskUsedPercentage),
          latitude: parseFloatOrNull(latitude),
          longitude: parseFloatOrNull(longitude),
          lastBatteryLevel: parseInt(batteryLevel) || null,
          lastBatteryState: batteryState || null,
          batteryDrainRate: parseFloatOrNull(batteryDrainRate),
          connectionType,
          isOnline: isOnline === true,
          wifiName,
          totalAppsCount: parseInt(totalAppsCount) || null,
          systemAppsCount: parseInt(systemAppsCount) || null,
          userAppsCount: parseInt(userAppsCount) || null,
          isDeviceRooted: isDeviceRooted === true,
          screenTimeMinutes: parseInt(screenTimeMinutes) || null,
          firstSync,
          lastSync: new Date(),
        },
        create: {
          // Informações básicas e obrigatórias
          deviceId,
          model,
          os,
          osVersion,
          totalDiskSpace,
          freeDiskSpace,
          
          // Campos opcionais
          sdkVersion: sdkVersion || null,
          manufacturer: manufacturer || null,
          brand: brand || null,
          isPhysicalDevice: isPhysicalDevice === true,
          
          // Armazenamento
          diskUsedPercentage: parseFloatOrNull(diskUsedPercentage),
          
          // Localização
          latitude: parseFloatOrNull(latitude),
          longitude: parseFloatOrNull(longitude),
          
          // Bateria
          lastBatteryLevel: parseInt(batteryLevel) || null,
          lastBatteryState: batteryState || null,
          batteryDrainRate: parseFloatOrNull(batteryDrainRate),
          
          // Conectividade
          connectionType: connectionType || null,
          isOnline: isOnline === true,
          wifiName: wifiName || null,
          
          // Aplicativos
          totalAppsCount: parseInt(totalAppsCount) || null,
          systemAppsCount: parseInt(systemAppsCount) || null,
          userAppsCount: parseInt(userAppsCount) || null,
          
          // Segurança
          isDeviceRooted: isDeviceRooted === true,
          
          // Tempo de tela
          screenTimeMinutes: parseInt(screenTimeMinutes) || null,
          
          // Timestamps
          firstSync,
          lastSync: new Date(),
        },
      });
  
      const log = await prisma.log.create({
        data: {
          message: message || `Device sync at ${timestampDate.toISOString()}`,
          
          // Sincronização
          syncCount,
          timestamp: timestampDate,
          
          // Bateria
          batteryLevel: parseInt(batteryLevel) || 0,
          batteryState: batteryState || '',
          
          // Localização
          latitude: parseFloatOrNull(latitude),
          longitude: parseFloatOrNull(longitude),
          altitude: parseFloatOrNull(altitude),
          locationAccuracy: parseFloatOrNull(locationAccuracy),
          speed: parseFloatOrNull(speed),
          
          // Armazenamento
          freeDiskSpace,
          totalDiskSpace,
          diskUsedPercentage: parseFloatOrNull(diskUsedPercentage),
          
          // Conectividade
          connectionType,
          wifiName,
          wifiSignalStrength: parseInt(wifiSignalStrength) || null,
          mobileDataType,
          
          // Relação com o dispositivo
          device: {
            connect: { id: device.id },
          },
        },
      });
  
      return res.status(200).json({ 
        message: 'Dispositivo sincronizado com sucesso!', 
        device, 
        log 
      });
    } catch (error) {
      console.error('Erro ao sincronizar dispositivo:', error);
      return res.status(500).json({ error: 'Erro ao sincronizar dispositivo', details: error.message });
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
            { manufacturer: { contains: search, mode: 'insensitive' } },
            { brand: { contains: search, mode: 'insensitive' } },
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
        manufacturer: true,
        brand: true,
        os: true,
        osVersion: true,
        totalDiskSpace: true,
        freeDiskSpace: true,
        isOnline: true,
        lastSync: true,
        lastBatteryLevel: true,
        isDeviceRooted: true,
        latitude: true,
        longitude: true,
      },
      orderBy: {
        lastSync: 'desc',
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
      include: {
        logs: {
          take: 1, 
          orderBy: {
            timestamp: 'desc',
          },
        },
      },
    });

    if (!device) {
      return res.status(404).json({ error: 'Dispositivo não encontrado' });
    }

    const enhancedDevice = {
      ...device,
      isRecentlySynced: device.lastSync && 
        (new Date().getTime() - device.lastSync.getTime() < 24 * 60 * 60 * 1000),
    };

    return res.status(200).json(enhancedDevice);
  } catch (error) {
    console.error('Erro ao buscar dispositivo por ID:', error);
    return res.status(500).json({ error: 'Erro ao buscar dispositivo' });
  }
}

// Função para listar os logs de um dispositivo específico
export async function listDeviceLogs(req, res) {
  const { deviceId } = req.params;
  const { limit = 50, page = 1 } = req.query;
  
  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    const logs = await prisma.log.findMany({
      where: { deviceId },
      orderBy: { timestamp: 'desc' },
      skip,
      take,
    });

    const totalLogs = await prisma.log.count({
      where: { deviceId }
    });
    
    const totalPages = Math.ceil(totalLogs / take);

    return res.status(200).json({
      logs,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalLogs,
        limit: take
      }
    });
  } catch (error) {
    console.error('Erro ao listar logs do dispositivo:', error);
    return res.status(500).json({ error: 'Erro ao listar logs do dispositivo' });
  }
}

export async function getDeviceDetails(req, res) {
  try {
    const { deviceId } = req.params;
    
    const device = await prisma.device.findUnique({
      where: { deviceId },
    });
    
    if (!device) {
      return res.status(404).json({ error: 'Dispositivo não encontrado' });
    }
    
    const lastLog = await prisma.log.findFirst({
      where: { deviceId },
      orderBy: { timestamp: 'desc' },
    });
    
    const batteryStats = await prisma.log.findMany({
      where: { deviceId },
      orderBy: { timestamp: 'desc' },
      take: 7,
      select: {
        timestamp: true,
        batteryLevel: true,
        batteryState: true,
      },
    });
    
    const usageStats = {
      totalSyncs: await prisma.log.count({ where: { deviceId } }),
      
      uptime: device.firstSync 
        ? Math.floor((new Date().getTime() - device.firstSync.getTime()) / (24 * 60 * 60 * 1000)) 
        : 0,
      
      syncsPerDay: device.firstSync && device.firstSync.getTime() < new Date().getTime()
        ? (await prisma.log.count({ where: { deviceId } })) / 
          (Math.floor((new Date().getTime() - device.firstSync.getTime()) / (24 * 60 * 60 * 1000)) || 1)
        : 0,
    };
    
    const deviceDetails = {
      ...device,
      lastLog,
      batteryHistory: batteryStats,
      usageStats,
    };
    
    return res.status(200).json(deviceDetails);
  } catch (error) {
    console.error('Erro ao obter detalhes do dispositivo:', error);
    return res.status(500).json({ error: 'Erro ao obter detalhes do dispositivo' });
  }
}

function parseFloatOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

// 1. Dispositivos por Marca (Brand)
export async function devicesByBrand(req, res) {
  try {
    const result = await prisma.device.groupBy({
      by: ['brand'],
      _count: { brand: true }
    });
    res.status(200).json(result);
  } catch (error) {
    console.error('Erro ao agrupar por marca:', error);
    res.status(500).json({ error: 'Erro ao agrupar por marca' });
  }
}

// 2. Dispositivos por versão do OS (osVersion)
export async function devicesByOSVersion(req, res) {
  try {
    const result = await prisma.device.groupBy({
      by: ['osVersion'],
      _count: { osVersion: true }
    });
    res.status(200).json(result);
  } catch (error) {
    console.error('Erro ao agrupar por OS Version:', error);
    res.status(500).json({ error: 'Erro ao agrupar por OS Version' });
  }
}

// 3. Dispositivos ativos (isOnline)
export async function devicesOnlineOffline(req, res) {
  try {
    const online = await prisma.device.count({ where: { isOnline: true } });
    const offline = await prisma.device.count({ where: { isOnline: false } });
    res.status(200).json({ online, offline });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao contar dispositivos online/offline' });
  }
}


// 4. Tempo de Tela Médio (screenTimeMinutes)
export async function averageScreenTime(req, res) {
  try {
    const result = await prisma.device.aggregate({
      _avg: { screenTimeMinutes: true }
    });
    res.status(200).json({ averageScreenTime: result._avg.screenTimeMinutes });
  } catch (error) {
    console.error('Erro ao calcular tempo médio de tela:', error);
    res.status(500).json({ error: 'Erro ao calcular tempo médio de tela' });
  }
}