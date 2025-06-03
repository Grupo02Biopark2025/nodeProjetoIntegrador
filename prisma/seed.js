import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.device.createMany({
    data: [
      { deviceId: 'a1', model: 'Galaxy S21', manufacturer: 'Samsung', brand: 'Samsung', os: 'Android', osVersion: '13', isOnline: true, screenTimeMinutes: 230, totalDiskSpace: '128GB', freeDiskSpace: '32GB' },
      { deviceId: 'a2', model: 'iPhone 12', manufacturer: 'Apple', brand: 'Apple', os: 'iOS', osVersion: '17', isOnline: false, screenTimeMinutes: 142, totalDiskSpace: '128GB', freeDiskSpace: '48GB' },
      { deviceId: 'a3', model: 'Moto G8', manufacturer: 'Motorola', brand: 'Motorola', os: 'Android', osVersion: '11', isOnline: true, screenTimeMinutes: 58, totalDiskSpace: '64GB', freeDiskSpace: '10GB' },
      { deviceId: 'a4', model: 'Redmi Note 10', manufacturer: 'Xiaomi', brand: 'Xiaomi', os: 'Android', osVersion: '13', isOnline: false, screenTimeMinutes: 110, totalDiskSpace: '128GB', freeDiskSpace: '64GB' },
      { deviceId: 'a5', model: 'Galaxy A32', manufacturer: 'Samsung', brand: 'Samsung', os: 'Android', osVersion: '12', isOnline: true, screenTimeMinutes: 120, totalDiskSpace: '64GB', freeDiskSpace: '15GB' },
      { deviceId: 'a6', model: 'iPhone 13', manufacturer: 'Apple', brand: 'Apple', os: 'iOS', osVersion: '16', isOnline: true, screenTimeMinutes: 210, totalDiskSpace: '256GB', freeDiskSpace: '128GB' },
      { deviceId: 'a7', model: 'Galaxy S20', manufacturer: 'Samsung', brand: 'Samsung', os: 'Android', osVersion: '11', isOnline: false, screenTimeMinutes: 60, totalDiskSpace: '128GB', freeDiskSpace: '90GB' },
      { deviceId: 'a8', model: 'Moto G7', manufacturer: 'Motorola', brand: 'Motorola', os: 'Android', osVersion: '10', isOnline: true, screenTimeMinutes: 30, totalDiskSpace: '64GB', freeDiskSpace: '5GB' },
      { deviceId: 'a9', model: 'Redmi Note 8', manufacturer: 'Xiaomi', brand: 'Xiaomi', os: 'Android', osVersion: '12', isOnline: true, screenTimeMinutes: 75, totalDiskSpace: '64GB', freeDiskSpace: '22GB' },
      { deviceId: 'a10', model: 'Galaxy S22', manufacturer: 'Samsung', brand: 'Samsung', os: 'Android', osVersion: '14', isOnline: true, screenTimeMinutes: 300, totalDiskSpace: '256GB', freeDiskSpace: '100GB' },
      { deviceId: 'a11', model: 'iPhone 14', manufacturer: 'Apple', brand: 'Apple', os: 'iOS', osVersion: '17', isOnline: false, screenTimeMinutes: 180, totalDiskSpace: '128GB', freeDiskSpace: '60GB' },
      { deviceId: 'a12', model: 'Moto G9', manufacturer: 'Motorola', brand: 'Motorola', os: 'Android', osVersion: '12', isOnline: true, screenTimeMinutes: 88, totalDiskSpace: '128GB', freeDiskSpace: '25GB' },
      { deviceId: 'a13', model: 'Redmi Note 9', manufacturer: 'Xiaomi', brand: 'Xiaomi', os: 'Android', osVersion: '13', isOnline: false, screenTimeMinutes: 115, totalDiskSpace: '128GB', freeDiskSpace: '50GB' },
      { deviceId: 'a14', model: 'Galaxy A52', manufacturer: 'Samsung', brand: 'Samsung', os: 'Android', osVersion: '13', isOnline: true, screenTimeMinutes: 240, totalDiskSpace: '128GB', freeDiskSpace: '40GB' },
      { deviceId: 'a15', model: 'iPhone SE', manufacturer: 'Apple', brand: 'Apple', os: 'iOS', osVersion: '15', isOnline: false, screenTimeMinutes: 90, totalDiskSpace: '64GB', freeDiskSpace: '20GB' },
      { deviceId: 'a16', model: 'Moto G10', manufacturer: 'Motorola', brand: 'Motorola', os: 'Android', osVersion: '11', isOnline: true, screenTimeMinutes: 44, totalDiskSpace: '128GB', freeDiskSpace: '66GB' },
      { deviceId: 'a17', model: 'Redmi 10', manufacturer: 'Xiaomi', brand: 'Xiaomi', os: 'Android', osVersion: '12', isOnline: true, screenTimeMinutes: 100, totalDiskSpace: '64GB', freeDiskSpace: '11GB' },
      { deviceId: 'a18', model: 'Galaxy A12', manufacturer: 'Samsung', brand: 'Samsung', os: 'Android', osVersion: '12', isOnline: false, screenTimeMinutes: 70, totalDiskSpace: '64GB', freeDiskSpace: '30GB' },
      { deviceId: 'a19', model: 'iPhone XR', manufacturer: 'Apple', brand: 'Apple', os: 'iOS', osVersion: '16', isOnline: true, screenTimeMinutes: 105, totalDiskSpace: '64GB', freeDiskSpace: '12GB' },
      { deviceId: 'a20', model: 'Moto G6', manufacturer: 'Motorola', brand: 'Motorola', os: 'Android', osVersion: '9', isOnline: false, screenTimeMinutes: 35, totalDiskSpace: '32GB', freeDiskSpace: '3GB' },
    ]
  });
}

main()
  .then(() => {
    console.log('Muitos dispositivos inseridos!');
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
