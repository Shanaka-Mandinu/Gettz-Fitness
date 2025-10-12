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
LiquidCrystal_I2C lcd(0x27, 16, 2);


String lastBackendMsg = "";
unsigned long lastWelcome = 0;
const unsigned long WELCOME_INTERVAL = 200000; // 200 seconds

// --- Helper: read 16 bytes from block (returns true on success) ---
bool readBlockData(byte blockAddr, byte *buf) {
  MFRC522::MIFARE_Key key;
  for (byte i = 0; i < 6; i++) key.keyByte[i] = 0xFF; // default key A

  // Authenticate
  MFRC522::StatusCode status = rfid.PCD_Authenticate(MFRC522::PICC_CMD_MF_AUTH_KEY_A, blockAddr, &key, &(rfid.uid));
  if (status != MFRC522::STATUS_OK) {
    return false;
  }

  status = rfid.MIFARE_Read(blockAddr, buf, 16);
  // Stop crypto on success or fail
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();

  return (status == MFRC522::STATUS_OK);
}

// --- Optional helper: write ASCII userId into a block (16 bytes)
//    Use this to program a card. Be careful: don't overwrite sector trailer blocks.
bool writeBlockData(byte blockAddr, const byte *buf) {
  MFRC522::MIFARE_Key key;
  for (byte i = 0; i < 6; i++) key.keyByte[i] = 0xFF; // default key A

  MFRC522::StatusCode status = rfid.PCD_Authenticate(MFRC522::PICC_CMD_MF_AUTH_KEY_A, blockAddr, &key, &(rfid.uid));
  if (status != MFRC522::STATUS_OK) {
    return false;
  }

  status = rfid.MIFARE_Write(blockAddr, (byte *)buf, 16);
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
  return (status == MFRC522::STATUS_OK);
}

void setup() {
  Serial.begin(9600);
  while (!Serial) { /* wait for serial */ }

  SPI.begin();
  rfid.PCD_Init();

  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0,0);
  lcd.print("Gettz Fitness");
  lcd.setCursor(0,1);
  lcd.print("Tap card...");

  pinMode(BUZZER, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);

  lastWelcome = millis();
}

// Call this to flash a friendly welcome periodically
void showWelcomeIfNeeded() {
  unsigned long now = millis();
  if (now - lastWelcome >= WELCOME_INTERVAL) {
    lcd.clear();
    lcd.setCursor(0,0);
    lcd.print("Welcome");
    lcd.setCursor(0,1);
    lcd.print("Gettz Fitness");
    lastWelcome = now;
    delay(1500);
    lcd.clear();
    lcd.print("Tap card...");
  }
}

void loop() {
  showWelcomeIfNeeded();

  // 1) detect new card
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    // Read UID (hex uppercase, no spaces)
    String uid = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
      byte b = rfid.uid.uidByte[i];
      if (b < 16) uid += "0";
      uid += String(b, HEX);
    }
    uid.toUpperCase();

    lcd.clear();
    lcd.setCursor(0,0);
    lcd.print("Card UID:");
    lcd.setCursor(0,1);
    lcd.print(uid);

    // Try read user_id stored on block 4 (avoid sector trailer)
    byte buffer[18];
    memset(buffer, 0, sizeof(buffer));
    String cardUserId = "";
    if (readBlockData(4, buffer)) {
      // Convert bytes to ASCII string until null or length 16
      for (int i = 0; i < 16; i++) {
        byte c = buffer[i];
        if (c == 0x00) break;
        // Only accept printable ASCII; ignore others
        if (c >= 32 && c <= 126) cardUserId += (char)c;
      }
      cardUserId.trim();
    }

    String userIdToSend;
    if (cardUserId.length() >= 8) {
      userIdToSend = cardUserId; // use card stored value
    }

    // Send to backend in required format
    // Example: SEND 535FD82F|68eabd3b33c308829b64efe4
    String payload = "SEND " + uid + "|" + userIdToSend;
    Serial.println(payload); // newline terminated for backend parser

    // prompt waiting message
    lcd.clear();
    lcd.setCursor(0,0);
    lcd.print("Checking server...");
    lcd.setCursor(0,1);
    lcd.print("Please wait...");

    // small pause so backend can process
    delay(300);

    // stop crypto and halt (already done by readBlockData but safe)
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
  } // end if new card present

  // 2) handle backend reply (string terminated by '\n')
  if (Serial.available()) {
    String reply = Serial.readStringUntil('\n');
    reply.trim();

    if (reply.length() > 0 && reply != lastBackendMsg) {
      lastBackendMsg = reply;
      lcd.clear();

      if (reply.startsWith("ACTIVE")) {
        lcd.setCursor(0,0);
        lcd.print("You can attend");
        lcd.setCursor(0,1);
        lcd.print("Welcome!");
        digitalWrite(LED_GREEN, HIGH);
        tone(BUZZER, 1000, 300);
        delay(700);
        digitalWrite(LED_GREEN, LOW);
      } else if (reply.startsWith("EXPIRED")) {
        lcd.setCursor(0,0);
        lcd.print("Membership Exp.");
        lcd.setCursor(0,1);
        lcd.print("Renew pls");
        digitalWrite(LED_RED, HIGH);
        tone(BUZZER, 600, 600);
        delay(800);
        digitalWrite(LED_RED, LOW);
      } else if (reply.startsWith("UNKNOWN")) {
        lcd.setCursor(0,0);
        lcd.print("No record found");
        lcd.setCursor(0,1);
        lcd.print("Register card");
        digitalWrite(LED_RED, HIGH);
        tone(BUZZER, 400, 700);
        delay(800);
        digitalWrite(LED_RED, LOW);
      } else {
        // default fallback
        lcd.setCursor(0,0);
        lcd.print(reply.substring(0,16)); // show start of message
        if (reply.length() > 16) {
          lcd.setCursor(0,1);
          lcd.print(reply.substring(16, 32));
        }
      }
      delay(1200);
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("Tap card...");
    }
  }

  delay(100);
}
