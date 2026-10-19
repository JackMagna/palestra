/**
 * Frequenza cardiaca via Web Bluetooth (profilo standard Heart Rate, 0x180D).
 * Funziona con fasce cardio e con gli orologi che "trasmettono" la frequenza
 * (es. Garmin, Polar, Coros). Supportato da Chrome su Android e desktop;
 * non da Safari/iPhone. L'Apple Watch non trasmette la frequenza in Bluetooth.
 */

/* Tipi minimi: Web Bluetooth non è ancora nei tipi DOM di TypeScript */
interface BTCharacteristic extends EventTarget {
  value?: DataView;
  startNotifications(): Promise<BTCharacteristic>;
}
interface BTDevice extends EventTarget {
  name?: string;
  gatt?: {
    connected: boolean;
    connect(): Promise<{ getPrimaryService(s: string): Promise<{ getCharacteristic(c: string): Promise<BTCharacteristic> }> }>;
    disconnect(): void;
  };
}
interface BluetoothNavigator {
  bluetooth?: { requestDevice(opts: unknown): Promise<BTDevice> };
}

export function isHeartRateSupported(): boolean {
  return typeof navigator !== 'undefined' && !!(navigator as unknown as BluetoothNavigator).bluetooth;
}

export function parseHeartRate(view: DataView): number {
  const flags = view.getUint8(0);
  return flags & 0x01 ? view.getUint16(1, true) : view.getUint8(1);
}

export interface HeartRateConnection {
  deviceName: string;
  disconnect(): void;
}

export async function connectHeartRate(
  onBpm: (bpm: number) => void,
  onDisconnect: () => void
): Promise<HeartRateConnection> {
  const bt = (navigator as unknown as BluetoothNavigator).bluetooth;
  if (!bt) throw new Error('Questo browser non supporta il Bluetooth. Usa Chrome su Android o su computer.');

  const device = await bt.requestDevice({ filters: [{ services: ['heart_rate'] }] });
  if (!device.gatt) throw new Error('Il dispositivo non espone il servizio frequenza cardiaca.');

  device.addEventListener('gattserverdisconnected', onDisconnect);
  const server = await device.gatt.connect();
  const service = await server.getPrimaryService('heart_rate');
  const characteristic = await service.getCharacteristic('heart_rate_measurement');
  await characteristic.startNotifications();
  characteristic.addEventListener('characteristicvaluechanged', () => {
    if (characteristic.value) onBpm(parseHeartRate(characteristic.value));
  });

  return {
    deviceName: device.name || 'Sensore cardio',
    disconnect() {
      device.removeEventListener('gattserverdisconnected', onDisconnect);
      if (device.gatt?.connected) device.gatt.disconnect();
    }
  };
}
