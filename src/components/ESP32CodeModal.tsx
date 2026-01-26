import { useState } from 'react';
import { Code, Copy, Check, X } from 'lucide-react';
import { Button } from './ui/button';

const ESP32_CODE = `#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <driver/i2s.h>
#include <math.h>

// ================= BLE =================
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

BLEServer* pServer = NULL;
BLECharacteristic* pCharacteristic = NULL;
bool deviceConnected = false;

// ================= I2S =================
#define I2S_WS   25
#define I2S_SCK  26
#define I2S_SD   32

#define SAMPLE_RATE 16000
#define FRAMES 128   // Reduced for BLE MTU

// ================= BUFFERS =================
int32_t i2s_buffer[FRAMES * 2];
uint8_t ble_packet[FRAMES * 4];

// ================= BLE CALLBACKS =================
class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      Serial.println("✓ Client connected!");
    };

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println("✗ Client disconnected");
      delay(500);
      pServer->startAdvertising();
    }
};

// ================= SETUP =================
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\\n=== ESP32 Dual Mic BLE Audio ===");
  Serial.println("LEFT  = INMP441");
  Serial.println("RIGHT = SmartElex\\n");

  setupI2S();
  setupBLE();
}

// ================= LOOP =================
void loop() {
  if (!deviceConnected) {
    delay(500);
    return;
  }

  size_t bytes_read;
  i2s_read(I2S_NUM_0, i2s_buffer, sizeof(i2s_buffer),
           &bytes_read, portMAX_DELAY);

  int frames = bytes_read / 8;
  int64_t sumL = 0, sumR = 0;

  for (int i = 0; i < frames; i++) {
    int16_t L = (int16_t)(i2s_buffer[i * 2] >> 14);
    int16_t R = (int16_t)(i2s_buffer[i * 2 + 1] >> 14);

    sumL += (int32_t)L * L;
    sumR += (int32_t)R * R;

    // Pack: LEFT first, then RIGHT
    ble_packet[i * 2]               = L & 0xFF;
    ble_packet[i * 2 + 1]           = (L >> 8) & 0xFF;
    ble_packet[frames * 2 + i * 2]  = R & 0xFF;
    ble_packet[frames * 2 + i * 2 + 1] = (R >> 8) & 0xFF;
  }

  // Serial debug
  Serial.print("INMP441 RMS: ");
  Serial.print(sqrt((double)sumL / frames));
  Serial.print(" | SmartElex RMS: ");
  Serial.println(sqrt((double)sumR / frames));

  // Send via BLE
  pCharacteristic->setValue(ble_packet, frames * 4);
  pCharacteristic->notify();

  delay(50);
}

// ================= I2S SETUP =================
void setupI2S() {
  i2s_config_t cfg = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT,
    .channel_format = I2S_CHANNEL_FMT_RIGHT_LEFT,
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 8,
    .dma_buf_len = 64,
    .use_apll = false
  };

  i2s_pin_config_t pin = {
    .bck_io_num = I2S_SCK,
    .ws_io_num = I2S_WS,
    .data_out_num = I2S_PIN_NO_CHANGE,
    .data_in_num = I2S_SD
  };

  i2s_driver_install(I2S_NUM_0, &cfg, 0, NULL);
  i2s_set_pin(I2S_NUM_0, &pin);
  Serial.println("✓ I2S initialized (stereo)");
}

// ================= BLE SETUP =================
void setupBLE() {
  BLEDevice::init("ESP32 Dual Mic");
  
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService *pService = pServer->createService(SERVICE_UUID);

  pCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ |
    BLECharacteristic::PROPERTY_NOTIFY
  );

  pCharacteristic->addDescriptor(new BLE2902());
  pService->start();

  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();

  Serial.println("✓ BLE started - waiting for connection...");
  Serial.println("  Device name: ESP32 Dual Mic");
}`;

interface ESP32CodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ESP32CodeModal({ isOpen, onClose }: ESP32CodeModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(ESP32_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Code className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">ESP32 Bluetooth Code</h2>
              <p className="text-sm text-muted-foreground">Upload this to your ESP32-WROOM</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="audio-control" size="sm" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-meter-green" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Code
                </>
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Code */}
        <div className="flex-1 overflow-auto p-4">
          <pre className="font-mono text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap">
            {ESP32_CODE}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-secondary/30">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-primary text-sm font-bold">i</span>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Wiring Instructions:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>I2S_WS (Word Select) → GPIO 25</li>
                <li>I2S_SCK (Clock) → GPIO 26</li>
                <li>I2S_SD (Data) → GPIO 32</li>
                <li>Connect INMP441 to Left channel, SmartElex to Right channel</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
