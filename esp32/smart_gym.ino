/*
 * SMART GYM PERFORMANCE MONITORING SYSTEM
 * ESP32 Client Firmware
 *
 * This code connects an ESP32 micro-controller to the Smart Gym server
 * via WebSockets. It uses an Ultrasonic Distance Sensor (HC-SR04) to
 * detect barbell repetitions, a button to start/stop the workout,
 * and a potentiometer to adjust target weight in real time.
 *
 * Dependencies (Install via Arduino Library Manager):
 * - WebSockets by Markus Sattler
 * - ArduinoJson by Benoit Blanchon
 */

#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// Wi-Fi Credentials
const char* ssid     = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Telemetry Server Configuration
const char* ws_host  = "192.168.1.100";  // Replace with your server's IP address
const int ws_port    = 3000;             // Port defined in server.js

// Pin Configurations
#define PIN_BUTTON       4    // Button to start/stop session
#define PIN_POT          34   // Potentiometer simulating weight load (ADC1)
#define PIN_TRIG         12   // Ultrasonic sensor Trigger Pin
#define PIN_ECHO         13   // Ultrasonic sensor Echo Pin

WebSocketsClient webSocket;
bool session_active = false;
int last_weight = 0;
unsigned long last_debounce_time = 0;
const unsigned long debounce_delay = 50;
bool button_last_state = HIGH;

// Repetition detection states
enum RepState { STATE_TOP, STATE_BOTTOM };
RepState rep_state = STATE_TOP;
const float DIST_THRESHOLD_BOTTOM = 15.0; // Barbell close (chest) in cm
const float DIST_THRESHOLD_TOP = 40.0;    // Barbell pushed up (lockout) in cm

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("[WS] Disconnected from server.");
      session_active = false;
      break;
      
    case WStype_CONNECTED:
      Serial.println("[WS] Connected successfully!");
      // Send handshake
      webSocket.sendTXT("{\"type\":\"device_connect\"}");
      break;
      
    case WStype_TEXT:
      Serial.printf("[WS] Received telemetry: %s\n", payload);
      // Parse incoming server session states if needed
      break;
      
    case WStype_BIN:
      break;
  }
}

// Read Distance from HC-SR04 sensor in cm
float readDistance() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  
  long duration = pulseIn(PIN_ECHO, HIGH, 30000); // 30ms timeout
  if (duration == 0) return 999.0;
  
  return (duration * 0.0343) / 2.0;
}

void setup() {
  Serial.begin(115200);

  // Setup pins
  pinMode(PIN_BUTTON, INPUT_PULLUP);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);

  // Connect to Wi-Fi
  Serial.printf("Connecting to Wi-Fi: %s ", ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWi-Fi connected.");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  // Initialize WebSockets
  webSocket.begin(ws_host, ws_port, "/");
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
}

void loop() {
  webSocket.loop();

  // Read Potentiometer to update weight
  int pot_val = analogRead(PIN_POT);
  // Map ADC (0 - 4095) to weight range (10kg - 120kg) in 2.5kg intervals
  int current_weight = 10 + (int)((pot_val / 4095.0) * 110.0 / 2.5) * 2.5;
  
  // Update weight if changed by more than 2.5kg
  if (abs(current_weight - last_weight) >= 2.5) {
    last_weight = current_weight;
    if (WiFi.status() == WL_CONNECTED) {
      char buffer[128];
      snprintf(buffer, sizeof(buffer), "{\"type\":\"weight_update\",\"weight\":%d}", last_weight);
      webSocket.sendTXT(buffer);
      Serial.printf("Weight updated: %d kg\n", last_weight);
    }
  }

  // Read Start/Stop Session Button with software debouncing
  bool button_read = digitalRead(PIN_BUTTON);
  if (button_read != button_last_state) {
    last_debounce_time = millis();
  }

  if ((millis() - last_debounce_time) > debounce_delay) {
    if (button_read == LOW && !session_active) {
      // Start session command
      session_active = true;
      char buffer[256];
      snprintf(buffer, sizeof(buffer), "{\"type\":\"start_session\",\"exercise\":\"Bench Press\",\"weight\":%d}", last_weight);
      webSocket.sendTXT(buffer);
      Serial.println("Workout session started.");
      delay(500); // Simple hold prevention
    } 
    else if (button_read == LOW && session_active) {
      // Stop session command
      session_active = false;
      webSocket.sendTXT("{\"type\":\"stop_session\"}");
      Serial.println("Workout session stopped.");
      delay(500); // Simple hold prevention
    }
  }
  button_last_state = button_read;

  // Track repetitions using Ultrasonic sensor (only when session is active)
  if (session_active) {
    float distance = readDistance();
    
    // Finite state machine for barbell stroke detection
    if (rep_state == STATE_TOP && distance <= DIST_THRESHOLD_BOTTOM) {
      // Barbell lowered to bottom (chest)
      rep_state = STATE_BOTTOM;
      Serial.println("Rep state: BOTTOM (eccentric phase complete)");
    } 
    else if (rep_state == STATE_BOTTOM && distance >= DIST_THRESHOLD_TOP) {
      // Barbell pushed back up to top (concentric lock) -> Rep Complete!
      rep_state = STATE_TOP;
      webSocket.sendTXT("{\"type\":\"rep_trigger\"}");
      Serial.println("Rep state: TOP - Repetition registered! (concentric complete)");
      delay(300); // Refractory period to avoid double counting
    }
  }

  delay(50); // Small poll interval
}
