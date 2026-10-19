// Smartwatch and Health Connect integration service
// Supports Web Bluetooth Heart Rate Profile (GATT 0x180D) and Apple Health / Health Connect export

export interface HeartRateData {
  bpm: number;
  timestamp: number;
  zone: 'Riposo' | 'Riscaldamento' | 'Brucia Grassi' | 'Cardio' | 'Picco';
}

export interface HealthWorkoutSummary {
  workoutName: string;
  durationMinutes: number;
  averageBpm: number;
  maxBpm: number;
  totalCalories: number;
  startTime: string;
  endTime: string;
  weightKg: number;
}

class SmartwatchHealthService {
  private bluetoothDevice: any = null;
  private hrCharacteristic: any = null;
  private isConnecting: boolean = false;
  private onHeartRateCallback: ((data: HeartRateData) => void) | null = null;
  private onStatusCallback: ((status: string, isConnected: boolean) => void) | null = null;

  // Check if Web Bluetooth is available on this browser/device
  isBluetoothAvailable(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  // Connect to any Bluetooth Heart Rate device (Apple Watch broadcasting apps, Garmin, Polar, WearOS, Chest Straps)
  async connectHeartRateMonitor(
    onHeartRate: (data: HeartRateData) => void,
    onStatus: (status: string, isConnected: boolean) => void
  ): Promise<boolean> {
    if (!this.isBluetoothAvailable()) {
      onStatus('Web Bluetooth non supportato su questo browser. Prova su Chrome per Android o browser compatibile.', false);
      return false;
    }

    try {
      this.isConnecting = true;
      this.onHeartRateCallback = onHeartRate;
      this.onStatusCallback = onStatus;

      onStatus('Ricerca smartwatch e sensori cardio Bluetooth...', false);

      // Request standard Heart Rate service GATT 0x180D
      const nav = navigator as any;
      const device = await nav.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
        optionalServices: ['battery_service']
      });

      this.bluetoothDevice = device;
      onStatus(`Dispositivo trovato: ${device.name || 'Smartwatch'}. Connessione...`, false);

      device.addEventListener('gattserverdisconnected', () => {
        onStatus('Smartwatch disconnesso.', false);
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('heart_rate');
      const characteristic = await service.getCharacteristic('heart_rate_measurement');

      this.hrCharacteristic = characteristic;

      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        const value = event.target.value;
        const flags = value.getUint8(0);
        let hr = 0;
        if (flags & 0x01) {
          // 16-bit HR
          hr = value.getUint16(1, true);
        } else {
          // 8-bit HR
          hr = value.getUint8(1);
        }

        const zone = this.calculateZone(hr);
        if (this.onHeartRateCallback) {
          this.onHeartRateCallback({
            bpm: hr,
            timestamp: Date.now(),
            zone
          });
        }
      });

      onStatus(`Connesso a ${device.name || 'Smartwatch Cardio'}!`, true);
      this.isConnecting = false;
      return true;
    } catch (err: any) {
      console.warn('Errore connessione Bluetooth Smartwatch:', err);
      this.isConnecting = false;
      onStatus(err.message || 'Connessione annullata o non riuscita.', false);
      return false;
    }
  }

  disconnect() {
    if (this.bluetoothDevice && this.bluetoothDevice.gatt?.connected) {
      this.bluetoothDevice.gatt.disconnect();
    }
    this.bluetoothDevice = null;
    this.hrCharacteristic = null;
  }

  // Calculate training heart rate zone based on standard 220 - age formula (assuming 30y default)
  calculateZone(bpm: number, maxHr: number = 190): HeartRateData['zone'] {
    const percent = (bpm / maxHr) * 100;
    if (percent < 60) return 'Riscaldamento';
    if (percent < 70) return 'Brucia Grassi';
    if (percent < 85) return 'Cardio';
    return 'Picco';
  }

  // Calculate calories burned: Key formula using HR, weight, and duration
  estimateCalories(avgBpm: number, durationMinutes: number, weightKg: number = 75): number {
    if (avgBpm <= 0 || durationMinutes <= 0) return 0;
    // Standard Keytel formula for male gym training
    const calPerMin = (-55.0969 + 0.6309 * avgBpm + 0.1988 * weightKg + 0.2017 * 30) / 4.184;
    return Math.max(0, Math.round(calPerMin * durationMinutes));
  }

  // Generate Apple Health / Health Connect compatible XML/JSON export
  exportToHealthFormat(summary: HealthWorkoutSummary): string {
    return JSON.stringify({
      workoutType: 'TraditionalStrengthTraining',
      source: 'IronTrack Gym Companion',
      durationMinutes: summary.durationMinutes,
      totalEnergyBurnedCalories: summary.totalCalories,
      averageHeartRateBpm: summary.averageBpm,
      maxHeartRateBpm: summary.maxBpm,
      userWeightKg: summary.weightKg,
      startDate: summary.startTime,
      endDate: summary.endTime
    }, null, 2);
  }
}

export const smartwatchHealth = new SmartwatchHealthService();
