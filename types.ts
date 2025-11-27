
// Application flow states
export enum AppState {
  LANGUAGE_SELECT = 'LANGUAGE_SELECT', // New initial state
  INTRO = 'INTRO',
  INTENTION = 'INTENTION',
  PERSONA_SELECT = 'PERSONA_SELECT',
  RITUAL = 'RITUAL',
  ANALYSIS = 'ANALYSIS',
  CHAT = 'CHAT',
}

// Steps within the Ritual phase
export enum RitualStep {
  CONNECT = 0,   // Connect Bluetooth/USB
  SYNC = 1,      // Sync/Calm (Requires Meditation)
  FOCUS = 2,     // Focus Intention (Requires Attention)
  COMMUNION = 3, // New: Connected, receiving whispers, waiting for user to disconnect
  TRANSMIT = 4,  // Processing final result
}

// Chat message structure
export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isStreaming?: boolean;
}

// Selected AI Persona
export type Persona = 'FATHER' | 'MOTHER';

// Language Selection
export type Language = 'en' | 'zh';

// Simulated or Real Brainwave states for visualization
export type BrainwaveState = 'CALM' | 'FOCUS' | 'STRESSED' | 'IDLE' | 'CONNECTING';

// ---------------------------------------------------------
// Web Bluetooth API Type Definitions
// ---------------------------------------------------------

export interface BluetoothRemoteGATTCharacteristic {
    startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
    value?: DataView;
}

export interface BluetoothRemoteGATTService {
    getCharacteristic(characteristic: string | number): Promise<BluetoothRemoteGATTCharacteristic>;
}

export interface BluetoothRemoteGATTServer {
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    connected: boolean;
    device: BluetoothDevice;
    getPrimaryService(service: string | number): Promise<BluetoothRemoteGATTService>;
}

export interface BluetoothDevice {
    id: string;
    name?: string;
    gatt?: BluetoothRemoteGATTServer;
    watchAdvertisements(): Promise<void>;
    unwatchAdvertisements(): void;
    readonly watchingAdvertisements: boolean;
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
}

export interface RequestDeviceOptions {
    filters?: Array<{ name?: string; namePrefix?: string; services?: Array<string | number> }>;
    optionalServices?: Array<string | number>;
    acceptAllDevices?: boolean;
}

// ---------------------------------------------------------
// Web Serial API Type Definitions
// ---------------------------------------------------------

export interface SerialOptions {
    baudRate: number;
    dataBits?: number;
    stopBits?: number;
    parity?: 'none' | 'even' | 'odd';
    bufferSize?: number;
    flowControl?: 'none' | 'hardware';
}

export interface SerialPort {
    open(options: SerialOptions): Promise<void>;
    close(): Promise<void>;
    readable: ReadableStream<Uint8Array> | null;
    writable: WritableStream<Uint8Array> | null;
}

export interface SerialPortRequestOptions {
    filters?: Array<{ usbVendorId?: number; usbProductId?: number }>;
}

// Augment the global Navigator interface
declare global {
    interface Navigator {
        bluetooth: {
            requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
            getAvailability(): Promise<boolean>;
        };
        serial: {
            requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
            getPorts(): Promise<SerialPort[]>;
        }
    }
}
