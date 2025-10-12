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

String storedUserId = "68eabd3b33c308829b64efe4"; // MongoDB user_id you wrote on card earlier
String lastMessage = "";

void setup() {
  Serial.begin(9600);
  SPI.begin();
  rfid.PCD_Init();

  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Gettz Fitness");
  lcd.setCursor(0, 1);
  lcd.print("Tap your card...");

  pinMode(BUZZER, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
}

void loop() {
  // 1️⃣ Scan new card
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    String uid = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
      uid += String(rfid.uid.uidByte[i], HEX);
    }
    uid.toUpperCase();

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Sending UID...");
    delay(1000);

    // 👉 Send formatted data to backend
    Serial.print("SEND ");
    Serial.print(uid);
    Serial.print("|");
    Serial.println(storedUserId);

    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
  }

  // 2️⃣ Wait for backend response
  if (Serial.available()) {
    String msg = Serial.readStringUntil('\n');
    msg.trim();

    if (msg.length() > 0 && msg != lastMessage) {
      lastMessage = msg;
      lcd.clear();

      if (msg.startsWith("ACTIVE")) {
        lcd.print("You can attend");
        digitalWrite(LED_GREEN, HIGH);
        tone(BUZZER, 1000, 300);
        delay(1000);
        digitalWrite(LED_GREEN, LOW);
      } 
      else if (msg.startsWith("INACTIVE")) {
        lcd.print("Access Denied");
        digitalWrite(LED_RED, HIGH);
        tone(BUZZER, 400, 600);
        delay(800);
        digitalWrite(LED_RED, LOW);
      }
      else if (msg.startsWith("EXPIRED")) {
        lcd.print("Membership Exp.");
        digitalWrite(LED_RED, HIGH);
        tone(BUZZER, 500, 600);
        delay(800);
        digitalWrite(LED_RED, LOW);
      } 
      else if (msg.startsWith("UNKNOWN")) {
        lcd.print("No Record Found");
        digitalWrite(LED_RED, HIGH);
        tone(BUZZER, 400, 800);
        delay(800);
        digitalWrite(LED_RED, LOW);
      }

      delay(1500);
      lcd.clear();
      lcd.print("Tap your card...");
    }
  }
}
