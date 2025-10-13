#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

#define SS_PIN 53 // Slave Select pin
#define RST_PIN 5 // Reset pin
#define BUZZER 7 // Buzzer pin
#define LED_RED 8 // Red LED pin
#define LED_GREEN 9   // Green LED pin

MFRC522 rfid(SS_PIN, RST_PIN);
LiquidCrystal_I2C lcd(0x27, 16, 2);

String fallbackUserId = "68eabd3b33c308829b64efe4";  // Fallback in case read fails
const byte block1 = 4;
const byte block2 = 5;

void setup() {
  Serial.begin(9600);
  SPI.begin();
  rfid.PCD_Init();
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Gettz Fitness");
  lcd.setCursor(0, 1);
  lcd.print("Ready to Scan");
  pinMode(BUZZER, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
}

String readUserIdFromCard() {
  MFRC522::MIFARE_Key key;
  for (byte i = 0; i < 6; i++) key.keyByte[i] = 0xFF;

  byte buffer[18];
  byte size = sizeof(buffer);
  MFRC522::StatusCode status;
  String id = "";

  // --- Authenticate + Read Block 4 ---
  status = rfid.PCD_Authenticate(MFRC522::PICC_CMD_MF_AUTH_KEY_A, block1, &key, &(rfid.uid));
  if (status != MFRC522::STATUS_OK) return "";

  status = rfid.MIFARE_Read(block1, buffer, &size);
  if (status != MFRC522::STATUS_OK) return "";

  for (int i = 0; i < 16; i++) {
    if (buffer[i] >= 32 && buffer[i] <= 126) id += (char)buffer[i];
  }

  // --- Authenticate + Read Block 5 ---
  status = rfid.PCD_Authenticate(MFRC522::PICC_CMD_MF_AUTH_KEY_A, block2, &key, &(rfid.uid));
  if (status != MFRC522::STATUS_OK) return id; // Return partial if only block 4 works

  status = rfid.MIFARE_Read(block2, buffer, &size);
  if (status != MFRC522::STATUS_OK) return id;

  for (int i = 0; i < 16; i++) {
    if (buffer[i] >= 32 && buffer[i] <= 126) id += (char)buffer[i];
  }

  id.trim();
  return id;
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) return;

  // Build UID string
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    byte b = rfid.uid.uidByte[i];
    if (b < 16) uid += "0";
    uid += String(b, HEX);
  }
  uid.toUpperCase();

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Card UID:");
  lcd.setCursor(0, 1);
  lcd.print(uid);

  // Read stored userId from both blocks
  String userId = readUserIdFromCard();
  if (userId == "") userId = fallbackUserId;

  // ✅ Send full ID to backend
  String payload = "SEND " + uid + "|" + userId;
  Serial.println(payload); // e.g., SEND 1234ABCD|68EABD3B33C308829B64EFE4
  delay(300);

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();

  lcd.clear();
  lcd.print("Checking...");
  delay(200);

  // Wait for backend response
  unsigned long start = millis();
  while (millis() - start < 5000) {
    if (Serial.available()) {
      String res = Serial.readStringUntil('\n');
      res.trim();

      lcd.clear();
      if (res == "ACTIVE") {
        lcd.print("Access Granted");
        digitalWrite(LED_GREEN, HIGH);
        tone(BUZZER, 1000, 200);
        delay(800);
        digitalWrite(LED_GREEN, LOW);
      } else if (res == "INACTIVE") {
        lcd.print("Inactive Member");
        digitalWrite(LED_RED, HIGH);
        tone(BUZZER, 600, 300);
        delay(600);
        digitalWrite(LED_RED, LOW);
      } else if (res == "EXPIRED") {
        lcd.print("Subscription End");
        digitalWrite(LED_RED, HIGH);
        tone(BUZZER, 500, 600);
        delay(600);
        digitalWrite(LED_RED, LOW);
      } else if (res == "ALREADY") {
        lcd.print("Already Checked");
        tone(BUZZER, 400, 300);
        delay(500);
      } else if (res == "UNKNOWN") {
        lcd.print("Unknown Member");
        digitalWrite(LED_RED, HIGH);
        tone(BUZZER, 400, 600);
        delay(600);
        digitalWrite(LED_RED, LOW);
      }
      lcd.setCursor(0, 1);
      lcd.print("Tap next card...");
      break;
    }
  }

  delay(500);
}
