import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse } from '../utils/responseHelper.js';

const prisma = new PrismaClient();

const formatDeviceInput = (data) => ({
  model: data.model,
  os: data.os,
  osVersion: data.os_version,
  sdkVersion: data.sdk_version || null,
  manufacturer: data.manufacturer || null,
  brand: data.brand || null,
  isPhysicalDevice: data.is_physical_device === true,
  totalDiskSpace: data.total_disk_space,
  freeDiskSpace: data.free_disk_space,
  diskUsedPercentage: parseFloatOrNull(data.disk_used_percentage),
  latitude: parseFloatOrNull(data.latitude),
  longitude: parseFloatOrNull(data.longitude),
  lastBatteryLevel: parseInt(data.battery_level) || null,
  lastBatteryState: data.battery_state || null,
  batteryDrainRate: parseFloatOrNull(data.battery_drain_rate),
  connectionType: data.connection_type || null,
  isOnline: data.is_online === true,
  wifiName: data.wifi_name || null,
  totalAppsCount: parseInt(data.total_apps_count) || null,
  systemAppsCount: parseInt(data.system_apps_count) || null,
  userAppsCount: parseInt(data.user_apps_count) || null,
  isDeviceRooted: data.is_device_rooted === true,
  screenTimeMinutes: parseInt(data.screen_time_minutes) || null,
  firstSync: data.firstSync,
  lastSync: new Date(),
});

const formatLogInput = (data, deviceId, message, timestamp) => ({
  message: message || `Device sync at ${timestamp.toISOString()}`,
  syncCount: data.sync_count,
  timestamp,
  batteryLevel: parseInt(data.battery_level) || 0,
  batteryState: data.battery_state || '',
  latitude: parseFloatOrNull(data.latitude),
  longitude: parseFloatOrNull(data.longitude),
  altitude: parseFloatOrNull(data.altitude),
  locationAccuracy: parseFloatOrNull(data.location_accuracy),
  speed: parseFloatOrNull(data.speed),
  freeDiskSpace: data.free_disk_space,
  totalDiskSpace: data.total_disk_space,
  diskUsedPercentage: parseFloatOrNull(data.disk_used_percentage),
  connectionType: data.connection_type,
  wifiName: data.wifi_name,
  wifiSignalStrength: parseInt(data.wifi_signal_strength) || null,
  mobileDataType: data.mobile_data_type,
  device: { connect: { id: deviceId } },
});

export const syncDevice = async (req, res) => {
  try {
    const { message, timestamp, device_id: deviceId, first_sync: firstSyncStr, ...deviceData } = req.body;
    
    const firstSync = firstSyncStr ? new Date(firstSyncStr) : null;
    const timestampDate = timestamp ? new Date(timestamp) : new Date();

    const device = await prisma.device.upsert({
      where: { deviceId },
      update: formatDeviceInput({ ...deviceData, firstSync }),
      create: formatDeviceInput({ ...deviceData, deviceId, firstSync }),
    });

    const log = await prisma.log.create({
      data: formatLogInput(deviceData, device.id, message, timestampDate),
    });

    return successResponse(res, { device, log }, 'Dispositivo sincronizado com sucesso!');
  } catch (error) {
    return errorResponse(res, 'Erro ao sincronizar dispositivo', 500);
  }
};

export const listDevices = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const [skip, take] = [parseInt(page - 1) * parseInt(limit), parseInt(limit)];

    const where = search ? {
      OR: [
        { model: { contains: search, mode: 'insensitive' } },
        { os: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ],
    } : {};

    const [devices, totalDevices] = await Promise.all([
      prisma.device.findMany({
        skip,
        take,
        where,
        select: deviceSelectFields,
        orderBy: { lastSync: 'desc' },
      }),
      prisma.device.count({ where })
    ]);

    return successResponse(res, {
      devices,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalDevices / take),
      totalDevices,
    });
  } catch (error) {
    return errorResponse(res, 'Erro ao listar dispositivos', 500);
  }
};

export const getDeviceById = async (req, res) => {
  try {
    const device = await prisma.device.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { logs: { take: 1, orderBy: { timestamp: 'desc' } } },
    });

    if (!device) return errorResponse(res, 'Dispositivo não encontrado', 404);

    const enhancedDevice = {
      ...device,
      isRecentlySynced: isRecentlySynced(device.lastSync),
    };

    return successResponse(res, enhancedDevice);
  } catch (error) {
    return errorResponse(res, 'Erro ao buscar dispositivo', 500);
  }
};

export const listDeviceLogs = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { limit = 50, page = 1 } = req.query;
    const [skip, take] = [parseInt(page - 1) * parseInt(limit), parseInt(limit)];

    const [logs, totalLogs] = await Promise.all([
      prisma.log.findMany({
        where: { deviceId },
        orderBy: { timestamp: 'desc' },
        skip,
        take,
      }),
      prisma.log.count({ where: { deviceId } })
    ]);

    return successResponse(res, {
      logs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalLogs / take),
        totalLogs,
        limit: take
      }
    });
  } catch (error) {
    return errorResponse(res, 'Erro ao listar logs do dispositivo', 500);
  }
};

export const getDeviceDetails = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const device = await prisma.device.findUnique({ where: { deviceId } });
    
    if (!device) return errorResponse(res, 'Dispositivo não encontrado', 404);

    const [lastLog, batteryStats] = await Promise.all([
      prisma.log.findFirst({
        where: { deviceId },
        orderBy: { timestamp: 'desc' },
      }),
      prisma.log.findMany({
        where: { deviceId },
        orderBy: { timestamp: 'desc' },
        take: 7,
        select: {
          timestamp: true,
          batteryLevel: true,
          batteryState: true,
        },
      }),
    ]);

    const usageStats = await calculateUsageStats(device, deviceId);

    return successResponse(res, {
      ...device,
      lastLog,
      batteryHistory: batteryStats,
      usageStats,
    });
  } catch (error) {
    return errorResponse(res, 'Erro ao obter detalhes do dispositivo', 500);
  }
};

export const devicesByBrand = async (req, res) => {
  try {
    const result = await prisma.device.groupBy({
      by: ['brand'],
      _count: { brand: true }
    });
    return successResponse(res, result);
  } catch (error) {
    return errorResponse(res, 'Erro ao agrupar por marca', 500);
  }
};

export const devicesByOSVersion = async (req, res) => {
  try {
    const result = await prisma.device.groupBy({
      by: ['osVersion'],
      _count: { osVersion: true }
    });
    return successResponse(res, result);
  } catch (error) {
    return errorResponse(res, 'Erro ao agrupar por OS Version', 500);
  }
};

export const devicesOnlineOffline = async (req, res) => {
  try {
    const [online, offline] = await Promise.all([
      prisma.device.count({ where: { isOnline: true } }),
      prisma.device.count({ where: { isOnline: false } })
    ]);
    return successResponse(res, { online, offline });
  } catch (error) {
    return errorResponse(res, 'Erro ao contar dispositivos online/offline', 500);
  }
};

export const averageScreenTime = async (req, res) => {
  try {
    const result = await prisma.device.aggregate({
      _avg: { screenTimeMinutes: true }
    });
    return successResponse(res, { averageScreenTime: result._avg.screenTimeMinutes });
  } catch (error) {
    return errorResponse(res, 'Erro ao calcular tempo médio de tela', 500);
  }
};

const deviceSelectFields = {
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
};

const parseFloatOrNull = value => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
};

const isRecentlySynced = lastSync => 
  lastSync && (new Date().getTime() - lastSync.getTime() < 24 * 60 * 60 * 1000);

const calculateUsageStats = async (device, deviceId) => {
  const totalSyncs = await prisma.log.count({ where: { deviceId } });
  const uptime = device.firstSync
    ? Math.floor((new Date().getTime() - device.firstSync.getTime()) / (24 * 60 * 60 * 1000))
    : 0;
  
  return {
    totalSyncs,
    uptime,
    syncsPerDay: device.firstSync
      ? totalSyncs / (uptime || 1)
      : 0
  };
};