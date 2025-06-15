/**
 * @swagger
 * components:
 *   schemas:
 *     DeviceSync:
 *       type: object
 *       properties:
 *         device_id:
 *           type: string
 *           example: "dev123"
 *         model:
 *           type: string
 *           example: "iPhone 12"
 *         os:
 *           type: string
 *           example: "iOS 15.0"
 *         manufacturer:
 *           type: string
 *           example: "Apple"
 *         battery_level:
 *           type: integer
 *           example: 85
 *         total_disk_space:
 *           type: number
 *           example: 128000
 *         free_disk_space:
 *           type: number
 *           example: 64000
 * 
 *     DeviceResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         deviceId:
 *           type: string
 *         model:
 *           type: string
 *         os:
 *           type: string
 *         manufacturer:
 *           type: string
 *         isOnline:
 *           type: boolean
 *         lastSync:
 *           type: string
 *           format: date-time
 * 
 * /api/devices:
 *   get:
 *     tags: [Devices]
 *     summary: Lista todos os dispositivos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Termo para buscar dispositivos
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Itens por página
 *     responses:
 *       200:
 *         description: Lista de dispositivos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 devices:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DeviceResponse'
 * 
 * /api/devices/{id}:
 *   get:
 *     tags: [Devices]
 *     summary: Obtém detalhes de um dispositivo
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalhes do dispositivo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeviceResponse'
 *       404:
 *         description: Dispositivo não encontrado
 * 
 * /api/devices/sync:
 *   post:
 *     tags: [Devices]
 *     summary: Sincroniza um dispositivo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeviceSync'
 *     responses:
 *       200:
 *         description: Dispositivo sincronizado com sucesso
 *       400:
 *         description: Dados inválidos
 * 
 * /api/devices/{deviceId}/logs:
 *   get:
 *     tags: [Devices]
 *     summary: Lista logs do dispositivo
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Logs do dispositivo
 *       404:
 *         description: Dispositivo não encontrado
 * 
 * /api/devices/{deviceId}/details:
 *   get:
 *     tags: [Devices]
 *     summary: Obtém detalhes completos do dispositivo
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalhes completos do dispositivo
 *       404:
 *         description: Dispositivo não encontrado
 * 
 * /api/devices/stats/by-brand:
 *   get:
 *     tags: [Devices]
 *     summary: Estatísticas por marca
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas agrupadas por marca
 * 
 * /api/devices/stats/by-os:
 *   get:
 *     tags: [Devices]
 *     summary: Estatísticas por sistema operacional
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas agrupadas por OS
 * 
 * /api/devices/stats/online:
 *   get:
 *     tags: [Devices]
 *     summary: Total de dispositivos online/offline
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Contagem de dispositivos online e offline
 * 
 * /api/devices/stats/screen-time:
 *   get:
 *     tags: [Devices]
 *     summary: Tempo médio de tela
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tempo médio de uso de tela dos dispositivos
 */