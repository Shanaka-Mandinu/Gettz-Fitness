#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

#define SS_PIN 53
#define RST_PIN 5
#define BUZZER 7
#define LED_RED 8
#define LED_GREEN 9

MFRC522 rfid(SS_PIN, RST_PIN);
MFRC522::MIFARE_Key key;
LiquidCrystal_I2C lcd(0x27, 16, 2);

bool writeMode = false;              // switch between write & read
String newUserId = "";               // user ID to be written
const byte block1 = 4;               // store first 16 chars
const byte block2 = 5;               // store next 8 chars

void setup() {
  Serial.begin(9600);
  SPI.begin();
  rfid.PCD_Init();

  for (byte i = 0; i < 6; i++) key.keyByte[i] = 0xFF;

  pinMode(BUZZER, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);

  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Gettz Fitness");
  lcd.setCursor(0, 1);
  lcd.print("RFID System Ready");
  delay(1500);
  lcd.clear();
  lcd.print("Tap Card to Scan");

  Serial.println("======================================");
  Serial.println("  Gettz Fitness RFID System");
  Serial.println("  Type 'WRITE <user_id>' to register");
  Serial.println("  Or just tap a card to read");
  Serial.println("======================================");
  Serial.println();
}

// ---------------------------- Write two blocks ----------------------------
bool writeUserId(String id) {
  byte buffer1[16];
  byte buffer2[16];
  memset(buffer1, 0, 16);
  memset(buffer2, 0, 16);

  for (int i = 0; i < 16 && i < id.length(); i++)
    buffer1[i] = id[i];
  for (int i = 16; i < id.length() && i - 16 < 16; i++)
    buffer2[i - 16] = id[i];

  // Authenticate and write block 4
  MFRC522::StatusCode status = rfid.PCD_Authenticate(
      MFRC522::PICC_CMD_MF_AUTH_KEY_A, block1, &key, &(rfid.uid));
  if (status != MFRC522::STATUS_OK) return false;
  status = rfid.MIFARE_Write(block1, buffer1, 16);
  if (status != MFRC522::STATUS_OK) return false;

  // Authenticate and write block 5
  status = rfid.PCD_Authenticate(
      MFRC522::PICC_CMD_MF_AUTH_KEY_A, block2, &key, &(rfid.uid));
  if (status != MFRC522::STATUS_OK) return false;
  status = rfid.MIFARE_Write(block2, buffer2, 16);
  if (status != MFRC522::STATUS_OK) return false;

  return true;
}

// ---------------------------- Read stored User ID ----------------------------
String readUserId() {
  byte buffer[18];
  byte size = sizeof(buffer);
  String part1 = "", part2 = "";

  MFRC522::StatusCode status;
  // Read block 4
  status = rfid.PCD_Authenticate(MFRC522::PICC_CMD_MF_AUTH_KEY_A, block1, &key, &(rfid.uid));
  if (status != MFRC522::STATUS_OK) return "";
  status = rfid.MIFARE_Read(block1, buffer, &size);
  if (status != MFRC522::STATUS_OK) return "";
  for (byte i = 0; i < 16; i++)
    if (buffer[i] >= 32 && buffer[i] <= 126) part1 += (char)buffer[i];

  // Read block 5
  status = rfid.PCD_Authenticate(MFRC522::PICC_CMD_MF_AUTH_KEY_A, block2, &key, &(rfid.uid));
  if (status != MFRC522::STATUS_OK) return "";
  status = rfid.MIFARE_Read(block2, buffer, &size);
  if (status != MFRC522::STATUS_OK) return "";
  for (byte i = 0; i < 16; i++)
    if (buffer[i] >= 32 && buffer[i] <= 126) part2 += (char)buffer[i];

  String userId = part1 + part2;
  userId.trim();
  return userId;
}

// ---------------------------- Main Loop ----------------------------
void loop() {
  // 🔸 Listen for serial command
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd.startsWith("WRITE ")) {
      newUserId = cmd.substring(6);
      writeMode = true;
      Serial.println("Write mode ON. Tap card to save user ID.");
      lcd.clear();
      lcd.print("Write Mode Active");
      lcd.setCursor(0, 1);
      lcd.print("Tap Card Now");
    }
  }

  // 🔸 Wait for RFID card
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) return;

  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();

  if (writeMode) {
    // ---------------- WRITE MODE ----------------
    if (writeUserId(newUserId)) {
      Serial.println("✅ User ID stored successfully!");
      Serial.print("Card UID: "); Serial.println(uid);
      Serial.print("User ID: "); Serial.println(newUserId);

      lcd.clear();
      lcd.print("ID Stored:");
      lcd.setCursor(0, 1);
      lcd.print(newUserId.substring(0, 12));
      tone(BUZZER, 1000, 300);
      digitalWrite(LED_GREEN, HIGH);
      delay(1000);
      digitalWrite(LED_GREEN, LOW);
    } else {
      Serial.println("❌ Write failed!");
      lcd.clear();
      lcd.print("Write Failed!");
      tone(BUZZER, 400, 600);
      digitalWrite(LED_RED, HIGH);
      delay(800);
      digitalWrite(LED_RED, LOW);
    }

    writeMode = false;
    newUserId = "";
    lcd.clear();
    lcd.print("Tap Card to Scan");
  } else {
    // ---------------- READ MODE ----------------
    String userId = readUserId();
    Serial.print("Card UID: "); Serial.println(uid);
    Serial.print("User ID: "); Serial.println(userId);

    if (userId.length() > 0) {
      Serial.print("SEND "); Serial.print(uid); Serial.print("|"); Serial.println(userId);
      lcd.clear();
      lcd.print("You can attend");
      lcd.setCursor(0, 1);
      lcd.print(userId.substring(0, 12));
      tone(BUZZER, 1000, 300);
      digitalWrite(LED_GREEN, HIGH);
      delay(1000);
      digitalWrite(LED_GREEN, LOW);
      lcd.clear();
      lcd.print("Tap Card to Scan");
    } else {
      lcd.clear();
      lcd.print("No User ID!");
      tone(BUZZER, 400, 600);
      digitalWrite(LED_RED, HIGH);
      delay(800);
      digitalWrite(LED_RED, LOW);
      lcd.clear();
      lcd.print("Tap Card to Scan");
    }
  }

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}
