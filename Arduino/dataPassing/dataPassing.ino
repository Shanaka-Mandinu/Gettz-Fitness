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

String storedUserId = "68eabd3b33c308829b64efe4"; // MongoDB User ID
String lastMsg = "";

void setup() {
  Serial.begin(9600);
  SPI.begin();
  rfid.PCD_Init();
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0,0);
  lcd.print("Gettz Fitness");
  lcd.setCursor(0,1);
  lcd.print("Tap card...");
}

void loop() {
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    String uid = "";
    for (byte i = 0; i < rfid.uid.size; i++) uid += String(rfid.uid.uidByte[i], HEX);
    uid.toUpperCase();

    Serial.print("SEND ");
    Serial.print(uid);
    Serial.print("|");
    Serial.println(storedUserId);

    lcd.clear();
    lcd.print("Checking...");
    delay(1000);

    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
  }

  if (Serial.available()) {
    String msg = Serial.readStringUntil('\n');
    msg.trim();
    if (msg == lastMsg) return;
    lastMsg = msg;

    lcd.clear();
    if (msg == "ACTIVE") {
      lcd.print("You can attend");
      tone(BUZZER, 1000, 300);
      digitalWrite(LED_GREEN, HIGH);
      delay(800);
      digitalWrite(LED_GREEN, LOW);
    } else if (msg == "EXPIRED") {
      lcd.print("Membership Exp.");
      tone(BUZZER, 500, 600);
      digitalWrite(LED_RED, HIGH);
      delay(800);
      digitalWrite(LED_RED, LOW);
    } else {
      lcd.print("Access Denied");
      tone(BUZZER, 400, 600);
      digitalWrite(LED_RED, HIGH);
      delay(800);
      digitalWrite(LED_RED, LOW);
    }

    lcd.setCursor(0, 1);
    lcd.print("Tap next card...");
  }
}
